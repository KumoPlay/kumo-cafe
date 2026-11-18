/**
 * The game clock for a shift. Shift time only moves while the clock runs, so
 * pausing, switching tabs or locking the phone never moves a timer.
 *
 * Call `frame(now)` once per animation frame with the frame's timestamp; it
 * returns how many milliseconds of shift time passed. A single frame never
 * counts for more than `maxStepMs`, so a stutter, a sleeping laptop or a tab
 * the browser froze can never make time jump ahead.
 */
export class GameClock {
  private running = false;
  private last: number | null = null;

  constructor(private readonly maxStepMs = 100) {}

  get isRunning(): boolean {
    return this.running;
  }

  start(): void {
    this.running = true;
    this.last = null;
  }

  pause(): void {
    this.running = false;
    this.last = null;
  }

  frame(now: number): number {
    if (!this.running || !Number.isFinite(now)) return 0;
    const last = this.last;
    this.last = now;
    // The first frame after starting only sets the starting point.
    if (last === null) return 0;
    const passed = now - last;
    return passed > 0 ? Math.min(passed, this.maxStepMs) : 0;
  }
}
