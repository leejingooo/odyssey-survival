import { TAU } from '../core/math';
import type { HeroDef } from '../data/heroes';

/**
 * Hero portraits are drawn at runtime onto a small canvas — no sprite sheets,
 * no art pipeline, and a build that stays tiny. Gods and cards use emoji
 * emblems instead, which read better at HUD size than a traced sigil does.
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
