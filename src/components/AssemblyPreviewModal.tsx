import { Check, Copy, Split } from 'lucide-react';

interface AssemblyPreviewModalProps {
  open: boolean;
  assembledDocText: string;
  isCopied: boolean;
  onClose: () => void;
  onCopy: () => void;
  onApply: () => void;
}

export default function AssemblyPreviewModal({
  open,
  assembledDocText,
  isCopied,
  onClose,
  onCopy,
  onApply,
}: AssemblyPreviewModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-[99] animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl border border-neutral-100 max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-scale-up">
        <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-neutral-800 text-lg">文档非线性重合预览</h3>
            <p className="text-xs text-neutral-400 mt-0.5">按照连线走向，将散碎的小段组装融合后所得的稿件</p>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 text-sm cursor-pointer p-1">
            ×
          </button>
        </div>

        <div className="p-6 overflow-y-auto bg-neutral-50/50 flex-1">
          <div className="bg-white border border-neutral-150 p-6 md:p-8 rounded-lg shadow-sm text-sm text-neutral-700 leading-relaxed font-sans max-w-2xl mx-auto space-y-4">
            {assembledDocText ? (
              assembledDocText.split('\n\n').map((para, i) => {
                if (para.startsWith('## ')) {
                  return <h3 key={i} className="font-semibold text-base text-neutral-900 mt-4 mb-2">{para.replace('## ', '')}</h3>;
                }
                return <p key={i} className="whitespace-pre-wrap">{para}</p>;
              })
            ) : (
              <p className="text-neutral-400 italic text-center">暂未搜集到文本，请通过画布增加卡片并通过线条关联</p>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-neutral-100 flex items-center justify-between bg-white">
          <button
            onClick={onCopy}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-md transition-colors cursor-pointer"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{isCopied ? '复制成功！' : '全选复制文本'}</span>
          </button>

          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-neutral-500 hover:text-neutral-700 rounded-md cursor-pointer">
              返回画布
            </button>
            <button
              onClick={onApply}
              className="flex items-center gap-1 px-4 py-2 text-xs font-semibold text-white bg-neutral-950 hover:bg-neutral-800 rounded-md shadow-xs transition-colors cursor-pointer"
            >
              <Split className="w-3 h-3" />
              <span>同步更新至左侧主文档</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
