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

function drawPlayer(ctx: CanvasRenderingContext2D, run: Run, wallTime: number): void {
  const p = run.player;
  const hero = run.hero;

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
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = hero.accent;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }

  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + 11, 12, 5, 0, 0, TAU);
  ctx.fill();
  ctx.restore();

  ctx.save();
  if (p.invuln > 0 && Math.floor(wallTime * 16) % 2 === 0) ctx.globalAlpha = 0.45;
  ctx.translate(p.x, p.y);

  // body
  ctx.fillStyle = p.hurtFlash > 0.2 ? '#ffffff' : hero.color;
  ctx.beginPath();
  ctx.arc(0, 0, 11, 0, TAU);
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#0a0812';
  ctx.stroke();

  // facing chevron doubles as the aim indicator
  ctx.rotate(p.facing);
  ctx.fillStyle = hero.accent;
  ctx.beginPath();
  ctx.moveTo(17, 0);
  ctx.lineTo(6, -6);
  ctx.lineTo(8, 0);
  ctx.lineTo(6, 6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  for (let i = 0; i < p.shields; i++) {
    ctx.save();
    ctx.globalAlpha = 0.75;
    ctx.strokeStyle = '#e8dcb4';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 17 + i * 4, wallTime * 1.5, wallTime * 1.5 + Math.PI * 1.4);
    ctx.stroke();
    ctx.restore();
  }
}

// ------------------------------------------------------------------ enemies

function drawEnemy(ctx: CanvasRenderingContext2D, e: Enemy): void {
  const s = e.status;
  ctx.save();
  ctx.translate(e.x, e.y);

  ctx.globalAlpha = 0.28;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(0, e.radius * 0.85, e.radius * 0.8, e.radius * 0.32, 0, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 1;

  let fill = e.def.color;
  if (s.charmTime > 0) fill = '#e072b4';
  else if (s.bleedTime > 0) fill = mix(e.def.color, '#d43f43', 0.35);
  else if (s.slowTime > 0) fill = mix(e.def.color, '#3fa9d8', 0.35);
  if (e.flash > 0.05) fill = '#ffffff';

  ctx.fillStyle = fill;
  ctx.strokeStyle = '#08060f';
  ctx.lineWidth = 2;

  switch (e.def.id) {
    case 'harpy': {
      ctx.beginPath();
      ctx.moveTo(0, -e.radius);
      ctx.lineTo(e.radius, e.radius * 0.8);
      ctx.lineTo(-e.radius, e.radius * 0.8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }
    case 'spartoi': {
      const s2 = e.radius * 0.86;
      ctx.beginPath();
      ctx.rect(-s2, -s2, s2 * 2, s2 * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#08060f';
      ctx.fillRect(-s2 * 0.45, -s2 * 0.3, s2 * 0.3, s2 * 0.3);
      ctx.fillRect(s2 * 0.15, -s2 * 0.3, s2 * 0.3, s2 * 0.3);
      break;
    }
    case 'siren': {
      ctx.beginPath();
      ctx.moveTo(0, -e.radius);
      ctx.lineTo(e.radius * 0.8, 0);
      ctx.lineTo(0, e.radius);
      ctx.lineTo(-e.radius * 0.8, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }
    case 'cyclops':
    case 'minotaur': {
      ctx.beginPath();
      ctx.arc(0, 0, e.radius, 0, TAU);
      ctx.fill();
      ctx.stroke();
      if (e.def.id === 'minotaur') {
        ctx.strokeStyle = e.def.accent;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-e.radius * 0.75, -e.radius * 0.6);
        ctx.lineTo(-e.radius * 1.25, -e.radius * 1.1);
        ctx.moveTo(e.radius * 0.75, -e.radius * 0.6);
        ctx.lineTo(e.radius * 1.25, -e.radius * 1.1);
        ctx.stroke();
      }
      ctx.fillStyle = e.def.accent;
      ctx.beginPath();
      ctx.arc(0, -e.radius * 0.1, e.radius * 0.28, 0, TAU);
      ctx.fill();
      break;
    }
    case 'cerberus': {
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.arc(i * e.radius * 0.55, i === 0 ? -e.radius * 0.2 : 0, e.radius * 0.55, 0, TAU);
        ctx.fill();
        ctx.stroke();
      }
      ctx.fillStyle = '#ff6a5e';
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.arc(i * e.radius * 0.55, (i === 0 ? -e.radius * 0.2 : 0) - 3, e.radius * 0.14, 0, TAU);
        ctx.fill();
      }
      break;
    }
    default: {
      ctx.beginPath();
      ctx.arc(0, 0, e.radius, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = e.def.accent;
      ctx.beginPath();
      ctx.arc(-e.radius * 0.3, -e.radius * 0.2, e.radius * 0.16, 0, TAU);
      ctx.arc(e.radius * 0.3, -e.radius * 0.2, e.radius * 0.16, 0, TAU);
      ctx.fill();
    }
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
