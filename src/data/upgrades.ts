import { L } from '../i18n';
import { at, type CardDef } from './cards';

/**
 * Upgrades to the hero's basic attack. These read the same for every hero —
 * "+1 projectile" means an extra arrow, an extra sword sweep, an extra boulder,
 * or a second pulse of Thanatos' shroud — so the pool never needs per-hero
 * variants.
 */
export const WEAPON_UPGRADES: CardDef[] = [
  {
    id: 'atk_damage',
    kind: 'weapon',
    rarity: 'common',
    maxLevel: 5,
    name: L('날카로움', 'Keen Edge', '鋭さ', '锋锐'),
    desc: L(
      '기본 공격 피해 +{0}%.',
      'Basic attack damage +{0}%.',
      '基本攻撃ダメージ+{0}%。',
      '普通攻击伤害 +{0}%。',
    ),
    values: (lv) => [at([12, 26, 42, 60, 80], lv)],
    apply: (o, lv) => {
      o.stats.damageMult *= 1 + at([0.12, 0.26, 0.42, 0.6, 0.8], lv);
    },
  },
  {
    id: 'atk_speed',
    kind: 'weapon',
    rarity: 'common',
    maxLevel: 5,
    name: L('신속한 손', 'Quick Hands', '素早い手', '疾手'),
    desc: L('공격 속도 +{0}%.', 'Attack speed +{0}%.', '攻撃速度+{0}%。', '攻击速度 +{0}%。'),
    values: (lv) => [at([10, 21, 33, 46, 62], lv)],
    apply: (o, lv) => {
      o.stats.attackSpeedMult *= 1 + at([0.1, 0.21, 0.33, 0.46, 0.62], lv);
    },
  },
  {
    id: 'atk_range',
    kind: 'weapon',
    rarity: 'common',
    maxLevel: 4,
    name: L('먼 사냥', 'Far Hunt', '遠き狩り', '远猎'),
    desc: L('공격 사거리 +{0}%.', 'Attack range +{0}%.', '攻撃射程+{0}%。', '攻击射程 +{0}%。'),
    values: (lv) => [at([15, 32, 52, 76], lv)],
    apply: (o, lv) => {
      o.stats.rangeMult *= 1 + at([0.15, 0.32, 0.52, 0.76], lv);
    },
  },
  {
    id: 'atk_size',
    kind: 'weapon',
    rarity: 'common',
    maxLevel: 4,
    name: L('확대', 'Broadened', '拡大', '扩张'),
    desc: L(
      '공격 판정 크기 +{0}%.',
      'Attack size +{0}%.',
      '攻撃判定サイズ+{0}%。',
      '攻击判定范围 +{0}%。',
    ),
    values: (lv) => [at([15, 32, 52, 76], lv)],
    apply: (o, lv) => {
      o.stats.sizeMult *= 1 + at([0.15, 0.32, 0.52, 0.76], lv);
    },
  },
  {
    id: 'atk_count',
    kind: 'weapon',
    rarity: 'epic',
    maxLevel: 3,
    name: L('다중 사격', 'Multishot', '多重射撃', '多重射击'),
    desc: L(
      '기본 공격이 {0}회 더 나간다.',
      'Your basic attack fires {0} more time(s).',
      '基本攻撃が{0}回追加で放たれる。',
      '普通攻击额外发射 {0} 次。',
    ),
    values: (lv) => [at([1, 2, 3], lv)],
    apply: (o, lv) => {
      o.stats.projectiles += at([1, 2, 3], lv);
    },
  },
  {
    id: 'atk_pierce',
    kind: 'weapon',
    rarity: 'rare',
    maxLevel: 3,
    name: L('관통', 'Piercing', '貫通', '贯穿'),
    desc: L(
      '공격이 적을 {0}명 더 관통한다.',
      'Attacks pierce {0} more enemies.',
      '攻撃が敵をさらに{0}体貫通する。',
      '攻击额外贯穿 {0} 名敌人。',
    ),
    values: (lv) => [at([1, 2, 4], lv)],
    apply: (o, lv) => {
      o.stats.pierce += at([1, 2, 4], lv);
    },
  },
  {
    id: 'atk_homing',
    kind: 'weapon',
    rarity: 'rare',
    maxLevel: 2,
    name: L('유도', 'Seeking', '誘導', '追踪'),
    desc: L(
      '공격이 가까운 적을 추적한다. (추적력 {0}%)',
      'Attacks curve toward nearby enemies. (tracking {0}%)',
      '攻撃が近くの敵を追尾する。（追尾力{0}%）',
      '攻击会追踪附近敌人。（追踪力 {0}%）',
    ),
    values: (lv) => [at([40, 80], lv)],
    apply: (o, lv) => {
      o.stats.homing = Math.max(o.stats.homing, at([0.4, 0.8], lv));
    },
  },
  {
    id: 'atk_crit',
    kind: 'weapon',
    rarity: 'rare',
    maxLevel: 4,
    name: L('급소 찌르기', 'Vital Strike', '急所突き', '致命一击'),
    desc: L(
      '치명타 확률 +{0}%, 치명타 피해 +{1}%.',
      'Critical chance +{0}%, critical damage +{1}%.',
      'クリティカル率+{0}%、クリティカルダメージ+{1}%。',
      '暴击率 +{0}%，暴击伤害 +{1}%。',
    ),
    values: (lv) => [at([7, 15, 24, 34], lv), at([15, 32, 52, 76], lv)],
    apply: (o, lv) => {
      o.stats.critChance += at([0.07, 0.15, 0.24, 0.34], lv);
      o.stats.critMult += at([0.15, 0.32, 0.52, 0.76], lv);
    },
  },
  {
    id: 'atk_infuse',
    kind: 'weapon',
    rarity: 'legendary',
    maxLevel: 3,
    name: L('신의 각인', 'Divine Infusion', '神の刻印', '神之铭刻'),
    desc: L(
      '기본 공격에 당신이 섬기는 신의 힘이 깃든다. (효과 {0}%)',
      'Your basic attack carries the power of the gods you serve. ({0}% potency)',
      '基本攻撃に、あなたが仕える神の力が宿る。（効果{0}%）',
      '普通攻击附带你所侍奉神明的力量。（效果 {0}%）',
    ),
    values: (lv) => [at([50, 85, 130], lv)],
    apply: (o, lv) => {
      o.mech.infusionPower = at([0.5, 0.85, 1.3], lv);
    },
  },
];
