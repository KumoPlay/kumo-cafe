import type { CafeDef } from '../content';
import {
  clearPlate,
  clearSlot,
  createEndless,
  createShift,
  defaultSetup,
  starsFor,
  step,
  suggestTap,
  tapJar,
  tapPlate,
  tapSlot,
  totalEarned,
  type KitchenSetup,
  type ShiftState,
} from '../core';

/**
 * A pretend player for checking balance. It plays the real rules, making one
 * sensible tap every `tapEveryMs` milliseconds. It is sensible, not perfect.
 */
export interface PlayerStyle {
  name: string;
  /** Time between taps: how quickly this player thinks and taps. */
  tapEveryMs: number;
}

export const styles: PlayerStyle[] = [
  { name: 'quick', tapEveryMs: 450 },
  { name: 'steady', tapEveryMs: 900 },
  { name: 'unhurried', tapEveryMs: 1600 },
  { name: 'little kid', tapEveryMs: 3000 },
];

export interface ShiftReport {
  /** Coins earned in the shift. */
  coins: number;
  /** Coins as a percentage of a perfect shift. */
  percent: number;
  stars: 1 | 2 | 3;
  seconds: number;
  bestCombo: number;
  taps: number;
}

/** One sensible tap, or false when there is nothing useful to do right now. */
function act(state: ShiftState): boolean {
  const tap = suggestTap(state);
  if (!tap) return false;
  if (tap.kind === 'jar') return tapJar(state, tap.id).ok;
  if (tap.kind === 'slot') return tapSlot(state, tap.station, tap.slot).ok;
  if (tap.kind === 'plate') return tapPlate(state, tap.plate).ok;
  if (tap.kind === 'clear-slot') return clearSlot(state, tap.station, tap.slot).ok;
  return clearPlate(state, tap.plate).ok;
}

/** Plays one whole shift with a player style. */
export function playShift(
  cafe: CafeDef,
  levelIndex: number,
  style: PlayerStyle,
  seed: number,
  setup: KitchenSetup = defaultSetup,
): ShiftReport {
  const state = createShift(cafe, levelIndex, setup, seed);
  const frame = 50;
  let nextTap = 0;
  let taps = 0;
  while (!state.done && state.time < 15 * 60 * 1000) {
    if (state.time >= nextTap) {
      if (act(state)) {
        taps += 1;
        nextTap = state.time + style.tapEveryMs;
      } else {
        nextTap = state.time + frame;
      }
    }
    step(state, frame);
  }
  const coins = totalEarned(state);
  return { coins, percent: Math.round((coins / state.perfect) * 100), stars: starsFor(state.goals, coins), seconds: Math.round(state.time / 1000), bestCombo: state.bestCombo, taps };
}

/** Plays a day in the All-Day Café with every dish, until the line fills (or 20 minutes pass). */
export function playEndless(cafe: CafeDef, style: PlayerStyle, seed: number): { served: number; seconds: number } {
  const menu = cafe.dishes.map((dish) => dish.id);
  const who = [...new Set(cafe.levels.flatMap((level) => level.who))];
  const state = createEndless(cafe, cafe.endless, menu, who, defaultSetup, seed);
  const frame = 50;
  let nextTap = 0;
  while (!state.done && state.time < 20 * 60 * 1000) {
    if (state.time >= nextTap) nextTap = state.time + (act(state) ? style.tapEveryMs : frame);
    step(state, frame);
  }
  return { served: state.served, seconds: Math.round(state.time / 1000) };
}
