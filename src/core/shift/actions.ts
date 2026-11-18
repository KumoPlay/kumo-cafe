import { balance, getCook, getDish, getIngredient } from '../../content';
import type { Result } from '../result';
import { anchor, type ShiftEvent } from './events';
import { deliver, guestsWanting } from './guests';
import { choosePlate, fitsPlate, plateDish } from './plates';
import { findGuest, type CookStation, type ShiftState } from './state';

/**
 * What the player can do. Every tap is applied to the rules at once, so fast
 * tapping is never lost; the screen animates afterwards from the events.
 */
export type ShiftResult = Result<ShiftEvent>;

const ok = (events: ShiftEvent[]): ShiftResult => ({ ok: true, events });
const fail = (reason: Extract<ShiftResult, { ok: false }>['reason']): ShiftResult => ({ ok: false, reason });

function startCooking(state: ShiftState, station: CookStation, slot: number, input: string): string | null {
  const cook = getCook(state.cafe, station.id, input);
  if (!cook) return null;
  const timeMs = cook.timeMs * (state.setup.speed[station.id] ?? 1);
  station.slots[slot] = { input, output: cook.output, startedAt: state.time, readyAt: state.time + timeMs, ready: false };
  return cook.output;
}

/** A spot was emptied: the next thing waiting in the station's queue starts cooking there. */
function startQueued(state: ShiftState, station: CookStation, slot: number, events: ShiftEvent[]): void {
  const next = station.queue.shift();
  if (next && startCooking(state, station, slot, next)) {
    events.push({ type: 'cook-start', station: station.id, slot, item: next, from: anchor.slot(station.id, slot) });
  }
}

/** Tap a jar: the ingredient goes to its station, or onto the best plate if it is a topping. */
export function tapJar(state: ShiftState, id: string): ShiftResult {
  if (state.done) return fail('done');
  const ingredient = getIngredient(state.cafe, id);
  if (!ingredient || !state.jars.includes(id)) return fail('locked');
  const from = anchor.jar(id);

  const station = state.cooks[ingredient.goesTo];
  if (station) {
    const slot = station.slots.indexOf(null);
    if (slot >= 0) {
      startCooking(state, station, slot, id);
      return ok([{ type: 'cook-start', station: station.id, slot, item: id, from }]);
    }
    if (station.queue.length < balance.stationQueue) {
      station.queue.push(id);
      return ok([{ type: 'queued', station: station.id, item: id, from }]);
    }
    return fail('busy');
  }

  const plate = choosePlate(state, id);
  if (plate < 0) return fail('no-plate');
  state.plates[plate]?.parts.push(id);
  return ok([{ type: 'plated', item: id, plate, from }]);
}

/**
 * Tap something cooked: it goes to the guest who has waited longest for it,
 * or, when nobody wants it on its own, onto a plate where it fits.
 */
export function tapSlot(state: ShiftState, stationId: string, slot: number): ShiftResult {
  if (state.done) return fail('done');
  const station = state.cooks[stationId];
  const cooking = station?.slots[slot];
  if (!station || !cooking) return fail('empty');
  if (state.time < cooking.readyAt) return fail('not-ready');

  const from = anchor.slot(stationId, slot);
  const item = cooking.output;
  const events: ShiftEvent[] = [];
  const servedStraight = getDish(state.cafe, item)?.parts.length === 0 && state.level.menu.includes(item);
  const guest = servedStraight ? guestsWanting(state, item)[0] : undefined;

  if (guest) {
    station.slots[slot] = null;
    deliver(state, guest, item, from, events);
  } else {
    const plate = choosePlate(state, item);
    if (plate < 0) return fail('nobody-wants');
    station.slots[slot] = null;
    state.plates[plate]?.parts.push(item);
    events.push({ type: 'plated', item, plate, from });
  }
  startQueued(state, station, slot, events);
  return ok(events);
}

/** Tap a plate: a finished dish goes to the guest who has waited longest for it. */
export function tapPlate(state: ShiftState, index: number): ShiftResult {
  if (state.done) return fail('done');
  const plate = state.plates[index];
  if (!plate || plate.parts.length === 0) return fail('empty');
  const dish = plateDish(state, plate);
  const guest = dish ? guestsWanting(state, dish.id)[0] : undefined;
  if (!dish || !guest) return fail('nobody-wants');
  plate.parts = [];
  const events: ShiftEvent[] = [];
  deliver(state, guest, dish.id, anchor.plate(index), events);
  return ok(events);
}

