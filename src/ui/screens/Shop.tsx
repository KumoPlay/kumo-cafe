import { useState } from 'preact/hooks';
import type { CafeDef, DecorDef, UpgradeDef } from '../../content';
import {
  buyDecor,
  buyUpgrade,
  checkDecor,
  checkUpgrade,
  isDecorOpen,
  isUpgradeOpen,
  nextPrice,
  ownsDecor,
  upgradeSteps,
} from '../../core';
import { fmt, s } from '../../i18n';
import { sfx, unlockAudio } from '../../platform/audio';
import { Icon } from '../common/Icon';
import { useSave, type Store } from '../store';

function effectText(upgrade: UpgradeDef): string {
  if (upgrade.kind === 'speed') return s.shop.speed;
  return upgrade.station === 'board' ? s.shop.plate : s.shop.slot;
}

/** Spend coins on a faster, roomier kitchen and a cozier café. No real money, ever. */
export function Shop({ store, cafe, onBack }: { store: Store; cafe: CafeDef; onBack: () => void }) {
  const save = useSave(store);
  const [tab, setTab] = useState<'kitchen' | 'decor'>('kitchen');
  const [note, setNote] = useState<string | null>(null);

  const buy = (run: () => boolean): void => {
    unlockAudio();
    if (run()) {
      sfx.coin();
      setNote(s.shop.bought);
    } else {
      sfx.nope();
      setNote(s.shop.notEnough);
    }
  };

  const upgradeCard = (upgrade: UpgradeDef) => {
    const open = isUpgradeOpen(save, cafe, upgrade);
    const steps = upgradeSteps(save, cafe, upgrade);
    const price = nextPrice(save, cafe, upgrade);
    const check = checkUpgrade(save, cafe, upgrade);
    return (
      <li class={`shop-card${open ? '' : ' shop-card-locked'}`} key={upgrade.id}>
        <Icon name={open ? `stations/${upgrade.station}` : 'ui/lock'} class="shop-art" />
        <strong>{s.upgrades[upgrade.id] ?? upgrade.id}</strong>
        <small>{effectText(upgrade)}</small>
        <span class="steps" aria-label={fmt(s.shop.steps, { n: steps, total: upgrade.prices.length })}>
          {upgrade.prices.map((_, i) => (
            <i key={i} class={i < steps ? 'step-on' : ''} />
          ))}
        </span>
        {!open ? (
          <span class="chip">{s.shop.lockedStation}</span>
        ) : price === null ? (
          <span class="chip chip-done">
            <Icon name="ui/check" />
            {s.shop.done}
          </span>
        ) : (
          <button
            class={`button button-price${check.ok ? ' button-go' : ''}`}
            aria-disabled={!check.ok}
            onClick={() => buy(() => store.update((draft) => buyUpgrade(draft, cafe, upgrade.id).ok))}
          >
            <Icon name="ui/coin" />
            {price}
          </button>
        )}
      </li>
    );
  };

  const decorCard = (decor: DecorDef) => {
    const open = isDecorOpen(save, cafe, decor);
    const owned = ownsDecor(save, cafe, decor);
    const check = checkDecor(save, cafe, decor);
    return (
      <li class={`shop-card${open ? '' : ' shop-card-locked'}`} key={decor.id}>
        <Icon name={open ? `decor/${decor.id}` : 'ui/lock'} class="shop-art shop-art-decor" />
        <strong>{s.decor[decor.id] ?? decor.id}</strong>
        <small>{s.shop.patience}</small>
        {!open ? (
          <span class="chip">{fmt(s.shop.lockedShift, { n: decor.after })}</span>
        ) : owned ? (
          <span class="chip chip-done">
            <Icon name="ui/check" />
            {s.shop.done}
          </span>
        ) : (
          <button
            class={`button button-price${check.ok ? ' button-go' : ''}`}
            aria-disabled={!check.ok}
            onClick={() => buy(() => store.update((draft) => buyDecor(draft, cafe, decor.id).ok))}
          >
            <Icon name="ui/coin" />
            {decor.price}
          </button>
        )}
      </li>
    );
  };

  return (
    <main class="shop">
      <header class="top-row">
        <button class="round-button" onClick={onBack} aria-label={s.back}>
          <Icon name="ui/back" />
        </button>
        <h1 class="screen-title">{s.shop.title}</h1>
        <div class="hud-pill" aria-label={fmt(s.hud.coins, { n: save.coins })}>
          <Icon name="ui/coin" />
          <span>{save.coins}</span>
        </div>
      </header>
      <div class="tabs" role="tablist">
        {(['kitchen', 'decor'] as const).map((id) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            class={`tab${tab === id ? ' tab-on' : ''}`}
            onClick={() => {
              setTab(id);
              setNote(null);
            }}
          >
            {id === 'kitchen' ? s.shop.kitchen : s.shop.decor}
          </button>
        ))}
      </div>
      <div class="shop-scroll">
        {note && (
          <p class="note shop-note" role="status">
            {note}
          </p>
        )}
        <ul class="shop-grid">{tab === 'kitchen' ? cafe.upgrades.map(upgradeCard) : cafe.decor.map(decorCard)}</ul>
      </div>
    </main>
  );
}
