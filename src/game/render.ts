import { TAU } from '../core/math';
import type { Renderer } from '../core/renderer';
import type { Chest, Enemy, Pickup, Projectile, Puddle, Vfx } from './entities';
import type { Run } from './run';

const PICKUP_COLORS: Record<Pickup['kind'], string> = {
  xp: '#5fd6ef',
  gold: '#f0c04a',
  heal: '#77dd88',
};

/** Backdrop tint per hero, so each voyage reads differently at a glance. */
const HERO_TINT: Record<string, string> = {
  odysseus: '#16243f',
  achilles: '#2a1620',
  sisyphus: '#20222c',
  thanatos: '#1c1633',
};

export function drawRun(run: Run, r: Renderer, wallTime: number): void {
  const { ctx } = r;
  r.drawBackground(wallTime, HERO_TINT[run.hero.id] ?? '#16243f');
  r.beginWorld();

  const cullX = r.viewHalfWidth() + 80;
  const cullY = r.viewHalfHeight() + 80;
  const camX = r.camera.x;
  const camY = r.camera.y;
  const visible = (x: number, y: number): boolean =>
    Math.abs(x - camX) < cullX && Math.abs(y - camY) < cullY;

  for (const puddle of run.puddles) if (visible(puddle.x, puddle.y)) drawPuddle(ctx, puddle);
  for (const chest of run.chests) if (visible(chest.x, chest.y)) drawChest(ctx, chest);
  for (const pickup of run.pickups)
    if (visible(pickup.x, pickup.y)) drawPickup(ctx, pickup, wallTime);
  for (const enemy of run.enemies) if (visible(enemy.x, enemy.y)) drawEnemy(ctx, enemy);

  drawPlayer(ctx, run, wallTime);

  for (const proj of run.projectiles) if (visible(proj.x, proj.y)) drawProjectile(ctx, proj);
  for (const orb of run.orbiters) drawScythe(ctx, orb);
  for (const fx of run.vfx) if (visible(fx.x, fx.y)) drawVfx(ctx, fx);

  drawChestArrows(ctx, run, r);
  r.endWorld();
}

// ------------------------------------------------------------------ player

/**
 * Heroes are drawn as a hooded body with a weapon held in hand, animated from
 * two clocks the simulation already keeps: `walkPhase` (a bob while moving) and
 * `attackProgress` (0 right after a swing, 1 when the next one is ready). That
 * is enough for the eye to read weight and rhythm without a single sprite.
 */
