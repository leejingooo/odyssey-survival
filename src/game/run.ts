import { audio } from '../core/audio';
import type { DragInput } from '../core/input';
import { angleDelta, clamp, dist, dist2, TAU } from '../core/math';
import type { Renderer } from '../core/renderer';
import { Rng } from '../core/rng';
import type { SaveData } from '../core/storage';
import type { CardDef } from '../data/cards';
import {
  BOSS_SCHEDULE,
  ENEMIES,
  damageScale,
  enemyName,
  hpScale,
  speedScale,
  waveAt,
  type EnemyDef,
  type EnemyId,
} from '../data/enemies';
import { availableGods, GODS, type GodId } from '../data/gods';
import type { HeroDef } from '../data/heroes';
import { chestRateMult, maxBoonGods, startingLevel, startingRevives } from '../data/permanent';
import { t } from '../i18n';
import {
  emptyStatus,
  newId,
  type Chest,
  type Enemy,
  type PlayerState,
  type Pickup,
  type Projectile,
  type Puddle,
  type Vfx,
} from './entities';
import {
  BOUNTY_CARD,
  CHEST_POOL,
  LEVEL_POOL,
  buildLoadout,
  cardById,
  drawOffers,
  ownedGods,
  type Offer,
} from './loadout';
import { SpatialHash } from './spatial';
import { BASE_MOVE_SPEED, type Loadout } from './stats';

export type RunPhase = 'playing' | 'choosing' | 'paused' | 'dead' | 'finished';
export type ChoiceSource = 'chest' | 'levelup';

export interface PendingChoice {
  source: ChoiceSource;
  offers: Offer[];
  /** level reached, for the level-up header */
  level: number;
}

export interface RunEvents {
  onChoice(choice: PendingChoice): void;
  onLevelUp(level: number): void;
  onBoss(name: string): void;
  onDeath(): void;
  /** Hestia caught you: worth a line, because it looks like a death otherwise */
  onFlame(): void;
  onNarrative(text: string): void;
  /** A direct basic-attack impact, excluding damage-over-time ticks. */
  onAttackHit(critical: boolean): void;
  /** Damage received, or a shield charge spent to stop it. */
  onPlayerHit(blocked: boolean): void;
  /** A boss has committed to a telegraphed signature attack. */
  onBossAttack(): void;
}

// Past this the screen stops reading as a crowd and starts reading as a wall,
// which is unfair rather than hard.
const MAX_ENEMIES = 520;
/** How long the hero must hold still before Hestia's hearth catches. */
const HEARTH_DELAY = 0.8;
/** Seconds out of combat before Hestia's warmth starts closing wounds. */
const WARMTH_DELAY = 3;
/** Half-angle of the aim-assist cone, and how far it looks. */
const AIM_ASSIST = 0.28;
const AIM_ASSIST_RANGE = 340;
const MAX_CHESTS = 3;
const CHEST_BASE_INTERVAL = 21;
const WORLD_LIMIT = 4200;

export class Run {
  readonly hero: HeroDef;
  readonly save: SaveData;
  readonly rng: Rng;
  readonly seed: number;

  phase: RunPhase = 'playing';
  time = 0;
  level: number;
  xp = 0;
  xpNext: number;
  gold = 0;
  kills = 0;
  rerollTokens = 0;
  rerollsBought = 0;
  revivesLeft: number;

  owned = new Map<string, number>();
  loadout: Loadout;

  player: PlayerState;
  enemies: Enemy[] = [];
  projectiles: Projectile[] = [];
  orbiters: Projectile[] = [];
  pickups: Pickup[] = [];
  chests: Chest[] = [];
  puddles: Puddle[] = [];
  vfx: Vfx[] = [];

  /** Choices stack up if a chest breaks during a level-up. */
  private queue: PendingChoice[] = [];
  /** card id -> the level at which it wears off */
  private expiries = new Map<string, number>();
  /** seconds of frozen simulation owed for impact feedback */
  private hitStop = 0;
  private grid = new SpatialHash(56);
  private scratch: Enemy[] = [];
  private spawnBudget = 0;
  private chestTimer = 8;
  private nextBossIndex = 0;
  private nextMilestone = 5;
  private damageTextCd = 0;
  private rerollGiftGranted = false;

  private readonly input: DragInput;
  private readonly renderer: Renderer;
  private readonly events: RunEvents;

  constructor(opts: {
    hero: HeroDef;
    save: SaveData;
    input: DragInput;
    renderer: Renderer;
    events: RunEvents;
    seed?: number;
  }) {
    this.hero = opts.hero;
    this.save = opts.save;
    this.input = opts.input;
    this.renderer = opts.renderer;
    this.events = opts.events;
    this.seed = opts.seed ?? (Math.random() * 0xffffffff) >>> 0;
    this.rng = new Rng(this.seed);

    this.level = startingLevel(opts.save);
    this.xpNext = xpForLevel(this.level);
    this.revivesLeft = startingRevives(opts.save);

    this.loadout = buildLoadout(this.hero, this.save, this.owned);
    this.player = {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      facing: -Math.PI / 2,
      hp: this.loadout.stats.maxHp,
      maxHp: this.loadout.stats.maxHp,
      attackCd: 0.25,
      invuln: 1.2,
      shields: 0,
      aegisCd: 0,
      boltCd: 0,
      thornCd: 0,
      slaughterTime: 0,
      attackCounter: 0,
      hurtFlash: 0,
      walkPhase: 0,
      attackProgress: 1,
      infusionIndex: 0,
      infusedGods: [],
      currentInfusion: null,
      stillTime: 0,
      noHitTime: 0,
      gaiaArmorTime: 0,
      flameUsed: false,
      beamCd: 0,
    };
    this.renderer.camera.x = 0;
    this.renderer.camera.y = 0;
  }

  // ------------------------------------------------------------------ state

  get maxGods(): number {
    return maxBoonGods(this.save);
  }

  get godsHeld(): Set<GodId> {
    return ownedGods(this.owned);
  }

  get availableGods(): Set<GodId> {
    return availableGods(this.save);
  }

  get stats() {
    return this.loadout.stats;
  }

  get mech() {
    return this.loadout.mech;
  }

  /**
   * Everything that scales damage globally. Ares pays out as your health
   * drains and Dionysus while it is full, so a build chases one or the other;
   * Hermes turns surplus move speed into force, and Hestia rewards standing
   * your ground.
   */
  private damageMult(): number {
    const fraction = this.player.hp / Math.max(1, this.player.maxHp);
    const wrath = this.mech.wrathBonus * (1 - fraction);
    const zeal = this.mech.zealBonus * fraction;
    const surplus = Math.max(0, this.stats.moveSpeed / BASE_MOVE_SPEED - 1);
    const sprint = this.mech.speedToDamage * surplus;
    const hearth = this.player.stillTime >= HEARTH_DELAY ? this.mech.hearthDamage : 0;
    return this.stats.damageMult * (1 + wrath + zeal + sprint + hearth);
  }

  private rebuildLoadout(): void {
    const before = this.player.maxHp;
    this.loadout = buildLoadout(this.hero, this.save, this.owned);
    this.player.maxHp = this.stats.maxHp;
    // Growing max health always hands over the difference, so HP cards feel good.
    if (this.player.maxHp > before) this.player.hp += this.player.maxHp - before;
    this.player.hp = Math.min(this.player.hp, this.player.maxHp);
    this.player.infusedGods = [...this.godsHeld];
    this.syncOrbiters();
  }

  /**
   * Two things circle the hero: Thanatos turns extra "projectiles" into
   * scythes, and Hephaestus' automatons serve any hero. They share one system
   * because they behave identically — only their damage and colour differ.
   */
  private syncOrbiters(): void {
    const scythes = this.hero.weapon === 'aura' ? this.stats.projectiles : 0;
    const want = scythes + this.mech.automatons;
    while (this.orbiters.length > want) this.orbiters.pop();
    while (this.orbiters.length < want) {
      const isScythe = this.orbiters.length < scythes;
      this.orbiters.push({
        id: newId(),
        kind: isScythe ? 'scythe' : 'automaton',
        hostile: false,
        x: this.player.x,
        y: this.player.y,
        vx: 0,
        vy: 0,
        angle: 0,
        spin: 6,
        radius: 15,
        damage: 0,
        life: Infinity,
        pierceLeft: Infinity,
        homing: 0,
        hit: new Set(),
        splashRadius: 0,
        splashDamage: 0,
        color: isScythe ? this.hero.accent : GODS.hephaestus.accent,
        empowered: false,
        infusion: null,
        orbitAngle: (TAU * this.orbiters.length) / Math.max(1, want),
        orbitRadius: isScythe ? 74 : 58,
      });
    }
    const count = this.orbiters.length;
    this.orbiters.forEach((orb, i) => {
      orb.orbitAngle = (TAU * i) / Math.max(1, count);
    });
  }

  // ------------------------------------------------------------------- loop

