import { useEffect, useState } from 'preact/hooks';

/** A phone held sideways: too little height for the kitchen, so the game asks to turn it upright. */
const QUERY = '(orientation: landscape) and (max-height: 500px) and (pointer: coarse)';

export function useSideways(): boolean {
  const [sideways, setSideways] = useState(() => typeof matchMedia === 'function' && matchMedia(QUERY).matches);
  useEffect(() => {
    if (typeof matchMedia !== 'function') return;
    const query = matchMedia(QUERY);
    const update = (): void => setSideways(query.matches);
    query.addEventListener('change', update);
    update();
    return () => query.removeEventListener('change', update);
  }, []);
  return sideways;
}
