import { art } from '../../art';
import { balance, type DecorDef } from '../../content';
import { anchor, type Guest, type ShiftState } from '../../core';
import { fmt, guestName, itemName, listNames, s } from '../../i18n';
import { Icon } from '../common/Icon';

/** Hearts that empty smoothly as patience runs down. */
function Hearts({ guest }: { guest: Guest }) {
  const share = guest.patienceMax > 0 ? guest.patience / guest.patienceMax : 0;
  return (
    <div class="hearts" aria-hidden="true">
      {Array.from({ length: balance.hearts }, (_, i) => {
        const fill = Math.max(0, Math.min(1, share * balance.hearts - i));
        return (
          <span class="heart" key={i}>
            <Icon name="ui/heart-empty" />
            <Icon name="ui/heart" style={{ clipPath: `inset(${(1 - fill) * 100}% 0 0 0)` }} />
          </span>
        );
      })}
    </div>
  );
}

function Seat({
  guest,
  seat,
  glowing,
  onTap,
}: {
  guest: Guest | null;
  seat: number;
  glowing: boolean;
  onTap: (guest: Guest, el: Element) => void;
}) {
  if (!guest) return <div class="seat seat-empty" data-anchor={anchor.seat(seat)} />;

  const served = guest.servedAt !== null;
  const label = fmt(s.kitchen.guest, {
    name: guestName(guest.who),
    order: listNames(guest.order.filter((line) => !line.done).map((line) => itemName(line.dish))),
  });

  return (
    <button
      class={`seat${served ? ' seat-served' : ''}${guest.sleepy ? ' seat-sleepy' : ''}${glowing ? ' seat-glow' : ''}`}
      data-drop={served ? undefined : `guest:${guest.id}`}
      onClick={(event) => onTap(guest, event.currentTarget)}
      aria-label={label}
      disabled={served}
    >
      {!served && (
        <div class="bubble">
          {guest.order.map((line, i) => (
            <span class={`want${line.done ? ' want-done' : ''}`} key={i}>
              <Icon name={`items/${line.dish}`} />
              {line.done && <Icon name="ui/check" class="want-check" />}
            </span>
          ))}
        </div>
      )}
      <div class="guest" data-anchor={anchor.seat(seat)}>
        <Icon name={`guests/${guest.who}`} class="guest-art" />
        {guest.sleepy && !served && <Icon name="ui/zzz" class="guest-zzz" />}
        {served && <Icon name="ui/heart" class="guest-love" />}
      </div>
      {!served && <Hearts guest={guest} />}
    </button>
  );
}

function Decor({ decor }: { decor: DecorDef }) {
  const { on, x, y, w } = decor.place;
  return (
    <Icon
      name={`decor/${decor.id}`}
      class={`decor decor-${on}`}
      style={on === 'wall' ? { left: `${x}px`, top: `${y}px`, width: `${w}px` } : { left: `${x}px`, width: `${w}px` }}
    />
  );
}

/** The café front: the wall with its decorations, the guests at the counter, and the counter itself. */
export function Seats({
  state,
  decor,
  dropping,
  onGuest,
}: {
  state: ShiftState;
  decor: DecorDef[];
  /** Guests who want what is being dragged right now. */
  dropping: number[];
  onGuest: (guest: Guest, el: Element) => void;
}) {
  return (
    <section class="cafe-front" style={{ backgroundImage: `url("${art('scene/wall')}")` }}>
      <div class="decor-layer">
        {decor
          .filter((d) => d.place.on === 'wall')
          .map((d) => (
            <Decor key={d.id} decor={d} />
          ))}
      </div>
      <div class="seats" style={{ gridTemplateColumns: `repeat(${state.seats.length}, 1fr)` }}>
        {state.seats.map((guest, seat) => (
          <Seat
            key={guest ? `g${guest.id}` : `s${seat}`}
            guest={guest}
            seat={seat}
            glowing={guest !== null && dropping.includes(guest.id)}
            onTap={onGuest}
          />
        ))}
      </div>
      <div class="counter" style={{ backgroundImage: `url("${art('scene/counter')}")` }}>
        {decor
          .filter((d) => d.place.on === 'counter')
          .map((d) => (
            <Decor key={d.id} decor={d} />
          ))}
      </div>
    </section>
  );
}
