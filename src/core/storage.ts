import { detectLocale, type LocaleId } from '../i18n';

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

/** Merge a parsed blob over defaults so an older or partial save still loads. */
function migrate(raw: unknown): SaveData {
  const base = freshSave();
  if (!raw || typeof raw !== 'object') return base;
  const data = raw as Partial<SaveData>;
  return {
    ...base,
    ...data,
    version: SAVE_VERSION,
    permanent: { ...base.permanent, ...(data.permanent ?? {}) },
    unlockedHeroes:
      Array.isArray(data.unlockedHeroes) && data.unlockedHeroes.length > 0
        ? data.unlockedHeroes
        : base.unlockedHeroes,
    stats: { ...base.stats, ...(data.stats ?? {}) },
    iap: { ...base.iap, ...(data.iap ?? {}) },
    ads: { ...base.ads, ...(data.ads ?? {}) },
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
