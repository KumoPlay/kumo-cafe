import { balance, getDish, getGuest } from '../../content';
import { nextRandom, pickWeighted, randomInt } from '../rng';
import type { ShiftEvent } from './events';
import { heartsLeft, waitingGuests, type Guest, type OrderLine, type PlannedGuest, type ShiftState } from './state';

/** A new order: 1 to 3 dishes from the menu. The shift's new dish and the guest's favourite come up more often. */
function makeOrder(state: ShiftState, who: string): OrderLine[] {
  const { level } = state;
  const sizes = level.orderSizes.slice(0, 3);
  const size = (pickWeighted(state, sizes.map((_, i) => i), (i) => sizes[i] ?? 0) ?? 0) + 1;
  const favorite = getGuest(who)?.favorite;
  const order: OrderLine[] = [];
  for (let i = 0; i < size; i += 1) {
    const dish = pickWeighted(state, level.menu, (id) => (id === level.featured ? 2 : 1) * (id === favorite ? 1.5 : 1));
    if (dish) order.push({ dish, done: false });
  }
  return order;
}

/**
 * Plans every guest of the shift, in the order they come. Guests close
 * together in the line are different characters whenever there are enough.
 */
export function planGuests(state: ShiftState, count: number): PlannedGuest[] {
  const { level } = state;
  const planned: PlannedGuest[] = [];
  const spread = Math.min(level.seats, level.who.length - 1);
  for (let i = 0; i < count; i += 1) {
    const recent = new Set(planned.slice(Math.max(0, i - spread)).map((guest) => guest.who));
    const choices = level.who.filter((id) => !recent.has(id));
    const pool = choices.length > 0 ? choices : level.who;
    const who = pool[Math.floor(nextRandom(state) * pool.length)] ?? level.who[0] ?? '';
    planned.push({ who, order: makeOrder(state, who) });
  }
  return planned;
}

/** Seats the next guest from the line. Skips ahead to someone different if that character is already here. */
function seatGuest(state: ShiftState, seat: number, events: ShiftEvent[]): void {
  // The All-Day Café plans its guests a few at a time, as they are needed.
  if (state.upcoming.length < state.level.seats + 1 && state.endless) {
    state.upcoming.push(...planGuests(state, 10));
  }
  const present = new Set(waitingGuests(state).map((guest) => guest.who));
  const pick = Math.max(0, state.upcoming.findIndex((guest) => !present.has(guest.who)));
  const [next] = state.upcoming.splice(pick, 1);
  if (!next) return;
  const patienceMax = state.level.patienceMs * (getGuest(next.who)?.patience ?? 1) * state.setup.patience;
  const guest: Guest = {
    id: state.nextId++,
    who: next.who,
    seat,
    order: next.order,
    patience: patienceMax,
    patienceMax,
    seatedAt: state.time,
    servedAt: null,
    sleepy: false,
  };
  state.seats[seat] = guest;
  state.line -= 1;
  events.push({ type: 'seated', guest: guest.id, who: guest.who, seat });
}

/** Moves guests along: arrivals join the line, the line fills free seats, served guests leave. */
export function stepGuests(state: ShiftState, dt: number, events: ShiftEvent[]): void {
  const { level } = state;

  // Served guests smile for a moment, then free their seat.
  state.seats.forEach((guest, seat) => {
    if (guest?.servedAt != null && state.time >= guest.servedAt + balance.leaveMs) {
      state.seats[seat] = null;
      events.push({ type: 'left', guest: guest.id, seat });
    }
  });

  // Nobody at the counter and nobody waiting: the next guest does not keep the player waiting long.
  const counterEmpty = state.seats.every((guest) => guest === null);
  if (counterEmpty && state.line === 0 && state.arrived < level.guests && Number.isFinite(state.nextGuestAt)) {
    state.nextGuestAt = Math.min(state.nextGuestAt, state.time + balance.idleGapMs);
  }

  while (state.arrived < level.guests && state.time >= state.nextGuestAt) {
    state.arrived += 1;
    state.line += 1;
    const gap = state.endless?.gapMs ?? level.gapMs;
    state.nextGuestAt += randomInt(state, gap[0], gap[1]);
    if (state.endless) {
      // Every guest makes the next one come a little sooner, down to the fastest pace.
      const { quicken, fastestGapMs } = state.endless;
      state.endless.gapMs = [
        Math.max(fastestGapMs[0], Math.round(gap[0] * quicken)),
        Math.max(fastestGapMs[1], Math.round(gap[1] * quicken)),
      ];
    }
  }

  while (state.line > 0) {
    const free = state.seats.flatMap((guest, seat) => (guest === null ? [seat] : []));
    if (free.length === 0) break;
    const seat = free[Math.floor(nextRandom(state) * free.length)] ?? free[0] ?? 0;
    seatGuest(state, seat, events);
  }

  // Patience runs down only for seated guests, and never in relaxed mode.
  for (const guest of waitingGuests(state)) {
    if (guest.seatedAt === state.time) continue;
    if (!state.setup.relaxed) guest.patience = Math.max(0, guest.patience - dt);
    if (guest.patience <= 0 && !guest.sleepy) {
      guest.sleepy = true;
      events.push({ type: 'sleepy', guest: guest.id, seat: guest.seat });
    }
  }
}

/** Guests waiting for `dish`, the one who has been patient longest first. */
export function guestsWanting(state: ShiftState, dish: string): Guest[] {
  return waitingGuests(state)
    .filter((guest) => guest.order.some((line) => !line.done && line.dish === dish))
    .sort((a, b) => a.patience / a.patienceMax - b.patience / b.patienceMax || a.seatedAt - b.seatedAt);
}

/** Hands `dish` to `guest`. Completing the order serves them. */
export function deliver(state: ShiftState, guest: Guest, dish: string, from: string, events: ShiftEvent[]): void {
  const line = guest.order.find((entry) => !entry.done && entry.dish === dish);
  if (!line) return;
  line.done = true;
  events.push({ type: 'delivered', dish, guest: guest.id, seat: guest.seat, from });
  if (guest.order.every((entry) => entry.done)) {
    serve(state, guest, events);
  } else {
    // Getting part of the order cheers a guest up a little.
    guest.patience = Math.min(guest.patienceMax, guest.patience + guest.patienceMax * balance.refillPerItem);
    if (guest.patience > 0) guest.sleepy = false;
  }
}

function serve(state: ShiftState, guest: Guest, events: ShiftEvent[]): void {
  const hearts = heartsLeft(guest);
  const food = guest.order.reduce((sum, line) => sum + (getDish(state.cafe, line.dish)?.price ?? 0), 0);
  const tip = Math.round(food * (balance.tipByHearts[hearts] ?? 0));
  state.combo = hearts >= balance.hearts ? state.combo + 1 : 0;
  const comboBonus = state.combo >= 2 ? balance.comboCoins * (Math.min(state.combo, balance.comboMax) - 1) : 0;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  state.earned.food += food;
  state.earned.tips += tip;
  state.earned.combo += comboBonus;
  state.served += 1;
  guest.servedAt = state.time;
  events.push({
    type: 'served',
    guest: guest.id,
    who: guest.who,
    seat: guest.seat,
    hearts,
    food,
    tip,
    combo: state.combo,
    comboBonus,
  });
}

