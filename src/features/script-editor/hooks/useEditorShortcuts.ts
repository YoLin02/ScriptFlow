import { useEffect } from 'react';
import type { Editor } from '@tiptap/core';
import type { ShortcutMap } from '../../shortcuts';
import { isShortcutEvent } from '../../shortcuts';

interface UseEditorShortcutsOptions {
  editor: Editor | null;
  isCollapsed: boolean;
  shortcuts: ShortcutMap;
  onOpenSearch: () => void;
  onToggleOutline: () => void;
  onExtractSelection: () => void;
  onImportMarkdown: () => void;
  onExportMarkdown: () => void;
}

export function useEditorShortcuts({
  editor,
  isCollapsed,
  shortcuts,
  onOpenSearch,
  onToggleOutline,
  onExtractSelection,
  onImportMarkdown,
  onExportMarkdown,
}: UseEditorShortcutsOptions) {
  useEffect(() => {
    const handleShortcutKeyDown = (event: KeyboardEvent) => {
      if (!editor || isCollapsed) return;

      const target = event.target as Element | null;
      const isInsideEditor = !!target?.closest('.tiptap-content');
      const isInsideScriptPanel = !!target?.closest('[data-script-editor-root="true"]');
      if (!isInsideEditor && !isInsideScriptPanel) return;

      if (isShortcutEvent(event, shortcuts['editor.search'])) {
        event.preventDefault();
        onOpenSearch();
        return;
      }

      if (isShortcutEvent(event, shortcuts['editor.toggleOutline'])) {
        event.preventDefault();
        onToggleOutline();
        return;
      }

      if (isShortcutEvent(event, shortcuts['editor.extractSelection'])) {
        event.preventDefault();
        onExtractSelection();
        return;
      }

      if (isShortcutEvent(event, shortcuts['editor.importMarkdown'])) {
        event.preventDefault();
        onImportMarkdown();
        return;
      }

      if (isShortcutEvent(event, shortcuts['editor.exportMarkdown'])) {
        event.preventDefault();
        onExportMarkdown();
      }
    };

    window.addEventListener('keydown', handleShortcutKeyDown);
    return () => window.removeEventListener('keydown', handleShortcutKeyDown);
  }, [
    editor,
    isCollapsed,
    onExportMarkdown,
    onExtractSelection,
    onImportMarkdown,
    onOpenSearch,
    onToggleOutline,
    shortcuts,
  ]);
}
