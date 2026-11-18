import type { CookDef, IngredientDef, StationDef } from '../../types';

const SEC = 1000;

/** Jars in the kitchen. `goesTo` is the station a tap sends it to; 'board' means a topping for a plate. */
export const ingredients: IngredientDef[] = [
  { id: 'batter', goesTo: 'griddle' },
  { id: 'egg', goesTo: 'griddle' },
  { id: 'tea-leaves', goesTo: 'kettle' },
  { id: 'cocoa', goesTo: 'kettle' },
  { id: 'bread', goesTo: 'toaster' },
  { id: 'strawberries', goesTo: 'board' },
  { id: 'cream', goesTo: 'board' },
];

/** Stations, top to bottom. Each one is a row in the kitchen, with its jars on the left. */
export const stations: StationDef[] = [
  { id: 'griddle', kind: 'cook', slots: 2 },
  { id: 'kettle', kind: 'cook', slots: 1 },
  { id: 'toaster', kind: 'cook', slots: 1 },
  { id: 'board', kind: 'board', slots: 2 },
];

/** What each station makes, and how long it takes. */
export const cooking: CookDef[] = [
  { station: 'griddle', input: 'batter', output: 'fluffy-pancake', timeMs: 5 * SEC },
  { station: 'griddle', input: 'egg', output: 'sunny-egg', timeMs: 4 * SEC },
  { station: 'kettle', input: 'tea-leaves', output: 'sky-tea', timeMs: 3 * SEC },
  { station: 'kettle', input: 'cocoa', output: 'hot-cocoa', timeMs: 3.5 * SEC },
  { station: 'toaster', input: 'bread', output: 'toast', timeMs: 3.5 * SEC },
];
