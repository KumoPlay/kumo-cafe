import { art } from '../../art';
import { prefersLessMotion } from '../../platform/pause';
import { STAGE_WIDTH } from '../common/Stage';

/**
 * Little moments of movement that are not part of the game state: food
 * flying to a plate or a guest, coins flying to the coin counter, numbers
 * floating up, a gentle wiggle. They are drawn on a layer above the kitchen
 * and never block a tap. With "reduce motion" on, nothing flies; numbers simply appear.
 */
export const FLY_MS = 280;

export class Fx {
  constructor(
    private readonly stage: HTMLElement,
    private readonly layer: HTMLElement,
  ) {}

  /** Where an anchor is, in stage units. */
  private centerOf(anchor: string): { x: number; y: number } | null {
    const element = this.stage.querySelector(`[data-anchor="${anchor}"]`);
    if (!element) return null;
    const stage = this.stage.getBoundingClientRect();
    const scale = stage.width / STAGE_WIDTH || 1;
    const box = element.getBoundingClientRect();
    return { x: (box.left + box.width / 2 - stage.left) / scale, y: (box.top + box.height / 2 - stage.top) / scale };
  }

  /** A picture flies in a small arc from one place to another. */
  fly(image: string, from: string, to: string, options: { size?: number; delay?: number } = {}): void {
    if (prefersLessMotion()) return;
    const start = this.centerOf(from);
    const end = this.centerOf(to);
    if (!start || !end) return;
    const size = options.size ?? 46;
    const img = document.createElement('img');
    img.src = art(image);
    img.alt = '';
    img.className = 'fx-fly';
    img.style.width = `${size}px`;
    img.style.height = `${size}px`;
    img.style.left = `${start.x - size / 2}px`;
    img.style.top = `${start.y - size / 2}px`;
    this.layer.append(img);
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const lift = Math.min(70, Math.abs(dx) * 0.25 + 26);
    const animation = img.animate(
      [
        { transform: 'translate(0, 0) scale(0.9)' },
        { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - lift}px) scale(1.12)`, offset: 0.5 },
        { transform: `translate(${dx}px, ${dy}px) scale(0.85)` },
      ],
      { duration: FLY_MS, delay: options.delay ?? 0, easing: 'ease-in-out', fill: 'both' },
    );
    const remove = (): void => img.remove();
    animation.onfinish = remove;
    animation.oncancel = remove;
  }

  /** A word or number floats up from a place: "+12", "Happy streak ×3!". */
  float(text: string, at: string, kind: 'coins' | 'streak', delay = 0): void {
    const point = this.centerOf(at);
    if (!point) return;
    const note = document.createElement('div');
    note.className = `fx-float fx-float-${kind}`;
    note.textContent = text;
    note.style.top = `${point.y}px`;
    note.style.animationDelay = `${delay}ms`;
    this.layer.append(note);
    // Keep the whole text on screen, even above a guest at the edge.
    const half = note.offsetWidth / 2 + 6;
    note.style.left = `${Math.min(STAGE_WIDTH - half, Math.max(half, point.x))}px`;
    setTimeout(() => note.remove(), 1400 + delay);
  }

  /** A gentle "not now" shake. */
  wiggle(element: Element | null): void {
    if (!element || !('animate' in element)) return;
    const frames = prefersLessMotion()
      ? [{ opacity: 1 }, { opacity: 0.55 }, { opacity: 1 }]
      : [
          { transform: 'translateX(0)' },
          { transform: 'translateX(-5px)' },
          { transform: 'translateX(4px)' },
          { transform: 'translateX(-2px)' },
          { transform: 'translateX(0)' },
        ];
    element.animate(frames, { duration: 320, easing: 'ease-out' });
  }

  clear(): void {
    this.layer.replaceChildren();
  }
}