  step(dt: number): void {
    if (this.phase !== 'playing') return;
    // Hit-stop: a couple of frozen frames make a heavy hit land. Kept short
    // enough that it reads as impact rather than as a stutter.
    if (this.hitStop > 0) {
      this.hitStop = Math.max(0, this.hitStop - dt);
      return;
    }
    this.time += dt;
    this.damageTextCd -= dt;

    this.grid.rebuild(this.enemies);

    this.stepPlayer(dt);
    this.stepPassives(dt);
    this.stepSpawns(dt);
    this.stepEnemies(dt);
    this.stepProjectiles(dt);
    this.stepOrbiters(dt);
    this.stepPuddles(dt);
    this.stepChests(dt);
    this.stepPickups(dt);
    this.stepVfx(dt);
    this.cleanup();
    this.stepNarrative();
  }

  private stepNarrative(): void {
    if (this.time / 60 < this.nextMilestone) return;
    const key = `story.milestone.${this.nextMilestone}` as 'story.milestone.5';
    if (this.nextMilestone <= 25) this.events.onNarrative(t(key));
    this.nextMilestone += 5;
  }

  private stepPlayer(dt: number): void {
    const p = this.player;
    const speed = this.stats.moveSpeed;
    const ix = this.input.x;
    const iy = this.input.y;

    p.vx = ix * speed;
    p.vy = iy * speed;
    p.x = clamp(p.x + p.vx * dt, -WORLD_LIMIT, WORLD_LIMIT);
    p.y = clamp(p.y + p.vy * dt, -WORLD_LIMIT, WORLD_LIMIT);

    // The hero attacks the way it travels; standing still keeps the last heading.
    if (ix !== 0 || iy !== 0) p.facing = Math.atan2(iy, ix);

    const moving = ix !== 0 || iy !== 0;
    p.stillTime = moving ? 0 : p.stillTime + dt;
    p.noHitTime += dt;
    p.gaiaArmorTime = Math.max(0, p.gaiaArmorTime - dt);
    p.walkPhase += Math.hypot(ix, iy) * dt * 9;
    p.invuln = Math.max(0, p.invuln - dt);
    p.hurtFlash = Math.max(0, p.hurtFlash - dt * 3);
    p.slaughterTime = Math.max(0, p.slaughterTime - dt);

    let regen = this.stats.regen;
    if (p.stillTime >= HEARTH_DELAY) regen += this.mech.hearthRegen;
    if (this.mech.warmthPercent > 0 && p.noHitTime >= WARMTH_DELAY) {
      regen += p.maxHp * this.mech.warmthPercent;
    }
    if (regen > 0 && p.hp < p.maxHp) {
      p.hp = Math.min(p.maxHp, p.hp + regen * dt);
    }

    const haste = 1 + (p.slaughterTime > 0 ? this.mech.slaughterHaste : 0);
    p.attackCd -= dt * this.stats.attackSpeedMult * haste;
    p.attackProgress = clamp(1 - p.attackCd / Math.max(0.05, this.hero.weaponBase.cooldown), 0, 1);
    if (p.attackCd <= 0) {
      const base = this.hero.weaponBase.cooldown;
      p.attackCd += Math.max(0.05, base);
      this.attack();
    }
  }

  private stepPassives(dt: number): void {
    const p = this.player;
    const cdMult = this.stats.cooldownMult;

    if (this.mech.aegisMax > 0) {
      p.aegisCd -= dt;
      if (p.aegisCd <= 0) {
        p.aegisCd = this.mech.aegisInterval * cdMult;
        if (p.shields < this.mech.aegisMax) {
          p.shields++;
          this.spawnVfx('shield', p.x, p.y, { radius: 34, life: 0.45, color: GODS.athena.accent });
        }
      }
    }

    if (this.mech.boltDamage > 0) {
      p.boltCd -= dt;
      if (p.boltCd <= 0) {
        p.boltCd = this.mech.boltInterval * cdMult;
        this.castBolt();
      }
    }

    if (this.mech.thornCount > 0) {
      p.thornCd -= dt;
      if (p.thornCd <= 0) {
        p.thornCd = this.mech.thornInterval * cdMult;
        this.castThorns();
      }
    }

    if (this.mech.beamDamage > 0) {
      p.beamCd -= dt;
      if (p.beamCd <= 0) {
        p.beamCd = this.mech.beamInterval * cdMult;
        this.castBeam();
      }
    }

    // Hera's presence saps whatever wanders too close to the queen.
    if (this.mech.auraRadius > 0) {
      for (const enemy of this.grid.query(p.x, p.y, this.mech.auraRadius, this.scratch)) {
        if (enemy.dead) continue;
        enemy.status.weaken = Math.max(enemy.status.weaken, this.mech.auraWeaken);
        enemy.status.weakenTime = Math.max(enemy.status.weakenTime, 0.25);
      }
    }
  }

  /** Apollo's oracle: a line of sunlight through everything in front of you. */
  private castBeam(): void {
    const p = this.player;
    const length = 520 * this.stats.rangeMult;
    const halfWidth = 22 * this.stats.sizeMult;
    const angle = this.aimAngle();
    const ex = p.x + Math.cos(angle) * length;
    const ey = p.y + Math.sin(angle) * length;
    this.spawnVfx('beam', p.x, p.y, {
      x2: ex,
      y2: ey,
      life: 0.32,
      radius: halfWidth,
      angle,
      color: GODS.apollo.accent,
    });
    audio.play('shoot');

    const damage = this.mech.beamDamage * this.damageMult();
    const midX = (p.x + ex) / 2;
    const midY = (p.y + ey) / 2;
    for (const enemy of this.grid.query(midX, midY, length / 2 + 60, this.scratch)) {
      if (enemy.dead) continue;
      // Distance from the enemy to the beam's centre line, in beam space.
      const rx = enemy.x - p.x;
      const ry = enemy.y - p.y;
      const along = rx * Math.cos(angle) + ry * Math.sin(angle);
      if (along < 0 || along > length) continue;
      const across = Math.abs(-rx * Math.sin(angle) + ry * Math.cos(angle));
      if (across > halfWidth + enemy.radius) continue;
      this.hitEnemy(enemy, damage, { onHit: false });
    }
  }

  // ----------------------------------------------------------- basic attack

  /**
   * Which god rides this particular shot. A multi-god build cycles through its
   * pantheon attack by attack, so the colour of the projectile tells you what
   * is about to happen when it lands.
   */
  private pickInfusion(): GodId | null {
    const gods = this.player.infusedGods;
    if (this.mech.infusionPower <= 0 || gods.length === 0) return null;
    return gods[this.player.attackCounter % gods.length];
  }

  private attack(repeat = false): void {
    const p = this.player;
    p.attackCounter++;
    if (!repeat) p.currentInfusion = this.pickInfusion();
    const empowered = this.mech.tridentEvery > 0 && p.attackCounter % this.mech.tridentEvery === 0;

    switch (this.hero.weapon) {
      case 'bow':
        this.fireProjectiles('arrow', empowered);
        audio.play('shoot');
        break;
      case 'boulder':
        this.fireProjectiles('boulder', empowered);
        audio.play('throw');
        break;
      case 'sword':
        this.swing(empowered);
        audio.play('swing');
        break;
      case 'aura':
        this.pulse(empowered);
        audio.play('aura');
        break;
    }
    this.fireMoonshafts();

    // Hermes' infusion is a second swing, not a cooldown trick: the basic
    // attack simply happens again.
    if (p.currentInfusion === 'hermes' && !repeat) {
      if (this.rng.chance(0.3 * this.mech.infusionPower)) this.attack(true);
    }
  }

  /** Artemis' extra arrows: weak, but they always find something. */
  private fireMoonshafts(): void {
    const count = this.mech.moonshafts;
    if (count <= 0) return;
    const p = this.player;
    const damage = this.hero.weaponBase.damage * this.damageMult() * 0.55;
    for (let i = 0; i < count; i++) {
      const angle = p.facing + (i - (count - 1) / 2) * 0.55 + this.rng.range(-0.12, 0.12);
      this.projectiles.push({
        id: newId(),
        kind: 'arrow',
        hostile: false,
        x: p.x,
        y: p.y,
        vx: Math.cos(angle) * 330,
        vy: Math.sin(angle) * 330,
        angle,
        spin: 0,
        radius: 4.5,
        damage,
        life: 1.4,
        pierceLeft: 0,
        homing: 0.9,
        hit: new Set(),
        splashRadius: 0,
        splashDamage: 0,
        color: GODS.artemis.accent,
        empowered: false,
        infusion: null,
        orbitAngle: 0,
        orbitRadius: 0,
      });
    }
  }

  /** Basic-attack damage: global scaling, then the weapon-only multiplier. */
  private attackDamage(empowered: boolean): number {
    const base = this.hero.weaponBase.damage * this.damageMult() * this.mech.basicDamageMult;
    return empowered ? base * this.mech.tridentMult : base;
  }

  /**
   * The hero shoots the way it moves, but a phone is an imprecise stick — so a
   * shot snaps up to AIM_ASSIST radians onto the closest enemy already inside
   * the forward cone. Wide enough to feel fair, narrow enough that the player
   * still aims by steering.
   */
  private aimAngle(): number {
    const p = this.player;
    const near = this.grid.query(p.x, p.y, AIM_ASSIST_RANGE, this.scratch);
    let best = p.facing;
    let bestDist = Infinity;
    for (const enemy of near) {
      if (enemy.dead || enemy.status.charmTime > 0) continue;
      const angle = Math.atan2(enemy.y - p.y, enemy.x - p.x);
      if (Math.abs(angleDelta(p.facing, angle)) > AIM_ASSIST) continue;
      const d = dist2(enemy.x, enemy.y, p.x, p.y);
      if (d < bestDist) {
        bestDist = d;
        best = angle;
      }
    }
    return best;
  }

