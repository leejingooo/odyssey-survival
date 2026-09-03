import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

export type HapticCue = 'attack' | 'hurt' | 'blocked' | 'boss' | 'reward' | 'death';

const WEB_PATTERNS: Record<HapticCue, number | number[]> = {
  attack: 8,
  hurt: [22, 18, 32],
  blocked: [10, 22, 10],
  boss: [35, 45, 55],
  reward: [10, 35, 18],
  death: [70, 45, 110],
};

/**
 * One haptic vocabulary for web and native builds. Attack feedback is heavily
 * rate-limited: an aura or multishot must feel crisp, not turn into a buzz.
 */
export class HapticFeedback {
  enabled = true;
  private lastAttack = 0;

  play(cue: HapticCue): void {
    if (!this.enabled) return;
    const now = performance.now();
    if (cue === 'attack' && now - this.lastAttack < 65) return;
    if (cue === 'attack') this.lastAttack = now;

    if (!Capacitor.isNativePlatform()) {
      navigator.vibrate?.(WEB_PATTERNS[cue]);
      return;
    }

    const task =
      cue === 'death'
        ? Haptics.notification({ type: NotificationType.Error })
        : cue === 'reward'
          ? Haptics.notification({ type: NotificationType.Success })
          : Haptics.impact({
              style:
                cue === 'hurt' || cue === 'boss'
                  ? ImpactStyle.Heavy
                  : cue === 'blocked'
                    ? ImpactStyle.Medium
                    : ImpactStyle.Light,
            });
    // Haptics are enhancement only; unsupported hardware must never stop play.
    void task.catch(() => navigator.vibrate?.(WEB_PATTERNS[cue]));
  }
}

export const haptics = new HapticFeedback();
