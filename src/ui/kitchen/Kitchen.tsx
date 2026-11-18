import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { balance, type CafeDef } from '../../content';
import {
  anchor,
  clearPlate,
  clearSlot,
  closeCafe,
  createEndless,
  createShift,
  endlessMenu,
  GameClock,
  moveItem,
  plateDish,
  recordEndless,
  recordShift,
  setupFor,
  starsFor,
  step,
  suggestTap,
  tapGuest,
  tapJar,
  tapPlate,
  tapSlot,
  totalEarned,
  waitingGuests,
  type DragSource,
  type DropTarget,
  type ShiftEvent,
  type ShiftResult,
  type ShiftState,
  type Suggestion,
} from '../../core';
import { s } from '../../i18n';
import { sfx, unlockAudio } from '../../platform/audio';
import { watchForAway } from '../../platform/pause';
import { askToKeepStorage } from '../../platform/storage';
import type { PlayMode } from '../screens/Intro';
import { useSave, type Store } from '../store';
import { startDragging } from './drag';
import { Fx } from './fx';
import { Hud } from './Hud';
import { PauseSheet } from './PauseSheet';
import { ResultsSheet, type Finish } from './ResultsSheet';
import { Seats } from './Seats';
import { Stations } from './Stations';

/** How long the last guest's happy moment lasts before the results appear. */
const RESULTS_DELAY_MS = 700;

/** Plays the sounds and little animations for what just happened in the shift. */
function show(events: ShiftEvent[], fx: Fx | null): void {
  for (const event of events) {
    switch (event.type) {
      case 'cook-start': {
        const fromQueue = event.from === anchor.slot(event.station, event.slot);
        if (!fromQueue) fx?.fly(`items/${event.item}`, event.from, anchor.slot(event.station, event.slot));
        if (event.station === 'griddle') sfx.sizzle();
        else if (event.station === 'kettle') sfx.pour();
        else sfx.drop();
        break;
      }
      case 'queued':
        fx?.fly(`items/${event.item}`, event.from, `queue:${event.station}`, { size: 28 });
        sfx.tap();
        break;
      case 'cooked':
        sfx.ready();
        break;
      case 'plated':
        fx?.fly(`items/${event.item}`, event.from, anchor.plate(event.plate));
        sfx.plate();
        break;
      case 'cleared':
      case 'slot-cleared':
        sfx.drop();
        break;
      case 'delivered':
        fx?.fly(`items/${event.dish}`, event.from, anchor.seat(event.seat));
        sfx.deliver();
        break;
      case 'served': {
        const coins = event.food + event.tip + event.comboBonus;
        fx?.float(`+${coins}`, anchor.seat(event.seat), 'coins', 200);
        const flights = Math.min(6, Math.max(2, Math.round(coins / 5)));
        for (let i = 0; i < flights; i += 1) {
          fx?.fly('ui/coin', anchor.seat(event.seat), 'coins', { size: 26, delay: 250 + i * 70 });
        }
        sfx.served();
        setTimeout(() => sfx.coin(), 450);
        if (event.comboBonus > 0) {
          fx?.float(s.kitchen.streak.replace('{n}', String(event.combo)), anchor.seat(event.seat), 'streak', 500);
          setTimeout(() => sfx.streak(event.combo), 650);
        }
        break;
      }
      case 'seated':
        sfx.arrive();
        break;
      case 'done':
        sfx.done();
        break;
      default:
        break;
    }
  }
}

/** Reads a drag source or drop target name, such as 'slot:griddle:0' or 'guest:12'. */
function parseSource(name: string): DragSource | null {
  const [kind, a, b] = name.split(':');
  if (kind === 'slot' && a && b !== undefined) return { kind: 'slot', station: a, slot: Number(b) };
  if (kind === 'plate' && a !== undefined) return { kind: 'plate', plate: Number(a) };
  return null;
}

function parseTarget(name: string | null): DropTarget | null {
  const [kind, a] = (name ?? '').split(':');
  if (kind === 'guest' && a !== undefined) return { kind: 'guest', guest: Number(a) };
  if (kind === 'plate' && a !== undefined) return { kind: 'plate', plate: Number(a) };
  return null;
}

