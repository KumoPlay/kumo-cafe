import type { CSSProperties } from 'preact';
import { art } from '../../art';

/** A picture from src/art, by name: <Icon name="items/batter" />. Decorative unless `label` is given. */
export function Icon({
  name,
  label,
  class: className,
  style,
}: {
  name: string;
  label?: string;
  class?: string;
  style?: CSSProperties;
}) {
  return (
    <img
      class={className ? `icon ${className}` : 'icon'}
      src={art(name)}
      alt={label ?? ''}
      aria-hidden={label ? undefined : true}
      draggable={false}
      style={style}
    />
  );
}
