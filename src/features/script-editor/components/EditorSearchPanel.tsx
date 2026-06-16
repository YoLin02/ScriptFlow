import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import type { EditorSearchState } from '../types';

interface EditorSearchPanelProps {
  search: EditorSearchState;
}

export default function EditorSearchPanel({ search }: EditorSearchPanelProps) {
  if (!search.isMounted) return null;

  return (
    <div
      className={`absolute right-3 top-[88px] z-50 w-[360px] max-w-[calc(100%-24px)] origin-top-right rounded-xl border border-neutral-200 bg-white px-2.5 py-2 shadow-xl shadow-neutral-900/10 transition-all duration-200 ease-out ${
        search.isOpen
          ? 'translate-y-0 scale-100 opacity-100'
          : 'pointer-events-none -translate-y-1 scale-[0.98] opacity-0'
      }`}
    >
      <div className="flex items-center gap-1.5">
        <Search className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
        <input
          value={search.searchQuery}
          onChange={(event) => search.setSearchQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              search.findNext();
            }
          }}
          placeholder="查找"
          className="h-7 min-w-0 flex-1 rounded-md border border-neutral-200 bg-white px-2 text-xs outline-none transition-colors focus:border-neutral-500"
          autoFocus
        />
        <input
          value={search.replaceValue}
          onChange={(event) => search.setReplaceValue(event.target.value)}
          placeholder="替换"
          className="h-7 min-w-0 flex-1 rounded-md border border-neutral-200 bg-white px-2 text-xs outline-none transition-colors focus:border-neutral-500"
        />
        <button
          onClick={search.close}
          className="shrink-0 rounded-md p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-800"
          data-tooltip="关闭查找替换"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="mt-1.5 flex items-center gap-1.5">
        <span className="mr-auto max-w-32 truncate text-[10px] text-neutral-400">
          {search.searchResultText || '未查找'}
        </span>
        <div className="flex shrink-0 overflow-hidden rounded-md border border-neutral-200 bg-white">
          <button
            onClick={search.findPrevious}
            className="flex h-7 w-7 items-center justify-center text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
            data-tooltip="上一处"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={search.findNext}
            className="flex h-7 w-7 items-center justify-center border-l border-neutral-200 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
            data-tooltip="下一处"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
        <button
          onClick={search.replaceCurrent}
          className="h-7 rounded-md border border-neutral-200 bg-white px-2.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-100"
        >
          替换
        </button>
        <button
          onClick={search.replaceAll}
          className="h-7 rounded-md border border-neutral-200 bg-white px-2.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-100"
        >
          全部替换
        </button>
      </div>
    </div>
  );
}