  private fireProjectiles(kind: 'arrow' | 'boulder', empowered: boolean): void {
    const p = this.player;
    const wb = this.hero.weaponBase;
    const count = wb.count + this.stats.projectiles;
    const damage = this.attackDamage(empowered);
    const speed = wb.speed * this.stats.projectileSpeedMult;
    const life = (wb.range * this.stats.rangeMult) / speed;
    const spread = count > 1 ? 0.16 : 0;
    const infusionColor = p.currentInfusion ? GODS[p.currentInfusion].accent : null;
    // Artemis' infusion makes the shot hunt on its own.
    const homing =
      p.currentInfusion === 'artemis'
        ? Math.max(this.stats.homing, 0.55 * this.mech.infusionPower)
        : this.stats.homing;

    const aim = this.aimAngle();
    for (let i = 0; i < count; i++) {
      const offset = (i - (count - 1) / 2) * spread;
      const angle = aim + offset;
      this.projectiles.push({
        id: newId(),
        kind,
        hostile: false,
        x: p.x + Math.cos(angle) * 14,
        y: p.y + Math.sin(angle) * 14,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        angle,
        spin: kind === 'boulder' ? 5 : 0,
        radius: wb.size * this.stats.sizeMult,
        damage,
        life,
        pierceLeft: empowered ? Infinity : wb.pierce + this.stats.pierce,
        homing,
        hit: new Set(),
        splashRadius: this.mech.splashRadius,
        splashDamage: this.mech.splashDamage,
        color: infusionColor ?? (empowered ? GODS.poseidon.accent : this.hero.accent),
        empowered,
        infusion: p.currentInfusion,
        orbitAngle: 0,
        orbitRadius: 0,
        altitude: kind === 'boulder' ? 1 : undefined,
      });
    }
  }

  private swing(empowered: boolean): void {
    const p = this.player;
    const wb = this.hero.weaponBase;
    const reach = wb.range * this.stats.rangeMult;
    const arc = (wb.arc ?? 1) * (1 + (this.stats.sizeMult - 1) * 0.5);
    const sweeps = 1 + this.stats.projectiles;
    const damage = this.attackDamage(empowered);
    const tint = p.currentInfusion
      ? GODS[p.currentInfusion].accent
      : empowered
        ? GODS.poseidon.accent
        : this.hero.accent;

    const aim = this.aimAngle();
    for (let i = 0; i < sweeps; i++) {
      // Extra sweeps fan out to either side of the heading.
      const side = i === 0 ? 0 : (i % 2 === 1 ? 1 : -1) * Math.ceil(i / 2);
      const angle = aim + side * arc * 1.15;
      this.spawnVfx('sweep', p.x, p.y, {
        radius: reach,
        angle,
        arc,
        life: 0.18,
        color: tint,
      });
      this.damageCone(p.x, p.y, reach, angle, arc, damage, empowered);
    }
  }

  private pulse(empowered: boolean): void {
    const p = this.player;
    const radius = this.hero.weaponBase.range * this.stats.rangeMult * this.stats.sizeMult;
    const damage = this.attackDamage(empowered);
    this.spawnVfx('ring', p.x, p.y, {
      radius,
      life: 0.25,
      color: p.currentInfusion
        ? GODS[p.currentInfusion].accent
        : empowered
          ? GODS.poseidon.accent
          : this.hero.accent,
    });
    const near = this.grid.query(p.x, p.y, radius, this.scratch);
    for (const enemy of near) {
      if (enemy.dead || enemy.status.charmTime > 0) continue;
      if (dist2(enemy.x, enemy.y, p.x, p.y) > (radius + enemy.radius) ** 2) continue;
      this.hitEnemy(enemy, damage, {
        onHit: true,
        empowered,
        fromX: p.x,
        fromY: p.y,
        infusion: p.currentInfusion,
      });
    }
    for (const chest of this.chests) {
      if (dist2(chest.x, chest.y, p.x, p.y) <= (radius + chest.radius) ** 2) {
        this.damageChest(chest, damage);
      }
    }
  }

  private damageCone(
    x: number,
    y: number,
    reach: number,
    angle: number,
    arc: number,
    damage: number,
    empowered: boolean,
  ): void {
    const near = this.grid.query(x, y, reach + 24, this.scratch);
    for (const enemy of near) {
      if (enemy.dead || enemy.status.charmTime > 0) continue;
      const dx = enemy.x - x;
      const dy = enemy.y - y;
      if (dx * dx + dy * dy > (reach + enemy.radius) ** 2) continue;
      let delta = Math.abs(Math.atan2(dy, dx) - angle) % TAU;
      if (delta > Math.PI) delta = TAU - delta;
      if (delta > arc) continue;
      this.hitEnemy(enemy, damage, {
        onHit: true,
        empowered,
        fromX: x,
        fromY: y,
        infusion: this.player.currentInfusion,
      });
    }
    for (const chest of this.chests) {
      const dx = chest.x - x;
      const dy = chest.y - y;
      if (dx * dx + dy * dy > (reach + chest.radius) ** 2) continue;
      let delta = Math.abs(Math.atan2(dy, dx) - angle) % TAU;
      if (delta > Math.PI) delta = TAU - delta;
      if (delta <= arc) this.damageChest(chest, damage);
    }
  }

  // ------------------------------------------------------------ god powers

  private castBolt(): void {
    // Strike the most dangerous thing on screen: bosses first, then the closest.
    const view = this.renderer.viewRadius();
    let target: Enemy | null = null;
    let bestScore = -Infinity;
    for (const enemy of this.enemies) {
      if (enemy.dead) continue;
      const d = dist(enemy.x, enemy.y, this.player.x, this.player.y);
      if (d > view) continue;
      const score = (enemy.isBoss ? 1e6 : 0) + enemy.maxHp - d;
      if (score > bestScore) {
        bestScore = score;
        target = enemy;
      }
    }
    if (!target) return;
    this.spawnVfx('bolt', target.x, target.y - 220, {
      x2: target.x,
      y2: target.y,
      life: 0.25,
      color: GODS.zeus.accent,
    });
    this.hitEnemy(target, this.mech.boltDamage * this.damageMult(), { onHit: false });
    this.renderer.addShake(4);
    audio.play('hit');
  }

  private castThorns(): void {
    const p = this.player;
    const count = this.mech.thornCount;
    const damage = this.mech.thornDamage * this.damageMult();
    for (let i = 0; i < count; i++) {
      const angle = (TAU * i) / count + this.rng.range(-0.2, 0.2);
      const radius = this.rng.range(52, 104);
      const tx = p.x + Math.cos(angle) * radius;
      const ty = p.y + Math.sin(angle) * radius;
      this.spawnVfx('thorn', tx, ty, { life: 0.4, angle, color: GODS.gaia.accent, radius: 22 });
      this.areaDamage(tx, ty, 30, damage, false);
    }
  }

  private chainFrom(source: Enemy, damage: number, jumps: number, range: number): void {
    let from = source;
    const struck = new Set<number>([source.id]);
    for (let i = 0; i < jumps; i++) {
      const near = this.grid.query(from.x, from.y, range, this.scratch);
      let best: Enemy | null = null;
      let bestDist = Infinity;
      for (const enemy of near) {
        if (enemy.dead || struck.has(enemy.id)) continue;
        const d = dist2(enemy.x, enemy.y, from.x, from.y);
        if (d < bestDist) {
          bestDist = d;
          best = enemy;
        }
      }
      if (!best) return;
      struck.add(best.id);
      this.spawnVfx('chain', from.x, from.y, {
        x2: best.x,
        y2: best.y,
        life: 0.16,
        color: GODS.zeus.accent,
      });
      this.hitEnemy(best, damage, { onHit: false });
      from = best;
    }
  }

  /** Non-recursive area damage used by splashes, explosions and thorns. */
  private areaDamage(
    x: number,
    y: number,
    radius: number,
    damage: number,
    hitChests: boolean,
  ): void {
    const near = this.grid.query(x, y, radius, this.scratch);
    for (const enemy of near) {
      if (enemy.dead) continue;
      if (dist2(enemy.x, enemy.y, x, y) > (radius + enemy.radius) ** 2) continue;
      this.hitEnemy(enemy, damage, { onHit: false });
    }
    if (hitChests) {
      for (const chest of this.chests) {
        if (dist2(chest.x, chest.y, x, y) <= (radius + chest.radius) ** 2) {
          this.damageChest(chest, damage);
        }
      }
    }
  }

