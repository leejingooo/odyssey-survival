/**
 * Generates the ability codex straight from the game's own data tables, so it
 * can never drift out of sync with what the game actually does. Run it with
 * `npm run codex`; `scripts/build-codex.mjs` bundles this and writes the file.
 */
import type { SaveData } from '../src/core/storage';
import { BOONS_BY_GOD } from '../src/data/boons';
import type { CardDef, EffectKind, Rarity } from '../src/data/cards';
import { GOD_IDS, GODS, godName, godQuote, godTitle } from '../src/data/gods';
import { HERO_IDS, HEROES, heroDesc, heroName, heroRole, heroWeaponName } from '../src/data/heroes';
import { ENEMIES, enemyName, BOSS_SCHEDULE, WAVES } from '../src/data/enemies';
import { PERMANENT, permanentName } from '../src/data/permanent';
import { PERKS } from '../src/data/perks';
import { WEAPON_UPGRADES } from '../src/data/upgrades';
import { loc, setLocale, t, type DictKey, type LocaleId } from '../src/i18n';

const RARITY_ORDER: Rarity[] = ['common', 'rare', 'epic', 'legendary'];

function rarity(card: CardDef): string {
  return t(`rarity.${card.rarity}` as DictKey);
}

function effect(kind: EffectKind): string {
  return t(`effect.${kind}` as DictKey);
}

/** One line per rank, with the numbers the game will actually use. */
function ranks(card: CardDef): string[] {
  const out: string[] = [];
  for (let level = 1; level <= card.maxLevel; level++) {
    out.push(`${level}. ${loc(card.desc, ...card.values(level))}`);
  }
  return out;
}

function cardBlock(card: CardDef, emblem: string): string {
  const tags = [rarity(card), effect(card.effect)];
  if (card.temporaryLevels) tags.push(t('card.temporary', card.temporaryLevels));
  const lines = [
    `#### ${emblem} ${loc(card.name)}`,
    '',
    `\`${tags.join(' · ')}\` · 최대 ${card.maxLevel}단계`,
    '',
    ...ranks(card),
    '',
  ];
  return lines.join('\n');
}

