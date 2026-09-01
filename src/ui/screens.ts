import type { SaveData } from '../core/storage';
import type { CardDef } from '../data/cards';
import { availableGods, GOD_IDS, GOD_INFUSION, godName, godTitle, GODS } from '../data/gods';
import { BOONS_BY_GOD } from '../data/boons';
import {
  HEROES,
  HERO_IDS,
  heroDesc,
  heroName,
  heroRole,
  heroWeaponName,
  type HeroId,
} from '../data/heroes';
import { STAR_CHART, chartDesc, chartName, chartRank, nextCost } from '../data/starchart';
import { MONETIZATION_ENABLED, type Monetization, type Product } from '../game/monetization';
import type { PendingChoice, Run } from '../game/run';
import {
  formatTime,
  getLocale,
  loc,
  LOCALES,
  setLocale,
  t,
  type DictKey,
  type LocaleId,
} from '../i18n';
import { button, clear, el } from './dom';
import { cardIcon, godPip, heroPortrait } from './glyph';

export interface UiContext {
  save: SaveData;
  money: Monetization;
  commit(): void;
  toast(message: string): void;
  rerender(): void;
  go(screen: ScreenName): void;
  startRun(heroId: HeroId): void;
  resumeRun(): void;
  quitRun(): void;
  restartRun(): void;
  resetProgress(): void;
}

export type ScreenName = 'title' | 'heroes' | 'chart' | 'pantheon' | 'shop' | 'settings';

function goldChip(save: SaveData): HTMLElement {
  return el('div', { class: 'gold-chip' }, [
    el('span', { text: '◆' }),
    el('span', { text: String(save.gold) }),
  ]);
}

function topbar(ctx: UiContext, title: string, onBack: () => void): HTMLElement {
  return el('div', { class: 'topbar' }, [
    button('‹', onBack, 'btn btn--ghost'),
    el('h2', { class: 'section-title', style: { margin: '0' }, text: title }),
    goldChip(ctx.save),
  ]);
}

export function heroUnlocked(save: SaveData, id: HeroId): boolean {
  return (
    HEROES[id].unlockCost === 0 || save.iap.unlockAllHeroes || save.unlockedHeroes.includes(id)
  );
}

// ------------------------------------------------------------------- title

export function titleScreen(ctx: UiContext): HTMLElement {
  const { save } = ctx;
  const stats = el('p', {
    class: 'hint',
    text: `${t('menu.runs')} ${save.stats.runs}   ·   ${t('menu.bestTime')} ${formatTime(
      save.stats.bestTimeSec,
    )}`,
  });

  return el('div', { class: 'screen screen--menu fade-in' }, [
    el('div', { class: 'topbar' }, [el('span'), el('span'), goldChip(save)]),
    el('div', { class: 'center-col' }, [
      el('h1', { class: 'title', text: t('menu.title') }),
      el('p', { class: 'subtitle', text: t('menu.subtitle') }),
      el('div', { class: 'narrative' }, [
        el('span', { class: 'narrative__who', text: t('god.hades') }),
        document.createTextNode(t('story.intro')),
      ]),
      el('div', { class: 'stack', style: { width: '100%', maxWidth: '340px' } }, [
        button(t('ui.play'), () => ctx.go('heroes'), 'btn btn--primary btn--wide'),
        el('div', { class: 'btn-row' }, [
          button(t('menu.chart'), () => ctx.go('chart')),
          button(t('menu.pantheon'), () => ctx.go('pantheon')),
        ]),
        el('div', { class: 'btn-row' }, [
          button(t('ui.settings'), () => ctx.go('settings'), 'btn btn--ghost'),
          MONETIZATION_ENABLED
            ? button(t('menu.shop'), () => ctx.go('shop'), 'btn btn--ghost')
            : null,
        ]),
      ]),
      stats,
    ]),
  ]);
}

// -------------------------------------------------------------- hero select

