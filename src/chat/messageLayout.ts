/** Pure layout rules for the message list: grouping, day separators, avatars. No I/O. */
import type { Message } from '../appwrite/messagesRepository';

// Consecutive messages from one person closer than this share one avatar/name header.
export const GROUP_WINDOW_MS = 5 * 60_000;

export type TimelineItem =
  | { kind: 'day'; key: string; label: string }
  | { kind: 'message'; key: string; message: Message; isFirstInGroup: boolean; isLastInGroup: boolean };

/** Calendar day in the viewer's local time zone, e.g. "2026-10-05". */
function localDayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

export function dayLabel(date: Date, now: Date): string {
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (localDayKey(date) === localDayKey(now)) return 'Today';
  if (localDayKey(date) === localDayKey(yesterday)) return 'Yesterday';
  return date.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
}

function isSameGroup(previous: Message | undefined, current: Message): boolean {
  if (!previous || previous.userId !== current.userId) return false;
  const previousAt = new Date(previous.createdAt);
  const currentAt = new Date(current.createdAt);
  return (
    localDayKey(previousAt) === localDayKey(currentAt) &&
    currentAt.getTime() - previousAt.getTime() < GROUP_WINDOW_MS
  );
}

/** Messages (oldest first) → rows to render, with day separators and group boundaries. */
export function buildTimeline(messages: Message[], now: Date): TimelineItem[] {
  const items: TimelineItem[] = [];
  messages.forEach((message, index) => {
    const previous = messages[index - 1];
    const next = messages[index + 1];
    const day = localDayKey(new Date(message.createdAt));
    if (!previous || localDayKey(new Date(previous.createdAt)) !== day) {
      items.push({ kind: 'day', key: `day-${day}`, label: dayLabel(new Date(message.createdAt), now) });
    }
    items.push({
      kind: 'message',
      key: message.id,
      message,
      isFirstInGroup: !isSameGroup(previous, message),
      isLastInGroup: !next || !isSameGroup(message, next),
    });
  });
  return items;
}

export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  return words
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');
}

/** Stable hue (0–359) per user, so each person keeps the same avatar color. */
export function avatarHue(userId: string): number {
  let hash = 0;
  for (const char of userId) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return hash % 360;
}