export function buildCodex(locale: LocaleId): string {
  setLocale(locale);

  const save: SaveData = {
    version: 1,
    gold: 0,
    permanent: {},
    unlockedHeroes: [],
    unlockedGods: [],
    lastHero: 'odysseus',
    locale,
    sfx: true,
    music: true,
    haptics: true,
    stats: { runs: 0, bestTimeSec: 0, bestLevel: 0, totalKills: 0 },
    iap: { removeAds: false, unlockAllHeroes: false },
    ads: { day: '', watched: 0 },
  };
  void save;

  const boonCount = GOD_IDS.reduce((n, id) => n + (BOONS_BY_GOD[id]?.length ?? 0), 0);
  const out: string[] = [];

  out.push('# 능력 도감');
  out.push('');
  out.push(
    '> 이 파일은 `npm run codex` 로 **게임 데이터에서 직접 생성**됩니다.',
    '> 손으로 고치지 마세요 — 수치를 바꾸려면 `src/data/` 를 고치고 다시 생성하면 됩니다.',
  );
  out.push('');
  out.push(
    `신 ${GOD_IDS.length}주 · 축복 ${boonCount}종 · 무기 강화 ${WEAPON_UPGRADES.length}종 · ` +
      `영웅 특성 ${PERKS.length}종 · 영구 강화 ${PERMANENT.length}종`,
  );
  out.push('');

  // ---- how to read a card -------------------------------------------------
  out.push('## 카드 읽는 법');
  out.push('');
  out.push('**등급** — 등급은 곧 세기입니다. 희귀할수록 판을 더 크게 바꿉니다.');
  out.push('');
  out.push('| 등급 | 성격 |');
  out.push('| --- | --- |');
  const rarityNote: Record<Rarity, string> = {
    common: '꾸준하고 무난하다. 어떤 빌드에도 들어간다.',
    rare: '빌드 하나를 지탱한다.',
    epic: '빌드를 정의한다.',
    legendary: '판 자체를 바꾼다. 신의 각인 하나뿐이다.',
  };
  for (const r of RARITY_ORDER) {
    out.push(`| ${t(`rarity.${r}` as DictKey)} | ${rarityNote[r]} |`);
  }
  out.push('');
  out.push('**작동 방식** — 카드가 어떻게 적에게 닿는지입니다.');
  out.push('');
  out.push('| 표시 | 뜻 |');
  out.push('| --- | --- |');
  for (const kind of ['attack', 'auto', 'passive', 'trigger'] as EffectKind[]) {
    out.push(`| ${effect(kind)} | ${t(`effect.${kind}.help` as DictKey)} |`);
  }
  out.push('');
  out.push(
    '**신탁의 그릇** — 한 항해에서 축복을 받을 수 있는 신의 **종류**입니다. 처음엔 1종이고,',
    '영구 강화로 3종까지 늘어납니다. 그릇이 찬 뒤에도 새 신은 「교체」 카드로 나옵니다.',
  );
  out.push('');

  // ---- heroes -------------------------------------------------------------
  out.push('## 영웅');
  out.push('');
  out.push('| 영웅 | 역할 | 무기 | 피해 · 주기 | 해금 |');
  out.push('| --- | --- | --- | --- | --- |');
  for (const id of HERO_IDS) {
    const hero = HEROES[id];
    const wb = hero.weaponBase;
    const unlock = hero.unlockCost === 0 ? '처음부터' : `◆${hero.unlockCost}`;
    out.push(
      `| **${heroName(id)}** | ${heroRole(id)} | ${heroWeaponName(id)} | ` +
        `${wb.damage} · ${wb.cooldown}초 | ${unlock} |`,
    );
  }
  out.push('');
  for (const id of HERO_IDS) {
    out.push(`- **${heroName(id)}** — ${heroDesc(id)}`);
  }
  out.push('');

  // ---- pantheon -----------------------------------------------------------
  out.push('## 만신전');
  out.push('');
  out.push(t('pantheon.subtitle'));
  out.push('');
  for (const id of GOD_IDS) {
    const def = GODS[id];
    const price = def.unlockCost === 0 ? '처음부터' : `◆${def.unlockCost.toLocaleString()}`;
    out.push(`### ${def.emblem} ${godName(id)}`);
    out.push('');
    out.push(`*${godTitle(id)}* · ${price}`);
    out.push('');
    out.push(`> ${godQuote(id).replace(/^"|"$/g, '')}`);
    out.push('');
    for (const boon of BOONS_BY_GOD[id] ?? []) out.push(cardBlock(boon, def.emblem));
    out.push(`**신의 각인** — ${loc(def.infusion)}`);
    out.push('');
  }

  // ---- weapon upgrades ----------------------------------------------------
  out.push('## 기본 공격 강화');
  out.push('');
  out.push('보물상자에서 축복과 섞여 나옵니다. 전부 기본 공격에 붙습니다.');
  out.push('');
  for (const card of WEAPON_UPGRADES) out.push(cardBlock(card, card.icon ?? '✦'));

  // ---- perks --------------------------------------------------------------
  out.push('## 레벨업 특성');
  out.push('');
  out.push('레벨이 오를 때만 나옵니다. 일부는 몇 레벨 뒤에 사라집니다.');
  out.push('');
  for (const card of PERKS) out.push(cardBlock(card, card.icon ?? '✦'));

  // ---- permanent ----------------------------------------------------------
  out.push('## 영구 강화');
  out.push('');
  out.push(t('perm.subtitle'));
  out.push('');
  out.push('| 강화 | 단계 | 만렙 효과 | 단계별 가격 |');
  out.push('| --- | --- | --- | --- |');
  for (const def of PERMANENT) {
    const maxDesc = t(`perm.${def.id}.desc` as DictKey, def.value(def.maxRank));
    const costs = def.costs.map((c) => c.toLocaleString()).join(' · ');
    out.push(`| **${permanentName(def.id)}** | ${def.maxRank} | ${maxDesc} | ${costs} |`);
  }
  out.push('');

  // ---- enemies ------------------------------------------------------------
  out.push('## 적');
  out.push('');
  out.push('| 적 | 체력 | 피해 | 속도 | 경험치 | 행동 |');
  out.push('| --- | --- | --- | --- | --- | --- |');
  const behaviour: Record<string, string> = {
    chase: '곧장 달려든다',
    strafe: '빙 돌며 접근한다',
    charger: '거리를 재다가 돌진한다',
    shooter: '거리를 두고 쏜다',
  };
  for (const def of Object.values(ENEMIES)) {
    const tag = def.boss ? ' **(보스)**' : '';
    out.push(
      `| ${enemyName(def.id)}${tag} | ${def.hp} | ${def.damage} | ${def.speed} | ${def.xp} | ` +
        `${behaviour[def.behavior]} |`,
    );
  }
  out.push('');
  out.push('위 수치는 0분 기준입니다. 시간이 지나면 체력은 `1 + 분^1.25 × 0.11` 로 오릅니다.');
  out.push('');
  out.push('| 시각 | 초당 스폰 |');
  out.push('| --- | --- |');
  for (const wave of WAVES) out.push(`| ${wave.fromMinute}분 | ${wave.rate} |`);
  out.push('');
  out.push(
    '**보스** — ' + BOSS_SCHEDULE.map((b) => `${b.atMinute}분 ${enemyName(b.id)}`).join(' · '),
  );
  out.push('');

  return out.join('\n');
}