export function heroScreen(ctx: UiContext): HTMLElement {
  const { save } = ctx;
  let selected: HeroId = heroUnlocked(save, save.lastHero as HeroId)
    ? (save.lastHero as HeroId)
    : 'odysseus';

  const grid = el('div', { class: 'hero-grid' });
  const quote = el('div', { class: 'narrative' });
  const startBtn = button(
    t('ui.play'),
    () => {
      if (!heroUnlocked(save, selected)) return;
      save.lastHero = selected;
      ctx.commit();
      ctx.startRun(selected);
    },
    'btn btn--primary btn--wide',
  );

  const paint = () => {
    clear(grid);
    for (const id of HERO_IDS) {
      const hero = HEROES[id];
      const unlocked = heroUnlocked(save, id);
      const card = el('button', {
        class: `hero-card${id === selected ? ' is-selected' : ''}${unlocked ? '' : ' is-locked'}`,
        type: 'button',
      });
      const portrait = heroPortrait(hero, 120);
      portrait.className = 'hero-card__portrait';
      card.append(
        portrait,
        el('div', { class: 'hero-card__name', text: heroName(id) }),
        el('div', { class: 'hero-card__role', text: `${heroRole(id)} · ${heroWeaponName(id)}` }),
        el('div', { class: 'hero-card__desc', text: heroDesc(id) }),
      );
      if (!unlocked) {
        card.append(el('div', { class: 'hero-card__lock', text: `◆ ${hero.unlockCost}` }));
      }
      card.addEventListener('click', () => {
        if (unlocked) {
          selected = id;
          paint();
          return;
        }
        if (save.gold < hero.unlockCost) {
          ctx.toast(t('ui.notEnoughGold'));
          return;
        }
        save.gold -= hero.unlockCost;
        save.unlockedHeroes.push(id);
        ctx.commit();
        selected = id;
        ctx.toast(t('ui.purchased'));
        ctx.rerender();
      });
      grid.append(card);
    }

    clear(quote);
    quote.append(
      el('span', { class: 'narrative__who', text: heroName(selected) }),
      document.createTextNode(t(`story.runStart.${selected}` as DictKey)),
    );
    startBtn.disabled = !heroUnlocked(save, selected);
    startBtn.textContent = heroUnlocked(save, selected)
      ? t('ui.play')
      : t('hero.unlockFor', HEROES[selected].unlockCost);
  };
  paint();

  return el('div', { class: 'screen screen--menu fade-in' }, [
    topbar(ctx, t('hero.select.title'), () => ctx.go('title')),
    el('div', { class: 'screen__scroll' }, [
      grid,
      quote,
      el('p', { class: 'hint', text: t('hero.select.hint') }),
    ]),
    el('div', { style: { paddingTop: '10px' } }, [startBtn]),
  ]);
}

// ------------------------------------------------------------- star chart

export function chartScreen(ctx: UiContext): HTMLElement {
  const { save } = ctx;
  const list = el('div', { class: 'row-list' });

  const paint = () => {
    clear(list);
    for (const def of STAR_CHART) {
      const rank = chartRank(save, def.id);
      const cost = nextCost(def, rank);
      const pips = el('div', { class: 'pips' });
      for (let i = 0; i < def.maxRank; i++) {
        pips.append(el('div', { class: `pip${i < rank ? ' is-on' : ''}` }));
      }
      const buy = button(
        cost === null ? t('ui.maxed') : t('chart.cost', cost),
        () => {
          if (cost === null) return;
          if (save.gold < cost) {
            ctx.toast(t('ui.notEnoughGold'));
            return;
          }
          save.gold -= cost;
          save.starChart[def.id] = rank + 1;
          ctx.commit();
          ctx.rerender();
        },
        'btn btn--ghost',
      );
      buy.disabled = cost === null;

      list.append(
        el('div', { class: 'row' }, [
          el('div', { class: 'row__head' }, [
            el('div', { class: 'row__name', text: chartName(def.id) }),
            pips,
          ]),
          el('div', { class: 'row__desc', text: chartDesc(def, rank) }),
          buy,
        ]),
      );
    }
  };
  paint();

  return el('div', { class: 'screen screen--menu fade-in' }, [
    topbar(ctx, t('chart.title'), () => ctx.go('title')),
    el('p', {
      class: 'hint',
      style: { textAlign: 'left', marginTop: '0' },
      text: t('chart.subtitle'),
    }),
    el('div', { class: 'screen__scroll' }, [list]),
  ]);
}

