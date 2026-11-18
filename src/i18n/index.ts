import { en, type Strings } from './en';

/** The text for the current language. English only for now. */
export const s: Strings = en;

/** Fills {placeholders}: fmt('Shift {n}', { n: 3 }) → 'Shift 3'. */
export function fmt(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (whole, key: string) => (key in values ? String(values[key]) : whole));
}

export function itemName(id: string): string {
  return s.items[id] ?? id;
}

export function stationName(id: string): string {
  return s.stations[id] ?? id;
}

export function guestName(id: string): string {
  return s.guests[id] ?? id;
}

/** "Sky Tea, Fluffy Pancake and Berry Pancake" */
export function listNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} ${s.and} ${names[names.length - 1]}`;
}
