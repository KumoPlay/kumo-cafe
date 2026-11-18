import type { EndlessDef, LevelDef } from '../../types';

const SEC = 1000;

/**
 * The shifts, in order: shift 1 is the first entry. Each one brings something
 * new (`featured`), then a calmer practice shift or two. Star goals are a
 * percentage of a perfect shift, so they stay fair for any mix of orders.
 * `npm run simulate` plays every shift with pretend players and prints how it went.
 */
export const levels: LevelDef[] = [
  {
    // 1: tea and pancakes, one thing per order, extra help.
    tutorial: true,
    guests: 8,
    seats: 2,
    menu: ['sky-tea', 'fluffy-pancake'],
    who: ['mochi', 'pip'],
    orderSizes: [1],
    firstGuestMs: 1.5 * SEC,
    gapMs: [6 * SEC, 8 * SEC],
    patienceMs: 32 * SEC,
    stars: [55, 80],
  },
  {
    // 2: orders with two things, and a third seat.
    guests: 9,
    seats: 3,
    menu: ['sky-tea', 'fluffy-pancake'],
    who: ['mochi', 'pip', 'fluff'],
    orderSizes: [6, 4],
    firstGuestMs: 1.5 * SEC,
    gapMs: [5 * SEC, 7.5 * SEC],
    patienceMs: 30 * SEC,
    stars: [55, 80],
  },
  {
    // 3: the board, and strawberries on top.
    guests: 9,
    seats: 3,
    menu: ['sky-tea', 'fluffy-pancake', 'berry-pancake'],
    featured: 'berry-pancake',
    who: ['mochi', 'pip', 'fluff'],
    orderSizes: [6, 4],
    firstGuestMs: 1.5 * SEC,
    gapMs: [5 * SEC, 7.5 * SEC],
    patienceMs: 30 * SEC,
    stars: [55, 80],
  },
  {
    // 4: guests come a little quicker. Sora the sky whale visits.
    guests: 10,
    seats: 3,
    menu: ['sky-tea', 'fluffy-pancake', 'berry-pancake'],
    who: ['mochi', 'pip', 'fluff', 'sora'],
    orderSizes: [5, 5],
    firstGuestMs: 1.5 * SEC,
    gapMs: [4.5 * SEC, 7 * SEC],
    patienceMs: 28 * SEC,
    stars: [55, 80],
  },
  {
    // 5: cocoa with whipped cream. The All-Day Café opens after this shift.
    guests: 10,
    seats: 3,
    menu: ['sky-tea', 'fluffy-pancake', 'berry-pancake', 'cloud-cocoa'],
    featured: 'cloud-cocoa',
    who: ['mochi', 'pip', 'fluff', 'sora'],
    orderSizes: [6, 4],
    firstGuestMs: 1.5 * SEC,
    gapMs: [5 * SEC, 7 * SEC],
    patienceMs: 28 * SEC,
    stars: [55, 80],
  },
  {
    // 6: practice. Luma the moth visits.
    guests: 11,
    seats: 3,
    menu: ['sky-tea', 'fluffy-pancake', 'berry-pancake', 'cloud-cocoa'],
    who: ['mochi', 'pip', 'fluff', 'sora', 'luma'],
    orderSizes: [5, 5],
    firstGuestMs: 1.5 * SEC,
    gapMs: [4.5 * SEC, 6.5 * SEC],
    patienceMs: 27 * SEC,
    stars: [55, 80],
  },
  {
    // 7: the toaster, and berry toast.
    guests: 11,
    seats: 3,
    menu: ['sky-tea', 'fluffy-pancake', 'berry-pancake', 'cloud-cocoa', 'berry-toast'],
    featured: 'berry-toast',
    who: ['mochi', 'pip', 'fluff', 'sora', 'luma'],
    orderSizes: [6, 4],
    firstGuestMs: 1.5 * SEC,
    gapMs: [5 * SEC, 7 * SEC],
    patienceMs: 28 * SEC,
    stars: [55, 80],
  },
  {
    // 8: practice.
    guests: 12,
    seats: 3,
    menu: ['sky-tea', 'fluffy-pancake', 'berry-pancake', 'cloud-cocoa', 'berry-toast'],
    who: ['mochi', 'pip', 'fluff', 'sora', 'luma'],
    orderSizes: [5, 5],
    firstGuestMs: 1.5 * SEC,
    gapMs: [4.5 * SEC, 6.5 * SEC],
    patienceMs: 27 * SEC,
    stars: [55, 80],
  },
  {
    // 9: orders with three things. Bao the flying squirrel visits.
    guests: 12,
    seats: 3,
    menu: ['sky-tea', 'fluffy-pancake', 'berry-pancake', 'cloud-cocoa', 'berry-toast'],
    who: ['mochi', 'pip', 'fluff', 'sora', 'luma', 'bao'],
    orderSizes: [4, 5, 2],
    firstGuestMs: 1.5 * SEC,
    gapMs: [5 * SEC, 7 * SEC],
    patienceMs: 29 * SEC,
    stars: [55, 80],
  },
  {
    // 10: sunny toast: the toaster and the griddle together.
    guests: 12,
    seats: 3,
    menu: ['sky-tea', 'fluffy-pancake', 'berry-pancake', 'cloud-cocoa', 'berry-toast', 'sunny-toast'],
    featured: 'sunny-toast',
    who: ['mochi', 'pip', 'fluff', 'sora', 'luma', 'bao'],
    orderSizes: [5, 5, 1],
    firstGuestMs: 1.5 * SEC,
    gapMs: [5 * SEC, 7 * SEC],
    patienceMs: 29 * SEC,
    stars: [55, 80],
  },
  {
    // 11: the whole menu.
    guests: 13,
    seats: 3,
    menu: ['sky-tea', 'fluffy-pancake', 'berry-pancake', 'cloud-cocoa', 'berry-toast', 'sunny-toast'],
    who: ['mochi', 'pip', 'fluff', 'sora', 'luma', 'bao'],
    orderSizes: [4, 5, 2],
    firstGuestMs: 1.5 * SEC,
    gapMs: [4.5 * SEC, 6.5 * SEC],
    patienceMs: 28 * SEC,
    stars: [55, 80],
  },
  {
    // 12: the morning rush: guests come quicker, with smaller orders.
    guests: 13,
    seats: 3,
    menu: ['sky-tea', 'fluffy-pancake', 'berry-pancake', 'cloud-cocoa', 'berry-toast', 'sunny-toast'],
    who: ['mochi', 'pip', 'fluff', 'sora', 'luma', 'bao'],
    orderSizes: [6, 4, 1],
    firstGuestMs: 1.5 * SEC,
    gapMs: [3.5 * SEC, 5.5 * SEC],
    patienceMs: 27 * SEC,
    stars: [55, 80],
  },
  {
    // 13: big orders, with a little more time between guests.
    guests: 14,
    seats: 3,
    menu: ['sky-tea', 'fluffy-pancake', 'berry-pancake', 'cloud-cocoa', 'berry-toast', 'sunny-toast'],
    who: ['mochi', 'pip', 'fluff', 'sora', 'luma', 'bao'],
    orderSizes: [3, 5, 3],
    firstGuestMs: 1.5 * SEC,
    gapMs: [5 * SEC, 7 * SEC],
    patienceMs: 29 * SEC,
    stars: [55, 80],
  },
  {
    // 14: everything, a bit quicker.
    guests: 14,
    seats: 3,
    menu: ['sky-tea', 'fluffy-pancake', 'berry-pancake', 'cloud-cocoa', 'berry-toast', 'sunny-toast'],
    who: ['mochi', 'pip', 'fluff', 'sora', 'luma', 'bao'],
    orderSizes: [4, 5, 2],
    firstGuestMs: 1.5 * SEC,
    gapMs: [4 * SEC, 6 * SEC],
    patienceMs: 27 * SEC,
    stars: [55, 80],
  },
  {
    // 15: the big day. Everyone comes.
    guests: 15,
    seats: 3,
    menu: ['sky-tea', 'fluffy-pancake', 'berry-pancake', 'cloud-cocoa', 'berry-toast', 'sunny-toast'],
    who: ['mochi', 'pip', 'fluff', 'sora', 'luma', 'bao'],
    orderSizes: [4, 5, 2],
    firstGuestMs: 1.5 * SEC,
    gapMs: [4 * SEC, 6 * SEC],
    patienceMs: 27 * SEC,
    stars: [55, 80],
  },
];

/**
 * The All-Day Café (endless mode). Guests keep coming, a little quicker each
 * time, with every dish learned so far. The day ends when the player closes
 * the café, or when the line outside gets long.
 */
export const endless: EndlessDef = {
  after: 5,
  seats: 3,
  patienceMs: 27 * SEC,
  firstGuestMs: 1.5 * SEC,
  gapMs: [7 * SEC, 9 * SEC],
  quicken: 0.985,
  fastestGapMs: [2.5 * SEC, 3.5 * SEC],
  orderSizes: [5, 4, 1],
  lineLimit: 6,
};
