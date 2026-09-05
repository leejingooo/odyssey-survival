import { L } from '../i18n';
import type { Rng } from '../core/rng';
import type { SaveData } from '../core/storage';
import { BOONS } from '../data/boons';
import { rarityWeight, type CardDef } from '../data/cards';
import type { GodId } from '../data/gods';
import type { HeroDef } from '../data/heroes';
import { applyPermanent } from '../data/permanent';
import { PERKS } from '../data/perks';
import { WEAPON_UPGRADES } from '../data/upgrades';
import { baseMechanics, baseStats, type Loadout } from './stats';

/**
 * Offered only when every real card is exhausted or blocked, so a very long run
 * never stalls on an empty choice screen.
 */
export const BOUNTY_CARD: CardDef = {
  id: 'fallback_bounty',
  kind: 'perk',
  effect: 'passive',
  icon: '🧺',
  rarity: 'common',
  maxLevel: 999,
  name: L('항해자의 보급', "Voyager's Ration", '航海者の糧', '航海者补给'),
  desc: L(
    '최대 체력 +12, 피해 +3%, 그리고 약간의 골드.',
    'Max health +12, damage +3%, and a little gold.',
    '最大体力+12、ダメージ+3%、そして少しのゴールド。',
    '生命上限 +12，伤害 +3%，并获得少量金币。',
  ),
  values: () => [],
  apply: (o, lv) => {
    o.stats.maxHp += 12 * lv;
    o.stats.damageMult *= 1 + 0.03 * lv;
  },
};

export const CHEST_POOL: CardDef[] = [...BOONS, ...WEAPON_UPGRADES];
export const LEVEL_POOL: CardDef[] = PERKS;

const ALL_CARDS = new Map<string, CardDef>(
  [...CHEST_POOL, ...LEVEL_POOL, BOUNTY_CARD].map((card) => [card.id, card]),
);

export function cardById(id: string): CardDef | undefined {
  return ALL_CARDS.get(id);
}

/** Distinct gods the player has already accepted a boon from. */
export function ownedGods(owned: ReadonlyMap<string, number>): Set<GodId> {
  const gods = new Set<GodId>();
  for (const [id, level] of owned) {
    if (level <= 0) continue;
    const god = ALL_CARDS.get(id)?.god;
    if (god) gods.add(god);
  }
  return gods;
}

/**
 * Rebuild the entire loadout from scratch: hero base -> permanent upgrades -> every owned
 * card at its current level. Cards are applied in the pool's canonical order
 * rather than acquisition order, so signature boons always establish their
 * mechanics before aspects compose bonuses onto them.
 */
export function buildLoadout(
  hero: HeroDef,
  save: SaveData,
  owned: ReadonlyMap<string, number>,
): Loadout {
  const out: Loadout = {
    stats: { ...baseStats(), ...hero.stats },
    mech: { ...baseMechanics(), ...hero.mech },
  };
  applyPermanent(out, save);
  for (const [id, card] of ALL_CARDS) {
    const level = owned.get(id) ?? 0;
    if (level <= 0) continue;
    card.apply(out, level);
  }
  // Hera's vows read the finished build, so they are settled last — otherwise
  // the bonus would depend on the order cards happened to be taken in.
  const godCount = ownedGods(owned).size;
  if (out.mech.allianceBonus > 0 && godCount > 0) {
    out.stats.damageMult *= 1 + out.mech.allianceBonus * godCount;
    out.stats.maxHp += out.mech.allianceHealth * godCount;
  }
  return out;
}

/**
 * One choice on the card screen. `replaces` is set when the vessel is already
 * full: taking this boon means giving that god up, and the card says so.
 */
export interface Offer {
  card: CardDef;
  replaces?: GodId;
}

export interface DrawOptions {
  rng: Rng;
  pool: readonly CardDef[];
  owned: ReadonlyMap<string, number>;
  luck: number;
  /** how many different gods this voyage may serve (permanent upgrades) */
  maxGods: number;
  /** gods bought in the Pantheon; boons from anyone else never appear */
  availableGods: ReadonlySet<GodId>;
  hero: HeroDef;
  count?: number;
}

/** The god you are least invested in — the one a swap gives up. */
function leastInvestedGod(owned: ReadonlyMap<string, number>): GodId | undefined {
  const ranks = new Map<GodId, number>();
  for (const [id, level] of owned) {
    const god = cardById(id)?.god;
    if (!god || level <= 0) continue;
    ranks.set(god, (ranks.get(god) ?? 0) + level);
  }
  let worst: GodId | undefined;
  let worstRanks = Infinity;
  for (const [god, total] of ranks) {
    if (total < worstRanks) {
      worstRanks = total;
      worst = god;
    }
  }
  return worst;
}

/**
 * Draw distinct offers. Deepening a boon you already hold is weighted up a
 * little so builds converge instead of sprawling. Once the vessel is full a
 * new god can still show up, but only as a swap — the alternative was showing
 * the same three cards for the rest of the voyage.
 */
export function drawOffers(opts: DrawOptions): Offer[] {
  const { rng, pool, owned, luck, maxGods, availableGods, hero } = opts;
  const count = opts.count ?? 3;
  const gods = ownedGods(owned);
  const hasAnyBoon = gods.size > 0;
  const full = gods.size >= maxGods;
  const swapTarget = full ? leastInvestedGod(owned) : undefined;

  const candidates = pool.filter((card) => {
    if (card.unavailableFor?.includes(hero.id)) return false;
    const level = owned.get(card.id) ?? 0;
    if (level >= card.maxLevel) return false;
    if (card.god) {
      if (!availableGods.has(card.god)) return false;
      // A god you already serve is always fair game. A new one is normal while
      // the vessel has room, and only offerable as a swap once it is full.
      if (!gods.has(card.god) && full && !swapTarget) return false;
    }
    // Divine Infusion needs a god to infuse.
    if (card.id === 'atk_infuse' && !hasAnyBoon) return false;
    return true;
  });

  const picks = rng.sampleWeighted(candidates, count, (card) => {
    let weight = rarityWeight(card.rarity, luck);
    if ((owned.get(card.id) ?? 0) > 0) weight *= 1.3;
    if (card.god && !gods.has(card.god)) {
      // Giving a god up is a real cost, so swaps stay a minority of what you
      // see. A god you simply have room for is not penalised at all — that
      // penalty used to apply either way, which buried every god you had not
      // already taken and made whichever one you took first feel omnipresent.
      weight *= full ? 0.3 : 1;
    }
    return weight;
  });

  const offers: Offer[] = picks.map((card) =>
    card.god && !gods.has(card.god) && swapTarget ? { card, replaces: swapTarget } : { card },
  );

  // Rather than padding with duplicates, show fewer cards; the bounty only
  // appears when literally nothing else can be offered.
  if (offers.length === 0) offers.push({ card: BOUNTY_CARD });
  return offers;
}
