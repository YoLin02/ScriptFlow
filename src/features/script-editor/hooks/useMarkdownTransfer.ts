import { useCallback, useRef } from 'react';
import type { ChangeEvent } from 'react';
import type { Editor } from '@tiptap/core';
import { downloadMarkdown, htmlToMarkdown, markdownToHtml } from '../utils/markdownTransfer';

interface UseMarkdownTransferOptions {
  editor: Editor | null;
  onChange: (html: string) => void;
  rebuildDocumentMeta: (editor: Editor) => void;
}

export function useMarkdownTransfer({
  editor,
  onChange,
  rebuildDocumentMeta,
}: UseMarkdownTransferOptions) {
  const markdownInputRef = useRef<HTMLInputElement>(null);

  const handleMarkdownImport = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !editor) return;

    const reader = new FileReader();
    reader.onload = () => {
      const html = markdownToHtml(String(reader.result ?? ''));
      editor.commands.setContent(html);
      onChange(editor.getHTML());
      rebuildDocumentMeta(editor);
    };
    reader.readAsText(file, 'utf-8');
    event.target.value = '';
  }, [editor, onChange, rebuildDocumentMeta]);

  const triggerImport = useCallback(() => {
    markdownInputRef.current?.click();
  }, []);

  const exportMarkdown = useCallback(() => {
    if (!editor) return;
    downloadMarkdown(htmlToMarkdown(editor.getHTML()));
  }, [editor]);

  return {
    markdownInputRef,
    triggerImport,
    handleMarkdownImport,
    exportMarkdown,
  };
}
