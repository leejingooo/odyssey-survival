import { L } from '../i18n';
import type { CardDef } from './cards';

/**
 * Level-up rewards: the hero's own body getting tougher and sharper. Chests
 * hand out gods and weapon work; levels hand out this.
 *
 * Two of them — Ambrosia and the Chalice — are deliberately temporary. They
 * are strong for the few levels they last, and the HUD counts them down, so a
 * level-up can be a burst of power rather than only a slow accumulation.
 */
export const PERKS: CardDef[] = [
  {
    id: 'perk_pomegranate',
    kind: 'perk',
    effect: 'attack',
    icon: '🍎',
    rarity: 'common',
    maxLevel: 8,
    name: L('완력의 석류', 'Pomegranate of Might', '力のザクロ', '力量石榴'),
    desc: L(
      '기본 공격 피해 +{0}%.',
      'Basic attack damage +{0}%.',
      '基本攻撃ダメージ+{0}%。',
      '普通攻击伤害 +{0}%。',
    ),
    values: (lv) => [10 * lv],
    apply: (o, lv) => {
      o.mech.basicDamageMult *= 1 + 0.1 * lv;
    },
  },
  {
    id: 'perk_wine',
    kind: 'perk',
    effect: 'passive',
    icon: '🍷',
    rarity: 'common',
    maxLevel: 8,
    name: L('영웅의 포도주', 'Hero’s Wine', '英雄の葡萄酒', '英雄之酒'),
    desc: L(
      '최대 체력 +{0}. 마신 만큼 그 자리에서 회복한다.',
      'Max health +{0}, and you drink it back on the spot.',
      '最大体力+{0}。飲んだぶんその場で回復する。',
      '生命上限 +{0}，并当场回复等量生命。',
    ),
    values: (lv) => [24 * lv],
    apply: (o, lv) => {
      o.stats.maxHp += 24 * lv;
    },
  },
  {
    id: 'perk_power',
    kind: 'perk',
    effect: 'passive',
    icon: '⚔️',
    rarity: 'rare',
    maxLevel: 6,
    name: L('전쟁의 정수', 'Essence of War', '戦の精髄', '战争精粹'),
    desc: L(
      '기본 공격이든 신의 힘이든, 모든 피해 +{0}%.',
      'Everything hits harder — basic attacks and divine powers alike: +{0}%.',
      '基本攻撃も神の力も、あらゆるダメージ+{0}%。',
      '无论普通攻击还是神明之力，全部伤害 +{0}%。',
    ),
    values: (lv) => [8 * lv],
    apply: (o, lv) => {
      o.stats.damageMult *= 1 + 0.08 * lv;
    },
  },
  {
    id: 'perk_speed',
    kind: 'perk',
    effect: 'passive',
    icon: '👟',
    rarity: 'common',
    maxLevel: 6,
    name: L('바람의 샌들', 'Sandals of Wind', '風のサンダル', '疾风凉鞋'),
    desc: L('이동 속도 +{0}%.', 'Move speed +{0}%.', '移動速度+{0}%。', '移动速度 +{0}%。'),
    values: (lv) => [6 * lv],
    apply: (o, lv) => {
      o.stats.moveSpeed *= 1 + 0.06 * lv;
    },
  },
  {
    id: 'perk_haste',
    kind: 'perk',
    effect: 'passive',
    icon: '⏳',
    rarity: 'rare',
    maxLevel: 6,
    name: L('시간의 모래', 'Sands of Time', '時の砂', '时之沙'),
    desc: L(
      '공격 속도 +{0}%, 스스로 발동하는 신의 능력이 {1}% 빨리 돌아온다.',
      'Attack speed +{0}%, and self-firing divine powers come back {1}% sooner.',
      '攻撃速度+{0}%、自動発動する神の力の再使用が{1}%短縮。',
      '攻击速度 +{0}%，自动触发的神明能力冷却缩短 {1}%。',
    ),
    values: (lv) => [7 * lv, 4 * lv],
    apply: (o, lv) => {
      o.stats.attackSpeedMult *= 1 + 0.07 * lv;
      o.stats.cooldownMult *= Math.max(0.4, 1 - 0.04 * lv);
    },
  },
  {
    id: 'perk_magnet',
    kind: 'perk',
    effect: 'passive',
    icon: '🧲',
    rarity: 'common',
    maxLevel: 4,
    name: L('자석석', 'Lodestone', '磁鉄の石', '磁石'),
    desc: L(
      '아이템 획득 범위 +{0}%.',
      'Pickup range +{0}%.',
      '取得範囲+{0}%。',
      '拾取范围 +{0}%。',
    ),
    values: (lv) => [30 * lv],
    apply: (o, lv) => {
      o.stats.pickupRadius *= 1 + 0.3 * lv;
    },
  },
  {
    id: 'perk_wisdom',
    kind: 'perk',
    effect: 'passive',
    icon: '👁️',
    rarity: 'common',
    maxLevel: 5,
    name: L('예언의 눈', 'Prophetic Eye', '予言の目', '预言之眼'),
    desc: L('경험치 +{0}%.', 'Experience +{0}%.', '経験値+{0}%。', '经验 +{0}%。'),
    values: (lv) => [15 * lv],
    apply: (o, lv) => {
      o.stats.xpMult += 0.15 * lv;
    },
  },
  {
    id: 'perk_armor',
    kind: 'perk',
    effect: 'passive',
    icon: '🥉',
    rarity: 'common',
    maxLevel: 5,
    name: L('청동 갑주', 'Bronze Panoply', '青銅の甲冑', '青铜战甲'),
    desc: L(
      '맞을 때마다 피해를 {0}씩 깎아낸다.',
      'Every hit you take lands {0} lighter.',
      '受けるダメージを毎回{0}減らす。',
      '每次受到的伤害都减少 {0} 点。',
    ),
    values: (lv) => [lv],
    apply: (o, lv) => {
      o.stats.armor += lv;
    },
  },
  {
    id: 'perk_greed',
    kind: 'perk',
    effect: 'passive',
    icon: '💰',
    rarity: 'common',
    maxLevel: 5,
    name: L('미다스의 손길', 'Midas Touch', 'ミダスの手', '弥达斯之触'),
    desc: L('획득 골드 +{0}%.', 'Gold gained +{0}%.', '獲得ゴールド+{0}%。', '获得金币 +{0}%。'),
    values: (lv) => [20 * lv],
    apply: (o, lv) => {
      o.stats.goldMult += 0.2 * lv;
    },
  },
  {
    id: 'perk_luck',
    kind: 'perk',
    effect: 'passive',
    icon: '🧵',
    rarity: 'epic',
    maxLevel: 3,
    name: L('운명의 실', 'Thread of Fate', '運命の糸', '命运之线'),
    desc: L(
      '앞으로 뽑는 카드가 눈에 띄게 좋아진다. 행운 +{0}.',
      'What you draw from here on gets visibly better. Luck +{0}.',
      'これから引くカードが目に見えて良くなる。運+{0}。',
      '此后抽到的卡明显更好。幸运 +{0}。',
    ),
    values: (lv) => [lv],
    apply: (o, lv) => {
      o.stats.luck += lv;
    },
  },

  // ---- temporary: strong while they last, gone in a few levels ------------
  {
    id: 'perk_ambrosia',
    kind: 'perk',
    effect: 'passive',
    icon: '🍯',
    rarity: 'rare',
    maxLevel: 5,
    temporaryLevels: 3,
    name: L('암브로시아', 'Ambrosia', 'アンブロシア', '神馔'),
    desc: L(
      '초당 체력 {0}씩 아문다. 신들의 음식은 오래가지 않는다 — 3번 레벨이 오르면 사라진다.',
      'Regenerate {0} health a second. Food of the gods does not keep: it fades after 3 level-ups.',
      '毎秒{0}ずつ癒える。神々の食べ物は長くもたない——3回レベルが上がれば消える。',
      '每秒回复 {0} 点生命。神明的食物存不住——升 3 级后消失。',
    ),
    values: (lv) => [(1.2 * lv).toFixed(1)],
    apply: (o, lv) => {
      o.stats.regen += 1.2 * lv;
    },
  },
  {
    id: 'perk_chalice',
    kind: 'perk',
    effect: 'trigger',
    icon: '🩸',
    rarity: 'rare',
    maxLevel: 5,
    temporaryLevels: 3,
    name: L('흡혈의 잔', 'Chalice of Blood', '吸血の杯', '嗜血之杯'),
    desc: L(
      '적을 쓰러뜨릴 때마다 체력 {0}을 마신다. 잔은 3번 레벨이 오르면 비워진다.',
      'Every kill is worth {0} health. The cup runs dry after 3 level-ups.',
      '敵を倒すたび体力{0}を飲む。杯は3回レベルが上がれば空になる。',
      '每次击杀畅饮 {0} 点生命。升 3 级后杯中见底。',
    ),
    values: (lv) => [2 * lv],
    apply: (o, lv) => {
      o.stats.lifesteal += 2 * lv;
    },
  },
];
