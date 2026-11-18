import type { CafeDef } from '../../types';
import { dishes } from './dishes';
import { cooking, ingredients, stations } from './kitchen';
import { endless, levels } from './levels';
import { decor, upgrades } from './shop';

/** Morning Cloud: a breakfast café, the first cloud island. */
export const morningCloud: CafeDef = {
  id: 'morning-cloud',
  ingredients,
  stations,
  cooking,
  dishes,
  levels,
  upgrades,
  decor,
  endless,
};
