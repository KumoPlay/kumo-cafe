import type { CafeDef } from '../../content';
import { isShiftOpen } from '../../core';
import { fmt, s } from '../../i18n';
import { sfx, unlockAudio } from '../../platform/audio';
import { Icon } from '../common/Icon';
import { useSave, type Store } from '../store';

/** Where each shift sits across the path: a gentle zig-zag, as a share of the width. */
const LANES = [0.5, 0.74, 0.5, 0.26];

/** All the shifts of a café, as stepping stones on a cloud path. */
export function LevelMap({ store, cafe, onPick, onBack }: { store: Store; cafe: CafeDef; onPick: (level: number) => void; onBack: () => void }) {
  const save = useSave(store);
  const stars = save.cafes[cafe.id]?.stars ?? [];
  const count = cafe.levels.length;
  const step = 92;
  const height = count * step + 40;
  const points = cafe.levels.map((_, i) => ({ x: (LANES[i % LANES.length] ?? 0.5) * 340 + 10, y: height - 60 - i * step }));
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x} ${p.y}`).join(' ');

  return (
    <main class="map">
      <header class="top-row">
        <button class="round-button" onClick={onBack} aria-label={s.back}>
          <Icon name="ui/back" />
        </button>
        <h1 class="screen-title">{s.map.title}</h1>
        <div class="hud-pill">
          <Icon name="ui/star" />
          <span>{stars.reduce((a, b) => a + b, 0)}</span>
        </div>
      </header>
      <div
        class="map-scroll"
        ref={(el) => {
          // Start at the newest open shift.
          if (el && !el.dataset.placed) {
            el.dataset.placed = '1';
            const open = Math.min(count - 1, stars.filter((n) => n > 0).length);
            el.scrollTop = Math.max(0, (points[open]?.y ?? 0) - el.clientHeight / 2);
          }
        }}
      >
        <div class="map-path" style={{ height: `${height}px` }}>
          <svg class="map-line" viewBox={`0 0 360 ${height}`} aria-hidden="true">
            <path d={path} />
          </svg>
          {points.map((point, i) => {
            const open = isShiftOpen(save, cafe, i);
            const got = stars[i] ?? 0;
            return (
              <button
                key={i}
                class={`map-node${open ? '' : ' map-node-locked'}${got > 0 ? ' map-node-done' : ''}`}
                style={{ left: `${point.x}px`, top: `${point.y}px` }}
                aria-label={
                  open ? `${fmt(s.map.shift, { n: i + 1 })}, ${fmt(s.map.stars, { n: got })}` : fmt(s.map.locked, { n: i })
                }
                onClick={() => {
                  unlockAudio();
                  if (!open) return sfx.nope();
                  sfx.tap();
                  onPick(i);
                }}
              >
                {open ? <span class="map-number">{i + 1}</span> : <Icon name="ui/lock" />}
                {cafe.levels[i]?.featured && open && <Icon name={`items/${cafe.levels[i]!.featured}`} class="map-new" />}
                <span class="map-stars" aria-hidden="true">
                  {[0, 1, 2].map((n) => (
                    <Icon key={n} name={n < got ? 'ui/star' : 'ui/star-empty'} />
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </main>
  );
}
