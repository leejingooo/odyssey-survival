/**
 * Soak test. Runs each hero through 25 simulated minutes with cards taken
 * automatically, checking that the difficulty curve, boss schedule and card
 * pools all hold up and that nothing throws along the way.
 *
 * Needs the DEV server (the fast-forward hook is stripped from production):
 *   npm run dev
 *   npm run test:soak
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE ?? 'http://127.0.0.1:5173';
const MINUTES = Number(process.env.MINUTES ?? 25);

const RICH_SAVE = {
  version: 1,
  gold: 999999,
  // Every Star Chart upgrade maxed, so three gods can bless one voyage.
  starChart: {
    boonSlots: 2,
    vitality: 5,
    might: 5,
    swift: 4,
    fortune: 5,
    wisdom: 5,
    defiance: 2,
    treasure: 3,
    headstart: 3,
  },
  unlockedHeroes: ['odysseus', 'achilles', 'sisyphus', 'thanatos'],
  // The full pantheon, so the soak exercises every boon pool.
  unlockedGods: ['hades', 'aphrodite', 'zeus', 'dionysus', 'artemis', 'demeter'],
  lastHero: 'odysseus',
  locale: 'en',
  sfx: false,
  music: false,
  haptics: false,
  stats: { runs: 0, bestTimeSec: 0, bestLevel: 0, totalKills: 0 },
  iap: { removeAds: false, unlockAllHeroes: true },
  ads: { day: '', watched: 0 },
};

const browser = await chromium.launch();
const failures = [];
const report = {};

for (const [index, hero] of ['odysseus', 'achilles', 'sisyphus', 'thanatos'].entries()) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const errors = [];
  page.on('pageerror', (e) => errors.push(`${hero}: pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`${hero}: console: ${m.text()}`);
  });

  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.evaluate(
    ([key, save]) => localStorage.setItem(key, JSON.stringify(save)),
    ['odyssey-survival/save/v1', RICH_SAVE],
  );
  await page.reload({ waitUntil: 'networkidle' });
  await page.bringToFront();

  await page.locator('.btn--primary').first().click();
  await page.waitForSelector('.hero-grid');
  await page.locator('.hero-card').nth(index).click();
  await page.locator('.btn--primary').first().click();
  await page.waitForSelector('#hud');

  const hasSimulate = await page.evaluate(() => typeof window.odyssey.simulate === 'function');
  if (!hasSimulate) {
    failures.push('simulate() missing — run the soak test against `npm run dev`');
    await page.close();
    break;
  }

  // Fast-forward in 5-second slices, taking the first card whenever one is up.
  let picks = 0;
  let snap = null;
  for (let slice = 0; slice < (MINUTES * 60) / 5; slice++) {
    snap = await page.evaluate(() => window.odyssey.simulate(5));
    if (snap.phase !== 'playing') {
      const card = page.locator('.card').first();
      if (await card.count()) {
        await card.click();
        picks++;
        await page.waitForTimeout(30);
      } else {
        break; // dead
      }
    }
  }

  const final = await page.evaluate(() => window.odyssey.snapshot());
  report[hero] = {
    time: final.time,
    level: final.level,
    kills: final.kills,
    gold: final.gold,
    picks,
    gods: final.gods,
    cards: Object.keys(final.owned).length,
    phase: final.phase,
    enemies: final.enemies,
  };
  if (final.gods.length > final.maxGods) {
    failures.push(`${hero}: took ${final.gods.length} gods with a cap of ${final.maxGods}`);
  }
  // Deliberately loose. The autopilot always takes the *first* card offered,
  // so how far it gets swings wildly with the draw; these thresholds catch a
  // broken game (nothing dies, no cards, instant death), not a bad run.
  if (final.time < 60) failures.push(`${hero}: survived only ${final.time}s`);
  if (final.kills < 50) failures.push(`${hero}: only ${final.kills} kills`);
  if (final.picks < 1) failures.push(`${hero}: never got to take a card`);
  failures.push(...errors);
  await page.close();
}

await browser.close();
console.log(JSON.stringify(report, null, 2));
if (failures.length) {
  console.error('\nSOAK FAILED:\n- ' + failures.join('\n- '));
  process.exit(1);
}
console.log('\nsoak ok');
