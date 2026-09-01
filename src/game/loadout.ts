import { L } from '../i18n';
import type { Rng } from '../core/rng';
import type { SaveData } from '../core/storage';
import { BOONS } from '../data/boons';
import { rarityWeight, type CardDef } from '../data/cards';
import type { GodId } from '../data/gods';
import type { HeroDef } from '../data/heroes';
import { applyStarChart } from '../data/starchart';
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
 * Rebuild the entire loadout from scratch: hero base -> star chart -> every owned
 * card at its current level. Cards are therefore idempotent and re-orderable,
 * which is what makes `apply` safe to write as "the full effect at level N".
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
  applyStarChart(out, save);
  for (const [id, level] of owned) {
    if (level <= 0) continue;
    ALL_CARDS.get(id)?.apply(out, level);
  }
  return out;
}

export interface DrawOptions {
  rng: Rng;
  pool: readonly CardDef[];
  owned: ReadonlyMap<string, number>;
  luck: number;
  /** how many different gods this voyage may serve (Star Chart) */
  maxGods: number;
  /** gods bought in the Pantheon; boons from anyone else never appear */
  availableGods: ReadonlySet<GodId>;
  count?: number;
}

/**
 * Draw distinct offers. Boons from a new god are filtered out once the vessel
 * is full, and deepening a boon you already hold is weighted up a little so
 * builds converge instead of sprawling.
 */
export function drawOffers(opts: DrawOptions): CardDef[] {
  const { rng, pool, owned, luck, maxGods, availableGods } = opts;
  const count = opts.count ?? 3;
  const gods = ownedGods(owned);
  const hasAnyBoon = gods.size > 0;

  const candidates = pool.filter((card) => {
    const level = owned.get(card.id) ?? 0;
    if (level >= card.maxLevel) return false;
    if (card.god) {
      if (!availableGods.has(card.god)) return false;
      if (!gods.has(card.god) && gods.size >= maxGods) return false;
    }
    // Divine Infusion needs a god to infuse.
    if (card.id === 'atk_infuse' && !hasAnyBoon) return false;
    return true;
  });

  const picks = rng.sampleWeighted(candidates, count, (card) => {
    let weight = rarityWeight(card.rarity, luck);
    if ((owned.get(card.id) ?? 0) > 0) weight *= 1.3;
    return weight;
  });

  // Rather than padding with duplicates, show fewer cards; the bounty only
  // appears when literally nothing else can be offered.
  if (picks.length === 0) picks.push(BOUNTY_CARD);
  return picks;
}
