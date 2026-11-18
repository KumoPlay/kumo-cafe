import { getDish, plateParts, type DishDef } from '../../content';
import type { Plate, ShiftState } from './state';
import { waitingGuests } from './state';

/** True when every entry of `small` is in `big`, counting repeats. */
export function isSubset(small: readonly string[], big: readonly string[]): boolean {
  const left = [...big];
  for (const item of small) {
    const at = left.indexOf(item);
    if (at < 0) return false;
    left.splice(at, 1);
  }
  return true;
}

function sameParts(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && isSubset(a, b);
}

/** Dishes on this shift's menu. */
export function menuDishes(state: ShiftState): DishDef[] {
  return state.level.menu.map((id) => getDish(state.cafe, id)).filter((dish): dish is DishDef => dish !== undefined);
}

/** The finished dish on a plate, if what is on it makes one. */
export function plateDish(state: ShiftState, plate: Plate): DishDef | undefined {
  if (plate.parts.length === 0) return undefined;
  return menuDishes(state).find((dish) => sameParts(plateParts(dish), plate.parts));
}

/** Can `item` go onto this plate? Only when the result is on its way to a real dish. */
export function fitsPlate(state: ShiftState, plate: Plate, item: string): boolean {
  const next = [...plate.parts, item];
  return menuDishes(state).some((dish) => dish.parts.length > 0 && isSubset(next, dish.parts));
}

/** Dishes that guests at the counter are still waiting for, with repeats. */
export function wantedDishes(state: ShiftState): string[] {
  return waitingGuests(state).flatMap((guest) => guest.order.filter((line) => !line.done).map((line) => line.dish));
}

/**
 * The best plate for `item`, or -1 when none can take it. In order of preference:
 *  3. it finishes a dish somebody is waiting for,
 *  2. it is a step towards a dish somebody is waiting for,
 *  1. it joins something already on a plate,
 *  0. an empty plate.
 */
export function choosePlate(state: ShiftState, item: string): number {
  const wanted = wantedDishes(state);
  const wantedDefs = menuDishes(state).filter((dish) => dish.parts.length > 0 && wanted.includes(dish.id));
  let best = -1;
  let bestScore = -1;
  state.plates.forEach((plate, index) => {
    if (!fitsPlate(state, plate, item)) return;
    const next = [...plate.parts, item];
    const finished = plateDish(state, { parts: next });
    let score = plate.parts.length > 0 ? 1 : 0;
    if (wantedDefs.some((dish) => isSubset(next, dish.parts))) score = 2;
    if (finished && wanted.includes(finished.id)) score = 3;
    if (score > bestScore) {
      best = index;
      bestScore = score;
    }
  });
  return best;
}
