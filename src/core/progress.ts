import { balance, cafes, kitchenFor, type CafeDef, type LevelDef } from '../content';
import { defaultSetup, type KitchenSetup } from './shift';

/**
 * The player's progress: everything that is saved on the device. A shift in
 * progress is never saved; only finished shifts, purchases and settings are.
 */
export interface CafeProgress {
  /** Stars per shift, 0 for a shift not finished yet. */
  stars: number[];
  /** Best coins per shift. */
  best: number[];
  /** Steps bought, by upgrade id. */
  upgrades: Record<string, number>;
  /** Decorations bought, by id. */
  decor: string[];
  /** Most guests served in one day of the All-Day Café, in normal and relaxed mode. */
  endlessBest: number;
  endlessBestRelaxed: number;
}

export interface Settings {
  sound: boolean;
  /** Guests' patience never runs down. */
  relaxed: boolean;
}

export interface SaveState {
  coins: number;
  cafes: Record<string, CafeProgress>;
  settings: Settings;
  /** One-time things the player has already seen. */
  seen: {
    installHint: boolean;
    /** Guests the player has met, so a new face gets a little introduction. */
    guests: string[];
  };
  stats: {
    shifts: number;
    guestsServed: number;
    coinsEarned: number;
  };
}

export function newCafeProgress(cafe: CafeDef): CafeProgress {
  return {
    stars: cafe.levels.map(() => 0),
    best: cafe.levels.map(() => 0),
    upgrades: {},
    decor: [],
    endlessBest: 0,
    endlessBestRelaxed: 0,
  };
}

export function newSave(): SaveState {
  return {
    coins: 0,
    cafes: Object.fromEntries(cafes.map((cafe) => [cafe.id, newCafeProgress(cafe)])),
    settings: { sound: true, relaxed: false },
    seen: { installHint: false, guests: [] },
    stats: { shifts: 0, guestsServed: 0, coinsEarned: 0 },
  };
}

/** This café's progress, created on first use (for example a café added in an update). */
export function progressOf(save: SaveState, cafe: CafeDef): CafeProgress {
  let progress = save.cafes[cafe.id];
  if (!progress) {
    progress = newCafeProgress(cafe);
    save.cafes[cafe.id] = progress;
  }
  return progress;
}

/** How many shifts in a row, from the first, have been finished. */
export function shiftsDone(save: SaveState, cafe: CafeDef): number {
  const stars = save.cafes[cafe.id]?.stars ?? [];
  let done = 0;
  while (done < cafe.levels.length && (stars[done] ?? 0) > 0) done += 1;
  return done;
}

/** Cafés open in order: each one once every shift of the café before it is finished. */
export function isCafeOpen(save: SaveState, index: number): boolean {
  if (index <= 0) return index === 0;
  const before = cafes[index - 1];
  return before !== undefined && isCafeOpen(save, index - 1) && shiftsDone(save, before) >= before.levels.length;
}

/** The newest café the player can visit. */
export function newestCafe(save: SaveState): number {
  let index = 0;
  while (index + 1 < cafes.length && isCafeOpen(save, index + 1)) index += 1;
  return index;
}

/** A shift can be played once the one before it is finished. */
export function isShiftOpen(save: SaveState, cafe: CafeDef, index: number): boolean {
  return index >= 0 && index < cafe.levels.length && index <= shiftsDone(save, cafe);
}

/** The shift the Play button starts: the first one not finished yet, or the last one. */
export function nextShift(save: SaveState, cafe: CafeDef): number {
  return Math.min(shiftsDone(save, cafe), cafe.levels.length - 1);
}

export function totalStars(save: SaveState, cafe: CafeDef): number {
  return (save.cafes[cafe.id]?.stars ?? []).reduce((sum, n) => sum + n, 0);
}

/** Levels the player can play now. */
function openLevels(save: SaveState, cafe: CafeDef): LevelDef[] {
  return cafe.levels.filter((_, index) => isShiftOpen(save, cafe, index));
}

/** Stations the player has reached, in kitchen order. Upgrades for them show in the shop. */
export function stationsReached(save: SaveState, cafe: CafeDef): string[] {
  const reached = new Set(openLevels(save, cafe).flatMap((level) => kitchenFor(cafe, level.menu).stations));
  return cafe.stations.map((s) => s.id).filter((id) => reached.has(id));
}

