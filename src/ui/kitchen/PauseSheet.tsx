import { s } from '../../i18n';
import { unlockAudio } from '../../platform/audio';
import { Icon } from '../common/Icon';
import { Sheet } from '../common/Sheet';

export function PauseSheet({
  sound,
  relaxed,
  endless,
  onResume,
  onSound,
  onRelaxed,
  onRestart,
  onLeave,
  onCloseCafe,
}: {
  sound: boolean;
  relaxed: boolean;
  endless: boolean;
  onResume: () => void;
  onSound: () => void;
  onRelaxed: () => void;
  onRestart: () => void;
  onLeave: () => void;
  onCloseCafe: () => void;
}) {
  return (
    <Sheet title={s.pause.title} onClose={onResume} small>
      <div class="pause-buttons">
        <button class="button button-go button-wide button-big" onClick={onResume}>
          <Icon name="ui/play" />
          {s.pause.resume}
        </button>
        <div class="button-pair">
          <button
            class="button"
            role="switch"
            aria-checked={sound}
            onClick={() => {
              unlockAudio();
              onSound();
            }}
          >
            <Icon name={sound ? 'ui/sound-on' : 'ui/sound-off'} />
            {sound ? s.settings.soundOn : s.settings.soundOff}
          </button>
          <button class={`button switch${relaxed ? ' switch-on' : ''}`} role="switch" aria-checked={relaxed} onClick={onRelaxed}>
            <Icon name={relaxed ? 'ui/heart' : 'ui/heart-empty'} />
            {relaxed ? s.settings.relaxedOn : s.settings.relaxedOff}
          </button>
        </div>
        {endless ? (
          <button class="button button-wide" onClick={onCloseCafe}>
            <Icon name="ui/moon" />
            {s.pause.closeCafe}
          </button>
        ) : (
          <>
            <button class="button button-wide" onClick={onRestart}>
              <Icon name="ui/replay" />
              {s.pause.restart}
            </button>
            <button class="button button-wide" onClick={onLeave}>
              <Icon name="ui/home" />
              {s.pause.leave}
            </button>
            <p class="muted small center">{s.pause.note}</p>
          </>
        )}
      </div>
    </Sheet>
  );
}
