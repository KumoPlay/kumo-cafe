import { describe, expect, it } from 'vitest';
import { morningCloud } from '../../content/cafes/morning-cloud';
import { newSave } from '../progress';
import {
  decodeSaveCode,
  encodeSaveCode,
  exportSaveCode,
  importSaveCode,
  migrateSave,
  normalizeState,
  openSave,
  SAVE_VERSION,
  SaveError,
  toSaveFile,
  type SaveFile,
} from '.';

function errorCode(run: () => unknown): string | null {
  try {
    run();
    return null;
  } catch (error) {
    return error instanceof SaveError ? error.code : 'other';
  }
}

describe('save files', () => {
  it('open again exactly as they were saved', () => {
    const save = newSave();
    save.coins = 321;
    save.cafes['morning-cloud']!.stars[0] = 3;
    save.cafes['morning-cloud']!.stars[1] = 2;
    save.cafes['morning-cloud']!.best[0] = 140;
    save.cafes['morning-cloud']!.upgrades['griddle-heat'] = 2;
    save.cafes['morning-cloud']!.decor = ['flower-pots'];
    save.cafes['morning-cloud']!.endlessBest = 23;
    save.settings = { sound: false, relaxed: true };
    save.seen = { installHint: true, guests: ['mochi', 'pip'] };
    const opened = openSave(JSON.parse(JSON.stringify(toSaveFile(save, 7))));
    expect(opened).toEqual({ state: save, rev: 7 });
  });

  it('repair damaged or strange values instead of failing', () => {
    const save = normalizeState({
      coins: -50,
      cafes: {
        'morning-cloud': {
          stars: [3, 9, 'x', 2],
          upgrades: { 'griddle-heat': 99, 'no-such-upgrade': 1 },
          decor: ['flower-pots', 'flower-pots', 'gold-throne'],
          endlessBest: Number.NaN,
        },
        'unknown-cafe': { stars: [3] },
      },
      settings: { relaxed: 'yes' },
      seen: { guests: ['mochi', 'stranger'] },
    });
    const cafe = save.cafes['morning-cloud']!;
    expect(save.coins).toBe(0);
    // Shift 3 has no stars, so shift 4's stars cannot count.
    expect(cafe.stars.slice(0, 5)).toEqual([3, 3, 0, 0, 0]);
    expect(cafe.stars).toHaveLength(morningCloud.levels.length);
    expect(cafe.upgrades).toEqual({ 'griddle-heat': 3 });
    expect(cafe.decor).toEqual(['flower-pots']);
    expect(cafe.endlessBest).toBe(0);
    expect(save.cafes['unknown-cafe']).toBeUndefined();
    expect(save.settings).toEqual({ sound: true, relaxed: false });
    expect(save.seen.guests).toEqual(['mochi']);
  });

  it('refuse things that are not saves', () => {
    expect(errorCode(() => openSave('hello'))).toBe('not-a-save');
    expect(errorCode(() => openSave({ app: 'kumo-farm', v: 2, rev: 1, state: {} }))).toBe('other-game');
    expect(errorCode(() => openSave({ app: 'kumo-cafe', v: 1, rev: 1, state: 'scrambled' }))).toBe('corrupt');
  });

  it('refuse a save from a newer version of the game, rather than damage it', () => {
    expect(errorCode(() => openSave({ ...toSaveFile(newSave(), 1), v: SAVE_VERSION + 1 }))).toBe('too-new');
  });
});

describe('upgrading old saves', () => {
  const file = (v: number, state: Record<string, unknown>): SaveFile => ({ app: 'kumo-cafe', v, rev: 1, state });

  it('runs every step from the old version to the current one, in order', () => {
    const table = {
      1: (state: Record<string, unknown>) => ({ ...state, steps: ['one'] }),
      2: (state: Record<string, unknown>) => ({ ...state, steps: [...(state.steps as string[]), 'two'] }),
    };
    const original = file(1, { coins: 5 });
    expect(migrateSave(original, table, 3)).toEqual({ ...original, v: 3, state: { coins: 5, steps: ['one', 'two'] } });
    // The file it was given is left as it was.
    expect(original.state).toEqual({ coins: 5 });
  });

  it('calls a save corrupt when a step is missing or fails', () => {
    expect(errorCode(() => migrateSave(file(1, {}), {}, 2))).toBe('corrupt');
    const broken = {
      1: () => {
        throw new Error('nope');
      },
    };
    expect(errorCode(() => migrateSave(file(1, {}), broken, 2))).toBe('corrupt');
  });

  it('leaves a current save alone', () => {
    const current = file(SAVE_VERSION, { coins: 1 });
    expect(migrateSave(current)).toEqual(current);
  });
});

describe('backup codes', () => {
  it('turn progress into text and back', () => {
    const save = newSave();
    save.coins = 99;
    const code = exportSaveCode(save, 4);
    expect(code).toMatch(/^KUMO1\./);
    expect(importSaveCode(`  ${code.slice(0, 20)}\n${code.slice(20)}  `)).toEqual({ state: save, rev: 4 });
  });

  it('notice a code that was cut short or changed', () => {
    const code = encodeSaveCode(toSaveFile(newSave(), 1));
    expect(errorCode(() => decodeSaveCode(code.slice(0, -3)))).toBe('corrupt');
    expect(errorCode(() => decodeSaveCode(code.replace('KUMO1.e', 'KUMO1.f')))).toBe('corrupt');
    expect(errorCode(() => decodeSaveCode('hello there'))).toBe('not-a-save');
  });

  it('say kindly when a code is from another KumoPlay game', () => {
    const farm = encodeSaveCode({ app: 'kumo-farm', v: 2, rev: 1, state: {} } as unknown as SaveFile);
    expect(errorCode(() => importSaveCode(farm))).toBe('other-game');
  });
});
