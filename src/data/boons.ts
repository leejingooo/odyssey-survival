import { L } from '../i18n';
import { at, type CardDef } from './cards';
import type { GodId } from './gods';

/**
 * Eight gods, three boons each. A boon is always tied to its god, and the
 * Star Chart caps how many *different* gods may bless one voyage — so
 * these are meant to be deepened, not collected.
 */
export const BOONS: CardDef[] = [
  // ---------------------------------------------------------------- Zeus
  {
    id: 'zeus_chain',
    kind: 'boon',
    god: 'zeus',
    rarity: 'rare',
    maxLevel: 3,
    name: L('사슬 번개', 'Chain Lightning', '連鎖の雷', '连锁闪电'),
    desc: L(
      '적중 시 주변 적 {0}명에게 공격력의 {1}% 번개가 튄다.',
      'Hits arc to {0} nearby enemies for {1}% of the hit.',
      '命中時、周囲の敵{0}体に威力{1}%の雷が連鎖する。',
      '命中时向附近 {0} 名敌人弹射，造成 {1}% 伤害。',
    ),
    values: (lv) => [at([1, 2, 3], lv), at([35, 45, 58], lv)],
    apply: (o, lv) => {
      o.mech.chainJumps += at([1, 2, 3], lv);
      o.mech.chainDamage = Math.max(o.mech.chainDamage, at([0.35, 0.45, 0.58], lv));
      o.mech.chainRange = Math.max(o.mech.chainRange, at([110, 130, 155], lv));
    },
  },
  {
    id: 'zeus_bolt',
    kind: 'boon',
    god: 'zeus',
    rarity: 'epic',
    maxLevel: 3,
    name: L('심판의 벼락', 'Bolt of Judgement', '審判の雷霆', '审判之雷'),
    desc: L(
      '{0}초마다 무작위 적에게 {1} 피해의 벼락이 떨어진다.',
      'Every {0}s a bolt strikes a random enemy for {1} damage.',
      '{0}秒ごとに無作為の敵へ{1}ダメージの雷が落ちる。',
      '每 {0} 秒对随机敌人降下造成 {1} 伤害的闪电。',
    ),
    values: (lv) => [at([3.0, 2.4, 1.8], lv), at([46, 78, 120], lv)],
    apply: (o, lv) => {
      o.mech.boltInterval = at([3.0, 2.4, 1.8], lv);
      o.mech.boltDamage = at([46, 78, 120], lv);
    },
  },
  {
    id: 'zeus_static',
    kind: 'boon',
    god: 'zeus',
    rarity: 'common',
    maxLevel: 3,
    name: L('정전기 폭풍', 'Static Storm', '静電の嵐', '静电风暴'),
    desc: L(
      '피격당하면 반경 {0} 안의 적에게 {1} 피해로 방전한다.',
      'When you are hit, discharge {1} damage within {0} range.',
      '被弾すると半径{0}内の敵に{1}ダメージを放電する。',
      '受击时向半径 {0} 内的敌人放电，造成 {1} 伤害。',
    ),
    values: (lv) => [at([90, 112, 135], lv), at([22, 40, 62], lv)],
    apply: (o, lv) => {
      o.mech.staticRadius = at([90, 112, 135], lv);
      o.mech.staticDamage = at([22, 40, 62], lv);
    },
  },

  // ------------------------------------------------------------ Poseidon
  {
    id: 'poseidon_surge',
    kind: 'boon',
    god: 'poseidon',
    rarity: 'common',
    maxLevel: 3,
    name: L('해일', 'Surging Tide', '高波', '汹涌浪潮'),
    desc: L(
      '공격이 적을 밀어내고 반경 {0} 안에 {1}% 광역 피해를 준다.',
      'Attacks knock back and splash {1}% damage within {0}.',
      '攻撃が敵を押し戻し、半径{0}内に{1}%の範囲ダメージ。',
      '攻击击退敌人，并在半径 {0} 内造成 {1}% 溅射伤害。',
    ),
    values: (lv) => [at([34, 46, 58], lv), at([35, 46, 58], lv)],
    apply: (o, lv) => {
      o.mech.splashRadius = Math.max(o.mech.splashRadius, at([34, 46, 58], lv));
      o.mech.splashDamage = Math.max(o.mech.splashDamage, at([0.35, 0.46, 0.58], lv));
      o.mech.knockback += at([18, 26, 36], lv);
    },
  },
  {
    id: 'poseidon_tide',
    kind: 'boon',
    god: 'poseidon',
    rarity: 'rare',
    maxLevel: 3,
    name: L('밀물의 웅덩이', 'Rising Pools', '満ち潮の淵', '涨潮之池'),
    desc: L(
      '처치 시 {0}% 확률로 웅덩이가 생긴다. 초당 {1} 피해, 이동 속도 {2}% 감소.',
      'Kills leave a pool {0}% of the time: {1} damage/s and {2}% slow.',
      '撃破時{0}%の確率で水溜まりを残す。毎秒{1}ダメージ、移動速度{2}%低下。',
      '击杀时有 {0}% 概率留下水池：每秒 {1} 伤害并减速 {2}%。',
    ),
    values: (lv) => [at([25, 40, 55], lv), at([14, 22, 32], lv), at([25, 35, 45], lv)],
    apply: (o, lv) => {
      o.mech.puddleChance = at([0.25, 0.4, 0.55], lv);
      o.mech.puddleDps = at([14, 22, 32], lv);
      o.mech.puddleSlow = at([0.25, 0.35, 0.45], lv);
      o.mech.puddleRadius = at([48, 56, 66], lv);
    },
  },
  {
    id: 'poseidon_trident',
    kind: 'boon',
    god: 'poseidon',
    rarity: 'epic',
    maxLevel: 3,
    name: L('삼지창의 일격', 'Trident Strike', '三叉の一撃', '三叉戟之击'),
    desc: L(
      '{0}번째 공격마다 피해 {1}배, 모든 적을 관통한다.',
      'Every {0}th attack deals {1}x damage and pierces everything.',
      '{0}回ごとの攻撃が{1}倍ダメージとなり、全てを貫通する。',
      '每第 {0} 次攻击造成 {1} 倍伤害并贯穿一切。',
    ),
    values: (lv) => [at([4, 3, 3], lv), at([2.2, 2.5, 3.2], lv)],
    apply: (o, lv) => {
      o.mech.tridentEvery = at([4, 3, 3], lv);
      o.mech.tridentMult = at([2.2, 2.5, 3.2], lv);
    },
  },

  // ---------------------------------------------------------------- Ares
  {
    id: 'ares_bleed',
    kind: 'boon',
    god: 'ares',
    rarity: 'common',
    maxLevel: 3,
    name: L('피의 서약', 'Blood Oath', '血の誓約', '血之誓约'),
    desc: L(
      '적중한 적이 {0}초 동안 초당 {1} 출혈 피해를 입는다.',
      'Struck enemies bleed for {1} damage/s over {0}s.',
      '命中した敵は{0}秒間、毎秒{1}の出血ダメージを受ける。',
      '被击中的敌人在 {0} 秒内每秒受到 {1} 流血伤害。',
    ),
    values: (lv) => [at([3.0, 3.5, 4.0], lv), at([6, 12, 19], lv)],
    apply: (o, lv) => {
      o.mech.bleedDps += at([6, 12, 19], lv);
      o.mech.bleedDuration = Math.max(o.mech.bleedDuration, at([3.0, 3.5, 4.0], lv));
    },
  },
  {
    id: 'ares_wrath',
    kind: 'boon',
    god: 'ares',
    rarity: 'rare',
    maxLevel: 3,
    name: L('광전사의 분노', 'Berserker Wrath', '狂戦士の怒り', '狂战士之怒'),
    desc: L(
      '잃은 체력에 비례해 피해가 최대 +{0}%까지 증가한다.',
      'Deal up to +{0}% damage as your health drops.',
      '失った体力に応じてダメージが最大+{0}%上昇する。',
      '生命值越低伤害越高，最多 +{0}%。',
    ),
    values: (lv) => [at([25, 45, 72], lv)],
    apply: (o, lv) => {
      o.mech.wrathBonus += at([0.25, 0.45, 0.72], lv);
    },
  },
  {
    id: 'ares_slaughter',
    kind: 'boon',
    god: 'ares',
    rarity: 'epic',
    maxLevel: 3,
    name: L('학살의 기세', 'Slaughter Rush', '虐殺の勢い', '屠戮之势'),
    desc: L(
      '처치할 때마다 {0}초 동안 공격 속도 +{1}%.',
      'Each kill grants +{1}% attack speed for {0}s.',
      '撃破ごとに{0}秒間、攻撃速度+{1}%。',
      '每次击杀在 {0} 秒内获得 +{1}% 攻速。',
    ),
    values: (lv) => [at([2.0, 2.5, 3.0], lv), at([20, 35, 55], lv)],
    apply: (o, lv) => {
      o.mech.slaughterHaste = at([0.2, 0.35, 0.55], lv);
      o.mech.slaughterDuration = at([2.0, 2.5, 3.0], lv);
    },
  },

  // -------------------------------------------------------------- Athena
  {
    id: 'athena_aegis',
    kind: 'boon',
    god: 'athena',
    rarity: 'rare',
    maxLevel: 4,
    name: L('아이기스', 'Aegis', 'アイギス', '埃癸斯之盾'),
    desc: L(
      '{0}초마다 피해 한 번을 완전히 막는 보호막이 생긴다. 최대 {1}겹.',
      'Every {0}s gain a shield that fully blocks one hit. Up to {1}.',
      '{0}秒ごとに一撃を完全に防ぐ盾を得る。最大{1}枚。',
      '每 {0} 秒获得可完全格挡一次伤害的护盾，最多 {1} 层。',
    ),
    values: (lv) => [at([8.0, 6.5, 5.0, 4.0], lv), at([1, 2, 3, 4], lv)],
    apply: (o, lv) => {
      o.mech.aegisInterval = at([8.0, 6.5, 5.0, 4.0], lv);
      o.mech.aegisMax = at([1, 2, 3, 4], lv);
    },
  },
  {
    id: 'athena_deflect',
    kind: 'boon',
    god: 'athena',
    rarity: 'common',
    maxLevel: 3,
    name: L('반사의 방벽', 'Deflection', '反射の壁', '反射壁垒'),
    desc: L(
      '방어 +{0}. 보호막이 깨질 때 주변에 {1} 피해를 되돌린다.',
      'Armor +{0}. Breaking a shield reflects {1} damage around you.',
      '防御+{0}。盾が砕けると周囲に{1}ダメージを返す。',
      '护甲 +{0}。护盾破碎时向四周反弹 {1} 伤害。',
    ),
    values: (lv) => [at([1, 2, 3], lv), at([45, 85, 135], lv)],
    apply: (o, lv) => {
      o.stats.armor += at([1, 2, 3], lv);
      o.mech.reflectDamage += at([45, 85, 135], lv);
    },
  },
  {
    id: 'athena_focus',
    kind: 'boon',
    god: 'athena',
    rarity: 'epic',
    maxLevel: 3,
    name: L('전술안', "Tactician's Eye", '戦術眼', '战术之眼'),
    desc: L(
      '치명타 확률 +{0}%, 치명타 피해 +{1}%.',
      'Critical chance +{0}%, critical damage +{1}%.',
      'クリティカル率+{0}%、クリティカルダメージ+{1}%。',
      '暴击率 +{0}%，暴击伤害 +{1}%。',
    ),
    values: (lv) => [at([8, 15, 22], lv), at([25, 45, 70], lv)],
    apply: (o, lv) => {
      o.stats.critChance += at([0.08, 0.15, 0.22], lv);
      o.stats.critMult += at([0.25, 0.45, 0.7], lv);
    },
  },

  // ----------------------------------------------------------- Aphrodite
  {
    id: 'aphrodite_weak',
    kind: 'boon',
    god: 'aphrodite',
    rarity: 'common',
    maxLevel: 3,
    name: L('나른한 유혹', 'Languid Allure', '気だるい誘惑', '慵懒魅惑'),
    desc: L(
      '적중한 적의 피해와 속도가 {1}초 동안 {0}% 감소한다.',
      'Struck enemies deal and move {0}% less for {1}s.',
      '命中した敵の攻撃力と速度が{1}秒間{0}%低下する。',
      '被击中的敌人在 {1} 秒内伤害与速度降低 {0}%。',
    ),
    values: (lv) => [at([20, 30, 42], lv), at([3, 4, 5], lv)],
    apply: (o, lv) => {
      o.mech.weakenAmount = Math.max(o.mech.weakenAmount, at([0.2, 0.3, 0.42], lv));
      o.mech.weakenDuration = Math.max(o.mech.weakenDuration, at([3, 4, 5], lv));
    },
  },
  {
    id: 'aphrodite_charm',
    kind: 'boon',
    god: 'aphrodite',
    rarity: 'epic',
    maxLevel: 3,
    name: L('매혹', 'Charm', '魅了', '魅惑'),
    desc: L(
      '적중 시 {0}% 확률로 적이 {1}초 동안 당신을 위해 싸운다.',
      '{0}% chance on hit to make an enemy fight for you for {1}s.',
      '命中時{0}%の確率で、敵が{1}秒間あなたのために戦う。',
      '命中时有 {0}% 概率使敌人为你作战 {1} 秒。',
    ),
    values: (lv) => [at([3, 6, 10], lv), at([5, 6, 8], lv)],
    apply: (o, lv) => {
      o.mech.charmChance = at([0.03, 0.06, 0.1], lv);
      o.mech.charmDuration = at([5, 6, 8], lv);
    },
  },
  {
    id: 'aphrodite_heartbreak',
    kind: 'boon',
    god: 'aphrodite',
    rarity: 'rare',
    maxLevel: 3,
    name: L('상심', 'Heartbreak', '失恋', '心碎'),
    desc: L(
      '매혹된 적이 쓰러지면 반경 {0} 안에 {1} 피해로 터진다.',
      'A charmed enemy bursts for {1} damage within {0} when it falls.',
      '魅了された敵が倒れると半径{0}内に{1}ダメージで爆ぜる。',
      '被魅惑的敌人倒下时在半径 {0} 内爆发 {1} 伤害。',
    ),
    values: (lv) => [at([80, 100, 125], lv), at([60, 115, 180], lv)],
    apply: (o, lv) => {
      o.mech.heartbreakRadius = at([80, 100, 125], lv);
      o.mech.heartbreakDamage = at([60, 115, 180], lv);
      // Heartbreak is dead weight without a charm source, so it seeds a little.
      o.mech.charmChance = Math.max(o.mech.charmChance, 0.02);
      o.mech.charmDuration = Math.max(o.mech.charmDuration, 4);
    },
  },

  // -------------------------------------------------------------- Hermes
  {
    id: 'hermes_swift',
    kind: 'boon',
    god: 'hermes',
    rarity: 'common',
    maxLevel: 3,
    name: L('신속', 'Swiftness', '神速', '神速'),
    desc: L(
      '이동 속도 +{0}%, 공격 속도 +{1}%.',
      'Move speed +{0}%, attack speed +{1}%.',
      '移動速度+{0}%、攻撃速度+{1}%。',
      '移动速度 +{0}%，攻击速度 +{1}%。',
    ),
    values: (lv) => [at([8, 15, 22], lv), at([8, 15, 22], lv)],
    apply: (o, lv) => {
      const v = at([0.08, 0.15, 0.22], lv);
      o.stats.moveSpeed *= 1 + v;
      o.stats.attackSpeedMult *= 1 + v;
    },
  },
  {
    id: 'hermes_dodge',
    kind: 'boon',
    god: 'hermes',
    rarity: 'rare',
    maxLevel: 3,
    name: L('잔상', 'Afterimage', '残像', '残影'),
    desc: L(
      '{0}% 확률로 피해를 완전히 회피한다.',
      '{0}% chance to avoid damage entirely.',
      '{0}%の確率でダメージを完全に回避する。',
      '有 {0}% 概率完全闪避伤害。',
    ),
    values: (lv) => [at([10, 18, 27], lv)],
    apply: (o, lv) => {
      o.stats.dodge += at([0.1, 0.18, 0.27], lv);
    },
  },
  {
    id: 'hermes_greed',
    kind: 'boon',
    god: 'hermes',
    rarity: 'common',
    maxLevel: 3,
    name: L('행운의 손', 'Lucky Hands', '幸運の手', '幸运之手'),
    desc: L(
      '획득 반경 +{0}%, 경험치 +{1}%, 골드 +{2}%.',
      'Pickup range +{0}%, experience +{1}%, gold +{2}%.',
      '取得範囲+{0}%、経験値+{1}%、ゴールド+{2}%。',
      '拾取范围 +{0}%，经验 +{1}%，金币 +{2}%。',
    ),
    values: (lv) => [at([40, 70, 105], lv), at([10, 18, 26], lv), at([10, 18, 26], lv)],
    apply: (o, lv) => {
      o.stats.pickupRadius *= 1 + at([0.4, 0.7, 1.05], lv);
      o.stats.xpMult += at([0.1, 0.18, 0.26], lv);
      o.stats.goldMult += at([0.1, 0.18, 0.26], lv);
    },
  },

  // --------------------------------------------------------------- Hades
  {
    id: 'hades_soul',
    kind: 'boon',
    god: 'hades',
    rarity: 'rare',
    maxLevel: 3,
    name: L('영혼 수확', 'Soul Harvest', '魂の収穫', '灵魂收割'),
    desc: L(
      '처치 시 {0}% 확률로 체력을 {1} 회복한다.',
      'Kills restore {1} health {0}% of the time.',
      '撃破時{0}%の確率で体力を{1}回復する。',
      '击杀时有 {0}% 概率恢复 {1} 生命。',
    ),
    values: (lv) => [at([15, 23, 32], lv), at([3, 5, 8], lv)],
    apply: (o, lv) => {
      o.mech.soulChance = at([0.15, 0.23, 0.32], lv);
      o.mech.soulHeal = at([3, 5, 8], lv);
    },
  },
  {
    id: 'hades_doom',
    kind: 'boon',
    god: 'hades',
    rarity: 'epic',
    maxLevel: 3,
    name: L('파멸 각인', 'Doom Sigil', '破滅の刻印', '厄运印记'),
    desc: L(
      '적중한 적에게 각인이 새겨져 {0}초 뒤 {1} 피해로 터진다.',
      'Marks the enemy; after {0}s the sigil detonates for {1} damage.',
      '命中した敵に刻印が刻まれ、{0}秒後に{1}ダメージで炸裂する。',
      '为敌人刻下印记，{0} 秒后引爆造成 {1} 伤害。',
    ),
    values: (lv) => [at([1.2, 1.0, 0.8], lv), at([42, 80, 130], lv)],
    apply: (o, lv) => {
      o.mech.doomDelay = at([1.2, 1.0, 0.8], lv);
      o.mech.doomDamage = at([42, 80, 130], lv);
    },
  },
  {
    id: 'hades_lastbreath',
    kind: 'boon',
    god: 'hades',
    rarity: 'common',
    maxLevel: 3,
    name: L('최후의 숨결', 'Last Breath', '最期の吐息', '最后一息'),
    desc: L(
      '처치 시 {0}% 확률로 반경 {1} 안에 {2} 피해로 폭발한다.',
      'Kills explode {0}% of the time for {2} damage within {1}.',
      '撃破時{0}%の確率で半径{1}内に{2}ダメージの爆発を起こす。',
      '击杀时有 {0}% 概率在半径 {1} 内爆炸造成 {2} 伤害。',
    ),
    values: (lv) => [at([20, 32, 46], lv), at([60, 78, 96], lv), at([26, 48, 76], lv)],
    apply: (o, lv) => {
      o.mech.lastBreathChance = at([0.2, 0.32, 0.46], lv);
      o.mech.lastBreathRadius = at([60, 78, 96], lv);
      o.mech.lastBreathDamage = at([26, 48, 76], lv);
    },
  },

  // ---------------------------------------------------------------- Gaia
  {
    id: 'gaia_bulwark',
    kind: 'boon',
    god: 'gaia',
    rarity: 'common',
    maxLevel: 3,
    name: L('대지의 성벽', 'Bulwark of Earth', '大地の城壁', '大地壁垒'),
    desc: L(
      '최대 체력 +{0}, 방어 +{1}.',
      'Max health +{0}, armor +{1}.',
      '最大体力+{0}、防御+{1}。',
      '生命上限 +{0}，护甲 +{1}。',
    ),
    values: (lv) => [at([25, 55, 90], lv), at([1, 2, 4], lv)],
    apply: (o, lv) => {
      o.stats.maxHp += at([25, 55, 90], lv);
      o.stats.armor += at([1, 2, 4], lv);
    },
  },
  {
    id: 'gaia_bloom',
    kind: 'boon',
    god: 'gaia',
    rarity: 'rare',
    maxLevel: 3,
    name: L('생명의 싹', 'Blooming Life', '生命の芽', '生命之芽'),
    desc: L(
      '초당 체력을 {0} 회복한다.',
      'Restore {0} health per second.',
      '毎秒{0}の体力を回復する。',
      '每秒恢复 {0} 点生命。',
    ),
    values: (lv) => [at([1.0, 2.0, 3.5], lv)],
    apply: (o, lv) => {
      o.stats.regen += at([1.0, 2.0, 3.5], lv);
    },
  },
  {
    id: 'gaia_thorns',
    kind: 'boon',
    god: 'gaia',
    rarity: 'epic',
    maxLevel: 3,
    name: L('가시덩굴', 'Thorned Vines', '茨の蔓', '荆棘藤蔓'),
    desc: L(
      '{0}초마다 주변에 가시 {1}개가 솟아 {2} 피해를 준다.',
      'Every {0}s, {1} thorns erupt around you for {2} damage.',
      '{0}秒ごとに周囲へ茨が{1}本突き出し、{2}ダメージを与える。',
      '每 {0} 秒在身周刺出 {1} 根荆棘，造成 {2} 伤害。',
    ),
    values: (lv) => [at([2.5, 2.0, 1.5], lv), at([3, 5, 7], lv), at([30, 52, 80], lv)],
    apply: (o, lv) => {
      o.mech.thornInterval = at([2.5, 2.0, 1.5], lv);
      o.mech.thornCount = at([3, 5, 7], lv);
      o.mech.thornDamage = at([30, 52, 80], lv);
    },
  },
];