// --------------------------------------------------------------- pantheon

/**
 * The god codex and the shop for gods in one screen: every boon and every
 * infusion is readable before you spend a coin, because a blind unlock in a
 * game with an 11-god pantheon is just a lottery ticket.
 */
export function pantheonScreen(ctx: UiContext): HTMLElement {
  const { save } = ctx;
  const list = el('div', { class: 'row-list' });

  const paint = () => {
    clear(list);
    const owned = availableGods(save);
    for (const id of GOD_IDS) {
      const def = GODS[id];
      const unlocked = owned.has(id);
      const sigil = godPip(id, 44);
      sigil.className = 'god-row__sigil';

      const action =
        def.unlockCost === 0
          ? el('div', { class: 'god-row__state', text: t('pantheon.free') })
          : unlocked
            ? el('div', { class: 'god-row__state', text: t('pantheon.served') })
            : button(
                t('pantheon.unlockFor', def.unlockCost),
                () => {
                  if (save.gold < def.unlockCost) {
                    ctx.toast(t('ui.notEnoughGold'));
                    return;
                  }
                  save.gold -= def.unlockCost;
                  save.unlockedGods.push(id);
                  ctx.commit();
                  ctx.toast(t('pantheon.unlocked', godName(id)));
                  ctx.rerender();
                },
                'btn btn--ghost',
              );

      const boons = el('div', { class: 'god-row__boons' });
      for (const boon of BOONS_BY_GOD[id] ?? []) {
        boons.append(
          el('div', { class: 'god-boon' }, [
            el('span', { class: 'god-boon__name', text: loc(boon.name) }),
            document.createTextNode(' '),
            el('span', { class: 'god-boon__desc', text: loc(boon.desc, ...boon.values(1)) }),
          ]),
        );
      }

      list.append(
        el('div', { class: `row god-row${unlocked ? '' : ' is-locked'}` }, [
          el('div', { class: 'god-row__head' }, [
            sigil,
            el('div', { class: 'god-row__id' }, [
              el('div', { class: 'row__name', text: godName(id), style: { color: def.color } }),
              el('div', { class: 'god-row__title', text: godTitle(id) }),
            ]),
            action,
          ]),
          boons,
          el('div', { class: 'god-row__infusion' }, [
            el('span', { class: 'card__tag', text: t('pantheon.infusion') }),
            document.createTextNode(' ' + loc(GOD_INFUSION[id])),
          ]),
        ]),
      );
    }
  };
  paint();

  return el('div', { class: 'screen screen--menu fade-in' }, [
    topbar(ctx, t('pantheon.title'), () => ctx.go('title')),
    el('p', {
      class: 'hint',
      style: { textAlign: 'left', marginTop: '0' },
      text: t('pantheon.subtitle'),
    }),
    el('div', { class: 'screen__scroll' }, [list]),
  ]);
}

// -------------------------------------------------------------------- shop

