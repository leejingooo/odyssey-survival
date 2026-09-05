import { L } from '../i18n';
import { at, type CardDef } from './cards';
import type { GodId } from './gods';
import { ASPECT_BOONS } from './aspects';

/**
 * Fifteen gods, three boons each. A boon is always tied to its god, and how
 * many *different* gods may bless one voyage is capped — so these are meant to
 * be deepened, not collected.
 *
 * Rarity is a promise about power, not about flavour: common boons are
 * reliable and modest, rare boons carry a build, epic boons define one.
 */
const SIGNATURE_BOONS: CardDef[] = [
  // =============================================================== 아레스
  {
    id: 'ares_bleed',
    kind: 'boon',
    god: 'ares',
    effect: 'attack',
    rarity: 'common',
    maxLevel: 3,
    name: L('피의 서약', 'Blood Oath', '血の誓約', '血之誓约'),
    desc: L(
      '공격에 맞은 적이 {0}초 동안 초당 {1}씩 피를 흘린다.',
      'Enemies you hit bleed for {1} a second over {0}s.',
      '攻撃を受けた敵が{0}秒間、毎秒{1}の出血ダメージを受ける。',
      '被你命中的敌人在 {0} 秒内每秒流失 {1} 点生命。',
    ),
    values: (lv) => [at([3.0, 3.5, 4.0], lv), at([7, 14, 22], lv)],
    apply: (o, lv) => {
      o.mech.bleedDps += at([7, 14, 22], lv);
      o.mech.bleedDuration = Math.max(o.mech.bleedDuration, at([3.0, 3.5, 4.0], lv));
    },
  },
  {
    id: 'ares_wrath',
    kind: 'boon',
    god: 'ares',
    effect: 'passive',
    rarity: 'rare',
    maxLevel: 3,
    name: L('광전사의 분노', 'Berserker Wrath', '狂戦士の怒り', '狂战士之怒'),
    desc: L(
      '체력이 깎일수록 세진다. 빈사 상태에서 피해 +{0}%.',
      'The more health you lose the harder you hit — up to +{0}% at death’s door.',
      '体力が減るほど強くなる。瀕死で与ダメージ+{0}%。',
      '生命越低打得越狠，濒死时伤害 +{0}%。',
    ),
    values: (lv) => [at([30, 55, 85], lv)],
    apply: (o, lv) => {
      o.mech.wrathBonus += at([0.3, 0.55, 0.85], lv);
    },
  },
  {
    id: 'ares_slaughter',
    kind: 'boon',
    god: 'ares',
    effect: 'trigger',
    rarity: 'epic',
    maxLevel: 3,
    name: L('피바람', 'Slaughter Rush', '虐殺の勢い', '屠戮之势'),
    desc: L(
      '적을 쓰러뜨릴 때마다 {0}초 동안 공격 속도 +{1}%. 계속 죽이면 계속 빨라진다.',
      'Every kill grants +{1}% attack speed for {0}s. Keep killing, keep accelerating.',
      '敵を倒すたび{0}秒間、攻撃速度+{1}%。倒し続ける限り速くなる。',
      '每次击杀在 {0} 秒内获得 +{1}% 攻速，杀得越快越停不下来。',
    ),
    values: (lv) => [at([2.5, 3.0, 3.5], lv), at([25, 45, 70], lv)],
    apply: (o, lv) => {
      o.mech.slaughterHaste = at([0.25, 0.45, 0.7], lv);
      o.mech.slaughterDuration = at([2.5, 3.0, 3.5], lv);
    },
  },

  // =============================================================== 아테나
  {
    id: 'athena_deflect',
    kind: 'boon',
    god: 'athena',
    effect: 'trigger',
    rarity: 'common',
    maxLevel: 3,
    name: L('응징의 방패', 'Deflection', '反射の壁', '反射壁垒'),
    desc: L(
      '방어 +{0}. 보호막이 깨질 때 주변에 {1}의 피해로 되받아친다.',
      'Armour +{0}. When a shield breaks it lashes back for {1} around you.',
      '防御+{0}。盾が砕けると周囲へ{1}のダメージで打ち返す。',
      '护甲 +{0}。护盾破碎时向四周反击 {1} 点伤害。',
    ),
    values: (lv) => [at([1, 2, 3], lv), at([50, 95, 150], lv)],
    apply: (o, lv) => {
      o.stats.armor += at([1, 2, 3], lv);
      o.mech.reflectDamage += at([50, 95, 150], lv);
    },
  },
  {
    id: 'athena_aegis',
    kind: 'boon',
    god: 'athena',
    effect: 'auto',
    rarity: 'rare',
    maxLevel: 4,
    name: L('아이기스', 'Aegis', 'アイギス', '埃癸斯之盾'),
    desc: L(
      '{0}초마다 보호막이 한 겹 생겨 피해를 통째로 막는다. 최대 {1}겹.',
      'Every {0}s you gain a shield that eats one hit whole. Up to {1} at once.',
      '{0}秒ごとに盾が一枚生まれ、一撃を丸ごと防ぐ。最大{1}枚。',
      '每 {0} 秒生成一层护盾，可完全挡下一次伤害，最多 {1} 层。',
    ),
    values: (lv) => [at([8.0, 6.5, 5.0, 4.0], lv), at([1, 2, 3, 4], lv)],
    apply: (o, lv) => {
      o.mech.aegisInterval = at([8.0, 6.5, 5.0, 4.0], lv);
      o.mech.aegisMax = at([1, 2, 3, 4], lv);
    },
  },
  {
    id: 'athena_focus',
    kind: 'boon',
    god: 'athena',
    effect: 'passive',
    rarity: 'epic',
    maxLevel: 3,
    name: L('전술가의 눈', 'Tactician’s Eye', '戦術眼', '战术之眼'),
    desc: L(
      '급소가 보인다. 치명타 확률 +{0}%, 치명타 피해 +{1}%.',
      'You start seeing the openings. Crit chance +{0}%, crit damage +{1}%.',
      '急所が見える。クリティカル率+{0}%、クリティカルダメージ+{1}%。',
      '你开始看见破绽。暴击率 +{0}%，暴击伤害 +{1}%。',
    ),
    values: (lv) => [at([9, 17, 26], lv), at([30, 55, 85], lv)],
    apply: (o, lv) => {
      o.stats.critChance += at([0.09, 0.17, 0.26], lv);
      o.stats.critMult += at([0.3, 0.55, 0.85], lv);
    },
  },

  // ============================================================== 헤르메스
  {
    id: 'hermes_swift',
    kind: 'boon',
    god: 'hermes',
    effect: 'passive',
    rarity: 'common',
    maxLevel: 3,
    name: L('신의 발걸음', 'Swiftness', '神速', '神速'),
    desc: L(
      '이동 속도 +{0}%, 공격 속도 +{1}%, 획득 반경 +{2}%.',
      'Move speed +{0}%, attack speed +{1}%, pickup range +{2}%.',
      '移動速度+{0}%、攻撃速度+{1}%、取得範囲+{2}%。',
      '移动速度 +{0}%，攻击速度 +{1}%，拾取范围 +{2}%。',
    ),
    values: (lv) => [at([12, 22, 32], lv), at([12, 22, 32], lv), at([40, 70, 110], lv)],
    apply: (o, lv) => {
      const v = at([0.12, 0.22, 0.32], lv);
      o.stats.moveSpeed *= 1 + v;
      o.stats.attackSpeedMult *= 1 + v;
      o.stats.pickupRadius *= 1 + at([0.4, 0.7, 1.1], lv);
    },
  },
  {
    id: 'hermes_dodge',
    kind: 'boon',
    god: 'hermes',
    effect: 'passive',
    rarity: 'rare',
    maxLevel: 3,
    name: L('잔상', 'Afterimage', '残像', '残影'),
    desc: L(
      '{0}% 확률로 피해를 통째로 흘려보낸다. 흘려보낸 직후 잠시 몸이 가벼워진다.',
      '{0}% chance to slip a hit entirely, and you run light for a moment after.',
      '{0}%の確率でダメージを丸ごと受け流す。直後、しばし体が軽くなる。',
      '有 {0}% 概率完全卸掉一次伤害，卸掉之后身法会短暂变轻。',
    ),
    values: (lv) => [at([14, 24, 35], lv)],
    apply: (o, lv) => {
      o.stats.dodge += at([0.14, 0.24, 0.35], lv);
    },
  },
  {
    id: 'hermes_sprint',
    kind: 'boon',
    god: 'hermes',
    effect: 'passive',
    rarity: 'epic',
    maxLevel: 3,
    name: L('전령의 질주', 'Courier’s Sprint', '伝令の疾走', '信使疾驰'),
    desc: L(
      '빠를수록 아프다. 기본보다 빨라진 이동 속도 1%마다 피해 +{0}%.',
      'Speed becomes force: +{0}% damage for every 1% of move speed above the baseline.',
      '速いほど痛い。基準を超えた移動速度1%ごとに与ダメージ+{0}%。',
      '越快越痛：移动速度每超出基准 1%，伤害 +{0}%。',
    ),
    values: (lv) => [at([0.6, 1.0, 1.5], lv)],
    apply: (o, lv) => {
      o.mech.speedToDamage += at([0.6, 1.0, 1.5], lv);
    },
  },

  // ================================================================ 가이아
  {
    id: 'gaia_bulwark',
    kind: 'boon',
    god: 'gaia',
    effect: 'passive',
    rarity: 'common',
    maxLevel: 3,
    name: L('대지의 성벽', 'Bulwark of Earth', '大地の城壁', '大地壁垒'),
    desc: L(
      '최대 체력 +{0}, 방어 +{1}.',
      'Max health +{0}, armour +{1}.',
      '最大体力+{0}、防御+{1}。',
      '生命上限 +{0}，护甲 +{1}。',
    ),
    values: (lv) => [at([30, 65, 105], lv), at([1, 2, 3], lv)],
    apply: (o, lv) => {
      o.stats.maxHp += at([30, 65, 105], lv);
      o.stats.armor += at([1, 2, 3], lv);
    },
  },
  {
    id: 'gaia_bloom',
    kind: 'boon',
    god: 'gaia',
    effect: 'passive',
    rarity: 'rare',
    maxLevel: 3,
    name: L('생명의 싹', 'Blooming Life', '生命の芽', '生命之芽'),
    desc: L(
      '초당 체력 {0}씩 저절로 아문다.',
      'You knit back together at {0} health a second.',
      '毎秒{0}ずつ自然に癒える。',
      '每秒自动回复 {0} 点生命。',
    ),
    values: (lv) => [at([1.2, 2.4, 4.0], lv)],
    apply: (o, lv) => {
      o.stats.regen += at([1.2, 2.4, 4.0], lv);
    },
  },
  {
    id: 'gaia_thorns',
    kind: 'boon',
    god: 'gaia',
    effect: 'auto',
    rarity: 'epic',
    maxLevel: 3,
    name: L('가시덩굴', 'Thorned Vines', '茨の蔓', '荆棘藤蔓'),
    desc: L(
      '{0}초마다 발밑에서 가시 {1}개가 솟아 {2}의 피해를 준다. 조준이 필요 없다.',
      'Every {0}s, {1} thorns erupt around you for {2} damage. No aiming required.',
      '{0}秒ごとに足元から茨が{1}本突き出し、{2}のダメージ。狙う必要はない。',
      '每 {0} 秒在脚下刺出 {1} 根荆棘，造成 {2} 伤害，无需瞄准。',
    ),
    values: (lv) => [at([2.5, 2.0, 1.5], lv), at([3, 5, 7], lv), at([35, 60, 95], lv)],
    apply: (o, lv) => {
      o.mech.thornInterval = at([2.5, 2.0, 1.5], lv);
      o.mech.thornCount = at([3, 5, 7], lv);
      o.mech.thornDamage = at([35, 60, 95], lv);
    },
  },

  // ============================================================== 포세이돈
  {
    id: 'poseidon_surge',
    kind: 'boon',
    god: 'poseidon',
    effect: 'attack',
    rarity: 'common',
    maxLevel: 3,
    name: L('해일', 'Surging Tide', '高波', '汹涌浪潮'),
    desc: L(
      '공격이 적중하면 반경 {0} 안으로 물보라가 퍼져 {1}%의 피해를 준다.',
      'Every hit throws spray {0} wide, dealing {1}% of the hit again.',
      '命中すると半径{0}に水しぶきが広がり、{1}%のダメージ。',
      '每次命中都会溅起半径 {0} 的水花，造成 {1}% 的伤害。',
    ),
    values: (lv) => [at([36, 48, 62], lv), at([38, 50, 64], lv)],
    apply: (o, lv) => {
      o.mech.splashRadius = Math.max(o.mech.splashRadius, at([36, 48, 62], lv));
      o.mech.splashDamage = Math.max(o.mech.splashDamage, at([0.38, 0.5, 0.64], lv));
    },
  },
  {
    id: 'poseidon_tide',
    kind: 'boon',
    god: 'poseidon',
    effect: 'trigger',
    rarity: 'rare',
    maxLevel: 3,
    name: L('밀물 웅덩이', 'Rising Pools', '満ち潮の淵', '涨潮之池'),
    desc: L(
      '{0}% 확률로 쓰러진 자리에 물웅덩이가 남는다. 밟은 적은 초당 {1}씩 깎이고 {2}% 느려진다.',
      'Kills leave a pool {0}% of the time: {1} damage a second and {2}% slower.',
      '{0}%の確率で倒れた場所に水溜まりが残る。踏んだ敵は毎秒{1}削られ{2}%鈍る。',
      '有 {0}% 概率在尸体处留下水洼：每秒 {1} 点伤害，并减速 {2}%。',
    ),
    values: (lv) => [at([28, 44, 60], lv), at([16, 26, 38], lv), at([30, 40, 50], lv)],
    apply: (o, lv) => {
      o.mech.puddleChance = at([0.28, 0.44, 0.6], lv);
      o.mech.puddleDps = at([16, 26, 38], lv);
      o.mech.puddleSlow = at([0.3, 0.4, 0.5], lv);
      o.mech.puddleRadius = at([50, 58, 68], lv);
    },
  },
  {
    id: 'poseidon_trident',
    kind: 'boon',
    god: 'poseidon',
    effect: 'attack',
    rarity: 'epic',
    maxLevel: 3,
    name: L('삼지창의 일격', 'Trident Strike', '三叉の一撃', '三叉戟之击'),
    desc: L(
      '{0}번째 공격마다 삼지창이 실린다. 피해 {1}배에 모든 것을 꿰뚫는다.',
      'Every {0}th attack carries the trident: {1}x damage, and it goes through everything.',
      '{0}回ごとの攻撃に三叉が宿る。{1}倍のダメージで全てを貫く。',
      '每第 {0} 次攻击附上三叉戟：{1} 倍伤害，且贯穿一切。',
    ),
    values: (lv) => [at([4, 3, 3], lv), at([2.4, 2.8, 3.5], lv)],
    apply: (o, lv) => {
      o.mech.tridentEvery = at([4, 3, 3], lv);
      o.mech.tridentMult = at([2.4, 2.8, 3.5], lv);
    },
  },

  // ================================================================ 하데스
  {
    id: 'hades_soul',
    kind: 'boon',
    god: 'hades',
    effect: 'trigger',
    rarity: 'common',
    maxLevel: 3,
    name: L('영혼 수확', 'Soul Harvest', '魂の収穫', '灵魂收割'),
    desc: L(
      '적을 쓰러뜨리면 {0}% 확률로 영혼을 거둬 체력 {1}을 회복한다.',
      'Kills yield a soul {0}% of the time, worth {1} health.',
      '敵を倒すと{0}%の確率で魂を刈り取り、体力{1}を回復する。',
      '击杀时有 {0}% 概率收割灵魂，回复 {1} 点生命。',
    ),
    values: (lv) => [at([18, 26, 36], lv), at([3, 5, 8], lv)],
    apply: (o, lv) => {
      o.mech.soulChance = at([0.18, 0.26, 0.36], lv);
      o.mech.soulHeal = at([3, 5, 8], lv);
    },
  },
  {
    id: 'hades_lastbreath',
    kind: 'boon',
    god: 'hades',
    effect: 'trigger',
    rarity: 'rare',
    maxLevel: 3,
    name: L('최후의 숨결', 'Last Breath', '最期の吐息', '最后一息'),
    desc: L(
      '{0}% 확률로 시체가 터지며 반경 {1} 안에 {2}의 피해를 흩뿌린다. 연쇄로 터지기도 한다.',
      'Corpses detonate {0}% of the time for {2} damage within {1} — and they set each other off.',
      '{0}%の確率で死体が炸裂し、半径{1}内に{2}のダメージ。連鎖することもある。',
      '有 {0}% 概率尸体炸裂，在半径 {1} 内造成 {2} 伤害，还可能连锁引爆。',
    ),
    values: (lv) => [at([25, 38, 52], lv), at([65, 82, 100], lv), at([30, 55, 85], lv)],
    apply: (o, lv) => {
      o.mech.lastBreathChance = at([0.25, 0.38, 0.52], lv);
      o.mech.lastBreathRadius = at([65, 82, 100], lv);
      o.mech.lastBreathDamage = at([30, 55, 85], lv);
    },
  },
  {
    id: 'hades_doom',
    kind: 'boon',
    god: 'hades',
    effect: 'attack',
    rarity: 'epic',
    maxLevel: 3,
    name: L('파멸 각인', 'Doom Sigil', '破滅の刻印', '厄运印记'),
    desc: L(
      '맞은 적에게 각인이 새겨지고 {0}초 뒤 {1}의 피해로 터진다.',
      'Your hits brand the enemy; {0}s later the brand goes off for {1}.',
      '当たった敵に刻印が刻まれ、{0}秒後に{1}のダメージで炸裂する。',
      '命中会为敌人刻下印记，{0} 秒后引爆造成 {1} 伤害。',
    ),
    values: (lv) => [at([1.2, 1.0, 0.8], lv), at([50, 95, 155], lv)],
    apply: (o, lv) => {
      o.mech.doomDelay = at([1.2, 1.0, 0.8], lv);
      o.mech.doomDamage = at([50, 95, 155], lv);
    },
  },

  // ================================================================ 아폴론
  {
    id: 'apollo_bow',
    kind: 'boon',
    god: 'apollo',
    effect: 'passive',
    rarity: 'common',
    maxLevel: 3,
    name: L('은빛 활', 'Silver Bow', '銀の弓', '银弓'),
    desc: L(
      '사거리 +{0}%, 투사체 속도 +{1}%, 관통 +{2}.',
      'Range +{0}%, projectile speed +{1}%, pierce +{2}.',
      '射程+{0}%、弾速+{1}%、貫通+{2}。',
      '射程 +{0}%，弹速 +{1}%，贯穿 +{2}。',
    ),
    values: (lv) => [at([20, 35, 55], lv), at([15, 28, 45], lv), at([1, 1, 2], lv)],
    apply: (o, lv) => {
      o.stats.rangeMult *= 1 + at([0.2, 0.35, 0.55], lv);
      o.stats.projectileSpeedMult *= 1 + at([0.15, 0.28, 0.45], lv);
      o.stats.pierce += at([1, 1, 2], lv);
    },
  },
  {
    id: 'apollo_hymn',
    kind: 'boon',
    god: 'apollo',
    effect: 'passive',
    rarity: 'rare',
    maxLevel: 3,
    name: L('치유의 찬가', 'Healing Hymn', '癒しの讃歌', '治愈颂歌'),
    desc: L(
      '초당 {0}씩 아물고, 레벨이 오를 때마다 체력을 {1}% 되찾는다.',
      'Regenerate {0} a second, and recover {1}% of your health each time you level.',
      '毎秒{0}ずつ癒え、レベルが上がるたび体力を{1}%取り戻す。',
      '每秒回复 {0} 点，并在每次升级时恢复 {1}% 生命。',
    ),
    values: (lv) => [at([0.8, 1.6, 2.6], lv), at([25, 40, 60], lv)],
    apply: (o, lv) => {
      o.stats.regen += at([0.8, 1.6, 2.6], lv);
      o.mech.levelHeal = at([0.25, 0.4, 0.6], lv);
    },
  },
  {
    id: 'apollo_oracle',
    kind: 'boon',
    god: 'apollo',
    effect: 'auto',
    rarity: 'epic',
    maxLevel: 3,
    name: L('신탁의 빛', 'Light of the Oracle', '神託の光', '神谕之光'),
    desc: L(
      '{0}초마다 앞으로 빛줄기가 뻗어 나가 일직선 위의 모든 적에게 {1}의 피해를 준다.',
      'Every {0}s a beam lances forward, burning everything in the line for {1}.',
      '{0}秒ごとに前方へ光の筋が伸び、一直線上の敵すべてに{1}のダメージ。',
      '每 {0} 秒向前射出一道光柱，对直线上的所有敌人造成 {1} 伤害。',
    ),
    values: (lv) => [at([3.0, 2.4, 1.8], lv), at([70, 120, 190], lv)],
    apply: (o, lv) => {
      o.mech.beamInterval = at([3.0, 2.4, 1.8], lv);
      o.mech.beamDamage = at([70, 120, 190], lv);
    },
  },

  // ============================================================ 아프로디테
  {
    id: 'aphrodite_weak',
    kind: 'boon',
    god: 'aphrodite',
    effect: 'attack',
    rarity: 'common',
    maxLevel: 3,
    name: L('나른한 유혹', 'Languid Allure', '気だるい誘惑', '慵懒魅惑'),
    desc: L(
      '맞은 적이 {1}초 동안 나른해져 공격력과 속도가 {0}% 떨어진다.',
      'Enemies you hit go languid for {1}s: {0}% less damage and speed.',
      '当たった敵は{1}秒間気だるくなり、攻撃力と速度が{0}%落ちる。',
      '被命中的敌人在 {1} 秒内变得慵懒，攻击与速度下降 {0}%。',
    ),
    values: (lv) => [at([22, 32, 45], lv), at([3, 4, 5], lv)],
    apply: (o, lv) => {
      o.mech.weakenAmount = Math.max(o.mech.weakenAmount, at([0.22, 0.32, 0.45], lv));
      o.mech.weakenDuration = Math.max(o.mech.weakenDuration, at([3, 4, 5], lv));
    },
  },
  {
    id: 'aphrodite_heartbreak',
    kind: 'boon',
    god: 'aphrodite',
    effect: 'trigger',
    rarity: 'rare',
    maxLevel: 3,
    name: L('상심', 'Heartbreak', '失恋', '心碎'),
    desc: L(
      '홀린 적이 쓰러지면 반경 {0} 안이 {1}의 피해로 터진다. 홀릴 힘이 없어도 최소한은 홀린다.',
      'A charmed enemy bursts for {1} within {0} when it falls — and brings a little charm of its own.',
      '魅了された敵が倒れると半径{0}内が{1}のダメージで炸裂する。魅了の手段がなくても最低限は宿る。',
      '被魅惑的敌人倒下时在半径 {0} 内爆发 {1} 伤害，且自带少许魅惑几率。',
    ),
    values: (lv) => [at([85, 105, 130], lv), at([70, 130, 200], lv)],
    apply: (o, lv) => {
      o.mech.heartbreakRadius = at([85, 105, 130], lv);
      o.mech.heartbreakDamage = at([70, 130, 200], lv);
      o.mech.charmChance = Math.max(o.mech.charmChance, 0.03);
      o.mech.charmDuration = Math.max(o.mech.charmDuration, 4);
    },
  },
  {
    id: 'aphrodite_charm',
    kind: 'boon',
    god: 'aphrodite',
    effect: 'attack',
    rarity: 'epic',
    maxLevel: 3,
    name: L('매혹', 'Charm', '魅了', '魅惑'),
    desc: L(
      '{0}% 확률로 적이 편을 바꿔 {1}초 동안 동족을 친다.',
      '{0}% chance an enemy turns and fights its own for {1}s.',
      '{0}%の確率で敵が寝返り、{1}秒間同族を襲う。',
      '有 {0}% 概率让敌人倒戈，{1} 秒内攻击自己人。',
    ),
    values: (lv) => [at([4, 8, 13], lv), at([5, 6, 8], lv)],
    apply: (o, lv) => {
      o.mech.charmChance = Math.max(o.mech.charmChance, at([0.04, 0.08, 0.13], lv));
      o.mech.charmDuration = Math.max(o.mech.charmDuration, at([5, 6, 8], lv));
    },
  },

  // ========================================================== 헤파이스토스
  {
    id: 'hephaestus_forged',
    kind: 'boon',
    god: 'hephaestus',
    effect: 'attack',
    rarity: 'common',
    maxLevel: 3,
    name: L('용광로의 무기', 'Forge-Hot Weapon', '灼熱の武器', '灼热之兵'),
    desc: L(
      '무기가 벌겋게 달아 맞은 적을 {1}초 동안 초당 {0}씩 태운다.',
      'Your weapon glows: enemies burn for {0} a second over {1}s.',
      '武器が赤熱し、当たった敵を{1}秒間、毎秒{0}で焼く。',
      '兵器烧得通红，被命中的敌人在 {1} 秒内每秒灼烧 {0} 点。',
    ),
    values: (lv) => [at([8, 15, 24], lv), 3],
    apply: (o, lv) => {
      o.mech.burnDps += at([8, 15, 24], lv);
      o.mech.burnDuration = Math.max(o.mech.burnDuration, 3);
    },
  },
  {
    id: 'hephaestus_panoply',
    kind: 'boon',
    god: 'hephaestus',
    effect: 'passive',
    rarity: 'rare',
    maxLevel: 3,
    name: L('대장간의 갑주', 'Forged Panoply', '鍛冶場の甲冑', '锻炉甲胄'),
    desc: L(
      '최대 체력 +{0}, 방어 +{1}. 보호막이 깨질 때 {2}의 피해로 되받아친다.',
      'Max health +{0}, armour +{1}, and a broken shield answers for {2}.',
      '最大体力+{0}、防御+{1}。盾が砕けると{2}のダメージで打ち返す。',
      '生命上限 +{0}，护甲 +{1}；护盾破碎时反击 {2} 点伤害。',
    ),
    values: (lv) => [at([40, 80, 130], lv), at([2, 3, 5], lv), at([20, 45, 80], lv)],
    apply: (o, lv) => {
      o.stats.maxHp += at([40, 80, 130], lv);
      o.stats.armor += at([2, 3, 5], lv);
      o.mech.reflectDamage += at([20, 45, 80], lv);
    },
  },
  {
    id: 'hephaestus_automaton',
    kind: 'boon',
    god: 'hephaestus',
    effect: 'auto',
    rarity: 'epic',
    maxLevel: 3,
    name: L('청동 자동인형', 'Bronze Automaton', '青銅の自動人形', '青铜自动人偶'),
    desc: L(
      '청동 인형 {0}기가 당신 주위를 돌며 스치는 적을 {1}의 피해로 갈아낸다.',
      '{0} bronze construct(s) circle you, grinding anything they touch for {1}.',
      '青銅の人形{0}体があなたの周りを回り、触れた敵を{1}のダメージで削る。',
      '{0} 具青铜傀儡绕你旋转，将触碰到的敌人磨去 {1} 点生命。',
    ),
    values: (lv) => [at([1, 2, 3], lv), at([40, 60, 85], lv)],
    apply: (o, lv) => {
      o.mech.automatons = at([1, 2, 3], lv);
      o.mech.automatonDamage = at([40, 60, 85], lv);
    },
  },

  // ================================================================ 제우스
  {
    id: 'zeus_static',
    kind: 'boon',
    god: 'zeus',
    effect: 'trigger',
    rarity: 'common',
    maxLevel: 3,
    name: L('정전기 폭풍', 'Static Storm', '静電の嵐', '静电风暴'),
    desc: L(
      '맞을 때마다 반경 {0} 안으로 {1}의 피해가 방전된다.',
      'Every hit you take discharges {1} damage within {0}.',
      '被弾するたび半径{0}内に{1}のダメージが放電される。',
      '每次受击都会向半径 {0} 内放电，造成 {1} 伤害。',
    ),
    values: (lv) => [at([95, 118, 145], lv), at([28, 50, 78], lv)],
    apply: (o, lv) => {
      o.mech.staticRadius = at([95, 118, 145], lv);
      o.mech.staticDamage = at([28, 50, 78], lv);
    },
  },
  {
    id: 'zeus_chain',
    kind: 'boon',
    god: 'zeus',
    effect: 'attack',
    rarity: 'rare',
    maxLevel: 3,
    name: L('사슬 번개', 'Chain Lightning', '連鎖の雷', '连锁闪电'),
    desc: L(
      '적중한 번개가 옆의 적 {0}명에게 차례로 튄다. 튈 때마다 {1}%의 피해.',
      'The hit leaps to {0} more enemies in turn, for {1}% each.',
      '命中した雷が隣の敵{0}体へ順に跳ぶ。跳ぶたび{1}%のダメージ。',
      '命中后雷电依次弹向 {0} 名敌人，每次造成 {1}% 伤害。',
    ),
    values: (lv) => [at([1, 2, 3], lv), at([40, 52, 68], lv)],
    apply: (o, lv) => {
      o.mech.chainJumps += at([1, 2, 3], lv);
      o.mech.chainDamage = Math.max(o.mech.chainDamage, at([0.4, 0.52, 0.68], lv));
      o.mech.chainRange = Math.max(o.mech.chainRange, at([115, 135, 160], lv));
    },
  },
  {
    id: 'zeus_bolt',
    kind: 'boon',
    god: 'zeus',
    effect: 'auto',
    rarity: 'epic',
    maxLevel: 3,
    name: L('심판의 벼락', 'Bolt of Judgement', '審判の雷霆', '审判之雷'),
    desc: L(
      '{0}초마다 하늘이 알아서 가장 위험한 적을 골라 {1}의 벼락을 내린다. 보스가 우선이다.',
      'Every {0}s the sky picks the most dangerous thing on screen and hits it for {1}. Bosses first.',
      '{0}秒ごとに空が最も危険な敵を選び、{1}の雷を落とす。ボスが優先だ。',
      '每 {0} 秒天空自行挑出最危险的敌人，降下 {1} 点雷击，优先砸向首领。',
    ),
    values: (lv) => [at([3.0, 2.4, 1.8], lv), at([55, 95, 150], lv)],
    apply: (o, lv) => {
      o.mech.boltInterval = at([3.0, 2.4, 1.8], lv);
      o.mech.boltDamage = at([55, 95, 150], lv);
    },
  },

  // =============================================================== 헤스티아
  {
    id: 'hestia_hearth',
    kind: 'boon',
    god: 'hestia',
    effect: 'passive',
    rarity: 'common',
    maxLevel: 3,
    name: L('화롯불', 'Hearthfire', '炉の火', '炉火'),
    desc: L(
      '발을 멈추면 불이 붙는다. 가만히 선 동안 피해 +{0}%, 초당 체력 {1} 회복.',
      'Stand still and the fire catches: +{0}% damage and {1} health a second while you hold.',
      '足を止めると火が熾る。立ち止まっている間、与ダメージ+{0}%、毎秒{1}回復。',
      '停下脚步，炉火便燃起：静止时伤害 +{0}%，每秒回复 {1} 点生命。',
    ),
    values: (lv) => [at([18, 30, 45], lv), at([1.0, 2.0, 3.5], lv)],
    apply: (o, lv) => {
      o.mech.hearthDamage = at([0.18, 0.3, 0.45], lv);
      o.mech.hearthRegen = at([1.0, 2.0, 3.5], lv);
    },
  },
  {
    id: 'hestia_warmth',
    kind: 'boon',
    god: 'hestia',
    effect: 'passive',
    rarity: 'rare',
    maxLevel: 3,
    name: L('온기', 'Warmth', '温もり', '暖意'),
    desc: L(
      '최대 체력 +{0}. {1}초 동안 맞지 않으면 초당 최대 체력의 {2}%씩 아문다.',
      'Max health +{0}. Go {1}s without being hit and you heal {2}% of your max a second.',
      '最大体力+{0}。{1}秒間被弾しなければ毎秒最大体力の{2}%ずつ癒える。',
      '生命上限 +{0}。{1} 秒未受击后，每秒回复最大生命的 {2}%。',
    ),
    values: (lv) => [at([35, 70, 115], lv), 3, at([1.5, 2.5, 4.0], lv)],
    apply: (o, lv) => {
      o.stats.maxHp += at([35, 70, 115], lv);
      o.mech.warmthPercent = at([0.015, 0.025, 0.04], lv);
    },
  },
  {
    id: 'hestia_flame',
    kind: 'boon',
    god: 'hestia',
    effect: 'trigger',
    rarity: 'epic',
    maxLevel: 3,
    name: L('꺼지지 않는 불', 'Everlasting Flame', '消えぬ炎', '不灭之火'),
    desc: L(
      '항해당 한 번, 죽음을 견딘다. 체력 {0}%로 다시 일어나고 {1}초 동안 무적이 된다.',
      'Once a voyage, refuse to die: get up at {0}% health, untouchable for {1}s.',
      '航海に一度だけ死を拒む。体力{0}%で立ち上がり、{1}秒間無敵になる。',
      '每次航行一次，拒绝死亡：以 {0}% 生命重新站起，并无敌 {1} 秒。',
    ),
    values: (lv) => [at([50, 70, 100], lv), at([2.5, 3.0, 4.0], lv)],
    apply: (o, lv) => {
      o.mech.everlastingFlame = at([0.5, 0.7, 1.0], lv);
      o.mech.flameInvuln = at([2.5, 3.0, 4.0], lv);
    },
  },

  // ============================================================= 디오니소스
  {
    id: 'dionysus_draught',
    kind: 'boon',
    god: 'dionysus',
    effect: 'attack',
    rarity: 'common',
    maxLevel: 3,
    name: L('취기', 'Drunken Draught', '酔い', '醉意'),
    desc: L(
      '준 피해의 {0}%를 그대로 들이켜 체력으로 삼는다.',
      'Drink back {0}% of all the damage you deal.',
      '与えたダメージの{0}%をそのまま飲み干して体力に変える。',
      '将造成伤害的 {0}% 一饮而尽，化作生命。',
    ),
    values: (lv) => [at([3, 5, 8], lv)],
    apply: (o, lv) => {
      o.mech.drain += at([0.03, 0.05, 0.08], lv);
    },
  },
  {
    id: 'dionysus_vine',
    kind: 'boon',
    god: 'dionysus',
    effect: 'attack',
    rarity: 'rare',
    maxLevel: 3,
    name: L('덩굴 속박', 'Vine Snare', '葡萄の蔓', '葡萄藤缚'),
    desc: L(
      '{0}% 확률로 넝쿨이 적의 발을 {1}초 동안 붙잡는다.',
      '{0}% chance vines pin an enemy in place for {1}s.',
      '{0}%の確率で蔓が敵の足を{1}秒間縛る。',
      '有 {0}% 概率以藤蔓将敌人钉在原地 {1} 秒。',
    ),
    values: (lv) => [at([16, 25, 36], lv), at([1.0, 1.4, 1.8], lv)],
    apply: (o, lv) => {
      o.mech.snareChance = at([0.16, 0.25, 0.36], lv);
      o.mech.snareDuration = at([1.0, 1.4, 1.8], lv);
    },
  },
  {
    id: 'dionysus_madness',
    kind: 'boon',
    god: 'dionysus',
    effect: 'passive',
    rarity: 'epic',
    maxLevel: 3,
    name: L('광기의 잔', 'Cup of Madness', '狂気の杯', '癫狂之杯'),
    desc: L(
      '아레스의 정반대. 체력이 가득 찼을 때 피해 +{0}%.',
      'The opposite of Ares: +{0}% damage while your health is full.',
      'アレスの真逆。体力が満ちているとき与ダメージ+{0}%。',
      '与阿瑞斯恰恰相反：满血时伤害 +{0}%。',
    ),
    values: (lv) => [at([30, 55, 85], lv)],
    apply: (o, lv) => {
      o.mech.zealBonus += at([0.3, 0.55, 0.85], lv);
    },
  },

  // ================================================================= 헤라
  {
    id: 'hera_majesty',
    kind: 'boon',
    god: 'hera',
    effect: 'passive',
    rarity: 'common',
    maxLevel: 3,
    name: L('여왕의 위엄', 'Queen’s Majesty', '女王の威厳', '女王威仪'),
    desc: L(
      '반경 {0} 안의 적은 감히 제 힘을 내지 못한다. 공격력과 이동 속도 {1}% 감소.',
      'Enemies within {0} do not dare fight properly: {1}% less damage and speed.',
      '半径{0}内の敵は本来の力を出せない。攻撃力と移動速度が{1}%低下。',
      '半径 {0} 内的敌人不敢全力以赴：攻击与移动降低 {1}%。',
    ),
    values: (lv) => [at([110, 140, 175], lv), at([12, 20, 30], lv)],
    apply: (o, lv) => {
      o.mech.auraRadius = at([110, 140, 175], lv);
      o.mech.auraWeaken = at([0.12, 0.2, 0.3], lv);
    },
  },
  {
    id: 'hera_jealousy',
    kind: 'boon',
    god: 'hera',
    effect: 'attack',
    rarity: 'rare',
    maxLevel: 3,
    name: L('질투의 낙인', 'Brand of Jealousy', '嫉妬の烙印', '嫉妒烙印'),
    desc: L(
      '{0}% 확률로 낙인이 찍힌다. 낙인된 적은 {2}초 동안 모든 곳에서 오는 피해를 {1}% 더 받는다.',
      '{0}% chance to brand. A branded enemy takes {1}% more damage from everything for {2}s.',
      '{0}%の確率で烙印が刻まれる。烙印された敵は{2}秒間、あらゆる被ダメージが{1}%増える。',
      '有 {0}% 概率打上烙印：被烙印者在 {2} 秒内受到的一切伤害提高 {1}%。',
    ),
    values: (lv) => [at([30, 45, 65], lv), at([18, 28, 40], lv), 4],
    apply: (o, lv) => {
      o.mech.markChance = at([0.3, 0.45, 0.65], lv);
      o.mech.markAmount = Math.max(o.mech.markAmount, at([0.18, 0.28, 0.4], lv));
      o.mech.markDuration = Math.max(o.mech.markDuration, 4);
    },
  },
  {
    id: 'hera_vows',
    kind: 'boon',
    god: 'hera',
    effect: 'passive',
    rarity: 'epic',
    maxLevel: 3,
    name: L('혼인의 서약', 'Marriage Vows', '婚姻の誓い', '婚姻誓约'),
    desc: L(
      '모시는 신 하나마다 피해 +{0}%, 최대 체력 +{1}. 헤라 자신도 셈에 들어간다.',
      'For each god you serve: +{0}% damage and +{1} max health. Hera counts herself.',
      '仕える神ひとつごとに与ダメージ+{0}%、最大体力+{1}。ヘラ自身も数に入る。',
      '每供奉一位神明：伤害 +{0}%，生命上限 +{1}。赫拉把自己也算在内。',
    ),
    values: (lv) => [at([10, 16, 24], lv), at([18, 28, 40], lv)],
    apply: (o, lv) => {
      o.mech.allianceBonus = at([0.1, 0.16, 0.24], lv);
      o.mech.allianceHealth = at([18, 28, 40], lv);
    },
  },

  // ============================================================= 아르테미스
  {
    id: 'artemis_mark',
    kind: 'boon',
    god: 'artemis',
    effect: 'passive',
    rarity: 'common',
    maxLevel: 3,
    name: L('사냥꾼의 표식', 'Hunter’s Mark', '狩人の印', '猎人印记'),
    desc: L(
      '치명타 확률 +{0}%, 치명타 피해 +{1}%.',
      'Crit chance +{0}%, crit damage +{1}%.',
      'クリティカル率+{0}%、クリティカルダメージ+{1}%。',
      '暴击率 +{0}%，暴击伤害 +{1}%。',
    ),
    values: (lv) => [at([11, 20, 30], lv), at([25, 45, 70], lv)],
    apply: (o, lv) => {
      o.stats.critChance += at([0.11, 0.2, 0.3], lv);
      o.stats.critMult += at([0.25, 0.45, 0.7], lv);
    },
  },
  {
    id: 'artemis_moonshaft',
    kind: 'boon',
    god: 'artemis',
    effect: 'auto',
    rarity: 'rare',
    maxLevel: 3,
    name: L('달빛 화살', 'Moonlit Shafts', '月光の矢', '月光之箭'),
    desc: L(
      '공격할 때마다 달빛 화살 {0}발이 알아서 적을 찾아간다. 근접 영웅에게 없던 사거리가 생긴다.',
      'Each attack looses {0} moonlit shaft(s) that find their own targets — reach for heroes who had none.',
      '攻撃のたび月光の矢が{0}本、自ら敵を探して飛ぶ。近接の英雄に射程が生まれる。',
      '每次攻击额外射出 {0} 支自行寻的的月光之箭，让近战英雄也有了射程。',
    ),
    values: (lv) => [at([1, 2, 3], lv)],
    apply: (o, lv) => {
      o.mech.moonshafts += at([1, 2, 3], lv);
    },
  },
  {
    id: 'artemis_silverhunt',
    kind: 'boon',
    god: 'artemis',
    effect: 'trigger',
    rarity: 'epic',
    maxLevel: 3,
    name: L('은빛 추격', 'Silver Hunt', '銀の狩り', '银色狩猎'),
    desc: L(
      '치명타가 터질 때마다 반경 {0} 안으로 그 피해의 {1}%가 흩뿌려진다.',
      'Every crit scatters {1}% of its damage within {0}.',
      'クリティカルのたび、半径{0}内にその威力の{1}%が飛び散る。',
      '每次暴击都会在半径 {0} 内溅散该伤害的 {1}%。',
    ),
    values: (lv) => [at([75, 95, 120], lv), at([55, 85, 120], lv)],
    apply: (o, lv) => {
      o.mech.critSplashRadius = at([75, 95, 120], lv);
      o.mech.critSplashDamage = at([0.55, 0.85, 1.2], lv);
    },
  },

  // ============================================================== 데메테르
  {
    id: 'demeter_frost',
    kind: 'boon',
    god: 'demeter',
    effect: 'attack',
    rarity: 'common',
    maxLevel: 3,
    name: L('서리', 'Frost', '霜', '寒霜'),
    desc: L(
      '{0}% 확률로 적이 {1}초 동안 그 자리에 얼어붙는다. 얼어붙으면 움직이지도 때리지도 못한다.',
      '{0}% chance to freeze an enemy where it stands for {1}s — it can neither move nor swing.',
      '{0}%の確率で敵がその場に{1}秒凍りつく。凍れば動くことも殴ることもできない。',
      '有 {0}% 概率将敌人原地冰冻 {1} 秒，期间既不能移动也不能攻击。',
    ),
    values: (lv) => [at([20, 30, 42], lv), at([1.2, 1.6, 2.2], lv)],
    apply: (o, lv) => {
      o.mech.freezeChance += at([0.2, 0.3, 0.42], lv);
      o.mech.freezeDuration = Math.max(o.mech.freezeDuration, at([1.2, 1.6, 2.2], lv));
    },
  },
  {
    id: 'demeter_abundance',
    kind: 'boon',
    god: 'demeter',
    effect: 'passive',
    rarity: 'rare',
    maxLevel: 3,
    name: L('풍요', 'Abundance', '豊穣', '丰饶'),
    desc: L(
      '경험치 +{0}%. 쓰러진 적이 {1}% 확률로 치유의 열매를 떨군다.',
      'Experience +{0}%, and the fallen drop healing fruit {1}% of the time.',
      '経験値+{0}%。倒れた敵が{1}%の確率で癒やしの実を落とす。',
      '经验 +{0}%，倒下的敌人有 {1}% 概率掉落治愈果实。',
    ),
    values: (lv) => [at([22, 38, 58], lv), at([7, 11, 17], lv)],
    apply: (o, lv) => {
      o.stats.xpMult += at([0.22, 0.38, 0.58], lv);
      o.mech.healDropChance = at([0.07, 0.11, 0.17], lv);
    },
  },
  {
    id: 'demeter_winter',
    kind: 'boon',
    god: 'demeter',
    effect: 'passive',
    rarity: 'epic',
    maxLevel: 3,
    name: L('겨울의 심판', 'Winter’s Judgement', '冬の審判', '寒冬审判'),
    desc: L(
      '얼어붙은 적에게 주는 피해 +{0}%. 얼음이 풀릴 때 {1}의 피해로 부서진다.',
      '+{0}% damage to frozen enemies, and the ice shatters for {1} when it lets go.',
      '凍った敵へのダメージ+{0}%。氷が解けるとき{1}のダメージで砕ける。',
      '对冰冻敌人伤害 +{0}%；冰层消融时炸裂造成 {1} 伤害。',
    ),
    values: (lv) => [at([45, 75, 115], lv), at([60, 115, 190], lv)],
    apply: (o, lv) => {
      o.mech.shatterBonus += at([0.45, 0.75, 1.15], lv);
      o.mech.shatterDamage += at([60, 115, 190], lv);
      // Useless without something to freeze, so it brings a little frost along.
      o.mech.freezeChance = Math.max(o.mech.freezeChance, 0.14);
      o.mech.freezeDuration = Math.max(o.mech.freezeDuration, 1.0);
    },
  },
];

/** Boons grouped by their god, for the Pantheon codex. */
/** 45 signature boons plus 45 build-shaping aspects: six choices per god. */
export const BOONS: CardDef[] = [...SIGNATURE_BOONS, ...ASPECT_BOONS];

export const BOONS_BY_GOD: Record<GodId, CardDef[]> = BOONS.reduce(
  (acc, boon) => {
    const god = boon.god as GodId;
    (acc[god] ??= []).push(boon);
    return acc;
  },
  {} as Record<GodId, CardDef[]>,
);
