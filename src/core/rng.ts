/**
 * Small deterministic PRNG (mulberry32). Every run seeds its own instance so a
 * run can be replayed or shared by seed, and so UI randomness never disturbs
 * the simulation stream.
 */
export class Rng {
  private state: number;

  constructor(seed = (Math.random() * 0xffffffff) >>> 0) {
    this.state = seed >>> 0;
  }

  /** float in [0, 1) */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** float in [min, max) */
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /** integer in [min, max] */
  int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  chance(probability: number): boolean {
    return this.next() < probability;
  }

  angle(): number {
    return this.next() * Math.PI * 2;
  }

  pick<T>(items: readonly T[]): T {
    return items[Math.floor(this.next() * items.length)];
  }

  /** Weighted pick. `weightOf` must return a non-negative number. */
  weighted<T>(items: readonly T[], weightOf: (item: T) => number): T | undefined {
    let total = 0;
    for (const item of items) total += Math.max(0, weightOf(item));
    if (total <= 0) return undefined;
    let roll = this.next() * total;
    for (const item of items) {
      roll -= Math.max(0, weightOf(item));
      if (roll <= 0) return item;
    }
    return items[items.length - 1];
  }

  /** Fisher-Yates on a copy. */
  shuffled<T>(items: readonly T[]): T[] {
    const out = items.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  /** Draw up to `count` distinct weighted items without replacement. */
  sampleWeighted<T>(items: readonly T[], count: number, weightOf: (item: T) => number): T[] {
    const pool = items.slice();
    const out: T[] = [];
    while (out.length < count && pool.length > 0) {
      const chosen = this.weighted(pool, weightOf);
      if (chosen === undefined) break;
      out.push(chosen);
      pool.splice(pool.indexOf(chosen), 1);
    }
    return out;
  }
}