export function shopScreen(ctx: UiContext): HTMLElement {
  const { save, money } = ctx;
  const list = el('div', { class: 'row-list' });

  const paint = () => {
    clear(list);

    // Rewarded ad for gold — the free path.
    const left = money.adsLeftToday();
    const adBtn = button(
      t('shop.watchAd'),
      async () => {
        const reward = await money.watchForGold();
        if (reward > 0) {
          ctx.toast(t('shop.adReward', reward));
          ctx.rerender();
        }
      },
      'btn btn--ghost',
    );
    adBtn.disabled = left <= 0;
    list.append(
      el('div', { class: 'row' }, [
        el('div', { class: 'row__head' }, [
          el('div', { class: 'row__name' }, [
            el('span', { class: 'badge-ad', text: 'AD' }),
            document.createTextNode(t('shop.adGold.name')),
          ]),
        ]),
        el('div', {
          class: 'row__desc',
          text: t('shop.adGold.desc', money.rewardAmount(), left, 5),
        }),
        adBtn,
      ]),
    );

    for (const product of money.billing.list()) {
      list.append(productRow(ctx, product));
    }

    list.append(
      button(
        t('shop.restore'),
        async () => {
          const count = await money.restore();
          ctx.toast(count > 0 ? t('ui.purchased') : t('shop.stub'));
          ctx.rerender();
        },
        'btn btn--ghost btn--wide',
      ),
    );
  };
  paint();

  return el('div', { class: 'screen screen--menu fade-in' }, [
    topbar(ctx, t('shop.title'), () => ctx.go('title')),
    el('p', {
      class: 'hint',
      style: { textAlign: 'left', marginTop: '0' },
      text: t('shop.subtitle'),
    }),
    el('div', { class: 'screen__scroll' }, [list]),
    el('p', { class: 'hint', text: save.iap.removeAds ? t('shop.removeAds.name') : '' }),
  ]);
}

function productRow(ctx: UiContext, product: Product): HTMLElement {
  const { save, money } = ctx;
  const owned =
    (product.id === 'remove_ads' && save.iap.removeAds) ||
    (product.id === 'unlock_all_heroes' && save.iap.unlockAllHeroes);

  let name: string;
  let desc: string;
  switch (product.id) {
    case 'gold_small':
    case 'gold_large':
      name = t('shop.goldPack.name', product.gold ?? 0);
      desc = '';
      break;
    case 'remove_ads':
      name = t('shop.removeAds.name');
      desc = t('shop.removeAds.desc');
      break;
    case 'unlock_all_heroes':
      name = t('shop.unlockAll.name');
      desc = t('shop.unlockAll.desc');
      break;
  }

  const buy = button(
    owned ? t('shop.owned') : (product.price ?? t('shop.buy')),
    async () => {
      const ok = await money.buy(product.id);
      ctx.toast(ok ? t('ui.purchased') : t('shop.stub'));
      if (ok) ctx.rerender();
    },
    'btn btn--ghost',
  );
  buy.disabled = owned || !money.billing.isAvailable();

  return el('div', { class: 'row' }, [
    el('div', { class: 'row__head' }, [el('div', { class: 'row__name', text: name })]),
    desc ? el('div', { class: 'row__desc', text: desc }) : null,
    buy,
  ]);
}

// ---------------------------------------------------------------- settings

