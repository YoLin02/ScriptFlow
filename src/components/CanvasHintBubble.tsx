interface CanvasHintBubbleProps {
  onClose: () => void;
}

export default function CanvasHintBubble({ onClose }: CanvasHintBubbleProps) {
  return (
    <div className="absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur-md border border-neutral-200/90 shadow-md rounded-lg p-3.5 text-[11px] text-neutral-550 max-w-[280px] pointer-events-auto transition-all animate-in fade-in duration-200">
      <div className="flex items-center justify-between mb-1">
        <span className="font-semibold text-neutral-700 flex items-center gap-1">
          <span>操作提示</span>
        </span>
        <button
          onClick={onClose}
          className="text-neutral-400 hover:text-neutral-700 p-0.5 hover:bg-neutral-100 rounded cursor-pointer transition-colors"
          title="关闭指示"
        >
          ×
        </button>
      </div>
      <ul className="list-disc list-inside space-y-1 text-neutral-500 mt-1 pl-0.5">
        <li>在卡片边缘的圆点间连线建立逻辑</li>
        <li>点击连线设定特殊的非线性连接逻辑</li>
        <li>双击卡片正文区域可以就地修改内容</li>
      </ul>
    </div>
  );
}
