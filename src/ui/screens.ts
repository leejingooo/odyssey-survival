import type { SaveData } from '../core/storage';
import type { EffectKind } from '../data/cards';
import {
  availableGods,
  GOD_IDS,
  godName,
  godTitle,
  GODS,
  nextGodToUnlock,
  type GodId,
} from '../data/gods';
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
import {
  PERMANENT,
  permanentDesc,
  permanentName,
  permanentRank,
  nextCost,
} from '../data/permanent';
import { MONETIZATION_ENABLED, type Monetization, type Product } from '../game/monetization';
import type { PendingChoice, Run } from '../game/run';
import { cardById, type Offer } from '../game/loadout';
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
import { heroPortrait } from './glyph';

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

export type ScreenName = 'title' | 'heroes' | 'permanent' | 'pantheon' | 'shop' | 'settings';

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

  // A concrete next goal beats an abstract "spend gold somewhere" prompt.
  const next = nextGodToUnlock(save);
  const goal = next
    ? el('p', {
        class: 'goal',
        text: `${next.emblem} ${t('menu.nextUnlock', godName(next.id), next.unlockCost)}`,
      })
    : null;

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
          button(t('menu.permanent'), () => ctx.go('permanent')),
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
      goal,
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

// ------------------------------------------------------------- permanent upgrades

