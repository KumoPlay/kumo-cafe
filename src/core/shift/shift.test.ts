import { describe, expect, it } from 'vitest';
import { kitchenFor } from '../../content';
import { noArrivals, run, sitGuest, testCafe, testShift } from '../testing';
import {
  clearPlate,
  clearSlot,
  closeCafe,
  createEndless,
  createShift,
  heartsLeft,
  moveItem,
  starsFor,
  step,
  suggestTap,
  tapGuest,
  tapJar,
  tapPlate,
  tapSlot,
  totalEarned,
  type ShiftEvent,
  type ShiftState,
} from '.';

const types = (events: ShiftEvent[]): string[] => events.map((event) => event.type);

function cookReady(state: ShiftState, jar: string, ms = 6000): void {
  expect(tapJar(state, jar).ok).toBe(true);
  run(state, ms);
}

describe('setting up a shift', () => {
  it('shows only the jars and stations the menu needs', () => {
    expect(kitchenFor(testCafe, ['sky-tea'])).toEqual({ jars: ['tea-leaves'], stations: ['kettle'] });
    expect(kitchenFor(testCafe, ['berry-pancake'])).toEqual({
      jars: ['batter', 'strawberries'],
      stations: ['griddle', 'board'],
    });
  });

  it('gives each station its spots, plus upgrades', () => {
    const state = testShift({}, { extraSlots: { griddle: 1, board: 1 } });
    expect(state.cooks.griddle?.slots).toHaveLength(3);
    expect(state.cooks.kettle?.slots).toHaveLength(1);
    expect(state.plates).toHaveLength(3);
    expect(state.seats).toHaveLength(2);
  });

  it('plays the same shift for the same seed', () => {
    const a = testShift({ orderSizes: [1, 1, 1] }, {}, 42);
    const b = testShift({ orderSizes: [1, 1, 1] }, {}, 42);
    run(a, 20000);
    run(b, 20000);
    expect(a.seats.map((g) => g && [g.who, g.order])).toEqual(b.seats.map((g) => g && [g.who, g.order]));
  });
});

describe('cooking', () => {
  it('cooks in a free spot, then queues, then says busy', () => {
    const state = noArrivals(testShift());
    expect(types((tapJar(state, 'batter') as { events: ShiftEvent[] }).events)).toEqual(['cook-start']);
    expect(tapJar(state, 'batter').ok).toBe(true);
    expect(types((tapJar(state, 'batter') as { events: ShiftEvent[] }).events)).toEqual(['queued']);
    expect(tapJar(state, 'batter').ok).toBe(true);
    expect(tapJar(state, 'batter')).toEqual({ ok: false, reason: 'busy' });
    expect(state.cooks.griddle?.queue).toEqual(['batter', 'batter']);
  });

  it('finishes on time, says so once, and never burns', () => {
    const state = noArrivals(testShift());
    tapJar(state, 'tea-leaves');
    expect(run(state, 2900).filter((e) => e.type === 'cooked')).toHaveLength(0);
    expect(run(state, 200).filter((e) => e.type === 'cooked')).toHaveLength(1);
    expect(run(state, 600000).filter((e) => e.type === 'cooked')).toHaveLength(0);
    expect(state.cooks.kettle?.slots[0]?.output).toBe('sky-tea');
  });

  it('cooks faster with a speed upgrade', () => {
    const state = noArrivals(testShift({}, { speed: { kettle: 0.5 } }));
    tapJar(state, 'tea-leaves');
    expect(run(state, 1600).some((e) => e.type === 'cooked')).toBe(true);
  });

  it('cannot hand over food that is still cooking', () => {
    const state = noArrivals(testShift());
    tapJar(state, 'tea-leaves');
    run(state, 1000);
    expect(tapSlot(state, 'kettle', 0)).toEqual({ ok: false, reason: 'not-ready' });
    expect(tapSlot(state, 'kettle', 1)).toEqual({ ok: false, reason: 'empty' });
  });

  it('ignores jars that are not part of the shift', () => {
    const state = noArrivals(testShift({ menu: ['sky-tea'] }));
    expect(tapJar(state, 'batter')).toEqual({ ok: false, reason: 'locked' });
  });
});

