import type { RefObject } from 'react';
import type { Editor } from '@tiptap/core';
import type { ShortcutMap } from '../../shortcuts';

export interface TiptapEditorProps {
  content: string;
  onChange: (html: string) => void;
  onExtractNode: (text: string, title?: string) => void;
  isCollapsed?: boolean;
  onOutlineOpenChange?: (open: boolean) => void;
  shortcuts: ShortcutMap;
}

export interface ParagraphEntry {
  id: number;
  text: string;
}

export interface OutlineEntry {
  id: number;
  level: 1 | 2 | 3;
  text: string;
}

export interface SearchMatch {
  from: number;
  to: number;
}

export interface SearchHighlightMeta {
  matches: SearchMatch[];
  activeIndex: number;
}

export interface EditorSearchState {
  isOpen: boolean;
  isMounted: boolean;
  searchQuery: string;
  replaceValue: string;
  searchResultText: string;
  searchMatches: SearchMatch[];
  activeSearchIndex: number;
  setSearchQuery: (value: string) => void;
  setReplaceValue: (value: string) => void;
  setIsOpen: (value: boolean | ((value: boolean) => boolean)) => void;
  close: () => void;
  findNext: () => void;
  findPrevious: () => void;
  replaceCurrent: () => void;
  replaceAll: () => void;
}

export interface MarkdownTransferState {
  markdownInputRef: RefObject<HTMLInputElement | null>;
  triggerImport: () => void;
  handleMarkdownImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  exportMarkdown: () => void;
}

export interface EditorDocumentMetaState {
  paragraphs: ParagraphEntry[];
  outline: OutlineEntry[];
  rebuildDocumentMeta: (editor: Editor) => void;
  jumpToOutline: (entry: OutlineEntry) => void;
}
