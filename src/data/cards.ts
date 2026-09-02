import type { LocalizedText } from '../i18n';
import type { Loadout } from '../game/stats';
import type { GodId } from './gods';

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';
export type CardKind = 'boon' | 'weapon' | 'perk';

/**
 * How a card actually reaches the enemy. Players kept asking whether a boon
 * changed their attack or fired on its own, so every card says which it is.
 */
export type EffectKind = 'attack' | 'auto' | 'passive' | 'trigger';

export interface CardDef {
  id: string;
  kind: CardKind;
  rarity: Rarity;
  maxLevel: number;
  /** boons only: which god granted it */
  god?: GodId;
  /** how it works: rides your attack, fires itself, always on, or triggers */
  effect: EffectKind;
  /** emblem shown on the card and in the run summary; gods use their own */
  icon?: string;
  /**
   * Set on cards that wear off. The card is dropped this many level-ups after
   * it is taken, and the HUD counts the levels down while it is running.
   */
  temporaryLevels?: number;
  name: LocalizedText;
  /** `{0}`, `{1}`… are filled from `values(level)` */
  desc: LocalizedText;
  values: (level: number) => (string | number)[];
  /**
   * Applies the FULL effect of owning this card at `level`. The run rebuilds
   * its whole loadout from the hero base every time a card is taken, so these
   * are idempotent and never drift.
   */
  apply: (out: Loadout, level: number) => void;
}

/** Pick the entry for `level` (1-based) from a per-level table, clamping at the end. */
export function at<T>(table: readonly T[], level: number): T {
  return table[Math.min(Math.max(level, 1), table.length) - 1];
}

export const RARITY_WEIGHT: Record<Rarity, number> = {
  common: 100,
  rare: 46,
  epic: 17,
  legendary: 5,
};

/** Luck (from perks and the permanent upgrades) tilts the draw toward the top of the table. */
export function rarityWeight(rarity: Rarity, luck: number): number {
  const base = RARITY_WEIGHT[rarity];
  const bonus =
    rarity === 'common' ? 0 : rarity === 'rare' ? 0.16 : rarity === 'epic' ? 0.22 : 0.28;
  return base * (1 + bonus * luck);
}
