import { L, type LocalizedText } from '../i18n';
import type { Loadout } from '../game/stats';
import type { CardDef, EffectKind, Rarity } from './cards';
import type { GodId } from './gods';

type N = number | string;
type Aspect = {
  id: string;
  god: GodId;
  effect: EffectKind;
  rarity: Rarity;
  icon: string;
  name: LocalizedText;
  desc: LocalizedText;
  values: (level: number) => N[];
  apply: (out: Loadout, level: number) => void;
};
const card = (a: Aspect): CardDef => ({ ...a, kind: 'boon', maxLevel: 3 });
const n = (lv: number, base: number, step = base) => base + (lv - 1) * step;

/**
 * Forty-five genuinely deity-specific expansion boons. Unlike the removed
 * Might/Refuge/Rite matrix, every row below extends its god's own combat
 * language and uses a mechanic that is already visible in the simulation.
 */
export const ASPECT_BOONS: CardDef[] = [
  // Ares: wounds, desperation, and rewards for violence.
  card({
    id: 'ares_rupture',
    god: 'ares',
    effect: 'attack',
    rarity: 'rare',
    icon: '🩸',
    name: L('찢긴 상처', 'Rupture', '裂傷', '撕裂伤'),
    desc: L(
      '출혈 피해 +{0}, 지속 시간 +{1}초.',
      'Bleed damage +{0}/s and duration +{1}s.',
      '出血ダメージ+{0}/秒、持続+{1}秒。',
      '流血每秒伤害 +{0}，持续时间 +{1} 秒。',
    ),
    values: (l) => [n(l, 5, 6), n(l, 0.5, 0.5)],
    apply: (o, l) => {
      o.mech.bleedDps += n(l, 5, 6);
      o.mech.bleedDuration += n(l, 0.5, 0.5);
    },
  }),
  card({
    id: 'ares_battle_trance',
    god: 'ares',
    effect: 'passive',
    rarity: 'epic',
    icon: '😡',
    name: L('전투 광기', 'Battle Trance', '戦闘狂気', '战斗狂热'),
    desc: L(
      '빈사 시 피해 보너스 +{0}%, 공격 속도 +{1}%.',
      'Low-health damage cap +{0}%; attack speed +{1}%.',
      '瀕死時ダメージ+{0}%、攻撃速度+{1}%。',
      '濒死伤害 +{0}%，攻击速度 +{1}%。',
    ),
    values: (l) => [n(l, 18, 17), n(l, 6, 6)],
    apply: (o, l) => {
      o.mech.wrathBonus += n(l, 0.18, 0.17);
      o.stats.attackSpeedMult *= 1 + n(l, 0.06, 0.06);
    },
  }),
  card({
    id: 'ares_spoils',
    god: 'ares',
    effect: 'trigger',
    rarity: 'rare',
    icon: '🏆',
    name: L('승자의 전리품', 'Spoils of War', '勝者の戦利品', '胜者战利品'),
    desc: L(
      '처치할 때 체력 {0} 회복, 처치 가속 지속 시간 +{1}초.',
      'Kills heal {0}; kill-haste lasts +{1}s.',
      '撃破時に体力{0}回復、撃破加速+{1}秒。',
      '击杀回复 {0} 生命，击杀加速延长 {1} 秒。',
    ),
    values: (l) => [n(l, 1, 1), n(l, 0.4, 0.4)],
    apply: (o, l) => {
      o.stats.lifesteal += n(l, 1, 1);
      o.mech.slaughterDuration += n(l, 0.4, 0.4);
    },
  }),

  // Athena: measured defence, retaliation, and shield discipline.
  card({
    id: 'athena_phalanx',
    god: 'athena',
    effect: 'passive',
    rarity: 'common',
    icon: '🪖',
    name: L('팔랑크스', 'Phalanx', 'ファランクス', '方阵'),
    desc: L(
      '방어력 +{0}, 공격 범위 +{1}%.',
      'Armour +{0}, attack range +{1}%.',
      '防御力+{0}、攻撃範囲+{1}%。',
      '护甲 +{0}，攻击范围 +{1}%。',
    ),
    values: (l) => [l, n(l, 7, 7)],
    apply: (o, l) => {
      o.stats.armor += l;
      o.stats.rangeMult *= 1 + n(l, 0.07, 0.07);
    },
  }),
  card({
    id: 'athena_riposte',
    god: 'athena',
    effect: 'trigger',
    rarity: 'rare',
    icon: '↩️',
    name: L('받아치기', 'Riposte', '返し技', '回击'),
    desc: L(
      '보호막 반격 피해 +{0}, 회피 확률 +{1}%.',
      'Shield retaliation +{0}; dodge chance +{1}%.',
      '盾の反撃ダメージ+{0}、回避率+{1}%。',
      '护盾反击伤害 +{0}，闪避率 +{1}%。',
    ),
    values: (l) => [n(l, 28, 30), n(l, 3, 3)],
    apply: (o, l) => {
      o.mech.reflectDamage += n(l, 28, 30);
      o.stats.dodge += n(l, 0.03, 0.03);
    },
  }),
  card({
    id: 'athena_watch',
    god: 'athena',
    effect: 'auto',
    rarity: 'epic',
    icon: '👁️',
    name: L('불침번', 'Unbroken Watch', '不寝の番', '不眠守望'),
    desc: L(
      '아이기스 재생 간격 -{0}초, 최대 보호막 +{1}.',
      'Aegis interval -{0}s, maximum shields +{1}.',
      'アイギス間隔-{0}秒、最大盾+{1}。',
      '埃癸斯间隔 -{0} 秒，最大护盾 +{1}。',
    ),
    values: (l) => [n(l, 0.4, 0.35).toFixed(2), l >= 3 ? 2 : 1],
    apply: (o, l) => {
      o.mech.aegisInterval =
        o.mech.aegisInterval > 0
          ? Math.max(1.5, o.mech.aegisInterval - n(l, 0.4, 0.35))
          : 8 - n(l, 0.4, 0.35);
      o.mech.aegisMax += l >= 3 ? 2 : 1;
    },
  }),

  // Hermes: velocity, cooldowns, and profitable luck.
  card({
    id: 'hermes_momentum',
    god: 'hermes',
    effect: 'passive',
    rarity: 'rare',
    icon: '🪽',
    name: L('가속의 여운', 'Momentum', '加速の余韻', '加速余韵'),
    desc: L(
      '이동 속도 +{0}%, 초과 이동 속도의 피해 전환 +{1}%.',
      'Move speed +{0}%; speed-to-damage conversion +{1}%.',
      '移動速度+{0}%、速度のダメージ変換+{1}%。',
      '移动速度 +{0}%，超额移速转伤害 +{1}%。',
    ),
    values: (l) => [n(l, 8, 8), n(l, 0.25, 0.2)],
    apply: (o, l) => {
      o.stats.moveSpeed *= 1 + n(l, 0.08, 0.08);
      o.mech.speedToDamage += n(l, 0.25, 0.2);
    },
  }),
  card({
    id: 'hermes_quicksilver',
    god: 'hermes',
    effect: 'passive',
    rarity: 'epic',
    icon: '💨',
    name: L('수은의 박자', 'Quicksilver Tempo', '水銀の拍子', '水银节拍'),
    desc: L(
      '신의 자동 능력 재사용 대기시간 -{0}%, 공격 속도 +{1}%.',
      'God-auto cooldowns -{0}%; attack speed +{1}%.',
      '神の自動能力CT-{0}%、攻撃速度+{1}%。',
      '神力自动技能冷却 -{0}%，攻击速度 +{1}%。',
    ),
    values: (l) => [n(l, 8, 7), n(l, 7, 7)],
    apply: (o, l) => {
      o.stats.cooldownMult *= 1 - n(l, 0.08, 0.07);
      o.stats.attackSpeedMult *= 1 + n(l, 0.07, 0.07);
    },
  }),
  card({
    id: 'hermes_smugglers_luck',
    god: 'hermes',
    effect: 'passive',
    rarity: 'rare',
    icon: '🪙',
    name: L('밀수꾼의 행운', 'Smuggler’s Luck', '密輸人の幸運', '走私者之运'),
    desc: L(
      '행운 +{0}, 획득 골드 +{1}%.',
      'Luck +{0}, gold gained +{1}%.',
      '幸運+{0}、獲得ゴールド+{1}%。',
      '幸运 +{0}，金币获取 +{1}%。',
    ),
    values: (l) => [l, n(l, 12, 12)],
    apply: (o, l) => {
      o.stats.luck += l;
      o.stats.goldMult *= 1 + n(l, 0.12, 0.12);
    },
  }),

  // Gaia.
  card({
    id: 'gaia_bedrock',
    god: 'gaia',
    effect: 'passive',
    rarity: 'common',
    icon: '🪨',
    name: L('기반암', 'Bedrock', '岩盤', '基岩'),
    desc: L(
      '최대 체력 +{0}, 방어력 +{1}.',
      'Max health +{0}, armour +{1}.',
      '最大体力+{0}、防御力+{1}。',
      '生命上限 +{0}，护甲 +{1}。',
    ),
    values: (l) => [n(l, 18, 20), l],
    apply: (o, l) => {
      o.stats.maxHp += n(l, 18, 20);
      o.stats.armor += l;
    },
  }),
  card({
    id: 'gaia_spring',
    god: 'gaia',
    effect: 'passive',
    rarity: 'rare',
    icon: '🌱',
    name: L('샘솟는 생명', 'Living Spring', '命の泉', '生命涌泉'),
    desc: L(
      '초당 체력 {0} 회복, 치유 열매 확률 +{1}%.',
      'Regenerate {0}/s; healing-fruit chance +{1}%.',
      '毎秒{0}回復、治癒の実の確率+{1}%。',
      '每秒回复 {0}，治疗果实概率 +{1}%。',
    ),
    values: (l) => [n(l, 0.6, 0.65).toFixed(2), n(l, 3, 3)],
    apply: (o, l) => {
      o.stats.regen += n(l, 0.6, 0.65);
      o.mech.healDropChance += n(l, 0.03, 0.03);
    },
  }),
  card({
    id: 'gaia_fault',
    god: 'gaia',
    effect: 'attack',
    rarity: 'epic',
    icon: '🌋',
    name: L('단층 파열', 'Faultline', '断層破裂', '断层爆裂'),
    desc: L(
      '충격 범위 +{0}, 밀쳐내기 +{1}.',
      'Impact radius +{0}, knockback +{1}.',
      '衝撃範囲+{0}、ノックバック+{1}。',
      '冲击范围 +{0}，击退 +{1}。',
    ),
    values: (l) => [n(l, 10, 10), n(l, 12, 12)],
    apply: (o, l) => {
      o.mech.splashRadius += n(l, 10, 10);
      o.mech.knockback += n(l, 12, 12);
    },
  }),

  // Poseidon.
  card({
    id: 'poseidon_undertow',
    god: 'poseidon',
    effect: 'attack',
    rarity: 'rare',
    icon: '🌊',
    name: L('역조', 'Undertow', '引き潮', '回流'),
    desc: L(
      '물보라 범위 +{0}, 물보라 피해 +{1}%.',
      'Splash radius +{0}, splash damage +{1}%.',
      '水飛沫範囲+{0}、水飛沫ダメージ+{1}%。',
      '水花范围 +{0}，水花伤害 +{1}%。',
    ),
    values: (l) => [n(l, 12, 12), n(l, 12, 13)],
    apply: (o, l) => {
      o.mech.splashRadius += n(l, 12, 12);
      o.mech.splashDamage += n(l, 0.12, 0.13);
    },
  }),
  card({
    id: 'poseidon_riptide',
    god: 'poseidon',
    effect: 'trigger',
    rarity: 'epic',
    icon: '🌀',
    name: L('이안류', 'Riptide', '離岸流', '离岸流'),
    desc: L(
      '물웅덩이 생성 확률 +{0}%, 둔화 +{1}%.',
      'Pool chance +{0}%, slow +{1}%.',
      '水溜まり確率+{0}%、鈍化+{1}%。',
      '水潭概率 +{0}%，减速 +{1}%。',
    ),
    values: (l) => [n(l, 8, 8), n(l, 6, 6)],
    apply: (o, l) => {
      o.mech.puddleChance += n(l, 0.08, 0.08);
      o.mech.puddleSlow += n(l, 0.06, 0.06);
    },
  }),
  card({
    id: 'poseidon_tempest',
    god: 'poseidon',
    effect: 'attack',
    rarity: 'epic',
    icon: '🔱',
    name: L('폭풍의 삼지창', 'Tempest Trident', '嵐の三叉槍', '风暴三叉戟'),
    desc: L(
      '삼지창 발동 주기 -{0}회, 강화 공격 피해 +{1}%.',
      'Trident cycle -{0} attacks; empowered damage +{1}%.',
      '三叉槍周期-{0}回、強化攻撃+{1}%。',
      '三叉戟周期 -{0} 次，强化攻击伤害 +{1}%。',
    ),
    values: (l) => [l, n(l, 20, 20)],
    apply: (o, l) => {
      o.mech.tridentEvery = o.mech.tridentEvery > 0 ? Math.max(2, o.mech.tridentEvery - l) : 7 - l;
      o.mech.tridentMult += n(l, 0.2, 0.2);
    },
  }),

  // Hades.
  card({
    id: 'hades_tithe',
    god: 'hades',
    effect: 'trigger',
    rarity: 'rare',
    icon: '🪙',
    name: L('망자의 십일조', 'Dead Man’s Tithe', '死者の十分の一', '亡者什一税'),
    desc: L(
      '영혼 수확 확률 +{0}%, 회복량 +{1}.',
      'Soul chance +{0}%, healing +{1}.',
      '魂の収穫率+{0}%、回復量+{1}。',
      '灵魂收割概率 +{0}%，回复 +{1}。',
    ),
    values: (l) => [n(l, 6, 6), n(l, 2, 2)],
    apply: (o, l) => {
      o.mech.soulChance += n(l, 0.06, 0.06);
      o.mech.soulHeal += n(l, 2, 2);
    },
  }),
  card({
    id: 'hades_sentence',
    god: 'hades',
    effect: 'attack',
    rarity: 'epic',
    icon: '⌛',
    name: L('죽음 선고', 'Death Sentence', '死の宣告', '死亡宣判'),
    desc: L(
      '파멸 각인 피해 +{0}, 폭발까지 걸리는 시간 -{1}초.',
      'Doom damage +{0}; detonation delay -{1}s.',
      '破滅ダメージ+{0}、起爆時間-{1}秒。',
      '厄运伤害 +{0}，引爆延迟 -{1} 秒。',
    ),
    values: (l) => [n(l, 18, 20), n(l, 0.2, 0.2).toFixed(1)],
    apply: (o, l) => {
      o.mech.doomDamage += n(l, 18, 20);
      o.mech.doomDelay =
        o.mech.doomDelay > 0
          ? Math.max(0.5, o.mech.doomDelay - n(l, 0.2, 0.2))
          : 2.5 - n(l, 0.2, 0.2);
    },
  }),
  card({
    id: 'hades_eclipse',
    god: 'hades',
    effect: 'passive',
    rarity: 'legendary',
    icon: '🌑',
    name: L('검은 일식', 'Black Eclipse', '黒い日蝕', '黑日蚀'),
    desc: L(
      '즉시 수확 기준 +{0}%, 모든 피해 +{1}%.',
      'Reap threshold +{0}%, all damage +{1}%.',
      '刈り取り閾値+{0}%、全ダメージ+{1}%。',
      '收割阈值 +{0}%，所有伤害 +{1}%。',
    ),
    values: (l) => [n(l, 2, 2), n(l, 5, 5)],
    apply: (o, l) => {
      o.mech.reapThreshold += n(l, 0.02, 0.02);
      o.stats.damageMult *= 1 + n(l, 0.05, 0.05);
    },
  }),

  // Apollo.
  card({
    id: 'apollo_sunray',
    god: 'apollo',
    effect: 'auto',
    rarity: 'epic',
    icon: '☀️',
    name: L('정오의 광선', 'Noonday Ray', '真昼の光線', '正午光束'),
    desc: L(
      '태양 광선 피해 +{0}, 발동 간격 -{1}초.',
      'Sunbeam damage +{0}, interval -{1}s.',
      '太陽光線ダメージ+{0}、間隔-{1}秒。',
      '日光束伤害 +{0}，间隔 -{1} 秒。',
    ),
    values: (l) => [n(l, 22, 24), n(l, 0.25, 0.2)],
    apply: (o, l) => {
      o.mech.beamDamage += n(l, 22, 24);
      o.mech.beamInterval =
        o.mech.beamInterval > 0
          ? Math.max(1.5, o.mech.beamInterval - n(l, 0.25, 0.2))
          : 5 - n(l, 0.25, 0.2);
    },
  }),
  card({
    id: 'apollo_medicine',
    god: 'apollo',
    effect: 'passive',
    rarity: 'rare',
    icon: '🎵',
    name: L('의술의 찬가', 'Hymn of Medicine', '医術の讃歌', '医术赞歌'),
    desc: L(
      '초당 체력 {0} 회복, 레벨 상승 회복 +{1}%.',
      'Regenerate {0}/s; level-up healing +{1}%.',
      '毎秒{0}回復、レベルアップ回復+{1}%。',
      '每秒回复 {0}，升级回复 +{1}%。',
    ),
    values: (l) => [n(l, 0.4, 0.45).toFixed(2), n(l, 2, 2)],
    apply: (o, l) => {
      o.stats.regen += n(l, 0.4, 0.45);
      o.mech.levelHeal += n(l, 0.02, 0.02);
    },
  }),
  card({
    id: 'apollo_corona',
    god: 'apollo',
    effect: 'attack',
    rarity: 'rare',
    icon: '🌞',
    name: L('태양의 코로나', 'Solar Corona', '太陽コロナ', '日冕'),
    desc: L(
      '화상 피해 +{0}, 지속 시간 +{1}초.',
      'Burn damage +{0}/s, duration +{1}s.',
      '炎上ダメージ+{0}/秒、持続+{1}秒。',
      '灼烧每秒伤害 +{0}，持续 +{1} 秒。',
    ),
    values: (l) => [n(l, 5, 5), n(l, 0.6, 0.6)],
    apply: (o, l) => {
      o.mech.burnDps += n(l, 5, 5);
      o.mech.burnDuration += n(l, 0.6, 0.6);
    },
  }),

  // Aphrodite.
  card({
    id: 'aphrodite_glance',
    god: 'aphrodite',
    effect: 'attack',
    rarity: 'rare',
    icon: '💘',
    name: L('첫눈에 반한 마음', 'Love at First Sight', '一目惚れ', '一见倾心'),
    desc: L(
      '매혹 확률 +{0}%, 지속 시간 +{1}초.',
      'Charm chance +{0}%, duration +{1}s.',
      '魅了率+{0}%、持続+{1}秒。',
      '魅惑概率 +{0}%，持续 +{1} 秒。',
    ),
    values: (l) => [n(l, 5, 5), n(l, 0.4, 0.4)],
    apply: (o, l) => {
      o.mech.charmChance += n(l, 0.05, 0.05);
      o.mech.charmDuration += n(l, 0.4, 0.4);
    },
  }),
  card({
    id: 'aphrodite_rejection',
    god: 'aphrodite',
    effect: 'trigger',
    rarity: 'epic',
    icon: '💔',
    name: L('냉정한 거절', 'Cruel Rejection', '冷酷な拒絶', '无情拒绝'),
    desc: L(
      '상심 폭발 피해 +{0}, 반경 +{1}.',
      'Heartbreak damage +{0}, radius +{1}.',
      '失恋爆発ダメージ+{0}、範囲+{1}。',
      '心碎爆炸伤害 +{0}，范围 +{1}。',
    ),
    values: (l) => [n(l, 20, 22), n(l, 8, 8)],
    apply: (o, l) => {
      o.mech.heartbreakDamage += n(l, 20, 22);
      o.mech.heartbreakRadius += n(l, 8, 8);
      o.mech.charmChance = Math.max(o.mech.charmChance, 0.08);
    },
  }),
  card({
    id: 'aphrodite_grace',
    god: 'aphrodite',
    effect: 'passive',
    rarity: 'rare',
    icon: '🕊️',
    name: L('거부할 수 없는 우아함', 'Irresistible Grace', '抗えぬ優雅', '无法抗拒的优雅'),
    desc: L(
      '약화 효과 +{0}%, 회피 확률 +{1}%.',
      'Weaken strength +{0}%, dodge +{1}%.',
      '弱体効果+{0}%、回避率+{1}%。',
      '虚弱效果 +{0}%，闪避 +{1}%。',
    ),
    values: (l) => [n(l, 5, 5), n(l, 3, 3)],
    apply: (o, l) => {
      o.mech.weakenAmount += n(l, 0.05, 0.05);
      o.stats.dodge += n(l, 0.03, 0.03);
    },
  }),

  // Hephaestus.
  card({
    id: 'hephaestus_quench',
    god: 'hephaestus',
    effect: 'attack',
    rarity: 'rare',
    icon: '⚒️',
    name: L('담금질', 'Quenched Edge', '焼き入れ', '淬火锋刃'),
    desc: L(
      '기본 공격 피해 +{0}%, 화상 피해 +{1}.',
      'Basic damage +{0}%, burn damage +{1}/s.',
      '基本攻撃+{0}%、炎上+{1}/秒。',
      '普通攻击伤害 +{0}%，灼烧每秒伤害 +{1}。',
    ),
    values: (l) => [n(l, 8, 8), n(l, 3, 3)],
    apply: (o, l) => {
      o.mech.basicDamageMult *= 1 + n(l, 0.08, 0.08);
      o.mech.burnDps += n(l, 3, 3);
    },
  }),
  card({
    id: 'hephaestus_foundry',
    god: 'hephaestus',
    effect: 'auto',
    rarity: 'epic',
    icon: '⚙️',
    name: L('살아 있는 주조소', 'Living Foundry', '生ける鋳造所', '活体铸造厂'),
    desc: L(
      '청동 자동인형 +{0}기, 자동인형 피해 +{1}.',
      '+{0} automaton, automaton damage +{1}.',
      '自動人形+{0}、ダメージ+{1}。',
      '青铜自动人偶 +{0}，伤害 +{1}。',
    ),
    values: (l) => [l >= 3 ? 2 : 1, n(l, 10, 12)],
    apply: (o, l) => {
      o.mech.automatons += l >= 3 ? 2 : 1;
      o.mech.automatonDamage += n(l, 10, 12);
    },
  }),
  card({
    id: 'hephaestus_bronzewall',
    god: 'hephaestus',
    effect: 'passive',
    rarity: 'common',
    icon: '🥉',
    name: L('청동 성벽', 'Bronze Wall', '青銅の城壁', '青铜壁垒'),
    desc: L(
      '방어력 +{0}, 보호막 반격 피해 +{1}.',
      'Armour +{0}, shield retaliation +{1}.',
      '防御力+{0}、盾反撃+{1}。',
      '护甲 +{0}，护盾反击伤害 +{1}。',
    ),
    values: (l) => [l, n(l, 14, 16)],
    apply: (o, l) => {
      o.stats.armor += l;
      o.mech.reflectDamage += n(l, 14, 16);
    },
  }),

  // Zeus.
  card({
    id: 'zeus_fork',
    god: 'zeus',
    effect: 'attack',
    rarity: 'rare',
    icon: '⚡',
    name: L('갈래 번개', 'Forked Lightning', '枝分かれの雷', '分叉闪电'),
    desc: L(
      '사슬 번개 도약 +{0}회, 도약 피해 +{1}%.',
      'Chain jumps +{0}, chain damage +{1}%.',
      '連鎖回数+{0}、連鎖ダメージ+{1}%。',
      '连锁次数 +{0}，连锁伤害 +{1}%。',
    ),
    values: (l) => [l, n(l, 8, 8)],
    apply: (o, l) => {
      o.mech.chainJumps += l;
      o.mech.chainDamage += n(l, 0.08, 0.08);
    },
  }),
  card({
    id: 'zeus_stormeye',
    god: 'zeus',
    effect: 'trigger',
    rarity: 'epic',
    icon: '🌩️',
    name: L('폭풍의 눈', 'Eye of the Storm', '嵐の目', '风暴之眼'),
    desc: L(
      '피격 방전 반경 +{0}, 피해 +{1}.',
      'Hit-discharge radius +{0}, damage +{1}.',
      '被弾放電範囲+{0}、ダメージ+{1}。',
      '受击放电范围 +{0}，伤害 +{1}。',
    ),
    values: (l) => [n(l, 10, 10), n(l, 18, 20)],
    apply: (o, l) => {
      o.mech.staticRadius += n(l, 10, 10);
      o.mech.staticDamage += n(l, 18, 20);
    },
  }),
  card({
    id: 'zeus_edict',
    god: 'zeus',
    effect: 'auto',
    rarity: 'legendary',
    icon: '🏛️',
    name: L('하늘의 칙령', 'Edict of Heaven', '天の勅令', '天穹敕令'),
    desc: L(
      '벼락 피해 +{0}, 발동 간격 -{1}초.',
      'Bolt damage +{0}, interval -{1}s.',
      '落雷ダメージ+{0}、間隔-{1}秒。',
      '雷击伤害 +{0}，间隔 -{1} 秒。',
    ),
    values: (l) => [n(l, 26, 28), n(l, 0.3, 0.25)],
    apply: (o, l) => {
      o.mech.boltDamage += n(l, 26, 28);
      o.mech.boltInterval =
        o.mech.boltInterval > 0
          ? Math.max(1.2, o.mech.boltInterval - n(l, 0.3, 0.25))
          : 5.5 - n(l, 0.3, 0.25);
    },
  }),

  // Hestia.
  card({
    id: 'hestia_kindling',
    god: 'hestia',
    effect: 'attack',
    rarity: 'rare',
    icon: '🪵',
    name: L('불쏘시개', 'Kindling', '焚き付け', '引火物'),
    desc: L(
      '화상 피해 +{0}, 지속 시간 +{1}초.',
      'Burn damage +{0}/s, duration +{1}s.',
      '炎上+{0}/秒、持続+{1}秒。',
      '灼烧每秒伤害 +{0}，持续 +{1} 秒。',
    ),
    values: (l) => [n(l, 4, 5), n(l, 0.8, 0.8)],
    apply: (o, l) => {
      o.mech.burnDps += n(l, 4, 5);
      o.mech.burnDuration += n(l, 0.8, 0.8);
    },
  }),
  card({
    id: 'hestia_sanctuary',
    god: 'hestia',
    effect: 'passive',
    rarity: 'epic',
    icon: '🏠',
    name: L('성소의 불', 'Sanctuary Flame', '聖域の火', '圣所之火'),
    desc: L(
      '멈춰 있을 때 피해 +{0}%, 초당 회복 +{1}.',
      'Stillness damage +{0}%, regeneration +{1}/s.',
      '静止中ダメージ+{0}%、毎秒回復+{1}。',
      '静止时伤害 +{0}%，每秒回复 +{1}。',
    ),
    values: (l) => [n(l, 12, 12), n(l, 0.5, 0.5)],
    apply: (o, l) => {
      o.mech.hearthDamage += n(l, 0.12, 0.12);
      o.mech.hearthRegen += n(l, 0.5, 0.5);
    },
  }),
  card({
    id: 'hestia_second_spark',
    god: 'hestia',
    effect: 'trigger',
    rarity: 'legendary',
    icon: '🔥',
    name: L('두 번째 불씨', 'Second Spark', '二つ目の火種', '第二火种'),
    desc: L(
      '불사 부활 체력 +{0}%, 무적 시간 +{1}초.',
      'Flame-revival health +{0}%, invulnerability +{1}s.',
      '炎の復活体力+{0}%、無敵+{1}秒。',
      '火焰复生生命 +{0}%，无敌 +{1} 秒。',
    ),
    values: (l) => [n(l, 8, 8), n(l, 0.5, 0.5)],
    apply: (o, l) => {
      o.mech.everlastingFlame += n(l, 0.08, 0.08);
      o.mech.flameInvuln += n(l, 0.5, 0.5);
    },
  }),

  // Dionysus.
  card({
    id: 'dionysus_vintage',
    god: 'dionysus',
    effect: 'passive',
    rarity: 'rare',
    icon: '🍷',
    name: L('숙성된 포도주', 'Aged Vintage', '熟成酒', '陈年佳酿'),
    desc: L(
      '준 피해의 {0}%를 체력으로 흡수, 처치 회복 +{1}.',
      'Drain {0}% of damage; kills heal +{1}.',
      '与ダメージの{0}%吸収、撃破回復+{1}。',
      '吸取伤害的 {0}%，击杀回复 +{1}。',
    ),
    values: (l) => [n(l, 1.5, 1.5), l],
    apply: (o, l) => {
      o.mech.drain += n(l, 0.015, 0.015);
      o.stats.lifesteal += l;
    },
  }),
  card({
    id: 'dionysus_overgrowth',
    god: 'dionysus',
    effect: 'attack',
    rarity: 'epic',
    icon: '🍇',
    name: L('무성한 포도덩굴', 'Wild Overgrowth', '葡萄の繁茂', '疯长葡萄藤'),
    desc: L(
      '속박 확률 +{0}%, 지속 시간 +{1}초.',
      'Snare chance +{0}%, duration +{1}s.',
      '拘束率+{0}%、持続+{1}秒。',
      '束缚概率 +{0}%，持续 +{1} 秒。',
    ),
    values: (l) => [n(l, 6, 6), n(l, 0.5, 0.5)],
    apply: (o, l) => {
      o.mech.snareChance += n(l, 0.06, 0.06);
      o.mech.snareDuration += n(l, 0.5, 0.5);
    },
  }),
  card({
    id: 'dionysus_revel',
    god: 'dionysus',
    effect: 'passive',
    rarity: 'rare',
    icon: '🎭',
    name: L('끝없는 향연', 'Endless Revel', '終わらぬ宴', '无尽狂欢'),
    desc: L(
      '체력이 가득할 때 피해 보너스 +{0}%, 행운 +{1}.',
      'Full-health damage cap +{0}%, luck +{1}.',
      '満タン時ダメージ+{0}%、幸運+{1}。',
      '满生命伤害 +{0}%，幸运 +{1}。',
    ),
    values: (l) => [n(l, 12, 12), l],
    apply: (o, l) => {
      o.mech.zealBonus += n(l, 0.12, 0.12);
      o.stats.luck += l;
    },
  }),

  // Hera.
  card({
    id: 'hera_decree',
    god: 'hera',
    effect: 'attack',
    rarity: 'rare',
    icon: '📜',
    name: L('여왕의 칙명', 'Royal Decree', '女王の勅命', '女王敕令'),
    desc: L(
      '낙인 확률 +{0}%, 낙인 피해 증폭 +{1}%.',
      'Mark chance +{0}%, marked damage +{1}%.',
      '刻印率+{0}%、刻印ダメージ+{1}%。',
      '烙印概率 +{0}%，烙印增伤 +{1}%。',
    ),
    values: (l) => [n(l, 5, 5), n(l, 5, 5)],
    apply: (o, l) => {
      o.mech.markChance += n(l, 0.05, 0.05);
      o.mech.markAmount += n(l, 0.05, 0.05);
    },
  }),
  card({
    id: 'hera_court',
    god: 'hera',
    effect: 'passive',
    rarity: 'epic',
    icon: '👑',
    name: L('침묵하는 궁정', 'Silent Court', '静かなる宮廷', '寂静宫廷'),
    desc: L(
      '위압 반경 +{0}, 적 약화 +{1}%.',
      'Command aura +{0} radius, weaken +{1}%.',
      '威圧範囲+{0}、弱体+{1}%。',
      '威压范围 +{0}，敌人虚弱 +{1}%。',
    ),
    values: (l) => [n(l, 15, 15), n(l, 4, 4)],
    apply: (o, l) => {
      o.mech.auraRadius += n(l, 15, 15);
      o.mech.auraWeaken += n(l, 0.04, 0.04);
    },
  }),
  card({
    id: 'hera_oath',
    god: 'hera',
    effect: 'passive',
    rarity: 'legendary',
    icon: '🤝',
    name: L('신성한 동맹', 'Sacred Alliance', '神聖同盟', '神圣盟约'),
    desc: L(
      '모시는 신마다 피해 +{0}%, 최대 체력 +{1}.',
      'Per god: damage +{0}%, max health +{1}.',
      '神一柱ごとにダメージ+{0}%、体力+{1}。',
      '每位神明提供伤害 +{0}%、生命上限 +{1}。',
    ),
    values: (l) => [n(l, 2, 2), n(l, 5, 5)],
    apply: (o, l) => {
      o.mech.allianceBonus += n(l, 0.02, 0.02);
      o.mech.allianceHealth += n(l, 5, 5);
    },
  }),

  // Artemis.
  card({
    id: 'artemis_starfall',
    god: 'artemis',
    effect: 'attack',
    rarity: 'epic',
    icon: '🌠',
    name: L('별비', 'Starfall Volley', '星降る矢', '星落箭雨'),
    desc: L(
      '공격마다 유도 달빛 화살 +{0}발.',
      '+{0} homing moonshaft per attack.',
      '攻撃ごとに追尾月光矢+{0}。',
      '每次攻击追加 {0} 支追踪月光箭。',
    ),
    values: (l) => [l],
    apply: (o, l) => {
      o.mech.moonshafts += l;
    },
  }),
  card({
    id: 'artemis_quarry',
    god: 'artemis',
    effect: 'passive',
    rarity: 'rare',
    icon: '🐾',
    name: L('사냥감의 흔적', 'Quarry’s Trail', '獲物の足跡', '猎物踪迹'),
    desc: L(
      '유도 성능 +{0}%, 치명타 확률 +{1}%.',
      'Homing +{0}%, critical chance +{1}%.',
      '誘導+{0}%、クリティカル率+{1}%。',
      '追踪性能 +{0}%，暴击率 +{1}%。',
    ),
    values: (l) => [n(l, 18, 18), n(l, 4, 4)],
    apply: (o, l) => {
      o.stats.homing = Math.min(1, o.stats.homing + n(l, 0.18, 0.18));
      o.stats.critChance += n(l, 0.04, 0.04);
    },
  }),
  card({
    id: 'artemis_bloodmoon',
    god: 'artemis',
    effect: 'trigger',
    rarity: 'legendary',
    icon: '🌕',
    name: L('핏빛 보름달', 'Blood Moon', '血の満月', '血月'),
    desc: L(
      '치명타 폭발 반경 +{0}, 전이 피해 +{1}%.',
      'Critical splash radius +{0}, damage +{1}%.',
      '会心爆発範囲+{0}、伝播ダメージ+{1}%。',
      '暴击溅射范围 +{0}，传递伤害 +{1}%。',
    ),
    values: (l) => [n(l, 10, 10), n(l, 12, 12)],
    apply: (o, l) => {
      o.mech.critSplashRadius += n(l, 10, 10);
      o.mech.critSplashDamage += n(l, 0.12, 0.12);
    },
  }),

  // Demeter.
  card({
    id: 'demeter_permafrost',
    god: 'demeter',
    effect: 'attack',
    rarity: 'rare',
    icon: '🧊',
    name: L('영구 동토', 'Permafrost', '永久凍土', '永久冻土'),
    desc: L(
      '빙결 확률 +{0}%, 지속 시간 +{1}초.',
      'Freeze chance +{0}%, duration +{1}s.',
      '凍結率+{0}%、持続+{1}秒。',
      '冰冻概率 +{0}%，持续 +{1} 秒。',
    ),
    values: (l) => [n(l, 5, 5), n(l, 0.35, 0.35)],
    apply: (o, l) => {
      o.mech.freezeChance += n(l, 0.05, 0.05);
      o.mech.freezeDuration += n(l, 0.35, 0.35);
    },
  }),
  card({
    id: 'demeter_bounty',
    god: 'demeter',
    effect: 'trigger',
    rarity: 'common',
    icon: '🌾',
    name: L('풍요로운 수확', 'Bountiful Harvest', '豊穣の収穫', '丰饶收获'),
    desc: L(
      '경험치 +{0}%, 치유 열매 확률 +{1}%.',
      'Experience +{0}%, healing-fruit chance +{1}%.',
      '経験値+{0}%、治癒の実+{1}%。',
      '经验 +{0}%，治疗果实概率 +{1}%。',
    ),
    values: (l) => [n(l, 8, 8), n(l, 4, 4)],
    apply: (o, l) => {
      o.stats.xpMult *= 1 + n(l, 0.08, 0.08);
      o.mech.healDropChance += n(l, 0.04, 0.04);
    },
  }),
  card({
    id: 'demeter_whiteout',
    god: 'demeter',
    effect: 'trigger',
    rarity: 'epic',
    icon: '🌨️',
    name: L('백색 폭풍', 'Whiteout', '白い嵐', '白色风暴'),
    desc: L(
      '빙결 대상 추가 피해 +{0}%, 해빙 폭발 피해 +{1}.',
      'Frozen-target damage +{0}%, thaw burst +{1}.',
      '凍結対象ダメージ+{0}%、解凍爆発+{1}。',
      '对冰冻目标伤害 +{0}%，解冻爆炸伤害 +{1}。',
    ),
    values: (l) => [n(l, 10, 10), n(l, 16, 18)],
    apply: (o, l) => {
      o.mech.shatterBonus += n(l, 0.1, 0.1);
      o.mech.shatterDamage += n(l, 16, 18);
    },
  }),
];
