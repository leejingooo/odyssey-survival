import type { EnemyDef } from '../data/enemies';
import type { GodId } from '../data/gods';

let nextId = 1;
export function newId(): number {
  return nextId++;
}

export interface StatusState {
  bleedDps: number;
  bleedTime: number;
  weaken: number;
  weakenTime: number;
  slow: number;
  slowTime: number;
  charmTime: number;
  doomTime: number;
  doomDamage: number;
}

export function emptyStatus(): StatusState {
  return {
    bleedDps: 0,
    bleedTime: 0,
    weaken: 0,
    weakenTime: 0,
    slow: 0,
    slowTime: 0,
    charmTime: 0,
    doomTime: 0,
    doomDamage: 0,
  };
}

export interface Enemy {
  id: number;
  def: EnemyDef;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  radius: number;
  speed: number;
  damage: number;
  /** seconds until this enemy can deal contact damage again */
  touchCd: number;
  /** white-flash timer for hit feedback */
  flash: number;
  status: StatusState;
  /** charger state */
  chargeCd: number;
  chargeTime: number;
  chargeX: number;
  chargeY: number;
  /** shooter state */
  shootCd: number;
  /** strafe wobble seed */
  phase: number;
  dead: boolean;
  isBoss: boolean;
}

export type ProjectileKind = 'arrow' | 'boulder' | 'scythe' | 'enemy';

export interface Projectile {
  id: number;
  kind: ProjectileKind;
  hostile: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  spin: number;
  radius: number;
  damage: number;
  life: number;
  pierceLeft: number;
  homing: number;
  /** enemies already damaged by this projectile */
  hit: Set<number>;
  splashRadius: number;
  splashDamage: number;
  color: string;
  /** Poseidon's empowered every-Nth shot */
  empowered: boolean;
  /** orbiting scythes are bound to the player instead of flying */
  orbitAngle: number;
  orbitRadius: number;
}

export type PickupKind = 'xp' | 'gold' | 'heal';

export interface Pickup {
  id: number;
  kind: PickupKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  value: number;
  /** set once the pickup has been pulled into the magnet radius */
  homing: boolean;
  life: number;
}

export interface Chest {
  id: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  radius: number;
  flash: number;
  bob: number;
}

export interface Puddle {
  id: number;
  x: number;
  y: number;
  radius: number;
  dps: number;
  slow: number;
  life: number;
  maxLife: number;
}

export type VfxKind = 'sweep' | 'burst' | 'ring' | 'bolt' | 'chain' | 'thorn' | 'text' | 'shield';

export interface Vfx {
  id: number;
  kind: VfxKind;
  x: number;
  y: number;
  x2: number;
  y2: number;
  radius: number;
  angle: number;
  arc: number;
  life: number;
  maxLife: number;
  color: string;
  text: string;
  /** damage numbers drift upward */
  vy: number;
  scale: number;
}

export interface Orbiter {
  angle: number;
  radius: number;
  cooldown: Map<number, number>;
}

/** Everything the player needs at runtime that is not part of `Stats`. */
export interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** direction the hero is travelling / attacking, radians */
  facing: number;
  hp: number;
  maxHp: number;
  attackCd: number;
  invuln: number;
  shields: number;
  aegisCd: number;
  boltCd: number;
  thornCd: number;
  slaughterTime: number;
  attackCounter: number;
  hurtFlash: number;
  /** infused god cycles so a multi-god build sees all of its elements */
  infusionIndex: number;
  infusedGods: GodId[];
}
