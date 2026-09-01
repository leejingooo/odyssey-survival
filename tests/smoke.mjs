/**
 * End-to-end smoke test. Boots the built game in headless Chromium at phone
 * size, plays a real run with drag input, breaks a treasure chest, takes the
 * cards it offers, then checks the pause menu still opens.
 *
 *   npm run build && npm run preview   # in one terminal
 *   npm run test:smoke                 # in another
 *
 * Set BASE to point at a different server, OUT to collect screenshots.
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE ?? 'http://127.0.0.1:4173';
const OUT = process.env.OUT ?? null;
const STEPS = Number(process.env.STEPS ?? 260);

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  hasTouch: true,
  isMobile: true,
});

const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(`console: ${m.text()}`);
});

const shot = (name) => (OUT ? page.screenshot({ path: `${OUT}/${name}.png` }) : Promise.resolve());
const snapshot = () => page.evaluate(() => window.odyssey.snapshot());

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.bringToFront();
await page.waitForTimeout(300);
await shot('01-title');

await page.locator('.btn--primary').first().click();
await page.waitForSelector('.hero-grid', { timeout: 5000 });
await shot('02-heroes');

await page.locator('.btn--primary').first().click();
await page.waitForSelector('#hud', { timeout: 5000 });

// Drag from the middle of the screen; steer at a chest whenever one exists.
const centre = { x: 195, y: 520 };
await page.mouse.move(centre.x, centre.y);
await page.mouse.down();

let picks = 0;
let heading = 0;
for (let step = 0; step < STEPS; step++) {
  const snap = await snapshot();
  if (snap?.nearestChest) heading = Math.atan2(snap.nearestChest.dy, snap.nearestChest.dx);
  else if (step % 8 === 0) heading += 1.1;
  await page.mouse.move(centre.x + Math.cos(heading) * 55, centre.y + Math.sin(heading) * 55);
  await page.waitForTimeout(80);

  const card = page.locator('.card').first();
  if (await card.count()) {
    await page.mouse.up();
    if (picks === 0) await shot('03-card');
    await card.click();
    picks++;
    await page.mouse.move(centre.x, centre.y);
    await page.mouse.down();
  }
  if (step === 90) await shot('04-play');
}
await page.mouse.up();

const state = await snapshot();
await shot('05-late');

await page.locator('.hud-btn').click();
await page.waitForTimeout(250);
const paused = (await page.locator('.screen--overlay').count()) === 1;
await shot('06-pause');
await browser.close();

const failures = [];
if (errors.length) failures.push(...errors);
if (!state?.running) failures.push('run did not start');
if ((state?.kills ?? 0) <= 0) failures.push('no enemies were killed');
if (picks === 0) failures.push('no card was ever offered');
if (!paused) failures.push('pause menu did not open');

console.log(JSON.stringify({ picks, paused, state }, null, 2));
if (failures.length) {
  console.error('\nSMOKE FAILED:\n- ' + failures.join('\n- '));
  process.exit(1);
}
console.log('\nsmoke ok');
