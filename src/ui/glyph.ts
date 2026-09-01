import { TAU } from '../core/math';
import type { CardDef } from '../data/cards';
import { GODS, type GodId } from '../data/gods';
import type { HeroDef } from '../data/heroes';

/**
 * Every icon in the game is drawn at runtime onto a small canvas. No sprite
 * sheets means no art pipeline and a build that stays a few hundred KB — which
 * matters a lot for a web-delivered mobile game.
 */
function makeCanvas(size: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  canvas.style.width = `${size}px`;
  canvas.style.height = `${size}px`;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(dpr, dpr);
  return { canvas, ctx };
}

function backdrop(ctx: CanvasRenderingContext2D, size: number, color: string): void {
  const grad = ctx.createLinearGradient(0, 0, 0, size);
  grad.addColorStop(0, 'rgba(255,255,255,0.08)');
  grad.addColorStop(1, 'rgba(0,0,0,0.35)');
  ctx.fillStyle = '#0a0918';
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, size - 1, size - 1);
  ctx.globalAlpha = 1;
}

export function heroPortrait(hero: HeroDef, size = 96): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(size);
  backdrop(ctx, size, hero.color);
  const c = size / 2;
  ctx.save();
  ctx.translate(c, c);
  ctx.strokeStyle = hero.color;
  ctx.fillStyle = hero.color;
  ctx.lineWidth = size * 0.055;
  ctx.lineCap = 'round';
  const s = size * 0.3;

  switch (hero.weapon) {
    case 'bow': {
      ctx.beginPath();
      ctx.arc(-s * 0.2, 0, s, -1.1, 1.1);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-s * 0.2 + Math.cos(-1.1) * s, Math.sin(-1.1) * s);
      ctx.lineTo(-s * 0.2 + Math.cos(1.1) * s, Math.sin(1.1) * s);
      ctx.lineWidth = size * 0.02;
      ctx.stroke();
      ctx.lineWidth = size * 0.045;
      ctx.strokeStyle = hero.accent;
      ctx.beginPath();
      ctx.moveTo(-s * 0.6, 0);
      ctx.lineTo(s * 0.95, 0);
      ctx.stroke();
      break;
    }
    case 'sword': {
      ctx.beginPath();
      ctx.moveTo(-s * 0.8, s * 0.8);
      ctx.lineTo(s * 0.75, -s * 0.85);
      ctx.stroke();
      ctx.strokeStyle = hero.accent;
      ctx.lineWidth = size * 0.045;
      ctx.beginPath();
      ctx.moveTo(-s * 0.15, -s * 0.05);
      ctx.lineTo(-s * 0.55, -s * 0.45);
      ctx.stroke();
      break;
    }
    case 'boulder': {
      ctx.beginPath();
      ctx.arc(s * 0.08, -s * 0.1, s * 0.72, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = hero.accent;
      ctx.lineWidth = size * 0.05;
      ctx.beginPath();
      ctx.moveTo(-s * 1.05, s * 0.95);
      ctx.lineTo(s * 1.05, s * 0.35);
      ctx.stroke();
      break;
    }
    case 'aura': {
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.arc(0, 0, s, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = hero.accent;
      ctx.lineWidth = size * 0.06;
      ctx.beginPath();
      ctx.arc(0, s * 0.15, s * 0.75, Math.PI * 1.05, Math.PI * 1.95);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(s * 0.62, s * 0.1);
      ctx.lineTo(s * 0.62, s * 1.0);
      ctx.stroke();
      break;
    }
  }
  ctx.restore();
  return canvas;
}

