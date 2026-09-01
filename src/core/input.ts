import { clamp } from './math';

const DEAD_ZONE = 6;
const MAX_RADIUS = 64;

/**
 * "Drag anywhere" stick. The first touch that lands on the play field becomes
 * the stick origin; dragging away from that point steers the hero. The origin
 * trails the finger once it passes MAX_RADIUS so long drags never clamp out.
 * Keyboard input is a desktop convenience and feeds the same vector.
 */
export class DragInput {
  /** Unit-ish direction, length 0..1. */
  x = 0;
  y = 0;
  active = false;

  originX = 0;
  originY = 0;
  pointerX = 0;
  pointerY = 0;

  private pointerId: number | null = null;
  private keys = new Set<string>();
  private detachers: (() => void)[] = [];
  private enabled = true;

  attach(target: HTMLElement): void {
    const down = (e: PointerEvent) => {
      if (!this.enabled || this.pointerId !== null) return;
      this.pointerId = e.pointerId;
      this.active = true;
      this.originX = this.pointerX = e.clientX;
      this.originY = this.pointerY = e.clientY;
      this.x = 0;
      this.y = 0;
      target.setPointerCapture?.(e.pointerId);
      e.preventDefault();
    };

    const move = (e: PointerEvent) => {
      if (e.pointerId !== this.pointerId) return;
      this.pointerX = e.clientX;
      this.pointerY = e.clientY;
      let dx = this.pointerX - this.originX;
      let dy = this.pointerY - this.originY;
      const len = Math.hypot(dx, dy);
      if (len > MAX_RADIUS) {
        // Drag the origin along behind the finger.
        const pull = len - MAX_RADIUS;
        this.originX += (dx / len) * pull;
        this.originY += (dy / len) * pull;
        dx = (dx / len) * MAX_RADIUS;
        dy = (dy / len) * MAX_RADIUS;
      }
      const mag = Math.hypot(dx, dy);
      if (mag < DEAD_ZONE) {
        this.x = 0;
        this.y = 0;
        return;
      }
      const intensity = clamp((mag - DEAD_ZONE) / (MAX_RADIUS - DEAD_ZONE), 0, 1);
      this.x = (dx / mag) * intensity;
      this.y = (dy / mag) * intensity;
      e.preventDefault();
    };

    const up = (e: PointerEvent) => {
      if (e.pointerId !== this.pointerId) return;
      this.release();
    };

    const keyDown = (e: KeyboardEvent) => {
      if (!this.enabled) return;
      this.keys.add(e.key.toLowerCase());
      this.applyKeys();
    };
    const keyUp = (e: KeyboardEvent) => {
      this.keys.delete(e.key.toLowerCase());
      this.applyKeys();
    };

    target.addEventListener('pointerdown', down);
    target.addEventListener('pointermove', move);
    target.addEventListener('pointerup', up);
    target.addEventListener('pointercancel', up);
    window.addEventListener('blur', () => this.release());
    window.addEventListener('keydown', keyDown);
    window.addEventListener('keyup', keyUp);

    this.detachers.push(() => {
      target.removeEventListener('pointerdown', down);
      target.removeEventListener('pointermove', move);
      target.removeEventListener('pointerup', up);
      target.removeEventListener('pointercancel', up);
      window.removeEventListener('keydown', keyDown);
      window.removeEventListener('keyup', keyUp);
    });
  }

  private applyKeys(): void {
    const k = this.keys;
    const left = k.has('arrowleft') || k.has('a');
    const right = k.has('arrowright') || k.has('d');
    const up = k.has('arrowup') || k.has('w');
    const down = k.has('arrowdown') || k.has('s');
    const dx = (right ? 1 : 0) - (left ? 1 : 0);
    const dy = (down ? 1 : 0) - (up ? 1 : 0);
    if (dx === 0 && dy === 0) {
      if (this.pointerId === null) {
        this.x = 0;
        this.y = 0;
      }
      return;
    }
    const len = Math.hypot(dx, dy);
    this.x = dx / len;
    this.y = dy / len;
  }

  /** Suspend steering while a modal (card pick, pause) is up. */
  setEnabled(on: boolean): void {
    this.enabled = on;
    if (!on) this.release();
  }

  release(): void {
    this.pointerId = null;
    this.active = false;
    this.x = 0;
    this.y = 0;
    this.keys.clear();
  }

  detach(): void {
    for (const off of this.detachers) off();
    this.detachers = [];
  }
}