/** Upgrades and settings, turned into how the kitchen works in a shift. */
export function setupFor(save: SaveState, cafe: CafeDef): KitchenSetup {
  const progress = save.cafes[cafe.id];
  const setup: KitchenSetup = { ...defaultSetup, extraSlots: {}, speed: {}, relaxed: save.settings.relaxed };
  if (!progress) return setup;
  for (const upgrade of cafe.upgrades) {
    const steps = Math.min(progress.upgrades[upgrade.id] ?? 0, upgrade.prices.length);
    if (steps <= 0) continue;
    if (upgrade.kind === 'slot') setup.extraSlots[upgrade.station] = (setup.extraSlots[upgrade.station] ?? 0) + steps;
    else setup.speed[upgrade.station] = (setup.speed[upgrade.station] ?? 1) * balance.speedStep ** steps;
  }
  setup.patience = 1 + cafe.decor.filter((d) => progress.decor.includes(d.id)).reduce((sum, d) => sum + d.patience, 0);
  return setup;
}

/** The All-Day Café opens after a few shifts. */
export function isEndlessOpen(save: SaveState, cafe: CafeDef): boolean {
  return shiftsDone(save, cafe) >= cafe.endless.after;
}

/** Dishes and guests for the All-Day Café: everything from the shifts finished so far. */
export function endlessMenu(save: SaveState, cafe: CafeDef): { menu: string[]; who: string[] } {
  const finished = cafe.levels.slice(0, Math.max(1, shiftsDone(save, cafe)));
  const menu = new Set(finished.flatMap((level) => level.menu));
  const who = new Set(finished.flatMap((level) => level.who));
  return {
    menu: cafe.dishes.map((d) => d.id).filter((id) => menu.has(id)),
    who: [...who],
  };
}

export interface ShiftRecord {
  /** Stars this time, and whether this beat the best so far for the shift. */
  stars: number;
  newBest: boolean;
  /** The next shift opened for the first time. */
  opened: number | null;
  /** The All-Day Café opened for the first time. */
  endlessOpened: boolean;
}

/** Adds a finished shift to the player's progress: coins, stars, best score. */
export function recordShift(
  save: SaveState,
  cafe: CafeDef,
  index: number,
  result: { coins: number; stars: number; served: number },
): ShiftRecord {
  const progress = progressOf(save, cafe);
  const doneBefore = shiftsDone(save, cafe);
  const endlessBefore = isEndlessOpen(save, cafe);
  const coins = Math.max(0, Math.floor(result.coins));
  const newBest = coins > (progress.best[index] ?? 0);
  progress.stars[index] = Math.max(progress.stars[index] ?? 0, Math.min(3, Math.max(1, result.stars)));
  progress.best[index] = Math.max(progress.best[index] ?? 0, coins);
  addEarnings(save, coins, result.served);
  const doneAfter = shiftsDone(save, cafe);
  return {
    stars: result.stars,
    newBest,
    opened: doneAfter > doneBefore && doneAfter < cafe.levels.length ? doneAfter : null,
    endlessOpened: !endlessBefore && isEndlessOpen(save, cafe),
  };
}

/** Adds a day in the All-Day Café. Returns true for a new best. */
export function recordEndless(save: SaveState, cafe: CafeDef, result: { coins: number; served: number; relaxed: boolean }): boolean {
  const progress = progressOf(save, cafe);
  addEarnings(save, Math.max(0, Math.floor(result.coins)), result.served);
  const key = result.relaxed ? 'endlessBestRelaxed' : 'endlessBest';
  if (result.served <= progress[key]) return false;
  progress[key] = result.served;
  return true;
}

function addEarnings(save: SaveState, coins: number, served: number): void {
  save.coins += coins;
  save.stats.shifts += 1;
  save.stats.guestsServed += Math.max(0, served);
  save.stats.coinsEarned += coins;
}

/** Guests coming in this shift who the player has not met yet. Marks them as met. */
export function meetGuests(save: SaveState, who: string[]): string[] {
  const fresh = who.filter((id) => !save.seen.guests.includes(id));
  save.seen.guests.push(...fresh);
  return fresh;
}