function drawGodSigil(ctx: CanvasRenderingContext2D, god: GodId, size: number): void {
  const def = GODS[god];
  const c = size / 2;
  const s = size * 0.3;
  ctx.save();
  ctx.translate(c, c);
  ctx.strokeStyle = def.color;
  ctx.fillStyle = def.color;
  ctx.lineWidth = size * 0.07;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  switch (god) {
    case 'zeus':
      ctx.beginPath();
      ctx.moveTo(s * 0.35, -s);
      ctx.lineTo(-s * 0.4, s * 0.05);
      ctx.lineTo(s * 0.1, s * 0.05);
      ctx.lineTo(-s * 0.35, s);
      ctx.stroke();
      break;
    case 'poseidon':
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.lineTo(0, s);
      ctx.moveTo(-s * 0.7, -s * 0.55);
      ctx.lineTo(-s * 0.7, -s * 0.05);
      ctx.moveTo(s * 0.7, -s * 0.55);
      ctx.lineTo(s * 0.7, -s * 0.05);
      ctx.moveTo(-s * 0.7, -s * 0.1);
      ctx.lineTo(s * 0.7, -s * 0.1);
      ctx.stroke();
      break;
    case 'ares':
      ctx.beginPath();
      ctx.moveTo(-s * 0.75, s * 0.75);
      ctx.lineTo(s * 0.7, -s * 0.7);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(s * 0.85, -s * 0.9);
      ctx.lineTo(s * 0.25, -s * 0.75);
      ctx.lineTo(s * 0.7, -s * 0.25);
      ctx.closePath();
      ctx.fill();
      break;
    case 'athena':
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.lineTo(s * 0.8, -s * 0.5);
      ctx.lineTo(s * 0.8, s * 0.35);
      ctx.lineTo(0, s);
      ctx.lineTo(-s * 0.8, s * 0.35);
      ctx.lineTo(-s * 0.8, -s * 0.5);
      ctx.closePath();
      ctx.stroke();
      break;
    case 'aphrodite':
      ctx.beginPath();
      ctx.moveTo(0, s * 0.85);
      ctx.bezierCurveTo(-s * 1.4, -s * 0.15, -s * 0.45, -s * 1.1, 0, -s * 0.35);
      ctx.bezierCurveTo(s * 0.45, -s * 1.1, s * 1.4, -s * 0.15, 0, s * 0.85);
      ctx.fill();
      break;
    case 'hermes':
      ctx.beginPath();
      ctx.moveTo(-s * 0.9, s * 0.2);
      ctx.quadraticCurveTo(0, -s * 0.9, s * 0.9, -s * 0.2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-s * 0.9, s * 0.75);
      ctx.quadraticCurveTo(0, -s * 0.3, s * 0.9, s * 0.35);
      ctx.stroke();
      break;
    case 'hades':
      ctx.beginPath();
      ctx.arc(0, -s * 0.2, s * 0.72, Math.PI, 0);
      ctx.lineTo(s * 0.72, s * 0.35);
      ctx.lineTo(-s * 0.72, s * 0.35);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#0a0918';
      ctx.beginPath();
      ctx.arc(-s * 0.3, -s * 0.2, s * 0.2, 0, TAU);
      ctx.arc(s * 0.3, -s * 0.2, s * 0.2, 0, TAU);
      ctx.fill();
      break;
    case 'gaia':
      ctx.beginPath();
      ctx.moveTo(0, s);
      ctx.quadraticCurveTo(-s, 0, 0, -s);
      ctx.quadraticCurveTo(s, 0, 0, s);
      ctx.fill();
      ctx.strokeStyle = '#0a0918';
      ctx.lineWidth = size * 0.04;
      ctx.beginPath();
      ctx.moveTo(0, s * 0.8);
      ctx.lineTo(0, -s * 0.8);
      ctx.stroke();
      break;
  }
  ctx.restore();
}

