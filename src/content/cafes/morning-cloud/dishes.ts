import type { DishDef } from '../../types';

/**
 * The menu. `parts` are put together on a plate on the board, in any order.
 * Dishes with no parts are served straight from their station.
 */
export const dishes: DishDef[] = [
  { id: 'sky-tea', parts: [], price: 5 },
  { id: 'fluffy-pancake', parts: [], price: 6 },
  { id: 'berry-pancake', parts: ['fluffy-pancake', 'strawberries'], price: 9 },
  { id: 'cloud-cocoa', parts: ['hot-cocoa', 'cream'], price: 8 },
  { id: 'berry-toast', parts: ['toast', 'strawberries'], price: 8 },
  { id: 'sunny-toast', parts: ['toast', 'sunny-egg'], price: 11 },
];
