import { cafes, guests } from '../../content';
import { newCafeProgress, newSave, type CafeProgress, type SaveState } from '../progress';

/**
 * The save format version. Raise it by one whenever the shape of SaveState
 * changes, and add a matching step in migrations.ts.
 */
export const SAVE_VERSION = 1;
export const SAVE_APP = 'kumo-cafe';

/** What is written to storage and into backup codes. */
export interface SaveFile {
  app: typeof SAVE_APP;
  /** Save format version this file was written with. */
  v: number;
  /** Counts up with every save. The highest number is the newest save. */
  rev: number;
  state: unknown;
}

/** 'other-game' is a backup from another KumoPlay game, such as Kumo Farm. */
export type SaveErrorCode = 'not-a-save' | 'other-game' | 'corrupt' | 'too-new';

export class SaveError extends Error {
  readonly code: SaveErrorCode;
  constructor(code: SaveErrorCode) {
    super(`Save problem: ${code}`);
    this.name = 'SaveError';
    this.code = code;
  }
}

export function toSaveFile(state: SaveState, rev: number): SaveFile {
  return { app: SAVE_APP, v: SAVE_VERSION, rev, state };
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Checks the outer wrapper of a save. Throws SaveError when it is not one of ours. */
export function asSaveFile(raw: unknown): SaveFile {
  if (isRecord(raw) && typeof raw.app === 'string' && raw.app !== SAVE_APP) throw new SaveError('other-game');
  if (!isRecord(raw) || raw.app !== SAVE_APP) throw new SaveError('not-a-save');
  if (!Number.isInteger(raw.v) || (raw.v as number) < 0 || !isRecord(raw.state)) throw new SaveError('corrupt');
  return { app: SAVE_APP, v: raw.v as number, rev: wholeNumber(raw.rev, 0), state: raw.state };
}

function wholeNumber(value: unknown, fallback: number, min = 0, max = Number.MAX_SAFE_INTEGER): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(value)));
}

function readList(raw: unknown, length: number, max: number): number[] {
  const list = Array.isArray(raw) ? raw : [];
  return Array.from({ length }, (_, i) => wholeNumber(list[i], 0, 0, max));
}

function readCafe(raw: unknown, cafeId: string): CafeProgress {
  const cafe = cafes.find((c) => c.id === cafeId);
  if (!cafe) throw new Error('unknown café');
  const progress = newCafeProgress(cafe);
  if (!isRecord(raw)) return progress;
  progress.stars = readList(raw.stars, cafe.levels.length, 3);
  // Stars only count for shifts played in order: a gap means the later ones were not really reached.
  const gap = progress.stars.indexOf(0);
  if (gap >= 0) progress.stars = progress.stars.map((n, i) => (i < gap ? n : 0));
  progress.best = readList(raw.best, cafe.levels.length, 1_000_000);
  if (isRecord(raw.upgrades)) {
    for (const upgrade of cafe.upgrades) {
      const steps = wholeNumber(raw.upgrades[upgrade.id], 0, 0, upgrade.prices.length);
      if (steps > 0) progress.upgrades[upgrade.id] = steps;
    }
  }
  const owned = Array.isArray(raw.decor) ? raw.decor : [];
  progress.decor = cafe.decor.map((d) => d.id).filter((id) => owned.includes(id));
  progress.endlessBest = wholeNumber(raw.endlessBest, 0);
  progress.endlessBestRelaxed = wholeNumber(raw.endlessBestRelaxed, 0);
  return progress;
}

/**
 * Turns loaded data into a SaveState the game can trust: missing or broken
 * values get safe defaults, unknown upgrades and decorations are dropped, and
 * numbers are kept in range. Throws SaveError('corrupt') only when there is nothing to work with.
 */
export function normalizeState(raw: unknown): SaveState {
  if (!isRecord(raw)) throw new SaveError('corrupt');
  const save = newSave();
  save.coins = wholeNumber(raw.coins, 0, 0, 10_000_000);
  const rawCafes = isRecord(raw.cafes) ? raw.cafes : {};
  for (const cafe of cafes) save.cafes[cafe.id] = readCafe(rawCafes[cafe.id], cafe.id);
  const settings = isRecord(raw.settings) ? raw.settings : {};
  save.settings = { sound: settings.sound !== false, relaxed: settings.relaxed === true };
  const seen = isRecord(raw.seen) ? raw.seen : {};
  const met = Array.isArray(seen.guests) ? seen.guests : [];
  save.seen = { installHint: seen.installHint === true, guests: guests.map((g) => g.id).filter((id) => met.includes(id)) };
  const stats = isRecord(raw.stats) ? raw.stats : {};
  save.stats = {
    shifts: wholeNumber(stats.shifts, 0),
    guestsServed: wholeNumber(stats.guestsServed, 0),
    coinsEarned: wholeNumber(stats.coinsEarned, 0),
  };
  return save;
}
