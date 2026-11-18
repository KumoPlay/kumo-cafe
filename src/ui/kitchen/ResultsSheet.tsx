import { useEffect } from 'preact/hooks';
import { starsFor, totalEarned, type ShiftRecord, type ShiftState } from '../../core';
import { fmt, s } from '../../i18n';
import { sfx } from '../../platform/audio';
import { Icon } from '../common/Icon';
import { Sheet } from '../common/Sheet';

export interface Finish {
  /** For a shift: what changed in the player's progress. */
  record?: ShiftRecord;
  /** For the All-Day Café: a new best day, and the best so far. */
  newBest?: boolean;
  best?: number;
  /** True when this was the last shift of the café. */
  last?: boolean;
}

function Lines({ state, coins }: { state: ShiftState; coins: number }) {
  return (
    <dl class="results-lines">
      <dt>{s.results.food}</dt>
      <dd>{state.earned.food}</dd>
      <dt>{s.results.tips}</dt>
      <dd>{state.earned.tips}</dd>
      {state.earned.combo > 0 && (
        <>
          <dt>{s.results.streak}</dt>
          <dd>{state.earned.combo}</dd>
        </>
      )}
      <dt class="results-total">{s.results.total}</dt>
      <dd class="results-total">
        <Icon name="ui/coin" />
        {coins}
      </dd>
    </dl>
  );
}

/** The end of a shift (stars, coins, what next) or of a day in the All-Day Café. Every shift ends with at least one star. */
export function ResultsSheet({
  state,
  finish,
  onAgain,
  onNext,
  onMap,
  onHome,
}: {
  state: ShiftState;
  finish: Finish;
  onAgain: () => void;
  onNext: () => void;
  onMap: () => void;
  onHome: () => void;
}) {
  const coins = totalEarned(state);
  const endless = state.endless !== null;
  const stars = starsFor(state.goals, coins);

  useEffect(() => {
    if (endless) return;
    const timers = [0, 1, 2].filter((i) => i < stars).map((i) => window.setTimeout(() => sfx.star(i), 350 + i * 300));
    return () => timers.forEach((timer) => clearTimeout(timer));
  }, [stars, endless]);

  if (endless) {
    return (
      <Sheet title={s.results.dayTitle} small>
        <div class="results">
          <div class="results-day">
            <Icon name="ui/moon" class="results-moon" />
            <strong>{fmt(s.results.served, { n: state.served })}</strong>
            {finish.newBest ? (
              <em class="badge-new badge-best">{s.results.newBest}</em>
            ) : (
              <small class="muted">{fmt(s.results.bestDay, { n: finish.best ?? 0 })}</small>
            )}
          </div>
          <Lines state={state} coins={coins} />
          <div class="results-buttons">
            <button class="button button-go button-wide button-big" onClick={onAgain}>
              <Icon name="ui/sun" />
              {s.results.again}
            </button>
            <button class="button button-wide" onClick={onHome}>
              <Icon name="ui/home" />
              {s.results.home}
            </button>
          </div>
        </div>
      </Sheet>
    );
  }

  const record = finish.record;
  const canGoOn = !finish.last;
  return (
    <Sheet title={s.results.cheers[stars - 1] ?? ''} small>
      <div class="results">
        <div class="results-stars" role="img" aria-label={fmt(s.results.starsLabel, { n: stars })}>
          {[0, 1, 2].map((i) => (
            <span class={`results-star results-star-${i}`} key={i}>
              <Icon name="ui/star-empty" />
              {i < stars && <Icon name="ui/star" class="results-star-lit" style={{ animationDelay: `${0.3 + i * 0.3}s` }} />}
            </span>
          ))}
        </div>
        <Lines state={state} coins={coins} />
        {state.bestCombo >= 2 && <p class="muted center small">{fmt(s.results.bestStreak, { n: state.bestCombo })}</p>}
        {record?.endlessOpened && (
          <p class="note note-calm">
            <Icon name="ui/sun" />
            {s.results.allDayOpen}
          </p>
        )}
        {finish.last && record?.opened === null && <p class="note note-calm">{s.results.allDone}</p>}
        <div class="results-buttons">
          {canGoOn ? (
            <button class="button button-go button-wide button-big" onClick={onNext}>
              <Icon name="ui/play" />
              {s.results.next}
            </button>
          ) : null}
          <div class="button-pair">
            <button class={`button${canGoOn ? '' : ' button-go'}`} onClick={onAgain}>
              <Icon name="ui/replay" />
              {s.results.again}
            </button>
            <button class="button" onClick={onMap}>
              <Icon name="ui/map" />
              {s.results.shifts}
            </button>
          </div>
        </div>
      </div>
    </Sheet>
  );
}
