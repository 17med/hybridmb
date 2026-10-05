import { Channel, ID, Permission, Query, Role } from 'appwrite';
import type { RealtimeSubscription } from 'appwrite';
import { appwriteConfig, realtime, tablesDB } from './client';

export interface Message {
  id: string;
  body: string;
  userId: string;
  userName: string;
  createdAt: string; // ISO 8601, UTC, set by Appwrite
}

export interface Author {
  id: string;
  name: string;
}

export const MAX_MESSAGE_LENGTH = 2000;
const RECENT_LIMIT = 50;

const { databaseId, messagesTableId: tableId } = appwriteConfig;

/** Parses an Appwrite row into a Message; returns null for malformed rows. */
function parseMessage(row: unknown): Message | null {
  if (typeof row !== 'object' || row === null) return null;
  const r = row as Record<string, unknown>;
  const isValid =
    typeof r.$id === 'string' &&
    typeof r.body === 'string' &&
    typeof r.userId === 'string' &&
    typeof r.userName === 'string' &&
    typeof r.$createdAt === 'string';
  if (!isValid) return null;
  return {
    id: r.$id as string,
    body: r.body as string,
    userId: r.userId as string,
    userName: r.userName as string,
    createdAt: r.$createdAt as string,
  };
}

/** Most recent messages, oldest first, ready to render top to bottom. */
export async function listRecentMessages(): Promise<Message[]> {
  const result = await tablesDB.listRows({
    databaseId,
    tableId,
    queries: [Query.orderDesc('$createdAt'), Query.limit(RECENT_LIMIT)],
  });
  return result.rows
    .map(parseMessage)
    .filter((m): m is Message => m !== null)
    .reverse();
}

export async function sendMessage(author: Author, body: string): Promise<Message> {
  const row = await tablesDB.createRow({
    databaseId,
    tableId,
    rowId: ID.unique(),
    data: { body, userId: author.id, userName: author.name },
    permissions: [
      Permission.read(Role.users()),
      Permission.update(Role.user(author.id)),
      Permission.delete(Role.user(author.id)),
    ],
  });
  const message = parseMessage(row);
  if (!message) throw new Error('Appwrite returned a message row without the expected columns.');
  return message;
}

/** Calls onMessage for every message created by anyone, including self. */
export async function subscribeToNewMessages(
  onMessage: (message: Message) => void,
): Promise<RealtimeSubscription> {
  const channel = Channel.tablesdb(databaseId).table(tableId).row();
  return realtime.subscribe(channel, (event) => {
    const isCreate = event.events.some((name) => name.endsWith('.create'));
    if (!isCreate) return;
    const message = parseMessage(event.payload);
    if (message) onMessage(message);
  });
}
