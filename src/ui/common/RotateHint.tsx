import { s } from '../../i18n';
import { Icon } from './Icon';

/** Shown on phones held sideways. */
export function RotateHint() {
  return (
    <div class="rotate-hint" role="alertdialog" aria-label={s.rotate.title}>
      <div class="rotate-phone" aria-hidden="true">
        <Icon name="guests/mochi" class="rotate-face" />
      </div>
      <h1>{s.rotate.title}</h1>
      <p class="muted">{s.rotate.text}</p>
    </div>
  );
}