function drawWeaponGlyph(ctx: CanvasRenderingContext2D, id: string, size: number): void {
  const c = size / 2;
  const s = size * 0.3;
  ctx.save();
  ctx.translate(c, c);
  ctx.strokeStyle = '#e8b64c';
  ctx.fillStyle = '#e8b64c';
  ctx.lineWidth = size * 0.06;
  ctx.lineCap = 'round';

  const arrow = (dy: number, len: number) => {
    ctx.beginPath();
    ctx.moveTo(-len, dy);
    ctx.lineTo(len, dy);
    ctx.moveTo(len, dy);
    ctx.lineTo(len - size * 0.13, dy - size * 0.09);
    ctx.moveTo(len, dy);
    ctx.lineTo(len - size * 0.13, dy + size * 0.09);
    ctx.stroke();
  };

  switch (id) {
    case 'atk_count':
      arrow(-s * 0.7, s);
      arrow(0, s);
      arrow(s * 0.7, s);
      break;
    case 'atk_pierce':
      arrow(0, s);
      ctx.strokeStyle = '#9aa4b2';
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.8);
      ctx.lineTo(0, s * 0.8);
      ctx.stroke();
      break;
    case 'atk_homing':
      ctx.beginPath();
      ctx.moveTo(-s, s * 0.7);
      ctx.quadraticCurveTo(s * 0.2, s * 0.5, s * 0.75, -s * 0.7);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(s * 0.75, -s * 0.75, size * 0.07, 0, TAU);
      ctx.fill();
      break;
    case 'atk_speed':
      ctx.beginPath();
      ctx.moveTo(s * 0.3, -s);
      ctx.lineTo(-s * 0.35, s * 0.05);
      ctx.lineTo(s * 0.05, s * 0.05);
      ctx.lineTo(-s * 0.3, s);
      ctx.stroke();
      break;
    case 'atk_range':
      arrow(0, s * 1.05);
      break;
    case 'atk_size':
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.9, 0, TAU);
      ctx.stroke();
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.5, 0, TAU);
      ctx.stroke();
      break;
    case 'atk_crit':
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.85, 0, TAU);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.28, 0, TAU);
      ctx.fill();
      break;
    case 'atk_infuse':
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.85, 0, TAU);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(s * 0.28, -s * 0.75);
      ctx.lineTo(-s * 0.3, s * 0.05);
      ctx.lineTo(s * 0.05, s * 0.05);
      ctx.lineTo(-s * 0.25, s * 0.75);
      ctx.stroke();
      break;
    default:
      ctx.beginPath();
      ctx.moveTo(-s * 0.8, s * 0.8);
      ctx.lineTo(s * 0.8, -s * 0.8);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(s * 0.9, -s * 0.95);
      ctx.lineTo(s * 0.3, -s * 0.8);
      ctx.lineTo(s * 0.75, -s * 0.3);
      ctx.closePath();
      ctx.fill();
  }
  ctx.restore();
}

function drawPerkGlyph(ctx: CanvasRenderingContext2D, id: string, size: number): void {
  const c = size / 2;
  const s = size * 0.3;
  ctx.save();
  ctx.translate(c, c);
  ctx.strokeStyle = '#b8d0a0';
  ctx.fillStyle = '#b8d0a0';
  ctx.lineWidth = size * 0.06;
  ctx.lineCap = 'round';

  switch (id) {
    case 'perk_hp':
    case 'perk_regen':
      ctx.fillStyle = '#e0607a';
      ctx.beginPath();
      ctx.arc(0, s * 0.1, s * 0.8, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = '#7fa055';
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.7);
      ctx.lineTo(s * 0.35, -s * 1.1);
      ctx.stroke();
      break;
    case 'perk_speed':
      ctx.strokeStyle = '#66d69b';
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(-s * 0.9, i * s * 0.5);
        ctx.lineTo(s * 0.7, i * s * 0.5);
        ctx.stroke();
      }
      break;
    case 'perk_armor':
      ctx.strokeStyle = '#c9b98f';
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.lineTo(s * 0.8, -s * 0.45);
      ctx.lineTo(s * 0.55, s * 0.85);
      ctx.lineTo(-s * 0.55, s * 0.85);
      ctx.lineTo(-s * 0.8, -s * 0.45);
      ctx.closePath();
      ctx.stroke();
      break;
    case 'perk_greed':
      ctx.fillStyle = '#f0c04a';
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.8, 0, TAU);
      ctx.fill();
      break;
    case 'perk_magnet':
      ctx.strokeStyle = '#e8b64c';
      ctx.lineWidth = size * 0.12;
      ctx.beginPath();
      ctx.arc(0, s * 0.1, s * 0.7, Math.PI, 0);
      ctx.stroke();
      break;
    case 'perk_luck':
      ctx.strokeStyle = '#d5c2ff';
      ctx.beginPath();
      ctx.moveTo(-s, s * 0.7);
      ctx.quadraticCurveTo(0, -s * 1.2, s, s * 0.7);
      ctx.stroke();
      break;
    default:
      ctx.strokeStyle = '#e8b64c';
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.8, 0, TAU);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.3, 0, TAU);
      ctx.fill();
  }
  ctx.restore();
}

export function cardIcon(card: CardDef, size = 46): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(size);
  const color = card.god ? GODS[card.god].color : card.kind === 'weapon' ? '#e8b64c' : '#b8d0a0';
  backdrop(ctx, size, color);
  if (card.god) drawGodSigil(ctx, card.god, size);
  else if (card.kind === 'weapon') drawWeaponGlyph(ctx, card.id, size);
  else drawPerkGlyph(ctx, card.id, size);
  return canvas;
}

export function godPip(god: GodId, size = 26): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(size);
  backdrop(ctx, size, GODS[god].color);
  drawGodSigil(ctx, god, size);
  return canvas;
}
