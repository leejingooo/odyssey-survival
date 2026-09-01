import { audio } from './core/audio';
import { DragInput } from './core/input';
import { GameLoop } from './core/loop';
import { Renderer } from './core/renderer';
import { clearSave, loadSave, writeSave, type SaveData } from './core/storage';
import type { CardDef } from './data/cards';
import { godQuote } from './data/gods';
import { HEROES, type HeroId } from './data/heroes';
import { Monetization, StubAdProvider, StubBillingProvider } from './game/monetization';
import { drawRun } from './game/render';
import { Run, type PendingChoice } from './game/run';
import { onLocaleChange, setLocale, t } from './i18n';
import { clear, showToast } from './ui/dom';
import { Hud } from './ui/hud';
import {
  cardScreen,
  deathScreen,
  heroScreen,
  heroUnlocked,
  mirrorScreen,
  pauseScreen,
  resultScreen,
  settingsScreen,
  shopScreen,
  titleScreen,
  type ScreenName,
  type UiContext,
} from './ui/screens';

export class App {
  private readonly ui: HTMLElement;
  private readonly renderer: Renderer;
  private readonly input: DragInput;
  private readonly loop: GameLoop;
  private readonly money: Monetization;
  private readonly hud: Hud;

  private save: SaveData;
  private run: Run | null = null;
  private screen: ScreenName = 'title';
  private menuNode: HTMLElement | null = null;
  private overlay: HTMLElement | null = null;
  private wallTime = 0;

  /** One free ad-revive and one ad gold-double per voyage. */
  private adRevivesUsed = 0;
  private doubleGoldUsed = false;