export function permanentScreen(ctx: UiContext): HTMLElement {
  const { save } = ctx;
  const list = el('div', { class: 'row-list' });

  const paint = () => {
    clear(list);
    for (const def of PERMANENT) {
      const rank = permanentRank(save, def.id);
      const cost = nextCost(def, rank);
      const pips = el('div', { class: 'pips' });
      for (let i = 0; i < def.maxRank; i++) {
        pips.append(el('div', { class: `pip${i < rank ? ' is-on' : ''}` }));
      }
      const buy = button(
        cost === null ? t('ui.maxed') : t('perm.cost', cost),
        () => {
          if (cost === null) return;
          if (save.gold < cost) {
            ctx.toast(t('ui.notEnoughGold'));
            return;
          }
          save.gold -= cost;
          save.permanent[def.id] = rank + 1;
          ctx.commit();
          ctx.rerender();
        },
        'btn btn--ghost',
      );
      buy.disabled = cost === null;

      list.append(
        el('div', { class: 'row' }, [
          el('div', { class: 'row__head' }, [
            el('div', { class: 'row__name', text: permanentName(def.id) }),
            pips,
          ]),
          el('div', { class: 'row__desc', text: permanentDesc(def, rank) }),
          buy,
        ]),
      );
    }
  };
  paint();

  return el('div', { class: 'screen screen--menu fade-in' }, [
    topbar(ctx, t('perm.title'), () => ctx.go('title')),
    el('p', {
      class: 'hint',
      style: { textAlign: 'left', marginTop: '0' },
      text: t('perm.subtitle'),
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
      const sigil = el('div', {
        class: 'god-row__sigil',
        text: def.emblem,
        style: { '--accent': def.color } as Record<string, string>,
      });

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
            document.createTextNode(' ' + loc(def.infusion)),
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
      el('div', { class: 'toggle-row' }, [
        el('span', { text: t('ui.hapticStrength') }),
        button(
          save.hapticStrength === 'strong' ? t('ui.hapticStrong') : t('ui.hapticLight'),
          () => {
            save.hapticStrength = save.hapticStrength === 'strong' ? 'light' : 'strong';
            ctx.commit();
            ctx.rerender();
          },
          'btn btn--ghost',
        ),
      ]),
      toggle(t('ui.reducedMotion'), save.reducedMotion, (next) => (save.reducedMotion = next)),
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

function effectLabel(effect: EffectKind): string {
  return t(`effect.${effect}` as DictKey);
}

/**
 * One offer. The god's emblem and colour lead, the boon name is the biggest
 * thing on the card, and rarity is carried by the frame rather than by a word
 * the player has to stop and read.
 */
function offerCard(offer: Offer, run: Run, onPick: (offer: Offer) => void): HTMLElement {
  const { card } = offer;
  const level = (run.owned.get(card.id) ?? 0) + 1;
  const god = card.god ? GODS[card.god] : null;
  const accent = god ? god.color : card.kind === 'weapon' ? '#e8b64c' : '#b8d0a0';
  const emblem = god ? god.emblem : (card.icon ?? '✦');

  const source = god
    ? godName(card.god as GodId)
    : card.kind === 'weapon'
      ? t('card.weapon')
      : t('card.perk');

  const node = el('button', {
    class: `card card--${card.rarity}${offer.replaces ? ' card--swap' : ''}`,
    type: 'button',
    style: { '--accent': accent } as Record<string, string>,
  });

  const meta = el('div', { class: 'card__meta' }, [
    el('span', { class: `chip chip--${card.rarity}`, text: t(`rarity.${card.rarity}` as DictKey) }),
    el('span', { class: 'chip', text: effectLabel(card.effect) }),
    el('span', {
      class: 'chip chip--rank',
      text: level === 1 ? t('card.newLevel') : t('card.upgradeTo', level),
    }),
    card.temporaryLevels
      ? el('span', {
          class: 'chip chip--temp',
          text: t('card.temporary', card.temporaryLevels),
        })
      : null,
  ]);

  node.append(
    el('div', { class: 'card__emblem', text: emblem }),
    el('div', { class: 'card__body' }, [
      el('div', { class: 'card__source', text: source }),
      el('div', { class: 'card__name', text: loc(card.name) }),
      meta,
      el('div', { class: 'card__desc', text: loc(card.desc, ...card.values(level)) }),
      offer.replaces
        ? el('div', { class: 'card__swap' }, [
            el('span', { class: 'chip chip--warn', text: t('card.swap') }),
            document.createTextNode(' ' + t('card.swapDesc', godName(offer.replaces))),
          ])
        : null,
    ]),
  );
  node.addEventListener('click', () => onPick(offer));
  return node;
}

export function cardScreen(
  choice: PendingChoice,
  run: Run,
  onPick: (offer: Offer) => void,
): HTMLElement {
  const heading =
    choice.source === 'levelup'
      ? { title: t('levelup.title', choice.level), sub: t('levelup.pick') }
      : { title: t('chest.opened'), sub: t('chest.pick') };

  const list = el('div', { class: 'card-list' });
  for (const offer of choice.offers) list.append(offerCard(offer, run, onPick));

  // A new player has no way to know why only one god ever shows up, so the
  // rule is stated exactly where they run into it.
  const godsHeld = run.godsHeld.size;
  const showsSwap = choice.offers.some((offer) => offer.replaces);
  const slotNote =
    choice.source === 'chest' && (showsSwap || godsHeld >= run.maxGods)
      ? el('div', { class: 'slot-note' }, [
          el('div', { class: 'slot-note__title' }, [
            el('span', { text: '🏺 ' }),
            document.createTextNode(`${t('slots.title')}  ${godsHeld}/${run.maxGods}`),
          ]),
          el('p', {
            class: 'slot-note__body',
            text: showsSwap ? t('slots.full') : t('slots.hint', run.maxGods),
          }),
        ])
      : null;

  return el('div', { class: 'screen screen--overlay fade-in' }, [
    el('div', { class: 'center-col' }, [
      el('h2', { class: 'card-heading', text: heading.title }),
      el('p', { class: 'subtitle', text: heading.sub }),
      list,
      slotNote,
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

/** The cards you finished the run holding — the part players screenshot. */
function buildSummary(run: Run): HTMLElement | null {
  const rows: HTMLElement[] = [];
  for (const [id, level] of run.owned) {
    const card = cardById(id);
    if (!card || level <= 0) continue;
    const god = card.god ? GODS[card.god] : null;
    rows.push(
      el(
        'div',
        {
          class: 'build-item',
          style: god ? ({ '--accent': god.color } as Record<string, string>) : {},
        },
        [
          el('span', { class: 'build-item__icon', text: god ? god.emblem : (card.icon ?? '✦') }),
          el('span', { class: 'build-item__name', text: loc(card.name) }),
          el('span', { class: 'build-item__rank', text: String(level) }),
        ],
      ),
    );
  }
  if (rows.length === 0) return null;
  return el('div', { class: 'build' }, [
    el('div', { class: 'build__title', text: t('result.build') }),
    el('div', { class: 'build__grid' }, rows),
  ]);
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
      el('div', { class: 'result-grid', style: { width: '100%', maxWidth: '360px' } }, [
        cell(t('result.survived'), formatTime(run.time)),
        cell(t('result.levelReached'), String(run.level)),
        cell(t('ui.kills'), String(run.kills)),
        cell(t('result.goldEarned'), `◆ ${data.goldEarned}`),
      ]),
      buildSummary(run),
      actions,
    ]),
  ]);
}
