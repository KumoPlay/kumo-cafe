import { describe, expect, it } from 'vitest';
import { cafes } from '../content';
import { playEndless, playShift, styles, type ShiftReport } from './player';

/**
 * Balance guard rails. Each shift is played by pretend players of different
 * speeds (see player.ts), on several random seeds. These tests fail when a
 * change to the content files makes a shift too long, too hard or too easy.
 *
 * To see the full table: npm run simulate
 */
const SEEDS = [1, 2, 3, 4, 5, 6, 7, 8];
const env = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env ?? {};

interface ShiftResults {
  cafe: string;
  shift: number;
  byStyle: Record<string, ShiftReport[]>;
}

const all: ShiftResults[] = cafes.flatMap((cafe) =>
  cafe.levels.map((_, index) => ({
    cafe: cafe.id,
    shift: index + 1,
    byStyle: Object.fromEntries(styles.map((style) => [style.name, SEEDS.map((seed) => playShift(cafe, index, style, seed))])),
  })),
);

const endlessDays = cafes.map((cafe) => ({
  cafe: cafe.id,
  byStyle: Object.fromEntries(styles.map((style) => [style.name, SEEDS.slice(0, 4).map((seed) => playEndless(cafe, style, seed))])),
}));

const average = (runs: ShiftReport[], pick: (r: ShiftReport) => number): number =>
  runs.reduce((sum, r) => sum + pick(r), 0) / runs.length;

if (env.SIM_REPORT) {
  const lines = all.flatMap(({ cafe, shift, byStyle }) => {
    const level = cafes.find((c) => c.id === cafe)?.levels[shift - 1];
    return [
      `\n${cafe}, shift ${shift}: ${level?.guests} guests, ★★ at ${level?.stars[0]}% and ★★★ at ${level?.stars[1]}% of a perfect shift`,
      ...Object.entries(byStyle).map(([name, runs]) => {
        const percent = runs.map((r) => r.percent);
        return (
          `  ${name.padEnd(11)} ${Math.min(...percent)}–${Math.max(...percent)}% (avg ${average(runs, (r) => r.percent).toFixed(0)}%),` +
          ` stars ${runs.map((r) => r.stars).join('')}, ${average(runs, (r) => r.seconds).toFixed(0)} s,` +
          ` best combo ${Math.max(...runs.map((r) => r.bestCombo))}`
        );
      }),
    ];
  });
  for (const { cafe, byStyle } of endlessDays) {
    lines.push(`\n${cafe}, All-Day Café with every dish (guests served before the line fills):`);
    for (const [name, days] of Object.entries(byStyle)) {
      lines.push(`  ${name.padEnd(11)} ${days.map((d) => `${d.served} guests in ${Math.round(d.seconds / 60)} min`).join(', ')}`);
    }
  }
  for (const cafe of cafes) {
    const earned = all.filter((r) => r.cafe === cafe.id).map((r) => Math.round(average(runsOf(r, 'steady'), (x) => x.coins)));
    const shop = shopTotal(cafe.id);
    lines.push(`\n${cafe.id}, coins for a steady player, shift by shift: ${earned.join(', ')}`);
    lines.push(`  ${earned.reduce((a, b) => a + b, 0)} coins for all ${earned.length} shifts; everything in the shop costs ${shop}`);
  }
  console.log(`\nKumo Café pace check, ${SEEDS.length} shifts per player:\n${lines.join('\n')}\n`);
}

function runsOf(results: ShiftResults, style: string): ShiftReport[] {
  return results.byStyle[style] ?? [];
}

/** Coins needed to buy every upgrade and decoration in a café. */
function shopTotal(cafeId: string): number {
  const cafe = cafes.find((c) => c.id === cafeId);
  if (!cafe) return 0;
  return cafe.upgrades.reduce((sum, u) => sum + u.prices.reduce((a, b) => a + b, 0), 0) + cafe.decor.reduce((sum, d) => sum + d.price, 0);
}

describe.each(all.map((r) => [`${r.cafe} shift ${r.shift}`, r] as const))('%s', (_, results) => {
  it('every player finishes, and a steady player takes about one to two minutes', () => {
    for (const runs of Object.values(results.byStyle)) for (const run of runs) expect(run.stars).toBeGreaterThanOrEqual(1);
    const seconds = average(runsOf(results, 'steady'), (r) => r.seconds);
    expect(seconds).toBeGreaterThanOrEqual(45);
    expect(seconds).toBeLessThanOrEqual(150);
  });

  it('a quick player earns three stars, a steady one at least two', () => {
    expect(runsOf(results, 'quick').filter((r) => r.stars === 3).length).toBeGreaterThanOrEqual(SEEDS.length - 1);
    expect(runsOf(results, 'steady').filter((r) => r.stars >= 2).length).toBeGreaterThanOrEqual(SEEDS.length - 2);
  });

  // The first two shifts teach the basics, so everyone may shine there.
  it.skipIf(results.shift <= 2)('three stars take some care', () => {
    expect(runsOf(results, 'unhurried').filter((r) => r.stars === 3).length).toBeLessThanOrEqual(SEEDS.length / 2);
    expect(runsOf(results, 'little kid').filter((r) => r.stars === 3)).toHaveLength(0);
  });
});

describe.each(endlessDays.map((d) => [d.cafe, d] as const))('%s All-Day Café', (_, days) => {
  it('lasts a few minutes for a steady player, and always ends, even for a quick one', () => {
    for (const day of days.byStyle.steady ?? []) expect(day.seconds).toBeGreaterThanOrEqual(180);
    for (const day of days.byStyle.quick ?? []) expect(day.seconds).toBeLessThan(20 * 60);
  });
});

describe.each(cafes.map((cafe) => [cafe.id, cafe] as const))('%s shop', (id, cafe) => {
  const earned = all.filter((r) => r.cafe === id).map((r) => average(runsOf(r, 'steady'), (x) => x.coins));
  const cheapest = Math.min(...cafe.upgrades.map((u) => u.prices[0] ?? Infinity), ...cafe.decor.map((d) => d.price));

  it('something can be bought after the first shift', () => {
    expect(earned[0] ?? 0).toBeGreaterThanOrEqual(cheapest);
  });

  it('buying everything takes about one to two times through the café', () => {
    const total = earned.reduce((a, b) => a + b, 0);
    expect(shopTotal(id)).toBeGreaterThan(total * 0.8);
    expect(shopTotal(id)).toBeLessThan(total * 2);
  });
});
