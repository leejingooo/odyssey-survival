import { formatTime, t } from '../i18n';
import type { GodId } from '../data/gods';
import type { Run } from '../game/run';
import { clear, el } from './dom';
import { godPip } from './glyph';

/** Persistent in-run overlay. Built once, then mutated every frame — no re-render. */
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

  private lastGods = '';

  constructor(onPause: () => void) {
    this.timer = el('div', { class: 'hud-timer', text: '0:00' });
    this.goldText = el('span', { text: '0' });
    this.killText = el('span', { text: '0' });
    this.levelText = el('span', { text: 'Lv 1' });
    this.hpFill = el('div', { class: 'bar__fill' });
    this.hpText = el('span', { text: '' });
    this.xpFill = el('div', { class: 'bar__fill' });
    this.boonStrip = el('div', { class: 'boon-strip' });

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

    // The boon strip only rebuilds when the set of gods or their levels changes.
    const gods = [...run.godsHeld];
    const signature = gods.map((god) => `${god}:${godLevel(run, god)}`).join(',');
    if (signature !== this.lastGods) {
      this.lastGods = signature;
      clear(this.boonStrip);
      for (const god of gods) {
        const pip = el('div', { class: 'boon-pip' }, [godPip(god, 24)]);
        pip.append(el('span', { class: 'boon-pip__lv', text: String(godLevel(run, god)) }));
        this.boonStrip.append(pip);
      }
    }
  }
}

/** Total boon ranks taken from one god — what the HUD pip shows. */
function godLevel(run: Run, god: GodId): number {
  let total = 0;
  for (const [id, level] of run.owned) {
    if (id.startsWith(`${god}_`)) total += level;
  }
  return total;
}
