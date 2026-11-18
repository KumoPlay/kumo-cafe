import { balance, getDish, kitchenFor, type CafeDef, type EndlessDef, type LevelDef } from '../../content';
import { planGuests } from './guests';
import { defaultSetup, type CookStation, type KitchenSetup, type Plate, type ShiftState } from './state';

/** Coins for serving every planned guest with all hearts left, in one unbroken combo. */
function perfectCoins(state: ShiftState): number {
  const fullTip = balance.tipByHearts[balance.hearts] ?? 0;
  let coins = 0;
  state.upcoming.forEach((guest, index) => {
    const food = guest.order.reduce((sum, line) => sum + (getDish(state.cafe, line.dish)?.price ?? 0), 0);
    const combo = index + 1;
    coins += food + Math.round(food * fullTip);
    if (combo >= 2) coins += balance.comboCoins * (Math.min(combo, balance.comboMax) - 1);
  });
  return coins;
}

/** A new shift, ready to play. The same seed always plans the same guests and orders. */
export function createShift(
  cafe: CafeDef,
  levelIndex: number,
  setup: KitchenSetup = defaultSetup,
  seed: number = (Math.random() * 2 ** 32) >>> 0,
  level: LevelDef | undefined = cafe.levels[levelIndex],
): ShiftState {
  if (!level) throw new Error(`No shift ${levelIndex + 1} in ${cafe.id}`);
  const { jars, stations } = kitchenFor(cafe, level.menu);
  const slotsFor = (id: string): number => {
    const station = cafe.stations.find((s) => s.id === id);
    return Math.max(1, (station?.slots ?? 1) + (setup.extraSlots[id] ?? 0));
  };

  const cooks: Record<string, CookStation> = {};
  let plates: Plate[] = [];
  for (const id of stations) {
    const station = cafe.stations.find((s) => s.id === id);
    if (station?.kind === 'board') {
      plates = Array.from({ length: slotsFor(id) }, () => ({ parts: [] }));
    } else {
      cooks[id] = { id, slots: Array.from({ length: slotsFor(id) }, () => null), queue: [] };
    }
  }

  const state: ShiftState = {
    cafe,
    level,
    levelIndex,
    setup,
    time: 0,
    seed: seed >>> 0,
    jars,
    stations,
    cooks,
    plates,
    seats: Array.from({ length: level.seats }, () => null),
    upcoming: [],
    line: 0,
    arrived: 0,
    served: 0,
    nextGuestAt: level.firstGuestMs,
    nextId: 1,
    earned: { food: 0, tips: 0, combo: 0 },
    perfect: 0,
    goals: [0, 0],
    combo: 0,
    bestCombo: 0,
    endless: null,
    done: false,
  };
  if (!Number.isFinite(level.guests)) return state;
  state.upcoming = planGuests(state, level.guests);
  state.perfect = perfectCoins(state);
  state.goals = [
    Math.round((state.perfect * level.stars[0]) / 100),
    Math.round((state.perfect * level.stars[1]) / 100),
  ];
  return state;
}

/**
 * A day in the All-Day Café: guests keep coming, a little quicker each time,
 * with the dishes on `menu` and the guests in `who`.
 */
export function createEndless(
  cafe: CafeDef,
  def: EndlessDef,
  menu: string[],
  who: string[],
  setup: KitchenSetup = defaultSetup,
  seed?: number,
): ShiftState {
  const level: LevelDef = {
    guests: Number.POSITIVE_INFINITY,
    seats: def.seats,
    menu,
    who,
    orderSizes: def.orderSizes,
    firstGuestMs: def.firstGuestMs,
    gapMs: def.gapMs,
    patienceMs: def.patienceMs,
    stars: [100, 100],
  };
  const state = createShift(cafe, -1, setup, seed, level);
  state.endless = {
    gapMs: [...def.gapMs],
    quicken: def.quicken,
    fastestGapMs: [...def.fastestGapMs],
    lineLimit: def.lineLimit,
    closed: false,
  };
  return state;
}