  /**
   * Divine Infusion. Each god rewrites the basic attack along an axis its own
   * boons do not already cover — Ares executes rather than bleeds, Hades taxes
   * big health pools rather than branding, Hermes swings twice rather than
   * playing with cooldowns. `infusionPower` scales every number below.
   *
   * Hermes and Artemis are handled where the shot is fired, not here.
   */
  private applyInfusion(enemy: Enemy, baseDamage: number, god: GodId): void {
    const power = this.mech.infusionPower;
    if (power <= 0) return;
    switch (god) {
      case 'zeus': {
        // Radiating discharge, as opposed to the boon's chain that leaps sideways.
        const radius = 66 + 34 * power;
        this.spawnVfx('ring', enemy.x, enemy.y, { radius, life: 0.22, color: GODS.zeus.accent });
        this.areaDamage(enemy.x, enemy.y, radius, baseDamage * 0.45 * power, false);
        break;
      }
      case 'hera': {
        // The queen's presence, not her brand: a straight sap of what it can do.
        enemy.status.weaken = Math.max(enemy.status.weaken, 0.3 * power);
        enemy.status.weakenTime = Math.max(enemy.status.weakenTime, 2.5);
        break;
      }
      case 'poseidon': {
        this.knockback(enemy, 26 * power);
        enemy.status.slow = Math.max(enemy.status.slow, 0.35 * power);
        enemy.status.slowTime = Math.max(enemy.status.slowTime, 2);
        break;
      }
      case 'demeter':
        this.freezeEnemy(enemy, this.mech.freezeDuration || 1.0, 'ice');
        break;
      case 'athena':
        // A second strike that ignores armour; armour is an enemy-side notion
        // here, so it simply lands again without re-triggering on-hit effects.
        this.hitEnemy(enemy, baseDamage * 0.4 * power, { onHit: false });
        break;
      case 'apollo':
        enemy.status.burnDps = Math.max(enemy.status.burnDps, 10 * power * this.damageMult());
        enemy.status.burnTime = Math.max(enemy.status.burnTime, 3);
        break;
      case 'ares': {
        // Execution: the wounded die faster, which bleed alone never did.
        if (enemy.hp <= enemy.maxHp * 0.3) {
          this.hitEnemy(enemy, baseDamage * 1.0 * power, { onHit: false });
        }
        break;
      }
      case 'aphrodite': {
        // Herding tool: pull the pack onto the corpse pile.
        const radius = 130;
        for (const other of this.grid.query(enemy.x, enemy.y, radius, this.scratch)) {
          if (other.dead || other === enemy) continue;
          const dx = enemy.x - other.x;
          const dy = enemy.y - other.y;
          const len = Math.hypot(dx, dy) || 1;
          other.vx += (dx / len) * 90 * power;
          other.vy += (dy / len) * 90 * power;
        }
        this.spawnVfx('ring', enemy.x, enemy.y, {
          radius,
          life: 0.25,
          color: GODS.aphrodite.accent,
        });
        break;
      }
      case 'hephaestus': {
        const radius = 46 + 20 * power;
        this.spawnVfx('burst', enemy.x, enemy.y, {
          radius,
          life: 0.25,
          color: GODS.hephaestus.accent,
        });
        this.areaDamage(enemy.x, enemy.y, radius, baseDamage * 0.5 * power, false);
        break;
      }
      case 'hestia': {
        // Embers underfoot: a small, cheap patch of lasting fire.
        this.puddles.push({
          id: newId(),
          x: enemy.x,
          y: enemy.y,
          radius: 38,
          dps: 14 * power * this.damageMult(),
          slow: 0,
          life: 2.5,
          maxLife: 2.5,
          kind: 'ember',
        });
        break;
      }
      case 'dionysus': {
        enemy.status.confuseTime = Math.max(enemy.status.confuseTime, 1.6 * power);
        enemy.status.confuseDir = this.rng.angle();
        break;
      }
      case 'hades': {
        // A health tax: worthless against trash, brutal against bosses.
        this.hitEnemy(enemy, enemy.maxHp * 0.02 * power, { onHit: false });
        break;
      }
      case 'gaia': {
        this.player.gaiaArmorTime = 2.5;
        break;
      }
      case 'artemis':
      case 'hermes':
        // Applied at the moment the attack is fired, not when it lands.
        break;
    }
  }

  // --------------------------------------------------------------- damage

  private hitEnemy(
    enemy: Enemy,
    rawDamage: number,
    opts: {
      onHit?: boolean;
      empowered?: boolean;
      fromX?: number;
      fromY?: number;
      infusion?: GodId | null;
    },
  ): void {
    if (enemy.dead) return;
    let damage = rawDamage;

    // Artemis' infusion is a sharpened shot rather than an on-hit rider, so it
    // lands here, before the roll.
    const infusion = opts.onHit ? (opts.infusion ?? null) : null;
    const critBonus = infusion === 'artemis' ? 0.3 * this.mech.infusionPower : 0;
    const crit = this.rng.chance(this.stats.critChance + critBonus);
    if (crit) damage *= this.stats.critMult;

    // Frozen enemies are brittle, and Hera's brand opens everything up.
    if (enemy.status.frozenTime > 0 && this.mech.shatterBonus > 0) {
      damage *= 1 + this.mech.shatterBonus;
    }
    if (enemy.status.markTime > 0) damage *= 1 + enemy.status.markAmount;

    enemy.hp -= damage;
    enemy.flash = 1;
    if (opts.onHit) this.events.onAttackHit(crit);

    if (this.mech.drain > 0) this.healPlayer(damage * this.mech.drain);
    if (crit && this.mech.critSplashRadius > 0) {
      this.spawnVfx('ring', enemy.x, enemy.y, {
        radius: this.mech.critSplashRadius,
        life: 0.2,
        color: GODS.artemis.accent,
      });
      this.areaDamage(
        enemy.x,
        enemy.y,
        this.mech.critSplashRadius,
        damage * this.mech.critSplashDamage,
        false,
      );
    }

    if (this.damageTextCd <= 0) {
      this.damageTextCd = 0.05;
      this.spawnVfx('text', enemy.x, enemy.y - enemy.radius, {
        life: 0.6,
        color: crit ? '#ffd76a' : '#ffffff',
        text: String(Math.round(damage)),
        scale: crit ? 1.35 : 1,
      });
    }

    if (opts.onHit) {
      const m = this.mech;
      if (m.bleedDps > 0) {
        enemy.status.bleedDps = Math.max(enemy.status.bleedDps, m.bleedDps * this.damageMult());
        enemy.status.bleedTime = m.bleedDuration;
      }
      if (m.burnDps > 0) {
        enemy.status.burnDps = Math.max(enemy.status.burnDps, m.burnDps * this.damageMult());
        enemy.status.burnTime = m.burnDuration;
      }
      if (m.markChance > 0 && this.rng.chance(m.markChance)) {
        enemy.status.markAmount = Math.max(enemy.status.markAmount, m.markAmount);
        enemy.status.markTime = m.markDuration;
      }
      if (m.weakenAmount > 0) {
        enemy.status.weaken = Math.max(enemy.status.weaken, m.weakenAmount);
        enemy.status.weakenTime = m.weakenDuration;
      }
      if (m.doomDamage > 0 && enemy.status.doomTime <= 0) {
        enemy.status.doomDamage = m.doomDamage * this.damageMult();
        enemy.status.doomTime = m.doomDelay;
      }
      if (m.charmChance > 0 && !enemy.isBoss && this.rng.chance(m.charmChance)) {
        enemy.status.charmTime = m.charmDuration;
        this.spawnVfx('burst', enemy.x, enemy.y, {
          radius: 22,
          life: 0.3,
          color: GODS.aphrodite.accent,
        });
      }
      if (m.freezeChance > 0 && this.rng.chance(m.freezeChance)) {
        this.freezeEnemy(enemy, m.freezeDuration, 'ice');
      } else if (m.snareChance > 0 && this.rng.chance(m.snareChance)) {
        this.freezeEnemy(enemy, m.snareDuration, 'vine');
      }
      if (m.knockback > 0) this.knockback(enemy, m.knockback, opts.fromX, opts.fromY);
      if (m.splashRadius > 0 && m.splashDamage > 0) {
        this.areaDamage(enemy.x, enemy.y, m.splashRadius, damage * m.splashDamage, false);
      }
      if (m.chainJumps > 0) {
        this.chainFrom(enemy, damage * m.chainDamage, m.chainJumps, m.chainRange);
      }
      if (infusion) this.applyInfusion(enemy, damage, infusion);
    }

    // Thanatos reaps anything already at death's door.
    const reap = this.mech.reapThreshold;
    if (reap > 0 && !enemy.isBoss && enemy.hp > 0 && enemy.hp <= enemy.maxHp * reap) {
      enemy.hp = 0;
    }

    if (enemy.hp <= 0) this.killEnemy(enemy);
    else audio.play('hit', 0.2);
  }

  /** Bosses shrug off hard crowd control; everything else stops dead. */
  private freezeEnemy(enemy: Enemy, duration: number, kind: 'ice' | 'vine'): void {
    if (duration <= 0) return;
    const scaled = enemy.isBoss ? duration * 0.35 : duration;
    if (scaled <= enemy.status.frozenTime) return;
    enemy.status.frozenTime = scaled;
    enemy.status.frozenKind = kind;
    if (kind === 'ice' && this.mech.shatterDamage > 0) {
      enemy.status.shatterDamage = this.mech.shatterDamage * this.damageMult();
    }
  }

  /**
   * `force` is expressed in world units of push. The impulse decays at
   * exp(-6t), so an impulse of 6x the force integrates to roughly that
   * distance — which makes knockback numbers in the data tables readable.
   */
  private knockback(enemy: Enemy, force: number, fromX?: number, fromY?: number): void {
    const ox = fromX ?? this.player.x;
    const oy = fromY ?? this.player.y;
    const dx = enemy.x - ox;
    const dy = enemy.y - oy;
    const len = Math.hypot(dx, dy) || 1;
    const scale = (1 - enemy.def.knockbackResist) * force * 6;
    enemy.vx += (dx / len) * scale;
    enemy.vy += (dy / len) * scale;
  }

