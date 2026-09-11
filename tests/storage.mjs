import { build } from 'esbuild';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const { outputFiles } = await build({
  entryPoints: ['src/core/storage.ts'], bundle: true, write: false,
  format: 'esm', platform: 'node',
});
const { loadSave, writeSave } = await import(
  `data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString('base64')}`
);
let blob = null;
globalThis.localStorage = {
  getItem: () => blob,
  setItem: (_key, value) => { blob = value; },
};

test('valid progress survives a save/load round trip', () => {
  blob = null;
  const save = loadSave();
  Object.assign(save, { gold: 1234, unlockedGods: ['hades'], lastHero: 'achilles',
    unlockedHeroes: ['odysseus', 'achilles'], permanent: { vitality: 3 }, locale: 'ko' });
  save.stats.bestTimeSec = 123.5;
  writeSave(save);
  assert.deepEqual(loadSave(), save);
});

test('partial old saves retain valid fields and receive defaults', () => {
  blob = JSON.stringify({ gold: 42, stats: { runs: 3 } });
  const save = loadSave();
  assert.equal(save.gold, 42);
  assert.equal(save.stats.runs, 3);
  assert.deepEqual(save.unlockedGods, []);
  assert.equal(save.music, true);
});

test('malformed fields cannot escape into game state', () => {
  blob = JSON.stringify({ gold: '100', unlockedGods: null, unlockedHeroes: [null, 'unknown'],
    permanent: { vitality: 999, boonSlots: -2, might: '5' },
    stats: { runs: -1, bestTimeSec: null }, iap: { removeAds: 'false' },
    locale: 'unknown', lastHero: null, ads: [], music: null });
  const save = loadSave();
  assert.equal(save.gold, 0);
  assert.deepEqual(save.unlockedGods, []);
  assert.deepEqual(save.unlockedHeroes, ['odysseus']);
  assert.deepEqual(save.permanent, { boonSlots: 0, vitality: 5, might: 0 });
  assert.equal(save.stats.runs, 0);
  assert.equal(save.iap.removeAds, false);
  assert.equal(save.lastHero, 'odysseus');
  assert.equal(save.music, true);
});

test('invalid JSON, arrays, and overflowing numbers remain loadable', () => {
  for (const raw of ['{broken', 'null', '[]', '{"gold":1e999}']) {
    blob = raw;
    const save = loadSave();
    assert.equal(save.gold, 0);
    assert.deepEqual(save.unlockedGods, []);
  }
});
