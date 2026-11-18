import type { CafeDef, LevelDef } from '../content';
import { createShift, defaultSetup, step, type Guest, type KitchenSetup, type ShiftState } from './shift';

/** A small café for tests, so the tests do not change when the real menu does. */
export const testCafe: CafeDef = {
  id: 'test-cafe',
  ingredients: [
    { id: 'batter', goesTo: 'griddle' },
    { id: 'tea-leaves', goesTo: 'kettle' },
    { id: 'bread', goesTo: 'toaster' },
    { id: 'strawberries', goesTo: 'board' },
  ],
  stations: [
    { id: 'griddle', kind: 'cook', slots: 2 },
    { id: 'kettle', kind: 'cook', slots: 1 },
    { id: 'toaster', kind: 'cook', slots: 1 },
    { id: 'board', kind: 'board', slots: 2 },
  ],
  cooking: [
    { station: 'griddle', input: 'batter', output: 'fluffy-pancake', timeMs: 5000 },
    { station: 'kettle', input: 'tea-leaves', output: 'sky-tea', timeMs: 3000 },
    { station: 'toaster', input: 'bread', output: 'toast', timeMs: 3000 },
  ],
  dishes: [
    { id: 'sky-tea', parts: [], price: 5 },
    { id: 'fluffy-pancake', parts: [], price: 6 },
    { id: 'berry-pancake', parts: ['fluffy-pancake', 'strawberries'], price: 9 },
    { id: 'berry-toast', parts: ['toast', 'strawberries'], price: 9 },
  ],
  levels: [],
  upgrades: [
    { id: 'griddle-spot', kind: 'slot', station: 'griddle', prices: [100] },
    { id: 'griddle-heat', kind: 'speed', station: 'griddle', prices: [50, 120] },
    { id: 'toaster-slot', kind: 'slot', station: 'toaster', prices: [80] },
    { id: 'board-plate', kind: 'slot', station: 'board', prices: [90] },
  ],
  decor: [
    { id: 'flower-pots', price: 60, patience: 0.1, after: 1, place: { on: 'counter', x: 104, y: 0, w: 32 } },
    { id: 'cloud-lamps', price: 150, patience: 0.2, after: 2, place: { on: 'wall', x: 96, y: 26, w: 168 } },
  ],
  endless: {
    after: 2,
    seats: 3,
    patienceMs: 30000,
    firstGuestMs: 1000,
    gapMs: [4000, 4000],
    quicken: 0.9,
    fastestGapMs: [1000, 1000],
    orderSizes: [1],
    lineLimit: 3,
  },
};

export const testLevel: LevelDef = {
  guests: 3,
  seats: 2,
  menu: ['sky-tea', 'fluffy-pancake', 'berry-pancake', 'berry-toast'],
  who: ['mochi', 'pip', 'fluff'],
  orderSizes: [1, 0, 0],
  firstGuestMs: 1000,
  gapMs: [4000, 4000],
  patienceMs: 30000,
  stars: [60, 85],
};

/** A fresh test shift. Nobody has arrived yet. */
export function testShift(level: Partial<LevelDef> = {}, setup: Partial<KitchenSetup> = {}, seed = 7): ShiftState {
  return createShift(testCafe, 0, { ...defaultSetup, ...setup }, seed, { ...testLevel, ...level });
}

/** Sits a guest with a chosen order, skipping the arrival queue. */
export function sitGuest(state: ShiftState, seat: number, dishes: string[], who = 'mochi'): Guest {
  const patienceMax = state.level.patienceMs;
  const guest: Guest = {
    id: state.nextId++,
    who,
    seat,
    order: dishes.map((dish) => ({ dish, done: false })),
    patience: patienceMax,
    patienceMax,
    seatedAt: state.time,
    servedAt: null,
    sleepy: false,
  };
  state.seats[seat] = guest;
  state.arrived += 1;
  return guest;
}

/** Stops new guests from arriving, for tests that seat their own (an endless wait is never hurried). */
export function noArrivals(state: ShiftState): ShiftState {
  state.nextGuestAt = Number.POSITIVE_INFINITY;
  return state;
}

/** Plays `ms` of shift time in small frames, like the real game loop. Returns every event. */
export function run(state: ShiftState, ms: number, frame = 50): ReturnType<typeof step> {
  const events: ReturnType<typeof step> = [];
  for (let left = ms; left > 0; left -= frame) events.push(...step(state, Math.min(frame, left)));
  return events;
}
