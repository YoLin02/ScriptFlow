import { Download, PanelLeftOpen, Search, Upload } from 'lucide-react';
import type { EditorSearchState, MarkdownTransferState } from '../types';

interface EditorToolsDrawerProps {
  open: boolean;
  isOutlineOpen: boolean;
  markdownTransfer: MarkdownTransferState;
  search: EditorSearchState;
  onToggleOutline: () => void;
}

export default function EditorToolsDrawer({
  open,
  isOutlineOpen,
  markdownTransfer,
  search,
  onToggleOutline,
}: EditorToolsDrawerProps) {
  return (
    <div
      className={`overflow-hidden border-neutral-100 bg-white shadow-sm transition-[max-height,opacity,border-width,padding] duration-300 ease-out ${
        open ? 'max-h-28 border-b px-3 py-2 opacity-100' : 'max-h-0 border-b-0 px-3 py-0 opacity-0'
      }`}
    >
      <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-0.5">
        <button
          onClick={onToggleOutline}
          className={`flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition-colors ${
            isOutlineOpen
              ? 'border-neutral-200 bg-neutral-200 text-neutral-950'
              : 'border-neutral-200 text-neutral-700 hover:bg-neutral-50'
          }`}
        >
          <PanelLeftOpen className="h-3.5 w-3.5" />
          目录
        </button>
        <button
          onClick={() => search.setIsOpen((value) => !value)}
          className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md border border-neutral-200 px-2.5 py-1.5 text-xs text-neutral-700 hover:bg-neutral-50"
        >
          <Search className="h-3.5 w-3.5" />
          查找替换
        </button>
        <button
          onClick={markdownTransfer.triggerImport}
          className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md border border-neutral-200 px-2.5 py-1.5 text-xs text-neutral-700 hover:bg-neutral-50"
        >
          <Download className="h-3.5 w-3.5" />
          导入MD
        </button>
        <button
          onClick={markdownTransfer.exportMarkdown}
          className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md border border-neutral-200 px-2.5 py-1.5 text-xs text-neutral-700 hover:bg-neutral-50"
        >
          <Upload className="h-3.5 w-3.5" />
          导出MD
        </button>
      </div>
      <input
        ref={markdownTransfer.markdownInputRef}
        type="file"
        accept=".md,.markdown,text/markdown,text/plain"
        className="hidden"
        onChange={markdownTransfer.handleMarkdownImport}
      />
    </div>
  );
}
