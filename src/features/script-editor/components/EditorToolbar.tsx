import type { Editor } from '@tiptap/core';
import {
  Bold,
  ChevronUp,
  Heading1,
  Heading2,
  Italic,
  List,
  ListOrdered,
  MoreHorizontal,
  Quote,
  RotateCcw,
  RotateCw,
  Scissors,
} from 'lucide-react';

interface EditorToolbarProps {
  editor: Editor;
  isSelectionEmpty: boolean;
  isToolsDrawerOpen: boolean;
  onExtractSelection: () => void;
  onToggleToolsDrawer: () => void;
}

export default function EditorToolbar({
  editor,
  isSelectionEmpty,
  isToolsDrawerOpen,
  onExtractSelection,
  onToggleToolsDrawer,
}: EditorToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-neutral-100 bg-neutral-50/50 p-2">
      <FormatButton
        active={editor.isActive('bold')}
        tooltip="加粗"
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="h-4 w-4" />
      </FormatButton>
      <FormatButton
        active={editor.isActive('italic')}
        tooltip="斜体"
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="h-4 w-4" />
      </FormatButton>

      <div className="mx-1 h-4 w-px bg-neutral-200" />

      <FormatButton
        active={editor.isActive('heading', { level: 1 })}
        tooltip="大标题"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        <Heading1 className="h-4 w-4" />
      </FormatButton>
      <FormatButton
        active={editor.isActive('heading', { level: 2 })}
        tooltip="小标题"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className="h-4 w-4" />
      </FormatButton>

      <div className="mx-1 h-4 w-px bg-neutral-200" />

      <FormatButton
        active={editor.isActive('bulletList')}
        tooltip="无序列表"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="h-4 w-4" />
      </FormatButton>
      <FormatButton
        active={editor.isActive('orderedList')}
        tooltip="有序列表"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="h-4 w-4" />
      </FormatButton>
      <FormatButton
        active={editor.isActive('blockquote')}
        tooltip="引用段落"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote className="h-4 w-4" />
      </FormatButton>

      <div className="mx-1 h-4 w-px bg-neutral-200" />

      <button
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        className="cursor-pointer rounded-md p-1.5 text-neutral-500 transition-colors hover:bg-neutral-200/60 disabled:opacity-45"
        data-tooltip="撤销"
        data-tooltip-placement="bottom"
      >
        <RotateCcw className="h-4 w-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        className="cursor-pointer rounded-md p-1.5 text-neutral-500 transition-colors hover:bg-neutral-200/60 disabled:opacity-45"
        data-tooltip="重做"
        data-tooltip-placement="bottom"
      >
        <RotateCw className="h-4 w-4" />
      </button>

      <div className="ml-auto flex items-center gap-1">
        <button
          onMouseDown={(event) => event.preventDefault()}
          onClick={onExtractSelection}
          disabled={isSelectionEmpty}
          className="flex cursor-pointer items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-800 shadow-sm transition-all hover:bg-neutral-100 disabled:cursor-not-allowed disabled:text-neutral-400 disabled:shadow-none disabled:hover:bg-white"
          data-tooltip="选取文本生成卡片"
          data-tooltip-placement="bottom"
        >
          <Scissors className="h-3.5 w-3.5" />
          <span>选取切片</span>
        </button>
        <button
          onClick={onToggleToolsDrawer}
          className="cursor-pointer rounded-md p-1.5 text-neutral-500 transition-colors hover:bg-neutral-200/60"
          data-tooltip="更多"
          data-tooltip-placement="bottom"
        >
          {isToolsDrawerOpen ? <ChevronUp className="h-4 w-4" /> : <MoreHorizontal className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

function FormatButton({
  active,
  tooltip,
  onClick,
  children,
}: {
  active: boolean;
  tooltip: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`cursor-pointer rounded-md p-1.5 transition-colors hover:bg-neutral-200/60 ${
        active ? 'bg-neutral-200 font-semibold text-neutral-950' : 'text-neutral-500'
      }`}
      data-tooltip={tooltip}
      data-tooltip-placement="bottom"
    >
      {children}
    </button>
  );
}
