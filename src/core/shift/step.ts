import type { ShiftEvent } from './events';
import { stepGuests } from './guests';
import type { ShiftState } from './state';

/**
 * Moves a shift forward by `dt` milliseconds of shift time: cooking finishes,
 * guests arrive, sit, wait and leave. Returns what happened.
 */
export function step(state: ShiftState, dt: number): ShiftEvent[] {
  const events: ShiftEvent[] = [];
  if (state.done || !(dt > 0)) return events;
  state.time += dt;

  for (const station of Object.values(state.cooks)) {
    station.slots.forEach((slot, index) => {
      if (slot && !slot.ready && state.time >= slot.readyAt) {
        slot.ready = true;
        events.push({ type: 'cooked', station: station.id, slot: index, item: slot.output });
      }
    });
  }

  stepGuests(state, dt, events);

  const everyoneGone = state.seats.every((guest) => guest === null);
  const lineFull = state.endless !== null && state.line >= state.endless.lineLimit;
  if ((state.served >= state.level.guests && everyoneGone) || lineFull) {
    state.done = true;
    events.push({ type: 'done' });
  }
  return events;
}
