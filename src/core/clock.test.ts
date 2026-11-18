import { describe, expect, it } from 'vitest';
import { GameClock } from './clock';

describe('game clock', () => {
  it('counts nothing until started, and nothing on the first frame', () => {
    const clock = new GameClock();
    expect(clock.frame(1000)).toBe(0);
    clock.start();
    expect(clock.frame(1000)).toBe(0);
    expect(clock.frame(1016)).toBe(16);
  });

  it('stands still while paused, and does not count the paused time after resuming', () => {
    const clock = new GameClock();
    clock.start();
    clock.frame(0);
    clock.frame(16);
    clock.pause();
    expect(clock.isRunning).toBe(false);
    expect(clock.frame(5000)).toBe(0);
    clock.start();
    expect(clock.frame(60000)).toBe(0);
    expect(clock.frame(60016)).toBe(16);
  });

  it('never lets one frame jump ahead, or run backwards', () => {
    const clock = new GameClock(100);
    clock.start();
    clock.frame(0);
    expect(clock.frame(10000)).toBe(100);
    expect(clock.frame(9000)).toBe(0);
    expect(clock.frame(Number.NaN)).toBe(0);
  });
});
