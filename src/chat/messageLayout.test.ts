import { describe, expect, it } from 'vitest';
import type { Message } from '../appwrite/messagesRepository';
import { avatarHue, buildTimeline, dayLabel, initialsOf } from './messageLayout';

// Local-time constructors keep day boundaries independent of the machine's time zone.
const now = new Date(2026, 9, 5, 15, 0);
const at = (day: number, hour: number, minute: number) => new Date(2026, 9, day, hour, minute).toISOString();

function message(id: string, userId: string, createdAt: string): Message {
  return { id, userId, userName: userId, body: 'hi', createdAt };
}

describe('dayLabel', () => {
  it('says Today and Yesterday, otherwise a date', () => {
    expect(dayLabel(new Date(2026, 9, 5, 1, 0), now)).toBe('Today');
    expect(dayLabel(new Date(2026, 9, 4, 23, 0), now)).toBe('Yesterday');
    expect(dayLabel(new Date(2026, 9, 1, 12, 0), now)).not.toMatch(/Today|Yesterday/);
  });
});

describe('buildTimeline', () => {
  it('returns nothing for no messages', () => {
    expect(buildTimeline([], now)).toEqual([]);
  });

  it('groups consecutive messages from the same user within the window', () => {
    const items = buildTimeline(
      [message('1', 'a', at(5, 10, 0)), message('2', 'a', at(5, 10, 2)), message('3', 'b', at(5, 10, 3))],
      now,
    );
    const rows = items.filter((i) => i.kind === 'message');
    expect(rows.map((r) => [r.isFirstInGroup, r.isLastInGroup])).toEqual([
      [true, false],
      [false, true],
      [true, true],
    ]);
  });

  it('starts a new group after the window, even for the same user', () => {
    const items = buildTimeline([message('1', 'a', at(5, 10, 0)), message('2', 'a', at(5, 10, 30))], now);
    const rows = items.filter((i) => i.kind === 'message');
    expect(rows.every((r) => r.isFirstInGroup && r.isLastInGroup)).toBe(true);
  });

  it('inserts one separator per day, before that day\'s first message', () => {
    const items = buildTimeline(
      [message('1', 'a', at(4, 22, 0)), message('2', 'a', at(5, 9, 0)), message('3', 'a', at(5, 9, 1))],
      now,
    );
    expect(items.map((i) => (i.kind === 'day' ? i.label : i.key))).toEqual(['Yesterday', '1', 'Today', '2', '3']);
  });
});

describe('initialsOf', () => {
  it('uses up to two words and falls back to ?', () => {
    expect(initialsOf('amal ben ali')).toBe('AB');
    expect(initialsOf('Badr')).toBe('B');
    expect(initialsOf('   ')).toBe('?');
  });
});

describe('avatarHue', () => {
  it('is stable per user and within 0–359', () => {
    expect(avatarHue('user-1')).toBe(avatarHue('user-1'));
    expect(avatarHue('user-1')).toBeGreaterThanOrEqual(0);
    expect(avatarHue('user-1')).toBeLessThan(360);
  });
});
