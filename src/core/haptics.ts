import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

export type HapticCue =
  | 'attack'
  | 'critical'
  | 'hurt'
  | 'blocked'
  | 'warning'
  | 'boss'
  | 'reward'
  | 'death';

const WEB_PATTERNS: Record<HapticCue, number | number[]> = {
  attack: 8,
  critical: [12, 12, 18],
  hurt: [22, 18, 32],
  blocked: [10, 22, 10],
  warning: [18, 40, 18],
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
  strength: 'light' | 'strong' = 'light';
  private lastAttack = 0;

  play(cue: HapticCue): void {
    if (!this.enabled) return;
    const now = performance.now();
    if (cue === 'attack' && now - this.lastAttack < 65) return;
    if (cue === 'attack') this.lastAttack = now;

    if (!Capacitor.isNativePlatform()) {
      const pattern = WEB_PATTERNS[cue];
      navigator.vibrate?.(
        this.strength === 'strong'
          ? Array.isArray(pattern)
            ? pattern.map((n, i) => (i % 2 === 0 ? Math.round(n * 1.45) : n))
            : Math.round(pattern * 1.45)
          : pattern,
      );
      return;
    }

    const task =
      cue === 'death'
        ? Haptics.notification({ type: NotificationType.Error })
        : cue === 'reward'
          ? Haptics.notification({ type: NotificationType.Success })
          : Haptics.impact({
              style:
                cue === 'hurt' ||
                cue === 'boss' ||
                (cue === 'critical' && this.strength === 'strong')
                  ? ImpactStyle.Heavy
                  : cue === 'blocked' || cue === 'critical' || cue === 'warning'
                    ? ImpactStyle.Medium
                    : ImpactStyle.Light,
            });
    // Haptics are enhancement only; unsupported hardware must never stop play.
    void task.catch(() => navigator.vibrate?.(WEB_PATTERNS[cue]));
  }
}

export const haptics = new HapticFeedback();
