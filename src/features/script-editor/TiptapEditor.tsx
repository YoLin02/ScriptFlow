import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { EditorContent } from '@tiptap/react';
import { useDocumentMeta } from './hooks/useDocumentMeta';
import { useEditorSearch } from './hooks/useEditorSearch';
import { useEditorSelectionStats } from './hooks/useEditorSelectionStats';
import { useEditorShortcuts } from './hooks/useEditorShortcuts';
import { useMarkdownTransfer } from './hooks/useMarkdownTransfer';
import { useTiptapEditor } from './hooks/useTiptapEditor';
import EditorOutlinePanel from './components/EditorOutlinePanel';
import EditorSearchPanel from './components/EditorSearchPanel';
import EditorStatusBar from './components/EditorStatusBar';
import EditorToolbar from './components/EditorToolbar';
import EditorToolsDrawer from './components/EditorToolsDrawer';
import ParagraphSlicePanel from './components/ParagraphSlicePanel';
import type { TiptapEditorProps } from './types';
import { countReadableUnits, textFromHtml } from './utils/editorText';

const TiptapEditor = memo(function TiptapEditor({
  content,
  onChange,
  onExtractNode,
  isCollapsed = false,
  onOutlineOpenChange,
  shortcuts,
}: TiptapEditorProps) {
  const [isExplorerCollapsed, setIsExplorerCollapsed] = useState(true);
  const [isOutlineOpen, setIsOutlineOpen] = useState(false);
  const [isToolsDrawerOpen, setIsToolsDrawerOpen] = useState(false);

  const selectionStats = useEditorSelectionStats();
  const editor = useTiptapEditor({
    content,
    onChange,
    onSelectionChange: selectionStats.syncSelectionStats,
    onDocumentChange: (currentEditor) => {
      documentMeta.rebuildDocumentMeta(currentEditor);
      selectionStats.syncSelectionStats(currentEditor);
    },
  });
  const documentMeta = useDocumentMeta(editor);
  const search = useEditorSearch(editor, content);
  const markdownTransfer = useMarkdownTransfer({
    editor,
    onChange,
    rebuildDocumentMeta: documentMeta.rebuildDocumentMeta,
  });

  const handleExtractSelection = useCallback(() => {
    if (!editor) return;

    const { from, to } = editor.state.selection;
    if (from === to) return;

    const text = editor.state.doc.textBetween(from, to, '\n');
    if (!text.trim()) return;

    const cleanSnippet = text.trim().slice(0, 15).replace(/\s+/g, ' ');
    const displayTitle = `选段: ${cleanSnippet}${text.trim().length > 15 ? '...' : ''}`;
    onExtractNode(text.trim(), displayTitle);
    editor.commands.setTextSelection({ from: to, to });
  }, [editor, onExtractNode]);

  useEffect(() => {
    if (isCollapsed) {
      setIsOutlineOpen(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    onOutlineOpenChange?.(isOutlineOpen);
  }, [isOutlineOpen, onOutlineOpenChange]);

  useEditorShortcuts({
    editor,
    isCollapsed,
    shortcuts,
    onOpenSearch: () => search.setIsOpen(true),
    onToggleOutline: () => setIsOutlineOpen((value) => !value),
    onExtractSelection: handleExtractSelection,
    onImportMarkdown: markdownTransfer.triggerImport,
    onExportMarkdown: markdownTransfer.exportMarkdown,
  });

  const totalWordCount = useMemo(() => countReadableUnits(textFromHtml(content)), [content]);

  if (!editor) {
    return null;
  }

  return (
    <div
      data-script-editor-root="true"
      className="relative flex h-full flex-col overflow-hidden border-r border-neutral-200 bg-white"
    >
      <div className="flex min-h-0 flex-1">
        <EditorOutlinePanel
          open={isOutlineOpen}
          outline={documentMeta.outline}
          onClose={() => setIsOutlineOpen(false)}
          onJumpToOutline={documentMeta.jumpToOutline}
        />

        <div className="min-w-0 flex flex-1 flex-col">
          <EditorToolbar
            editor={editor}
            isSelectionEmpty={selectionStats.isSelectionEmpty}
            isToolsDrawerOpen={isToolsDrawerOpen}
            onExtractSelection={handleExtractSelection}
            onToggleToolsDrawer={() => setIsToolsDrawerOpen((value) => !value)}
          />

          <EditorToolsDrawer
            open={isToolsDrawerOpen}
            isOutlineOpen={isOutlineOpen}
            markdownTransfer={markdownTransfer}
            search={search}
            onToggleOutline={() => setIsOutlineOpen((value) => !value)}
          />

          <EditorSearchPanel search={search} />

          <div className="flex-1 overflow-y-auto bg-white p-6 md:p-8">
            <div className="min-h-full w-full">
              <EditorContent
                editor={editor}
                className="tiptap-content font-sans leading-relaxed text-neutral-800 outline-none"
              />
            </div>
          </div>

          <EditorStatusBar
            visible={isExplorerCollapsed}
            totalWordCount={totalWordCount}
            selectionCount={selectionStats.selectionCount}
          />

          <ParagraphSlicePanel
            collapsed={isExplorerCollapsed}
            paragraphs={documentMeta.paragraphs}
            onToggleCollapsed={() => setIsExplorerCollapsed((value) => !value)}
            onExtractParagraph={(paragraph, index) => onExtractNode(paragraph.text, `段落 ${index + 1}`)}
          />
        </div>
      </div>
    </div>
  );
});

export default TiptapEditor;
