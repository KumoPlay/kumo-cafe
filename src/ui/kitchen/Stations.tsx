import { getIngredient, getStation } from '../../content';
import { anchor, isNeeded, plateDish, type CookingSlot, type ShiftState, type Suggestion } from '../../core';
import { fmt, itemName, listNames, s, stationName } from '../../i18n';
import { Icon } from '../common/Icon';

const RING = 2 * Math.PI * 30;

export interface KitchenTaps {
  onJar: (id: string, el: Element) => void;
  onSlot: (station: string, index: number, el: Element) => void;
  onClearSlot: (station: string, index: number, el: Element) => void;
  onPlate: (index: number, el: Element) => void;
  onClearPlate: (index: number, el: Element) => void;
}

/** The thing the helper glow points at, as a CSS class. */
function glow(hint: Suggestion | null, match: (hint: Suggestion) => boolean): string {
  return hint && match(hint) ? ' glow' : '';
}

/** The jars for a station: what it cooks, or the toppings for the board. */
export function jarsFor(state: ShiftState, station: string): string[] {
  return state.jars.filter((id) => getIngredient(state.cafe, id)?.goesTo === station);
}

/** How many spots or plates a station has in this shift. */
export function spotsFor(state: ShiftState, station: string): number {
  return getStation(state.cafe, station)?.kind === 'board' ? state.plates.length : (state.cooks[station]?.slots.length ?? 0);
}

function Jar({ id, hint, onJar }: { id: string; hint: Suggestion | null; onJar: KitchenTaps['onJar'] }) {
  return (
    <button
      class={`jar${glow(hint, (h) => h.kind === 'jar' && h.id === id)}`}
      data-anchor={anchor.jar(id)}
      onClick={(event) => onJar(id, event.currentTarget)}
      aria-label={fmt(s.kitchen.jar, { name: itemName(id) })}
    >
      <Icon name={`items/${id}`} />
    </button>
  );
}

/** One spot on a cooking station: empty, cooking (with a timer ring), or ready (sparkling). */
function Slot({
  state,
  station,
  index,
  slot,
  hint,
  taps,
}: {
  state: ShiftState;
  station: string;
  index: number;
  slot: CookingSlot | null;
  hint: Suggestion | null;
  taps: KitchenTaps;
}) {
  const time = state.time;
  const progress = slot ? Math.min(1, (time - slot.startedAt) / Math.max(1, slot.readyAt - slot.startedAt)) : 0;
  const ready = slot !== null && time >= slot.readyAt;
  const spare = ready && slot && !isNeeded(state, slot.output);
  const label = !slot
    ? fmt(s.kitchen.slotEmpty, { station: stationName(station) })
    : fmt(ready ? s.kitchen.slotReady : s.kitchen.slotCooking, { name: itemName(slot.output) });
  const pointed = (h: Suggestion): boolean => h.kind === 'slot' && h.station === station && h.slot === index;

  return (
    <div class="spot">
      <button
        class={`slot slot-${station}${slot ? (ready ? ' slot-ready' : ' slot-cooking') : ''}${glow(hint, pointed)}`}
        data-anchor={anchor.slot(station, index)}
        data-drag={ready ? `slot:${station}:${index}` : undefined}
        onClick={(event) => taps.onSlot(station, index, event.currentTarget)}
        aria-label={label}
      >
        <Icon name={`stations/${station}-slot`} class="slot-base" />
        {slot && (
          <span class="slot-food" key={`${slot.input}-${slot.startedAt}`}>
            <Icon
              name={`items/${slot.output}`}
              class="food"
              style={ready ? undefined : { transform: `scale(${0.72 + 0.22 * progress})` }}
            />
          </span>
        )}
        {slot && !ready && (
          <svg class="ring" viewBox="0 0 64 64" aria-hidden="true">
            <circle cx="32" cy="32" r="30" class="ring-track" />
            <circle
              cx="32"
              cy="32"
              r="30"
              class="ring-fill"
              style={{ strokeDasharray: RING, strokeDashoffset: RING * (1 - progress) }}
            />
          </svg>
        )}
        {ready && <Icon name="ui/sparkle" class="slot-spark" />}
      </button>
      {spare && slot && (
        <button
          class={`bin${glow(hint, (h) => h.kind === 'clear-slot' && h.station === station && h.slot === index)}`}
          onClick={(event) => taps.onClearSlot(station, index, event.currentTarget)}
          aria-label={fmt(s.kitchen.throwAway, { name: itemName(slot.output) })}
        >
          <Icon name="ui/bin" />
        </button>
      )}
    </div>
  );
}