export function settingsScreen(ctx: UiContext): HTMLElement {
  const { save } = ctx;

  const langRow = el('div', { class: 'chip-row' });
  for (const id of LOCALES) {
    const chip = el('button', {
      class: `chip${getLocale() === id ? ' is-on' : ''}`,
      type: 'button',
      text: localeLabel(id),
    });
    chip.addEventListener('click', () => {
      setLocale(id);
      save.locale = id;
      ctx.commit();
      ctx.rerender();
    });
    langRow.append(chip);
  }

  const toggle = (
    label: string,
    value: boolean,
    onChange: (next: boolean) => void,
  ): HTMLElement => {
    const btn = button(
      value ? t('ui.on') : t('ui.off'),
      () => {
        onChange(!value);
        ctx.commit();
        ctx.rerender();
      },
      'btn btn--ghost',
    );
    return el('div', { class: 'toggle-row' }, [el('span', { text: label }), btn]);
  };

  return el('div', { class: 'screen screen--menu fade-in' }, [
    topbar(ctx, t('ui.settings'), () => ctx.go('title')),
    el('div', { class: 'screen__scroll' }, [
      el('div', { class: 'field' }, [
        el('div', { class: 'field__label', text: t('ui.language') }),
        langRow,
      ]),
      toggle(t('ui.sound'), save.sfx, (next) => (save.sfx = next)),
      toggle(t('ui.music'), save.music, (next) => (save.music = next)),
      toggle(t('ui.haptics'), save.haptics, (next) => (save.haptics = next)),
      el('div', { style: { height: '20px' } }),
      button(
        t('ui.reset'),
        () => {
          if (window.confirm(t('ui.resetConfirm'))) ctx.resetProgress();
        },
        'btn btn--ghost btn--wide',
      ),
      el('p', { class: 'hint', style: { marginTop: '18px' }, text: t('ui.credits') }),
    ]),
  ]);
}

function localeLabel(id: LocaleId): string {
  switch (id) {
    case 'ko':
      return '한국어';
    case 'en':
      return 'English';
    case 'ja':
      return '日本語';
    case 'zh':
      return '中文';
  }
}

// ------------------------------------------------------------- card picker

export function cardScreen(
  choice: PendingChoice,
  run: Run,
  onPick: (card: CardDef) => void,
): HTMLElement {
  const heading =
    choice.source === 'levelup'
      ? { title: t('levelup.title', choice.level), sub: t('levelup.pick') }
      : { title: t('chest.opened'), sub: t('chest.pick') };

  const list = el('div', { class: 'card-list' });
  for (const card of choice.offers) {
    const level = (run.owned.get(card.id) ?? 0) + 1;
    const node = el('button', { class: `card card--${card.rarity}`, type: 'button' }, [
      cardIcon(card, 46),
    ]);
    const icon = node.firstElementChild as HTMLElement | null;
    if (icon) icon.className = 'card__icon';

    const tagText = card.god
      ? godName(card.god)
      : card.kind === 'weapon'
        ? t('card.weapon')
        : t('card.perk');

    node.append(
      el('div', { class: 'card__body' }, [
        el('div', { class: 'card__name' }, [
          document.createTextNode(loc(card.name)),
          el('span', {
            class: 'card__tag',
            style: card.god
              ? { color: GODS[card.god].color, borderColor: GODS[card.god].color }
              : {},
            text: tagText,
          }),
        ]),
        el('div', { class: 'card__desc', text: loc(card.desc, ...card.values(level)) }),
        el('div', {
          class: 'card__level',
          text: level === 1 ? t('card.newLevel') : t('card.upgradeTo', level),
        }),
      ]),
    );
    node.addEventListener('click', () => onPick(card));
    list.append(node);
  }

  const godsHeld = run.godsHeld;
  const capNote =
    godsHeld.size >= run.maxGods
      ? el('p', { class: 'hint', text: t('card.blocked', run.maxGods) })
      : null;

  return el('div', { class: 'screen screen--overlay fade-in' }, [
    el('div', { class: 'center-col' }, [
      el('h2', { class: 'title', style: { fontSize: '26px' }, text: heading.title }),
      el('p', { class: 'subtitle', text: heading.sub }),
      list,
      capNote,
    ]),
  ]);
}

// ------------------------------------------------------------------- pause

export function pauseScreen(ctx: UiContext, run: Run): HTMLElement {
  return el('div', { class: 'screen screen--overlay fade-in' }, [
    el('div', { class: 'center-col' }, [
      el('h2', { class: 'title', style: { fontSize: '32px' }, text: t('ui.pause') }),
      el('p', {
        class: 'subtitle',
        text: `${formatTime(run.time)} · ${t('ui.level')} ${run.level}`,
      }),
      el('div', { class: 'stack', style: { width: '100%', maxWidth: '320px' } }, [
        button(t('ui.resume'), () => ctx.resumeRun(), 'btn btn--primary btn--wide'),
        button(t('ui.settings'), () => ctx.go('settings'), 'btn btn--ghost btn--wide'),
        button(
          t('ui.quit'),
          () => {
            if (window.confirm(t('ui.quitConfirm'))) ctx.quitRun();
          },
          'btn btn--ghost btn--wide',
        ),
      ]),
    ]),
  ]);
}

