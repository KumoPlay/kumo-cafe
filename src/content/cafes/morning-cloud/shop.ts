import type { DecorDef, UpgradeDef } from '../../types';

/** Kitchen upgrades. Each price is one step; a station shows up in the shop once a shift has used it. */
export const upgrades: UpgradeDef[] = [
  { id: 'griddle-spot', kind: 'slot', station: 'griddle', prices: [260] },
  { id: 'griddle-heat', kind: 'speed', station: 'griddle', prices: [90, 220, 420] },
  { id: 'kettle-spout', kind: 'slot', station: 'kettle', prices: [140, 380] },
  { id: 'kettle-boil', kind: 'speed', station: 'kettle', prices: [90, 240] },
  { id: 'toaster-slot', kind: 'slot', station: 'toaster', prices: [240] },
  { id: 'toaster-warm', kind: 'speed', station: 'toaster', prices: [110, 260] },
  { id: 'board-plate', kind: 'slot', station: 'board', prices: [200] },
];

/**
 * Decorations. Each makes every guest a little more patient, and appears in the
 * café at `place`: on the wall, or standing on the counter between two seats.
 */
export const decor: DecorDef[] = [
  { id: 'flower-pots', price: 120, patience: 0.1, after: 1, place: { on: 'counter', x: 104, y: 0, w: 32 } },
  { id: 'cloud-lamps', price: 220, patience: 0.1, after: 3, place: { on: 'wall', x: 96, y: 26, w: 168 } },
  { id: 'music-box', price: 320, patience: 0.1, after: 5, place: { on: 'counter', x: 224, y: 0, w: 32 } },
  { id: 'rainbow-bunting', price: 440, patience: 0.1, after: 8, place: { on: 'wall', x: 24, y: 30, w: 312 } },
  { id: 'hanging-plants', price: 560, patience: 0.1, after: 11, place: { on: 'wall', x: 0, y: 34, w: 360 } },
];
