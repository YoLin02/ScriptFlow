export { default as ShortcutSettingsPanel } from './ShortcutSettingsPanel';
export {
  DEFAULT_SHORTCUTS,
  SHORTCUT_DEFINITIONS,
  SHORTCUT_STORAGE_KEY,
  eventToShortcut,
  getShortcutConflicts,
  isEditableShortcutTarget,
  isShortcutEvent,
  normalizeShortcut,
} from './shortcuts';
export type { ShortcutActionId, ShortcutDefinition, ShortcutMap } from './shortcuts';
