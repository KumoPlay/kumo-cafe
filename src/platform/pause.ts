/**
 * Calls `onAway` whenever the player stops looking at the game: the tab is
 * hidden, the page is put away, or the window loses focus. The game pauses
 * then, so no timer runs while nobody is watching. Returns a function that stops watching.
 */
export function watchForAway(onAway: () => void): () => void {
  const onVisibility = (): void => {
    if (document.visibilityState === 'hidden') onAway();
  };
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pagehide', onAway);
  window.addEventListener('blur', onAway);
  return () => {
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('pagehide', onAway);
    window.removeEventListener('blur', onAway);
  };
}

/** True when the player asked their device for less motion. */
export function prefersLessMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}