function drawPlayer(ctx: CanvasRenderingContext2D, run: Run, wallTime: number): void {
  const p = run.player;
  const hero = run.hero;
  const bob = Math.sin(p.walkPhase) * 1.8;
  const lean = Math.cos(p.walkPhase) * 0.06;
  // Weapons snap out at the moment of the swing and recover over the cooldown.
  const swing = 1 - Math.min(1, p.attackProgress * 2.6);

  // Thanatos' shroud is the weapon, so it is drawn under everything he touches.
  if (hero.weapon === 'aura') {
    const radius = hero.weaponBase.range * run.stats.rangeMult * run.stats.sizeMult;
    const pulse = 0.5 + 0.5 * Math.sin(wallTime * 4);
    ctx.save();
    ctx.globalAlpha = 0.13 + pulse * 0.07;
    ctx.fillStyle = hero.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 0.3 + swing * 0.35;
    ctx.strokeStyle = hero.accent;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }

  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + 11, 11, 4.5, 0, 0, TAU);
  ctx.fill();
  ctx.restore();

  // The hero fires where it walks, so the heading gets its own ground marker:
  // the weapon alone is too easy to lose in a crowd.
  ctx.save();
  ctx.translate(p.x, p.y + 10);
  ctx.rotate(p.facing);
  ctx.scale(1, 0.42);
  ctx.globalAlpha = 0.32 + swing * 0.3;
  ctx.fillStyle = hero.accent;
  ctx.beginPath();
  ctx.moveTo(30, 0);
  ctx.lineTo(14, -10);
  ctx.lineTo(17, 0);
  ctx.lineTo(14, 10);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.save();
  if (p.invuln > 0 && Math.floor(wallTime * 16) % 2 === 0) ctx.globalAlpha = 0.45;
  ctx.translate(p.x, p.y + bob);

  const skin = p.hurtFlash > 0.2 ? '#ffffff' : hero.color;
  const trim = p.hurtFlash > 0.2 ? '#ffffff' : hero.accent;

  ctx.rotate(lean);
  // Cloak: a tapered body that reads as a standing figure at 20 pixels tall.
  ctx.fillStyle = skin;
  ctx.strokeStyle = '#0a0812';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-4.5, -6);
  ctx.lineTo(4.5, -6);
  ctx.quadraticCurveTo(9, 6, 7, 11);
  ctx.lineTo(-7, 11);
  ctx.quadraticCurveTo(-9, 6, -4.5, -6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Head and hood.
  ctx.beginPath();
  ctx.arc(0, -9, 5.4, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = trim;
  ctx.beginPath();
  ctx.arc(0, -10.5, 5.4, Math.PI, 0);
  ctx.fill();
  ctx.rotate(-lean);

  drawWeapon(ctx, hero.weapon, p.facing, swing, skin, trim);
  ctx.restore();

  drawShields(ctx, p.x, p.y + bob, p.shields, wallTime);
}

/** The held weapon, rotated to the hero's heading and thrust on the swing. */
function drawWeapon(
  ctx: CanvasRenderingContext2D,
  weapon: string,
  facing: number,
  swing: number,
  color: string,
  accent: string,
): void {
  ctx.save();
  ctx.rotate(facing);
  ctx.translate(7 + swing * 5, 3);
  ctx.strokeStyle = accent;
  ctx.fillStyle = accent;
  ctx.lineCap = 'round';

  switch (weapon) {
    case 'bow': {
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(0, 0, 7.5, -1.25, 1.25);
      ctx.stroke();
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(Math.cos(-1.25) * 7.5, Math.sin(-1.25) * 7.5);
      // The string relaxes forward as the shot is loosed.
      ctx.quadraticCurveTo(-4 + swing * 5, 0, Math.cos(1.25) * 7.5, Math.sin(1.25) * 7.5);
      ctx.stroke();
      break;
    }
    case 'sword': {
      ctx.rotate(-0.5 + swing * 1.1);
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(-3, 0);
      ctx.lineTo(15, 0);
      ctx.stroke();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-1, -4);
      ctx.lineTo(-1, 4);
      ctx.stroke();
      break;
    }
    case 'boulder': {
      ctx.fillStyle = '#9aa4b2';
      ctx.strokeStyle = '#3c4250';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(4, -2 - swing * 3, 6.5, 0, TAU);
      ctx.fill();
      ctx.stroke();
      break;
    }
    case 'aura': {
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(-2, -12);
      ctx.lineTo(-2, 9);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(3, -12, 7, Math.PI * 0.95, Math.PI * 1.85);
      ctx.stroke();
      break;
    }
  }
  ctx.restore();
}

