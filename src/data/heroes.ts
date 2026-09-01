import { t } from '../i18n';
import type { Mechanics, Stats } from '../game/stats';

export type HeroId = 'odysseus' | 'achilles' | 'sisyphus' | 'thanatos';

/** How a hero's basic attack behaves; drives both simulation and rendering. */
export type WeaponKind = 'bow' | 'sword' | 'boulder' | 'aura';

export interface WeaponBase {
  damage: number;
  /** seconds between attacks at 1x attack speed */
  cooldown: number;
  /** projectile lifetime range, or melee/aura radius */
  range: number;
  speed: number;
  count: number;
  /** collision radius of a projectile, or half-thickness of the sweep */
  size: number;
  pierce: number;
  /** sword only: half-angle of the swing, radians */
  arc?: number;
}

export interface HeroDef {
  id: HeroId;
  weapon: WeaponKind;
  /** 0 = available from the first launch */
  unlockCost: number;
  color: string;
  accent: string;
  stats: Partial<Stats>;
  mech: Partial<Mechanics>;
  weaponBase: WeaponBase;
}

export const HEROES: Record<HeroId, HeroDef> = {
  odysseus: {
    id: 'odysseus',
    weapon: 'bow',
    unlockCost: 0,
    color: '#e8b64c',
    accent: '#fff0c4',
    stats: { maxHp: 100, moveSpeed: 122, critChance: 0.08 },
    mech: {},
    // One arrow one-shots early trash; pierce 1 keeps him relevant once packs form.
    weaponBase: {
      damage: 14,
      cooldown: 0.42,
      range: 340,
      speed: 420,
      count: 1,
      size: 6,
      pierce: 1,
    },
  },
  achilles: {
    id: 'achilles',
    weapon: 'sword',
    unlockCost: 350,
    color: '#d9534f',
    accent: '#ffc0a8',
    // Tanky bruiser: the reward for having to hug everything he kills.
    stats: { maxHp: 165, moveSpeed: 126, armor: 3, critChance: 0.06, critMult: 2.1 },
    // Shoving the pack off him is Achilles' defence, so his knockback is large.
    mech: { knockback: 55 },
    weaponBase: {
      damage: 24,
      cooldown: 0.62,
      range: 92,
      speed: 0,
      count: 1,
      size: 26,
      pierce: 99,
      arc: 1.05,
    },
  },
  sisyphus: {
    id: 'sisyphus',
    weapon: 'boulder',
    unlockCost: 900,
    color: '#9aa4b2',
    accent: '#e2e8f0',
    stats: { maxHp: 120, moveSpeed: 108, armor: 1 },
    mech: { splashRadius: 44, splashDamage: 0.55, knockback: 22 },
    weaponBase: {
      damage: 30,
      cooldown: 1.05,
      range: 250,
      speed: 205,
      count: 1,
      size: 13,
      pierce: 2,
    },
  },
  thanatos: {
    id: 'thanatos',
    weapon: 'aura',
    unlockCost: 1600,
    color: '#8b6be0',
    accent: '#d5c2ff',
    stats: { maxHp: 92, moveSpeed: 132, regen: 0.6 },
    // Reaps anything already under 9% health — his whole identity.
    mech: { reapThreshold: 0.09 },
    weaponBase: {
      damage: 7.5,
      cooldown: 0.38,
      range: 96,
      speed: 0,
      count: 1,
      size: 96,
      pierce: 99,
    },
  },
};

export const HERO_IDS: HeroId[] = ['odysseus', 'achilles', 'sisyphus', 'thanatos'];

export function heroName(id: HeroId): string {
  return t(`hero.${id}.name` as 'hero.odysseus.name');
}

export function heroRole(id: HeroId): string {
  return t(`hero.${id}.role` as 'hero.odysseus.role');
}

export function heroDesc(id: HeroId): string {
  return t(`hero.${id}.desc` as 'hero.odysseus.desc');
}

export function heroWeaponName(id: HeroId): string {
  return t(`hero.${id}.weapon` as 'hero.odysseus.weapon');
}