  private killEnemy(enemy: Enemy): void {
    if (enemy.dead) return;
    enemy.dead = true;
    this.kills++;
    const m = this.mech;
    const charmed = enemy.status.charmTime > 0;

    this.spawnVfx('burst', enemy.x, enemy.y, {
      radius: enemy.radius * 2.1,
      life: 0.3,
      color: enemy.def.accent,
    });
    for (let i = 0; i < 5; i++) {
      const angle = this.rng.angle();
      const speed = this.rng.range(60, 170);
      this.spawnVfx('spark', enemy.x, enemy.y, {
        life: this.rng.range(0.25, 0.5),
        color: enemy.def.accent,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: this.rng.range(2, 4),
      });
    }
    audio.play('kill', 0.25);
    if (enemy.isBoss) {
      this.renderer.addShake(14);
      this.renderer.flash('#ffe9b0', 0.3);
      this.hitStop = Math.max(this.hitStop, 0.12);
    }

    // Loot
    this.dropPickup('xp', enemy.x, enemy.y, enemy.def.xp);
    if (enemy.isBoss) {
      for (let i = 0; i < 6; i++) this.dropPickup('gold', enemy.x, enemy.y, enemy.def.gold / 6);
      this.dropPickup('heal', enemy.x, enemy.y, 25);
    } else if (this.rng.chance(0.18)) {
      this.dropPickup('gold', enemy.x, enemy.y, enemy.def.gold);
    } else if (this.rng.chance(0.02)) {
      this.dropPickup('heal', enemy.x, enemy.y, 12);
    }
    if (m.healDropChance > 0 && this.rng.chance(m.healDropChance)) {
      this.dropPickup('heal', enemy.x, enemy.y, 14);
    }

    // On-kill boons
    if (this.stats.lifesteal > 0) this.healPlayer(this.stats.lifesteal);
    if (m.soulChance > 0 && this.rng.chance(m.soulChance)) this.healPlayer(m.soulHeal);
    if (m.slaughterDuration > 0) this.player.slaughterTime = m.slaughterDuration;
    if (m.lastBreathChance > 0 && this.rng.chance(m.lastBreathChance)) {
      this.spawnVfx('burst', enemy.x, enemy.y, {
        radius: m.lastBreathRadius,
        life: 0.35,
        color: GODS.hades.accent,
      });
      this.areaDamage(
        enemy.x,
        enemy.y,
        m.lastBreathRadius,
        m.lastBreathDamage * this.damageMult(),
        false,
      );
    }
    if (charmed && m.heartbreakDamage > 0) {
      this.spawnVfx('burst', enemy.x, enemy.y, {
        radius: m.heartbreakRadius,
        life: 0.4,
        color: GODS.aphrodite.accent,
      });
      this.areaDamage(
        enemy.x,
        enemy.y,
        m.heartbreakRadius,
        m.heartbreakDamage * this.damageMult(),
        false,
      );
    }
    if (m.puddleChance > 0 && this.rng.chance(m.puddleChance)) {
      this.puddles.push({
        id: newId(),
        kind: 'water',
        x: enemy.x,
        y: enemy.y,
        radius: m.puddleRadius,
        dps: m.puddleDps * this.damageMult(),
        slow: m.puddleSlow,
        life: 5,
        maxLife: 5,
      });
    }
  }

  private healPlayer(amount: number): void {
    const p = this.player;
    if (p.hp >= p.maxHp) return;
    p.hp = Math.min(p.maxHp, p.hp + amount);
  }

  hurtPlayer(amount: number, fromX: number, fromY: number): void {
    const p = this.player;
    if (this.phase !== 'playing' || p.invuln > 0) return;

    if (this.stats.dodge > 0 && this.rng.chance(this.stats.dodge)) {
      this.spawnVfx('text', p.x, p.y - 24, {
        life: 0.5,
        color: GODS.hermes.accent,
        text: '—',
        scale: 1.1,
      });
      p.invuln = 0.15;
      return;
    }

    if (p.shields > 0) {
      p.shields--;
      p.invuln = 0.6;
      this.spawnVfx('shield', p.x, p.y, { radius: 42, life: 0.35, color: GODS.athena.accent });
      if (this.mech.reflectDamage > 0) {
        this.areaDamage(p.x, p.y, 110, this.mech.reflectDamage * this.damageMult(), false);
      }
      this.events.onPlayerHit(true);
      return;
    }

    const armor = this.stats.armor + (p.gaiaArmorTime > 0 ? 3 : 0);
    const dealt = Math.max(1, amount - armor);
    p.hp -= dealt;
    p.invuln = 0.55;
    p.hurtFlash = 1;
    this.renderer.addShake(5);
    this.renderer.flash('#ff5f5f', 0.16);
    this.hitStop = Math.max(this.hitStop, 0.05);
    audio.play('hurt');
    this.events.onPlayerHit(false);

    if (this.mech.staticDamage > 0) {
      this.spawnVfx('ring', p.x, p.y, {
        radius: this.mech.staticRadius,
        life: 0.3,
        color: GODS.zeus.accent,
      });
      this.areaDamage(
        p.x,
        p.y,
        this.mech.staticRadius,
        this.mech.staticDamage * this.damageMult(),
        false,
      );
    }
    void fromX;
    void fromY;

    p.noHitTime = 0;

    if (p.hp <= 0) {
      // Hestia's Everlasting Flame: one refusal per voyage.
      if (this.mech.everlastingFlame > 0 && !p.flameUsed) {
        p.flameUsed = true;
        p.hp = p.maxHp * this.mech.everlastingFlame;
        p.invuln = this.mech.flameInvuln;
        this.renderer.flash(GODS.hestia.accent, 0.6);
        this.renderer.addShake(12);
        this.spawnVfx('ring', p.x, p.y, { radius: 160, life: 0.6, color: GODS.hestia.accent });
        this.areaDamage(p.x, p.y, 160, 120 * this.damageMult(), false);
        this.events.onFlame();
        return;
      }
      p.hp = 0;
      this.phase = 'dead';
      audio.play('gameover');
      this.events.onDeath();
    }
  }

  // ------------------------------------------------------------- spawning

  private stepSpawns(dt: number): void {
    const minutes = this.time / 60;

    const boss = BOSS_SCHEDULE[this.nextBossIndex];
    if (boss && minutes >= boss.atMinute) {
      this.nextBossIndex++;
      this.spawnEnemy(boss.id, true);
      this.events.onBoss(t('enemy.boss', enemyName(boss.id)));
      audio.play('boss');
      this.renderer.addShake(10);
    }

    const wave = waveAt(minutes);
    this.spawnBudget += wave.rate * dt;
    const ids = Object.keys(wave.weights) as EnemyId[];
    while (this.spawnBudget >= 1) {
      this.spawnBudget -= 1;
      if (this.enemies.length >= MAX_ENEMIES) continue;
      const id = this.rng.weighted(ids, (key) => wave.weights[key] ?? 0);
      if (id) this.spawnEnemy(id, false);
    }

    this.chestTimer -= dt * chestRateMult(this.save);
    if (this.chestTimer <= 0 && this.chests.length < MAX_CHESTS) {
      this.chestTimer = CHEST_BASE_INTERVAL;
      this.spawnChest();
    }
  }

  /**
   * Spawn just outside the *rectangle* the camera shows, not outside its
   * circumscribed circle — on a tall phone screen the circle puts side spawns
   * hundreds of units too far away and the field feels empty.
   */
  private offscreenPoint(margin: number): { x: number; y: number } {
    const halfW = this.renderer.viewHalfWidth() + margin;
    const halfH = this.renderer.viewHalfHeight() + margin;
    const perimeter = 2 * (halfW + halfH);
    let along = this.rng.range(0, perimeter);
    let dx: number;
    let dy: number;
    if (along < 2 * halfW) {
      dx = along - halfW;
      dy = this.rng.chance(0.5) ? -halfH : halfH;
    } else {
      along -= 2 * halfW;
      dy = along - halfH;
      dx = this.rng.chance(0.5) ? -halfW : halfW;
    }
    return { x: this.player.x + dx, y: this.player.y + dy };
  }

  private spawnEnemy(id: EnemyId, isBoss: boolean): void {
    const def: EnemyDef = ENEMIES[id];
    const minutes = this.time / 60;
    const at = this.offscreenPoint(this.rng.range(30, 90));
    const hp = def.hp * hpScale(minutes);
    this.enemies.push({
      id: newId(),
      def,
      x: at.x,
      y: at.y,
      vx: 0,
      vy: 0,
      hp,
      maxHp: hp,
      radius: def.radius,
      speed: def.speed * speedScale(minutes),
      damage: def.damage * damageScale(minutes),
      touchCd: 0,
      flash: 0,
      status: emptyStatus(),
      chargeCd: this.rng.range(1, def.chargeInterval ?? 3),
      chargeTime: 0,
      chargeX: 0,
      chargeY: 0,
      shootCd: this.rng.range(0.5, def.shootInterval ?? 2),
      phase: this.rng.angle(),
      anim: this.rng.angle(),
      dead: false,
      isBoss: isBoss || def.boss === true,
    });
  }

