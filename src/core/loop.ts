const STEP = 1 / 60;
const MAX_STEPS_PER_FRAME = 5;

/**
 * Fixed-timestep simulation with a variable render. Keeping the sim at a fixed
 * 60Hz matters here: hit detection, DoT ticks and cooldowns all assume a stable
 * step, and phones deliver wildly uneven frame times.
 */
export class GameLoop {
  private accumulator = 0;
  private lastTime = 0;
  private rafId = 0;
  private running = false;

  constructor(
    private readonly step: (dt: number) => void,
    private readonly render: (alpha: number, frameDt: number) => void,
  ) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.accumulator = 0;
    const frame = (now: number) => {
      if (!this.running) return;
      this.rafId = requestAnimationFrame(frame);
      // Clamp: a backgrounded tab can hand us a multi-second delta.
      const frameDt = Math.min((now - this.lastTime) / 1000, 0.25);
      this.lastTime = now;
      this.accumulator += frameDt;

      let steps = 0;
      while (this.accumulator >= STEP && steps < MAX_STEPS_PER_FRAME) {
        this.step(STEP);
        this.accumulator -= STEP;
        steps++;
      }
      if (steps === MAX_STEPS_PER_FRAME) this.accumulator = 0;

      this.render(this.accumulator / STEP, frameDt);
    };
    this.rafId = requestAnimationFrame(frame);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }

  get isRunning(): boolean {
    return this.running;
  }
}

export const FIXED_STEP = STEP;
