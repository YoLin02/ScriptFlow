import { ChevronDown, ChevronRight, ChevronUp } from 'lucide-react';
import type { ParagraphEntry } from '../types';
import { countReadableUnits } from '../utils/editorText';

interface ParagraphSlicePanelProps {
  collapsed: boolean;
  paragraphs: ParagraphEntry[];
  onToggleCollapsed: () => void;
  onExtractParagraph: (paragraph: ParagraphEntry, index: number) => void;
}

export default function ParagraphSlicePanel({
  collapsed,
  paragraphs,
  onToggleCollapsed,
  onExtractParagraph,
}: ParagraphSlicePanelProps) {
  return (
    <div
      className={`flex shrink-0 flex-col overflow-hidden border-t border-neutral-100 bg-white transition-all duration-300 ease-in-out ${
        collapsed ? 'h-[44px]' : 'h-[240px]'
      }`}
    >
      <div
        onClick={onToggleCollapsed}
        className="flex shrink-0 cursor-pointer select-none items-center justify-between border-b border-neutral-100 bg-neutral-50/50 p-3 px-4 transition-colors hover:bg-neutral-50"
      >
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            段落切片管理器 ({paragraphs.length})
          </h3>
          {!collapsed && <span className="text-[10px] text-neutral-400">点击 ➔ 将对应段落发到画布</span>}
        </div>
        <button
          onClick={(event) => {
            event.stopPropagation();
            onToggleCollapsed();
          }}
          className="rounded p-0.5 text-neutral-400 transition-colors hover:bg-neutral-200 hover:text-neutral-700"
          data-tooltip={collapsed ? '展开管理器' : '收起管理器'}
          data-tooltip-placement="bottom"
        >
          {collapsed ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {!collapsed && (
        <div className="flex-1 space-y-1.5 overflow-y-auto p-4 pr-1 text-xs">
          {paragraphs.length === 0 ? (
            <p className="py-4 text-center italic text-neutral-400">在主编辑器输入带有段落的内容...</p>
          ) : (
            paragraphs.map((paragraph, index) => (
              <div
                key={`${paragraph.id}-${index}`}
                className="group flex items-start justify-between gap-3 rounded border border-neutral-100 p-2 text-neutral-600 transition-all hover:bg-neutral-50 hover:text-neutral-900"
              >
                <span className="w-5 select-none pt-0.5 font-mono text-[10px] text-neutral-400">
                  {(index + 1).toString().padStart(2, '0')}
                </span>
                <p className="line-clamp-1 flex-1 font-sans leading-normal text-neutral-700">
                  {paragraph.text}
                </p>
                <span className="whitespace-nowrap pt-0.5 text-[10px] text-neutral-400">
                  {countReadableUnits(paragraph.text)} 字
                </span>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    onExtractParagraph(paragraph, index);
                  }}
                  className="cursor-pointer rounded-sm p-1 text-neutral-400 opacity-80 transition-all hover:bg-neutral-200 hover:text-neutral-800 group-hover:opacity-100"
                  data-tooltip="生成画布节点"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
