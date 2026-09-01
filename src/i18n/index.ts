import { ko, type Dict, type DictKey } from './ko';
import { en } from './en';
import { ja } from './ja';
import { zh } from './zh';

export type LocaleId = 'ko' | 'en' | 'ja' | 'zh';

export const LOCALES: LocaleId[] = ['ko', 'en', 'ja', 'zh'];

const DICTS: Record<LocaleId, Dict> = { ko, en, ja, zh };

let current: LocaleId = 'en';
const listeners = new Set<() => void>();

/** Best-effort match of the device language onto a locale we ship. */
export function detectLocale(): LocaleId {
  const tags =
    typeof navigator !== 'undefined' ? (navigator.languages ?? [navigator.language]) : [];
  for (const raw of tags) {
    const tag = (raw ?? '').toLowerCase();
    if (tag.startsWith('ko')) return 'ko';
    if (tag.startsWith('ja')) return 'ja';
    if (tag.startsWith('zh')) return 'zh';
    if (tag.startsWith('en')) return 'en';
  }
  return 'en';
}

export function getLocale(): LocaleId {
  return current;
}

export function setLocale(id: LocaleId): void {
  if (!LOCALES.includes(id) || id === current) return;
  current = id;
  if (typeof document !== 'undefined') document.documentElement.lang = id;
  for (const fn of listeners) fn();
}

export function onLocaleChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/**
 * Look up `key` in the active locale and substitute `{0}`, `{1}`… positionally.
 * Falls back to English, then Korean, then the key itself, so a missing string
 * degrades to something readable instead of blank UI.
 */
export function t(key: DictKey, ...args: (string | number)[]): string {
  const template = DICTS[current][key] ?? en[key] ?? ko[key] ?? key;
  if (args.length === 0) return template;
  return template.replace(/\{(\d+)\}/g, (whole, index: string) => {
    const value = args[Number(index)];
    return value === undefined ? whole : String(value);
  });
}

/** Same as `t`, but for keys assembled at runtime (e.g. `boon.${id}.name`). */
export function tk(key: string, ...args: (string | number)[]): string {
  return t(key as DictKey, ...args);
}

export function formatTime(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export type { DictKey };

/**
 * Content strings (boon names, flavour text, …) live next to the numbers that
 * define them rather than in the four chrome dictionaries above — a boon is
 * much easier to balance and translate when its text and its values are in the
 * same object.
 */
export type LocalizedText = Record<LocaleId, string>;

/** Compact constructor so content tables stay readable: `L('사슬 번개', 'Chain Lightning', …)`. */
export function L(koText: string, enText: string, jaText: string, zhText: string): LocalizedText {
  return { ko: koText, en: enText, ja: jaText, zh: zhText };
}

/** Resolve a `LocalizedText` in the active locale, substituting `{0}`, `{1}`… */
export function loc(text: LocalizedText, ...args: (string | number)[]): string {
  const template = text[current] ?? text.en ?? text.ko ?? '';
  if (args.length === 0) return template;
  return template.replace(/\{(\d+)\}/g, (whole, index: string) => {
    const value = args[Number(index)];
    return value === undefined ? whole : String(value);
  });
}
