import type { Enemy } from './entities';

/**
 * Uniform grid rebuilt every simulation step. With a few hundred enemies this
 * beats any tree: insertion is O(n) with no allocation churn, and every query
 * we do is a small radius around the player or a projectile.
 */
export class SpatialHash {
  private cells = new Map<number, Enemy[]>();
  private readonly cellSize: number;

  constructor(cellSize = 56) {
    this.cellSize = cellSize;
  }

  private key(cx: number, cy: number): number {
    // Pack two 16-bit signed cell coords into one number.
    return ((cx + 32768) << 16) | (cy + 32768);
  }

  rebuild(items: readonly Enemy[]): void {
    this.cells.clear();
    for (const item of items) {
      if (item.dead) continue;
      const cx = Math.floor(item.x / this.cellSize);
      const cy = Math.floor(item.y / this.cellSize);
      const k = this.key(cx, cy);
      const bucket = this.cells.get(k);
      if (bucket) bucket.push(item);
      else this.cells.set(k, [item]);
    }
  }

  /** Collect every enemy whose cell overlaps the circle; callers do the exact test. */
  query(x: number, y: number, radius: number, out: Enemy[] = []): Enemy[] {
    out.length = 0;
    const minX = Math.floor((x - radius) / this.cellSize);
    const maxX = Math.floor((x + radius) / this.cellSize);
    const minY = Math.floor((y - radius) / this.cellSize);
    const maxY = Math.floor((y + radius) / this.cellSize);
    for (let cx = minX; cx <= maxX; cx++) {
      for (let cy = minY; cy <= maxY; cy++) {
        const bucket = this.cells.get(this.key(cx, cy));
        if (!bucket) continue;
        for (const item of bucket) out.push(item);
      }
    }
    return out;
  }
}