  private spawnChest(): void {
    const angle = this.rng.angle();
    const radius = this.rng.range(190, 330);
    // Chest health rides the same curve as enemy health, so a chest stays about
    // "a few seconds of your current DPS" for the whole voyage instead of
    // becoming an unbreakable wall by minute five.
    const hp = 60 * hpScale(this.time / 60);
    this.chests.push({
      id: newId(),
      x: this.player.x + Math.cos(angle) * radius,
      y: this.player.y + Math.sin(angle) * radius,
      hp,
      maxHp: hp,
      radius: 20,
      flash: 0,
      bob: this.rng.angle(),
    });
  }

  // ------------------------------------------------------------- entities

  private stepEnemies(dt: number): void {
    const p = this.player;
    for (const e of this.enemies) {
      if (e.dead) continue;
      const s = e.status;

      // statuses
      if (s.bleedTime > 0) {
        s.bleedTime -= dt;
        e.hp -= s.bleedDps * dt;
        if (e.hp <= 0) {
          this.killEnemy(e);
          continue;
        }
      }
      if (s.burnTime > 0) {
        s.burnTime -= dt;
        e.hp -= s.burnDps * dt;
        if (e.hp <= 0) {
          this.killEnemy(e);
          continue;
        }
      }
      if (s.markTime > 0) s.markTime -= dt;
      if (s.confuseTime > 0) s.confuseTime -= dt;
      if (s.weakenTime > 0) s.weakenTime -= dt;
      if (s.slowTime > 0) s.slowTime -= dt;
      else s.slow = 0;
      if (s.doomTime > 0) {
        s.doomTime -= dt;
        if (s.doomTime <= 0 && s.doomDamage > 0) {
          const damage = s.doomDamage;
          s.doomDamage = 0;
          this.spawnVfx('burst', e.x, e.y, { radius: 40, life: 0.3, color: GODS.hades.color });
          this.hitEnemy(e, damage, { onHit: false });
          this.areaDamage(e.x, e.y, 40, damage * 0.5, false);
          if (e.dead) continue;
        }
      }
      if (s.charmTime > 0) s.charmTime -= dt;
      e.flash = Math.max(0, e.flash - dt * 5);
      e.anim += dt * (2 + e.speed * 0.04);

      if (s.frozenTime > 0) {
        s.frozenTime -= dt;
        if (s.frozenTime <= 0 && s.shatterDamage > 0) {
          const shatter = s.shatterDamage;
          s.shatterDamage = 0;
          this.spawnVfx('burst', e.x, e.y, {
            radius: 46,
            life: 0.3,
            color: GODS.demeter.accent,
          });
          this.areaDamage(e.x, e.y, 46, shatter, false);
          if (e.dead) continue;
        }
        // Held in place: no steering, no contact damage, still very killable.
        e.vx *= Math.exp(-10 * dt);
        e.vy *= Math.exp(-10 * dt);
        continue;
      }

      // steering
      const weakenMult = s.weakenTime > 0 ? 1 - s.weaken : 1;
      const slowMult = 1 - s.slow;
      const speed = e.speed * weakenMult * slowMult;
      const charmed = s.charmTime > 0;
      const target = charmed ? this.nearestEnemyTo(e) : null;
      const tx = charmed ? (target?.x ?? e.x) : p.x;
      const ty = charmed ? (target?.y ?? e.y) : p.y;
      const dx = tx - e.x;
      const dy = ty - e.y;
      const len = Math.hypot(dx, dy) || 1;

      let ax = (dx / len) * speed;
      let ay = (dy / len) * speed;

      if (s.confuseTime > 0) {
        // Drunk: it walks where it thinks it is going, which is not at you.
        s.confuseDir += Math.sin(this.time * 3 + e.phase) * dt * 2;
        ax = Math.cos(s.confuseDir) * speed * 0.7;
        ay = Math.sin(s.confuseDir) * speed * 0.7;
      }

      switch (e.def.behavior) {
        case 'strafe': {
          // Harpies circle rather than beeline, which keeps them threatening
          // even after the player out-runs the pack.
          e.phase += dt * 2.4;
          const px = -dy / len;
          const py = dx / len;
          ax += px * Math.sin(e.phase) * speed * 0.7;
          ay += py * Math.sin(e.phase) * speed * 0.7;
          break;
        }
        case 'charger': {
          if (e.chargeTime > 0) {
            e.chargeTime -= dt;
            ax = e.chargeX * (e.def.chargeSpeed ?? 200);
            ay = e.chargeY * (e.def.chargeSpeed ?? 200);
          } else {
            e.chargeCd -= dt;
            if (e.chargeCd <= 0 && len < 340) {
              e.chargeCd = e.def.chargeInterval ?? 4;
              e.chargeTime = 0.75;
              e.chargeX = dx / len;
              e.chargeY = dy / len;
              if (e.isBoss) this.events.onBossAttack();
            }
          }
          break;
        }
        case 'shooter': {
          e.shootCd -= dt;
          e.chargeX = dx / len;
          e.chargeY = dy / len;
          if (e.shootCd <= 0 && !charmed && len < 420) {
            e.shootCd = (e.def.shootInterval ?? 2) / (weakenMult || 1);
            const angle = Math.atan2(dy, dx);
            const spread = e.def.id === 'cerberus' ? [-0.24, 0, 0.24] : [0];
            for (const offset of spread) {
              this.spawnEnemyShot(e, Math.cos(angle + offset), Math.sin(angle + offset));
            }
            if (e.isBoss) this.events.onBossAttack();
          }
          // Keep their distance so they stay a ranged threat.
          if (len < 150) {
            ax = -(dx / len) * speed;
            ay = -(dy / len) * speed;
          }
          break;
        }
        case 'chase':
        default:
          break;
      }

      // knockback impulse decays fast
      e.vx *= Math.exp(-6 * dt);
      e.vy *= Math.exp(-6 * dt);
      e.x += (ax + e.vx) * dt;
      e.y += (ay + e.vy) * dt;

      // contact damage
      e.touchCd = Math.max(0, e.touchCd - dt);
      if (!charmed) {
        const reach = e.radius + 13;
        if (dist2(e.x, e.y, p.x, p.y) <= reach * reach && e.touchCd <= 0) {
          e.touchCd = 0.7;
          this.hurtPlayer(e.damage * weakenMult, e.x, e.y);
        }
      } else if (target) {
        const reach = e.radius + target.radius;
        if (dist2(e.x, e.y, target.x, target.y) <= reach * reach && e.touchCd <= 0) {
          e.touchCd = 0.6;
          this.hitEnemy(target, e.damage * 2, { onHit: false });
        }
      }
    }

    this.separateEnemies();
  }

  /** Cheap crowd separation so the horde spreads instead of stacking on one pixel. */
  private separateEnemies(): void {
    const list = this.enemies;
    for (let i = 0; i < list.length; i++) {
      const a = list[i];
      if (a.dead) continue;
      const near = this.grid.query(a.x, a.y, a.radius * 2, this.scratch);
      for (const b of near) {
        if (b === a || b.dead) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const min = a.radius + b.radius;
        const d2 = dx * dx + dy * dy;
        if (d2 >= min * min || d2 < 1e-4) continue;
        const d = Math.sqrt(d2);
        const push = ((min - d) / d) * 0.25;
        b.x += dx * push;
        b.y += dy * push;
        a.x -= dx * push;
        a.y -= dy * push;
      }
    }
  }

  private nearestEnemyTo(source: Enemy): Enemy | null {
    const near = this.grid.query(source.x, source.y, 260, this.scratch);
    let best: Enemy | null = null;
    let bestDist = Infinity;
    for (const other of near) {
      if (other === source || other.dead || other.status.charmTime > 0) continue;
      const d = dist2(other.x, other.y, source.x, source.y);
      if (d < bestDist) {
        bestDist = d;
        best = other;
      }
    }
    return best;
  }

  private spawnEnemyShot(enemy: Enemy, dirX: number, dirY: number): void {
    const speed = enemy.def.projectileSpeed ?? 140;
    this.projectiles.push({
      id: newId(),
      kind: 'enemy',
      hostile: true,
      x: enemy.x,
      y: enemy.y,
      vx: dirX * speed,
      vy: dirY * speed,
      angle: Math.atan2(dirY, dirX),
      spin: 0,
      radius: 7,
      damage: (enemy.def.projectileDamage ?? 10) * damageScale(this.time / 60),
      life: 4,
      pierceLeft: 0,
      homing: 0,
      hit: new Set(),
      splashRadius: 0,
      splashDamage: 0,
      color: enemy.def.accent,
      empowered: false,
      infusion: null,
      orbitAngle: 0,
      orbitRadius: 0,
    });
  }

