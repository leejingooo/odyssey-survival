import { GODS, type GodId } from '../data/gods';
import type { Run } from '../game/run';
import { formatTime, t } from '../i18n';
import { clear, el } from './dom';

/**
 * Persistent in-run overlay. Built once and then mutated every frame, so the
 * only DOM work per frame is a handful of text and width assignments.
 */
export class Hud {
  readonly root: HTMLElement;

  private readonly timer: HTMLElement;
  private readonly goldText: HTMLElement;
  private readonly killText: HTMLElement;
  private readonly levelText: HTMLElement;
  private readonly hpFill: HTMLElement;
  private readonly hpText: HTMLElement;
  private readonly xpFill: HTMLElement;
  private readonly boonStrip: HTMLElement;
  private readonly tempStrip: HTMLElement;

  private lastGods = '';
  private lastTemp = '';

  constructor(onPause: () => void) {
    this.timer = el('div', { class: 'hud-timer', text: '0:00' });
    this.goldText = el('span', { text: '0' });
    this.killText = el('span', { text: '0' });
    this.levelText = el('span', { text: 'Lv 1' });
    this.hpFill = el('div', { class: 'bar__fill' });
    this.hpText = el('span', { text: '' });
    this.xpFill = el('div', { class: 'bar__fill' });
    this.boonStrip = el('div', { class: 'boon-strip' });
    this.tempStrip = el('div', { class: 'temp-strip' });

    const pauseBtn = el('button', {
      class: 'hud-btn',
      type: 'button',
      'aria-label': t('ui.pause'),
    });
    pauseBtn.textContent = '❚❚';
    pauseBtn.addEventListener('click', onPause);

    this.root = el('div', { id: 'hud' }, [
      el('div', { class: 'hud-row' }, [
        el('div', { class: 'hud-stat' }, [this.levelText]),
        this.timer,
        pauseBtn,
      ]),
      el('div', { class: 'bar bar--hp' }, [this.hpFill]),
      el('div', { class: 'bar bar--xp' }, [this.xpFill]),
      el('div', { class: 'hud-row' }, [
        el('div', { class: 'hud-stat' }, [this.hpText]),
        el('div', { class: 'hud-stat' }, [
          el('span', { style: { color: '#e8b64c' }, text: '◆' }),
          this.goldText,
          el('span', { style: { opacity: '0.6', marginLeft: '8px' }, text: '☠' }),
          this.killText,
        ]),
      ]),
      this.boonStrip,
      this.tempStrip,
    ]);
  }

  update(run: Run): void {
    this.timer.textContent = formatTime(run.time);
    this.goldText.textContent = String(run.gold);
    this.killText.textContent = String(run.kills);
    this.levelText.textContent = `${t('ui.level')} ${run.level}`;
    this.hpFill.style.width = `${run.hpProgress * 100}%`;
    this.hpText.textContent = `${Math.ceil(run.player.hp)} / ${Math.round(run.player.maxHp)}`;
    this.xpFill.style.width = `${run.xpProgress * 100}%`;

    // Both strips only rebuild when what they show actually changes.
    const gods = [...run.godsHeld];
    const godSignature = gods.map((god) => `${god}:${godRanks(run, god)}`).join(',');
    if (godSignature !== this.lastGods) {
      this.lastGods = godSignature;
      clear(this.boonStrip);
      for (const god of gods) {
        const pip = el('div', {
          class: 'boon-pip',
          style: { '--accent': GODS[god].color } as Record<string, string>,
        });
        pip.append(
          el('span', { class: 'boon-pip__emblem', text: GODS[god].emblem }),
          el('span', { class: 'boon-pip__lv', text: String(godRanks(run, god)) }),
        );
        this.boonStrip.append(pip);
      }
    }

    // Temporary perks need a visible countdown or they feel like a bug when
    // they disappear.
    const temps = run.activeTemporary();
    const tempSignature = temps.map((x) => `${x.card.id}:${x.levelsLeft}`).join(',');
    if (tempSignature !== this.lastTemp) {
      this.lastTemp = tempSignature;
      clear(this.tempStrip);
      for (const { card, levelsLeft } of temps) {
        this.tempStrip.append(
          el('div', { class: 'temp-pip', title: `${t('hud.temporary')} ${levelsLeft}` }, [
            el('span', { class: 'temp-pip__icon', text: card.icon ?? '✦' }),
            el('span', { class: 'temp-pip__lv', text: String(levelsLeft) }),
          ]),
        );
      }
    }
  }
}

/** Total boon ranks taken from one god — what the HUD pip counts. */
function godRanks(run: Run, god: GodId): number {
  let total = 0;
  for (const [id, level] of run.owned) {
    if (id.startsWith(`${god}_`)) total += level;
  }
  return total;
}
