import { Boxes, Film, FolderOpen, Image, Lightbulb, MoreHorizontal, Sparkles, Table, Type, Wrench } from 'lucide-react';
import type { ReactNode } from 'react';
import { AutoSaveStatus, NodeType } from '../../../types';
import type { ShortcutMap } from '../../shortcuts';

interface CanvasToolbarProps {
  isDrawerOpen: boolean;
  isMediaLibraryOpen: boolean;
  mediaAssetCount: number;
  saveStatus: AutoSaveStatus;
  lastSavedAt: number | null;
  saveError: string | null;
  shortcuts: ShortcutMap;
  onToggleMediaLibrary: () => void;
  onToggleDrawer: () => void;
  onOpenTemplates: () => void;
  onAddNode: (type: NodeType) => void;
}

export default function CanvasToolbar({
  isDrawerOpen,
  isMediaLibraryOpen,
  mediaAssetCount,
  saveStatus,
  lastSavedAt,
  saveError,
  shortcuts,
  onToggleMediaLibrary,
  onToggleDrawer,
  onOpenTemplates,
  onAddNode,
}: CanvasToolbarProps) {
  return (
    <div className="pointer-events-none absolute bottom-6 left-1/2 z-30 flex -translate-x-1/2 cursor-default flex-col items-center gap-1.5">
      <SaveStatusText status={saveStatus} lastSavedAt={lastSavedAt} error={saveError} />

      <div className="pointer-events-auto flex cursor-default items-center gap-1.5 rounded-2xl border border-neutral-200/80 bg-white/90 px-2 py-2 shadow-xl shadow-neutral-900/10 backdrop-blur-md">
        <ToolbarIconButton title="文本" shortcut={shortcuts['canvas.addText']} onClick={() => onAddNode('text')}>
          <Type className="h-4 w-4" />
        </ToolbarIconButton>
        <ToolbarIconButton title="图片" shortcut={shortcuts['canvas.addImage']} onClick={() => onAddNode('image')}>
          <Image className="h-4 w-4" />
        </ToolbarIconButton>
        <ToolbarIconButton title="便签" shortcut={shortcuts['canvas.addIdea']} onClick={() => onAddNode('idea')}>
          <Lightbulb className="h-4 w-4" />
        </ToolbarIconButton>
        <ToolbarIconButton title="表格" shortcut={shortcuts['canvas.addTable']} onClick={() => onAddNode('table')}>
          <Table className="h-4 w-4" />
        </ToolbarIconButton>
        <ToolbarIconButton title="轨道" shortcut={shortcuts['canvas.addTimeline']} onClick={() => onAddNode('timeline')}>
          <Film className="h-4 w-4" />
        </ToolbarIconButton>

        <div className="mx-1 h-5 w-px bg-neutral-200" />

        <ToolbarIconButton title="配图库" shortcut={shortcuts['canvas.toggleMediaLibrary']} onClick={onToggleMediaLibrary} active={isMediaLibraryOpen}>
          <span className="relative">
            <FolderOpen className="h-4 w-4" />
            {mediaAssetCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full border border-white bg-neutral-900 px-1 text-[9px] font-bold leading-none text-white">
                {mediaAssetCount}
              </span>
            )}
          </span>
        </ToolbarIconButton>

        <ToolbarIconButton title="更多工具" shortcut={shortcuts['canvas.toggleMoreTools']} onClick={onToggleDrawer} active={isDrawerOpen}>
          <MoreHorizontal className="h-4 w-4" />
        </ToolbarIconButton>
      </div>

      {isDrawerOpen && (
        <div className="pointer-events-auto flex translate-x-[46px] cursor-default items-center gap-1.5 rounded-2xl border border-neutral-200/80 bg-white/95 px-2 py-2 text-neutral-500 shadow-lg shadow-neutral-900/10 backdrop-blur-md animate-in fade-in slide-in-from-bottom-1 duration-150">
          <ToolDrawerButton icon={<Boxes className="h-4 w-4" />} label="节点模板" onClick={onOpenTemplates} />
          <ToolDrawerButton icon={<Sparkles className="h-4 w-4" />} label="智能工具" disabled />
          <ToolDrawerButton icon={<Wrench className="h-4 w-4" />} label="更多占位" disabled />
        </div>
      )}
    </div>
  );
}

function ToolDrawerButton({
  icon,
  label,
  disabled = false,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="group relative flex h-[38px] w-[38px] cursor-pointer items-center justify-center rounded-xl border border-transparent text-neutral-500 transition-colors hover:border-neutral-200 hover:bg-neutral-100 hover:text-neutral-950 disabled:cursor-not-allowed disabled:text-neutral-300 disabled:hover:border-transparent disabled:hover:bg-transparent"
      aria-label={label}
    >
      {icon}
      <span className="pointer-events-none absolute bottom-[calc(100%+10px)] left-1/2 z-50 -translate-x-1/2 translate-y-1 rounded-[3px] bg-neutral-950 px-2.5 py-1.5 font-sans text-[12px] font-bold leading-none text-white opacity-0 shadow-lg shadow-neutral-900/20 transition-all duration-150 group-hover:translate-y-0 group-hover:opacity-100">
        <span className="whitespace-nowrap">{label}</span>
        <span className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-x-[5px] border-t-[6px] border-x-transparent border-t-neutral-950" />
      </span>
    </button>
  );
}

function ToolbarIconButton({
  children,
  title,
  shortcut,
  active = false,
  danger = false,
  onClick,
}: {
  children: ReactNode;
  title: string;
  shortcut?: string;
  active?: boolean;
  danger?: boolean;
  onClick: () => void;
}) {
  const tooltipText = shortcut ? `${title} — ${shortcut}` : title;

  return (
    <span className="group relative inline-flex">
      <button
        onClick={onClick}
        className={`flex h-[38px] w-[38px] cursor-pointer items-center justify-center rounded-xl border transition-all duration-150 ${
          active
            ? 'border-neutral-200 bg-neutral-200 text-neutral-950 shadow-sm'
            : danger
              ? 'border-transparent text-red-500 hover:border-red-100 hover:bg-red-50'
              : 'border-transparent text-neutral-500 hover:border-neutral-200 hover:bg-neutral-100 hover:text-neutral-950'
        }`}
        aria-label={title}
      >
        {children}
      </button>
      <span className="pointer-events-none absolute bottom-[calc(100%+10px)] left-1/2 z-50 -translate-x-1/2 translate-y-1 rounded-[3px] bg-neutral-950 px-2.5 py-1.5 font-sans text-[12px] font-bold leading-none text-white opacity-0 shadow-lg shadow-neutral-900/20 transition-all duration-150 group-hover:translate-y-0 group-hover:opacity-100">
        <span className="whitespace-nowrap">{tooltipText}</span>
        <span className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-x-[5px] border-t-[6px] border-x-transparent border-t-neutral-950" />
      </span>
    </span>
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