describe('handing food over', () => {
  it('sends cooked food to the guest who has waited longest for it', () => {
    const state = noArrivals(testShift());
    const first = sitGuest(state, 0, ['sky-tea', 'fluffy-pancake']);
    run(state, 4000);
    const second = sitGuest(state, 1, ['sky-tea']);
    cookReady(state, 'tea-leaves', 3000);
    const result = tapSlot(state, 'kettle', 0);
    expect(result.ok && result.events[0]).toMatchObject({ type: 'delivered', dish: 'sky-tea', guest: first.id });
    expect(second.order[0]?.done).toBe(false);
    expect(state.cooks.kettle?.slots[0]).toBeNull();
  });

  it('keeps food warm on the station when nobody wants it and no plate fits', () => {
    const state = noArrivals(testShift());
    cookReady(state, 'tea-leaves');
    expect(tapSlot(state, 'kettle', 0)).toEqual({ ok: false, reason: 'nobody-wants' });
    expect(state.cooks.kettle?.slots[0]?.output).toBe('sky-tea');
  });

  it('puts a pancake on a plate when nobody wants it plain', () => {
    const state = noArrivals(testShift());
    sitGuest(state, 0, ['berry-pancake']);
    cookReady(state, 'batter');
    const result = tapSlot(state, 'griddle', 0);
    expect(result.ok && result.events[0]).toMatchObject({ type: 'plated', item: 'fluffy-pancake', plate: 0 });
    expect(state.plates[0]?.parts).toEqual(['fluffy-pancake']);
  });

  it('starts the next queued thing when a spot frees up', () => {
    const state = noArrivals(testShift());
    sitGuest(state, 0, ['sky-tea', 'sky-tea']);
    tapJar(state, 'tea-leaves');
    tapJar(state, 'tea-leaves');
    run(state, 3100);
    const result = tapSlot(state, 'kettle', 0);
    expect(result.ok && types(result.events)).toEqual(['delivered', 'cook-start']);
    expect(state.cooks.kettle?.slots[0]).toMatchObject({ input: 'tea-leaves', ready: false });
    expect(state.cooks.kettle?.queue).toEqual([]);
  });

  it('builds dishes on plates and only where they make sense', () => {
    const state = noArrivals(testShift());
    sitGuest(state, 0, ['berry-toast']);
    sitGuest(state, 1, ['berry-pancake']);
    expect(tapJar(state, 'strawberries').ok).toBe(true);
    expect(tapJar(state, 'strawberries').ok).toBe(true);
    // Two strawberries are never part of one dish, so they went on different plates.
    expect(state.plates.map((p) => p.parts)).toEqual([['strawberries'], ['strawberries']]);
    expect(tapJar(state, 'strawberries')).toEqual({ ok: false, reason: 'no-plate' });

    cookReady(state, 'bread', 3100);
    tapSlot(state, 'toaster', 0);
    expect(state.plates[0]?.parts).toEqual(['strawberries', 'toast']);
  });

  it('prefers the plate that finishes a dish somebody is waiting for', () => {
    const state = noArrivals(testShift());
    sitGuest(state, 0, ['berry-pancake']);
    state.plates[0]!.parts = ['toast'];
    state.plates[1]!.parts = ['fluffy-pancake'];
    tapJar(state, 'strawberries');
    expect(state.plates[1]?.parts).toEqual(['fluffy-pancake', 'strawberries']);
  });

  it('serves a finished plate, but not a half-made one', () => {
    const state = noArrivals(testShift());
    const guest = sitGuest(state, 0, ['berry-pancake']);
    state.plates[0]!.parts = ['strawberries'];
    expect(tapPlate(state, 0)).toEqual({ ok: false, reason: 'nobody-wants' });
    state.plates[0]!.parts.push('fluffy-pancake');
    const result = tapPlate(state, 0);
    expect(result.ok && types(result.events)).toEqual(['delivered', 'served']);
    expect(state.plates[0]?.parts).toEqual([]);
    expect(guest.servedAt).toBe(state.time);
    expect(tapPlate(state, 0)).toEqual({ ok: false, reason: 'empty' });
  });

  it('a plain pancake on a plate can still be served plain', () => {
    const state = noArrivals(testShift());
    sitGuest(state, 0, ['fluffy-pancake']);
    state.plates[1]!.parts = ['fluffy-pancake'];
    expect(tapPlate(state, 1).ok).toBe(true);
  });

  it('tapping a guest hands over everything ready for them', () => {
    const state = noArrivals(testShift());
    const guest = sitGuest(state, 0, ['sky-tea', 'berry-pancake', 'fluffy-pancake']);
    cookReady(state, 'tea-leaves', 3100);
    state.plates[0]!.parts = ['fluffy-pancake', 'strawberries'];
    const result = tapGuest(state, guest.id);
    expect(result.ok && result.events.map((e) => (e.type === 'delivered' ? e.from : e.type))).toEqual([
      'slot:kettle:0',
      'plate:0',
    ]);
    expect(guest.order.map((line) => line.done)).toEqual([true, true, false]);
    expect(tapGuest(state, guest.id)).toEqual({ ok: false, reason: 'nothing-ready' });
  });

  it('can empty a plate', () => {
    const state = noArrivals(testShift());
    state.plates[0]!.parts = ['strawberries'];
    expect(clearPlate(state, 0).ok).toBe(true);
    expect(state.plates[0]?.parts).toEqual([]);
    expect(clearPlate(state, 0)).toEqual({ ok: false, reason: 'empty' });
  });

  it('drag and drop lets the player choose', () => {
    const state = noArrivals(testShift());
    const a = sitGuest(state, 0, ['fluffy-pancake']);
    run(state, 1000);
    const b = sitGuest(state, 1, ['fluffy-pancake']);
    cookReady(state, 'batter');
    // A tap would go to guest a, who has waited longer; dragging can choose b.
    expect(moveItem(state, { kind: 'slot', station: 'griddle', slot: 0 }, { kind: 'guest', guest: b.id }).ok).toBe(true);
    expect(b.servedAt).not.toBeNull();
    expect(a.servedAt).toBeNull();

    tapJar(state, 'batter');
    run(state, 5100);
    expect(moveItem(state, { kind: 'slot', station: 'griddle', slot: 0 }, { kind: 'plate', plate: 1 }).ok).toBe(true);
    expect(moveItem(state, { kind: 'plate', plate: 1 }, { kind: 'guest', guest: b.id })).toEqual({
      ok: false,
      reason: 'nobody-wants',
    });
    expect(moveItem(state, { kind: 'plate', plate: 1 }, { kind: 'guest', guest: a.id }).ok).toBe(true);
  });
});

