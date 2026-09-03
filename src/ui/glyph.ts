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

  // Painted bust: rim light, cloak, face and a hero-specific crown/hood.
  const halo = ctx.createRadialGradient(0, -s * 0.2, 0, 0, 0, s * 1.55);
  halo.addColorStop(0, `${hero.color}88`);
  halo.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(0, 0, s * 1.55, 0, TAU);
  ctx.fill();
  ctx.fillStyle = `${hero.color}cc`;
  ctx.strokeStyle = hero.accent;
  ctx.lineWidth = size * 0.025;
  ctx.beginPath();
  ctx.moveTo(-s * 0.95, s * 1.25);
  ctx.quadraticCurveTo(-s * 0.7, s * 0.25, 0, s * 0.2);
  ctx.quadraticCurveTo(s * 0.7, s * 0.25, s * 0.95, s * 1.25);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = hero.id === 'thanatos' ? '#171326' : '#d6ad82';
  ctx.beginPath();
  ctx.ellipse(0, -s * 0.3, s * 0.42, s * 0.53, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = hero.id === 'thanatos' ? hero.accent : '#21182a';
  ctx.beginPath();
  ctx.arc(-s * 0.15, -s * 0.34, s * 0.045, 0, TAU);
  ctx.arc(s * 0.15, -s * 0.34, s * 0.045, 0, TAU);
  ctx.fill();

  if (hero.id === 'achilles') {
    ctx.fillStyle = '#b7893e';
    ctx.fillRect(-s * 0.5, -s * 0.72, s, s * 0.2);
    ctx.fillStyle = '#b6323d';
    ctx.beginPath();
    ctx.moveTo(-s * 0.08, -s * 0.7);
    ctx.quadraticCurveTo(0, -s * 1.4, s * 0.48, -s * 1.05);
    ctx.lineTo(s * 0.18, -s * 0.62);
    ctx.fill();
  } else if (hero.id === 'odysseus') {
    ctx.fillStyle = '#315d86';
    ctx.beginPath();
    ctx.arc(0, -s * 0.38, s * 0.55, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = hero.accent;
    ctx.beginPath();
    ctx.arc(0, s * 0.22, s * 0.1, 0, TAU);
    ctx.fill();
  } else if (hero.id === 'sisyphus') {
    ctx.strokeStyle = '#e9e1d3';
    ctx.lineWidth = s * 0.12;
    ctx.beginPath();
    ctx.arc(0, -s * 0.48, s * 0.48, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
  } else {
    ctx.strokeStyle = hero.accent;
    ctx.lineWidth = s * 0.13;
    ctx.beginPath();
    ctx.arc(0, -s * 0.3, s * 0.62, Math.PI * 0.85, Math.PI * 2.15);
    ctx.stroke();
  }

  ctx.globalAlpha = 0.82;

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

/** A compact Aegean-night title painting, rendered sharply at any DPR. */
export function titleArtwork(): HTMLCanvasElement {
  const width = 360;
  const height = 190;
  const { canvas, ctx } = makeCanvas(width);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);
  canvas.style.width = '100%';
  canvas.style.height = 'auto';
  canvas.className = 'title-art';
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, '#171533');
  sky.addColorStop(0.62, '#10233c');
  sky.addColorStop(1, '#07101c');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#f3d98f';
  ctx.beginPath();
  ctx.arc(286, 42, 22, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#171533';
  ctx.beginPath();
  ctx.arc(296, 35, 22, 0, TAU);
  ctx.fill();
  for (let i = 0; i < 24; i++) {
    ctx.globalAlpha = 0.25 + ((i * 17) % 50) / 100;
    ctx.fillStyle = i % 5 ? '#b8d8ee' : '#e8b64c';
    ctx.fillRect((i * 83) % width, 12 + ((i * 47) % 92), i % 4 ? 1 : 2, i % 4 ? 1 : 2);
  }
  ctx.globalAlpha = 1;
  // Layered sea and the black Ithacan galley.
  for (let band = 0; band < 4; band++) {
    ctx.fillStyle = ['#173754', '#12415c', '#0d304a', '#092139'][band];
    ctx.beginPath();
    ctx.moveTo(0, 120 + band * 16);
    for (let x = 0; x <= width; x += 24) {
      ctx.quadraticCurveTo(
        x + 12,
        112 + band * 16 + ((x / 24 + band) % 2) * 9,
        x + 24,
        120 + band * 16,
      );
    }
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.fill();
  }
  ctx.fillStyle = '#080813';
  ctx.beginPath();
  ctx.moveTo(94, 140);
  ctx.quadraticCurveTo(169, 169, 245, 139);
  ctx.lineTo(229, 158);
  ctx.quadraticCurveTo(160, 181, 105, 157);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(165, 72, 4, 77);
  ctx.fillStyle = '#d7c8a2';
  ctx.beginPath();
  ctx.moveTo(170, 77);
  ctx.lineTo(221, 126);
  ctx.lineTo(170, 130);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#e8b64c';
  ctx.globalAlpha = 0.55;
  ctx.strokeRect(5, 5, width - 10, height - 10);
  return canvas;
}
