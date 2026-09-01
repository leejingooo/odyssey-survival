import { L, t, type DictKey, type LocalizedText } from '../i18n';
import type { SaveData } from '../core/storage';

export type GodId =
  | 'zeus'
  | 'poseidon'
  | 'ares'
  | 'athena'
  | 'aphrodite'
  | 'hermes'
  | 'hades'
  | 'gaia'
  | 'demeter'
  | 'artemis'
  | 'dionysus';

export interface GodDef {
  id: GodId;
  /** primary colour, used for boon cards, VFX and the HUD strip */
  color: string;
  /** lighter accent for glows, particles and infused projectiles */
  accent: string;
  /**
   * Gold price in the Pantheon. 0 means the god is available from the very
   * first voyage; the rest are the long-term reason to keep sailing.
   */
  unlockCost: number;
}

export const GODS: Record<GodId, GodDef> = {
  ares: { id: 'ares', color: '#d43f43', accent: '#ff9a86', unlockCost: 0 },
  athena: { id: 'athena', color: '#c9b98f', accent: '#f4ead0', unlockCost: 0 },
  hermes: { id: 'hermes', color: '#66d69b', accent: '#c9ffe4', unlockCost: 0 },
  gaia: { id: 'gaia', color: '#7fa055', accent: '#d3e7ac', unlockCost: 0 },
  poseidon: { id: 'poseidon', color: '#3fa9d8', accent: '#b3ecff', unlockCost: 0 },
  hades: { id: 'hades', color: '#8b6be0', accent: '#d5c2ff', unlockCost: 500 },
  aphrodite: { id: 'aphrodite', color: '#e072b4', accent: '#ffc9e8', unlockCost: 700 },
  zeus: { id: 'zeus', color: '#f2d24b', accent: '#fff6c2', unlockCost: 900 },
  dionysus: { id: 'dionysus', color: '#a03060', accent: '#f09ac4', unlockCost: 1100 },
  artemis: { id: 'artemis', color: '#b9c6e6', accent: '#f4f8ff', unlockCost: 1400 },
  demeter: { id: 'demeter', color: '#7fd4c1', accent: '#e2fff8', unlockCost: 1700 },
};

/** Display order: free gods first, then by price. */
export const GOD_IDS = (Object.keys(GODS) as GodId[]).sort(
  (a, b) => GODS[a].unlockCost - GODS[b].unlockCost,
);

export function godName(id: GodId): string {
  return t(`god.${id}` as DictKey);
}

export function godTitle(id: GodId): string {
  return t(`god.${id}.title` as DictKey);
}

export function godQuote(id: GodId): string {
  return t(`story.boon.${id}` as DictKey);
}

export function godUnlocked(save: SaveData, id: GodId): boolean {
  return GODS[id].unlockCost === 0 || save.unlockedGods.includes(id);
}

/** Every god whose boons may appear in this save's chests. */
export function availableGods(save: SaveData): Set<GodId> {
  return new Set(GOD_IDS.filter((id) => godUnlocked(save, id)));
}

/**
 * What Divine Infusion does when this god rides the basic attack. Shown in the
 * Pantheon so the player can plan a build before ever seeing the card.
 */
export const GOD_INFUSION: Record<GodId, LocalizedText> = {
  zeus: L(
    '적중 지점에서 전기가 사방으로 방사된다.',
    'Lightning radiates outward from the point of impact.',
    '命中地点から電撃が四方へ放射される。',
    '雷电自命中点向四周放射。',
  ),
  poseidon: L(
    '적중 시 주변의 적을 밀쳐내고 물보라 피해를 준다.',
    'Impacts shove nearby enemies back in a burst of spray.',
    '命中時、周囲の敵を押し返し水しぶきのダメージ。',
    '命中时击退周围敌人并造成水花伤害。',
  ),
  ares: L(
    '적중한 적이 출혈한다.',
    'Struck enemies bleed.',
    '命中した敵が出血する。',
    '被击中的敌人流血不止。',
  ),
  athena: L(
    '방어를 무시하는 추가 피해가 더해진다.',
    'Adds a second, precise strike that ignores the target.',
    '追撃となる正確な一撃が加わる。',
    '追加一次精准的额外打击。',
  ),
  aphrodite: L(
    '적중한 적이 나른해져 약해진다.',
    'Struck enemies grow languid and weak.',
    '命中した敵は気だるくなり弱体化する。',
    '被击中的敌人变得慵懒虚弱。',
  ),
  hermes: L(
    '일정 확률로 공격 재사용 시간이 절반으로 줄어든다.',
    'A chance to halve the current attack cooldown.',
    '一定確率で攻撃の再使用時間が半分になる。',
    '有几率将当前攻击冷却减半。',
  ),
  hades: L(
    '적중한 적에게 파멸의 각인이 새겨진다.',
    'Brands the struck enemy with a doom sigil.',
    '命中した敵に破滅の刻印が刻まれる。',
    '为被击中的敌人刻上厄运印记。',
  ),
  gaia: L(
    '일정 확률로 발밑에서 가시가 솟는다.',
    'A chance for thorns to erupt beneath the target.',
    '一定確率で足元から茨が突き出す。',
    '有几率在目标脚下刺出荆棘。',
  ),
  demeter: L(
    '일정 확률로 적을 그 자리에 얼려버린다.',
    'A chance to freeze the target where it stands.',
    '一定確率で敵をその場に凍りつかせる。',
    '有几率将敌人当场冻结。',
  ),
  artemis: L(
    '치명타 확률이 크게 오른다.',
    'Greatly raises the critical chance of the shot.',
    'その一撃のクリティカル率が大きく上がる。',
    '大幅提升该次攻击的暴击率。',
  ),
  dionysus: L(
    '입힌 피해의 일부를 체력으로 흡수한다.',
    'Drinks back part of the damage dealt as health.',
    '与えたダメージの一部を体力として吸収する。',
    '将造成伤害的一部分吸收为生命。',
  ),
};
