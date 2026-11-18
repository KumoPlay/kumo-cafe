import { useEffect, useState } from 'preact/hooks';
import { cafes, type CafeDef } from '../../content';
import { isCafeOpen, isEndlessOpen, nextShift, totalStars } from '../../core';
import { fmt, s } from '../../i18n';
import { sfx, unlockAudio } from '../../platform/audio';
import { shouldSuggestInstall } from '../../platform/install';
import { isUpdateReady, onUpdateReady, updateNow } from '../../platform/pwa';
import { Icon } from '../common/Icon';
import { InstallHint } from '../common/InstallHint';
import { useSave, type Store } from '../store';
import { SettingsSheet } from './SettingsSheet';

export function Home({
  store,
  cafe,
  cafeIndex,
  onCafe,
  onPlay,
  onMap,
  onAllDay,
  onShop,
}: {
  store: Store;
  cafe: CafeDef;
  cafeIndex: number;
  onCafe: (index: number) => void;
  onPlay: (level: number) => void;
  onMap: () => void;
  onAllDay: () => void;
  onShop: () => void;
}) {
  const save = useSave(store);
  const [settings, setSettings] = useState(false);
  const [updateReady, setUpdateReady] = useState(isUpdateReady());
  useEffect(() => onUpdateReady(() => setUpdateReady(true)), []);

  const open = isCafeOpen(save, cafeIndex);
  const before = cafes[cafeIndex - 1];
  const level = nextShift(save, cafe);
  const allDayOpen = isEndlessOpen(save, cafe);
  const best = save.cafes[cafe.id]?.endlessBest ?? 0;
  const tap = (go: () => void) => () => {
    unlockAudio();
    sfx.tap();
    go();
  };
  const showInstallHint = save.stats.shifts >= 1 && !save.seen.installHint && shouldSuggestInstall();

  return (
    <main class="home">
      <header class="top-row">
        <button class="round-button" onClick={tap(() => setSettings(true))} aria-label={s.home.settings}>
          <Icon name="ui/gear" />
        </button>
        <div class="hud-pill" aria-label={fmt(s.hud.coins, { n: save.coins })}>
          <Icon name="ui/coin" />
          <span>{save.coins}</span>
        </div>
      </header>

      <div class="home-hero">
        <Icon name="app/icon" class="home-icon" />
        <h1 class="home-title">{s.title}</h1>
        {cafes.length > 1 ? (
          <div class="cafe-picker">
            <button
              class="round-button round-small"
              disabled={cafeIndex === 0}
              onClick={tap(() => onCafe(cafeIndex - 1))}
              aria-label={s.home.prevCafe}
            >
              <Icon name="ui/back" />
            </button>
            <p class="home-tagline">{s.cafes[cafe.id] ?? cafe.id}</p>
            <button
              class="round-button round-small cafe-next"
              disabled={cafeIndex >= cafes.length - 1}
              onClick={tap(() => onCafe(cafeIndex + 1))}
              aria-label={s.home.nextCafe}
            >
              <Icon name="ui/back" />
            </button>
          </div>
        ) : (
          <p class="home-tagline">{s.cafes[cafe.id] ?? s.tagline}</p>
        )}
        <p class="chip" aria-label={fmt(s.home.stars, { n: totalStars(save, cafe), total: cafe.levels.length * 3 })}>
          <Icon name="ui/star" />
          {totalStars(save, cafe)} / {cafe.levels.length * 3}
        </p>
      </div>

      {!open && before ? (
        <div class="home-actions">
          <p class="note note-calm">
            <Icon name="ui/lock" />
            {fmt(s.home.cafeLocked, { name: s.cafes[before.id] ?? before.id })}
          </p>
        </div>
      ) : (
        <div class="home-actions">
          <button class="button button-go button-big button-wide" onClick={tap(() => onPlay(level))}>
            <Icon name="ui/play" />
            {s.home.play}
            <small class="button-sub">{fmt(s.home.shift, { n: level + 1 })}</small>
          </button>
          <div class="home-grid">
            <button class="tile" onClick={tap(onMap)}>
              <Icon name="ui/map" />
              <span>{s.home.shifts}</span>
            </button>
            <button class={`tile${allDayOpen ? '' : ' tile-locked'}`} onClick={allDayOpen ? tap(onAllDay) : () => sfx.nope()}>
              <Icon name={allDayOpen ? 'ui/sun' : 'ui/lock'} />
              <span>{s.home.allDay}</span>
              <small>
                {allDayOpen
                  ? best > 0
                    ? fmt(s.home.allDayBest, { n: best })
                    : ''
                  : fmt(s.home.allDayLocked, { n: cafe.endless.after })}
              </small>
            </button>
            <button class="tile" onClick={tap(onShop)}>
              <Icon name="ui/shop" />
              <span>{s.home.shop}</span>
            </button>
          </div>
        </div>
      )}

      <footer class="made-by">
        <Icon name="app/kumoplay" class="made-by-mark" />
        <span>{s.madeBy}</span>
      </footer>

      {updateReady && (
        <div class="update-note" role="status">
          <span>{s.update.ready}</span>
          <button class="button" onClick={updateNow}>
            {s.update.reload}
          </button>
        </div>
      )}
      {showInstallHint && <InstallHint onDone={() => store.update((draft) => void (draft.seen.installHint = true))} />}
      {settings && <SettingsSheet store={store} onClose={() => setSettings(false)} />}
    </main>
  );
}
