import { X } from 'lucide-react';
import type { OutlineEntry } from '../types';

interface EditorOutlinePanelProps {
  open: boolean;
  outline: OutlineEntry[];
  onClose: () => void;
  onJumpToOutline: (entry: OutlineEntry) => void;
}

export default function EditorOutlinePanel({
  open,
  outline,
  onClose,
  onJumpToOutline,
}: EditorOutlinePanelProps) {
  return (
    <aside
      className={`h-full shrink-0 overflow-hidden border-r border-neutral-200 bg-white/95 transition-[width,opacity] duration-300 ease-out ${
        open ? 'w-[252px] opacity-100' : 'w-0 opacity-0'
      }`}
    >
      <div className="flex h-full w-[252px] flex-col">
        <div className="flex h-[57px] items-center justify-between border-b border-neutral-100 px-4">
          <div>
            <p className="text-sm font-semibold text-neutral-900">目录</p>
            <p className="text-[11px] text-neutral-400">基于 H1 / H2 / H3 自动生成</p>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer rounded-md p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-800"
            data-tooltip="关闭目录"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-1 overflow-y-auto p-3">
          {outline.length === 0 ? (
            <p className="py-6 text-center text-xs text-neutral-400">使用 H1 / H2 / H3 后会显示目录</p>
          ) : (
            outline.map((entry, index) => (
              <button
                key={`${entry.id}-${index}`}
                onClick={() => onJumpToOutline(entry)}
                className="w-full cursor-pointer rounded-lg px-3 py-2 text-left transition-colors hover:bg-neutral-50"
                style={{ paddingLeft: `${12 + (entry.level - 1) * 16}px` }}
              >
                <span className="block text-[10px] text-neutral-400">H{entry.level}</span>
                <span className="block truncate text-sm text-neutral-800">{entry.text}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </aside>
  );
}
