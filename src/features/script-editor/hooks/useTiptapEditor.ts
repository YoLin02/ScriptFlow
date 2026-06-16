import { useEffect } from 'react';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import type { Editor } from '@tiptap/core';
import { SearchHighlightExtension } from '../extensions/SearchHighlightExtension';

interface UseTiptapEditorOptions {
  content: string;
  onChange: (html: string) => void;
  onSelectionChange: (editor: Editor) => void;
  onDocumentChange: (editor: Editor) => void;
}

export function useTiptapEditor({
  content,
  onChange,
  onSelectionChange,
  onDocumentChange,
}: UseTiptapEditorOptions) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      SearchHighlightExtension,
    ],
    content,
    onSelectionUpdate: ({ editor: currentEditor }) => {
      onSelectionChange(currentEditor);
    },
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getHTML());
      onDocumentChange(currentEditor);
    },
  });

  useEffect(() => {
    if (!editor || content === editor.getHTML()) return;
    editor.commands.setContent(content);
    onDocumentChange(editor);
  }, [content, editor, onDocumentChange]);

  useEffect(() => {
    if (!editor) return;
    onDocumentChange(editor);
  }, [editor, onDocumentChange]);

  return editor;
}
