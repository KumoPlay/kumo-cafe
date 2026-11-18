import { describe, expect, it } from 'vitest';
import { hasArt } from '../art';
import { en } from '../i18n/en';
import { cafes, guests, kitchenFor } from '.';

/**
 * Checks on the content files, so a typo or a missing picture shows up here
 * instead of in the game. Run with `npm test`.
 */
const unique = (ids: string[]): string[] => ids.filter((id, i) => ids.indexOf(id) !== i);
const ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;

describe('guests', () => {
  it('have unique ids, a name, a picture and a sensible patience', () => {
    expect(unique(guests.map((g) => g.id))).toEqual([]);
    for (const guest of guests) {
      expect(guest.id).toMatch(ID);
      expect(en.guests[guest.id], `name for guest ${guest.id}`).toBeTruthy();
      expect(en.guestAbout[guest.id], `about line for guest ${guest.id}`).toBeTruthy();
      expect(hasArt(`guests/${guest.id}`), `picture guests/${guest.id}.svg`).toBe(true);
      expect(guest.patience).toBeGreaterThan(0.5);
      expect(guest.patience).toBeLessThan(2);
      if (guest.favorite) {
        expect(cafes.some((cafe) => cafe.dishes.some((d) => d.id === guest.favorite)), `favorite of ${guest.id}`).toBe(true);
      }
    }
  });
});

