import type { SaveData } from '../core/storage';
import { L, t, type DictKey, type LocalizedText } from '../i18n';

/**
 * The twelve Olympians in full — both canonical rosters, so Hestia and
 * Dionysus are both here — plus Hades and Gaia, who are not Olympians but who
 * this particular Odyssey could hardly do without.
 */
export type GodId =
  | 'zeus'
  | 'hera'
  | 'poseidon'
  | 'demeter'
  | 'athena'
  | 'apollo'
  | 'artemis'
  | 'ares'
  | 'aphrodite'
  | 'hephaestus'
  | 'hermes'
  | 'hestia'
  | 'dionysus'
  | 'hades'
  | 'gaia';

export interface GodDef {
  id: GodId;
  /** primary colour: cards, VFX, the HUD strip and infused projectiles */
  color: string;
  /** lighter accent for glows and particles */
  accent: string;
  /** one emblem, used everywhere the god is named */
  emblem: string;
  /** 0 = available from the very first voyage */
  unlockCost: number;
  /** what Divine Infusion does when this god rides the basic attack */
  infusion: LocalizedText;
}

export const GODS: Record<GodId, GodDef> = {
  ares: {
    id: 'ares',
    color: '#d43f43',
    accent: '#ff9a86',
    emblem: '⚔️',
    unlockCost: 0,
    infusion: L(
      '체력이 30% 아래로 떨어진 적을 처형한다. 그런 적에게 주는 피해가 크게 는다.',
      'Executes the wounded: heavily increased damage to enemies below 30% health.',
      '体力が30%を切った敵を処刑する。その敵へのダメージが大きく上がる。',
      '处决残血：对生命低于 30% 的敌人造成大幅提升的伤害。',
    ),
  },
  athena: {
    id: 'athena',
    color: '#c9b98f',
    accent: '#f4ead0',
    emblem: '🛡️',
    unlockCost: 0,
    infusion: L(
      '방어를 꿰뚫는 일격이 한 번 더 들어간다.',
      'Lands a second strike that ignores armour.',
      '防御を貫く一撃がもう一度入る。',
      '追加一次无视护甲的打击。',
    ),
  },
  hermes: {
    id: 'hermes',
    color: '#66d69b',
    accent: '#c9ffe4',
    emblem: '🪽',
    unlockCost: 0,
    infusion: L(
      '일정 확률로 기본 공격이 곧바로 한 번 더 나간다.',
      'A chance for the basic attack to immediately fire a second time.',
      '一定確率で基本攻撃がすぐにもう一度放たれる。',
      '有几率让普通攻击立刻再打出一次。',
    ),
  },
  gaia: {
    id: 'gaia',
    color: '#7fa055',
    accent: '#d3e7ac',
    emblem: '🌿',
    unlockCost: 0,
    infusion: L(
      '적을 때릴 때마다 대지의 기운이 감돌아 잠시 방어가 오른다.',
      'Every hit draws up the earth, raising your armour for a moment.',
      '敵を打つたびに大地の気が巡り、しばし防御が上がる。',
      '每次命中都会引动地气，短暂提升护甲。',
    ),
  },
  poseidon: {
    id: 'poseidon',
    color: '#3fa9d8',
    accent: '#b3ecff',
    emblem: '🔱',
    unlockCost: 0,
    infusion: L(
      '적을 뒤로 밀쳐내고 흠뻑 적셔 느리게 만든다.',
      'Shoves the target back and leaves it soaked and slow.',
      '敵を後ろへ押し戻し、ずぶ濡れにして鈍らせる。',
      '将目标击退，并让它浑身湿透、行动迟缓。',
    ),
  },
  hades: {
    id: 'hades',
    color: '#8b6be0',
    accent: '#d5c2ff',
    emblem: '💀',
    unlockCost: 400,
    infusion: L(
      '적의 최대 체력에 비례한 고정 피해가 더해진다. 덩치가 클수록 아프다.',
      'Adds damage scaled to the target’s max health — the bigger it is, the worse it hurts.',
      '敵の最大体力に応じた固定ダメージが加わる。大きいほど痛い。',
      '追加与目标生命上限成正比的伤害——越大的东西越吃痛。',
    ),
  },
  apollo: {
    id: 'apollo',
    color: '#f0a03c',
    accent: '#ffd9a0',
    emblem: '☀️',
    unlockCost: 600,
    infusion: L(
      '적을 불태운다. 화상은 시간이 지나며 계속 깎아낸다.',
      'Sets the target alight; the burn keeps eating away at it.',
      '敵を燃やす。火傷は時間とともに削り続ける。',
      '点燃目标，灼烧会持续侵蚀它。',
    ),
  },
  aphrodite: {
    id: 'aphrodite',
    color: '#e072b4',
    accent: '#ffc9e8',
    emblem: '💗',
    unlockCost: 700,
    infusion: L(
      '적중한 자리로 주변의 적들이 홀린 듯 끌려온다. 몰아놓고 쓸어담기 좋다.',
      'Nearby enemies are drawn to the point of impact — herd them, then sweep.',
      '命中地点へ周囲の敵が惹かれて集まる。まとめて薙ぎ払える。',
      '附近敌人被吸向命中点——先聚拢，再横扫。',
    ),
  },
  hephaestus: {
    id: 'hephaestus',
    color: '#e0663a',
    accent: '#ffb98a',
    emblem: '🔨',
    unlockCost: 850,
    infusion: L(
      '적중 지점이 불꽃과 함께 터진다.',
      'The point of impact bursts into flame.',
      '命中地点が炎とともに炸裂する。',
      '命中点随火焰一同炸开。',
    ),
  },
  zeus: {
    id: 'zeus',
    color: '#f2d24b',
    accent: '#fff6c2',
    emblem: '⚡',
    unlockCost: 1000,
    infusion: L(
      '적중 지점에서 전기가 사방으로 터진다. 옆으로 튀는 사슬 번개와는 다른 모양이다.',
      'Electricity bursts outward from the impact — a different shape from the chain that leaps sideways.',
      '命中地点から電撃が四方へ炸裂する。横へ跳ぶ連鎖の雷とは別物だ。',
      '雷电自命中点向四周炸开——与横向弹射的连锁闪电是两回事。',
    ),
  },
  hestia: {
    id: 'hestia',
    color: '#e8894c',
    accent: '#ffd0a8',
    emblem: '🔥',
    unlockCost: 1150,
    infusion: L(
      '적중한 자리에 불씨가 남는다. 밟는 적은 계속 타들어 간다.',
      'Leaves embers where it lands; anything that walks through keeps burning.',
      '命中した場所に燃えさしが残る。踏んだ敵は燃え続ける。',
      '命中处留下余烬，踏入的敌人会持续燃烧。',
    ),
  },
  dionysus: {
    id: 'dionysus',
    color: '#a03060',
    accent: '#f09ac4',
    emblem: '🍷',
    unlockCost: 1300,
    infusion: L(
      '적을 취하게 만든다. 취한 적은 비틀거리며 엉뚱한 데로 걸어간다.',
      'Leaves the target drunk — it staggers off in the wrong direction.',
      '敵を酔わせる。酔った敵はふらついて見当違いの方へ歩く。',
      '让目标醉倒，它会踉跄着走向错误的方向。',
    ),
  },
  hera: {
    id: 'hera',
    color: '#9b6fd4',
    accent: '#dcc4ff',
    emblem: '👑',
    unlockCost: 1500,
    infusion: L(
      '여왕의 위압에 눌린 적은 잠시 힘을 잃는다. 공격력과 이동 속도가 함께 떨어진다.',
      'The queen’s presence cows the target: its damage and its speed both drop.',
      '女王の威圧に押された敵はしばし力を失う。攻撃力も移動速度も落ちる。',
      '被女王威压慑住的敌人会短暂失力，攻击与移动同时下降。',
    ),
  },
  artemis: {
    id: 'artemis',
    color: '#b9c6e6',
    accent: '#f4f8ff',
    emblem: '🌙',
    unlockCost: 1700,
    infusion: L(
      '기본 공격이 스스로 적을 쫓는다. 이제 조준은 사냥꾼의 몫이 아니다.',
      'The basic attack hunts on its own — aiming stops being your problem.',
      '基本攻撃が自ら敵を追う。もう狙いはあなたの仕事ではない。',
      '普通攻击会自行追猎——瞄准不再是你的事。',
    ),
  },
  demeter: {
    id: 'demeter',
    color: '#7fd4c1',
    accent: '#e2fff8',
    emblem: '❄️',
    unlockCost: 2000,
    infusion: L(
      '기본 공격에 빙결 확률이 붙는다. 서리 축복이 있다면 확률은 합쳐진다.',
      'Adds a freeze chance to the basic attack; it stacks with the Frost boon.',
      '基本攻撃に凍結の確率が付く。「霜」の恩恵とは確率が合算される。',
      '为普通攻击附加冰冻几率，与「寒霜」祝福的几率叠加。',
    ),
  },
};

/** Free gods first, then by price — the order the player meets them in. */
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

/** The cheapest god the player has not bought yet — the "next goal" nudge. */
export function nextGodToUnlock(save: SaveData): GodDef | null {
  for (const id of GOD_IDS) {
    if (!godUnlocked(save, id)) return GODS[id];
  }
  return null;
}
