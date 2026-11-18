import { cookFor, getDish, getIngredient, plateParts, type DishDef } from '../../content';
import { choosePlate, fitsPlate, isSubset, plateDish } from './plates';
import { waitingGuests, type ShiftState } from './state';

/** A tap that would help right now. */
export type Suggestion =
  | { kind: 'jar'; id: string }
  | { kind: 'slot'; station: string; slot: number }
  | { kind: 'plate'; plate: number }
  | { kind: 'clear-slot'; station: string; slot: number }
  | { kind: 'clear-plate'; plate: number };

/** Is this item needed by a guest at the counter, on its own or as part of a dish? */
export function isNeeded(state: ShiftState, item: string): boolean {
  return waitingGuests(state).some((guest) =>
    guest.order.some((line) => {
      if (line.done) return false;
      const dish = getDish(state.cafe, line.dish);
      return dish !== undefined && plateParts(dish).includes(item);
    }),
  );
}

/** Is what is on this plate on its way to something a guest at the counter wants? */
export function isPlateNeeded(state: ShiftState, parts: string[]): boolean {
  if (parts.length === 0) return true;
  return waitingGuests(state).some((guest) =>
    guest.order.some((line) => {
      if (line.done) return false;
      const dish = getDish(state.cafe, line.dish);
      return dish !== undefined && isSubset(parts, plateParts(dish));
    }),
  );
}

/**
 * The next useful tap, or null when there is nothing useful to do. The kitchen
 * uses it for the helper glow, and the pretend players in src/sim use it to play.
 * In order: hand over what is finished, move cooked parts onto plates, add
 * toppings, start cooking what is still missing, and prepare a plate.
 */
export function suggestTap(state: ShiftState): Suggestion | null {
  if (state.done) return null;
  const { cafe } = state;
  const wants = waitingGuests(state)
    .sort((a, b) => a.patience / a.patienceMax - b.patience / b.patienceMax)
    .flatMap((guest) => guest.order.filter((line) => !line.done).map((line) => line.dish));
  if (wants.length === 0) return null;
  const isReady = (readyAt: number): boolean => state.time >= readyAt;

  // 1. Something finished that somebody is waiting for.
  for (const station of Object.values(state.cooks)) {
    for (let i = 0; i < station.slots.length; i += 1) {
      const slot = station.slots[i];
      if (slot && isReady(slot.readyAt) && wants.includes(slot.output) && getDish(cafe, slot.output)?.parts.length === 0) {
        return { kind: 'slot', station: station.id, slot: i };
      }
    }
  }
  for (let i = 0; i < state.plates.length; i += 1) {
    const dish = plateDish(state, state.plates[i]!);
    if (dish && wants.includes(dish.id)) return { kind: 'plate', plate: i };
  }

  // 2. A cooked part of a wanted dish, ready to go onto a plate.
  const building = wants
    .map((id) => getDish(cafe, id))
    .filter((dish): dish is DishDef => dish !== undefined && dish.parts.length > 0);
  for (const station of Object.values(state.cooks)) {
    for (let i = 0; i < station.slots.length; i += 1) {
      const slot = station.slots[i];
      if (!slot || !isReady(slot.readyAt)) continue;
      const useful = building.some((dish) => dish.parts.includes(slot.output));
      if (useful && state.plates.some((plate) => fitsPlate(state, plate, slot.output))) {
        return { kind: 'slot', station: station.id, slot: i };
      }
    }
  }

  // 3. A topping that finishes or continues a plate on its way to a wanted dish.
  for (const dish of building) {
    for (const part of dish.parts) {
      if (getIngredient(cafe, part)?.goesTo !== 'board' || !state.jars.includes(part)) continue;
      const started = state.plates.some(
        (plate) => plate.parts.length > 0 && isSubset([...plate.parts, part], dish.parts),
      );
      if (started && choosePlate(state, part) >= 0) return { kind: 'jar', id: part };
    }
  }

  // 4. Start cooking what is still missing: count what is needed, minus what is already on its way.
  const needed = new Map<string, number>();
  const add = (item: string, n: number): void => void needed.set(item, (needed.get(item) ?? 0) + n);
  for (const id of wants) {
    const dish = getDish(cafe, id);
    if (!dish) continue;
    for (const part of plateParts(dish)) if (getIngredient(cafe, part)?.goesTo !== 'board') add(part, 1);
  }
  for (const plate of state.plates) for (const part of plate.parts) add(part, -1);
  for (const station of Object.values(state.cooks)) {
    for (const slot of station.slots) if (slot) add(slot.output, -1);
    for (const input of station.queue) {
      const cook = cafe.cooking.find((c) => c.station === station.id && c.input === input);
      if (cook) add(cook.output, -1);
    }
  }
  // `wants` lists the guest who has waited longest first, so their food comes first.
  for (const [output, count] of needed) {
    if (count <= 0) continue;
    const cook = cookFor(cafe, output);
    const station = cook && state.cooks[cook.station];
    if (cook && station && station.slots.includes(null) && state.jars.includes(cook.input)) {
      return { kind: 'jar', id: cook.input };
    }
  }

  // 5. Start a plate with a topping, for a wanted dish that has no plate yet.
  for (const dish of building) {
    const onPlate = state.plates.some((plate) => plate.parts.length > 0 && isSubset(plate.parts, dish.parts));
    if (onPlate) continue;
    const topping = dish.parts.find((part) => getIngredient(cafe, part)?.goesTo === 'board' && state.jars.includes(part));
    if (topping && state.plates.some((plate) => plate.parts.length === 0)) return { kind: 'jar', id: topping };
  }

  // 6. Stuck: a full station holds something nobody needs, while something else is waiting to cook there.
  for (const [output, count] of needed) {
    if (count <= 0) continue;
    const cook = cookFor(cafe, output);
    const station = cook && state.cooks[cook.station];
    if (!station || station.slots.includes(null)) continue;
    const spare = station.slots.findIndex((slot) => slot !== null && isReady(slot.readyAt) && !isNeeded(state, slot.output));
    if (spare >= 0) return { kind: 'clear-slot', station: station.id, slot: spare };
  }
  // …or every plate is taken, some by things nobody needs, and a dish needs a plate.
  if (building.length > 0 && !state.plates.some((plate) => plate.parts.length === 0)) {
    const spare = state.plates.findIndex((plate) => !isPlateNeeded(state, plate.parts));
    if (spare >= 0) return { kind: 'clear-plate', plate: spare };
  }
  return null;
}
