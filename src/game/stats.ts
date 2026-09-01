/** Continuous numbers every system reads. Heroes seed them; boons/perks bend them. */
export interface Stats {
  maxHp: number;
  /** hp restored per second */
  regen: number;
  /** flat damage subtracted from every incoming hit (never below 1 damage) */
  armor: number;
  /** world units per second */
  moveSpeed: number;
  damageMult: number;
  attackSpeedMult: number;
  rangeMult: number;
  /** extra projectiles beyond the hero's base count */
  projectiles: number;
  pierce: number;
  /** 0 = straight, 1 = snaps onto the target almost instantly */
  homing: number;
  sizeMult: number;
  projectileSpeedMult: number;
  critChance: number;
  critMult: number;
  /** multiplier on god-ability cooldowns; below 1 is faster */
  cooldownMult: number;
  pickupRadius: number;
  xpMult: number;
  goldMult: number;
  dodge: number;
  /** shifts card rarity weights upward */
  luck: number;
  /** hp restored per kill */
  lifesteal: number;
}

export function baseStats(): Stats {
  return {
    maxHp: 100,
    regen: 0,
    armor: 0,
    moveSpeed: 118,
    damageMult: 1,
    attackSpeedMult: 1,
    rangeMult: 1,
    projectiles: 0,
    pierce: 0,
    homing: 0,
    sizeMult: 1,
    projectileSpeedMult: 1,
    critChance: 0.05,
    critMult: 1.8,
    cooldownMult: 1,
    pickupRadius: 72,
    xpMult: 1,
    goldMult: 1,
    dodge: 0,
    luck: 0,
    lifesteal: 0,
  };
}

/**
 * Discrete mechanics switched on by boons. Everything is a plain number so a
 * boon can simply add to it and stacking rules stay obvious; 0 means "off".
 */
export interface Mechanics {
  // Zeus
  chainJumps: number;
  chainDamage: number;
  chainRange: number;
  boltInterval: number;
  boltDamage: number;
  staticRadius: number;
  staticDamage: number;
  // Poseidon
  knockback: number;
  splashRadius: number;
  splashDamage: number;
  puddleChance: number;
  puddleDps: number;
  puddleSlow: number;
  puddleRadius: number;
  tridentEvery: number;
  tridentMult: number;
  // Ares
  bleedDps: number;
  bleedDuration: number;
  wrathBonus: number;
  slaughterHaste: number;
  slaughterDuration: number;
  // Athena
  aegisInterval: number;
  aegisMax: number;
  reflectDamage: number;
  // Aphrodite
  charmChance: number;
  charmDuration: number;
  weakenAmount: number;
  weakenDuration: number;
  heartbreakDamage: number;
  heartbreakRadius: number;
  // Hades
  soulChance: number;
  soulHeal: number;
  doomDamage: number;
  doomDelay: number;
  lastBreathChance: number;
  lastBreathDamage: number;
  lastBreathRadius: number;
  // Gaia
  thornInterval: number;
  thornDamage: number;
  thornCount: number;
  // hero innate / weapon upgrades
  reapThreshold: number;
  infusionPower: number;
}

export function baseMechanics(): Mechanics {
  return {
    chainJumps: 0,
    chainDamage: 0,
    chainRange: 0,
    boltInterval: 0,
    boltDamage: 0,
    staticRadius: 0,
    staticDamage: 0,
    knockback: 0,
    splashRadius: 0,
    splashDamage: 0,
    puddleChance: 0,
    puddleDps: 0,
    puddleSlow: 0,
    puddleRadius: 0,
    tridentEvery: 0,
    tridentMult: 0,
    bleedDps: 0,
    bleedDuration: 0,
    wrathBonus: 0,
    slaughterHaste: 0,
    slaughterDuration: 0,
    aegisInterval: 0,
    aegisMax: 0,
    reflectDamage: 0,
    charmChance: 0,
    charmDuration: 0,
    weakenAmount: 0,
    weakenDuration: 0,
    heartbreakDamage: 0,
    heartbreakRadius: 0,
    soulChance: 0,
    soulHeal: 0,
    doomDamage: 0,
    doomDelay: 0,
    lastBreathChance: 0,
    lastBreathDamage: 0,
    lastBreathRadius: 0,
    thornInterval: 0,
    thornDamage: 0,
    thornCount: 0,
    reapThreshold: 0,
    infusionPower: 0,
  };
}

/** What a card hands to the run when picked. */
export interface Loadout {
  stats: Stats;
  mech: Mechanics;
}
