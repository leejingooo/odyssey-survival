import { readFileSync } from 'node:fs';

const sources = [
  'src/i18n/ko.ts',
  'src/data/boons.ts',
  'src/data/perks.ts',
  'src/data/upgrades.ts',
].map((file) => [file, readFileSync(file, 'utf8')]);

const discouraged = [
  ['src/i18n/ko.ts', "'ui.continue': '계속'"],
  ['src/i18n/ko.ts', "'result.survived': '버틴 시간'"],
  ['src/data/upgrades.ts', "L('날카로움'"],
  ['src/data/upgrades.ts', "L('먼 사냥'"],
  ['src/data/upgrades.ts', "L('급소 찌르기'"],
];

for (const [file, phrase] of discouraged) {
  const text = sources.find(([name]) => name === file)?.[1] ?? '';
  if (text.includes(phrase)) throw new Error(`${file}: 어색한 표현이 다시 추가됨: ${phrase}`);
}

const codex = readFileSync('docs/CODEX.md', 'utf8');
for (const expected of ['무기 연마', '사거리 확장', '회심의 일격', '응징의 방패', '피바람']) {
  if (!codex.includes(expected)) throw new Error(`docs/CODEX.md가 게임 데이터와 다름: ${expected}`);
}

console.log('Korean terminology and generated codex checks passed');
