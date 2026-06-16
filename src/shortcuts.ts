import type { KeyboardEvent as ReactKeyboardEvent } from 'react';

export type ShortcutActionId =
  | 'canvas.addText'
  | 'canvas.addImage'
  | 'canvas.addIdea'
  | 'canvas.addTable'
  | 'canvas.addTimeline'
  | 'canvas.toggleMediaLibrary'
  | 'canvas.toggleMoreTools'
  | 'workspace.undo'
  | 'workspace.redo'
  | 'selection.copy'
  | 'selection.paste'
  | 'selection.delete'
  | 'selection.selectAll'
  | 'selection.clear'
  | 'canvas.fitView'
  | 'canvas.zoomIn'
  | 'canvas.zoomOut'
  | 'canvas.autoLayout'
  | 'canvas.clear'
  | 'batch.duplicate'
  | 'batch.alignLeft'
  | 'batch.alignTop'
  | 'batch.distributeHorizontal'
  | 'batch.distributeVertical'
  | 'editor.search'
  | 'editor.extractSelection'
  | 'editor.toggleOutline'
  | 'editor.importMarkdown'
  | 'editor.exportMarkdown'
  | 'timeline.moveActiveTickLeft'
  | 'timeline.moveActiveTickRight'
  | 'system.openMenu'
  | 'system.openShortcuts';

export interface ShortcutDefinition {
  id: ShortcutActionId;
  category: string;
  label: string;
  defaultBinding: string;
  description?: string;
}

export type ShortcutMap = Record<ShortcutActionId, string>;

export const SHORTCUT_STORAGE_KEY = 'scriptflow_shortcuts_v1';

export const SHORTCUT_DEFINITIONS: ShortcutDefinition[] = [
  { id: 'canvas.addText', category: '底部菜单栏', label: '添加文本卡片', defaultBinding: 'Ctrl+1' },
  { id: 'canvas.addImage', category: '底部菜单栏', label: '添加配图卡片', defaultBinding: 'Ctrl+2' },
  { id: 'canvas.addIdea', category: '底部菜单栏', label: '添加想法卡片', defaultBinding: 'Ctrl+3' },
  { id: 'canvas.addTable', category: '底部菜单栏', label: '添加表格卡片', defaultBinding: 'Ctrl+4' },
  { id: 'canvas.addTimeline', category: '底部菜单栏', label: '添加时间轴轨道', defaultBinding: 'Ctrl+5' },
  { id: 'canvas.toggleMediaLibrary', category: '底部菜单栏', label: '配图库', defaultBinding: 'Ctrl+6' },
  { id: 'canvas.toggleMoreTools', category: '底部菜单栏', label: '更多工具', defaultBinding: 'Ctrl+7' },
  { id: 'workspace.undo', category: '编辑通用', label: '撤销', defaultBinding: 'Ctrl+Z' },
  { id: 'workspace.redo', category: '编辑通用', label: '重做', defaultBinding: 'Ctrl+Shift+Z' },
  { id: 'selection.copy', category: '编辑通用', label: '复制选中节点', defaultBinding: 'Ctrl+C' },
  { id: 'selection.paste', category: '编辑通用', label: '粘贴节点', defaultBinding: 'Ctrl+V' },
  { id: 'selection.delete', category: '编辑通用', label: '删除选中节点/连线', defaultBinding: 'Delete' },
  { id: 'selection.selectAll', category: '编辑通用', label: '全选节点', defaultBinding: 'Ctrl+A' },
  { id: 'selection.clear', category: '编辑通用', label: '取消选择', defaultBinding: 'Escape' },
  { id: 'canvas.fitView', category: '画布操作', label: '适配全部内容', defaultBinding: 'Ctrl+0' },
  { id: 'canvas.zoomIn', category: '画布操作', label: '放大画布', defaultBinding: 'Ctrl+=' },
  { id: 'canvas.zoomOut', category: '画布操作', label: '缩小画布', defaultBinding: 'Ctrl+-' },
  { id: 'canvas.autoLayout', category: '画布操作', label: '整理画布', defaultBinding: 'Ctrl+Shift+L' },
  { id: 'canvas.clear', category: '画布操作', label: '清空画布', defaultBinding: 'Ctrl+Shift+Backspace' },
  { id: 'batch.duplicate', category: '节点批量操作', label: '复制一份选中节点', defaultBinding: 'Ctrl+D' },
  { id: 'batch.alignLeft', category: '节点批量操作', label: '左对齐', defaultBinding: 'Alt+A' },
  { id: 'batch.alignTop', category: '节点批量操作', label: '顶部对齐', defaultBinding: 'Alt+W' },
  { id: 'batch.distributeHorizontal', category: '节点批量操作', label: '水平均匀分布', defaultBinding: 'Alt+Shift+H' },
  { id: 'batch.distributeVertical', category: '节点批量操作', label: '垂直均匀分布', defaultBinding: 'Alt+Shift+V' },
  { id: 'editor.search', category: '脚本区', label: '查找替换', defaultBinding: 'Ctrl+F' },
  { id: 'editor.extractSelection', category: '脚本区', label: '选区生成卡片', defaultBinding: 'Ctrl+Shift+C' },
  { id: 'editor.toggleOutline', category: '脚本区', label: '打开/关闭目录', defaultBinding: 'Ctrl+Shift+O' },
  { id: 'editor.importMarkdown', category: '脚本区', label: '导入 MD', defaultBinding: 'Ctrl+Shift+I' },
  { id: 'editor.exportMarkdown', category: '脚本区', label: '导出 MD', defaultBinding: 'Ctrl+Shift+E' },
  { id: 'timeline.moveActiveTickLeft', category: '时间轴', label: '选中时刻向左移动', defaultBinding: 'ArrowLeft', description: '仅在时间轴刻度被选中时生效' },
  { id: 'timeline.moveActiveTickRight', category: '时间轴', label: '选中时刻向右移动', defaultBinding: 'ArrowRight', description: '仅在时间轴刻度被选中时生效' },
  { id: 'system.openMenu', category: '系统', label: '打开/关闭右上角菜单', defaultBinding: 'Ctrl+,' },
  { id: 'system.openShortcuts', category: '系统', label: '打开快捷键设置', defaultBinding: 'Ctrl+/' },
];

