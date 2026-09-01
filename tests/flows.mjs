/**
 * Flow test. Walks the parts of the game the smoke test does not reach: every
 * hero actually fighting, dying into the results screen, spending a Star Chart
 * revive, buying a Star Chart rank, unlocking a god in the Pantheon, and
 * switching language.
 *
 *   npm run build && npm run preview   # in one terminal
 *   npm run test:flows                 # in another
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE ?? 'http://127.0.0.1:4173';
const OUT = process.env.OUT ?? null;
const SAVE_KEY = 'odyssey-survival/save/v1';

const RICH = {
  version: 1,
  gold: 100000,
  starChart: {},
  unlockedHeroes: ['odysseus', 'achilles', 'sisyphus', 'thanatos'],
  unlockedGods: [],
  lastHero: 'odysseus',
  locale: 'en',
  sfx: false,
  music: false,
  haptics: false,
  stats: { runs: 3, bestTimeSec: 120, bestLevel: 7, totalKills: 200 },
  iap: { removeAds: false, unlockAllHeroes: true },
  ads: { day: '', watched: 0 },
};

const browser = await chromium.launch();
const errors = [];
const results = {};
const failures = [];

async function newPage(save) {
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console: ${m.text()}`);
  });
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.evaluate(
    ([key, value]) => localStorage.setItem(key, JSON.stringify(value)),
    [SAVE_KEY, save],
  );
  await page.reload({ waitUntil: 'networkidle' });
  // Backgrounded pages get their animation frames throttled, which stalls the
  // simulation; every page in this file must be the visible one.
  await page.bringToFront();
  return page;
}

async function openRun(save, heroIndex = 0) {
  const page = await newPage(save);
  await page.locator('.btn--primary').first().click();
  await page.waitForSelector('.hero-grid');
  if (heroIndex > 0) await page.locator('.hero-card').nth(heroIndex).click();
  await page.locator('.btn--primary').first().click();
  await page.waitForSelector('#hud');
  return page;
}

const snapshot = (page) => page.evaluate(() => window.odyssey.snapshot());

// ---- 1. every hero can fight ----------------------------------------------
for (const [index, hero] of ['odysseus', 'achilles', 'sisyphus', 'thanatos'].entries()) {
  const page = await openRun(RICH, index);
  await page.mouse.move(195, 520);
  await page.mouse.down();
  let heading = 0;
  for (let step = 0; step < 110; step++) {
    const snap = await snapshot(page);
    if (snap?.nearestChest) heading = Math.atan2(snap.nearestChest.dy, snap.nearestChest.dx);
    else if (step % 7 === 0) heading += 1.3;
    await page.mouse.move(195 + Math.cos(heading) * 55, 520 + Math.sin(heading) * 55);
    await page.waitForTimeout(80);
    const card = page.locator('.card').first();
    if (await card.count()) {
      await page.mouse.up();
      await card.click();
      await page.mouse.move(195, 520);
      await page.mouse.down();
    }
  }
  await page.mouse.up();
  const snap = await snapshot(page);
  results[hero] = { kills: snap.kills, level: snap.level, time: snap.time };
  if (snap.kills <= 0) failures.push(`${hero}: killed nothing`);
  if (OUT) await page.screenshot({ path: `${OUT}/hero-${hero}.png` });
  await page.close();
}

// ---- 2. death -> results ---------------------------------------------------
async function playUntilDead(page) {
  for (let i = 0; i < 90; i++) {
    await page.waitForTimeout(600);
    const snap = await snapshot(page);
    if (snap.phase === 'dead') return snap;
  }
  return null;
}

{
  // Stand perfectly still and let the horde do its work.
  const page = await openRun(RICH);
  const dead = await playUntilDead(page);
  results.death = { died: dead !== null, time: dead?.time };
  if (!dead) failures.push('standing still never killed the player');
  else {
    if (OUT) await page.screenshot({ path: `${OUT}/death.png` });
    await page.locator('.screen--overlay .btn').last().click();
    await page.waitForSelector('.result-grid', { timeout: 5000 });
    results.death.cells = await page.locator('.result-cell__value').allInnerTexts();
    results.death.bankedGold = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)).gold,
      SAVE_KEY,
    );
    if (results.death.bankedGold < RICH.gold) failures.push('run gold was not banked');
    if (OUT) await page.screenshot({ path: `${OUT}/results.png` });
  }
  await page.close();
}

// ---- 3. a Star Chart revive puts you back on your feet ---------------------
{
  const page = await openRun({ ...RICH, starChart: { defiance: 1 } });
  const dead = await playUntilDead(page);
  results.revive = { died: dead !== null };
  if (!dead) failures.push('revive case: player never died');
  else {
    await page.locator('.screen--overlay .btn--primary').click();
    await page.waitForTimeout(600);
    const snap = await snapshot(page);
    results.revive.phase = snap.phase;
    results.revive.hp = snap.hp;
    if (snap.phase === 'dead') failures.push('revive did not resume the run');
  }
  await page.close();
}

// ---- 4. menus: star chart, pantheon, language ------------------------------
{
  const page = await newPage(RICH);
  await page
    .locator('.btn')
    .filter({ hasText: /Star Chart/ })
    .click();
  await page.waitForSelector('.row-list');
  const pipsBefore = await page.locator('.pip.is-on').count();
  await page.locator('.row .btn').nth(1).click();
  await page.waitForTimeout(200);
  results.starChart = { pipsBefore, pipsAfter: await page.locator('.pip.is-on').count() };
  if (results.starChart.pipsAfter <= pipsBefore) failures.push('star chart rank was not bought');
  if (OUT) await page.screenshot({ path: `${OUT}/chart.png` });

  await page.locator('.btn--ghost').first().click();
  await page
    .locator('.btn')
    .filter({ hasText: /Pantheon/ })
    .click();
  await page.waitForSelector('.god-row');
  const lockedBefore = await page.locator('.god-row.is-locked').count();
  await page.locator('.god-row.is-locked .btn').first().click();
  await page.waitForTimeout(250);
  results.pantheon = {
    lockedBefore,
    lockedAfter: await page.locator('.god-row.is-locked').count(),
    unlockedGods: await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)).unlockedGods,
      SAVE_KEY,
    ),
  };
  if (results.pantheon.lockedAfter >= lockedBefore) failures.push('god was not unlocked');
  if (OUT) await page.screenshot({ path: `${OUT}/pantheon.png` });

  await page.locator('.btn--ghost').first().click();
  await page
    .locator('.btn--ghost')
    .filter({ hasText: /Settings/ })
    .click();
  await page.waitForSelector('.chip-row');
  await page.locator('.chip').first().click();
  await page.waitForTimeout(300);
  results.locale = await page.locator('.field__label').first().innerText();
  if (results.locale !== '언어') failures.push(`language did not switch (got ${results.locale})`);
  if (OUT) await page.screenshot({ path: `${OUT}/settings-ko.png` });
  await page.close();
}

await browser.close();
console.log(JSON.stringify(results, null, 2));
failures.push(...errors);
if (failures.length) {
  console.error('\nFLOWS FAILED:\n- ' + failures.join('\n- '));
  process.exit(1);
}
console.log('\nflows ok');
