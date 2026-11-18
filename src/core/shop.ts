import type { CafeDef, DecorDef, UpgradeDef } from '../content';
import { progressOf, shiftsDone, stationsReached, type SaveState } from './progress';

/** Why something cannot be bought. */
export type ShopProblem = 'locked' | 'owned' | 'coins';
export type ShopResult = { ok: true; price: number } | { ok: false; reason: ShopProblem };

/** Steps of an upgrade already bought. */
export function upgradeSteps(save: SaveState, cafe: CafeDef, upgrade: UpgradeDef): number {
  return Math.min(save.cafes[cafe.id]?.upgrades[upgrade.id] ?? 0, upgrade.prices.length);
}

/** The price of the next step, or null when every step is bought. */
export function nextPrice(save: SaveState, cafe: CafeDef, upgrade: UpgradeDef): number | null {
  return upgrade.prices[upgradeSteps(save, cafe, upgrade)] ?? null;
}

/** An upgrade shows in the shop once a shift has used its station. */
export function isUpgradeOpen(save: SaveState, cafe: CafeDef, upgrade: UpgradeDef): boolean {
  return stationsReached(save, cafe).includes(upgrade.station);
}

export function isDecorOpen(save: SaveState, cafe: CafeDef, decor: DecorDef): boolean {
  return shiftsDone(save, cafe) >= decor.after;
}

export function ownsDecor(save: SaveState, cafe: CafeDef, decor: DecorDef): boolean {
  return save.cafes[cafe.id]?.decor.includes(decor.id) ?? false;
}

/** Can this be bought right now? */
export function checkUpgrade(save: SaveState, cafe: CafeDef, upgrade: UpgradeDef): ShopResult {
  if (!isUpgradeOpen(save, cafe, upgrade)) return { ok: false, reason: 'locked' };
  const price = nextPrice(save, cafe, upgrade);
  if (price === null) return { ok: false, reason: 'owned' };
  if (save.coins < price) return { ok: false, reason: 'coins' };
  return { ok: true, price };
}

export function checkDecor(save: SaveState, cafe: CafeDef, decor: DecorDef): ShopResult {
  if (!isDecorOpen(save, cafe, decor)) return { ok: false, reason: 'locked' };
  if (ownsDecor(save, cafe, decor)) return { ok: false, reason: 'owned' };
  if (save.coins < decor.price) return { ok: false, reason: 'coins' };
  return { ok: true, price: decor.price };
}

/** Buys the next step of an upgrade. Changes `save` only when it worked. */
export function buyUpgrade(save: SaveState, cafe: CafeDef, id: string): ShopResult {
  const upgrade = cafe.upgrades.find((u) => u.id === id);
  if (!upgrade) return { ok: false, reason: 'locked' };
  const check = checkUpgrade(save, cafe, upgrade);
  if (!check.ok) return check;
  const progress = progressOf(save, cafe);
  save.coins -= check.price;
  progress.upgrades[id] = upgradeSteps(save, cafe, upgrade) + 1;
  return check;
}

export function buyDecor(save: SaveState, cafe: CafeDef, id: string): ShopResult {
  const decor = cafe.decor.find((d) => d.id === id);
  if (!decor) return { ok: false, reason: 'locked' };
  const check = checkDecor(save, cafe, decor);
  if (!check.ok) return check;
  save.coins -= check.price;
  progressOf(save, cafe).decor.push(id);
  return check;
}
