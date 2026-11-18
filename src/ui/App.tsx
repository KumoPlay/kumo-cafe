import { useEffect, useRef, useState } from 'preact/hooks';
import { cafes } from '../content';
import { newestCafe } from '../core';
import { s } from '../i18n';
import { loadGame } from '../platform/storage';
import { watchForNewerTab } from '../platform/tabs';
import { BackupLoader } from './common/BackupLoader';
import { Confirm } from './common/Confirm';
import { Icon } from './common/Icon';
import { RotateHint } from './common/RotateHint';
import { Stage } from './common/Stage';
import { useSideways } from './common/useSideways';
import { Kitchen } from './kitchen/Kitchen';
import { Home } from './screens/Home';
import { Intro, type PlayMode } from './screens/Intro';
import { LevelMap } from './screens/LevelMap';
import { Shop } from './screens/Shop';
import { Store } from './store';

type Boot =
  | { phase: 'loading' }
  | { phase: 'play'; store: Store }
  | { phase: 'unreadable'; reason: 'corrupt' | 'too-new' }
  | { phase: 'elsewhere' };

type Screen =
  | { name: 'home' }
  | { name: 'map' }
  | { name: 'shop' }
  | { name: 'intro'; mode: PlayMode }
  | { name: 'kitchen'; mode: PlayMode; run: number };

/** Everything after loading: the screens, one at a time. */
function Game({ store }: { store: Store }) {
  const [screen, setScreen] = useState<Screen>({ name: 'home' });
  const [cafeIndex, setCafeIndex] = useState(() => newestCafe(store.get()));
  const sideways = useSideways();
  const run = useRef(0);
  const cafe = cafes[cafeIndex] ?? cafes[0];
  if (!cafe) return null;

  const home = (): void => setScreen({ name: 'home' });
  const intro = (mode: PlayMode): void => setScreen({ name: 'intro', mode });
  const play = (mode: PlayMode): void => setScreen({ name: 'kitchen', mode, run: (run.current += 1) });

  return (
    <>
      <Stage>
        {screen.name === 'home' && (
          <Home
            store={store}
            cafe={cafe}
            cafeIndex={cafeIndex}
            onCafe={setCafeIndex}
            onPlay={(level) => intro({ kind: 'shift', level })}
            onMap={() => setScreen({ name: 'map' })}
            onAllDay={() => intro({ kind: 'endless' })}
            onShop={() => setScreen({ name: 'shop' })}
          />
        )}
        {screen.name === 'map' && (
          <LevelMap store={store} cafe={cafe} onPick={(level) => intro({ kind: 'shift', level })} onBack={home} />
        )}
        {screen.name === 'shop' && <Shop store={store} cafe={cafe} onBack={home} />}
        {screen.name === 'intro' && (
          <Intro
            store={store}
            cafe={cafe}
            mode={screen.mode}
            onStart={() => play(screen.mode)}
            onBack={() => (screen.mode.kind === 'shift' ? setScreen({ name: 'map' }) : home())}
          />
        )}
        {screen.name === 'kitchen' && (
          <Kitchen
            key={screen.run}
            store={store}
            cafe={cafe}
            mode={screen.mode}
            sideways={sideways}
            onHome={home}
            onMap={() => setScreen({ name: 'map' })}
            onNext={(level) => intro({ kind: 'shift', level })}
          />
        )}
      </Stage>
      {sideways && <RotateHint />}
    </>
  );
}

export function App() {
  const [boot, setBoot] = useState<Boot>({ phase: 'loading' });
  const [confirmNew, setConfirmNew] = useState(false);
  const storeRef = useRef<Store | null>(null);

  const play = (store: Store): void => {
    storeRef.current = store;
    setBoot({ phase: 'play', store });
  };

  useEffect(() => {
    let active = true;
    // Tell other tabs first, so they stop saving before this one reads the save.
    const stopWatching = watchForNewerTab(() => {
      active = false;
      storeRef.current?.stop();
      setBoot({ phase: 'elsewhere' });
    });
    void loadGame().then((result) => {
      if (!active) return;
      if (result.status === 'unreadable') setBoot({ phase: 'unreadable', reason: result.reason });
      else play(result.status === 'loaded' ? new Store(result.state, result.rev) : Store.startNew());
    });
    return () => {
      active = false;
      stopWatching();
    };
  }, []);

  const sky = (
    <div class="sky" aria-hidden="true">
      <Icon name="scene/cloud" class="drift drift-1" />
      <Icon name="scene/cloud" class="drift drift-2" />
      <Icon name="scene/cloud" class="drift drift-3" />
    </div>
  );

  if (boot.phase === 'play') {
    return (
      <div class="app">
        {sky}
        <Game store={boot.store} />
      </div>
    );
  }

  let body;
  if (boot.phase === 'loading') {
    body = (
      <>
        <Icon name="app/icon" class="home-icon" />
        <h1 class="home-title">{s.title}</h1>
        <p class="muted">{s.loading}</p>
      </>
    );
  } else if (boot.phase === 'elsewhere') {
    body = (
      <div class="card">
        <h1>{s.tabs.title}</h1>
        <p class="muted">{s.tabs.text}</p>
        <button class="button button-go button-wide" onClick={() => location.reload()}>
          {s.tabs.here}
        </button>
      </div>
    );
  } else {
    body = (
      <div class="card">
        <h1>{s.recover.title}</h1>
        {boot.reason === 'too-new' ? (
          <>
            <p class="muted">{s.recover.tooNew}</p>
            <button class="button button-go button-wide" onClick={() => location.reload()}>
              {s.recover.reload}
            </button>
          </>
        ) : (
          <>
            <p class="muted">{s.recover.corrupt}</p>
            <BackupLoader
              onLoad={(state) => {
                const store = new Store(state, 0);
                store.save();
                play(store);
              }}
            />
            <button class="button button-danger" onClick={() => setConfirmNew(true)}>
              {s.recover.startNew}
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div class="app">
      {sky}
      <main class="boot">{body}</main>
      {confirmNew && (
        <Confirm
          title={s.settings.resetConfirmTitle}
          text={s.settings.resetConfirmText}
          safeLabel={s.settings.cancel}
          dangerLabel={s.settings.resetYes}
          onSafe={() => setConfirmNew(false)}
          onDanger={() => {
            setConfirmNew(false);
            play(Store.startNew());
          }}
        />
      )}
    </div>
  );
}
