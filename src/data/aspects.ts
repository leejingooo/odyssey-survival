import { L, type LocalizedText } from '../i18n';
import type { Loadout } from '../game/stats';
import { type CardDef } from './cards';
import { GOD_IDS, type GodId } from './gods';

/**
 * Three secondary paths for every deity. The original boons define signature
 * mechanics; these aspects let a player bend that identity toward force,
 * endurance, or tempo instead of seeing the same three cards every voyage.
 */
const EPITHETS: Record<GodId, LocalizedText> = {
  ares: L('전장의', 'Warborn', '戦場の', '战场'),
  athena: L('올빼미의', 'Owl-Eyed', '梟眼の', '鸮眼'),
  hermes: L('날개 달린', 'Winged', '翼ある', '飞翼'),
  gaia: L('태고의', 'Primeval', '太古の', '太古'),
  poseidon: L('심해의', 'Deep-Sea', '深海の', '深海'),
  hades: L('명계의', 'Underworld', '冥府の', '冥界'),
  apollo: L('찬란한', 'Radiant', '輝ける', '辉耀'),
  aphrodite: L('장미빛', 'Rose-Touched', '薔薇色の', '玫瑰'),
  hephaestus: L('담금질한', 'Tempered', '鍛えし', '淬火'),
  zeus: L('천둥의', 'Thunderous', '雷鳴の', '雷霆'),
  hestia: L('화로의', 'Hearth-Kept', '炉守の', '炉火'),
  dionysus: L('황홀한', 'Ecstatic', '陶酔の', '狂欢'),
  hera: L('왕권의', 'Regal', '王権の', '王权'),
  artemis: L('은빛', 'Silver', '銀月の', '银月'),
  demeter: L('겨울의', 'Winter-Bound', '冬籠りの', '凛冬'),
};

const PATHS = [
  {
    id: 'might',
    icon: '⚔️',
    effect: 'passive' as const,
    rarity: 'rare' as const,
    name: L('권능', 'Might', '権能', '威能'),
    desc: L(
      '피해 +{0}%, 치명타 확률 +{1}%.',
      'Damage +{0}%, critical chance +{1}%.',
      'ダメージ+{0}%、クリティカル率+{1}%。',
      '伤害 +{0}%，暴击率 +{1}%。',
    ),
    values: (lv: number, bias: number) => [8 * lv + bias, 2 * lv + (bias % 3)],
    apply: (o: Loadout, lv: number, bias: number) => {
      o.stats.damageMult *= 1 + (8 * lv + bias) / 100;
      o.stats.critChance += (2 * lv + (bias % 3)) / 100;
    },
  },
  {
    id: 'refuge',
    icon: '🛡️',
    effect: 'passive' as const,
    rarity: 'common' as const,
    name: L('가호', 'Refuge', '加護', '庇护'),
    desc: L(
      '최대 체력 +{0}, 초당 회복 +{1}.',
      'Max health +{0}, regeneration +{1}/s.',
      '最大体力+{0}、毎秒回復+{1}。',
      '生命上限 +{0}，每秒回复 +{1}。',
    ),
    values: (lv: number, bias: number) => [12 * lv + bias, (0.15 * lv + bias * 0.01).toFixed(2)],
    apply: (o: Loadout, lv: number, bias: number) => {
      o.stats.maxHp += 12 * lv + bias;
      o.stats.regen += 0.15 * lv + bias * 0.01;
    },
  },
  {
    id: 'rite',
    icon: '🌀',
    effect: 'passive' as const,
    rarity: 'epic' as const,
    name: L('의식', 'Rite', '秘儀', '秘仪'),
    desc: L(
      '공격 속도 +{0}%, 이동 속도 +{1}%.',
      'Attack speed +{0}%, move speed +{1}%.',
      '攻撃速度+{0}%、移動速度+{1}%。',
      '攻击速度 +{0}%，移动速度 +{1}%。',
    ),
    values: (lv: number, bias: number) => [5 * lv + (bias % 4), 4 * lv + (bias % 3)],
    apply: (o: Loadout, lv: number, bias: number) => {
      o.stats.attackSpeedMult *= 1 + (5 * lv + (bias % 4)) / 100;
      o.stats.moveSpeed *= 1 + (4 * lv + (bias % 3)) / 100;
    },
  },
] as const;

export const ASPECT_BOONS: CardDef[] = GOD_IDS.flatMap((god, godIndex) =>
  PATHS.map((path) => ({
    id: `${god}_aspect_${path.id}`,
    kind: 'boon' as const,
    god,
    effect: path.effect,
    icon: path.icon,
    rarity: path.rarity,
    maxLevel: 3,
    name: {
      ko: `${EPITHETS[god].ko} ${path.name.ko}`,
      en: `${EPITHETS[god].en} ${path.name.en}`,
      ja: `${EPITHETS[god].ja}${path.name.ja}`,
      zh: `${EPITHETS[god].zh}${path.name.zh}`,
    },
    desc: path.desc,
    values: (lv: number) => path.values(lv, godIndex),
    apply: (out: Loadout, lv: number) => path.apply(out, lv, godIndex),
  })),
);
