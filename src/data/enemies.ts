import { t, type DictKey } from '../i18n';

export type EnemyId =
  | 'shade'
  | 'harpy'
  | 'spartoi'
  | 'siren'
  | 'cyclops'
  | 'satyr'
  | 'gorgon'
  | 'hoplite'
  | 'chimera'
  | 'minotaur'
  | 'cerberus'
  | 'hydra'
  | 'talos';

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
  satyr: {
    id: 'satyr',
    hp: 24,
    damage: 10,
    speed: 96,
    radius: 10,
    xp: 3,
    gold: 2,
    color: '#80603d',
    accent: '#d8b06d',
    behavior: 'strafe',
    knockbackResist: 0.12,
  },
  gorgon: {
    id: 'gorgon',
    hp: 58,
    damage: 13,
    speed: 36,
    radius: 14,
    xp: 6,
    gold: 4,
    color: '#47734f',
    accent: '#a9df86',
    behavior: 'shooter',
    knockbackResist: 0.4,
    shootInterval: 1.9,
    projectileSpeed: 115,
    projectileDamage: 15,
  },
  hoplite: {
    id: 'hoplite',
    hp: 88,
    damage: 16,
    speed: 48,
    radius: 16,
    xp: 7,
    gold: 4,
    color: '#9a783e',
    accent: '#f0d184',
    behavior: 'chase',
    knockbackResist: 0.68,
  },
  chimera: {
    id: 'chimera',
    hp: 210,
    damage: 23,
    speed: 58,
    radius: 24,
    xp: 14,
    gold: 9,
    color: '#a84932',
    accent: '#ffc06e',
    behavior: 'charger',
    knockbackResist: 0.78,
    chargeInterval: 3.5,
    chargeSpeed: 275,
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
  hydra: {
    id: 'hydra',
    hp: 3200,
    damage: 36,
    speed: 40,
    radius: 42,
    xp: 340,
    gold: 100,
    color: '#32705b',
    accent: '#8df0b5',
    behavior: 'shooter',
    knockbackResist: 0.97,
    boss: true,
    shootInterval: 1.25,
    projectileSpeed: 150,
    projectileDamage: 19,
  },
  talos: {
    id: 'talos',
    hp: 4200,
    damage: 42,
    speed: 45,
    radius: 44,
    xp: 420,
    gold: 125,
    color: '#9b572e',
    accent: '#ffc16b',
    behavior: 'charger',
    knockbackResist: 0.99,
    boss: true,
    chargeInterval: 2.7,
    chargeSpeed: 350,
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
  { fromMinute: 4, rate: 3.2, weights: { shade: 7, harpy: 7, spartoi: 5, siren: 2, satyr: 3 } },
  {
    fromMinute: 6,
    rate: 3.8,
    weights: { shade: 5, harpy: 6, spartoi: 7, siren: 3, cyclops: 1, satyr: 4, gorgon: 2 },
  },
  {
    fromMinute: 8.5,
    rate: 4.6,
    weights: { harpy: 5, spartoi: 7, siren: 4, cyclops: 2, satyr: 4, gorgon: 3, hoplite: 3 },
  },
  {
    fromMinute: 10,
    rate: 6.2,
    weights: { harpy: 4, spartoi: 6, siren: 4, cyclops: 3, gorgon: 4, hoplite: 5, chimera: 1 },
  },
  {
    fromMinute: 12,
    rate: 8.5,
    weights: { spartoi: 5, siren: 5, cyclops: 4, gorgon: 4, hoplite: 6, chimera: 2 },
  },
  {
    fromMinute: 15,
    rate: 11.5,
    weights: { siren: 5, cyclops: 5, gorgon: 5, hoplite: 7, chimera: 3 },
  },
  { fromMinute: 18, rate: 15.5, weights: { cyclops: 6, gorgon: 5, hoplite: 8, chimera: 5 } },
];

/** Bosses interrupt the wave table at fixed times. */
export const BOSS_SCHEDULE: { atMinute: number; id: EnemyId }[] = [
  { atMinute: 3, id: 'minotaur' },
  { atMinute: 6, id: 'cerberus' },
  { atMinute: 9, id: 'hydra' },
  { atMinute: 12, id: 'talos' },
  { atMinute: 15, id: 'minotaur' },
  { atMinute: 18, id: 'hydra' },
  { atMinute: 21, id: 'cerberus' },
  { atMinute: 24, id: 'talos' },
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
