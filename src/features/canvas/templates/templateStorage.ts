import { dbGet, dbSet } from '../../../shared/storage/db';
import type { CanvasRegionTemplate } from './types';

const TEMPLATE_STORAGE_KEY = 'scriptflow.canvas.regionTemplates.v1';

function parseTemplates(raw: string | null): CanvasRegionTemplate[] {
  if (!raw) return [];

  try {
    const value = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is CanvasRegionTemplate => {
      return !!item
        && typeof item.id === 'string'
        && typeof item.name === 'string'
        && Array.isArray(item.nodes)
        && Array.isArray(item.edges);
    });
  } catch (error) {
    console.warn('Failed to parse canvas templates', error);
    return [];
  }
}

export function loadCanvasTemplates(): CanvasRegionTemplate[] {
  return [];
}

export function saveCanvasTemplates(templates: CanvasRegionTemplate[]) {
  if (typeof window === 'undefined') return;
  dbSet(TEMPLATE_STORAGE_KEY, templates).catch((error) => {
    console.warn('Failed to persist canvas templates', error);
  });
}

export async function loadCanvasTemplatesAsync(): Promise<CanvasRegionTemplate[]> {
  if (typeof window === 'undefined') return [];
  const indexedTemplates = await dbGet<CanvasRegionTemplate[]>(TEMPLATE_STORAGE_KEY);
  if (Array.isArray(indexedTemplates)) return indexedTemplates;
  const legacyTemplates = parseTemplates(window.localStorage.getItem(TEMPLATE_STORAGE_KEY));
  if (legacyTemplates.length > 0) {
    await dbSet(TEMPLATE_STORAGE_KEY, legacyTemplates);
    try {
      window.localStorage.removeItem(TEMPLATE_STORAGE_KEY);
    } catch {}
  }
  return legacyTemplates;
}