  private stepProjectiles(dt: number): void {
    const p = this.player;
    for (const proj of this.projectiles) {
      proj.life -= dt;
      if (proj.life <= 0) {
        if (!proj.hostile && proj.splashRadius > 0 && proj.kind === 'boulder') {
          this.explodeBoulder(proj);
        }
        continue;
      }

      if (!proj.hostile && proj.homing > 0) this.steerProjectile(proj, dt);

      proj.x += proj.vx * dt;
      proj.y += proj.vy * dt;
      proj.angle += proj.spin * dt;

      // Sisyphus' stone is a lobbed shell: it passes over bodies and only
      // deals damage when its flight timer reaches the impact point.
      if (proj.kind === 'boulder') {
        const totalLife =
          (this.hero.weaponBase.range * this.stats.rangeMult) /
          (this.hero.weaponBase.speed * this.stats.projectileSpeedMult);
        const progress = clamp(1 - proj.life / totalLife, 0, 1);
        proj.altitude = Math.sin(progress * Math.PI) * 58;
        continue;
      }

      if (proj.hostile) {
        if (dist2(proj.x, proj.y, p.x, p.y) <= (proj.radius + 13) ** 2) {
          this.hurtPlayer(proj.damage, proj.x, proj.y);
          proj.life = 0;
        }
        continue;
      }

      const near = this.grid.query(proj.x, proj.y, proj.radius + 26, this.scratch);
      for (const enemy of near) {
        if (enemy.dead || proj.hit.has(enemy.id)) continue;
        if (enemy.status.charmTime > 0) continue;
        const reach = proj.radius + enemy.radius;
        if (dist2(proj.x, proj.y, enemy.x, enemy.y) > reach * reach) continue;
        proj.hit.add(enemy.id);
        this.hitEnemy(enemy, proj.damage, {
          onHit: true,
          empowered: proj.empowered,
          fromX: proj.x,
          fromY: proj.y,
          infusion: proj.infusion,
        });
        if (proj.pierceLeft <= 0) {
          proj.life = 0;
          break;
        }
        proj.pierceLeft--;
      }

      for (const chest of this.chests) {
        if (proj.hit.has(chest.id)) continue;
        const reach = proj.radius + chest.radius;
        if (dist2(proj.x, proj.y, chest.x, chest.y) > reach * reach) continue;
        proj.hit.add(chest.id);
        this.damageChest(chest, proj.damage);
        if (proj.pierceLeft <= 0) {
          proj.life = 0;
          break;
        }
        proj.pierceLeft--;
      }
    }
  }

  private explodeBoulder(proj: Projectile, spawnVfx = true): void {
    if (spawnVfx) {
      this.spawnVfx('burst', proj.x, proj.y, {
        radius: proj.splashRadius,
        life: 0.28,
        color: GODS.gaia.accent,
      });
    }
    const near = this.grid.query(proj.x, proj.y, proj.splashRadius, this.scratch);
    for (const enemy of near) {
      if (enemy.dead) continue;
      const distance = Math.hypot(enemy.x - proj.x, enemy.y - proj.y);
      if (distance > proj.splashRadius + enemy.radius) continue;
      // Brutal at ground zero, rapidly falling to a glancing edge hit.
      const normalized = clamp(distance / proj.splashRadius, 0, 1);
      const falloff = 0.25 + 1.55 * (1 - normalized) ** 2;
      this.hitEnemy(enemy, proj.damage * proj.splashDamage * falloff, {
        onHit: true,
        empowered: proj.empowered,
        fromX: proj.x,
        fromY: proj.y,
        infusion: proj.infusion,
      });
    }
    for (const chest of this.chests) {
      const distance = Math.hypot(chest.x - proj.x, chest.y - proj.y);
      if (distance <= proj.splashRadius + chest.radius) {
        const falloff = 0.25 + 1.55 * (1 - clamp(distance / proj.splashRadius, 0, 1)) ** 2;
        this.damageChest(chest, proj.damage * proj.splashDamage * falloff);
      }
    }
  }

  private steerProjectile(proj: Projectile, dt: number): void {
    const near = this.grid.query(proj.x, proj.y, 190, this.scratch);
    let best: Enemy | null = null;
    let bestDist = Infinity;
    for (const enemy of near) {
      if (enemy.dead || proj.hit.has(enemy.id) || enemy.status.charmTime > 0) continue;
      const d = dist2(enemy.x, enemy.y, proj.x, proj.y);
      if (d < bestDist) {
        bestDist = d;
        best = enemy;
      }
    }
    if (!best) return;
    const speed = Math.hypot(proj.vx, proj.vy) || 1;
    const dx = best.x - proj.x;
    const dy = best.y - proj.y;
    const len = Math.hypot(dx, dy) || 1;
    const blend = clamp(proj.homing * dt * 6, 0, 1);
    const nx = proj.vx / speed + (dx / len - proj.vx / speed) * blend;
    const ny = proj.vy / speed + (dy / len - proj.vy / speed) * blend;
    const nlen = Math.hypot(nx, ny) || 1;
    proj.vx = (nx / nlen) * speed;
    proj.vy = (ny / nlen) * speed;
    proj.angle = Math.atan2(proj.vy, proj.vx);
  }

  private stepOrbiters(dt: number): void {
    if (this.orbiters.length === 0) return;
    const p = this.player;
    const scytheDamage =
      this.hero.weaponBase.damage * this.damageMult() * this.mech.basicDamageMult * 0.9;
    const automatonDamage = this.mech.automatonDamage * this.damageMult();
    for (const orb of this.orbiters) {
      const damage = orb.kind === 'scythe' ? scytheDamage : automatonDamage;
      orb.orbitAngle += dt * 2.6;
      orb.x = p.x + Math.cos(orb.orbitAngle) * orb.orbitRadius * this.stats.rangeMult;
      orb.y = p.y + Math.sin(orb.orbitAngle) * orb.orbitRadius * this.stats.rangeMult;
      orb.angle += dt * orb.spin;

      const near = this.grid.query(orb.x, orb.y, orb.radius + 24, this.scratch);
      for (const enemy of near) {
        if (enemy.dead || enemy.status.charmTime > 0) continue;
        const reach = orb.radius * this.stats.sizeMult + enemy.radius;
        if (dist2(orb.x, orb.y, enemy.x, enemy.y) > reach * reach) continue;
        if (orb.hit.has(enemy.id)) continue;
        orb.hit.add(enemy.id);
        this.hitEnemy(enemy, damage, {
          onHit: true,
          fromX: orb.x,
          fromY: orb.y,
          infusion: this.player.currentInfusion,
        });
      }
      // Scythes re-arm on every revolution rather than tracking per-enemy timers.
      if (orb.orbitAngle > TAU) {
        orb.orbitAngle -= TAU;
        orb.hit.clear();
      }
    }
  }

  private stepPuddles(dt: number): void {
    for (const puddle of this.puddles) {
      puddle.life -= dt;
      if (puddle.life <= 0) continue;
      const near = this.grid.query(puddle.x, puddle.y, puddle.radius, this.scratch);
      for (const enemy of near) {
        if (enemy.dead) continue;
        if (dist2(enemy.x, enemy.y, puddle.x, puddle.y) > (puddle.radius + enemy.radius) ** 2)
          continue;
        enemy.hp -= puddle.dps * dt;
        if (puddle.slow > 0) {
          enemy.status.slow = Math.max(enemy.status.slow, puddle.slow);
          enemy.status.slowTime = Math.max(enemy.status.slowTime, 0.4);
        }
        if (enemy.hp <= 0) this.killEnemy(enemy);
      }
    }
  }

  private stepChests(dt: number): void {
    for (const chest of this.chests) {
      chest.bob += dt * 2;
      chest.flash = Math.max(0, chest.flash - dt * 5);
    }
  }

  private damageChest(chest: Chest, amount: number): void {
    if (chest.hp <= 0) return;
    chest.hp -= amount;
    chest.flash = 1;
    if (chest.hp <= 0) {
      chest.hp = 0;
      this.openChest(chest);
    }
  }

  private openChest(chest: Chest): void {
    audio.play('chest');
    this.renderer.addShake(6);
    this.spawnVfx('burst', chest.x, chest.y, { radius: 54, life: 0.45, color: '#ffd76a' });
    for (let i = 0; i < 4; i++) this.dropPickup('gold', chest.x, chest.y, 4);

    const offers = drawOffers({
      rng: this.rng,
      hero: this.hero,
      pool: CHEST_POOL,
      owned: this.owned,
      luck: this.stats.luck,
      maxGods: this.maxGods,
      availableGods: this.availableGods,
    });
    this.pushChoice({ source: 'chest', offers, level: this.level });
  }

  private stepPickups(dt: number): void {
    const p = this.player;
    const magnet = this.stats.pickupRadius;
    for (const pickup of this.pickups) {
      pickup.life -= dt;
      const d = dist(pickup.x, pickup.y, p.x, p.y);
      if (!pickup.homing && d <= magnet) pickup.homing = true;
      if (pickup.homing) {
        const speed = 260 + (magnet - d) * 2;
        const dx = p.x - pickup.x;
        const dy = p.y - pickup.y;
        const len = Math.hypot(dx, dy) || 1;
        pickup.x += (dx / len) * speed * dt;
        pickup.y += (dy / len) * speed * dt;
      } else {
        pickup.x += pickup.vx * dt;
        pickup.y += pickup.vy * dt;
        pickup.vx *= Math.exp(-4 * dt);
        pickup.vy *= Math.exp(-4 * dt);
        // Ranged heroes kill far from where they stand, so loot creeps toward
        // the player once it settles. Slower than walking pace, so chasing a
        // gem yourself is still the faster option.
        if (pickup.life < 38.5) {
          const dx = p.x - pickup.x;
          const dy = p.y - pickup.y;
          const len = Math.hypot(dx, dy) || 1;
          pickup.x += (dx / len) * 30 * dt;
          pickup.y += (dy / len) * 30 * dt;
        }
      }
      if (d < 16) {
        this.collect(pickup);
        pickup.life = 0;
      }
    }
  }