// ------------------------------------------------------------------- death

export function deathScreen(
  run: Run,
  opts: {
    canFreeRevive: boolean;
    canAdRevive: boolean;
    onRevive: (viaAd: boolean) => void;
    onGiveUp: () => void;
  },
): HTMLElement {
  const actions = el('div', { class: 'stack', style: { width: '100%', maxWidth: '320px' } });
  if (opts.canFreeRevive) {
    actions.append(
      button(
        `${t('result.revive')} (${run.revivesLeft})`,
        () => opts.onRevive(false),
        'btn btn--primary btn--wide',
      ),
    );
  } else if (opts.canAdRevive) {
    const label = el('span');
    label.append(
      el('span', { class: 'badge-ad', text: 'AD' }),
      document.createTextNode(t('result.revive')),
    );
    actions.append(button(label, () => opts.onRevive(true), 'btn btn--primary btn--wide'));
  }
  actions.append(button(t('ui.confirm'), () => opts.onGiveUp(), 'btn btn--ghost btn--wide'));

  return el('div', { class: 'screen screen--overlay fade-in' }, [
    el('div', { class: 'center-col' }, [
      el('h2', { class: 'title', style: { color: '#c8434b' }, text: t('result.defeat') }),
      el('div', { class: 'narrative' }, [
        el('span', { class: 'narrative__who', text: heroName(run.hero.id) }),
        document.createTextNode(t(`story.death.${run.hero.id}` as DictKey)),
      ]),
      actions,
    ]),
  ]);
}

// ----------------------------------------------------------------- results

export interface ResultData {
  run: Run;
  goldEarned: number;
  isRecord: boolean;
  canDoubleGold: boolean;
  onDoubleGold: () => void;
  onRetry: () => void;
  onTitle: () => void;
}

export function resultScreen(data: ResultData): HTMLElement {
  const { run } = data;
  const cell = (label: string, value: string) =>
    el('div', { class: 'result-cell' }, [
      el('div', { class: 'result-cell__label', text: label }),
      el('div', { class: 'result-cell__value', text: value }),
    ]);

  const actions = el('div', { class: 'stack', style: { width: '100%', maxWidth: '340px' } });
  if (data.canDoubleGold) {
    const label = el('span');
    label.append(
      el('span', { class: 'badge-ad', text: 'AD' }),
      document.createTextNode(t('result.doubleGold')),
    );
    actions.append(button(label, data.onDoubleGold, 'btn btn--primary btn--wide'));
  }
  actions.append(
    el('div', { class: 'btn-row' }, [
      button(t('result.retry'), data.onRetry),
      button(t('result.toTitle'), data.onTitle),
    ]),
  );

  return el('div', { class: 'screen screen--menu fade-in' }, [
    el('div', { class: 'center-col' }, [
      el('h2', { class: 'title', style: { fontSize: '34px' }, text: t('result.defeat') }),
      data.isRecord ? el('p', { class: 'subtitle pulse', text: t('result.newRecord') }) : null,
      el('div', { class: 'result-grid', style: { width: '100%', maxWidth: '340px' } }, [
        cell(t('result.survived'), formatTime(run.time)),
        cell(t('result.levelReached'), String(run.level)),
        cell(t('ui.kills'), String(run.kills)),
        cell(t('result.goldEarned'), `◆ ${data.goldEarned}`),
      ]),
      actions,
    ]),
  ]);
}
