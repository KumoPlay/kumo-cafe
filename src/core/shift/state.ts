import { balance, type CafeDef, type LevelDef } from '../../content';

/**
 * Everything about one shift while it is being played. A shift is never
 * saved: closing the game mid-shift simply means playing it again.
 */

/** Upgrades and settings that change the kitchen for a shift. */
export interface KitchenSetup {
  /** Extra cooking spots or plates per station id, on top of the station's own. */
  extraSlots: Record<string, number>;
  /** Cooking time per station id, as a share of normal (0.85 = 15% faster). */
  speed: Record<string, number>;
  /** Guest patience, as a share of normal (1.2 = 20% more patient). */
  patience: number;
  /** Relaxed mode: patience never runs down. */
  relaxed: boolean;
}

export const defaultSetup: KitchenSetup = { extraSlots: {}, speed: {}, patience: 1, relaxed: false };

/** Something cooking (or cooked and waiting, warm) on a station. Food never burns. */
export interface CookingSlot {
  input: string;
  output: string;
  startedAt: number;
  readyAt: number;
  /** True once the "it's ready" moment has been announced. */
  ready: boolean;
}

export interface CookStation {
  id: string;
  slots: (CookingSlot | null)[];
  /** Taps that arrived while every spot was busy. They start by themselves when a spot frees up. */
  queue: string[];
}

/** A plate on the board, with what has been put on it so far. */
export interface Plate {
  parts: string[];
}

export interface OrderLine {
  dish: string;
  done: boolean;
}

export interface Guest {
  id: number;
  /** Which character, e.g. 'mochi'. */
  who: string;
  seat: number;
  order: OrderLine[];
  /** Patience left and at the start, in milliseconds. */
  patience: number;
  patienceMax: number;
  seatedAt: number;
  /** When the order was complete; the guest smiles for a moment, then the seat is free. */
  servedAt: number | null;
  /** True once patience has run out. The guest still waits, calmly, just without a tip. */
  sleepy: boolean;
}

/** A guest who will come later in the shift. Orders are planned when the shift starts. */
export interface PlannedGuest {
  who: string;
  order: OrderLine[];
}

export interface Earned {
  food: number;
  tips: number;
  combo: number;
}

/** Extra state for the All-Day Café (endless mode). */
export interface EndlessRun {
  /** Time between guests right now, [shortest, longest]. It shrinks with every guest. */
  gapMs: [number, number];
  quicken: number;
  fastestGapMs: [number, number];
  /** The café closes for the day when this many guests wait in line. */
  lineLimit: number;
  /** True when the player closed the café themselves. */
  closed: boolean;
}

export interface ShiftState {
  cafe: CafeDef;
  level: LevelDef;
  /** 0 for the first shift. */
  levelIndex: number;
  setup: KitchenSetup;
  /** Shift time in milliseconds. Only moves while the shift runs. */
  time: number;
  seed: number;
  /** Jars and stations this shift shows, worked out from its menu. */
  jars: string[];
  stations: string[];
  cooks: Record<string, CookStation>;
  plates: Plate[];
  seats: (Guest | null)[];
  /** Guests who have not sat down yet, in the order they come. */
  upcoming: PlannedGuest[];
  /** Guests who have arrived but are waiting for a free seat. Patience only starts once seated. */
  line: number;
  arrived: number;
  served: number;
  nextGuestAt: number;
  nextId: number;
  earned: Earned;
  /** Coins for a perfect shift, and the coins needed for ★★ and ★★★. */
  perfect: number;
  goals: [number, number];
  /** Guests served in a row with every heart left. */
  combo: number;
  bestCombo: number;
  /** Set in the All-Day Café, where guests keep coming until the day ends. */
  endless: EndlessRun | null;
  done: boolean;
}

/** Coins earned so far this shift: food, tips and combo bonus together. */
export function totalEarned(state: ShiftState): number {
  return state.earned.food + state.earned.tips + state.earned.combo;
}

/** Stars for a number of coins. Finishing a shift always gives at least one. */
export function starsFor(goals: readonly [number, number], coins: number): 1 | 2 | 3 {
  if (coins >= goals[1]) return 3;
  if (coins >= goals[0]) return 2;
  return 1;
}

/** Hearts a guest has left, from the full count down to 0. */
export function heartsLeft(guest: Guest): number {
  if (guest.patience <= 0 || guest.patienceMax <= 0) return 0;
  return Math.min(balance.hearts, Math.ceil((guest.patience / guest.patienceMax) * balance.hearts - 1e-9));
}

/** Guests at the counter who are still waiting for something. */
export function waitingGuests(state: ShiftState): Guest[] {
  return state.seats.filter((guest): guest is Guest => guest !== null && guest.servedAt === null);
}

export function findGuest(state: ShiftState, id: number): Guest | undefined {
  return waitingGuests(state).find((guest) => guest.id === id);
}
