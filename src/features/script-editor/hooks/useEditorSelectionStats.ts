import { useCallback, useState } from 'react';
import type { Editor } from '@tiptap/core';
import { countReadableUnits } from '../utils/editorText';

export function useEditorSelectionStats() {
  const [isSelectionEmpty, setIsSelectionEmpty] = useState(true);
  const [selectionCount, setSelectionCount] = useState(0);

  const syncSelectionStats = useCallback((editor: Editor) => {
    const { from, to, empty } = editor.state.selection;
    const text = empty ? '' : editor.state.doc.textBetween(from, to, '\n');
    setIsSelectionEmpty(empty);
    setSelectionCount(countReadableUnits(text));
  }, []);

  return {
    isSelectionEmpty,
    selectionCount,
    syncSelectionStats,
  };
}
