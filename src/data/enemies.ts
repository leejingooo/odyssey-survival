import { t, type DictKey } from '../i18n';

export type EnemyId = 'shade' | 'harpy' | 'spartoi' | 'siren' | 'cyclops' | 'minotaur' | 'cerberus';

export type EnemyBehavior = 'chase' | 'strafe' | 'charger' | 'shooter';

export interface EnemyDef {
  id: EnemyId;
  hp: number;
  /** contact damage per touch */
  damage: number;
  speed: number;
  radius: number;
  xp: number;
  gold: number;
  color: string;
  accent: string;
  behavior: EnemyBehavior;
  /** 0 = flung around freely, 1 = immovable */
  knockbackResist: number;
  boss?: boolean;
  shootInterval?: number;
  projectileSpeed?: number;
  projectileDamage?: number;
  /** charger only */
  chargeInterval?: number;
  chargeSpeed?: number;
}

export const ENEMIES: Record<EnemyId, EnemyDef> = {
  shade: {
    id: 'shade',
    hp: 13,
    damage: 8,
    speed: 46,
    radius: 10,
    xp: 1,
    gold: 1,
    color: '#5b5f86',
    accent: '#9aa0d0',
    behavior: 'chase',
    knockbackResist: 0,
  },
  harpy: {
    id: 'harpy',
    hp: 12,
    damage: 7,
    speed: 82,
    radius: 9,
    xp: 2,
    gold: 1,
    color: '#8a6b4f',
    accent: '#d9b892',
    behavior: 'strafe',
    knockbackResist: 0.1,
  },
  spartoi: {
    id: 'spartoi',
    hp: 42,
    damage: 12,
    speed: 40,
    radius: 13,
    xp: 3,
    gold: 2,
    color: '#a9a48c',
    accent: '#e6e0c8',
    behavior: 'chase',
    knockbackResist: 0.35,
  },
  siren: {
    id: 'siren',
    hp: 32,
    damage: 9,
    speed: 32,
    radius: 12,
    xp: 4,
    gold: 3,
    color: '#3d8fa8',
    accent: '#a5e8f5',
    behavior: 'shooter',
    knockbackResist: 0.2,
    shootInterval: 2.4,
    projectileSpeed: 130,
    projectileDamage: 11,
  },
  cyclops: {
    id: 'cyclops',
    hp: 145,
    damage: 20,
    speed: 30,
    radius: 22,
    xp: 10,
    gold: 6,
    color: '#7d5a44',
    accent: '#c99a72',
    behavior: 'charger',
    knockbackResist: 0.7,
    chargeInterval: 4.2,
    chargeSpeed: 240,
  },
  minotaur: {
    id: 'minotaur',
    hp: 1150,
    damage: 28,
    speed: 52,
    radius: 34,
    xp: 140,
    gold: 40,
    color: '#8e3b34',
    accent: '#f0a58c',
    behavior: 'charger',
    knockbackResist: 0.92,
    boss: true,
    chargeInterval: 3.2,
    chargeSpeed: 320,
  },
  cerberus: {
    id: 'cerberus',
    hp: 2300,
    damage: 32,
    speed: 48,
    radius: 38,
    xp: 280,
    gold: 80,
    color: '#4b2f6e',
    accent: '#b79aff',
    behavior: 'shooter',
    knockbackResist: 0.95,
    boss: true,
    shootInterval: 1.5,
    projectileSpeed: 165,
    projectileDamage: 16,
  },
};

export function enemyName(id: EnemyId): string {
  return t(`enemy.${id}` as DictKey);
}

/** Which trash spawns, and how fast, as the voyage wears on. */
export interface WaveDef {
  /** minute at which this wave takes over */
  fromMinute: number;
  /** spawns per second */
  rate: number;
  weights: Partial<Record<EnemyId, number>>;
}

export const WAVES: WaveDef[] = [
  { fromMinute: 0, rate: 1.1, weights: { shade: 10 } },
  { fromMinute: 1, rate: 1.8, weights: { shade: 10, harpy: 5 } },
  { fromMinute: 2.5, rate: 2.5, weights: { shade: 9, harpy: 7, spartoi: 3 } },
  { fromMinute: 4, rate: 3.2, weights: { shade: 7, harpy: 7, spartoi: 5, siren: 2 } },
  { fromMinute: 6, rate: 3.4, weights: { shade: 5, harpy: 7, spartoi: 7, siren: 3, cyclops: 1 } },
  { fromMinute: 8.5, rate: 3.9, weights: { harpy: 6, spartoi: 8, siren: 4, cyclops: 2 } },
  { fromMinute: 11, rate: 4.5, weights: { harpy: 6, spartoi: 8, siren: 5, cyclops: 4 } },
  { fromMinute: 14, rate: 5.2, weights: { harpy: 5, spartoi: 8, siren: 6, cyclops: 6 } },
  { fromMinute: 18, rate: 6.0, weights: { spartoi: 8, siren: 7, cyclops: 8 } },
];

/** Bosses interrupt the wave table at fixed times. */
export const BOSS_SCHEDULE: { atMinute: number; id: EnemyId }[] = [
  { atMinute: 5, id: 'minotaur' },
  { atMinute: 10, id: 'cerberus' },
  { atMinute: 15, id: 'minotaur' },
  { atMinute: 20, id: 'cerberus' },
  { atMinute: 25, id: 'cerberus' },
];

export function waveAt(minutes: number): WaveDef {
  let chosen = WAVES[0];
  for (const wave of WAVES) {
    if (minutes >= wave.fromMinute) chosen = wave;
  }
  return chosen;
}

/**
 * Difficulty curve. Health climbs faster than damage so the run stays about
 * out-scaling the horde rather than about getting one-shot.
 */
export function hpScale(minutes: number): number {
  return 1 + Math.pow(minutes, 1.25) * 0.11;
}

export function damageScale(minutes: number): number {
  return 1 + minutes * 0.1;
}

export function speedScale(minutes: number): number {
  return 1 + Math.min(minutes * 0.012, 0.35);
}
