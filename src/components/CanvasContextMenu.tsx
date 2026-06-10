import { AlignHorizontalDistributeCenter, AlignVerticalDistributeCenter, Copy, PanelTop, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';

interface CanvasContextMenuProps {
  x: number;
  y: number;
  selectedCount: number;
  canPaste: boolean;
  onCopy: () => void;
  onPaste: () => void;
  onDelete: () => void;
  onAlignLeft: () => void;
  onAlignTop: () => void;
  onDistributeHorizontal: () => void;
  onDistributeVertical: () => void;
  onClose: () => void;
}

export default function CanvasContextMenu({
  x,
  y,
  selectedCount,
  canPaste,
  onCopy,
  onPaste,
  onDelete,
  onAlignLeft,
  onAlignTop,
  onDistributeHorizontal,
  onDistributeVertical,
}: CanvasContextMenuProps) {
  const selectionLabel = selectedCount > 1 ? `${selectedCount} 个节点` : '当前节点';
  const hasSelection = selectedCount > 0;
  const canAlign = selectedCount > 1;
  const canDistribute = selectedCount > 2;

  return (
    <div
      className="fixed z-[80] w-56 rounded-2xl border border-neutral-200 bg-white/95 py-2 text-sm text-neutral-800 shadow-2xl shadow-neutral-900/15 backdrop-blur-md"
      style={{ left: x, top: y }}
      onContextMenu={(event) => event.preventDefault()}
    >
      <div className="px-4 pb-2 pt-1 text-[11px] font-semibold text-neutral-400">{hasSelection ? selectionLabel : '画布'}</div>
      <MenuButton icon={<Copy className="h-4 w-4" />} label="复制" shortcut="Ctrl + C" onClick={onCopy} disabled={!hasSelection} />
      <MenuButton icon={<Copy className="h-4 w-4" />} label="粘贴到此处" shortcut="Ctrl + V" onClick={onPaste} disabled={!canPaste} />
      <MenuButton icon={<Trash2 className="h-4 w-4" />} label="删除" shortcut="Del" onClick={onDelete} disabled={!hasSelection} danger />

      <div className="my-2 h-px bg-neutral-100" />
      <MenuButton icon={<PanelTop className="h-4 w-4" />} label="左对齐" onClick={onAlignLeft} disabled={!canAlign} />
      <MenuButton icon={<PanelTop className="h-4 w-4 rotate-90" />} label="顶部对齐" onClick={onAlignTop} disabled={!canAlign} />
      <MenuButton icon={<AlignHorizontalDistributeCenter className="h-4 w-4" />} label="水平分布" onClick={onDistributeHorizontal} disabled={!canDistribute} />
      <MenuButton icon={<AlignVerticalDistributeCenter className="h-4 w-4" />} label="垂直分布" onClick={onDistributeVertical} disabled={!canDistribute} />
    </div>
  );
}

function MenuButton({
  icon,
  label,
  shortcut,
  danger = false,
  disabled = false,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  shortcut?: string;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-center gap-3 px-4 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        danger ? 'text-red-600 hover:bg-red-50' : 'hover:bg-neutral-50'
      }`}
    >
      <span className={danger ? 'text-red-500' : 'text-neutral-400'}>{icon}</span>
      <span className="flex-1">{label}</span>
      {shortcut && <span className="text-xs text-neutral-400">{shortcut}</span>}
    </button>
  );
}