export const DEFAULT_SHORTCUTS = SHORTCUT_DEFINITIONS.reduce((acc, item) => {
  acc[item.id] = item.defaultBinding;
  return acc;
}, {} as ShortcutMap);

export function normalizeShortcut(binding: string) {
  return binding
    .split('+')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const lower = part.toLowerCase();
      if (lower === 'control') return 'Ctrl';
      if (lower === 'cmd' || lower === 'command' || lower === 'meta') return 'Meta';
      if (lower === 'escape' || lower === 'esc') return 'Escape';
      if (lower === 'del') return 'Delete';
      if (lower === 'space') return 'Space';
      if (lower.length === 1) return lower.toUpperCase();
      return part[0].toUpperCase() + part.slice(1);
    })
    .join('+');
}

export function eventToShortcut(event: KeyboardEvent | ReactKeyboardEvent) {
  const key = event.key === ' ' ? 'Space' : event.key;
  const parts: string[] = [];
  if (event.ctrlKey) parts.push('Ctrl');
  if (event.metaKey) parts.push('Meta');
  if (event.altKey) parts.push('Alt');
  if (event.shiftKey) parts.push('Shift');

  const normalizedKey = normalizeShortcut(key);
  if (!['Control', 'Ctrl', 'Meta', 'Alt', 'Shift'].includes(normalizedKey)) {
    parts.push(normalizedKey);
  }
  return parts.join('+');
}

export function isShortcutEvent(event: KeyboardEvent, binding: string) {
  return eventToShortcut(event) === normalizeShortcut(binding);
}

export function getShortcutConflicts(shortcuts: ShortcutMap) {
  const entries = Object.entries(shortcuts) as Array<[ShortcutActionId, string]>;
  const groups = new Map<string, ShortcutActionId[]>();

  entries.forEach(([id, binding]) => {
    const normalized = normalizeShortcut(binding);
    if (!normalized) return;
    groups.set(normalized, [...(groups.get(normalized) ?? []), id]);
  });

  return Array.from(groups.entries()).filter(([, ids]) => ids.length > 1);
}

export function isEditableShortcutTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  const element = target as HTMLElement;
  return Boolean(
    element.closest('input, textarea, select, [contenteditable="true"], .tiptap-content, .shortcut-settings-panel'),
  );
}
