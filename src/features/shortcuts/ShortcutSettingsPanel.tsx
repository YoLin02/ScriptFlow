import { ChevronDown, RotateCcw, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  DEFAULT_SHORTCUTS,
  SHORTCUT_DEFINITIONS,
  ShortcutActionId,
  ShortcutMap,
  eventToShortcut,
  getShortcutConflicts,
  normalizeShortcut,
} from './shortcuts';

interface ShortcutSettingsPanelProps {
  open: boolean;
  shortcuts: ShortcutMap;
  onChange: (shortcuts: ShortcutMap) => void;
  onClose: () => void;
}

export default function ShortcutSettingsPanel({
  open,
  shortcuts,
  onChange,
  onClose,
}: ShortcutSettingsPanelProps) {
  const [query, setQuery] = useState('');
  const [recordingId, setRecordingId] = useState<ShortcutActionId | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const conflicts = useMemo(() => getShortcutConflicts(shortcuts), [shortcuts]);
  const conflictedIds = useMemo(() => {
    const ids = new Set<ShortcutActionId>();
    conflicts.forEach(([, actionIds]) => actionIds.forEach((id) => ids.add(id)));
    return ids;
  }, [conflicts]);

  const groupedShortcuts = useMemo(() => {
    const lowerQuery = query.trim().toLowerCase();
    return SHORTCUT_DEFINITIONS.reduce((groups, definition) => {
      const binding = shortcuts[definition.id] || '';
      const searchable = `${definition.category} ${definition.label} ${binding} ${definition.description ?? ''}`.toLowerCase();
      if (lowerQuery && !searchable.includes(lowerQuery)) return groups;
      groups[definition.category] = [...(groups[definition.category] ?? []), definition];
      return groups;
    }, {} as Record<string, typeof SHORTCUT_DEFINITIONS>);
  }, [query, shortcuts]);

  if (!open) return null;

  const updateShortcut = (id: ShortcutActionId, binding: string) => {
    onChange({
      ...shortcuts,
      [id]: normalizeShortcut(binding),
    });
  };

  const handleRecordKeyDown = (event: React.KeyboardEvent, id: ShortcutActionId) => {
    event.preventDefault();
    event.stopPropagation();

    if (event.key === 'Escape') {
      setRecordingId(null);
      return;
    }

    const binding = eventToShortcut(event);
    if (!binding) return;
    updateShortcut(id, binding);
    setRecordingId(null);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-neutral-950/20 px-4 backdrop-blur-[2px]">
      <div className="shortcut-settings-panel flex max-h-[82vh] w-[760px] max-w-full flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl shadow-neutral-900/20">
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-neutral-950">快捷键设置</h2>
            <p className="mt-1 text-xs text-neutral-400">点击快捷键即可录入新组合键，重复组合会自动提示冲突。</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
            data-tooltip="关闭快捷键设置"
            data-tooltip-placement="bottom"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 border-b border-neutral-100 px-5 py-3">
          <div className="flex h-9 flex-1 items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3">
            <Search className="h-4 w-4 text-neutral-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索功能或快捷键"
              className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-neutral-400"
            />
          </div>
          <button
            onClick={() => onChange(DEFAULT_SHORTCUTS)}
            className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 text-xs font-semibold text-neutral-700 transition-colors hover:bg-neutral-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            恢复默认
          </button>
        </div>

        {conflicts.length > 0 && (
          <div className="border-b border-amber-100 bg-amber-50 px-5 py-2 text-xs text-amber-700">
            检测到 {conflicts.length} 组快捷键冲突，请调整红色标记项后再使用。
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {Object.entries(groupedShortcuts).map(([category, definitions]) => {
            const isCollapsed = collapsedCategories[category];
            return (
              <section key={category} className="mb-3 overflow-hidden rounded-xl border border-neutral-100">
                <button
                  onClick={() => setCollapsedCategories((current) => ({ ...current, [category]: !current[category] }))}
                  className="flex w-full cursor-pointer items-center justify-between bg-neutral-50 px-3 py-2 text-left text-xs font-bold text-neutral-700 transition-colors hover:bg-neutral-100"
                >
                  <span>{category}</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
                </button>

                {!isCollapsed && (
                  <div className="divide-y divide-neutral-100">
                    {definitions.map((definition) => {
                      const binding = shortcuts[definition.id] || '';
                      const hasConflict = conflictedIds.has(definition.id);
                      const isRecording = recordingId === definition.id;

                      return (
                        <div key={definition.id} className="grid grid-cols-[1fr_auto] items-center gap-4 px-3 py-2.5">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-neutral-900">{definition.label}</p>
                            {definition.description && (
                              <p className="mt-0.5 text-[11px] text-neutral-400">{definition.description}</p>
                            )}
                          </div>
                          <button
                            onClick={() => setRecordingId(definition.id)}
                            onKeyDown={(event) => handleRecordKeyDown(event, definition.id)}
                            className={`min-w-32 cursor-pointer rounded-lg border px-3 py-1.5 text-center font-sans text-[13px] font-semibold tabular-nums tracking-normal transition-colors ${
                              hasConflict
                                ? 'border-red-200 bg-red-50 text-red-600'
                                : isRecording
                                  ? 'border-neutral-900 bg-neutral-900 text-white'
                                  : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                            }`}
                          >
                            {isRecording ? '按下新快捷键...' : binding}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}

          {Object.keys(groupedShortcuts).length === 0 && (
            <div className="py-10 text-center text-sm text-neutral-400">没有找到匹配的快捷键。</div>
          )}
        </div>
      </div>
    </div>
  );
}