/**
 * The three gods added after the first playtest. They sit behind Pantheon
 * unlocks, so their boons are deliberately a step above the starting pantheon
 * rather than sidegrades.
 */
const LATER_GODS: CardDef[] = [
  // ------------------------------------------------------------- Demeter
  {
    id: 'demeter_frost',
    kind: 'boon',
    god: 'demeter',
    rarity: 'common',
    maxLevel: 3,
    name: L('서리', 'Frost', '霜', '寒霜'),
    desc: L(
      '적중 시 {0}% 확률로 적을 {1}초 동안 빙결시킨다.',
      '{0}% chance on hit to freeze an enemy solid for {1}s.',
      '命中時{0}%の確率で敵を{1}秒間凍結させる。',
      '命中时有 {0}% 概率将敌人冰冻 {1} 秒。',
    ),
    values: (lv) => [at([18, 28, 40], lv), at([1.2, 1.6, 2.2], lv)],
    apply: (o, lv) => {
      o.mech.freezeChance = at([0.18, 0.28, 0.4], lv);
      o.mech.freezeDuration = Math.max(o.mech.freezeDuration, at([1.2, 1.6, 2.2], lv));
    },
  },
  {
    id: 'demeter_winter',
    kind: 'boon',
    god: 'demeter',
    rarity: 'rare',
    maxLevel: 3,
    name: L('겨울의 심판', "Winter's Judgement", '冬の審判', '寒冬审判'),
    desc: L(
      '빙결된 적에게 주는 피해 +{0}%. 빙결이 풀릴 때 {1} 파편 피해로 부서진다.',
      'Deal +{0}% damage to frozen enemies; the freeze shatters for {1} damage.',
      '凍結した敵へのダメージ+{0}%。凍結が解けると{1}の砕氷ダメージ。',
      '对冰冻敌人伤害 +{0}%；冰冻结束时炸裂造成 {1} 伤害。',
    ),
    values: (lv) => [at([35, 60, 95], lv), at([45, 90, 150], lv)],
    apply: (o, lv) => {
      o.mech.shatterBonus += at([0.35, 0.6, 0.95], lv);
      o.mech.shatterDamage += at([45, 90, 150], lv);
      // Pointless without a freeze source, so it brings a little of its own.
      o.mech.freezeChance = Math.max(o.mech.freezeChance, 0.12);
      o.mech.freezeDuration = Math.max(o.mech.freezeDuration, 1.0);
    },
  },
  {
    id: 'demeter_abundance',
    kind: 'boon',
    god: 'demeter',
    rarity: 'epic',
    maxLevel: 3,
    name: L('풍요', 'Abundance', '豊穣', '丰饶'),
    desc: L(
      '경험치 +{0}%. 처치 시 {1}% 확률로 치유의 열매가 떨어진다.',
      'Experience +{0}%. Kills drop healing fruit {1}% of the time.',
      '経験値+{0}%。撃破時{1}%の確率で癒やしの実を落とす。',
      '经验 +{0}%。击杀时有 {1}% 概率掉落治愈果实。',
    ),
    values: (lv) => [at([20, 35, 55], lv), at([6, 10, 16], lv)],
    apply: (o, lv) => {
      o.stats.xpMult += at([0.2, 0.35, 0.55], lv);
      o.mech.healDropChance = at([0.06, 0.1, 0.16], lv);
    },
  },

  // ------------------------------------------------------------- Artemis
  {
    id: 'artemis_mark',
    kind: 'boon',
    god: 'artemis',
    rarity: 'common',
    maxLevel: 3,
    name: L('사냥꾼의 표식', "Hunter's Mark", '狩人の印', '猎人印记'),
    desc: L(
      '치명타 확률 +{0}%, 치명타 피해 +{1}%.',
      'Critical chance +{0}%, critical damage +{1}%.',
      'クリティカル率+{0}%、クリティカルダメージ+{1}%。',
      '暴击率 +{0}%，暴击伤害 +{1}%。',
    ),
    values: (lv) => [at([10, 18, 28], lv), at([20, 40, 65], lv)],
    apply: (o, lv) => {
      o.stats.critChance += at([0.1, 0.18, 0.28], lv);
      o.stats.critMult += at([0.2, 0.4, 0.65], lv);
    },
  },
  {
    id: 'artemis_moonshaft',
    kind: 'boon',
    god: 'artemis',
    rarity: 'rare',
    maxLevel: 3,
    name: L('달빛 화살', 'Moonlit Shafts', '月光の矢', '月光之箭'),
    desc: L(
      '공격할 때마다 가까운 적을 쫓는 달빛 화살 {0}발이 함께 날아간다.',
      'Every attack also looses {0} moonlit shaft(s) that hunt nearby enemies.',
      '攻撃のたびに近くの敵を追う月光の矢が{0}本放たれる。',
      '每次攻击额外射出 {0} 支追踪附近敌人的月光之箭。',
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
    rarity: 'epic',
    maxLevel: 3,
    name: L('은빛 사냥', 'Silver Hunt', '銀の狩り', '银色狩猎'),
    desc: L(
      '치명타가 터질 때 반경 {0} 안에 피해의 {1}%가 흩뿌려진다.',
      'Critical hits scatter {1}% of their damage within {0}.',
      'クリティカル時、半径{0}内に威力の{1}%が飛び散る。',
      '暴击时在半径 {0} 内溅射 {1}% 的伤害。',
    ),
    values: (lv) => [at([70, 90, 115], lv), at([45, 70, 100], lv)],
    apply: (o, lv) => {
      o.mech.critSplashRadius = at([70, 90, 115], lv);
      o.mech.critSplashDamage = at([0.45, 0.7, 1.0], lv);
    },
  },

  // ----------------------------------------------------------- Dionysus
  {
    id: 'dionysus_draught',
    kind: 'boon',
    god: 'dionysus',
    rarity: 'common',
    maxLevel: 3,
    name: L('취기', 'Drunken Draught', '酔い', '醉意'),
    desc: L(
      '가한 피해의 {0}%만큼 체력을 회복한다.',
      'Heal for {0}% of the damage you deal.',
      '与えたダメージの{0}%だけ体力を回復する。',
      '按造成伤害的 {0}% 回复生命。',
    ),
    values: (lv) => [at([2, 4, 7], lv)],
    apply: (o, lv) => {
      o.mech.drain += at([0.02, 0.04, 0.07], lv);
    },
  },
  {
    id: 'dionysus_vine',
    kind: 'boon',
    god: 'dionysus',
    rarity: 'rare',
    maxLevel: 3,
    name: L('포도넝쿨', 'Vine Snare', '葡萄の蔓', '葡萄藤缚'),
    desc: L(
      '적중 시 {0}% 확률로 넝쿨이 적을 {1}초 동안 붙잡는다.',
      '{0}% chance on hit for vines to hold an enemy for {1}s.',
      '命中時{0}%の確率で蔓が敵を{1}秒間捕らえる。',
      '命中时有 {0}% 概率以藤蔓缠住敌人 {1} 秒。',
    ),
    values: (lv) => [at([14, 22, 32], lv), at([1.0, 1.4, 1.8], lv)],
    apply: (o, lv) => {
      o.mech.snareChance = at([0.14, 0.22, 0.32], lv);
      o.mech.snareDuration = at([1.0, 1.4, 1.8], lv);
    },
  },
  {
    id: 'dionysus_madness',
    kind: 'boon',
    god: 'dionysus',
    rarity: 'epic',
    maxLevel: 3,
    name: L('광기의 잔', 'Cup of Madness', '狂気の杯', '癫狂之杯'),
    desc: L(
      '체력이 높을수록 피해가 오른다. 가득 찼을 때 최대 +{0}%.',
      'The healthier you are the harder you hit: up to +{0}% at full health.',
      '体力が高いほどダメージが上がる。満タンで最大+{0}%。',
      '生命越高伤害越强，满血时最多 +{0}%。',
    ),
    values: (lv) => [at([25, 45, 70], lv)],
    apply: (o, lv) => {
      o.mech.zealBonus += at([0.25, 0.45, 0.7], lv);
    },
  },
];

BOONS.push(...LATER_GODS);

/** Boons grouped by their god, for the Pantheon codex. Built after every push. */
export const BOONS_BY_GOD: Record<GodId, CardDef[]> = BOONS.reduce(
  (acc, boon) => {
    const god = boon.god as GodId;
    (acc[god] ??= []).push(boon);
    return acc;
  },
  {} as Record<GodId, CardDef[]>,
);
