import { useCallback, useState } from 'react';
import type { Editor } from '@tiptap/core';
import type { OutlineEntry, ParagraphEntry } from '../types';

function areParagraphsEqual(current: ParagraphEntry[], next: ParagraphEntry[]) {
  if (current.length !== next.length) return false;
  return current.every((item, index) => item.id === next[index].id && item.text === next[index].text);
}

function areOutlineEntriesEqual(current: OutlineEntry[], next: OutlineEntry[]) {
  if (current.length !== next.length) return false;
  return current.every((item, index) =>
    item.id === next[index].id
    && item.level === next[index].level
    && item.text === next[index].text,
  );
}

export function useDocumentMeta(editor: Editor | null) {
  const [paragraphs, setParagraphs] = useState<ParagraphEntry[]>([]);
  const [outline, setOutline] = useState<OutlineEntry[]>([]);

  const rebuildDocumentMeta = useCallback((currentEditor: Editor) => {
    const nextParagraphs: ParagraphEntry[] = [];
    const nextOutline: OutlineEntry[] = [];

    currentEditor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'paragraph' && node.textContent.trim()) {
        nextParagraphs.push({ id: pos, text: node.textContent });
      }

      if (node.type.name === 'heading' && [1, 2, 3].includes(node.attrs.level) && node.textContent.trim()) {
        nextOutline.push({
          id: pos,
          level: node.attrs.level as 1 | 2 | 3,
          text: node.textContent,
        });
      }

      return true;
    });

    setParagraphs((current) => areParagraphsEqual(current, nextParagraphs) ? current : nextParagraphs);
    setOutline((current) => areOutlineEntriesEqual(current, nextOutline) ? current : nextOutline);
  }, []);

  const jumpToOutline = useCallback((entry: OutlineEntry) => {
    if (!editor) return;
    editor.chain().focus().setTextSelection({ from: entry.id + 1, to: entry.id + 1 }).scrollIntoView().run();
  }, [editor]);

  return {
    paragraphs,
    outline,
    rebuildDocumentMeta,
    jumpToOutline,
  };
}