  private collect(pickup: Pickup): void {
    switch (pickup.kind) {
      case 'xp':
        this.xp += pickup.value * this.stats.xpMult;
        audio.play('pickup', 0.3);
        this.checkLevelUp();
        break;
      case 'gold':
        this.gold += Math.max(1, Math.round(pickup.value * this.stats.goldMult));
        audio.play('pickup', 0.3);
        break;
      case 'heal':
        this.healPlayer(pickup.value);
        audio.play('pickup', 0.1);
        break;
    }
  }

  private dropPickup(kind: Pickup['kind'], x: number, y: number, value: number): void {
    const angle = this.rng.angle();
    const speed = this.rng.range(20, 70);
    this.pickups.push({
      id: newId(),
      kind,
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      value,
      homing: false,
      life: 40,
    });
  }

  private checkLevelUp(): void {
    while (this.xp >= this.xpNext) {
      this.xp -= this.xpNext;
      this.level++;
      // Every voyage grants one tactical redraw in the midgame. It cannot be
      // hoarded between runs, while gold remains a fallback before/after it.
      if (!this.rerollGiftGranted && this.level >= 10) {
        this.rerollGiftGranted = true;
        this.rerollTokens++;
        this.events.onNarrative(t('card.rerollGift'));
      }
      this.xpNext = xpForLevel(this.level);
      audio.play('levelup');
      this.renderer.flash('#ffe9b0', 0.2);
      this.expireTemporaryCards();
      if (this.mech.levelHeal > 0) this.healPlayer(this.player.maxHp * this.mech.levelHeal);
      this.events.onLevelUp(this.level);
      const offers = drawOffers({
        rng: this.rng,
        hero: this.hero,
        pool: LEVEL_POOL,
        owned: this.owned,
        luck: this.stats.luck,
        maxGods: this.maxGods,
        availableGods: this.availableGods,
      });
      this.pushChoice({ source: 'levelup', offers, level: this.level });
    }
  }

  private stepVfx(dt: number): void {
    for (const fx of this.vfx) {
      fx.life -= dt;
      if (fx.kind === 'text') {
        fx.y += fx.vy * dt;
      } else if (fx.kind === 'spark') {
        fx.x += fx.vx * dt;
        fx.y += fx.vy * dt;
        fx.vx *= Math.exp(-3 * dt);
        fx.vy *= Math.exp(-3 * dt);
      }
    }
  }

  private spawnVfx(
    kind: Vfx['kind'],
    x: number,
    y: number,
    opts: Partial<Omit<Vfx, 'id' | 'kind' | 'x' | 'y'>> & { life: number },
  ): void {
    this.vfx.push({
      id: newId(),
      kind,
      x,
      y,
      x2: opts.x2 ?? x,
      y2: opts.y2 ?? y,
      radius: opts.radius ?? 0,
      angle: opts.angle ?? 0,
      arc: opts.arc ?? 0,
      life: opts.life,
      maxLife: opts.life,
      color: opts.color ?? '#ffffff',
      text: opts.text ?? '',
      vx: opts.vx ?? 0,
      vy: opts.vy ?? -28,
      scale: opts.scale ?? 1,
    });
  }

  /**
   * Recycle trash that has fallen far behind. Without this a player who keeps
   * running accumulates every enemy ever spawned, which costs frame time and
   * eventually walls them in when the cap is reached.
   */
  private cullStragglers(): void {
    const limit = this.renderer.viewRadius() * 2 + 240;
    const limitSq = limit * limit;
    for (const enemy of this.enemies) {
      if (enemy.dead || enemy.isBoss) continue;
      if (dist2(enemy.x, enemy.y, this.player.x, this.player.y) > limitSq) enemy.dead = true;
    }
  }

  private cleanup(): void {
    this.cullStragglers();
    if (this.enemies.some((e) => e.dead)) this.enemies = this.enemies.filter((e) => !e.dead);
    if (this.projectiles.some((p) => p.life <= 0)) {
      this.projectiles = this.projectiles.filter((p) => p.life > 0);
    }
    if (this.pickups.some((p) => p.life <= 0))
      this.pickups = this.pickups.filter((p) => p.life > 0);
    if (this.puddles.some((p) => p.life <= 0))
      this.puddles = this.puddles.filter((p) => p.life > 0);
    if (this.chests.some((c) => c.hp <= 0)) this.chests = this.chests.filter((c) => c.hp > 0);
    if (this.vfx.some((v) => v.life <= 0)) this.vfx = this.vfx.filter((v) => v.life > 0);
  }

  // --------------------------------------------------------------- choices

  private pushChoice(choice: PendingChoice): void {
    this.queue.push(choice);
    if (this.phase === 'playing') this.presentNextChoice();
  }

  private presentNextChoice(): void {
    const next = this.queue.shift();
    if (!next) {
      if (this.phase === 'choosing') this.phase = 'playing';
      return;
    }
    this.phase = 'choosing';
    this.events.onChoice(next);
  }

  /** Called by the UI once the player picks a card. */
  take(offer: Offer): void {
    const { card } = offer;

    // A swap: everything that god gave you goes back before the new one lands.
    if (offer.replaces) {
      for (const [id] of [...this.owned]) {
        if (cardById(id)?.god === offer.replaces) this.owned.delete(id);
      }
      this.expiries.delete(offer.replaces);
    }

    const level = (this.owned.get(card.id) ?? 0) + 1;
    this.owned.set(card.id, level);
    if (card.temporaryLevels) {
      this.expiries.set(card.id, this.level + card.temporaryLevels);
    }
    if (card.id === BOUNTY_CARD.id) {
      this.gold += 40;
      this.healPlayer(this.player.maxHp * 0.15);
    }
    if (card.kind === 'boon') audio.play('boon');
    else audio.play('tap');
    this.rebuildLoadout();
    // Health perks should feel like an immediate heal, not a bigger empty bar.
    if (card.id === 'perk_wine') this.healPlayer(24);
    this.presentNextChoice();
  }

  get rerollCost(): number {
    return 30 + this.rerollsBought * 20;
  }

  /** Replace all three visible offers, spending the free token before run gold. */
  reroll(choice: PendingChoice): PendingChoice | null {
    if (this.rerollTokens > 0) this.rerollTokens--;
    else {
      if (this.gold < this.rerollCost) return null;
      this.gold -= this.rerollCost;
      this.rerollsBought++;
    }
    const offers = drawOffers({
      rng: this.rng,
      hero: this.hero,
      pool: choice.source === 'chest' ? CHEST_POOL : LEVEL_POOL,
      owned: this.owned,
      luck: this.stats.luck,
      maxGods: this.maxGods,
      availableGods: this.availableGods,
    });
    return { ...choice, offers };
  }

  /** Temporary perks wear off after a set number of level-ups. */
  private expireTemporaryCards(): void {
    let changed = false;
    for (const [id, expiresAt] of [...this.expiries]) {
      if (this.level < expiresAt) continue;
      this.expiries.delete(id);
      this.owned.delete(id);
      changed = true;
    }
    if (changed) this.rebuildLoadout();
  }

  /** Temporary cards still running, with how many level-ups they have left. */
  activeTemporary(): { card: CardDef; levelsLeft: number }[] {
    const out: { card: CardDef; levelsLeft: number }[] = [];
    for (const [id, expiresAt] of this.expiries) {
      const card = cardById(id);
      if (card) out.push({ card, levelsLeft: Math.max(0, expiresAt - this.level) });
    }
    return out;
  }

  hasPendingChoice(): boolean {
    return this.queue.length > 0;
  }

  pause(): void {
    if (this.phase === 'playing') this.phase = 'paused';
  }

  resume(): void {
    if (this.phase !== 'paused') return;
    this.phase = 'playing';
    // A chest can break in the same frame the player pauses or dies; those
    // choices wait in the queue and are presented once play resumes.
    if (this.queue.length > 0) this.presentNextChoice();
  }

  /** Ad-reward or permanent upgrades revive: clear the area and stand back up. */
  revive(): boolean {
    if (this.phase !== 'dead') return false;
    this.player.hp = this.player.maxHp * 0.6;
    this.player.invuln = 3;
    this.player.shields = Math.max(this.player.shields, 1);
    for (const enemy of this.enemies) {
      if (!enemy.isBoss && dist(enemy.x, enemy.y, this.player.x, this.player.y) < 260) {
        this.killEnemy(enemy);
      }
    }
    this.renderer.flash('#ffe9b0', 0.5);
    this.phase = 'playing';
    if (this.queue.length > 0) this.presentNextChoice();
    return true;
  }

  finish(): void {
    this.phase = 'finished';
  }

  get xpProgress(): number {
    return clamp(this.xp / this.xpNext, 0, 1);
  }

  get hpProgress(): number {
    return clamp(this.player.hp / this.player.maxHp, 0, 1);
  }
}

/** XP needed to advance *from* `level`. Gentle early, steeper past 20. */
export function xpForLevel(level: number): number {
  return Math.round(5 + level * 3.2 + Math.pow(level, 1.75));
}
