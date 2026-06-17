import { useEffect, useRef } from 'react';
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
  const onChangeRef = useRef(onChange);
  const onSelectionChangeRef = useRef(onSelectionChange);
  const onDocumentChangeRef = useRef(onDocumentChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onSelectionChangeRef.current = onSelectionChange;
  }, [onSelectionChange]);

  useEffect(() => {
    onDocumentChangeRef.current = onDocumentChange;
  }, [onDocumentChange]);

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
      onSelectionChangeRef.current(currentEditor);
    },
    onUpdate: ({ editor: currentEditor }) => {
      onChangeRef.current(currentEditor.getHTML());
      onDocumentChangeRef.current(currentEditor);
    },
  });

  useEffect(() => {
    if (!editor || content === editor.getHTML()) return;
    editor.commands.setContent(content, { emitUpdate: false });
    onDocumentChangeRef.current(editor);
  }, [content, editor]);

  useEffect(() => {
    if (!editor) return;
    onDocumentChangeRef.current(editor);
  }, [editor]);

  return editor;
}
