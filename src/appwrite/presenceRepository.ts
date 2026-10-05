import { Channel, Permission, Query, Role } from 'appwrite';
import type { RealtimeSubscription } from 'appwrite';
import { appwriteConfig, realtime, tablesDB } from './client';
import type { Author } from './messagesRepository';
import { TYPING_WINDOW_MS, type Presence } from '../chat/presenceRules';

const { databaseId, presenceTableId: tableId } = appwriteConfig;
// One row per user; a single global room never has more than this many people in a course setting.
const PRESENCE_LIST_LIMIT = 100;

function parsePresence(row: unknown): Presence | null {
  if (typeof row !== 'object' || row === null) return null;
  const r = row as Record<string, unknown>;
  const isValid =
    typeof r.$id === 'string' &&
    typeof r.userName === 'string' &&
    typeof r.lastSeen === 'string' &&
    (r.typingUntil === null || r.typingUntil === undefined || typeof r.typingUntil === 'string');
  if (!isValid) return null;
  return {
    userId: r.$id as string,
    userName: r.userName as string,
    lastSeen: r.lastSeen as string,
    typingUntil: (r.typingUntil as string | null | undefined) ?? null,
  };
}

/** Creates or refreshes the current user's presence row (rowId = userId). */
async function upsertPresence(author: Author, typingUntil: string | null): Promise<void> {
  await tablesDB.upsertRow({
    databaseId,
    tableId,
    rowId: author.id,
    data: { userName: author.name, lastSeen: new Date().toISOString(), typingUntil },
    permissions: [Permission.read(Role.users()), Permission.update(Role.user(author.id))],
  });
}

export function sendHeartbeat(author: Author): Promise<void> {
  return upsertPresence(author, null);
}

export function markTyping(author: Author): Promise<void> {
  return upsertPresence(author, new Date(Date.now() + TYPING_WINDOW_MS).toISOString());
}

export async function listPresence(): Promise<Presence[]> {
  const result = await tablesDB.listRows({
    databaseId,
    tableId,
    queries: [Query.limit(PRESENCE_LIST_LIMIT)],
  });
  return result.rows.map(parsePresence).filter((p): p is Presence => p !== null);
}

/** Calls onChange whenever any user's presence row is created or updated. */
export async function subscribeToPresence(
  onChange: (presence: Presence) => void,
): Promise<RealtimeSubscription> {
  const channel = Channel.tablesdb(databaseId).table(tableId).row();
  return realtime.subscribe(channel, (event) => {
    const presence = parsePresence(event.payload);
    if (presence) onChange(presence);
  });
}
