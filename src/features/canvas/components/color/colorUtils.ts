export interface HsvColor {
  h: number;
  s: number;
  v: number;
}

export function normalizeHexColor(value: string, fallback = '#ffffff') {
  const trimmed = value.trim();
  const expanded = trimmed.replace(/^#?([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])$/, '#$1$1$2$2$3$3');
  const normalized = expanded.startsWith('#') ? expanded : `#${expanded}`;
  return /^#[0-9a-fA-F]{6}$/.test(normalized) ? normalized.toLowerCase() : fallback.toLowerCase();
}

export function isValidHexColor(value: string) {
  return /^#?[0-9a-fA-F]{6}$/.test(value.trim()) || /^#?[0-9a-fA-F]{3}$/.test(value.trim());
}

export function hexToHsv(hex: string): HsvColor {
  const normalized = normalizeHexColor(hex);
  const r = Number.parseInt(normalized.slice(1, 3), 16) / 255;
  const g = Number.parseInt(normalized.slice(3, 5), 16) / 255;
  const b = Number.parseInt(normalized.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === r) {
      h = 60 * (((g - b) / delta) % 6);
    } else if (max === g) {
      h = 60 * ((b - r) / delta + 2);
    } else {
      h = 60 * ((r - g) / delta + 4);
    }
  }

  return {
    h: Math.round((h + 360) % 360),
    s: max === 0 ? 0 : delta / max,
    v: max,
  };
}

export function hsvToHex({ h, s, v }: HsvColor) {
  const chroma = v * s;
  const x = chroma * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - chroma;
  let r = 0;
  let g = 0;
  let b = 0;

  if (h < 60) {
    r = chroma;
    g = x;
  } else if (h < 120) {
    r = x;
    g = chroma;
  } else if (h < 180) {
    g = chroma;
    b = x;
  } else if (h < 240) {
    g = x;
    b = chroma;
  } else if (h < 300) {
    r = x;
    b = chroma;
  } else {
    r = chroma;
    b = x;
  }

  return `#${[r, g, b]
    .map((channel) => Math.round((channel + m) * 255).toString(16).padStart(2, '0'))
    .join('')}`;
}

export function resolveVisibleHueSelection(current: HsvColor, nextHue: number): HsvColor {
  return {
    h: nextHue,
    s: current.s === 0 ? 1 : current.s,
    v: current.v === 0 ? 1 : current.v,
  };
}