for (const cafe of cafes) {
  describe(`café ${cafe.id}`, () => {
    const stationIds = cafe.stations.map((s) => s.id);
    const ingredientIds = cafe.ingredients.map((i) => i.id);
    const outputs = cafe.cooking.map((c) => c.output);
    const items = [...ingredientIds, ...outputs, ...cafe.dishes.map((d) => d.id)];

    it('has a name', () => {
      expect(en.cafes[cafe.id]).toBeTruthy();
    });

    it('uses unique, well-formed ids', () => {
      expect(unique(stationIds)).toEqual([]);
      expect(unique(ingredientIds)).toEqual([]);
      expect(unique(outputs)).toEqual([]);
      expect(unique(cafe.dishes.map((d) => d.id))).toEqual([]);
      for (const id of [...stationIds, ...items]) expect(id).toMatch(ID);
    });

    it('has a board, and every station has a name and pictures', () => {
      expect(cafe.stations.filter((s) => s.kind === 'board')).toHaveLength(1);
      expect(hasArt('stations/plate')).toBe(true);
      for (const station of cafe.stations) {
        expect(en.stations[station.id], `name for station ${station.id}`).toBeTruthy();
        expect(hasArt(`stations/${station.id}`), `picture stations/${station.id}.svg`).toBe(true);
        if (station.kind === 'cook') expect(hasArt(`stations/${station.id}-slot`), `picture stations/${station.id}-slot.svg`).toBe(true);
        expect(station.slots).toBeGreaterThanOrEqual(1);
      }
    });

    it('every ingredient goes somewhere that can take it', () => {
      for (const ingredient of cafe.ingredients) {
        const station = cafe.stations.find((s) => s.id === ingredient.goesTo);
        expect(station, `station for ${ingredient.id}`).toBeDefined();
        if (station?.kind === 'cook') {
          expect(cafe.cooking.some((c) => c.station === station.id && c.input === ingredient.id), `cooking step for ${ingredient.id}`).toBe(true);
        }
      }
    });

    it('every cooking step uses a cooking station and a jar', () => {
      for (const cook of cafe.cooking) {
        expect(cafe.stations.find((s) => s.id === cook.station)?.kind).toBe('cook');
        expect(cafe.ingredients.find((i) => i.id === cook.input)?.goesTo).toBe(cook.station);
        expect(cook.timeMs).toBeGreaterThan(0);
      }
    });

    it('every dish can be made, and is worth making', () => {
      for (const dish of cafe.dishes) {
        expect(dish.price).toBeGreaterThan(0);
        expect(dish.parts.length).toBeLessThanOrEqual(3);
        if (dish.parts.length === 0) {
          expect(outputs, `${dish.id} is served straight from a station, so a station must make it`).toContain(dish.id);
        }
        for (const part of dish.parts) {
          const topping = cafe.ingredients.find((i) => i.id === part)?.goesTo === 'board';
          expect(topping || outputs.includes(part), `${dish.id}: ${part} must be a topping or something cooked`).toBe(true);
        }
      }
    });

    it('every thing has a name and a picture', () => {
      for (const id of new Set(items)) {
        expect(en.items[id], `name for ${id}`).toBeTruthy();
        expect(hasArt(`items/${id}`), `picture items/${id}.svg`).toBe(true);
      }
    });

    it('every upgrade and decoration has a name, and décor has a picture', () => {
      expect(unique([...cafe.upgrades.map((u) => u.id), ...cafe.decor.map((d) => d.id)])).toEqual([]);
      for (const upgrade of cafe.upgrades) {
        expect(en.upgrades[upgrade.id], `name for upgrade ${upgrade.id}`).toBeTruthy();
        expect(stationIds, `station of ${upgrade.id}`).toContain(upgrade.station);
        expect(upgrade.prices.length).toBeGreaterThan(0);
        for (const price of upgrade.prices) expect(price).toBeGreaterThan(0);
      }
      // Never more than three spots on a station, so every row fits on a phone.
      for (const station of cafe.stations) {
        const extra = cafe.upgrades.filter((u) => u.station === station.id && u.kind === 'slot').reduce((n, u) => n + u.prices.length, 0);
        expect(station.slots + extra, `spots on ${station.id}`).toBeLessThanOrEqual(3);
      }
      for (const decor of cafe.decor) {
        expect(en.decor[decor.id], `name for decoration ${decor.id}`).toBeTruthy();
        expect(hasArt(`decor/${decor.id}`), `picture decor/${decor.id}.svg`).toBe(true);
        expect(decor.price).toBeGreaterThan(0);
        expect(decor.after).toBeLessThanOrEqual(cafe.levels.length);
      }
    });

    it('the All-Day Café opens after a shift that exists', () => {
      expect(cafe.endless.after).toBeGreaterThanOrEqual(1);
      expect(cafe.endless.after).toBeLessThanOrEqual(cafe.levels.length);
      expect(cafe.endless.quicken).toBeGreaterThan(0.5);
      expect(cafe.endless.quicken).toBeLessThanOrEqual(1);
      expect(cafe.endless.lineLimit).toBeGreaterThanOrEqual(2);
    });

    cafe.levels.forEach((level, index) => {
      it(`shift ${index + 1} makes sense`, () => {
        expect(level.menu.length).toBeGreaterThan(0);
        for (const id of level.menu) expect(cafe.dishes.some((d) => d.id === id), `dish ${id}`).toBe(true);
        if (level.featured) expect(level.menu).toContain(level.featured);
        expect(level.who.length).toBeGreaterThan(0);
        for (const id of level.who) expect(guests.some((g) => g.id === id), `guest ${id}`).toBe(true);
        expect(level.guests).toBeGreaterThanOrEqual(1);
        expect(level.guests).toBeLessThanOrEqual(30);
        expect(level.seats).toBeGreaterThanOrEqual(1);
        expect(level.seats).toBeLessThanOrEqual(3);
        expect(level.orderSizes.length).toBeGreaterThanOrEqual(1);
        expect(level.orderSizes.length).toBeLessThanOrEqual(3);
        expect(level.orderSizes.reduce((a, b) => a + b, 0)).toBeGreaterThan(0);
        expect(level.gapMs[0]).toBeLessThanOrEqual(level.gapMs[1]);
        expect(level.patienceMs).toBeGreaterThan(0);
        expect(level.stars[0]).toBeGreaterThan(0);
        expect(level.stars[0]).toBeLessThan(level.stars[1]);
        expect(level.stars[1]).toBeLessThanOrEqual(100);
        // The kitchen fits on screen: at most four stations and eight jars.
        const kitchen = kitchenFor(cafe, level.menu);
        expect(kitchen.stations.length).toBeLessThanOrEqual(4);
        expect(kitchen.jars.length).toBeLessThanOrEqual(8);
      });
    });
  });
}

describe('pictures for the screens', () => {
  it('are all there', () => {
    for (const name of ['scene/wall', 'scene/counter', 'scene/cloud', 'app/icon', 'app/kumoplay']) {
      expect(hasArt(name), name).toBe(true);
    }
  });
});
