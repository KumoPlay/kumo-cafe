import { art } from '../../art';
import { STAGE_WIDTH } from '../common/Stage';

/**
 * Drag and drop, as an extra to tapping. A press that moves more than a few
 * pixels on something ready becomes a drag; let go over a guest or a plate to
 * hand it there. A press that does not move is an ordinary tap.
 */
export interface DragHandlers {
  /** The picture to show under the finger for a drag source, e.g. 'slot:griddle:0'. */
  imageFor: (source: string) => string | null;
  /** Guests or plates that would take this source: highlights them while dragging. */
  onStart: (source: string) => void;
  /** Dropped on a target (e.g. 'guest:12' or 'plate:1'), or null when dropped elsewhere. */
  onDrop: (source: string, target: string | null) => void;
}

const START_DISTANCE = 10;

export function startDragging(stage: HTMLElement, layer: HTMLElement, handlers: DragHandlers): () => void {
  let press: { source: string; x: number; y: number; id: number } | null = null;
  let ghost: HTMLImageElement | null = null;
  /** Set right after a drag, so the click that follows it is not also a tap. */
  let swallowClick = false;

  const toStage = (clientX: number, clientY: number): { x: number; y: number } => {
    const box = stage.getBoundingClientRect();
    const scale = box.width / STAGE_WIDTH || 1;
    return { x: (clientX - box.left) / scale, y: (clientY - box.top) / scale };
  };

  const moveGhost = (event: PointerEvent): void => {
    if (!ghost) return;
    const point = toStage(event.clientX, event.clientY);
    ghost.style.transform = `translate(${point.x - 30}px, ${point.y - 40}px)`;
  };

  const end = (): void => {
    ghost?.remove();
    ghost = null;
    press = null;
  };

  const onDown = (event: PointerEvent): void => {
    if (press || event.button > 0) return;
    const source = (event.target as Element | null)?.closest('[data-drag]')?.getAttribute('data-drag');
    if (!source) return;
    press = { source, x: event.clientX, y: event.clientY, id: event.pointerId };
  };

  const onMove = (event: PointerEvent): void => {
    if (!press || event.pointerId !== press.id) return;
    if (!ghost) {
      if (Math.hypot(event.clientX - press.x, event.clientY - press.y) < START_DISTANCE) return;
      const image = handlers.imageFor(press.source);
      if (!image) return end();
      ghost = document.createElement('img');
      ghost.src = art(image);
      ghost.alt = '';
      ghost.className = 'drag-ghost';
      layer.append(ghost);
      handlers.onStart(press.source);
    }
    moveGhost(event);
  };

  const onUp = (event: PointerEvent): void => {
    if (!press || event.pointerId !== press.id) return;
    if (ghost) {
      const under = document.elementFromPoint(event.clientX, event.clientY);
      const target = under?.closest('[data-drop]')?.getAttribute('data-drop') ?? null;
      handlers.onDrop(press.source, target);
      swallowClick = true;
      setTimeout(() => (swallowClick = false), 0);
    }
    end();
  };

  const onCancel = (): void => {
    if (ghost && press) handlers.onDrop(press.source, null);
    end();
  };

  const onClick = (event: MouseEvent): void => {
    if (!swallowClick) return;
    event.stopPropagation();
    event.preventDefault();
    swallowClick = false;
  };

  stage.addEventListener('pointerdown', onDown);
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onCancel);
  stage.addEventListener('click', onClick, true);
  return () => {
    end();
    stage.removeEventListener('pointerdown', onDown);
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onCancel);
    stage.removeEventListener('click', onClick, true);
  };
}
