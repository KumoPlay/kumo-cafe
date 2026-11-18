import type { BalanceDef } from './types';

/** Numbers that shape how every shift feels. See BalanceDef in types.ts for what each one does. */
export const balance: BalanceDef = {
  hearts: 3,
  tipByHearts: [0, 0.1, 0.25, 0.5],
  refillPerItem: 0.2,
  comboCoins: 2,
  comboMax: 5,
  stationQueue: 2,
  leaveMs: 900,
  idleGapMs: 1500,
  speedStep: 0.85,
  helperAfterMs: 6000,
  tutorialHelperAfterMs: 1200,
};