describe('guests, patience and coins', () => {
  it('patience runs down while seated, but never in relaxed mode', () => {
    const state = noArrivals(testShift());
    const guest = sitGuest(state, 0, ['sky-tea']);
    expect(heartsLeft(guest)).toBe(3);
    run(state, 10500);
    expect(heartsLeft(guest)).toBe(2);
    run(state, 20000);
    expect(heartsLeft(guest)).toBe(0);

    const relaxed = noArrivals(testShift({}, { relaxed: true }));
    const calm = sitGuest(relaxed, 0, ['sky-tea']);
    run(relaxed, 120000);
    expect(heartsLeft(calm)).toBe(3);
  });

  it('a guest who runs out of patience gets sleepy but never leaves', () => {
    const state = noArrivals(testShift());
    const guest = sitGuest(state, 0, ['sky-tea']);
    const events = run(state, 600000);
    expect(events.filter((e) => e.type === 'sleepy')).toHaveLength(1);
    expect(state.seats[0]).toBe(guest);
    expect(guest.servedAt).toBeNull();
  });

  it('handing over part of an order cheers a guest up a little', () => {
    const state = noArrivals(testShift());
    const guest = sitGuest(state, 0, ['sky-tea', 'fluffy-pancake']);
    run(state, 20000);
    const before = guest.patience;
    cookReady(state, 'tea-leaves', 3100);
    const mid = guest.patience;
    tapSlot(state, 'kettle', 0);
    expect(before).toBeGreaterThan(mid);
    expect(guest.patience).toBeCloseTo(mid + guest.patienceMax * 0.2);
  });

  it('pays for the food, tips by hearts, and rewards a happy streak', () => {
    const state = noArrivals(testShift());
    state.plates[0]!.parts = ['fluffy-pancake', 'strawberries'];
    const served: Extract<ShiftEvent, { type: 'served' }>[] = [];
    const serveNow = (dish: string): void => {
      const guest = sitGuest(state, 0, [dish]);
      state.plates[0]!.parts = dish === 'berry-pancake' ? ['fluffy-pancake', 'strawberries'] : [dish];
      const result = tapPlate(state, 0);
      if (result.ok) served.push(...result.events.filter((e) => e.type === 'served'));
      state.seats[guest.seat] = null;
    };
    serveNow('berry-pancake');
    serveNow('berry-pancake');
    serveNow('berry-pancake');
    expect(served.map((e) => [e.food, e.tip, e.combo, e.comboBonus])).toEqual([
      [9, 5, 1, 0],
      [9, 5, 2, 2],
      [9, 5, 3, 4],
    ]);
    expect(state.earned).toEqual({ food: 27, tips: 15, combo: 6 });
    expect(totalEarned(state)).toBe(48);

    // A guest who waited until their last heart: a smaller tip, and the streak starts over.
    const slow = sitGuest(state, 1, ['fluffy-pancake']);
    run(state, 25000);
    expect(heartsLeft(slow)).toBe(1);
    state.plates[0]!.parts = ['fluffy-pancake'];
    const result = tapPlate(state, 0);
    expect(result.ok && result.events.find((e) => e.type === 'served')).toMatchObject({ tip: 1, combo: 0, comboBonus: 0 });
    expect(state.bestCombo).toBe(3);
  });

  it('stars: one for finishing, more for coins', () => {
    expect(starsFor([20, 30], 0)).toBe(1);
    expect(starsFor([20, 30], 20)).toBe(2);
    expect(starsFor([20, 30], 30)).toBe(3);
  });

  it('sets star goals as a share of a perfect shift, planned at the start', () => {
    // One-dish orders of tea (5) or pancakes (6 or 9), with a full tip and a growing combo.
    const state = testShift({ guests: 3, menu: ['sky-tea'] });
    expect(state.upcoming).toHaveLength(3);
    // Each guest: 5 + 3 tip; combo bonus 0, 2, 4.
    expect(state.perfect).toBe(3 * 8 + 0 + 2 + 4);
    expect(state.goals).toEqual([Math.round(30 * 0.6), Math.round(30 * 0.85)]);
  });
});

