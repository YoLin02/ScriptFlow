import { Edge } from '@xyflow/react';
import { Trash2 } from 'lucide-react';
import { DEFAULT_RELATION_TAGS } from './flowCanvasUtils';
import { useFeedback } from './feedback/FeedbackProvider';

interface EdgeRelationshipEditorProps {
  selectedEdge: Edge | null;
  shortcutTags: string[];
  customEdgeRelation: string;
  onCustomEdgeRelationChange: (value: string) => void;
  onShortcutTagsChange: React.Dispatch<React.SetStateAction<string[]>>;
  onSave: (typeLabel: string) => void;
  onDelete: () => void;
  onClose: () => void;
}

export default function EdgeRelationshipEditor({
  selectedEdge,
  shortcutTags,
  customEdgeRelation,
  onCustomEdgeRelationChange,
  onShortcutTagsChange,
  onSave,
  onDelete,
  onClose,
}: EdgeRelationshipEditorProps) {
  const { confirm: askConfirm } = useFeedback();

  if (!selectedEdge) return null;

  return (
    <div className="absolute top-[72px] left-4 z-50 bg-white border border-neutral-200/90 shadow-xl rounded-lg p-4 w-[320px] animate-in fade-in slide-in-from-top-2 duration-200 text-xs text-neutral-800">
      <div className="flex items-center justify-between mb-3 border-b border-neutral-100 pb-2">
        <span className="font-semibold text-neutral-700 uppercase tracking-wide text-[11px] flex items-center gap-1">
          <span>连线逻辑设置</span>
        </span>
        <button
          onClick={onDelete}
          className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100/60 p-1.5 rounded transition-colors cursor-pointer"
          data-tooltip="断开此连线"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="mb-3.5">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[11px] font-medium text-neutral-400">选择快捷标签：</span>
          {JSON.stringify(shortcutTags) !== JSON.stringify(DEFAULT_RELATION_TAGS) && (
            <button
              onClick={async () => {
                const confirmed = await askConfirm({
                  title: '重置标签库',
                  message: '是否将快捷标签恢复为默认标签库？',
                  confirmText: '重置',
                  cancelText: '取消',
                  destructive: true,
                });
                if (confirmed) {
                  onShortcutTagsChange(DEFAULT_RELATION_TAGS);
                }
              }}
              className="text-[9px] text-neutral-400 hover:text-red-500 transition-colors cursor-pointer"
            >
              重置为默认
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto pr-1">
          {shortcutTags.map((tag) => {
            const isSelected = customEdgeRelation === tag;

            return (
              <div
                key={tag}
                className={`inline-flex items-center gap-1 group px-2 py-1 rounded border text-xs font-medium cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-neutral-900 border-neutral-900 text-white shadow-xs'
                    : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-150 text-neutral-700'
                }`}
                onClick={() => onCustomEdgeRelationChange(tag)}
                onDoubleClick={() => onSave(tag)}
                data-tooltip="双击直接保存该标签"
              >
                <span>{tag}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onShortcutTagsChange((prev) => prev.filter((item) => item !== tag));
                    if (customEdgeRelation === tag) {
                      onCustomEdgeRelationChange('');
                    }
                  }}
                  className={`text-[11px] leading-none text-neutral-400 hover:text-red-500 ml-0.5 rounded-full hover:bg-neutral-200/50 w-3.5 h-3.5 flex items-center justify-center font-bold md:opacity-0 md:group-hover:opacity-100 transition-opacity ${
                    isSelected ? 'text-white/60 hover:text-white hover:bg-white/25' : ''
                  }`}
                  data-tooltip="从标签库中删除"
                >
                  ×
                </button>
              </div>
            );
          })}
          {shortcutTags.length === 0 && (
            <div className="text-[11px] text-neutral-400 py-2 italic text-center w-full">标签库已空，请输入新连接后再应用</div>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <span className="text-[11px] font-medium text-neutral-400">自定义输入或更新：</span>
        <input
          type="text"
          value={customEdgeRelation}
          onChange={(e) => onCustomEdgeRelationChange(e.target.value)}
          placeholder="请输入或选择连接语（例如：但是、因此）"
          className="w-full px-2.5 py-1.5 border border-neutral-200 rounded-md text-xs focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 outline-none placeholder-neutral-400 bg-neutral-25/30"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onSave(customEdgeRelation);
            }
          }}
        />
      </div>

      <div className="mt-4 pt-2.5 border-t border-neutral-100 flex justify-end gap-2">
        <button
          onClick={onClose}
          className="px-2.5 py-1 text-[11px] text-neutral-400 hover:text-neutral-700 bg-transparent hover:bg-neutral-50 rounded transition-colors cursor-pointer"
        >
          取消
        </button>
        <button
          onClick={() => onSave(customEdgeRelation)}
          className="px-3.5 py-1.5 text-[11px] font-semibold bg-neutral-900 text-white hover:bg-neutral-800 rounded-md transition-colors cursor-pointer shadow-xs"
        >
          保存并应用
        </button>
      </div>
    </div>
  );
}
