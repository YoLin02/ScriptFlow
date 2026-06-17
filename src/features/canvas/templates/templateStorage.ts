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
  if (typeof window === 'undefined') return [];
  return parseTemplates(window.localStorage.getItem(TEMPLATE_STORAGE_KEY));
}

export function saveCanvasTemplates(templates: CanvasRegionTemplate[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(templates));
}