/** What a drag source holds: the finished dish on a plate, or the food on a spot. */
function dragItem(state: ShiftState, source: DragSource): string | null {
  if (source.kind === 'slot') return state.cooks[source.station]?.slots[source.slot]?.output ?? null;
  const plate = state.plates[source.plate];
  if (!plate || plate.parts.length === 0) return null;
  const dish = plateDish(state, plate);
  return dish?.id ?? plate.parts[plate.parts.length - 1] ?? null;
}

/** One shift, or one day in the All-Day Café, from the first guest to the results. */
export function Kitchen({
  store,
  cafe,
  mode,
  sideways,
  onHome,
  onMap,
  onNext,
}: {
  store: Store;
  cafe: CafeDef;
  mode: PlayMode;
  sideways: boolean;
  onHome: () => void;
  onMap: () => void;
  onNext: (level: number) => void;
}) {
  const save = useSave(store);
  const newState = (): ShiftState => {
    const current = store.get();
    const setup = setupFor(current, cafe);
    if (mode.kind === 'shift') return createShift(cafe, mode.level, setup);
    const { menu, who } = endlessMenu(current, cafe);
    return createEndless(cafe, cafe.endless, menu, who, setup);
  };
  const [state, setState] = useState<ShiftState>(newState);
  const [, setFrame] = useState(0);
  const [paused, setPaused] = useState(false);
  const [finish, setFinish] = useState<Finish | null>(null);
  const [dropping, setDropping] = useState<number[]>([]);
  const clock = useRef(new GameClock());
  const rootRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const fx = useRef<Fx | null>(null);
  /** Shift time of the last useful tap, or of the last guest sitting down. The helper waits for a quiet moment after it. */
  const lastAction = useRef(0);

  const tutorial = mode.kind === 'shift' && cafe.levels[mode.level]?.tutorial === true;

  const pause = useCallback((): void => {
    if (!clock.current.isRunning) return;
    clock.current.pause();
    setPaused(true);
  }, []);

  /** Saves the finished shift or day, and shows the results. */
  const finishUp = useCallback(
    (done: ShiftState): void => {
      const coins = totalEarned(done);
      if (done.endless) {
        const relaxed = done.setup.relaxed;
        const newBest = store.update((draft) => recordEndless(draft, cafe, { coins, served: done.served, relaxed }));
        const progress = store.get().cafes[cafe.id];
        setFinish({ newBest, best: relaxed ? progress?.endlessBestRelaxed : progress?.endlessBest });
      } else if (mode.kind === 'shift') {
        const stars = starsFor(done.goals, coins);
        const record = store.update((draft) => recordShift(draft, cafe, mode.level, { coins, stars, served: done.served }));
        setFinish({ record, last: mode.level >= cafe.levels.length - 1 });
      }
      // After the first finished shift there is something worth keeping: ask the browser to keep it.
      void askToKeepStorage();
    },
    [store, cafe, mode],
  );

  useEffect(() => {
    const stage = rootRef.current?.closest('.stage');
    if (!(stage instanceof HTMLElement) || !layerRef.current) return;
    fx.current = new Fx(stage, layerRef.current);
    return startDragging(stage, layerRef.current, {
      imageFor: (name) => {
        const source = parseSource(name);
        const item = source && dragItem(state, source);
        return item ? `items/${item}` : null;
      },
      onStart: (name) => {
        const source = parseSource(name);
        const item = source && dragItem(state, source);
        setDropping(item ? waitingGuests(state).filter((g) => g.order.some((l) => !l.done && l.dish === item)).map((g) => g.id) : []);
      },
      onDrop: (name, targetName) => {
        setDropping([]);
        const source = parseSource(name);
        const target = parseTarget(targetName);
        if (!source || !target || !clock.current.isRunning) return;
        const result = moveItem(state, source, target);
        act(result, null);
      },
    });
    // `act` only reads refs and `state`, so following `state` is enough.
  }, [state]);

  // The game loop: one animation frame at a time, only while the clock runs.
  useEffect(() => {
    let frameId = 0;
    let doneTimer = 0;
    lastAction.current = 0;
    clock.current.start();
    const loop = (now: number): void => {
      const dt = clock.current.frame(now);
      if (dt > 0) {
        const events = step(state, dt);
        if (events.length > 0) show(events, fx.current);
        if (events.some((event) => event.type === 'seated')) lastAction.current = state.time;
        if (events.some((event) => event.type === 'done')) {
          clock.current.pause();
          doneTimer = window.setTimeout(() => finishUp(state), RESULTS_DELAY_MS);
        }
        setFrame((n) => n + 1);
      }
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(doneTimer);
      clock.current.pause();
    };
  }, [state, finishUp]);

  // Pause when the player looks away, or turns the phone sideways.
  useEffect(() => watchForAway(pause), [pause]);
  useEffect(() => {
    if (sideways) pause();
  }, [sideways, pause]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if ((event.key === 'Escape' || event.key === 'p') && !paused && !finish) {
        event.preventDefault();
        sfx.pause();
        pause();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pause, paused, finish]);

  /** Applies a tap to the rules, then animates what happened, or wiggles when it did nothing. */
  function act(result: ShiftResult, element: Element | null): void {
    unlockAudio();
    if (!clock.current.isRunning) return;
    if (result.ok) {
      show(result.events, fx.current);
      lastAction.current = state.time;
      if (result.events.some((event) => event.type === 'done')) {
        clock.current.pause();
        window.setTimeout(() => finishUp(state), RESULTS_DELAY_MS);
      }
    } else {
      fx.current?.wiggle(element);
      if (result.reason !== 'not-ready') sfx.nope();
    }
    setFrame((n) => n + 1);
  }

  const resume = (): void => {
    unlockAudio();
    setPaused(false);
    clock.current.start();
    sfx.start();
  };

  const restart = (): void => {
    fx.current?.clear();
    setPaused(false);
    setFinish(null);
    setState(newState());
  };

  // The helper glow: after a quiet moment with a guest waiting, the next useful tap glows.
  const waiting = waitingGuests(state).length > 0;
  const quietFor = state.time - lastAction.current;
  const helperAfter = tutorial ? balance.tutorialHelperAfterMs : balance.helperAfterMs;
  const hint: Suggestion | null = waiting && !state.done && quietFor >= helperAfter ? suggestTap(state) : null;
  const helpText = tutorial && hint ? s.kitchen.help[hint.kind.startsWith('clear') ? 'clear' : hint.kind] : null;
  const decor = cafe.decor.filter((d) => save.cafes[cafe.id]?.decor.includes(d.id));

  return (
    <div class={`kitchen-screen${paused || finish ? ' is-paused' : ''}`} ref={rootRef}>
      <Hud
        state={state}
        onPause={() => {
          unlockAudio();
          sfx.pause();
          pause();
        }}
      />
      <Seats
        state={state}
        decor={decor}
        dropping={dropping}
        onGuest={(guest, el) => act(tapGuest(state, guest.id), el)}
      />
      <div class="kitchen">
        {helpText && (
          <p class="help-tip" role="status">
            {helpText}
          </p>
        )}
        <Stations
          state={state}
          hint={hint}
          taps={{
            onJar: (id, el) => act(tapJar(state, id), el),
            onSlot: (station, index, el) => act(tapSlot(state, station, index), el),
            onClearSlot: (station, index, el) => act(clearSlot(state, station, index), el),
            onPlate: (index, el) => act(tapPlate(state, index), el),
            onClearPlate: (index, el) => act(clearPlate(state, index), el),
          }}
        />
      </div>
      <div class="fx-layer" ref={layerRef} aria-hidden="true" />
      {paused && !finish && (
        <PauseSheet
          sound={save.settings.sound}
          relaxed={save.settings.relaxed}
          endless={state.endless !== null}
          onResume={resume}
          onSound={() => store.update((draft) => void (draft.settings.sound = !draft.settings.sound))}
          onRelaxed={() => {
            const relaxed = !save.settings.relaxed;
            store.update((draft) => void (draft.settings.relaxed = relaxed));
            state.setup.relaxed = relaxed;
          }}
          onRestart={restart}
          onLeave={onHome}
          onCloseCafe={() => {
            setPaused(false);
            clock.current.start();
            act(closeCafe(state), null);
          }}
        />
      )}
      {finish && (
        <ResultsSheet
          state={state}
          finish={finish}
          onAgain={restart}
          onNext={() => mode.kind === 'shift' && onNext(Math.min(mode.level + 1, cafe.levels.length - 1))}
          onMap={onMap}
          onHome={onHome}
        />
      )}
    </div>
  );
}
