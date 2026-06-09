import { BookOpen, Film, FolderOpen, Image, Layers, Lightbulb, PlusCircle, Table, Trash2 } from 'lucide-react';
import { NodeType } from '../types';

interface CanvasToolbarProps {
  isDrawerOpen: boolean;
  isMediaLibraryOpen: boolean;
  mediaAssetCount: number;
  onToggleMediaLibrary: () => void;
  onToggleDrawer: () => void;
  onAddNode: (type: NodeType) => void;
  onAutoLayout: () => void;
  onAssembleDocument: () => void;
  onRequestClearCanvas: () => void;
}

export default function CanvasToolbar({
  isDrawerOpen,
  isMediaLibraryOpen,
  mediaAssetCount,
  onToggleMediaLibrary,
  onToggleDrawer,
  onAddNode,
  onAutoLayout,
  onAssembleDocument,
  onRequestClearCanvas,
}: CanvasToolbarProps) {
  const handleAddNode = (type: NodeType) => {
    onAddNode(type);
  };

  return (
    <div className="flex items-center gap-1.5 relative">
      <button
        onClick={onToggleMediaLibrary}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-all cursor-pointer font-semibold text-xs h-7 select-none ${
          isMediaLibraryOpen
            ? 'bg-neutral-900 border border-neutral-900 text-white'
            : 'bg-transparent text-neutral-650 hover:text-neutral-900 hover:bg-neutral-100'
        }`}
        id="medialibrary-drawer-trigger"
        title="配图文件夹"
      >
        <FolderOpen className="w-4 h-4" />
        <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-white text-neutral-900 border border-neutral-200/85 filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
          {mediaAssetCount}
        </span>
      </button>

      <button
        onClick={onToggleDrawer}
        className={`flex items-center justify-center p-1 rounded-md transition-all cursor-pointer font-semibold text-xs h-7 w-7 select-none ${
          isDrawerOpen
            ? 'bg-neutral-900 border border-neutral-900 text-white'
            : 'bg-transparent text-neutral-650 hover:text-neutral-900 hover:bg-neutral-100'
        }`}
        id="toolbox-drawer-trigger"
        title="画布工具箱"
      >
        <Layers className="w-4 h-4" />
      </button>

      {isDrawerOpen && (
        <div className="absolute right-0 top-[34px] w-56 bg-white/95 backdrop-blur-md border border-neutral-200 shadow-xl rounded-lg py-1.5 z-50 text-neutral-700 animate-in fade-in slide-in-from-top-1 text-left">
          <div className="px-3 py-1 text-[9px] uppercase font-bold tracking-wider text-neutral-400 select-none">
            创建卡片
          </div>
          <ToolboxButton icon={<PlusCircle className="w-3.5 h-3.5 text-neutral-400" />} label="添加文本卡片" onClick={() => handleAddNode('text')} />
          <ToolboxButton icon={<Image className="w-3.5 h-3.5 text-neutral-400" />} label="添加配图卡片" onClick={() => handleAddNode('image')} />
          <ToolboxButton icon={<Lightbulb className="w-3.5 h-3.5 text-neutral-400" />} label="添加想法卡片" onClick={() => handleAddNode('idea')} />
          <ToolboxButton icon={<Table className="w-3.5 h-3.5 text-neutral-400" />} label="添加表格卡片" onClick={() => handleAddNode('table')} />
          <ToolboxButton icon={<Film className="w-3.5 h-3.5 text-neutral-400" />} label="添加时间轴轨道" onClick={() => handleAddNode('timeline')} />

          <div className="h-px bg-neutral-100 my-1.5" />

          <div className="px-3 py-1 text-[9px] uppercase font-bold tracking-wider text-neutral-400 select-none">
            拓扑和排版
          </div>
          <ToolboxButton icon={<Layers className="w-3.5 h-3.5 text-neutral-400" />} label="整理重排画布" onClick={onAutoLayout} />
          <ToolboxButton icon={<BookOpen className="w-3.5 h-3.5 text-neutral-400" />} label="逆向还原至主页" onClick={onAssembleDocument} />

          <div className="h-px bg-neutral-100 my-1.5" />

          <button
            onClick={onRequestClearCanvas}
            className="w-full px-3 py-1.5 text-xs text-red-650 hover:bg-red-50 flex items-center gap-2 transition-colors text-left cursor-pointer font-medium rounded animate-none"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-500" />
            <span>清空画布内容</span>
          </button>
        </div>
      )}
    </div>
  );
}

function ToolboxButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full px-3 py-1.5 text-xs text-neutral-700 hover:bg-neutral-50 flex items-center gap-2 transition-colors text-left cursor-pointer font-medium"
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
