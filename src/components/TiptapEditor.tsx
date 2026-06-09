/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, memo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { 
  Bold, Italic, Heading1, Heading2, List, ListOrdered, Quote, 
  RotateCcw, RotateCw, Scissors, FileText, ChevronRight,
  ChevronDown, ChevronUp
} from 'lucide-react';

interface TiptapEditorProps {
  content: string;
  onChange: (html: string) => void;
  onExtractNode: (text: string, title?: string) => void;
}

const TiptapEditor = memo(function TiptapEditor({ content, onChange, onExtractNode }: TiptapEditorProps) {
  const [paragraphs, setParagraphs] = useState<Array<{ id: number; text: string }>>([]);
  const [isExplorerCollapsed, setIsExplorerCollapsed] = useState(true);
  const [isSelectionEmpty, setIsSelectionEmpty] = useState(true);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
    ],
    content: content,
    onSelectionUpdate: ({ editor }) => {
      setIsSelectionEmpty(editor.state.selection.empty);
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
      
      // Update paragraph list dynamically
      const list: Array<{ id: number; text: string }> = [];
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'paragraph' && node.textContent.trim()) {
          list.push({
            id: pos,
            text: node.textContent,
          });
        }
      });
      setParagraphs(list);
      setIsSelectionEmpty(editor.state.selection.empty);
    },
  });

  // Keep editor content in sync when loaded from saved state
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Initial load paragraphs
  useEffect(() => {
    if (editor && paragraphs.length === 0) {
      const list: Array<{ id: number; text: string }> = [];
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'paragraph' && node.textContent.trim()) {
          list.push({
            id: pos,
            text: node.textContent,
          });
        }
      });
      setParagraphs(list);
    }
  }, [editor]);

  if (!editor) {
    return null;
  }

  const handleExtractSelection = () => {
    const { from, to } = editor.state.selection;
    if (from === to) {
      // Nothing selected, let's alert elegantly or ignore
      return;
    }
    const text = editor.state.doc.textBetween(from, to, '\n');
    if (text.trim()) {
      const cleanSnippet = text.trim().slice(0, 15).replace(/\s+/g, ' ');
      const displayTitle = `选段: ${cleanSnippet}${text.trim().length > 15 ? '...' : ''}`;
      onExtractNode(text.trim(), displayTitle);
      // Clear selection after extractions to dismiss the bubble menu automatically
      editor.commands.setTextSelection({ from: to, to: to });
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-neutral-200">
      {/* Top Section / Header */}
      <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-neutral-400 font-medium" />
          <h2 className="text-sm font-semibold tracking-tight text-neutral-800">长文本主文档 (Source Draft)</h2>
        </div>
      </div>

      {/* Editor Main Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-neutral-50/50 border-b border-neutral-100">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded-md hover:bg-neutral-200/60 transition-colors cursor-pointer ${editor.isActive('bold') ? 'bg-neutral-200 text-neutral-950 font-semibold' : 'text-neutral-500'}`}
          title="加粗"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded-md hover:bg-neutral-200/60 transition-colors cursor-pointer ${editor.isActive('italic') ? 'bg-neutral-200 text-neutral-950 font-semibold' : 'text-neutral-500'}`}
          title="斜体"
        >
          <Italic className="w-4 h-4" />
        </button>
        <div className="h-4 w-px bg-neutral-200 mx-1" />
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-1.5 rounded-md hover:bg-neutral-200/60 transition-colors cursor-pointer ${editor.isActive('heading', { level: 1 }) ? 'bg-neutral-200 text-neutral-950 font-semibold' : 'text-neutral-500'}`}
          title="大标题"
        >
          <Heading1 className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-1.5 rounded-md hover:bg-neutral-200/60 transition-colors cursor-pointer ${editor.isActive('heading', { level: 2 }) ? 'bg-neutral-200 text-neutral-950 font-semibold' : 'text-neutral-500'}`}
          title="小标题"
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <div className="h-4 w-px bg-neutral-200 mx-1" />
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded-md hover:bg-neutral-200/60 transition-colors cursor-pointer ${editor.isActive('bulletList') ? 'bg-neutral-200 text-neutral-950 font-semibold' : 'text-neutral-500'}`}
          title="无序列表"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded-md hover:bg-neutral-200/60 transition-colors cursor-pointer ${editor.isActive('orderedList') ? 'bg-neutral-200 text-neutral-950 font-semibold' : 'text-neutral-500'}`}
          title="有序列表"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-1.5 rounded-md hover:bg-neutral-200/60 transition-colors cursor-pointer ${editor.isActive('blockquote') ? 'bg-neutral-200 text-neutral-950 font-semibold' : 'text-neutral-500'}`}
          title="引用段落"
        >
          <Quote className="w-4 h-4" />
        </button>
        <div className="h-4 w-px bg-neutral-200 mx-1" />
        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-1.5 text-neutral-500 rounded-md hover:bg-neutral-200/60 disabled:opacity-45 transition-colors cursor-pointer"
          title="撤销"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-1.5 text-neutral-500 rounded-md hover:bg-neutral-200/60 disabled:opacity-45 transition-colors cursor-pointer"
          title="重做"
        >
          <RotateCw className="w-4 h-4" />
        </button>

         {/* Floating selection clipper */}
        <div className="ml-auto">
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleExtractSelection}
            disabled={isSelectionEmpty}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-neutral-800 disabled:text-neutral-400 bg-white hover:bg-neutral-100 disabled:hover:bg-white border border-neutral-200 rounded-md shadow-sm disabled:shadow-none transition-all cursor-pointer disabled:cursor-not-allowed"
            title="选取文本切成新的文本节点"
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>选取切片</span>
          </button>
        </div>
      </div>

      {/* Editor Scroll Container */}
      <div className="flex-1 overflow-y-auto bg-white p-6 md:p-8">
        <div className="w-full min-h-full">
          <EditorContent editor={editor} className="tiptap-content font-sans text-neutral-800 leading-relaxed outline-none" />
        </div>
      </div>

      {/* Paragraph Explorer list footer */}
      <div className={`border-t border-neutral-100 bg-white flex flex-col transition-all duration-300 ease-in-out shrink-0 overflow-hidden ${
        isExplorerCollapsed ? 'h-[44px]' : 'h-[240px]'
      }`}>
        <div 
          onClick={() => setIsExplorerCollapsed(!isExplorerCollapsed)}
          className="p-3 px-4 bg-neutral-50/50 hover:bg-neutral-50 border-b border-neutral-100 flex items-center justify-between cursor-pointer select-none transition-colors shrink-0"
        >
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">段落切片管理器 ({paragraphs.length})</h3>
            {!isExplorerCollapsed && <span className="text-[10px] text-neutral-400">点击 ➔ 将对应段落发到画布</span>}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setIsExplorerCollapsed(!isExplorerCollapsed); }}
            className="p-0.5 hover:bg-neutral-200 text-neutral-400 hover:text-neutral-700 rounded transition-colors"
            title={isExplorerCollapsed ? "展开管理器" : "收起管理器"}
          >
            {isExplorerCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
        
        {!isExplorerCollapsed && (
          <div className="flex-1 overflow-y-auto p-4 space-y-1.5 pr-1 text-xs">
            {paragraphs.length === 0 ? (
              <p className="text-neutral-400 py-4 text-center italic">在主编辑器输入带有段落的内容...</p>
            ) : (
              paragraphs.map((p, index) => (
                <div 
                  key={p.id + '-' + index} 
                  className="group flex items-start justify-between gap-3 p-2 hover:bg-neutral-50 rounded border border-neutral-100 transition-all text-neutral-600 hover:text-neutral-900"
                >
                  <span className="font-mono text-[10px] text-neutral-400 pt-0.5 select-none w-5">
                    {(index + 1).toString().padStart(2, '0')}
                  </span>
                  <p className="flex-1 line-clamp-1 text-neutral-700 leading-normal font-sans">
                    {p.text}
                  </p>
                  <button
                    onClick={(e) => { e.stopPropagation(); onExtractNode(p.text, `段落段落 ${index + 1}`); }}
                    className="p-1 text-neutral-400 hover:text-neutral-800 hover:bg-neutral-200 rounded-sm cursor-pointer opacity-80 group-hover:opacity-100 transition-all"
                    title="生成画布节点"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
});

export default TiptapEditor;
