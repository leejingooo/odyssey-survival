import { L } from '../i18n';
import type { CardDef } from './cards';

/**
 * Level-up rewards: the quiet, always-useful stat cards. Chests hand out gods
 * and weapon work; levels hand out the hero's own body getting tougher.
 */
export const PERKS: CardDef[] = [
  {
    id: 'perk_hp',
    kind: 'perk',
    rarity: 'common',
    maxLevel: 8,
    name: L('힘의 석류', 'Pomegranate of Might', '力のザクロ', '力量石榴'),
    desc: L(
      '최대 체력 +{0} (즉시 회복).',
      'Max health +{0} and heal for it.',
      '最大体力+{0}（即時回復）。',
      '生命上限 +{0}（并立即回复）。',
    ),
    values: (lv) => [22 * lv],
    apply: (o, lv) => {
      o.stats.maxHp += 22 * lv;
    },
  },
  {
    id: 'perk_power',
    kind: 'perk',
    rarity: 'rare',
    maxLevel: 8,
    name: L('전쟁의 정수', 'Essence of War', '戦の精髄', '战争精粹'),
    desc: L('모든 피해 +{0}%.', 'All damage +{0}%.', '全ダメージ+{0}%。', '全部伤害 +{0}%。'),
    values: (lv) => [8 * lv],
    apply: (o, lv) => {
      o.stats.damageMult *= 1 + 0.08 * lv;
    },
  },
  {
    id: 'perk_speed',
    kind: 'perk',
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
    rarity: 'rare',
    maxLevel: 6,
    name: L('시간의 모래', 'Sands of Time', '時の砂', '时之沙'),
    desc: L(
      '공격 속도 +{0}%, 신의 능력 재사용 {1}% 감소.',
      'Attack speed +{0}%, god ability cooldowns -{1}%.',
      '攻撃速度+{0}%、神の能力の再使用-{1}%。',
      '攻击速度 +{0}%，神明能力冷却 -{1}%。',
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
    rarity: 'common',
    maxLevel: 4,
    name: L('자석의 돌', 'Lodestone', '磁鉄の石', '磁石'),
    desc: L('획득 반경 +{0}%.', 'Pickup range +{0}%.', '取得範囲+{0}%。', '拾取范围 +{0}%。'),
    values: (lv) => [30 * lv],
    apply: (o, lv) => {
      o.stats.pickupRadius *= 1 + 0.3 * lv;
    },
  },
  {
    id: 'perk_wisdom',
    kind: 'perk',
    rarity: 'common',
    maxLevel: 5,
    name: L('예언의 눈', 'Prophetic Eye', '予言の目', '预言之眼'),
    desc: L(
      '획득 경험치 +{0}%.',
      'Experience gained +{0}%.',
      '獲得経験値+{0}%。',
      '获得经验 +{0}%。',
    ),
    values: (lv) => [15 * lv],
    apply: (o, lv) => {
      o.stats.xpMult += 0.15 * lv;
    },
  },
  {
    id: 'perk_armor',
    kind: 'perk',
    rarity: 'common',
    maxLevel: 5,
    name: L('청동 갑주', 'Bronze Panoply', '青銅の甲冑', '青铜战甲'),
    desc: L(
      '받는 피해가 {0} 감소한다.',
      'Incoming damage reduced by {0}.',
      '受けるダメージが{0}減少する。',
      '受到的伤害减少 {0}。',
    ),
    values: (lv) => [lv],
    apply: (o, lv) => {
      o.stats.armor += lv;
    },
  },
  {
    id: 'perk_regen',
    kind: 'perk',
    rarity: 'rare',
    maxLevel: 5,
    name: L('암브로시아', 'Ambrosia', 'アンブロシア', '神馔'),
    desc: L(
      '초당 체력 {0} 회복.',
      'Restore {0} health per second.',
      '毎秒{0}の体力を回復。',
      '每秒恢复 {0} 生命。',
    ),
    values: (lv) => [(0.5 * lv).toFixed(1)],
    apply: (o, lv) => {
      o.stats.regen += 0.5 * lv;
    },
  },
  {
    id: 'perk_vampire',
    kind: 'perk',
    rarity: 'rare',
    maxLevel: 5,
    name: L('흡혈의 잔', 'Chalice of Blood', '吸血の杯', '嗜血之杯'),
    desc: L(
      '처치할 때마다 체력 {0} 회복.',
      'Each kill restores {0} health.',
      '撃破ごとに体力{0}回復。',
      '每次击杀恢复 {0} 生命。',
    ),
    values: (lv) => [lv],
    apply: (o, lv) => {
      o.stats.lifesteal += lv;
    },
  },
  {
    id: 'perk_greed',
    kind: 'perk',
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
    rarity: 'epic',
    maxLevel: 3,
    name: L('운명의 실', 'Thread of Fate', '運命の糸', '命运之线'),
    desc: L(
      '희귀한 카드가 나올 확률이 크게 오른다. (행운 {0})',
      'Rare cards appear far more often. (luck {0})',
      'レアなカードの出現率が大きく上がる。（運{0}）',
      '稀有卡牌出现率大幅提升。（幸运 {0}）',
    ),
    values: (lv) => [lv],
    apply: (o, lv) => {
      o.stats.luck += lv;
    },
  },
];
