/** Pure presence rules: no I/O, so they are unit-tested without Appwrite. */

export interface Presence {
  userId: string;
  userName: string;
  lastSeen: string; // ISO 8601, UTC
  typingUntil: string | null; // ISO 8601, UTC
}

export const HEARTBEAT_INTERVAL_MS = 20_000;
// Two missed heartbeats plus slack before a user is shown offline.
export const ONLINE_WINDOW_MS = 45_000;
export const TYPING_WINDOW_MS = 3_000;

export function isOnline(presence: Presence, now: Date): boolean {
  const lastSeen = Date.parse(presence.lastSeen);
  return now.getTime() - lastSeen < ONLINE_WINDOW_MS;
}

export function isTyping(presence: Presence, now: Date): boolean {
  if (!presence.typingUntil) return false;
  return Date.parse(presence.typingUntil) > now.getTime();
}

export function onlineUsers(all: Presence[], now: Date): Presence[] {
  return all.filter((p) => isOnline(p, now));
}

/** Names of other users currently typing; the current user is excluded. */
export function typingUserNames(all: Presence[], selfId: string, now: Date): string[] {
  return all
    .filter((p) => p.userId !== selfId && isOnline(p, now) && isTyping(p, now))
    .map((p) => p.userName);
}

export function describeTyping(names: string[]): string {
  if (names.length === 0) return '';
  if (names.length === 1) return `${names[0]} is typing…`;
  if (names.length === 2) return `${names[0]} and ${names[1]} are typing…`;
  return 'Several people are typing…';
}