/** Athena's aegis: one orbiting disc per charge, so the count is readable. */
function drawShields(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  count: number,
  wallTime: number,
): void {
  if (count <= 0) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(wallTime * 1.1);
  for (let i = 0; i < count; i++) {
    const angle = (TAU * i) / count;
    const px = Math.cos(angle) * 21;
    const py = Math.sin(angle) * 21;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(angle + Math.PI / 2);
    ctx.fillStyle = 'rgba(232, 220, 180, 0.85)';
    ctx.strokeStyle = '#7d6f45';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, -5.5);
    ctx.lineTo(4.4, -2.4);
    ctx.lineTo(3.4, 4.6);
    ctx.lineTo(0, 6);
    ctx.lineTo(-3.4, 4.6);
    ctx.lineTo(-4.4, -2.4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

// ------------------------------------------------------------------ enemies

function drawEnemy(ctx: CanvasRenderingContext2D, e: Enemy): void {
  const s = e.status;
  const frozen = s.frozenTime > 0;
  // Hit squash: brief, and read as impact rather than as a size change.
  const squash = 1 + e.flash * 0.18;
  const bob = frozen ? 0 : Math.sin(e.anim * 2) * e.radius * 0.09;

  ctx.save();
  ctx.translate(e.x, e.y + bob);

  ctx.globalAlpha = 0.28;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(0, e.radius * 0.9 - bob, e.radius * 0.78, e.radius * 0.3, 0, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 1;

  let fill = e.def.color;
  if (s.charmTime > 0) fill = '#e072b4';
  else if (frozen) fill = mix(e.def.color, s.frozenKind === 'ice' ? '#bff0ff' : '#7fbf5f', 0.55);
  else if (s.bleedTime > 0) fill = mix(e.def.color, '#d43f43', 0.35);
  else if (s.slowTime > 0) fill = mix(e.def.color, '#3fa9d8', 0.35);
  if (e.flash > 0.05) fill = '#ffffff';

  ctx.scale(1 / squash, squash);
  ctx.fillStyle = fill;
  ctx.strokeStyle = '#08060f';
  ctx.lineWidth = 2;

  switch (e.def.id) {
    case 'shade':
      drawShade(ctx, e);
      break;
    case 'harpy':
      drawHarpy(ctx, e, frozen);
      break;
    case 'spartoi':
      drawSpartoi(ctx, e);
      break;
    case 'siren':
      drawSiren(ctx, e, frozen);
      break;
    case 'cyclops':
      drawCyclops(ctx, e);
      break;
    case 'minotaur':
      drawMinotaur(ctx, e);
      break;
    case 'cerberus':
      drawCerberus(ctx, e);
      break;
  }

  if (s.doomTime > 0) {
    ctx.strokeStyle = '#b79aff';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.arc(0, 0, e.radius + 5, 0, TAU);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  if (frozen) drawFrozenOverlay(ctx, e);
  ctx.restore();

  const damaged = e.hp < e.maxHp;
  if (e.isBoss || (damaged && e.radius >= 13)) {
    drawHpBar(
      ctx,
      e.x,
      e.y - e.radius - 8,
      e.isBoss ? 54 : e.radius * 2,
      e.hp / e.maxHp,
      '#d84a52',
    );
  }
}

/** Hooded wisp: a cowl over a tattered hem that ripples as it drifts. */
function drawShade(ctx: CanvasRenderingContext2D, e: Enemy): void {
  const r = e.radius;
  ctx.beginPath();
  ctx.moveTo(-r, r * 0.2);
  ctx.quadraticCurveTo(-r, -r * 1.15, 0, -r * 1.15);
  ctx.quadraticCurveTo(r, -r * 1.15, r, r * 0.2);
  for (let i = 0; i <= 4; i++) {
    const x = r - (i * r * 2) / 4;
    const wave = Math.sin(e.anim * 3 + i) * r * 0.18;
    ctx.lineTo(x, r * 0.9 + wave);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = e.def.accent;
  ctx.beginPath();
  ctx.arc(-r * 0.32, -r * 0.35, r * 0.15, 0, TAU);
  ctx.arc(r * 0.32, -r * 0.35, r * 0.15, 0, TAU);
  ctx.fill();
}

function drawHarpy(ctx: CanvasRenderingContext2D, e: Enemy, frozen: boolean): void {
  const r = e.radius;
  const flap = frozen ? 0.2 : Math.sin(e.anim * 7) * 0.6;
  ctx.save();
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.scale(side, 1);
    ctx.rotate(-flap);
    ctx.beginPath();
    ctx.moveTo(r * 0.3, -r * 0.2);
    ctx.quadraticCurveTo(r * 1.8, -r * 0.9, r * 1.9, r * 0.1);
    ctx.quadraticCurveTo(r * 1.2, r * 0.1, r * 0.3, r * 0.4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.55, r * 0.85, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = e.def.accent;
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.3);
  ctx.lineTo(r * 0.5, -r * 0.05);
  ctx.lineTo(0, r * 0.05);
  ctx.closePath();
  ctx.fill();
}

/** Sown-man skeleton: skull, ribs and a scrap of shield. */
function drawSpartoi(ctx: CanvasRenderingContext2D, e: Enemy): void {
  const r = e.radius;
  ctx.beginPath();
  ctx.moveTo(-r * 0.55, -r * 0.2);
  ctx.lineTo(r * 0.55, -r * 0.2);
  ctx.lineTo(r * 0.4, r);
  ctx.lineTo(-r * 0.4, r);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, -r * 0.6, r * 0.5, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#08060f';
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(-r * 0.42, r * (0.05 + i * 0.28));
    ctx.lineTo(r * 0.42, r * (0.05 + i * 0.28));
    ctx.stroke();
  }
  ctx.fillStyle = '#08060f';
  ctx.beginPath();
  ctx.arc(-r * 0.18, -r * 0.65, r * 0.12, 0, TAU);
  ctx.arc(r * 0.18, -r * 0.65, r * 0.12, 0, TAU);
  ctx.fill();
}

function drawSiren(ctx: CanvasRenderingContext2D, e: Enemy, frozen: boolean): void {
  const r = e.radius;
  const sway = frozen ? 0 : Math.sin(e.anim * 3) * r * 0.4;
  ctx.beginPath();
  ctx.moveTo(-r * 0.45, 0);
  ctx.quadraticCurveTo(0, r * 1.1, sway, r * 1.3);
  ctx.quadraticCurveTo(r * 0.45, r * 0.6, r * 0.45, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, -r * 0.35, r * 0.6, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = e.def.accent;
  ctx.beginPath();
  ctx.ellipse(0, -r * 0.35, r * 0.22, r * 0.34, 0, 0, TAU);
  ctx.fill();
}

function drawCyclops(ctx: CanvasRenderingContext2D, e: Enemy): void {
  const r = e.radius;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.95, r, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  // Club, swung slowly from side to side.
  ctx.save();
  ctx.rotate(Math.sin(e.anim * 1.6) * 0.5);
  ctx.strokeStyle = '#5a3f2c';
  ctx.lineWidth = r * 0.28;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(r * 0.7, -r * 0.1);
  ctx.lineTo(r * 1.5, -r * 0.8);
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = e.def.accent;
  ctx.beginPath();
  ctx.arc(0, -r * 0.2, r * 0.32, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#08060f';
  ctx.beginPath();
  ctx.arc(0, -r * 0.2, r * 0.14, 0, TAU);
  ctx.fill();
}

function drawMinotaur(ctx: CanvasRenderingContext2D, e: Enemy): void {
  const r = e.radius;
  const snort = 1 + Math.sin(e.anim * 4) * 0.04;
  ctx.save();
  ctx.scale(snort, snort);
  ctx.beginPath();
  ctx.moveTo(-r * 0.9, -r * 0.3);
  ctx.quadraticCurveTo(0, -r * 1.1, r * 0.9, -r * 0.3);
  ctx.lineTo(r * 0.7, r);
  ctx.lineTo(-r * 0.7, r);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(0, -r * 0.45, r * 0.62, r * 0.5, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = e.def.accent;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(side * r * 0.55, -r * 0.6);
    ctx.quadraticCurveTo(side * r * 1.3, -r * 0.95, side * r * 1.1, -r * 1.45);
    ctx.stroke();
  }
  ctx.fillStyle = '#ff6a5e';
  ctx.beginPath();
  ctx.arc(-r * 0.24, -r * 0.5, r * 0.12, 0, TAU);
  ctx.arc(r * 0.24, -r * 0.5, r * 0.12, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawCerberus(ctx: CanvasRenderingContext2D, e: Enemy): void {
  const r = e.radius;
  ctx.beginPath();
  ctx.ellipse(0, r * 0.25, r * 0.95, r * 0.7, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  for (const [index, side] of [-1, 0, 1].entries()) {
    const lift = Math.sin(e.anim * 3 + index * 1.7) * r * 0.08;
    ctx.beginPath();
    ctx.ellipse(side * r * 0.6, -r * 0.4 + lift, r * 0.42, r * 0.46, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = '#ff6a5e';
  for (const [index, side] of [-1, 0, 1].entries()) {
    const lift = Math.sin(e.anim * 3 + index * 1.7) * r * 0.08;
    ctx.beginPath();
    ctx.arc(side * r * 0.6 - r * 0.14, -r * 0.5 + lift, r * 0.09, 0, TAU);
    ctx.arc(side * r * 0.6 + r * 0.14, -r * 0.5 + lift, r * 0.09, 0, TAU);
    ctx.fill();
  }
}

/** Ice shards or grasping vines, depending on what stopped the enemy. */
function drawFrozenOverlay(ctx: CanvasRenderingContext2D, e: Enemy): void {
  const r = e.radius;
  const ice = e.status.frozenKind === 'ice';
  ctx.save();
  ctx.globalAlpha = 0.75;
  ctx.strokeStyle = ice ? '#dff7ff' : '#8fd06a';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  for (let i = 0; i < 5; i++) {
    const angle = (TAU * i) / 5 + (ice ? 0.3 : e.anim * 0.4);
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * r * 0.5, Math.sin(angle) * r * 0.5);
    if (ice) {
      ctx.lineTo(Math.cos(angle) * r * 1.35, Math.sin(angle) * r * 1.35);
    } else {
      ctx.quadraticCurveTo(
        Math.cos(angle + 0.6) * r * 1.1,
        Math.sin(angle + 0.6) * r * 1.1,
        Math.cos(angle) * r * 1.3,
        Math.sin(angle) * r * 1.3,
      );
    }
    ctx.stroke();
  }
  ctx.restore();
}

function drawHpBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  ratio: number,
  color: string,
): void {
  const h = 3.5;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(x - width / 2, y, width, h);
  ctx.fillStyle = color;
  ctx.fillRect(x - width / 2, y, width * Math.max(0, ratio), h);
  ctx.restore();
}

// ------------------------------------------------------------------- world

function drawChest(ctx: CanvasRenderingContext2D, chest: Chest): void {
  const bob = Math.sin(chest.bob) * 2;
  ctx.save();
  ctx.translate(chest.x, chest.y + bob);

  ctx.globalAlpha = 0.35;
  ctx.fillStyle = '#f0c04a';
  ctx.beginPath();
  ctx.arc(0, 0, 30 + Math.sin(chest.bob * 1.5) * 3, 0, TAU);
  ctx.fillStyle = 'rgba(240,192,74,0.12)';
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.fillStyle = chest.flash > 0.1 ? '#ffffff' : '#7a5326';
  ctx.strokeStyle = '#2a1a08';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.rect(-16, -12, 32, 24);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#e8b64c';
  ctx.fillRect(-16, -12, 32, 7);
  ctx.fillRect(-3, -12, 6, 24);
  ctx.restore();

  drawHpBar(ctx, chest.x, chest.y - 26 + bob, 34, chest.hp / chest.maxHp, '#e8b64c');
}

function drawPickup(ctx: CanvasRenderingContext2D, pickup: Pickup, wallTime: number): void {
  const color = PICKUP_COLORS[pickup.kind];
  const pulse = 1 + Math.sin(wallTime * 6 + pickup.id) * 0.12;
  ctx.save();
  ctx.translate(pickup.x, pickup.y);
  ctx.scale(pulse, pulse);
  ctx.fillStyle = color;
  if (pickup.kind === 'xp') {
    ctx.beginPath();
    ctx.moveTo(0, -5);
    ctx.lineTo(4, 0);
    ctx.lineTo(0, 5);
    ctx.lineTo(-4, 0);
    ctx.closePath();
    ctx.fill();
  } else if (pickup.kind === 'gold') {
    ctx.beginPath();
    ctx.arc(0, 0, 4.5, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillRect(-1.5, -3, 1.4, 6);
  } else {
    ctx.fillRect(-1.8, -6, 3.6, 12);
    ctx.fillRect(-6, -1.8, 12, 3.6);
  }
  ctx.restore();
}

function drawPuddle(ctx: CanvasRenderingContext2D, puddle: Puddle): void {
  const fade = Math.min(1, puddle.life / 1.2);
  ctx.save();
  ctx.globalAlpha = 0.3 * fade;
  ctx.fillStyle = '#2f8fc0';
  ctx.beginPath();
  ctx.ellipse(puddle.x, puddle.y, puddle.radius, puddle.radius * 0.72, 0, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 0.6 * fade;
  ctx.strokeStyle = '#9fe8ff';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}

// ------------------------------------------------------------- projectiles

function drawProjectile(ctx: CanvasRenderingContext2D, proj: Projectile): void {
  ctx.save();
  ctx.translate(proj.x, proj.y);
  ctx.rotate(proj.angle);

  switch (proj.kind) {
    case 'arrow': {
      const len = 12 + proj.radius;
      ctx.strokeStyle = proj.color;
      ctx.lineWidth = Math.max(2, proj.radius * 0.6);
      ctx.beginPath();
      ctx.moveTo(-len * 0.6, 0);
      ctx.lineTo(len * 0.5, 0);
      ctx.stroke();
      ctx.fillStyle = proj.color;
      ctx.beginPath();
      ctx.moveTo(len * 0.9, 0);
      ctx.lineTo(len * 0.35, -proj.radius * 0.8);
      ctx.lineTo(len * 0.35, proj.radius * 0.8);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'boulder': {
      ctx.fillStyle = '#9aa4b2';
      ctx.strokeStyle = '#3c4250';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, proj.radius, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#6f7787';
      ctx.beginPath();
      ctx.arc(-proj.radius * 0.3, -proj.radius * 0.25, proj.radius * 0.26, 0, TAU);
      ctx.arc(proj.radius * 0.32, proj.radius * 0.2, proj.radius * 0.18, 0, TAU);
      ctx.fill();
      break;
    }
    default: {
      ctx.fillStyle = proj.color;
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.arc(0, 0, proj.radius * 1.9, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(0, 0, proj.radius, 0, TAU);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawScythe(ctx: CanvasRenderingContext2D, orb: Projectile): void {
  ctx.save();
  ctx.translate(orb.x, orb.y);
  ctx.rotate(orb.angle);
  ctx.strokeStyle = orb.color;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(0, 0, orb.radius, -0.9, 0.9);
  ctx.stroke();
  ctx.restore();
}

// --------------------------------------------------------------------- vfx

function drawVfx(ctx: CanvasRenderingContext2D, fx: Vfx): void {
  const t = 1 - fx.life / fx.maxLife;
  const fade = 1 - t;

  ctx.save();
  switch (fx.kind) {
    case 'sweep': {
      ctx.globalAlpha = fade * 0.75;
      const grad = ctx.createRadialGradient(fx.x, fx.y, fx.radius * 0.25, fx.x, fx.y, fx.radius);
      grad.addColorStop(0, 'rgba(255,255,255,0)');
      grad.addColorStop(1, fx.color);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(fx.x, fx.y);
      const spread = fx.arc * (0.5 + t * 0.6);
      ctx.arc(fx.x, fx.y, fx.radius, fx.angle - spread, fx.angle + spread);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'ring': {
      ctx.globalAlpha = fade * 0.8;
      ctx.strokeStyle = fx.color;
      ctx.lineWidth = 3 * fade + 1;
      ctx.beginPath();
      ctx.arc(fx.x, fx.y, fx.radius * (0.7 + t * 0.35), 0, TAU);
      ctx.stroke();
      break;
    }
    case 'burst': {
      ctx.globalAlpha = fade * 0.7;
      ctx.fillStyle = fx.color;
      ctx.beginPath();
      ctx.arc(fx.x, fx.y, fx.radius * (0.35 + t * 0.85), 0, TAU);
      ctx.fill();
      break;
    }
    case 'shield': {
      ctx.globalAlpha = fade;
      ctx.strokeStyle = fx.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(fx.x, fx.y, fx.radius * (0.8 + t * 0.4), 0, TAU);
      ctx.stroke();
      break;
    }
    case 'bolt':
    case 'chain': {
      ctx.globalAlpha = fade;
      ctx.strokeStyle = fx.color;
      ctx.lineWidth = fx.kind === 'bolt' ? 4 : 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      const steps = 6;
      ctx.moveTo(fx.x, fx.y);
      for (let i = 1; i <= steps; i++) {
        const p = i / steps;
        const jitter =
          i === steps ? 0 : (Math.sin(fx.id * 3.7 + i * 2.1) * 14) / (fx.kind === 'bolt' ? 1 : 2);
        const nx = fx.x + (fx.x2 - fx.x) * p;
        const ny = fx.y + (fx.y2 - fx.y) * p;
        ctx.lineTo(nx + jitter, ny + jitter * 0.4);
      }
      ctx.stroke();
      break;
    }
    case 'thorn': {
      ctx.globalAlpha = fade;
      ctx.translate(fx.x, fx.y);
      ctx.rotate(fx.angle);
      ctx.fillStyle = fx.color;
      const h = fx.radius * (0.5 + t * 0.9);
      ctx.beginPath();
      ctx.moveTo(0, -h);
      ctx.lineTo(5, 6);
      ctx.lineTo(-5, 6);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'spark': {
      ctx.globalAlpha = fade;
      ctx.fillStyle = fx.color;
      ctx.beginPath();
      ctx.arc(fx.x, fx.y, Math.max(0.6, fx.radius * fade), 0, TAU);
      ctx.fill();
      break;
    }
    case 'text': {
      ctx.globalAlpha = Math.min(1, fade * 1.6);
      ctx.fillStyle = fx.color;
      ctx.font = `700 ${13 * fx.scale}px ${'Trebuchet MS, system-ui, sans-serif'}`;
      ctx.textAlign = 'center';
      ctx.strokeStyle = 'rgba(0,0,0,0.7)';
      ctx.lineWidth = 3;
      ctx.strokeText(fx.text, fx.x, fx.y);
      ctx.fillText(fx.text, fx.x, fx.y);
      break;
    }
  }
  ctx.restore();
}

/** Off-screen chests get a pointer, otherwise players never find them. */
function drawChestArrows(ctx: CanvasRenderingContext2D, run: Run, r: Renderer): void {
  const halfW = r.viewHalfWidth();
  const halfH = r.viewHalfHeight();
  for (const chest of run.chests) {
    const dx = chest.x - run.player.x;
    const dy = chest.y - run.player.y;
    if (Math.abs(dx) < halfW - 40 && Math.abs(dy) < halfH - 40) continue;
    const angle = Math.atan2(dy, dx);
    const radius = Math.min(halfW, halfH) - 34;
    const ax = run.player.x + Math.cos(angle) * radius;
    const ay = run.player.y + Math.sin(angle) * radius;
    ctx.save();
    ctx.translate(ax, ay);
    ctx.rotate(angle);
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = '#e8b64c';
    ctx.beginPath();
    ctx.moveTo(9, 0);
    ctx.lineTo(-6, -6);
    ctx.lineTo(-6, 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

function mix(a: string, b: string, amount: number): string {
  const pa = parseHex(a);
  const pb = parseHex(b);
  const r = Math.round(pa[0] + (pb[0] - pa[0]) * amount);
  const g = Math.round(pa[1] + (pb[1] - pa[1]) * amount);
  const bl = Math.round(pa[2] + (pb[2] - pa[2]) * amount);
  return `rgb(${r},${g},${bl})`;
}

function parseHex(hex: string): [number, number, number] {
  const value = hex.replace('#', '');
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
  ];
}
