/**
 * All the game's pictures live in this folder, one SVG file per picture.
 *
 * To swap in better art, replace a file and keep its name; nothing else needs
 * to change. Content finds its pictures by id:
 *
 *   items/<id>.svg           ingredients, cooked things and dishes (64 × 64)
 *   stations/<id>.svg        a station's icon (64 × 64)
 *   stations/<id>-slot.svg   the spot where things cook on that station (64 × 64)
 *   stations/plate.svg       a plate on the board (64 × 64)
 *   guests/<id>.svg          the guests, head and shoulders (96 × 96)
 *   scene/wall.svg           the café wall behind the guests (360 wide)
 *   scene/counter.svg        the counter in front of the guests (360 × 44)
 *   ui/<name>.svg            buttons and small symbols (64 × 64)
 *   app/icon.svg             the app icon (512 × 512)
 */
const files = import.meta.glob<string>('./**/*.svg', { eager: true, query: '?raw', import: 'default' });

const cache = new Map<string, string>();

/** True when a picture with this name exists, e.g. hasArt('items/batter'). */
export function hasArt(name: string): boolean {
  return `./${name}.svg` in files;
}

export function artNames(): string[] {
  return Object.keys(files).map((path) => path.slice(2, -4));
}

/** A URL for <img src>. Unknown names give a soft placeholder instead of breaking. */
export function art(name: string): string {
  let url = cache.get(name);
  if (!url) {
    const svg = files[`./${name}.svg`] ?? files['./ui/missing.svg'] ?? '';
    url = `data:image/svg+xml,${encodeURIComponent(svg)}`;
    cache.set(name, url);
  }
  return url;
}