function Plates({ state, hint, taps }: { state: ShiftState; hint: Suggestion | null; taps: KitchenTaps }) {
  return (
    <>
      {state.plates.map((plate, index) => {
        const dish = plateDish(state, plate);
        const label =
          plate.parts.length === 0 ? s.kitchen.plateEmpty : fmt(s.kitchen.plate, { names: listNames(plate.parts.map(itemName)) });
        return (
          <div class="spot" key={index}>
            <button
              class={`slot plate${dish ? ' plate-done' : ''}${glow(hint, (h) => h.kind === 'plate' && h.plate === index)}`}
              data-anchor={anchor.plate(index)}
              data-drop={`plate:${index}`}
              data-drag={plate.parts.length > 0 ? `plate:${index}` : undefined}
              onClick={(event) => taps.onPlate(index, event.currentTarget)}
              aria-label={label}
            >
              <Icon name="stations/plate" class="slot-base" />
              {dish && dish.parts.length > 0 ? (
                <span class="slot-food" key={dish.id}>
                  <Icon name={`items/${dish.id}`} class="food" />
                </span>
              ) : (
                plate.parts.map((part, i) => (
                  <span class={`slot-food plate-part plate-part-${i}`} key={`${part}-${i}`}>
                    <Icon name={`items/${part}`} class="food" />
                  </span>
                ))
              )}
            </button>
            {plate.parts.length > 0 && (
              <button
                class={`bin${glow(hint, (h) => h.kind === 'clear-plate' && h.plate === index)}`}
                onClick={(event) => taps.onClearPlate(index, event.currentTarget)}
                aria-label={s.kitchen.clearPlate}
              >
                <Icon name="ui/bin" />
              </button>
            )}
          </div>
        );
      })}
    </>
  );
}

/** One station as a row: its jars on the left, its spots (or plates) on the right. */
function StationRow({ state, id, hint, taps }: { state: ShiftState; id: string; hint: Suggestion | null; taps: KitchenTaps }) {
  const board = getStation(state.cafe, id)?.kind === 'board';
  const station = state.cooks[id];
  return (
    <div class={`station-row station-${id}`}>
      <span class="station-badge" title={stationName(id)}>
        <Icon name={`stations/${id}`} label={stationName(id)} />
        {station && station.queue.length > 0 && (
          <span class="queue" aria-label={fmt(s.kitchen.queued, { n: station.queue.length })}>
            {station.queue.map((item, i) => (
              <Icon key={i} name={`items/${item}`} />
            ))}
          </span>
        )}
        <span class="queue-anchor" data-anchor={`queue:${id}`} />
      </span>
      <div class="row-jars">
        {jarsFor(state, id).map((jar) => (
          <Jar key={jar} id={jar} hint={hint} onJar={taps.onJar} />
        ))}
      </div>
      <div class="row-spots">
        {board ? (
          <Plates state={state} hint={hint} taps={taps} />
        ) : (
          station?.slots.map((slot, index) => (
            <Slot key={index} state={state} station={id} index={index} slot={slot} hint={hint} taps={taps} />
          ))
        )}
      </div>
    </div>
  );
}

/**
 * The size of one jar or spot, in stage units: as big as fits, so a kitchen
 * with few stations gets big, easy buttons, and a full one still fits a phone.
 */
export function cellSize(state: ShiftState): number {
  const widest = Math.max(...state.stations.map((id) => jarsFor(state, id).length + spotsFor(state, id)), 1);
  const byWidth = Math.floor((331 - 8 - 5 * (widest - 1)) / widest);
  const byHeight = state.stations.length >= 4 ? 62 : 76;
  return Math.min(byWidth, byHeight);
}

/** Every station in this shift, top to bottom, in content order. */
export function Stations({ state, hint, taps }: { state: ShiftState; hint: Suggestion | null; taps: KitchenTaps }) {
  return (
    <section class="stations" style={{ '--cell': `${cellSize(state)}px` }}>
      {state.stations.map((id) => (
        <StationRow key={id} state={state} id={id} hint={hint} taps={taps} />
      ))}
    </section>
  );
}
