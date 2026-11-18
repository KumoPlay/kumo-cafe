/**
 * The shapes of all game content. Content files only hold data in these
 * shapes; the rules in src/core read them, so adding a dish, a shift or a
 * whole new café needs no code changes.
 *
 * Ids are lowercase with dashes ("berry-pancake"). An id is also the key for
 * its name in src/i18n/en.ts and the file name of its picture in src/art.
 */

/** Something in a jar at the bottom of the kitchen. Jars never run out. */
export interface IngredientDef {
  id: string;
  /**
   * Where a tap sends it: a cooking station id (batter → griddle), or
   * 'board' for toppings that go straight onto a plate (strawberries).
   */
  goesTo: string;
}

/** A place in the kitchen. */
export interface StationDef {
  id: string;
  /** 'cook' turns one thing into another over time. 'board' holds plates where dishes are put together. */
  kind: 'cook' | 'board';
  /** Cooking spots (or plates, for the board) at the start, before upgrades. */
  slots: number;
}

/** One cooking step: put `input` on `station`, and after `timeMs` it becomes `output`. */
export interface CookDef {
  station: string;
  input: string;
  output: string;
  timeMs: number;
}

/** Something a guest can order. */
export interface DishDef {
  id: string;
  /**
   * What goes on a plate to make it, in any order. Leave it empty for things
   * served straight from a station: the cooked item with the same id as the
   * dish (Sky Tea comes out of the kettle ready to serve).
   */
  parts: string[];
  /** Coins for serving it, before the tip. */
  price: number;
}

/** A guest who visits the café. */
export interface GuestDef {
  id: string;
  /** How long they wait happily, compared with the shift's normal patience (1 = normal). */
  patience: number;
  /** A dish they order a bit more often. */
  favorite?: string;
}

/** One shift (level). */
export interface LevelDef {
  /** Extra help: the next useful tap glows sooner, with a short tip. For the very first shift. */
  tutorial?: boolean;
  /** How many guests come. The shift ends when all of them are served. */
  guests: number;
  /** Seats at the counter. */
  seats: number;
  /** Dishes guests may order. The kitchen shows only the jars and stations these need. */
  menu: string[];
  /** A dish that is new in this shift: ordered more often, and shown on the intro card. */
  featured?: string;
  /** Which guests may come. */
  who: string[];
  /** How likely an order is to have 1, 2 or 3 things: relative weights, [one, two, three]. */
  orderSizes: number[];
  /** Milliseconds until the first guest, and between guests [shortest, longest]. */
  firstGuestMs: number;
  gapMs: [number, number];
  /** How long a guest waits before their last heart is gone, in milliseconds. */
  patienceMs: number;
  /**
   * Coins needed for ★★ and ★★★, in percent of a perfect shift (every guest
   * served with all hearts left, in one long combo). Finishing always gives ★.
   * Orders are planned when the shift starts, so the goals are fair for any order mix.
   */
  stars: [number, number];
}

/** Numbers that shape how every shift feels. */
export interface BalanceDef {
  /** Hearts each guest has. */
  hearts: number;
  /** Tip as a share of the price, by hearts left when served: index 0 = no hearts left. */
  tipByHearts: number[];
  /** Each item handed over gives back this share of a guest's patience. */
  refillPerItem: number;
  /** Combo: guests served in a row with all hearts left. Each step adds this many coins… */
  comboCoins: number;
  /** …up to this combo. */
  comboMax: number;
  /** Things that can wait in line for a busy station. */
  stationQueue: number;
  /** How long a served guest stays to smile before the seat is free. */
  leaveMs: number;
  /** When every seat is empty, the next guest comes at most this soon. */
  idleGapMs: number;
  /** Each speed upgrade multiplies cooking time by this (0.85 = 15% faster). */
  speedStep: number;
  /** Seconds without a useful tap before the helper glow points at the next step. */
  helperAfterMs: number;
  /** The same, in a tutorial shift. */
  tutorialHelperAfterMs: number;
}

/** A kitchen upgrade, bought with coins one step at a time. */
export interface UpgradeDef {
  id: string;
  /** 'slot' adds a cooking spot (or a plate, on the board). 'speed' makes the station cook faster. */
  kind: 'slot' | 'speed';
  station: string;
  /** The price of each step, in order. There are as many steps as prices. */
  prices: number[];
}

/** A decoration for the café. Guests like it there, so they stay patient longer. */
export interface DecorDef {
  id: string;
  price: number;
  /** Extra patience for every guest, as a share: 0.1 = 10% longer. */
  patience: number;
  /** Shifts that must be finished before it shows up in the shop. */
  after: number;
  /**
   * Where it goes, in stage units (the café is 360 wide): on the 'wall' (y from the
   * top of the wall picture) or standing on the 'counter' (y is ignored). `w` is its width.
   */
  place: { on: 'wall' | 'counter'; x: number; y: number; w: number };
}

/** The All-Day Café: endless mode for this café. */
export interface EndlessDef {
  /** Shifts that must be finished before it opens. */
  after: number;
  seats: number;
  patienceMs: number;
  firstGuestMs: number;
  /** Time between guests at the start, [shortest, longest], in milliseconds… */
  gapMs: [number, number];
  /** …multiplied by this after every guest (0.97 = 3% quicker each time)… */
  quicken: number;
  /** …but never quicker than this. */
  fastestGapMs: [number, number];
  /** How likely an order is to have 1, 2 or 3 things, as in a shift. */
  orderSizes: number[];
  /** The café closes for the day when this many guests are waiting outside for a seat. */
  lineLimit: number;
}

/** A café on its own cloud island, with everything it needs. */
export interface CafeDef {
  id: string;
  ingredients: IngredientDef[];
  /** Stations, in the order they appear in the kitchen, top to bottom. */
  stations: StationDef[];
  cooking: CookDef[];
  dishes: DishDef[];
  levels: LevelDef[];
  upgrades: UpgradeDef[];
  decor: DecorDef[];
  endless: EndlessDef;
}
