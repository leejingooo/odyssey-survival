import { L, type LocalizedText } from '../i18n';
import type { Loadout } from '../game/stats';
import { at, type CardDef } from './cards';
import type { GodId } from './gods';

type Aspect = {
  god: GodId;
  id: string;
  rarity: CardDef['rarity'];
  effect: CardDef['effect'];
  name: LocalizedText;
  desc: LocalizedText;
  values: (level: number) => (number | string)[];
  apply: (out: Loadout, level: number) => void;
};

/**
 * The second half of the pantheon is deliberately written card by card.
 * Do not turn this back into a god × stat-path matrix: these cards extend the
 * deity's verbs and several also bootstrap the mechanic they improve, so an
 * aspect is never a dead first pick.
 */
const aspect = (a: Aspect): CardDef => ({ kind: 'boon', maxLevel: 3, ...a });
const n = (xs: number[], lv: number) => at(xs, lv);

export const ASPECT_BOONS: CardDef[] = [
  // Ares — bleeding, fighting at death's door, and kill momentum.
  aspect({
    god: 'ares',
    id: 'ares_aspect_deep_wound',
    rarity: 'common',
    effect: 'attack',
    name: L('벌어진 상처', 'Open Wound', '開いた傷', '裂开的伤口'),
    desc: L(
      '출혈이 {0}초 길어지고 초당 피해가 {1} 증가한다.',
      'Bleeds last {0}s longer and deal {1} more damage each second.',
      '出血が{0}秒延び、毎秒ダメージが{1}増える。',
      '流血延长 {0} 秒，每秒伤害增加 {1}。',
    ),
    values: (lv) => [n([1, 2, 3], lv), n([5, 10, 17], lv)],
    apply: (o, lv) => {
      o.mech.bleedDuration = Math.max(3, o.mech.bleedDuration) + n([1, 2, 3], lv);
      o.mech.bleedDps += n([5, 10, 17], lv);
    },
  }),
  aspect({
    god: 'ares',
    id: 'ares_aspect_last_stand',
    rarity: 'rare',
    effect: 'passive',
    name: L('최후의 광전사', 'Last Berserker', '最後の狂戦士', '末路狂战士'),
    desc: L(
      '잃은 체력에 따른 피해 보너스가 빈사에서 최대 +{0}%가 된다.',
      'Missing health grants up to +{0}% damage at death’s door.',
      '失った体力に応じ、瀕死時に最大+{0}%のダメージ。',
      '损失生命会提高伤害，濒死时最多 +{0}%。',
    ),
    values: (lv) => [n([35, 60, 95], lv)],
    apply: (o, lv) => {
      o.mech.wrathBonus += n([0.35, 0.6, 0.95], lv);
    },
  }),
  aspect({
    god: 'ares',
    id: 'ares_aspect_war_tithe',
    rarity: 'epic',
    effect: 'trigger',
    name: L('전쟁의 공물', 'War Tithe', '戦の供物', '战争贡品'),
    desc: L(
      '처치하면 체력 {0}을 회복하고 {1}초 동안 공격 속도가 +{2}% 빨라진다.',
      'Kills heal {0} and grant +{2}% attack speed for {1}s.',
      '敵を倒すと体力を{0}回復し、{1}秒間攻撃速度+{2}%。',
      '击杀回复 {0} 生命，并在 {1} 秒内获得 +{2}% 攻速。',
    ),
    values: (lv) => [n([1, 2, 3], lv), n([2, 3, 4], lv), n([20, 35, 55], lv)],
    apply: (o, lv) => {
      o.stats.lifesteal += n([1, 2, 3], lv);
      o.mech.slaughterDuration = Math.max(o.mech.slaughterDuration, n([2, 3, 4], lv));
      o.mech.slaughterHaste += n([0.2, 0.35, 0.55], lv);
    },
  }),

  // Athena — formation, shield retaliation, and renewable Aegis.
  aspect({
    god: 'athena',
    id: 'athena_aspect_phalanx',
    rarity: 'common',
    effect: 'passive',
    name: L('팔랑크스', 'Phalanx', 'ファランクス', '方阵'),
    desc: L(
      '방어 +{0}, 사거리 +{1}%. 물러서지 않는 대형을 갖춘다.',
      'Armour +{0} and range +{1}%, a formation that refuses to yield.',
      '防御+{0}、射程+{1}%。退かぬ陣形を組む。',
      '护甲 +{0}，射程 +{1}%，结成不退的阵线。',
    ),
    values: (lv) => [n([2, 4, 6], lv), n([10, 20, 32], lv)],
    apply: (o, lv) => {
      o.stats.armor += n([2, 4, 6], lv);
      o.stats.rangeMult *= 1 + n([0.1, 0.2, 0.32], lv);
    },
  }),
  aspect({
    god: 'athena',
    id: 'athena_aspect_mirror_shield',
    rarity: 'rare',
    effect: 'trigger',
    name: L('거울 방패', 'Mirror Shield', '鏡の盾', '明镜之盾'),
    desc: L(
      '보호막이 깨질 때 주변에 {0} 피해를 준다. {1}초마다 보호막도 생성한다.',
      'A broken shield deals {0} nearby damage; gain a shield every {1}s.',
      '盾が砕けると周囲へ{0}ダメージ。{1}秒ごとに盾も得る。',
      '护盾破碎时对周围造成 {0} 伤害；每 {1} 秒生成护盾。',
    ),
    values: (lv) => [n([70, 125, 200], lv), n([10, 8, 6], lv)],
    apply: (o, lv) => {
      o.mech.reflectDamage += n([70, 125, 200], lv);
      o.mech.aegisMax = Math.max(o.mech.aegisMax, 1);
      o.mech.aegisInterval = o.mech.aegisInterval
        ? Math.min(o.mech.aegisInterval, n([10, 8, 6], lv))
        : n([10, 8, 6], lv);
    },
  }),
  aspect({
    god: 'athena',
    id: 'athena_aspect_aegis_cycle',
    rarity: 'epic',
    effect: 'auto',
    name: L('아이기스의 순환', 'Aegis Cycle', 'アイギスの循環', '神盾轮转'),
    desc: L(
      '아이기스 재생 간격이 {0}초가 되고 최대 {1}겹까지 쌓인다.',
      'Aegis renews every {0}s and stores up to {1} shields.',
      'アイギスが{0}秒ごとに再生し、最大{1}枚蓄える。',
      '神盾每 {0} 秒再生，最多储存 {1} 层。',
    ),
    values: (lv) => [n([7, 5, 3.5], lv), n([2, 3, 4], lv)],
    apply: (o, lv) => {
      o.mech.aegisInterval = o.mech.aegisInterval
        ? Math.min(o.mech.aegisInterval, n([7, 5, 3.5], lv))
        : n([7, 5, 3.5], lv);
      o.mech.aegisMax = Math.max(o.mech.aegisMax, n([2, 3, 4], lv));
    },
  }),

  // Hermes — speed conversion, divine tempo, and fortune.
  aspect({
    god: 'hermes',
    id: 'hermes_aspect_momentum',
    rarity: 'common',
    effect: 'passive',
    name: L('질주의 관성', 'Running Momentum', '疾走の慣性', '疾驰惯性'),
    desc: L(
      '이동 속도 +{0}%. 기본 이동 속도를 넘긴 1%마다 피해 +{1}%.',
      'Move speed +{0}%; each 1% above base speed grants +{1}% damage.',
      '移動速度+{0}%。基準を超えた1%ごとにダメージ+{1}%。',
      '移动速度 +{0}%；每超出基础速度 1%，伤害 +{1}%。',
    ),
    values: (lv) => [n([12, 22, 34], lv), n([0.5, 0.8, 1.2], lv)],
    apply: (o, lv) => {
      o.stats.moveSpeed *= 1 + n([0.12, 0.22, 0.34], lv);
      o.mech.speedToDamage += n([0.5, 0.8, 1.2], lv);
    },
  }),
  aspect({
    god: 'hermes',
    id: 'hermes_aspect_quick_prayer',
    rarity: 'rare',
    effect: 'passive',
    name: L('빠른 기도', 'Quick Prayer', '早駆けの祈り', '迅捷祷告'),
    desc: L(
      '신의 자동 능력 재사용 대기시간 -{0}%.',
      'God ability cooldowns are {0}% shorter.',
      '神の自動能力の再使用時間-{0}%。',
      '神明自动能力冷却时间缩短 {0}%。',
    ),
    values: (lv) => [n([12, 22, 34], lv)],
    apply: (o, lv) => {
      o.stats.cooldownMult *= 1 - n([0.12, 0.22, 0.34], lv);
    },
  }),
  aspect({
    god: 'hermes',
    id: 'hermes_aspect_fortunate_purse',
    rarity: 'epic',
    effect: 'passive',
    name: L('행운의 전대', 'Fortunate Purse', '幸運の財布', '幸运钱袋'),
    desc: L(
      '골드 획득 +{0}%, 행운 +{1}%.',
      'Gold gained +{0}% and luck +{1}%.',
      'ゴールド獲得+{0}%、幸運+{1}%。',
      '金币获取 +{0}%，幸运 +{1}%。',
    ),
    values: (lv) => [n([30, 55, 90], lv), n([12, 22, 35], lv)],
    apply: (o, lv) => {
      o.stats.goldMult += n([0.3, 0.55, 0.9], lv);
      o.stats.luck += n([0.12, 0.22, 0.35], lv);
    },
  }),

  // Gaia — bedrock, fruit, and erupting earth.
  aspect({
    god: 'gaia',
    id: 'gaia_aspect_bedrock',
    rarity: 'common',
    effect: 'passive',
    name: L('기반암', 'Bedrock', '岩盤', '基岩'),
    desc: L(
      '최대 체력 +{0}, 방어 +{1}.',
      'Max health +{0}, armour +{1}.',
      '最大体力+{0}、防御+{1}。',
      '生命上限 +{0}，护甲 +{1}。',
    ),
    values: (lv) => [n([35, 70, 115], lv), n([2, 4, 7], lv)],
    apply: (o, lv) => {
      o.stats.maxHp += n([35, 70, 115], lv);
      o.stats.armor += n([2, 4, 7], lv);
    },
  }),
  aspect({
    god: 'gaia',
    id: 'gaia_aspect_orchard',
    rarity: 'rare',
    effect: 'passive',
    name: L('회복의 과수원', 'Restoring Orchard', '癒やしの果樹園', '复苏果园'),
    desc: L(
      '초당 체력 {0}을 회복하고 적이 {1}% 확률로 치유 열매를 떨군다.',
      'Regenerate {0} health/s; enemies have a {1}% chance to drop healing fruit.',
      '毎秒体力を{0}回復し、敵が{1}%で癒やしの実を落とす。',
      '每秒回复 {0} 生命；敌人有 {1}% 概率掉落治愈果实。',
    ),
    values: (lv) => [n([1, 2.2, 3.8], lv), n([5, 9, 14], lv)],
    apply: (o, lv) => {
      o.stats.regen += n([1, 2.2, 3.8], lv);
      o.mech.healDropChance += n([0.05, 0.09, 0.14], lv);
    },
  }),
  aspect({
    god: 'gaia',
    id: 'gaia_aspect_faultline',
    rarity: 'epic',
    effect: 'auto',
    name: L('단층 파열', 'Faultline Rupture', '断層破裂', '断层迸裂'),
    desc: L(
      '{0}초마다 가시 {1}개가 솟아 {2} 피해를 주고 적을 밀어낸다.',
      'Every {0}s, {1} thorns erupt for {2} damage and knock enemies away.',
      '{0}秒ごとに茨が{1}本噴き出し、{2}ダメージとノックバック。',
      '每 {0} 秒迸出 {1} 根地刺，造成 {2} 伤害并击退敌人。',
    ),
    values: (lv) => [n([3, 2.3, 1.7], lv), n([4, 6, 9], lv), n([45, 80, 130], lv)],
    apply: (o, lv) => {
      o.mech.thornInterval = n([3, 2.3, 1.7], lv);
      o.mech.thornCount = Math.max(o.mech.thornCount, n([4, 6, 9], lv));
      o.mech.thornDamage += n([45, 80, 130], lv);
      o.mech.knockback += n([20, 35, 55], lv);
    },
  }),

  // Poseidon — wider surf, slowing pools, and a quicker trident cadence.
  aspect({
    god: 'poseidon',
    id: 'poseidon_aspect_whitewater',
    rarity: 'common',
    effect: 'attack',
    name: L('흰 물보라', 'Whitewater', '白波', '白浪'),
    desc: L(
      '공격의 물보라 반경이 {0}, 피해가 {1} 증가한다.',
      'Attack splashes gain {0} radius and {1} damage.',
      '攻撃の水飛沫の半径が{0}、ダメージが{1}増える。',
      '攻击水花半径增加 {0}，伤害增加 {1}。',
    ),
    values: (lv) => [n([18, 32, 50], lv), n([20, 40, 70], lv)],
    apply: (o, lv) => {
      o.mech.splashRadius = Math.max(o.mech.splashRadius, 45) + n([18, 32, 50], lv);
      o.mech.splashDamage += n([20, 40, 70], lv);
    },
  }),
  aspect({
    god: 'poseidon',
    id: 'poseidon_aspect_undertow',
    rarity: 'rare',
    effect: 'trigger',
    name: L('역조', 'Undertow', '引き潮', '暗流'),
    desc: L(
      '공격 시 {0}% 확률로 물웅덩이를 남겨 초당 {1} 피해와 {2}% 둔화를 준다.',
      'Hits have a {0}% chance to leave a pool dealing {1}/s and slowing {2}%.',
      '命中時{0}%で水溜まりを残し、毎秒{1}ダメージと{2}%鈍化。',
      '命中有 {0}% 概率留下水池，每秒造成 {1} 伤害并减速 {2}%。',
    ),
    values: (lv) => [n([18, 28, 42], lv), n([14, 26, 44], lv), n([22, 34, 48], lv)],
    apply: (o, lv) => {
      o.mech.puddleChance = Math.max(o.mech.puddleChance, n([0.18, 0.28, 0.42], lv));
      o.mech.puddleDps += n([14, 26, 44], lv);
      o.mech.puddleSlow = Math.max(o.mech.puddleSlow, n([0.22, 0.34, 0.48], lv));
      o.mech.puddleRadius = Math.max(o.mech.puddleRadius, 70);
    },
  }),
  aspect({
    god: 'poseidon',
    id: 'poseidon_aspect_trident_mastery',
    rarity: 'epic',
    effect: 'attack',
    name: L('삼지창 숙련', 'Trident Mastery', '三叉槍の極意', '三叉戟精通'),
    desc: L(
      '{0}번째 공격마다 삼지창 일격이 되어 피해가 {1}배가 된다.',
      'Every {0}th attack becomes a trident strike for {1}× damage.',
      '{0}回目の攻撃が三叉の一撃となり、{1}倍ダメージ。',
      '每第 {0} 次攻击化为三叉戟重击，造成 {1} 倍伤害。',
    ),
    values: (lv) => [n([6, 5, 4], lv), n([2, 2.6, 3.4], lv)],
    apply: (o, lv) => {
      o.mech.tridentEvery = o.mech.tridentEvery
        ? Math.min(o.mech.tridentEvery, n([6, 5, 4], lv))
        : n([6, 5, 4], lv);
      o.mech.tridentMult = Math.max(o.mech.tridentMult, n([2, 2.6, 3.4], lv));
    },
  }),

  // Hades — souls, doom, and an eclipse that raises the reap threshold.
  aspect({
    god: 'hades',
    id: 'hades_aspect_soul_ledger',
    rarity: 'common',
    effect: 'trigger',
    name: L('영혼 장부', 'Soul Ledger', '魂の帳簿', '灵魂账簿'),
    desc: L(
      '처치 시 {0}% 확률로 영혼을 거두어 체력 {1}을 회복한다.',
      'Kills have a {0}% chance to harvest a soul and heal {1}.',
      '撃破時{0}%で魂を収穫し、体力を{1}回復。',
      '击杀有 {0}% 概率收割灵魂并回复 {1} 生命。',
    ),
    values: (lv) => [n([18, 30, 45], lv), n([3, 6, 10], lv)],
    apply: (o, lv) => {
      o.mech.soulChance = Math.max(o.mech.soulChance, n([0.18, 0.3, 0.45], lv));
      o.mech.soulHeal += n([3, 6, 10], lv);
    },
  }),
  aspect({
    god: 'hades',
    id: 'hades_aspect_black_seal',
    rarity: 'rare',
    effect: 'attack',
    name: L('검은 봉인', 'Black Seal', '黒き封印', '黑色封印'),
    desc: L(
      '공격한 적에게 {0}초 뒤 터지는 {1} 피해의 파멸 각인을 새긴다.',
      'Hits brand doom that erupts after {0}s for {1} damage.',
      '命中した敵へ{0}秒後に{1}ダメージで弾ける破滅を刻む。',
      '命中敌人施加厄运印记，{0} 秒后爆发造成 {1} 伤害。',
    ),
    values: (lv) => [n([2.2, 1.7, 1.2], lv), n([55, 105, 175], lv)],
    apply: (o, lv) => {
      o.mech.doomDelay = n([2.2, 1.7, 1.2], lv);
      o.mech.doomDamage += n([55, 105, 175], lv);
    },
  }),
  aspect({
    god: 'hades',
    id: 'hades_aspect_black_eclipse',
    rarity: 'epic',
    effect: 'passive',
    name: L('검은 일식', 'Black Eclipse', '黒き日食', '黑日蚀'),
    desc: L(
      '남은 체력이 {0}% 이하인 적을 기본 공격으로 즉시 수확한다.',
      'Basic attacks instantly reap enemies below {0}% health.',
      '残り体力{0}%以下の敵を通常攻撃で即座に刈る。',
      '普通攻击会立即收割生命低于 {0}% 的敌人。',
    ),
    values: (lv) => [n([12, 18, 25], lv)],
    apply: (o, lv) => {
      o.mech.reapThreshold = Math.max(o.mech.reapThreshold, n([0.12, 0.18, 0.25], lv));
    },
  }),

  // Apollo — autonomous sunlight, renewal, and searing flame.
  aspect({
    god: 'apollo',
    id: 'apollo_aspect_sun_lance',
    rarity: 'common',
    effect: 'auto',
    name: L('태양 창', 'Sun Lance', '太陽の槍', '太阳长枪'),
    desc: L(
      '{0}초마다 가장 가까운 적을 꿰뚫는 태양 광선으로 {1} 피해를 준다.',
      'Every {0}s a sunbeam pierces the nearest enemy for {1} damage.',
      '{0}秒ごとに最も近い敵を貫く光線で{1}ダメージ。',
      '每 {0} 秒以太阳光束贯穿最近敌人，造成 {1} 伤害。',
    ),
    values: (lv) => [n([6, 4.8, 3.6], lv), n([65, 115, 185], lv)],
    apply: (o, lv) => {
      o.mech.beamInterval = o.mech.beamInterval
        ? Math.min(o.mech.beamInterval, n([6, 4.8, 3.6], lv))
        : n([6, 4.8, 3.6], lv);
      o.mech.beamDamage += n([65, 115, 185], lv);
    },
  }),
  aspect({
    god: 'apollo',
    id: 'apollo_aspect_renewal_hymn',
    rarity: 'rare',
    effect: 'trigger',
    name: L('새벽의 찬가', 'Dawn Hymn', '暁の讃歌', '黎明颂歌'),
    desc: L(
      '레벨이 오를 때 최대 체력의 {0}%를 회복한다.',
      'On level up, restore {0}% of maximum health.',
      'レベルアップ時、最大体力の{0}%を回復。',
      '升级时回复最大生命的 {0}%。',
    ),
    values: (lv) => [n([10, 18, 28], lv)],
    apply: (o, lv) => {
      o.mech.levelHeal += n([0.1, 0.18, 0.28], lv);
    },
  }),
  aspect({
    god: 'apollo',
    id: 'apollo_aspect_noonday_fire',
    rarity: 'epic',
    effect: 'attack',
    name: L('정오의 불꽃', 'Noonday Fire', '真昼の炎', '正午烈焰'),
    desc: L(
      '공격이 {0}초 동안 초당 {1}의 화상을 남긴다.',
      'Hits burn for {1} each second over {0}s.',
      '攻撃が{0}秒間、毎秒{1}の炎上を残す。',
      '攻击留下灼烧，在 {0} 秒内每秒造成 {1} 伤害。',
    ),
    values: (lv) => [n([3, 4, 5], lv), n([12, 24, 40], lv)],
    apply: (o, lv) => {
      o.mech.burnDuration = Math.max(o.mech.burnDuration, n([3, 4, 5], lv));
      o.mech.burnDps += n([12, 24, 40], lv);
    },
  }),

  // Aphrodite — charm, heartbreak, and evasive weakness.
  aspect({
    god: 'aphrodite',
    id: 'aphrodite_aspect_first_glance',
    rarity: 'common',
    effect: 'attack',
    name: L('첫눈에 반한 마음', 'Love at First Sight', '一目惚れ', '一见倾心'),
    desc: L(
      '공격 시 {0}% 확률로 적을 {1}초 동안 매혹한다.',
      'Hits have a {0}% chance to charm for {1}s.',
      '命中時{0}%で敵を{1}秒間魅了する。',
      '命中有 {0}% 概率魅惑敌人 {1} 秒。',
    ),
    values: (lv) => [n([10, 18, 28], lv), n([1.4, 2, 2.8], lv)],
    apply: (o, lv) => {
      o.mech.charmChance = Math.max(o.mech.charmChance, n([0.1, 0.18, 0.28], lv));
      o.mech.charmDuration = Math.max(o.mech.charmDuration, n([1.4, 2, 2.8], lv));
    },
  }),
  aspect({
    god: 'aphrodite',
    id: 'aphrodite_aspect_broken_promises',
    rarity: 'rare',
    effect: 'trigger',
    name: L('깨진 맹세', 'Broken Promises', '破れた誓い', '破碎誓言'),
    desc: L(
      '매혹이 끝날 때 주변에 {0} 피해의 상심 폭발을 일으킨다.',
      'When charm ends, heartbreak bursts for {0} nearby damage.',
      '魅了が終わると周囲へ{0}ダメージの失恋が弾ける。',
      '魅惑结束时触发心碎爆炸，对周围造成 {0} 伤害。',
    ),
    values: (lv) => [n([75, 140, 230], lv)],
    apply: (o, lv) => {
      o.mech.heartbreakDamage += n([75, 140, 230], lv);
      o.mech.heartbreakRadius = Math.max(o.mech.heartbreakRadius, n([75, 95, 120], lv));
      o.mech.charmChance = Math.max(o.mech.charmChance, 0.1);
      o.mech.charmDuration = Math.max(o.mech.charmDuration, 1.2);
    },
  }),
  aspect({
    god: 'aphrodite',
    id: 'aphrodite_aspect_unreachable',
    rarity: 'epic',
    effect: 'passive',
    name: L('닿을 수 없는 사랑', 'Unreachable Love', '届かぬ恋', '不可触及之爱'),
    desc: L(
      '회피 +{0}%. 공격한 적은 {1}초 동안 주는 피해가 {2}% 감소한다.',
      'Dodge +{0}%; struck enemies deal {2}% less damage for {1}s.',
      '回避+{0}%。攻撃した敵は{1}秒間、与ダメージ-{2}%。',
      '闪避 +{0}%；被攻击的敌人在 {1} 秒内伤害降低 {2}%。',
    ),
    values: (lv) => [n([10, 18, 28], lv), n([2, 3, 4], lv), n([18, 28, 40], lv)],
    apply: (o, lv) => {
      o.stats.dodge += n([0.1, 0.18, 0.28], lv);
      o.mech.weakenAmount = Math.max(o.mech.weakenAmount, n([0.18, 0.28, 0.4], lv));
      o.mech.weakenDuration = Math.max(o.mech.weakenDuration, n([2, 3, 4], lv));
    },
  }),

  // Hephaestus — tempering, constructs, and a retaliating bronze wall.
  aspect({
    god: 'hephaestus',
    id: 'hephaestus_aspect_quench',
    rarity: 'common',
    effect: 'attack',
    name: L('담금질', 'Quenched Edge', '焼き入れ', '淬火锋刃'),
    desc: L(
      '기본 공격 피해 +{0}%, 관통 +{1}.',
      'Basic attack damage +{0}% and pierce +{1}.',
      '通常攻撃ダメージ+{0}%、貫通+{1}。',
      '普通攻击伤害 +{0}%，穿透 +{1}。',
    ),
    values: (lv) => [n([18, 32, 52], lv), n([1, 2, 3], lv)],
    apply: (o, lv) => {
      o.mech.basicDamageMult *= 1 + n([0.18, 0.32, 0.52], lv);
      o.stats.pierce += n([1, 2, 3], lv);
    },
  }),
  aspect({
    god: 'hephaestus',
    id: 'hephaestus_aspect_bronze_host',
    rarity: 'rare',
    effect: 'auto',
    name: L('청동 군단', 'Bronze Host', '青銅の軍勢', '青铜军团'),
    desc: L(
      '주위를 도는 청동 자동인형 {0}기가 접촉한 적에게 {1} 피해를 준다.',
      '{0} bronze automatons orbit you and deal {1} contact damage.',
      '青銅の自動人形{0}体が周回し、接触した敵へ{1}ダメージ。',
      '{0} 台青铜自动人偶环绕身边，接触造成 {1} 伤害。',
    ),
    values: (lv) => [n([1, 2, 3], lv), n([35, 60, 95], lv)],
    apply: (o, lv) => {
      o.mech.automatons += n([1, 2, 3], lv);
      o.mech.automatonDamage += n([35, 60, 95], lv);
    },
  }),
  aspect({
    god: 'hephaestus',
    id: 'hephaestus_aspect_bronze_wall',
    rarity: 'epic',
    effect: 'trigger',
    name: L('청동 성벽', 'Bronze Wall', '青銅の城壁', '青铜壁垒'),
    desc: L(
      '방어 +{0}. {1}초마다 생기는 보호막이 깨지면 주변에 {2} 피해를 준다.',
      'Armour +{0}; a shield gained every {1}s explodes for {2} when broken.',
      '防御+{0}。{1}秒ごとの盾が砕けると周囲へ{2}ダメージ。',
      '护甲 +{0}；每 {1} 秒生成的护盾破碎时造成 {2} 范围伤害。',
    ),
    values: (lv) => [n([3, 5, 8], lv), n([12, 9, 7], lv), n([80, 145, 240], lv)],
    apply: (o, lv) => {
      o.stats.armor += n([3, 5, 8], lv);
      o.mech.aegisMax = Math.max(o.mech.aegisMax, 1);
      o.mech.aegisInterval = o.mech.aegisInterval
        ? Math.min(o.mech.aegisInterval, n([12, 9, 7], lv))
        : n([12, 9, 7], lv);
      o.mech.reflectDamage += n([80, 145, 240], lv);
    },
  }),

  // Zeus — forked lightning, reactive static, and scheduled thunderbolts.
  aspect({
    god: 'zeus',
    id: 'zeus_aspect_forked_sky',
    rarity: 'common',
    effect: 'attack',
    name: L('갈래진 하늘', 'Forked Sky', '枝分かれの空', '裂空分雷'),
    desc: L(
      '공격이 최대 {0}명의 적에게 갈라져 {1} 피해를 전한다.',
      'Hits fork through up to {0} enemies for {1} damage.',
      '攻撃が最大{0}体へ枝分かれし、{1}ダメージを伝える。',
      '攻击分叉至最多 {0} 名敌人，传递 {1} 伤害。',
    ),
    values: (lv) => [n([2, 3, 5], lv), n([25, 45, 75], lv)],
    apply: (o, lv) => {
      o.mech.chainJumps = Math.max(o.mech.chainJumps, n([2, 3, 5], lv));
      o.mech.chainDamage += n([25, 45, 75], lv);
      o.mech.chainRange = Math.max(o.mech.chainRange, 120);
    },
  }),
  aspect({
    god: 'zeus',
    id: 'zeus_aspect_retort',
    rarity: 'rare',
    effect: 'trigger',
    name: L('천둥의 응수', 'Thunder Retort', '雷の応報', '雷霆还击'),
    desc: L(
      '피격될 때 주변에 {0} 피해를 주는 전류를 방출한다.',
      'Taking a hit discharges {0} damage around you.',
      '被弾時、周囲へ{0}ダメージの電流を放つ。',
      '受击时向周围释放造成 {0} 伤害的电流。',
    ),
    values: (lv) => [n([55, 105, 175], lv)],
    apply: (o, lv) => {
      o.mech.staticDamage += n([55, 105, 175], lv);
      o.mech.staticRadius = Math.max(o.mech.staticRadius, n([90, 115, 145], lv));
    },
  }),
  aspect({
    god: 'zeus',
    id: 'zeus_aspect_storm_clock',
    rarity: 'epic',
    effect: 'auto',
    name: L('폭풍의 시계', 'Storm Clock', '嵐の時計', '风暴时钟'),
    desc: L(
      '{0}초마다 가장 가까운 적에게 {1} 피해의 벼락이 떨어진다.',
      'Every {0}s, lightning strikes the nearest enemy for {1} damage.',
      '{0}秒ごとに最も近い敵へ{1}ダメージの雷が落ちる。',
      '每 {0} 秒雷击最近的敌人，造成 {1} 伤害。',
    ),
    values: (lv) => [n([5.5, 4.2, 3], lv), n([90, 165, 270], lv)],
    apply: (o, lv) => {
      o.mech.boltInterval = o.mech.boltInterval
        ? Math.min(o.mech.boltInterval, n([5.5, 4.2, 3], lv))
        : n([5.5, 4.2, 3], lv);
      o.mech.boltDamage += n([90, 165, 270], lv);
    },
  }),

  // Hestia — fire, holding ground, and a stronger single resurrection.
  aspect({
    god: 'hestia',
    id: 'hestia_aspect_ember_touch',
    rarity: 'common',
    effect: 'attack',
    name: L('불씨의 손길', 'Ember Touch', '熾火の指先', '余烬之触'),
    desc: L(
      '공격이 {0}초 동안 초당 {1}의 화상을 남긴다.',
      'Hits burn for {1} each second over {0}s.',
      '攻撃が{0}秒間、毎秒{1}の炎上を残す。',
      '攻击造成灼烧，在 {0} 秒内每秒造成 {1} 伤害。',
    ),
    values: (lv) => [n([3, 4, 5], lv), n([9, 18, 30], lv)],
    apply: (o, lv) => {
      o.mech.burnDuration = Math.max(o.mech.burnDuration, n([3, 4, 5], lv));
      o.mech.burnDps += n([9, 18, 30], lv);
    },
  }),
  aspect({
    god: 'hestia',
    id: 'hestia_aspect_hold_hearth',
    rarity: 'rare',
    effect: 'passive',
    name: L('화로 지키기', 'Hold the Hearth', '炉を守る者', '守炉者'),
    desc: L(
      '잠시 멈춰 서면 피해 +{0}%, 초당 회복 +{1}.',
      'Stand still briefly to gain +{0}% damage and {1} regeneration/s.',
      '少し静止するとダメージ+{0}%、毎秒回復+{1}。',
      '短暂站定后伤害 +{0}%，每秒回复 +{1}。',
    ),
    values: (lv) => [n([22, 38, 60], lv), n([1.2, 2.4, 4], lv)],
    apply: (o, lv) => {
      o.mech.hearthDamage += n([0.22, 0.38, 0.6], lv);
      o.mech.hearthRegen += n([1.2, 2.4, 4], lv);
    },
  }),
  aspect({
    god: 'hestia',
    id: 'hestia_aspect_second_kindling',
    rarity: 'epic',
    effect: 'trigger',
    name: L('두 번째 불씨', 'Second Kindling', '二度目の熾火', '第二火种'),
    desc: L(
      '치명상을 한 번 버티고 체력 {0}%로 되살아나 {1}초 동안 무적이 된다.',
      'Survive one fatal blow, returning at {0}% health with {1}s invulnerability.',
      '致命傷を一度耐え、体力{0}%と{1}秒の無敵で蘇る。',
      '抵挡一次致命伤，以 {0}% 生命复苏并无敌 {1} 秒。',
    ),
    values: (lv) => [n([30, 50, 75], lv), n([2, 3, 4.5], lv)],
    apply: (o, lv) => {
      o.mech.everlastingFlame = Math.max(o.mech.everlastingFlame, n([0.3, 0.5, 0.75], lv));
      o.mech.flameInvuln = Math.max(o.mech.flameInvuln, n([2, 3, 4.5], lv));
    },
  }),

  // Dionysus — drinking damage, entangling vines, and full-health revelry.
  aspect({
    god: 'dionysus',
    id: 'dionysus_aspect_red_vintage',
    rarity: 'common',
    effect: 'attack',
    name: L('붉은 포도주', 'Red Vintage', '赤葡萄酒', '红葡萄酒'),
    desc: L(
      '준 피해의 {0}%만큼 체력을 회복한다.',
      'Heal for {0}% of damage dealt.',
      '与えたダメージの{0}%を体力として回復。',
      '回复相当于所造成伤害 {0}% 的生命。',
    ),
    values: (lv) => [n([2, 4, 7], lv)],
    apply: (o, lv) => {
      o.mech.drain += n([0.02, 0.04, 0.07], lv);
    },
  }),
  aspect({
    god: 'dionysus',
    id: 'dionysus_aspect_wild_vines',
    rarity: 'rare',
    effect: 'attack',
    name: L('야생 포도덩굴', 'Wild Grapevines', '野生の葡萄蔓', '野生葡萄藤'),
    desc: L(
      '공격 시 {0}% 확률로 적을 {1}초 동안 묶는다.',
      'Hits have a {0}% chance to snare for {1}s.',
      '命中時{0}%で敵を{1}秒間拘束する。',
      '命中有 {0}% 概率束缚敌人 {1} 秒。',
    ),
    values: (lv) => [n([14, 24, 38], lv), n([1.2, 1.8, 2.6], lv)],
    apply: (o, lv) => {
      o.mech.snareChance = Math.max(o.mech.snareChance, n([0.14, 0.24, 0.38], lv));
      o.mech.snareDuration = Math.max(o.mech.snareDuration, n([1.2, 1.8, 2.6], lv));
    },
  }),
  aspect({
    god: 'dionysus',
    id: 'dionysus_aspect_full_cup',
    rarity: 'epic',
    effect: 'passive',
    name: L('넘치는 잔', 'Overflowing Cup', '溢れる杯', '满溢之杯'),
    desc: L(
      '현재 체력이 높을수록 강해져, 최대 체력일 때 피해 +{0}%.',
      'Damage rises with current health, reaching +{0}% while full.',
      '現在体力が高いほど強く、満タン時にダメージ+{0}%。',
      '当前生命越高伤害越强，满生命时伤害 +{0}%。',
    ),
    values: (lv) => [n([30, 55, 90], lv)],
    apply: (o, lv) => {
      o.mech.zealBonus += n([0.3, 0.55, 0.9], lv);
    },
  }),

  // Hera — brands, authority, and a pantheon-sized alliance.
  aspect({
    god: 'hera',
    id: 'hera_aspect_royal_brand',
    rarity: 'common',
    effect: 'attack',
    name: L('왕가의 낙인', 'Royal Brand', '王家の烙印', '王室烙印'),
    desc: L(
      '공격 시 {0}% 확률로 {1}초 동안 받는 피해가 {2}% 늘어나는 낙인을 찍는다.',
      'Hits have a {0}% chance to brand enemies for {1}s, making them take {2}% more damage.',
      '命中時{0}%で{1}秒間、被ダメージ+{2}%の烙印を刻む。',
      '命中有 {0}% 概率烙印敌人 {1} 秒，使其受到的伤害增加 {2}%。',
    ),
    values: (lv) => [n([12, 20, 30], lv), n([3, 4, 5], lv), n([18, 30, 45], lv)],
    apply: (o, lv) => {
      o.mech.markChance = Math.max(o.mech.markChance, n([0.12, 0.2, 0.3], lv));
      o.mech.markDuration = Math.max(o.mech.markDuration, n([3, 4, 5], lv));
      o.mech.markAmount += n([0.18, 0.3, 0.45], lv);
    },
  }),
  aspect({
    god: 'hera',
    id: 'hera_aspect_commanding_presence',
    rarity: 'rare',
    effect: 'passive',
    name: L('위압의 궁정', 'Commanding Court', '威圧の宮廷', '威压宫廷'),
    desc: L(
      '반경 {0} 안의 적은 공격력과 이동 속도가 {1}% 감소한다.',
      'Enemies within {0} radius deal and move {1}% less.',
      '半径{0}内の敵は攻撃力と移動速度-{1}%。',
      '半径 {0} 内的敌人伤害与移动速度降低 {1}%。',
    ),
    values: (lv) => [n([130, 165, 210], lv), n([14, 22, 32], lv)],
    apply: (o, lv) => {
      o.mech.auraRadius = Math.max(o.mech.auraRadius, n([130, 165, 210], lv));
      o.mech.auraWeaken = Math.max(o.mech.auraWeaken, n([0.14, 0.22, 0.32], lv));
    },
  }),
  aspect({
    god: 'hera',
    id: 'hera_aspect_divine_alliance',
    rarity: 'epic',
    effect: 'passive',
    name: L('신성 동맹', 'Divine Alliance', '神々の盟約', '神圣同盟'),
    desc: L(
      '모시는 신 한 명마다 모든 피해 +{0}%, 최대 체력 +{1}.',
      'Each god you serve grants +{0}% all damage and +{1} max health.',
      '仕える神一柱ごとに全ダメージ+{0}%、最大体力+{1}。',
      '每侍奉一位神明，所有伤害 +{0}%，生命上限 +{1}。',
    ),
    values: (lv) => [n([4, 7, 11], lv), n([8, 14, 22], lv)],
    apply: (o, lv) => {
      o.mech.allianceBonus += n([0.04, 0.07, 0.11], lv);
      o.mech.allianceHealth += n([8, 14, 22], lv);
    },
  }),

  // Artemis — moon arrows, tracking, and critical starbursts.
  aspect({
    god: 'artemis',
    id: 'artemis_aspect_moon_quiver',
    rarity: 'common',
    effect: 'attack',
    name: L('달빛 화살통', 'Moonlit Quiver', '月光の矢筒', '月光箭囊'),
    desc: L(
      '기본 공격과 함께 유도 화살 {0}발을 추가로 쏜다.',
      'Basic attacks loose {0} additional homing arrows.',
      '通常攻撃と共に追尾矢を{0}本追加で放つ。',
      '普通攻击额外射出 {0} 支追踪箭。',
    ),
    values: (lv) => [n([1, 2, 3], lv)],
    apply: (o, lv) => {
      o.mech.moonshafts += n([1, 2, 3], lv);
      o.stats.homing = Math.max(o.stats.homing, 0.55);
    },
  }),
  aspect({
    god: 'artemis',
    id: 'artemis_aspect_relentless_hunt',
    rarity: 'rare',
    effect: 'passive',
    name: L('끈질긴 사냥', 'Relentless Hunt', '執拗な狩り', '不懈追猎'),
    desc: L(
      '유도 성능 +{0}%, 투사체 속도 +{1}%, 치명타 확률 +{2}%.',
      'Homing +{0}%, projectile speed +{1}%, and crit chance +{2}%.',
      '追尾性能+{0}%、飛翔速度+{1}%、会心率+{2}%。',
      '追踪性能 +{0}%，投射物速度 +{1}%，暴击率 +{2}%。',
    ),
    values: (lv) => [n([20, 35, 55], lv), n([15, 28, 45], lv), n([6, 11, 18], lv)],
    apply: (o, lv) => {
      o.stats.homing = Math.min(1, o.stats.homing + n([0.2, 0.35, 0.55], lv));
      o.stats.projectileSpeedMult *= 1 + n([0.15, 0.28, 0.45], lv);
      o.stats.critChance += n([0.06, 0.11, 0.18], lv);
    },
  }),
  aspect({
    god: 'artemis',
    id: 'artemis_aspect_full_moon',
    rarity: 'epic',
    effect: 'trigger',
    name: L('보름달의 파문', 'Full-Moon Ripple', '満月の波紋', '满月涟漪'),
    desc: L(
      '치명타가 반경 {0}에 원래 피해의 {1}%를 퍼뜨린다.',
      'Critical hits splash {1}% of their damage across {0} radius.',
      '会心が半径{0}へ元ダメージの{1}%を広げる。',
      '暴击将原伤害的 {1}% 扩散至半径 {0}。',
    ),
    values: (lv) => [n([75, 105, 140], lv), n([45, 75, 115], lv)],
    apply: (o, lv) => {
      o.mech.critSplashRadius = Math.max(o.mech.critSplashRadius, n([75, 105, 140], lv));
      o.mech.critSplashDamage += n([0.45, 0.75, 1.15], lv);
    },
  }),

  // Demeter — freeze, harvest, and violent thawing.
  aspect({
    god: 'demeter',
    id: 'demeter_aspect_deep_freeze',
    rarity: 'common',
    effect: 'attack',
    name: L('혹한', 'Deep Freeze', '厳寒', '极寒'),
    desc: L(
      '공격 시 {0}% 확률로 적을 {1}초 동안 얼린다.',
      'Hits have a {0}% chance to freeze for {1}s.',
      '命中時{0}%で敵を{1}秒間凍結する。',
      '命中有 {0}% 概率冻结敌人 {1} 秒。',
    ),
    values: (lv) => [n([12, 21, 32], lv), n([1.3, 1.9, 2.7], lv)],
    apply: (o, lv) => {
      o.mech.freezeChance = Math.max(o.mech.freezeChance, n([0.12, 0.21, 0.32], lv));
      o.mech.freezeDuration = Math.max(o.mech.freezeDuration, n([1.3, 1.9, 2.7], lv));
    },
  }),
  aspect({
    god: 'demeter',
    id: 'demeter_aspect_harvest_feast',
    rarity: 'rare',
    effect: 'passive',
    name: L('수확 연회', 'Harvest Feast', '収穫の宴', '丰收宴'),
    desc: L(
      '경험치 +{0}%. 적이 {1}% 확률로 치유 열매를 떨군다.',
      'Experience +{0}%; enemies have a {1}% chance to drop healing fruit.',
      '経験値+{0}%。敵が{1}%で癒やしの実を落とす。',
      '经验 +{0}%；敌人有 {1}% 概率掉落治愈果实。',
    ),
    values: (lv) => [n([20, 38, 60], lv), n([7, 12, 18], lv)],
    apply: (o, lv) => {
      o.stats.xpMult += n([0.2, 0.38, 0.6], lv);
      o.mech.healDropChance += n([0.07, 0.12, 0.18], lv);
    },
  }),
  aspect({
    god: 'demeter',
    id: 'demeter_aspect_thawburst',
    rarity: 'epic',
    effect: 'trigger',
    name: L('해빙 폭발', 'Thawburst', '融氷爆発', '融冰爆裂'),
    desc: L(
      '빙결이 풀릴 때 주변에 {0} 피해를 주고, 얼어붙은 적에게 피해 +{1}%.',
      'Thawing deals {0} nearby damage; frozen enemies take +{1}% damage.',
      '解凍時に周囲へ{0}ダメージ。凍結した敵へのダメージ+{1}%。',
      '解冻时对周围造成 {0} 伤害；冻结敌人受到的伤害 +{1}%。',
    ),
    values: (lv) => [n([70, 130, 215], lv), n([35, 60, 95], lv)],
    apply: (o, lv) => {
      o.mech.shatterDamage += n([70, 130, 215], lv);
      o.mech.shatterBonus += n([0.35, 0.6, 0.95], lv);
      o.mech.freezeChance = Math.max(o.mech.freezeChance, 0.12);
      o.mech.freezeDuration = Math.max(o.mech.freezeDuration, 1.2);
    },
  }),
];
