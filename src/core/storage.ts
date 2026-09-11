import { detectLocale, LOCALES, type LocaleId } from '../i18n';
import { HERO_IDS } from '../data/heroes';
import { GOD_IDS } from '../data/gods';
import { PERMANENT } from '../data/permanent';

const STORAGE_KEY = 'odyssey-survival/save/v1';
const SAVE_VERSION = 1;

export interface SaveData {
  version: number;
  gold: number;
  /** permanent upgrades upgrade id -> purchased rank */
  permanent: Record<string, number>;
  unlockedHeroes: string[];
  /** gods bought in the Pantheon; the free ones are not listed here */
  unlockedGods: string[];
  lastHero: string;
  locale: LocaleId;
  sfx: boolean;
  music: boolean;
  haptics: boolean;
  hapticStrength: 'light' | 'strong';
  reducedMotion: boolean;
  stats: {
    runs: number;
    bestTimeSec: number;
    bestLevel: number;
    totalKills: number;
  };
  iap: {
    removeAds: boolean;
    unlockAllHeroes: boolean;
  };
  ads: {
    /** YYYY-MM-DD of the counted day, so the daily cap resets on its own */
    day: string;
    watched: number;
  };
}

function freshSave(): SaveData {
  return {
    version: SAVE_VERSION,
    gold: 0,
    permanent: {},
    unlockedHeroes: ['odysseus'],
    unlockedGods: [],
    lastHero: 'odysseus',
    locale: detectLocale(),
    sfx: true,
    music: true,
    haptics: true,
    hapticStrength: 'light',
    reducedMotion: false,
    stats: { runs: 0, bestTimeSec: 0, bestLevel: 0, totalKills: 0 },
    iap: { removeAds: false, unlockAllHeroes: false },
    ads: { day: '', watched: 0 },
  };
}

function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function nonnegative(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? value
    : fallback;
}

function ids(value: unknown, allowed: readonly string[]): string[] {
  return Array.isArray(value)
    ? [...new Set(value.filter((id): id is string => typeof id === 'string' && allowed.includes(id)))]
    : [];
}

/** Validate persisted values; TypeScript types do not protect parsed JSON. */
function migrate(raw: unknown): SaveData {
  const base = freshSave();
  const data = record(raw);
  const permanent = record(data.permanent);
  const stats = record(data.stats);
  const iap = record(data.iap);
  const ads = record(data.ads);
  const heroes = ids(data.unlockedHeroes, HERO_IDS);
  const bool = (value: unknown, fallback: boolean): boolean =>
    typeof value === 'boolean' ? value : fallback;
  return {
    ...base,
    gold: nonnegative(data.gold),
    permanent: Object.fromEntries(PERMANENT
      .filter((def) => Object.hasOwn(permanent, def.id))
      .map((def) => [def.id, Math.min(def.maxRank, Math.floor(nonnegative(permanent[def.id])))])),
    unlockedHeroes: heroes.length ? heroes : base.unlockedHeroes,
    unlockedGods: ids(data.unlockedGods, GOD_IDS),
    lastHero: HERO_IDS.includes(data.lastHero as typeof HERO_IDS[number])
      ? data.lastHero as string : base.lastHero,
    locale: LOCALES.includes(data.locale as LocaleId) ? data.locale as LocaleId : base.locale,
    sfx: bool(data.sfx, base.sfx),
    music: bool(data.music, base.music),
    haptics: bool(data.haptics, base.haptics),
    hapticStrength: data.hapticStrength === 'strong' ? 'strong' : 'light',
    reducedMotion: bool(data.reducedMotion, base.reducedMotion),
    stats: {
      runs: Math.floor(nonnegative(stats.runs)),
      bestTimeSec: nonnegative(stats.bestTimeSec),
      bestLevel: Math.floor(nonnegative(stats.bestLevel)),
      totalKills: Math.floor(nonnegative(stats.totalKills)),
    },
    iap: {
      removeAds: bool(iap.removeAds, false),
      unlockAllHeroes: bool(iap.unlockAllHeroes, false),
    },
    ads: {
      day: typeof ads.day === 'string' ? ads.day : '',
      watched: Math.floor(nonnegative(ads.watched)),
    },
  };
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return freshSave();
    return migrate(JSON.parse(raw));
  } catch {
    // Private mode, quota, corrupt JSON — play on with a fresh profile rather
    // than showing the player an error they cannot act on.
    return freshSave();
  }
}

export function writeSave(data: SaveData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* storage unavailable; progress is session-only */
  }
}

export function clearSave(): SaveData {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  return freshSave();
}

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}
