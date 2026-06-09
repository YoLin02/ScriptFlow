import { Redo2, Undo2 } from 'lucide-react';

interface WorkspaceHistoryControlsProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

export default function WorkspaceHistoryControls({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: WorkspaceHistoryControlsProps) {
  return (
    <div className="flex items-center gap-1 bg-white/70 backdrop-blur-md border border-neutral-200/50 shadow-md py-1 px-1.5 rounded-lg">
      <button
        onClick={onUndo}
        disabled={!canUndo}
        className="flex items-center justify-center w-7 h-7 rounded-md text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 disabled:text-neutral-300 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all cursor-pointer"
        title="撤销工作区操作"
      >
        <Undo2 className="w-4 h-4" />
      </button>
      <button
        onClick={onRedo}
        disabled={!canRedo}
        className="flex items-center justify-center w-7 h-7 rounded-md text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 disabled:text-neutral-300 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all cursor-pointer"
        title="重做工作区操作"
      >
        <Redo2 className="w-4 h-4" />
      </button>
    </div>
  );
}