  constructor(canvas: HTMLCanvasElement, ui: HTMLElement) {
    this.ui = ui;
    this.renderer = new Renderer(canvas);
    this.input = new DragInput();
    this.input.attach(canvas);
    this.save = loadSave();

    setLocale(this.save.locale);
    audio.sfxEnabled = this.save.sfx;
    audio.musicEnabled = this.save.music;

    this.money = new Monetization(
      new StubAdProvider(ui),
      new StubBillingProvider(),
      () => this.save,
      () => this.commit(),
    );

    this.hud = new Hud(() => this.pauseRun());

    this.loop = new GameLoop(
      (dt) => this.step(dt),
      (_alpha, frameDt) => this.render(frameDt),
    );

    onLocaleChange(() => this.rerender());
    document.addEventListener(
      'pointerdown',
      () => {
        audio.unlock();
        if (this.save.music) audio.startMusic();
      },
      { once: true },
    );
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.run?.phase === 'playing') this.pauseRun();
    });
  }

  start(): void {
    this.go('title');
    this.loop.start();
    // Exposed for automated smoke tests and for poking at a live run from the
    // browser console; it only reads state, it never drives the game.
    (window as unknown as { odyssey?: unknown }).odyssey = {
      snapshot: () => this.snapshot(),
      // Dev-only: steps the simulation without rendering so a soak test can
      // cover 25 minutes of scaling and boss spawns in a few seconds. Kept out
      // of production builds because it would also be a fast-forward cheat.
      ...(import.meta.env.DEV
        ? (() => {
            /**
             * Dev-only steering used by the soak test: back away from whatever is
             * closest, drift toward a chest when one is in reach, and hoover up loot when
             * nothing is pressing. Roughly how a cautious player moves, which is what
             * makes a fast-forwarded run worth measuring.
             */
            const autopilot = (run: Run): void => {
              const p = run.player;
              let ax = 0;
              let ay = 0;

              // Hold roughly a weapon's length from the pack: a melee hero has to close
              // in to be measured at all, an archer wants the gap.
              const reach = run.hero.weaponBase.range * run.stats.rangeMult;
              const keep = Math.max(48, reach * 0.7);

              let nearest = null;
              let nearestDist = Infinity;
              for (const enemy of run.enemies) {
                if (enemy.dead || enemy.status.charmTime > 0) continue;
                const dx = p.x - enemy.x;
                const dy = p.y - enemy.y;
                const d = Math.hypot(dx, dy) || 1;
                if (d < nearestDist) {
                  nearestDist = d;
                  nearest = enemy;
                }
                if (d > keep) continue;
                const weight = ((keep - d) / keep) ** 2 * (enemy.isBoss ? 3 : 1);
                ax += (dx / d) * weight;
                ay += (dy / d) * weight;
              }

              const pull = (tx: number, ty: number, weight: number) => {
                const dx = tx - p.x;
                const dy = ty - p.y;
                const d = Math.hypot(dx, dy) || 1;
                ax += (dx / d) * weight;
                ay += (dy / d) * weight;
              };

              let chest = null;
              let chestDist = Infinity;
              for (const c of run.chests) {
                const d = Math.hypot(c.x - p.x, c.y - p.y);
                if (d < chestDist) {
                  chestDist = d;
                  chest = c;
                }
              }
              if (chest) pull(chest.x, chest.y, 0.9);

              let loot = null;
              let lootDist = Infinity;
              for (const item of run.pickups) {
                const d = Math.hypot(item.x - p.x, item.y - p.y);
                if (d < lootDist) {
                  lootDist = d;
                  loot = item;
                }
              }
              if (loot && lootDist < 300) pull(loot.x, loot.y, 0.5);
              if (nearest && nearestDist > keep * 1.5) pull(nearest.x, nearest.y, 0.8);

              const len = Math.hypot(ax, ay);
              if (len < 0.01) {
                this.input.x = Math.cos(run.time);
                this.input.y = Math.sin(run.time);
                return;
              }
              this.input.x = ax / len;
              this.input.y = ay / len;
            };

            return {
              simulate: (seconds: number) => {
                const step = 1 / 60;
                for (let elapsed = 0; elapsed < seconds; elapsed += step) {
                  if (this.run?.phase !== 'playing') break;
                  autopilot(this.run);
                  this.run.step(step);
                }
                this.input.x = 0;
                this.input.y = 0;
                return this.snapshot();
              },
            };
          })()
        : {}),
    };
  }

  /** Read-only view of the current run, for tests and debugging. */
  snapshot(): Record<string, unknown> | null {
    const run = this.run;
    if (!run) return { screen: this.screen, gold: this.save.gold, running: false };
    return {
      running: true,
      hero: run.hero.id,
      phase: run.phase,
      time: Math.round(run.time * 10) / 10,
      level: run.level,
      kills: run.kills,
      gold: run.gold,
      hp: Math.round(run.player.hp),
      maxHp: Math.round(run.player.maxHp),
      enemies: run.enemies.length,
      projectiles: run.projectiles.length,
      chests: run.chests.length,
      pickups: run.pickups.length,
      owned: Object.fromEntries(run.owned),
      nearestChest: (() => {
        let best: { dx: number; dy: number } | null = null;
        let bestDist = Infinity;
        for (const chest of run.chests) {
          const dx = chest.x - run.player.x;
          const dy = chest.y - run.player.y;
          const d = dx * dx + dy * dy;
          if (d < bestDist) {
            bestDist = d;
            best = { dx: Math.round(dx), dy: Math.round(dy) };
          }
        }
        return best;
      })(),
      gods: [...run.godsHeld],
      maxGods: run.maxGods,
    };
  }

  // ------------------------------------------------------------- plumbing

  private commit(): void {
    audio.sfxEnabled = this.save.sfx;
    if (audio.musicEnabled !== this.save.music) audio.setMusicEnabled(this.save.music);
    writeSave(this.save);
  }

  private vibrate(ms: number): void {
    if (!this.save.haptics) return;
    navigator.vibrate?.(ms);
  }

  private toast(message: string): void {
    showToast(this.ui, message);
  }

  private get ctx(): UiContext {
    return {
      save: this.save,
      money: this.money,
      commit: () => this.commit(),
      toast: (message) => this.toast(message),
      rerender: () => this.rerender(),
      go: (screen) => this.go(screen),
      startRun: (heroId) => this.startRun(heroId),
      resumeRun: () => this.resumeRun(),
      quitRun: () => this.quitRun(),
      restartRun: () => this.restartRun(),
      resetProgress: () => this.resetProgress(),
    };
  }

  private rerender(): void {
    if (this.menuNode) this.go(this.screen);
    if (this.overlay && this.run?.phase === 'paused') this.showPause();
  }

  private go(screen: ScreenName): void {
    // Backing out of Settings while a voyage is paused returns to the pause menu.
    if (screen === 'title' && this.run && this.run.phase === 'paused') {
      this.clearMenu();
      this.showPause();
      return;
    }
    this.screen = screen;
    this.clearOverlay();
    this.clearMenu();
    this.input.setEnabled(false);

    const node = (() => {
      switch (screen) {
        case 'heroes':
          return heroScreen(this.ctx);
        case 'mirror':
          return mirrorScreen(this.ctx);
        case 'shop':
          return shopScreen(this.ctx);
        case 'settings':
          return settingsScreen(this.ctx);
        case 'title':
        default:
          return titleScreen(this.ctx);
      }
    })();

    this.menuNode = node;
    this.ui.append(node);
  }

  private clearMenu(): void {
    this.menuNode?.remove();
    this.menuNode = null;
  }

  private clearOverlay(): void {
    this.overlay?.remove();
    this.overlay = null;
  }

  private showOverlay(node: HTMLElement): void {
    this.clearOverlay();
    this.overlay = node;
    this.ui.append(node);
  }

  // ------------------------------------------------------------------ run

  private startRun(heroId: HeroId): void {
    if (!heroUnlocked(this.save, heroId)) return;
    this.clearMenu();
    this.clearOverlay();
    clear(this.ui);
    this.adRevivesUsed = 0;
    this.doubleGoldUsed = false;

    this.run = new Run({
      hero: HEROES[heroId],
      save: this.save,
      input: this.input,
      renderer: this.renderer,
      events: {
        onChoice: (choice) => this.showChoice(choice),
        onLevelUp: () => this.vibrate(12),
        onBoss: (name) => {
          this.toast(name);
          this.vibrate(40);
        },
        onNarrative: (text) => this.toast(text),
        onDeath: () => this.showDeath(),
      },
    });

    this.ui.append(this.hud.root);
    this.input.setEnabled(true);
    audio.unlock();
    if (this.save.music) audio.startMusic();
  }

  private showChoice(choice: PendingChoice): void {
    this.input.setEnabled(false);
    this.vibrate(10);
    const run = this.run;
    if (!run) return;
    this.showOverlay(cardScreen(choice, run, (card) => this.pickCard(card)));
  }

  private pickCard(card: CardDef): void {
    const run = this.run;
    if (!run) return;
    this.clearOverlay();
    run.take(card);
    // The god who just blessed you gets the last word.
    if (card.god) this.toast(godQuote(card.god));
    // `take` may present the next queued choice synchronously.
    if (!this.overlay) this.input.setEnabled(true);
  }

  private pauseRun(): void {
    const run = this.run;
    if (!run || run.phase !== 'playing') return;
    run.pause();
    this.input.setEnabled(false);
    this.showPause();
  }

  private showPause(): void {
    if (!this.run) return;
    this.showOverlay(pauseScreen(this.ctx, this.run));
  }

  private resumeRun(): void {
    const run = this.run;
    if (!run) return;
    this.clearOverlay();
    this.clearMenu();
    if (!this.ui.contains(this.hud.root)) this.ui.append(this.hud.root);
    run.resume();
    this.input.setEnabled(true);
  }

  private quitRun(): void {
    const run = this.run;
    if (run) this.bankRun(run);
    this.run = null;
    this.input.setEnabled(false);
    clear(this.ui);
    this.go('title');
  }

  private restartRun(): void {
    const heroId = this.run?.hero.id ?? (this.save.lastHero as HeroId);
    this.run = null;
    clear(this.ui);
    this.startRun(heroId);
  }

  private resetProgress(): void {
    this.save = clearSave();
    setLocale(this.save.locale);
    this.run = null;
    clear(this.ui);
    this.go('title');
  }

  // ---------------------------------------------------------------- death

  private showDeath(): void {
    const run = this.run;
    if (!run) return;
    this.input.setEnabled(false);
    this.vibrate(90);
    this.showOverlay(
      deathScreen(run, {
        canFreeRevive: run.revivesLeft > 0,
        canAdRevive: this.adRevivesUsed < 1 && this.money.ads.isReady('revive'),
        onRevive: (viaAd) => void this.doRevive(viaAd),
        onGiveUp: () => this.endRun(),
      }),
    );
  }

  private async doRevive(viaAd: boolean): Promise<void> {
    const run = this.run;
    if (!run) return;
    if (viaAd) {
      const earned = await this.money.watchForPlacement('revive');
      if (!earned) return;
      this.adRevivesUsed++;
    } else {
      if (run.revivesLeft <= 0) return;
      run.revivesLeft--;
    }
    this.clearOverlay();
    run.revive();
    this.input.setEnabled(true);
  }

  /** Fold the run's gold and records into the save. Safe to call once per run. */
  private bankRun(run: Run): { goldEarned: number; isRecord: boolean } {
    if (run.phase === 'finished') return { goldEarned: 0, isRecord: false };
    run.finish();
    const stats = this.save.stats;
    const isRecord = run.time > stats.bestTimeSec;
    stats.runs++;
    stats.bestTimeSec = Math.max(stats.bestTimeSec, run.time);
    stats.bestLevel = Math.max(stats.bestLevel, run.level);
    stats.totalKills += run.kills;
    this.save.gold += run.gold;
    this.commit();
    return { goldEarned: run.gold, isRecord };
  }

  private endRun(): void {
    const run = this.run;
    if (!run) return;
    const { goldEarned, isRecord } = this.bankRun(run);
    this.input.setEnabled(false);
    this.clearOverlay();
    clear(this.ui);

    const showResults = (gold: number, canDouble: boolean) => {
      this.menuNode?.remove();
      this.menuNode = resultScreen({
        run,
        goldEarned: gold,
        isRecord,
        canDoubleGold: canDouble,
        onDoubleGold: () => void this.doubleGold(run, gold, showResults),
        onRetry: () => {
          this.run = null;
          clear(this.ui);
          this.startRun(run.hero.id);
        },
        onTitle: () => {
          this.run = null;
          clear(this.ui);
          this.go('title');
        },
      });
      this.ui.append(this.menuNode);
    };

    showResults(
      goldEarned,
      !this.doubleGoldUsed && goldEarned > 0 && this.money.ads.isReady('double_gold'),
    );
  }

  private async doubleGold(
    run: Run,
    goldEarned: number,
    showResults: (gold: number, canDouble: boolean) => void,
  ): Promise<void> {
    if (this.doubleGoldUsed) return;
    const earned = await this.money.watchForPlacement('double_gold');
    if (!earned) return;
    this.doubleGoldUsed = true;
    this.save.gold += goldEarned;
    this.commit();
    this.toast(t('shop.adReward', goldEarned));
    void run;
    showResults(goldEarned * 2, false);
  }

  // ----------------------------------------------------------------- loop

  private step(dt: number): void {
    this.run?.step(dt);
  }

  private render(frameDt: number): void {
    this.wallTime += frameDt;
    this.renderer.update(frameDt);

    const run = this.run;
    if (run) {
      this.renderer.follow(run.player.x, run.player.y, frameDt);
      drawRun(run, this.renderer, this.wallTime);
      if (run.phase === 'playing' || run.phase === 'choosing') this.hud.update(run);
    } else {
      this.renderer.drawBackground(this.wallTime, '#16243f');
    }
  }
}
