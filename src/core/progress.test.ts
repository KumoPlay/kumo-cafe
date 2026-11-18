import { describe, expect, it } from 'vitest';
import { morningCloud as cafe } from '../content/cafes/morning-cloud';
import {
  endlessMenu,
  isCafeOpen,
  isEndlessOpen,
  newestCafe,
  isShiftOpen,
  meetGuests,
  newSave,
  nextShift,
  recordEndless,
  recordShift,
  setupFor,
  shiftsDone,
  stationsReached,
} from './progress';
import { buyDecor, buyUpgrade, checkUpgrade, nextPrice } from './shop';

const finish = (save: ReturnType<typeof newSave>, upTo: number): void => {
  for (let i = 0; i < upTo; i += 1) recordShift(save, cafe, i, { coins: 10, stars: 1, served: 8 });
};

describe('progress', () => {
  it('opens shifts one after another', () => {
    const save = newSave();
    expect(isShiftOpen(save, cafe, 0)).toBe(true);
    expect(isShiftOpen(save, cafe, 1)).toBe(false);
    const record = recordShift(save, cafe, 0, { coins: 120, stars: 2, served: 8 });
    expect(record).toMatchObject({ stars: 2, newBest: true, opened: 1, endlessOpened: false });
    expect(isShiftOpen(save, cafe, 1)).toBe(true);
    expect(nextShift(save, cafe)).toBe(1);
    expect(save.coins).toBe(120);
    expect(save.stats).toEqual({ shifts: 1, guestsServed: 8, coinsEarned: 120 });
  });

  it('keeps the best stars and coins when a shift is played again', () => {
    const save = newSave();
    recordShift(save, cafe, 0, { coins: 120, stars: 3, served: 8 });
    const again = recordShift(save, cafe, 0, { coins: 90, stars: 1, served: 8 });
    expect(again).toMatchObject({ newBest: false, opened: null });
    expect(save.cafes[cafe.id]!.stars[0]).toBe(3);
    expect(save.cafes[cafe.id]!.best[0]).toBe(120);
    // Coins from every shift are kept, even a replay.
    expect(save.coins).toBe(210);
  });

  it('opens the All-Day Café after a few shifts, with what has been learned', () => {
    const save = newSave();
    finish(save, cafe.endless.after - 1);
    expect(isEndlessOpen(save, cafe)).toBe(false);
    expect(recordShift(save, cafe, cafe.endless.after - 1, { coins: 1, stars: 1, served: 1 }).endlessOpened).toBe(true);
    const { menu, who } = endlessMenu(save, cafe);
    expect(menu).toEqual(['sky-tea', 'fluffy-pancake', 'berry-pancake', 'cloud-cocoa']);
    expect(who).not.toContain('bao');
  });

  it('keeps separate bests for the All-Day Café in normal and relaxed mode', () => {
    const save = newSave();
    expect(recordEndless(save, cafe, { coins: 50, served: 12, relaxed: false })).toBe(true);
    expect(recordEndless(save, cafe, { coins: 50, served: 10, relaxed: false })).toBe(false);
    expect(recordEndless(save, cafe, { coins: 50, served: 30, relaxed: true })).toBe(true);
    expect(save.cafes[cafe.id]).toMatchObject({ endlessBest: 12, endlessBestRelaxed: 30 });
    expect(save.coins).toBe(150);
  });

  it('introduces each guest once', () => {
    const save = newSave();
    expect(meetGuests(save, ['mochi', 'pip'])).toEqual(['mochi', 'pip']);
    expect(meetGuests(save, ['mochi', 'pip', 'fluff'])).toEqual(['fluff']);
  });

  it('opens the first café from the start, and each next café after the one before', () => {
    const save = newSave();
    expect(isCafeOpen(save, 0)).toBe(true);
    expect(isCafeOpen(save, 1)).toBe(false);
    expect(newestCafe(save)).toBe(0);
  });

  it('knows which stations the player has reached', () => {
    const save = newSave();
    expect(stationsReached(save, cafe)).toEqual(['griddle', 'kettle']);
    finish(save, 6);
    expect(stationsReached(save, cafe)).toEqual(['griddle', 'kettle', 'toaster', 'board']);
    expect(shiftsDone(save, cafe)).toBe(6);
  });
});

describe('the shop', () => {
  it('sells upgrades step by step, for coins the player has', () => {
    const save = newSave();
    const heat = cafe.upgrades.find((u) => u.id === 'griddle-heat')!;
    expect(checkUpgrade(save, cafe, heat)).toEqual({ ok: false, reason: 'coins' });
    save.coins = 1000;
    expect(buyUpgrade(save, cafe, 'griddle-heat')).toEqual({ ok: true, price: heat.prices[0] });
    expect(nextPrice(save, cafe, heat)).toBe(heat.prices[1]);
    buyUpgrade(save, cafe, 'griddle-heat');
    buyUpgrade(save, cafe, 'griddle-heat');
    expect(buyUpgrade(save, cafe, 'griddle-heat')).toEqual({ ok: false, reason: 'owned' });
    expect(save.coins).toBe(1000 - heat.prices.reduce((a, b) => a + b, 0));
  });

  it('only sells upgrades for stations the player has reached', () => {
    const save = newSave();
    save.coins = 1000;
    expect(buyUpgrade(save, cafe, 'toaster-slot')).toEqual({ ok: false, reason: 'locked' });
    expect(save.coins).toBe(1000);
  });

  it('sells each decoration once, after its shift', () => {
    const save = newSave();
    save.coins = 1000;
    expect(buyDecor(save, cafe, 'flower-pots')).toEqual({ ok: false, reason: 'locked' });
    finish(save, 1);
    expect(buyDecor(save, cafe, 'flower-pots').ok).toBe(true);
    expect(buyDecor(save, cafe, 'flower-pots')).toEqual({ ok: false, reason: 'owned' });
  });

  it('turns upgrades and decorations into how the kitchen works', () => {
    const save = newSave();
    finish(save, 3);
    save.coins = 10000;
    buyUpgrade(save, cafe, 'griddle-spot');
    buyUpgrade(save, cafe, 'griddle-heat');
    buyUpgrade(save, cafe, 'griddle-heat');
    buyUpgrade(save, cafe, 'board-plate');
    buyDecor(save, cafe, 'flower-pots');
    buyDecor(save, cafe, 'cloud-lamps');
    save.settings.relaxed = true;
    const setup = setupFor(save, cafe);
    expect(setup.extraSlots).toEqual({ griddle: 1, board: 1 });
    expect(setup.speed.griddle).toBeCloseTo(0.85 * 0.85);
    expect(setup.patience).toBeCloseTo(1.2);
    expect(setup.relaxed).toBe(true);
  });
});
