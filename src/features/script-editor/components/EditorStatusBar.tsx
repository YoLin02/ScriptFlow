interface EditorStatusBarProps {
  visible: boolean;
  totalWordCount: number;
  selectionCount: number;
}

export default function EditorStatusBar({
  visible,
  totalWordCount,
  selectionCount,
}: EditorStatusBarProps) {
  if (!visible) return null;

  return (
    <div className="shrink-0 border-t border-neutral-100 bg-white px-4 py-2 text-left text-[11px] text-neutral-500">
      全文 {totalWordCount} 字 · 选区 {selectionCount} 字
    </div>
  );
}
