import { cookFor, getDish, type CafeDef } from '../../content';
import { endlessMenu } from '../../core';
import { fmt, guestName, itemName, s, stationName } from '../../i18n';
import { sfx, unlockAudio } from '../../platform/audio';
import { Icon } from '../common/Icon';
import { useSave, type Store } from '../store';

/** What the kitchen is about to play: one shift, or a day in the All-Day Café. */
export type PlayMode = { kind: 'shift'; level: number } | { kind: 'endless' };

/** How a dish is made, in pictures: [batter] → [griddle] = [pancake]. */
function Recipe({ cafe, dishId, isNew }: { cafe: CafeDef; dishId: string; isNew: boolean }) {
  const dish = getDish(cafe, dishId);
  if (!dish) return null;
  const cook = dish.parts.length === 0 ? cookFor(cafe, dish.id) : undefined;
  const inputs = cook ? [cook.input] : dish.parts;
  const station = cook ? cook.station : (cafe.stations.find((st) => st.kind === 'board')?.id ?? 'board');
  return (
    <li class={`recipe${isNew ? ' recipe-new' : ''}`}>
      <div class="recipe-steps" aria-hidden="true">
        {inputs.map((input, i) => (
          <span class="recipe-step" key={input + i}>
            {i > 0 && <b>+</b>}
            <Icon name={`items/${input}`} />
          </span>
        ))}
        <b>→</b>
        <Icon name={`stations/${station}`} class="recipe-station" />
        <b>=</b>
        <Icon name={`items/${dish.id}`} class="recipe-dish" />
      </div>
      <span class="recipe-name">
        {itemName(dish.id)}
        {isNew && <em class="badge-new">{s.intro.isNew}</em>}
      </span>
      <span class="sr-only">
        {inputs.map(itemName).join(' + ')} → {stationName(station)}
      </span>
    </li>
  );
}

/** The card before a shift: how many guests, who is new, and how each dish on the menu is made. */
export function Intro({
  store,
  cafe,
  mode,
  onStart,
  onBack,
}: {
  store: Store;
  cafe: CafeDef;
  mode: PlayMode;
  onStart: () => void;
  onBack: () => void;
}) {
  const save = useSave(store);
  const level = mode.kind === 'shift' ? cafe.levels[mode.level] : undefined;
  const endless = mode.kind === 'endless' ? endlessMenu(save, cafe) : undefined;
  const menu = level?.menu ?? endless?.menu ?? [];
  const who = level?.who ?? endless?.who ?? [];
  const newGuests = who.filter((id) => !save.seen.guests.includes(id));
  // On a small card, show the new dish first.
  const featured = level?.featured;
  const shown = featured ? [featured, ...menu.filter((id) => id !== featured)] : menu;
  const best = save.cafes[cafe.id]?.endlessBest ?? 0;

  return (
    <main class="intro">
      <div class="card intro-card">
        <header class="intro-head">
          <button class="round-button round-small" onClick={onBack} aria-label={s.back}>
            <Icon name="ui/back" />
          </button>
          <h1>{mode.kind === 'shift' ? fmt(s.intro.title, { n: mode.level + 1 }) : s.intro.allDayTitle}</h1>
          {level ? (
            <span class="chip">
              <Icon name="ui/guest" />
              {fmt(s.intro.guests, { n: level.guests })}
            </span>
          ) : (
            <Icon name="ui/sun" class="intro-sun" />
          )}
        </header>

        {endless && (
          <>
            <p class="muted small">{fmt(s.intro.allDayText, { n: cafe.endless.lineLimit })}</p>
            {best > 0 && (
              <p class="chip">
                <Icon name="ui/medal" />
                {fmt(s.results.bestDay, { n: best })}
              </p>
            )}
          </>
        )}

        {newGuests.length > 0 && (
          <ul class="new-guests">
            {newGuests.map((id) => (
              <li key={id} class="new-guest">
                <Icon name={`guests/${id}`} class="new-guest-art" />
                <span>
                  <em class="badge-new">{s.intro.newGuest}</em>
                  <strong>{guestName(id)}</strong>
                  <small>{s.guestAbout[id]}</small>
                </span>
              </li>
            ))}
          </ul>
        )}

        <h2 class="intro-sub">{s.intro.menu}</h2>
        <ul class={`recipes${shown.length > 4 ? ' recipes-compact' : ''}`}>
          {shown.map((id) => (
            <Recipe key={id} cafe={cafe} dishId={id} isNew={id === featured} />
          ))}
        </ul>
        {mode.kind === 'shift' && mode.level === 0 && <p class="muted small">{s.intro.howTo}</p>}
        {save.settings.relaxed && (
          <p class="note note-calm">
            <Icon name="ui/heart" />
            {s.intro.relaxed}
          </p>
        )}
        <button
          class="button button-go button-big button-wide"
          onClick={() => {
            unlockAudio();
            sfx.start();
            store.update((draft) => {
              for (const id of who) if (!draft.seen.guests.includes(id)) draft.seen.guests.push(id);
            });
            onStart();
          }}
        >
          <Icon name="ui/play" />
          {mode.kind === 'shift' ? s.intro.start : s.intro.open}
        </button>
      </div>
    </main>
  );
}
