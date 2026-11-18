import type { GuestDef } from './types';

/**
 * The sky folk who visit. Every café shares them; each shift lists who may come.
 * Names are in src/i18n/en.ts (guests), pictures in src/art/guests/<id>.svg.
 */
export const guests: GuestDef[] = [
  // A round, squishy little cloud puff.
  { id: 'mochi', patience: 1, favorite: 'sky-tea' },
  // A tiny round songbird, always in a bit of a flutter.
  { id: 'pip', patience: 0.9, favorite: 'fluffy-pancake' },
  // A curly cloud lamb who is happy to wait.
  { id: 'fluff', patience: 1.15, favorite: 'berry-pancake' },
  // A baby sky whale who floats in for cocoa.
  { id: 'sora', patience: 1.1, favorite: 'cloud-cocoa' },
  // A sleepy moth with star-dust wings.
  { id: 'luma', patience: 1.2, favorite: 'berry-toast' },
  // A flying squirrel in a knitted scarf, always on the go.
  { id: 'bao', patience: 0.9, favorite: 'sunny-toast' },
];
