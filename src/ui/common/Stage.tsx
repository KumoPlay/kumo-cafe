import type { ComponentChildren } from 'preact';
import { useLayoutEffect, useRef, useState } from 'preact/hooks';

/**
 * The game is laid out on a portrait stage 360 units wide, scaled to fit the
 * screen. Tall phones get a taller stage (more room between the counter and
 * the jars); computers and tablets show it in the middle, with sky around it.
 */
export const STAGE_WIDTH = 360;
const MIN_HEIGHT = 620;
const MAX_HEIGHT = 800;

export function Stage({ children }: { children: ComponentChildren }) {
  const box = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState({ scale: 1, height: 640, framed: false });

  useLayoutEffect(() => {
    const element = box.current;
    if (!element) return;
    const measure = (): void => {
      const { width, height } = element.getBoundingClientRect();
      if (width <= 0 || height <= 0) return;
      const stageHeight = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, (height * STAGE_WIDTH) / width));
      const scale = Math.min(width / STAGE_WIDTH, height / stageHeight);
      setFit({ scale, height: stageHeight, framed: width - STAGE_WIDTH * scale > 12 });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div class="stage-box" ref={box}>
      <div
        class={fit.framed ? 'stage stage-framed' : 'stage'}
        style={{ width: `${STAGE_WIDTH}px`, height: `${fit.height}px`, transform: `translate(-50%, -50%) scale(${fit.scale})` }}
      >
        {children}
      </div>
    </div>
  );
}
