import { Boxes, Layers3, Plus, Trash2, X } from 'lucide-react';
import type { CanvasRegionTemplate } from '../templates/types';

interface CanvasTemplatePanelProps {
  templates: CanvasRegionTemplate[];
  canSaveSelection: boolean;
  templateCountLabel: string;
  onSaveSelection: () => void;
  onInsertTemplate: (templateId: string) => void;
  onRenameTemplate: (templateId: string, name: string) => void;
  onDeleteTemplate: (templateId: string) => void;
  onClose: () => void;
}

export default function CanvasTemplatePanel({
  templates,
  canSaveSelection,
  templateCountLabel,
  onSaveSelection,
  onInsertTemplate,
  onRenameTemplate,
  onDeleteTemplate,
  onClose,
}: CanvasTemplatePanelProps) {
  return (
    <aside className="pointer-events-auto absolute right-4 top-20 z-40 w-[17.5rem] max-w-[calc(100vw-2rem)] rounded-xl border border-neutral-200/80 bg-white/95 p-2.5 text-left shadow-xl shadow-neutral-900/10 backdrop-blur-md animate-in fade-in slide-in-from-right-2 duration-150">
      <header className="flex items-start justify-between gap-2 border-b border-neutral-100 pb-2.5">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-700">
            <Boxes className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-base font-bold text-neutral-950">节点模板</h3>
            <p className="mt-0.5 truncate text-xs text-neutral-400">{templateCountLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onSaveSelection}
            disabled={!canSaveSelection}
            className="inline-flex h-8 cursor-pointer items-center rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-[11px] font-bold text-neutral-700 shadow-xs transition-all hover:border-neutral-300 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:border-neutral-100 disabled:bg-neutral-100 disabled:text-neutral-400"
            data-tooltip={canSaveSelection ? '保存当前选中区域为模板' : '请先框选节点'}
            data-tooltip-placement="bottom"
          >
            保存
          </button>
          <button
            onClick={onClose}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
            data-tooltip="关闭模板库"
            data-tooltip-placement="bottom"
            aria-label="关闭模板库"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="mt-2.5 max-h-[52vh] space-y-2 overflow-y-auto pr-1">
        {templates.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50/60 px-4 py-8 text-center">
            <Layers3 className="mx-auto h-6 w-6 text-neutral-300" />
            <p className="mt-2 text-xs font-semibold text-neutral-500">暂无节点模板</p>
            <p className="mt-1 text-[11px] leading-relaxed text-neutral-400">
              框选一组节点后，点击右上角保存即可生成模板。
            </p>
          </div>
        ) : (
          templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onInsert={() => onInsertTemplate(template.id)}
              onRename={(name) => onRenameTemplate(template.id, name)}
              onDelete={() => onDeleteTemplate(template.id)}
            />
          ))
        )}
      </div>
    </aside>
  );
}

function TemplateCard({
  template,
  onInsert,
  onRename,
  onDelete,
}: {
  template: CanvasRegionTemplate;
  onInsert: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
}) {
  const savedTime = new Date(template.updatedAt || template.createdAt).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <article className="rounded-xl border border-neutral-100 bg-white p-3 shadow-sm transition-colors hover:border-neutral-200 hover:bg-neutral-50/40">
      <input
        value={template.name}
        onChange={(event) => onRename(event.target.value)}
        className="w-full rounded-md border border-transparent bg-transparent px-1 py-0.5 text-sm font-bold text-neutral-950 outline-none transition-colors hover:border-neutral-200 hover:bg-white focus:border-neutral-300 focus:bg-white"
        aria-label="模板名称"
      />
      <p className="mt-1 truncate px-1 text-[11px] font-medium text-neutral-400">
        {template.nodes.length} 节点 · {template.edges.length} 连线 · {savedTime}
      </p>

      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={onInsert}
          className="inline-flex h-8 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 text-[11px] font-bold text-neutral-800 transition-colors hover:border-neutral-300 hover:bg-neutral-100"
        >
          <Plus className="h-3.5 w-3.5" />
          插入模板
        </button>
        <button
          onClick={onDelete}
          className="inline-flex h-8 cursor-pointer items-center justify-center rounded-lg border border-red-100 px-2.5 text-red-500 transition-colors hover:bg-red-50 hover:text-red-600"
          data-tooltip="删除模板"
          data-tooltip-placement="bottom"
          aria-label="删除模板"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </article>
  );
}
