import { balance } from './balance';
import { cafes } from './cafes';
import { guests } from './guests';
import type { CafeDef, CookDef, DishDef, GuestDef, IngredientDef, StationDef } from './types';

export { balance, cafes, guests };
export type * from './types';

export function getCafe(id: string): CafeDef | undefined {
  return cafes.find((cafe) => cafe.id === id);
}

export function getGuest(id: string): GuestDef | undefined {
  return guests.find((guest) => guest.id === id);
}

export function getDish(cafe: CafeDef, id: string): DishDef | undefined {
  return cafe.dishes.find((dish) => dish.id === id);
}

export function getIngredient(cafe: CafeDef, id: string): IngredientDef | undefined {
  return cafe.ingredients.find((ingredient) => ingredient.id === id);
}

export function getStation(cafe: CafeDef, id: string): StationDef | undefined {
  return cafe.stations.find((station) => station.id === id);
}

/** The cooking step that takes `input` on `station`. */
export function getCook(cafe: CafeDef, station: string, input: string): CookDef | undefined {
  return cafe.cooking.find((cook) => cook.station === station && cook.input === input);
}

/** The cooking step that makes `output`. */
export function cookFor(cafe: CafeDef, output: string): CookDef | undefined {
  return cafe.cooking.find((cook) => cook.output === output);
}

/** Everything that has to be on a plate for this dish. A dish with no parts is "itself, on its own". */
export function plateParts(dish: DishDef): string[] {
  return dish.parts.length > 0 ? dish.parts : [dish.id];
}

/** What the kitchen needs for a menu: the jars to show and the stations to show, in content order. */
export function kitchenFor(cafe: CafeDef, menu: string[]): { jars: string[]; stations: string[] } {
  const items = new Set<string>();
  for (const id of menu) {
    const dish = getDish(cafe, id);
    if (dish) plateParts(dish).forEach((part) => items.add(part));
  }
  const needsBoard = menu.some((id) => (getDish(cafe, id)?.parts.length ?? 0) > 0);
  const jars = new Set<string>();
  const stations = new Set<string>();
  for (const item of items) {
    const ingredient = getIngredient(cafe, item);
    const cook = cookFor(cafe, item);
    if (ingredient) jars.add(ingredient.id);
    if (cook) {
      jars.add(cook.input);
      stations.add(cook.station);
    }
  }
  if (needsBoard) cafe.stations.filter((station) => station.kind === 'board').forEach((s) => stations.add(s.id));
  return {
    jars: cafe.ingredients.map((i) => i.id).filter((id) => jars.has(id)),
    stations: cafe.stations.map((s) => s.id).filter((id) => stations.has(id)),
  };
}
