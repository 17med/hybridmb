import { describe, expect, it } from 'vitest';
import {
  describeTyping,
  isOnline,
  isTyping,
  onlineUsers,
  ONLINE_WINDOW_MS,
  Presence,
  typingUserNames,
} from './presenceRules';

const now = new Date('2026-10-05T12:00:00.000Z');
const secondsAgo = (s: number) => new Date(now.getTime() - s * 1000).toISOString();
const secondsAhead = (s: number) => new Date(now.getTime() + s * 1000).toISOString();

function presence(overrides: Partial<Presence>): Presence {
  return { userId: 'u1', userName: 'Amal', lastSeen: secondsAgo(1), typingUntil: null, ...overrides };
}

describe('isOnline', () => {
  it('is true for a recent heartbeat', () => {
    expect(isOnline(presence({ lastSeen: secondsAgo(10) }), now)).toBe(true);
  });

  it('is false once the online window has passed', () => {
    expect(isOnline(presence({ lastSeen: secondsAgo(ONLINE_WINDOW_MS / 1000) }), now)).toBe(false);
  });
});

describe('isTyping', () => {
  it('is false when typingUntil is null', () => {
    expect(isTyping(presence({}), now)).toBe(false);
  });

  it('is true until typingUntil, false after', () => {
    expect(isTyping(presence({ typingUntil: secondsAhead(2) }), now)).toBe(true);
    expect(isTyping(presence({ typingUntil: secondsAgo(1) }), now)).toBe(false);
  });
});

describe('onlineUsers', () => {
  it('keeps only online users', () => {
    const all = [presence({ userId: 'a' }), presence({ userId: 'b', lastSeen: secondsAgo(120) })];
    expect(onlineUsers(all, now).map((p) => p.userId)).toEqual(['a']);
  });
});

describe('typingUserNames', () => {
  it('excludes self and offline users', () => {
    const all = [
      presence({ userId: 'self', userName: 'Me', typingUntil: secondsAhead(2) }),
      presence({ userId: 'b', userName: 'Badr', typingUntil: secondsAhead(2) }),
      presence({ userId: 'c', userName: 'Ghost', lastSeen: secondsAgo(120), typingUntil: secondsAhead(2) }),
    ];
    expect(typingUserNames(all, 'self', now)).toEqual(['Badr']);
  });
});

describe('describeTyping', () => {
  it('formats zero, one, two and many names', () => {
    expect(describeTyping([])).toBe('');
    expect(describeTyping(['A'])).toBe('A is typing…');
    expect(describeTyping(['A', 'B'])).toBe('A and B are typing…');
    expect(describeTyping(['A', 'B', 'C'])).toBe('Several people are typing…');
  });
});
