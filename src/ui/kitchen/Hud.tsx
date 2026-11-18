import { totalEarned, type ShiftState } from '../../core';
import { fmt, s } from '../../i18n';
import { Icon } from '../common/Icon';

/** The star meter for a shift: coins earned so far, with marks for ★★ and ★★★. */
function StarMeter({ state }: { state: ShiftState }) {
  const coins = totalEarned(state);
  const [two, three] = state.goals;
  const fill = Math.min(1, coins / Math.max(1, three));
  const twoAt = two / Math.max(1, three);
  const lit = [true, coins >= two, coins >= three];
  return (
    <div class="star-meter" role="img" aria-label={fmt(s.hud.stars, { two, three })}>
      <div class="star-meter-bar">
        <span style={{ width: `${fill * 100}%` }} />
      </div>
      {lit.map((on, i) => (
        <Icon
          key={`${i}-${on}`}
          name={on ? 'ui/star' : 'ui/star-empty'}
          class={`star-meter-star${on && i > 0 ? ' star-lit' : ''}`}
          style={{ left: `${[0, twoAt, 1][i]! * 100}%` }}
        />
      ))}
    </div>
  );
}

/** For the All-Day Café: how many guests are waiting outside. The day ends when it is full. */
function LineMeter({ state }: { state: ShiftState }) {
  const max = state.endless?.lineLimit ?? 0;
  return (
    <div class="line-meter" role="img" aria-label={fmt(s.hud.line, { n: state.line, max })}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} class={i < state.line ? 'line-dot line-dot-on' : 'line-dot'} />
      ))}
    </div>
  );
}

/** The top bar: pause, guests served, the star meter (or the line outside) and coins earned. */
export function Hud({ state, onPause }: { state: ShiftState; onPause: () => void }) {
  const coins = totalEarned(state);
  const endless = state.endless !== null;
  return (
    <header class="hud">
      <button class="round-button hud-pause" onClick={onPause} aria-label={s.hud.pause}>
        <Icon name="ui/pause" />
      </button>
      <div
        class="hud-pill"
        aria-label={
          endless ? fmt(s.hud.servedDay, { n: state.served }) : fmt(s.hud.served, { served: state.served, total: state.level.guests })
        }
      >
        <Icon name="ui/guest" />
        <span>{endless ? state.served : `${state.served}/${state.level.guests}`}</span>
      </div>
      {endless ? <LineMeter state={state} /> : <StarMeter state={state} />}
      <div class="hud-pill hud-coins" data-anchor="coins" aria-label={fmt(s.hud.coins, { n: coins })}>
        <Icon name="ui/coin" />
        <span>{coins}</span>
      </div>
    </header>
  );
}
