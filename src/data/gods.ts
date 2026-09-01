import { t } from '../i18n';

export type GodId =
  | 'zeus'
  | 'poseidon'
  | 'ares'
  | 'athena'
  | 'aphrodite'
  | 'hermes'
  | 'hades'
  | 'gaia';

export interface GodDef {
  id: GodId;
  /** primary colour, used for boon cards, VFX and the HUD strip */
  color: string;
  /** lighter accent for glows and particles */
  accent: string;
}

export const GODS: Record<GodId, GodDef> = {
  zeus: { id: 'zeus', color: '#f2d24b', accent: '#fff6c2' },
  poseidon: { id: 'poseidon', color: '#3fa9d8', accent: '#b3ecff' },
  ares: { id: 'ares', color: '#d43f43', accent: '#ff9a86' },
  athena: { id: 'athena', color: '#c9b98f', accent: '#f4ead0' },
  aphrodite: { id: 'aphrodite', color: '#e072b4', accent: '#ffc9e8' },
  hermes: { id: 'hermes', color: '#66d69b', accent: '#c9ffe4' },
  hades: { id: 'hades', color: '#8b6be0', accent: '#d5c2ff' },
  gaia: { id: 'gaia', color: '#7fa055', accent: '#d3e7ac' },
};

export const GOD_IDS = Object.keys(GODS) as GodId[];

export function godName(id: GodId): string {
  return t(`god.${id}` as 'god.zeus');
}

export function godTitle(id: GodId): string {
  return t(`god.${id}.title` as 'god.zeus.title');
}

export function godQuote(id: GodId): string {
  return t(`story.boon.${id}` as 'story.boon.zeus');
}
