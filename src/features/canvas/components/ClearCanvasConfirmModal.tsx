interface ClearCanvasConfirmModalProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ClearCanvasConfirmModal({ open, onCancel, onConfirm }: ClearCanvasConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-neutral-900/35 backdrop-blur-xs z-[9999] flex items-center justify-center animate-in fade-in duration-200 pointer-events-auto">
      <div className="bg-white border border-neutral-200 shadow-2xl rounded-xl p-5 w-80 max-w-[90%] text-neutral-800 animate-in zoom-in-95 duration-150">
        <h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-1.5 mb-2">
          <span>确认清空画布</span>
        </h3>
        <p className="text-xs text-neutral-550 leading-relaxed mb-4">
          确定要清空画布中的所有卡片和连线吗？此操作无法撤销。
        </p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 border border-neutral-200 text-neutral-650 hover:bg-neutral-50 rounded-md text-[11px] font-semibold cursor-pointer transition-colors"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className="px-3 py-1.5 bg-red-600 text-white hover:bg-red-700 rounded-md text-[11px] font-semibold cursor-pointer transition-colors shadow-xs"
          >
            确定清空
          </button>
        </div>
      </div>
    </div>
  );
}