describe('a whole shift', () => {
  it('guests arrive, wait in line for a seat without losing patience, and the shift ends', () => {
    const state = testShift({ guests: 4, seats: 2, gapMs: [1000, 1000] });
    run(state, 4100);
    expect(state.arrived).toBe(4);
    expect(state.seats.every((g) => g !== null)).toBe(true);
    expect(state.line).toBe(2);

    let done = false;
    for (let i = 0; i < 400 && !done; i += 1) {
      for (const guest of state.seats) {
        if (!guest || guest.servedAt !== null) continue;
        for (const line of guest.order) {
          if (line.done) continue;
          // Hand-made dishes, straight onto a plate, to keep this test about guests.
          const dish = testCafe.dishes.find((d) => d.id === line.dish)!;
          state.plates[0]!.parts = dish.parts.length > 0 ? [...dish.parts] : [dish.id];
          tapPlate(state, 0);
        }
      }
      done = run(state, 500).some((e) => e.type === 'done');
    }
    expect(done).toBe(true);
    expect(state.served).toBe(4);
    expect(tapJar(state, 'batter')).toEqual({ ok: false, reason: 'done' });
    expect(step(state, 100)).toEqual([]);
  });

  it('does not keep the player waiting when the counter is empty', () => {
    const state = testShift({ guests: 3, firstGuestMs: 20000 });
    const events = run(state, 1600);
    expect(events.some((e) => e.type === 'seated')).toBe(true);
  });

  it('seats different characters when it can', () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const state = testShift({ guests: 8, seats: 3, gapMs: [100, 100] }, {}, seed);
      run(state, 2000);
      const who = state.seats.map((g) => g?.who);
      expect(new Set(who).size).toBe(3);
    }
  });

  it('works with the real café content', async () => {
    const { cafes } = await import('../../content');
    for (const cafe of cafes) {
      cafe.levels.forEach((_, index) => {
        const state = createShift(cafe, index, undefined, 1);
        run(state, 30000);
        expect(state.arrived).toBeGreaterThan(0);
      });
    }
  });
});

describe('the All-Day Café', () => {
  const day = (seed = 3): ShiftState =>
    createEndless(testCafe, testCafe.endless, ['sky-tea', 'fluffy-pancake'], ['mochi', 'pip', 'fluff'], undefined, seed);

  it('keeps guests coming, a little quicker each time, down to the fastest pace', () => {
    const state = day();
    const gaps: number[] = [];
    for (let i = 0; i < 2000 && state.arrived < 20; i += 1) {
      const before = state.arrived;
      step(state, 100);
      if (state.arrived > before) gaps.push(state.endless!.gapMs[0]);
      // Serve everyone at once, so the line never fills.
      state.seats.forEach((guest, seat) => {
        if (guest) {
          state.seats[seat] = null;
          state.served += 1;
        }
      });
    }
    expect(gaps.slice(0, 3)).toEqual([3600, 3240, 2916]);
    expect(gaps[gaps.length - 1]).toBe(1000);
    expect(state.done).toBe(false);
  });

  it('closes for the day when the line outside gets long', () => {
    const state = day();
    const events = run(state, 60000);
    expect(state.done).toBe(true);
    expect(events.filter((e) => e.type === 'done')).toHaveLength(1);
    expect(state.line).toBe(testCafe.endless.lineLimit);
  });

  it('can be closed by the player, and only the All-Day Café can', () => {
    const state = day();
    run(state, 3000);
    expect(closeCafe(state)).toEqual({ ok: true, events: [{ type: 'done' }] });
    expect(state.endless?.closed).toBe(true);
    expect(closeCafe(testShift())).toEqual({ ok: false, reason: 'locked' });
  });
});

