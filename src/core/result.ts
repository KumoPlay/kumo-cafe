/** Why a tap did nothing. The kitchen answers with a gentle wiggle, never an error. */
export type FailReason =
  /** The jar or station is not part of this shift. */
  | 'locked'
  /** Every spot on the station is in use and its little queue is full. */
  | 'busy'
  /** No plate on the board can take this. */
  | 'no-plate'
  /** It is still cooking. */
  | 'not-ready'
  /** Nobody is waiting for this right now. */
  | 'nobody-wants'
  /** Nothing is ready for this guest yet. */
  | 'nothing-ready'
  /** There is nothing there. */
  | 'empty'
  /** The shift is over. */
  | 'done';

export type Result<E> = { ok: true; events: E[] } | { ok: false; reason: FailReason };
