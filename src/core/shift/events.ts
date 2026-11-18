/**
 * Places in the kitchen, as short names the screen can find again
 * (each one is a data-anchor attribute in the kitchen view).
 */
export const anchor = {
  jar: (id: string) => `jar:${id}`,
  slot: (station: string, index: number) => `slot:${station}:${index}`,
  plate: (index: number) => `plate:${index}`,
  seat: (index: number) => `seat:${index}`,
};

/** Things that happened, so the screen can animate and play sounds. */
export type ShiftEvent =
  /** Something went onto a station to cook. */
  | { type: 'cook-start'; station: string; slot: number; item: string; from: string }
  /** A tap waited in a station's queue because every spot was busy. */
  | { type: 'queued'; station: string; item: string; from: string }
  /** Something finished cooking and waits, warm, to be picked up. */
  | { type: 'cooked'; station: string; slot: number; item: string }
  /** Something went onto a plate. */
  | { type: 'plated'; item: string; plate: number; from: string }
  /** A plate was emptied. */
  | { type: 'cleared'; plate: number }
  /** Something finished that nobody needed was thrown away. */
  | { type: 'slot-cleared'; station: string; slot: number }
  /** A guest sat down at the counter. */
  | { type: 'seated'; guest: number; who: string; seat: number }
  /** A dish was handed to a guest. */
  | { type: 'delivered'; dish: string; guest: number; seat: number; from: string }
  /** A guest got their whole order. */
  | {
      type: 'served';
      guest: number;
      who: string;
      seat: number;
      hearts: number;
      food: number;
      tip: number;
      combo: number;
      comboBonus: number;
    }
  /** A guest's patience ran out. They keep waiting, calmly. */
  | { type: 'sleepy'; guest: number; seat: number }
  /** A served guest left, and the seat is free. */
  | { type: 'left'; guest: number; seat: number }
  /** Every guest has been served. */
  | { type: 'done' };