describe('the helper', () => {
  it('points at nothing when nobody is waiting', () => {
    expect(suggestTap(noArrivals(testShift()))).toBeNull();
  });

  it('points at the jar, then at the finished food', () => {
    const state = noArrivals(testShift());
    sitGuest(state, 0, ['sky-tea']);
    expect(suggestTap(state)).toEqual({ kind: 'jar', id: 'tea-leaves' });
    tapJar(state, 'tea-leaves');
    expect(suggestTap(state)).toBeNull();
    run(state, 3100);
    expect(suggestTap(state)).toEqual({ kind: 'slot', station: 'kettle', slot: 0 });
  });

  it('builds a plated dish step by step', () => {
    const state = noArrivals(testShift());
    sitGuest(state, 0, ['berry-pancake']);
    expect(suggestTap(state)).toEqual({ kind: 'jar', id: 'batter' });
    tapJar(state, 'batter');
    expect(suggestTap(state)).toEqual({ kind: 'jar', id: 'strawberries' });
    tapJar(state, 'strawberries');
    run(state, 5100);
    expect(suggestTap(state)).toEqual({ kind: 'slot', station: 'griddle', slot: 0 });
    tapSlot(state, 'griddle', 0);
    expect(suggestTap(state)).toEqual({ kind: 'plate', plate: 0 });
  });

  it('points at the bin when unneeded food blocks the kitchen', () => {
    const state = noArrivals(testShift());
    cookReady(state, 'tea-leaves', 3100);
    sitGuest(state, 0, ['berry-toast']);
    state.plates[0]!.parts = ['fluffy-pancake'];
    state.plates[1]!.parts = ['fluffy-pancake', 'strawberries'];
    // The toaster is free, so first: make toast.
    expect(suggestTap(state)).toEqual({ kind: 'jar', id: 'bread' });
    tapJar(state, 'bread');
    run(state, 3600);
    // Toast is ready but no plate can take it: clear the plate nobody needs.
    expect(suggestTap(state)).toEqual({ kind: 'clear-plate', plate: 0 });

    const kettle = noArrivals(testShift());
    cookReady(kettle, 'tea-leaves', 3100);
    tapJar(kettle, 'tea-leaves');
    sitGuest(kettle, 0, ['fluffy-pancake']);
    expect(suggestTap(kettle)).toEqual({ kind: 'jar', id: 'batter' });
    kettle.seats[0] = null;
    sitGuest(kettle, 0, ['sky-tea', 'sky-tea']);
    // The tea in the kettle is wanted after all, so nothing is thrown away.
    expect(suggestTap(kettle)).toEqual({ kind: 'slot', station: 'kettle', slot: 0 });
  });

  it('can throw away finished food nobody needs, and the queue moves on', () => {
    const state = noArrivals(testShift());
    cookReady(state, 'tea-leaves', 3100);
    tapJar(state, 'tea-leaves');
    expect(clearSlot(state, 'kettle', 0)).toMatchObject({ ok: true });
    expect(state.cooks.kettle?.slots[0]).toMatchObject({ input: 'tea-leaves', ready: false });
    expect(clearSlot(state, 'kettle', 0)).toEqual({ ok: false, reason: 'not-ready' });
  });

  it('can finish every real shift on its own', async () => {
    const { cafes } = await import('../../content');
    for (const cafe of cafes) {
      cafe.levels.forEach((_, index) => {
        const state = createShift(cafe, index, undefined, 11);
        for (let i = 0; i < 20000 && !state.done; i += 1) {
          const tap = suggestTap(state);
          if (tap?.kind === 'jar') tapJar(state, tap.id);
          else if (tap?.kind === 'slot') tapSlot(state, tap.station, tap.slot);
          else if (tap?.kind === 'plate') tapPlate(state, tap.plate);
          else if (tap?.kind === 'clear-slot') clearSlot(state, tap.station, tap.slot);
          else if (tap?.kind === 'clear-plate') clearPlate(state, tap.plate);
          step(state, 100);
        }
        expect(state.done, `${cafe.id} shift ${index + 1}`).toBe(true);
      });
    }
  });
});