/** Tap a guest: they get everything that is ready for them, from plates and stations. */
export function tapGuest(state: ShiftState, guestId: number): ShiftResult {
  if (state.done) return fail('done');
  const guest = findGuest(state, guestId);
  if (!guest) return fail('empty');
  const events: ShiftEvent[] = [];

  for (const line of guest.order) {
    if (line.done || guest.servedAt !== null) continue;
    const plateIndex = state.plates.findIndex((plate) => plateDish(state, plate)?.id === line.dish);
    const plate = state.plates[plateIndex];
    if (plate) {
      plate.parts = [];
      deliver(state, guest, line.dish, anchor.plate(plateIndex), events);
      continue;
    }
    const servedStraight = getDish(state.cafe, line.dish)?.parts.length === 0;
    if (!servedStraight) continue;
    for (const station of Object.values(state.cooks)) {
      const slot = station.slots.findIndex((s) => s !== null && s.output === line.dish && state.time >= s.readyAt);
      if (slot < 0) continue;
      station.slots[slot] = null;
      deliver(state, guest, line.dish, anchor.slot(station.id, slot), events);
      startQueued(state, station, slot, events);
      break;
    }
  }
  return events.length > 0 ? ok(events) : fail('nothing-ready');
}

/** Throw away something finished that nobody needs, to free its spot. Food is free, so nothing is lost. */
export function clearSlot(state: ShiftState, stationId: string, slot: number): ShiftResult {
  if (state.done) return fail('done');
  const station = state.cooks[stationId];
  const cooking = station?.slots[slot];
  if (!station || !cooking) return fail('empty');
  if (state.time < cooking.readyAt) return fail('not-ready');
  station.slots[slot] = null;
  const events: ShiftEvent[] = [{ type: 'slot-cleared', station: stationId, slot }];
  startQueued(state, station, slot, events);
  return ok(events);
}

/** Empty a plate nobody needs. */
export function clearPlate(state: ShiftState, index: number): ShiftResult {
  if (state.done) return fail('done');
  const plate = state.plates[index];
  if (!plate || plate.parts.length === 0) return fail('empty');
  plate.parts = [];
  return ok([{ type: 'cleared', plate: index }]);
}

/** Where a dragged thing came from, and where it was dropped. */
export type DragSource = { kind: 'slot'; station: string; slot: number } | { kind: 'plate'; plate: number };
export type DropTarget = { kind: 'guest'; guest: number } | { kind: 'plate'; plate: number };

/** Drag and drop: the player chooses the guest or plate themselves. */
export function moveItem(state: ShiftState, source: DragSource, target: DropTarget): ShiftResult {
  if (state.done) return fail('done');
  const events: ShiftEvent[] = [];

  if (source.kind === 'slot') {
    const station = state.cooks[source.station];
    const cooking = station?.slots[source.slot];
    if (!station || !cooking) return fail('empty');
    if (state.time < cooking.readyAt) return fail('not-ready');
    const from = anchor.slot(station.id, source.slot);
    const item = cooking.output;
    if (target.kind === 'guest') {
      const guest = findGuest(state, target.guest);
      const wants = guest?.order.some((line) => !line.done && line.dish === item);
      if (!guest || !wants || getDish(state.cafe, item)?.parts.length !== 0) return fail('nobody-wants');
      station.slots[source.slot] = null;
      deliver(state, guest, item, from, events);
    } else {
      const plate = state.plates[target.plate];
      if (!plate || !fitsPlate(state, plate, item)) return fail('no-plate');
      station.slots[source.slot] = null;
      plate.parts.push(item);
      events.push({ type: 'plated', item, plate: target.plate, from });
    }
    startQueued(state, station, source.slot, events);
    return ok(events);
  }

  const plate = state.plates[source.plate];
  if (!plate || plate.parts.length === 0) return fail('empty');
  if (target.kind !== 'guest') return fail('no-plate');
  const dish = plateDish(state, plate);
  const guest = findGuest(state, target.guest);
  if (!dish || !guest || !guest.order.some((line) => !line.done && line.dish === dish.id)) return fail('nobody-wants');
  plate.parts = [];
  deliver(state, guest, dish.id, anchor.plate(source.plate), events);
  return ok(events);
}

/** The All-Day Café: the player closes up for the day. Everything earned is kept. */
export function closeCafe(state: ShiftState): ShiftResult {
  if (state.done) return fail('done');
  if (!state.endless) return fail('locked');
  state.endless.closed = true;
  state.done = true;
  return ok([{ type: 'done' }]);
}
