import { t, type DictKey } from '../i18n';
import type { Loadout } from '../game/stats';
import type { SaveData } from '../core/storage';

/**
 * Meta progression — the Star Chart. Everything here is bought with gold
 * that survives death, and the headline entry is `boonSlots`: how many
 * different gods may bless a single voyage (1 at first, up to 3).
 */
export interface ChartDef {
  id: string;
  maxRank: number;
  /** costs[r] buys rank r+1 */
  costs: number[];
  /** number substituted into the localized description at this rank */
  value: (rank: number) => number;
  /** stat effect, if any; slot/revive/start-level entries are read directly */
  apply?: (out: Loadout, rank: number) => void;
}

export const STAR_CHART: ChartDef[] = [
  {
    id: 'boonSlots',
    maxRank: 2,
    costs: [1200, 3200],
    value: (rank) => rank + 1,
  },
  {
    id: 'vitality',
    maxRank: 5,
    costs: [80, 170, 300, 470, 700],
    value: (rank) => 15 * rank,
    apply: (o, rank) => {
      o.stats.maxHp += 15 * rank;
    },
  },
  {
    id: 'might',
    maxRank: 5,
    costs: [120, 250, 420, 640, 920],
    value: (rank) => 4 * rank,
    apply: (o, rank) => {
      o.stats.damageMult *= 1 + 0.04 * rank;
    },
  },
  {
    id: 'swift',
    maxRank: 4,
    costs: [100, 210, 360, 550],
    value: (rank) => 3 * rank,
    apply: (o, rank) => {
      o.stats.moveSpeed *= 1 + 0.03 * rank;
    },
  },
  {
    id: 'fortune',
    maxRank: 5,
    costs: [90, 190, 320, 490, 700],
    value: (rank) => 10 * rank,
    apply: (o, rank) => {
      o.stats.goldMult += 0.1 * rank;
    },
  },
  {
    id: 'wisdom',
    maxRank: 5,
    costs: [90, 190, 320, 490, 700],
    value: (rank) => 8 * rank,
    apply: (o, rank) => {
      o.stats.xpMult += 0.08 * rank;
    },
  },
  {
    id: 'defiance',
    maxRank: 2,
    costs: [750, 1900],
    value: (rank) => rank,
  },
  {
    id: 'treasure',
    maxRank: 3,
    costs: [150, 350, 620],
    value: (rank) => 15 * rank,
    apply: (o, rank) => {
      o.stats.luck += 0.5 * rank;
    },
  },
  {
    id: 'headstart',
    maxRank: 3,
    costs: [200, 470, 840],
    value: (rank) => rank + 1,
  },
];

export function chartRank(save: SaveData, id: string): number {
  return save.starChart[id] ?? 0;
}

/** Cost of the next rank, or null when maxed. */
export function nextCost(def: ChartDef, rank: number): number | null {
  return rank >= def.maxRank ? null : def.costs[rank];
}

export function chartName(id: string): string {
  return t(`chart.${id}.name` as DictKey);
}

/** Description shown at the rank the player would have *after* buying. */
export function chartDesc(def: ChartDef, rank: number): string {
  const shown = def.value(Math.min(rank + (rank < def.maxRank ? 1 : 0), def.maxRank));
  return t(`chart.${def.id}.desc` as DictKey, shown);
}

export function applyStarChart(out: Loadout, save: SaveData): void {
  for (const def of STAR_CHART) {
    const rank = chartRank(save, def.id);
    if (rank > 0) def.apply?.(out, rank);
  }
}

/** How many different gods may bless one voyage: 1 by default, 3 fully upgraded. */
export function maxBoonGods(save: SaveData): number {
  return 1 + chartRank(save, 'boonSlots');
}

export function startingLevel(save: SaveData): number {
  return 1 + chartRank(save, 'headstart');
}

export function startingRevives(save: SaveData): number {
  return chartRank(save, 'defiance');
}

/** Multiplier on how often treasure chests appear. */
export function chestRateMult(save: SaveData): number {
  return 1 + 0.15 * chartRank(save, 'treasure');
}
