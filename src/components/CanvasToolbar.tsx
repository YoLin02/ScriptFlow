import { Film, FolderOpen, Image, Lightbulb, MoreHorizontal, Table, Type } from 'lucide-react';
import type { ReactNode } from 'react';
import { AutoSaveStatus, NodeType } from '../types';

interface CanvasToolbarProps {
  isDrawerOpen: boolean;
  isMediaLibraryOpen: boolean;
  mediaAssetCount: number;
  saveStatus: AutoSaveStatus;
  lastSavedAt: number | null;
  saveError: string | null;
  onToggleMediaLibrary: () => void;
  onToggleDrawer: () => void;
  onAddNode: (type: NodeType) => void;
}

export default function CanvasToolbar({
  isDrawerOpen,
  isMediaLibraryOpen,
  mediaAssetCount,
  saveStatus,
  lastSavedAt,
  saveError,
  onToggleMediaLibrary,
  onToggleDrawer,
  onAddNode,
}: CanvasToolbarProps) {
  return (
    <div className="pointer-events-none absolute bottom-6 left-1/2 z-30 flex -translate-x-1/2 flex-col items-center gap-2">
      <SaveStatusText status={saveStatus} lastSavedAt={lastSavedAt} error={saveError} />

      <div className="pointer-events-auto flex items-center gap-1.5 rounded-2xl border border-neutral-200/80 bg-white/90 px-2 py-2 shadow-xl shadow-neutral-900/10 backdrop-blur-md">
        <ToolbarIconButton title="文本" onClick={() => onAddNode('text')}>
          <Type className="h-4 w-4" />
        </ToolbarIconButton>
        <ToolbarIconButton title="图片" onClick={() => onAddNode('image')}>
          <Image className="h-4 w-4" />
        </ToolbarIconButton>
        <ToolbarIconButton title="便签" onClick={() => onAddNode('idea')}>
          <Lightbulb className="h-4 w-4" />
        </ToolbarIconButton>
        <ToolbarIconButton title="表格" onClick={() => onAddNode('table')}>
          <Table className="h-4 w-4" />
        </ToolbarIconButton>
        <ToolbarIconButton title="轨道" onClick={() => onAddNode('timeline')}>
          <Film className="h-4 w-4" />
        </ToolbarIconButton>

        <div className="mx-1 h-5 w-px bg-neutral-200" />

        <ToolbarIconButton title="配图库" onClick={onToggleMediaLibrary} active={isMediaLibraryOpen}>
          <span className="relative">
            <FolderOpen className="h-4 w-4" />
            {mediaAssetCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full border border-white bg-neutral-900 px-1 text-[9px] font-bold leading-none text-white">
                {mediaAssetCount}
              </span>
            )}
          </span>
        </ToolbarIconButton>

        <ToolbarIconButton title="更多工具" onClick={onToggleDrawer} active={isDrawerOpen}>
          <MoreHorizontal className="h-4 w-4" />
        </ToolbarIconButton>
      </div>

      {isDrawerOpen && (
        <div className="pointer-events-auto rounded-xl border border-neutral-200/80 bg-white/95 px-3 py-2 text-[11px] text-neutral-400 shadow-lg shadow-neutral-900/10 backdrop-blur-md">
          更多工具暂未配置
        </div>
      )}
    </div>
  );
}

function ToolbarIconButton({
  children,
  title,
  active = false,
  danger = false,
  onClick,
}: {
  children: ReactNode;
  title: string;
  active?: boolean;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-all duration-150 ${
        active
          ? 'border-neutral-900 bg-neutral-900 text-white shadow-sm'
          : danger
            ? 'border-transparent text-red-500 hover:border-red-100 hover:bg-red-50'
            : 'border-transparent text-neutral-500 hover:border-neutral-200 hover:bg-neutral-100 hover:text-neutral-950'
      }`}
      title={title}
      aria-label={title}
    >
      {children}
    </button>
  );
}

function SaveStatusText({ status, lastSavedAt, error }: { status: AutoSaveStatus; lastSavedAt: number | null; error: string | null }) {
  const isVisible = !!lastSavedAt || status === 'pending' || status === 'saving' || status === 'error';
  if (!isVisible) return null;

  const savedTime = lastSavedAt
    ? new Date(lastSavedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '--:--';

  const text = status === 'error'
    ? `保存失败：${error || '请稍后重试'}`
    : status === 'saving'
      ? '正在保存'
      : status === 'pending'
        ? '准备保存'
        : `最近保存 ${savedTime}`;

  return (
    <div className={`rounded-full bg-white/85 px-2 py-1 text-[10px] font-medium leading-none shadow-sm backdrop-blur-sm ${
      status === 'error' ? 'text-red-500' : 'text-neutral-400'
    }`}>
      {text}
    </div>
  );
}
