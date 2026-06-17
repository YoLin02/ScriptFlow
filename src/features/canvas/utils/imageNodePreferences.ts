export type ImageNodeDisplayMode = 'image-only' | 'image-card';

export const IMAGE_NODE_DISPLAY_MODE_KEY = 'scriptflow.imageNode.defaultDisplayMode';
export const DEFAULT_IMAGE_NODE_DISPLAY_MODE: ImageNodeDisplayMode = 'image-only';

export function normalizeImageNodeDisplayMode(value: unknown): ImageNodeDisplayMode {
  return value === 'image-card' || value === 'image-only'
    ? value
    : DEFAULT_IMAGE_NODE_DISPLAY_MODE;
}

export function getDefaultImageNodeDisplayMode(): ImageNodeDisplayMode {
  if (typeof window === 'undefined') return DEFAULT_IMAGE_NODE_DISPLAY_MODE;
  return normalizeImageNodeDisplayMode(window.localStorage.getItem(IMAGE_NODE_DISPLAY_MODE_KEY));
}

export function setDefaultImageNodeDisplayMode(value: ImageNodeDisplayMode) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(IMAGE_NODE_DISPLAY_MODE_KEY, value);
}
