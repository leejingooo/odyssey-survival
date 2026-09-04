import { clamp, damp } from './math';

export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

/**
 * Canvas wrapper: handles DPR-aware sizing, the world camera, screen shake and
 * the parallax backdrop. Entities draw themselves with the world transform
 * already applied, so their draw code is in plain world units.
 */
export class Renderer {
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;

  width = 0;
  height = 0;
  dpr = 1;

  camera: Camera = { x: 0, y: 0, zoom: 1 };
  reducedMotion = false;

  private shake = 0;
  private shakeX = 0;
  private shakeY = 0;
  private flashColor = '';
  private flashAlpha = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('2D canvas context unavailable');
    this.ctx = ctx;
    this.resize();
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('orientationchange', () => this.resize());
  }

  resize(): void {
    // Cap DPR: a survivors game draws hundreds of sprites, and 3x on a phone
    // costs far more than it shows.
    this.dpr = clamp(window.devicePixelRatio || 1, 1, 2);
    this.width = this.canvas.clientWidth || window.innerWidth;
    this.height = this.canvas.clientHeight || window.innerHeight;
    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);

    // Keep a consistent amount of world visible regardless of screen size:
    // roughly 400 world units across the short edge.
    const shortEdge = Math.min(this.width, this.height);
    this.camera.zoom = clamp(shortEdge / 400, 0.6, 1.8);
  }

  addShake(amount: number): void {
    if (this.reducedMotion) return;
    this.shake = Math.min(this.shake + amount, 26);
  }

  flash(color: string, alpha = 0.35): void {
    this.flashColor = color;
    this.flashAlpha = Math.max(this.flashAlpha, this.reducedMotion ? Math.min(alpha, 0.06) : alpha);
  }

  update(dt: number): void {
    this.shake = damp(this.shake, 0, 9, dt);
    this.shakeX = (Math.random() * 2 - 1) * this.shake;
    this.shakeY = (Math.random() * 2 - 1) * this.shake;
    this.flashAlpha = damp(this.flashAlpha, 0, 8, dt);
  }

  /** Smoothly track a target position. */
  follow(x: number, y: number, dt: number): void {
    this.camera.x = damp(this.camera.x, x, 9, dt);
    this.camera.y = damp(this.camera.y, y, 9, dt);
  }

  /** Half-extents of the visible world rectangle. */
  viewHalfWidth(): number {
    return this.width / 2 / this.camera.zoom;
  }

  viewHalfHeight(): number {
    return this.height / 2 / this.camera.zoom;
  }

  /** Radius that certainly covers the screen — used for culling and spawn rings. */
  viewRadius(): number {
    return Math.hypot(this.viewHalfWidth(), this.viewHalfHeight());
  }

  beginWorld(): void {
    const { ctx } = this;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.save();
    ctx.translate(this.width / 2 + this.shakeX, this.height / 2 + this.shakeY);
    ctx.scale(this.camera.zoom, this.camera.zoom);
    ctx.translate(-this.camera.x, -this.camera.y);
  }

  endWorld(): void {
    this.ctx.restore();
    if (this.flashAlpha > 0.01) {
      const { ctx } = this;
      ctx.save();
      ctx.globalAlpha = this.flashAlpha;
      ctx.fillStyle = this.flashColor || '#ffffff';
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.restore();
    }
  }

  /**
   * Backdrop: a dark Aegean gradient plus two parallax layers of drifting motes,
   * drawn in screen space so it costs the same no matter how far the hero runs.
   */
  drawBackground(time: number, tint: string): void {
    const { ctx } = this;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    const grad = ctx.createRadialGradient(
      this.width / 2,
      this.height * 0.35,
      10,
      this.width / 2,
      this.height * 0.5,
      Math.max(this.width, this.height) * 0.85,
    );
    grad.addColorStop(0, tint);
    grad.addColorStop(1, '#05040c');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height);

    this.drawMotes(140, 0.35, 'rgba(120,160,220,0.16)', time);
    this.drawMotes(70, 0.7, 'rgba(232,182,76,0.10)', time);
  }

  private drawMotes(count: number, parallax: number, color: string, time: number): void {
    const { ctx } = this;
    const w = this.width + 40;
    const h = this.height + 40;
    const ox = -this.camera.x * parallax;
    const oy = -this.camera.y * parallax + time * 6;
    ctx.fillStyle = color;
    for (let i = 0; i < count; i++) {
      // Deterministic scatter, wrapped into screen space: one rect per mote,
      // so the backdrop cost stays flat as the world scrolls.
      const baseX = (((i * 7919) % 9973) / 9973) * w;
      const baseY = (((i * 104729) % 9967) / 9967) * h;
      const size = 1 + ((i * 31) % 5) * 0.4;
      const x = ((((baseX + ox) % w) + w) % w) - 20;
      const y = ((((baseY + oy) % h) + h) % h) - 20;
      ctx.fillRect(x, y, size, size);
    }
  }
}
