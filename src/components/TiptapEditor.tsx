/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState, memo } from 'react';
import { Extension, type Editor } from '@tiptap/core';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { marked } from 'marked';
import TurndownService from 'turndown';
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  RotateCcw,
  RotateCw,
  Scissors,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  PanelLeftOpen,
  Search,
  Upload,
  Download,
  MoreHorizontal,
  X,
} from 'lucide-react';
import { ShortcutMap, isShortcutEvent } from '../shortcuts';

interface TiptapEditorProps {
  content: string;
  onChange: (html: string) => void;
  onExtractNode: (text: string, title?: string) => void;
  isCollapsed?: boolean;
  onOutlineOpenChange?: (open: boolean) => void;
  shortcuts: ShortcutMap;
}

interface ParagraphEntry {
  id: number;
  text: string;
}

interface OutlineEntry {
  id: number;
  level: 1 | 2 | 3;
  text: string;
}

interface SearchMatch {
  from: number;
  to: number;
}

interface SearchHighlightMeta {
  matches: SearchMatch[];
  activeIndex: number;
}

const SEARCH_PANEL_ANIMATION_MS = 180;
const searchHighlightPluginKey = new PluginKey<DecorationSet>('searchHighlight');

const SearchHighlightExtension = Extension.create({
  name: 'searchHighlight',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: searchHighlightPluginKey,
        state: {
          init: () => DecorationSet.empty,
          apply(transaction, oldDecorationSet) {
            const meta = transaction.getMeta(searchHighlightPluginKey) as SearchHighlightMeta | undefined;

            if (meta) {
              return DecorationSet.create(
                transaction.doc,
                meta.matches.map((match, index) =>
                  Decoration.inline(match.from, match.to, {
                    class: index === meta.activeIndex ? 'editor-search-match is-active' : 'editor-search-match',
                  }),
                ),
              );
            }

            if (transaction.docChanged) {
              return oldDecorationSet.map(transaction.mapping, transaction.doc);
            }

            return oldDecorationSet;
          },
        },
        props: {
          decorations(state) {
            return searchHighlightPluginKey.getState(state);
          },
        },
      }),
    ];
  },
});

const countReadableUnits = (text: string) => {
  const chineseChars = text.match(/[\u4e00-\u9fff]/g) ?? [];
  const words = text
    .replace(/[\u4e00-\u9fff]/g, ' ')
    .match(/[A-Za-z0-9]+(?:[-_'][A-Za-z0-9]+)*/g) ?? [];
  return chineseChars.length + words.length;
};

const textFromHtml = (html: string) => {
  const parser = new DOMParser();
  return parser.parseFromString(html, 'text/html').body.textContent ?? '';
};

const turndownService = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  strongDelimiter: '**',
  emDelimiter: '*',
});

const markdownToHtml = (markdown: string) => {
  return marked.parse(markdown, {
    async: false,
    breaks: true,
    gfm: true,
  }) as string;
};

const htmlToMarkdown = (html: string) => {
  return `${turndownService.turndown(html).trim()}\n`;
};

const downloadMarkdown = (content: string) => {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `visual-text-flow-${new Date().toISOString().slice(0, 10)}.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};

const collectSearchMatches = (editor: Editor, query: string): SearchMatch[] => {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return [];

  const matches: SearchMatch[] = [];
  const normalizedQuery = trimmedQuery.toLocaleLowerCase();

  editor.state.doc.descendants((node, pos) => {
    if (!node.isText || !node.text) return true;

    const normalizedText = node.text.toLocaleLowerCase();
    let index = normalizedText.indexOf(normalizedQuery);

    while (index >= 0) {
      matches.push({
        from: pos + index,
        to: pos + index + trimmedQuery.length,
      });
      index = normalizedText.indexOf(normalizedQuery, index + trimmedQuery.length);
    }

    return true;
  });

  return matches;
};

const TiptapEditor = memo(function TiptapEditor({
  content,
  onChange,
  onExtractNode,
  isCollapsed = false,
  onOutlineOpenChange,
  shortcuts,
}: TiptapEditorProps) {
  const [paragraphs, setParagraphs] = useState<ParagraphEntry[]>([]);
  const [outline, setOutline] = useState<OutlineEntry[]>([]);
  const [isExplorerCollapsed, setIsExplorerCollapsed] = useState(true);
  const [isOutlineOpen, setIsOutlineOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearchPanelMounted, setIsSearchPanelMounted] = useState(false);
  const [isToolsDrawerOpen, setIsToolsDrawerOpen] = useState(false);
  const [isSelectionEmpty, setIsSelectionEmpty] = useState(true);
  const [selectionCount, setSelectionCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceValue, setReplaceValue] = useState('');
  const [searchResultText, setSearchResultText] = useState('');
  const [searchMatches, setSearchMatches] = useState<SearchMatch[]>([]);
  const [activeSearchIndex, setActiveSearchIndex] = useState(-1);
  const markdownInputRef = useRef<HTMLInputElement>(null);

  const rebuildDocumentMeta = (currentEditor: NonNullable<ReturnType<typeof useEditor>>) => {
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
    });

    setParagraphs(nextParagraphs);
    setOutline(nextOutline);
  };

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
    onSelectionUpdate: ({ editor }) => {
      const { from, to, empty } = editor.state.selection;
      const text = empty ? '' : editor.state.doc.textBetween(from, to, '\n');
      setIsSelectionEmpty(empty);
      setSelectionCount(countReadableUnits(text));
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
      rebuildDocumentMeta(editor);
      setIsSelectionEmpty(editor.state.selection.empty);
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
      rebuildDocumentMeta(editor);
    }
  }, [content, editor]);

  useEffect(() => {
    if (!editor) return;
    rebuildDocumentMeta(editor);
  }, [editor]);

  useEffect(() => {
    if (isCollapsed) {
      setIsOutlineOpen(false);
    }
  }, [isCollapsed]);

  const totalWordCount = useMemo(() => countReadableUnits(textFromHtml(content)), [content]);
  useEffect(() => {
    onOutlineOpenChange?.(isOutlineOpen);
  }, [isOutlineOpen, onOutlineOpenChange]);

  useEffect(() => {
    if (isSearchOpen) {
      setIsSearchPanelMounted(true);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setIsSearchPanelMounted(false);
    }, SEARCH_PANEL_ANIMATION_MS);

    return () => window.clearTimeout(timeoutId);
  }, [isSearchOpen]);

  useEffect(() => {
    if (!editor) return;

    const matches = collectSearchMatches(editor, searchQuery);
    const nextActiveIndex = matches.length > 0 ? 0 : -1;

    setSearchMatches(matches);
    setActiveSearchIndex(nextActiveIndex);
    editor.view.dispatch(
      editor.state.tr.setMeta(searchHighlightPluginKey, {
        matches,
        activeIndex: nextActiveIndex,
      } satisfies SearchHighlightMeta),
    );

    if (!searchQuery.trim()) {
      setSearchResultText('');
    } else if (matches.length === 0) {
      setSearchResultText('未找到匹配内容');
    } else {
      setSearchResultText(`已找到 ${matches.length} 处`);
    }
  }, [content, editor, searchQuery]);

  if (!editor) {
    return null;
  }

  const activateSearchMatch = (matches: SearchMatch[], index: number) => {
    const match = matches[index];
    if (!match) return;

    setActiveSearchIndex(index);
    editor.view.dispatch(
      editor.state.tr.setMeta(searchHighlightPluginKey, {
        matches,
        activeIndex: index,
      } satisfies SearchHighlightMeta),
    );
    editor.chain().focus().setTextSelection(match).scrollIntoView().run();
    setSearchResultText(`第 ${index + 1} / ${matches.length} 处`);
  };

  const handleFindNext = () => {
    if (!searchQuery.trim()) {
      setSearchResultText('请输入要查找的内容');
      return;
    }

    const matches = searchMatches.length > 0 ? searchMatches : collectSearchMatches(editor, searchQuery);

    if (matches.length === 0) {
      setSearchResultText('未找到匹配内容');
      return;
    }

    const nextIndex = activeSearchIndex < 0 ? 0 : (activeSearchIndex + 1) % matches.length;
    activateSearchMatch(matches, nextIndex);
  };

  const handleFindPrevious = () => {
    if (!searchQuery.trim()) {
      setSearchResultText('请输入要查找的内容');
      return;
    }

    const matches = searchMatches.length > 0 ? searchMatches : collectSearchMatches(editor, searchQuery);

    if (matches.length === 0) {
      setSearchResultText('未找到匹配内容');
      return;
    }

    const previousIndex =
      activeSearchIndex < 0 ? matches.length - 1 : (activeSearchIndex - 1 + matches.length) % matches.length;
    activateSearchMatch(matches, previousIndex);
  };

  const handleReplaceCurrent = () => {
    if (!searchQuery.trim()) return;

    const currentMatch = searchMatches[activeSearchIndex];
    if (!currentMatch) {
      handleFindNext();
      return;
    }

    editor.chain().focus().insertContentAt(currentMatch, replaceValue).run();
    setSearchResultText('已替换当前匹配');
  };

  const handleReplaceAll = () => {
    if (!searchQuery.trim()) return;

    const matches = collectSearchMatches(editor, searchQuery);

    if (matches.length === 0) {
      setSearchResultText('未找到匹配内容');
      return;
    }

    let transaction = editor.state.tr;
    [...matches].reverse().forEach((match) => {
      transaction = transaction.insertText(replaceValue, match.from, match.to);
    });
    editor.view.dispatch(transaction);
    setSearchMatches([]);
    setActiveSearchIndex(-1);
    editor.view.dispatch(
      editor.state.tr.setMeta(searchHighlightPluginKey, {
        matches: [],
        activeIndex: -1,
      } satisfies SearchHighlightMeta),
    );
    setSearchResultText(`已替换 ${matches.length} 处`);
  };

  const handleMarkdownImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const html = markdownToHtml(String(reader.result ?? ''));
      editor.commands.setContent(html);
      onChange(editor.getHTML());
      rebuildDocumentMeta(editor);
    };
    reader.readAsText(file, 'utf-8');
    event.target.value = '';
  };

  const handleExtractSelection = () => {
    const { from, to } = editor.state.selection;
    if (from === to) return;

    const text = editor.state.doc.textBetween(from, to, '\n');
    if (text.trim()) {
      const cleanSnippet = text.trim().slice(0, 15).replace(/\s+/g, ' ');
      const displayTitle = `选段: ${cleanSnippet}${text.trim().length > 15 ? '...' : ''}`;
      onExtractNode(text.trim(), displayTitle);
      editor.commands.setTextSelection({ from: to, to });
    }
  };

  useEffect(() => {
    const handleShortcutKeyDown = (event: KeyboardEvent) => {
      if (!editor || isCollapsed) return;

      const target = event.target as Element | null;
      const isInsideEditor = !!target?.closest('.tiptap-content');
      const isInsideScriptPanel = !!target?.closest('[data-script-editor-root="true"]');
      if (!isInsideEditor && !isInsideScriptPanel) return;

      if (isShortcutEvent(event, shortcuts['editor.search'])) {
        event.preventDefault();
        setIsSearchOpen(true);
        return;
      }

      if (isShortcutEvent(event, shortcuts['editor.toggleOutline'])) {
        event.preventDefault();
        setIsOutlineOpen((open) => !open);
        return;
      }

      if (isShortcutEvent(event, shortcuts['editor.extractSelection'])) {
        event.preventDefault();
        handleExtractSelection();
        return;
      }

      if (isShortcutEvent(event, shortcuts['editor.importMarkdown'])) {
        event.preventDefault();
        markdownInputRef.current?.click();
        return;
      }

      if (isShortcutEvent(event, shortcuts['editor.exportMarkdown'])) {
        event.preventDefault();
        downloadMarkdown(htmlToMarkdown(editor.getHTML()));
      }
    };

    window.addEventListener('keydown', handleShortcutKeyDown);
    return () => window.removeEventListener('keydown', handleShortcutKeyDown);
  }, [editor, handleExtractSelection, isCollapsed, shortcuts]);

  const jumpToOutline = (entry: OutlineEntry) => {
    editor.chain().focus().setTextSelection({ from: entry.id + 1, to: entry.id + 1 }).scrollIntoView().run();
  };

  return (
    <div data-script-editor-root="true" className="relative flex flex-col h-full bg-white border-r border-neutral-200 overflow-hidden">
      <div className="flex min-h-0 flex-1">
        <aside
          className={`h-full shrink-0 overflow-hidden border-r border-neutral-200 bg-white/95 transition-[width,opacity] duration-300 ease-out ${
            isOutlineOpen ? 'w-[252px] opacity-100' : 'w-0 opacity-0'
          }`}
        >
          <div className="flex h-full w-[252px] flex-col">
            <div className="h-[57px] px-4 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-neutral-900">目录</p>
                <p className="text-[11px] text-neutral-400">基于 H1 / H2 / H3 自动生成</p>
              </div>
              <button
                onClick={() => setIsOutlineOpen(false)}
                className="cursor-pointer p-1.5 rounded-md text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100"
                data-tooltip="关闭目录"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {outline.length === 0 ? (
                <p className="text-xs text-neutral-400 py-6 text-center">使用 H1 / H2 / H3 后会显示目录</p>
              ) : (
                outline.map((entry, index) => (
                  <button
                    key={`${entry.id}-${index}`}
                    onClick={() => jumpToOutline(entry)}
                    className="w-full cursor-pointer text-left rounded-lg px-3 py-2 hover:bg-neutral-50 transition-colors"
                    style={{ paddingLeft: `${12 + (entry.level - 1) * 16}px` }}
                  >
                    <span className="block text-[10px] text-neutral-400">H{entry.level}</span>
                    <span className="block text-sm text-neutral-800 truncate">{entry.text}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex flex-1 flex-col">
      <div className="flex flex-wrap items-center gap-1 p-2 bg-neutral-50/50 border-b border-neutral-100">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded-md hover:bg-neutral-200/60 transition-colors cursor-pointer ${editor.isActive('bold') ? 'bg-neutral-200 text-neutral-950 font-semibold' : 'text-neutral-500'}`}
          data-tooltip="加粗"
          data-tooltip-placement="bottom"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded-md hover:bg-neutral-200/60 transition-colors cursor-pointer ${editor.isActive('italic') ? 'bg-neutral-200 text-neutral-950 font-semibold' : 'text-neutral-500'}`}
          data-tooltip="斜体"
          data-tooltip-placement="bottom"
        >
          <Italic className="w-4 h-4" />
        </button>
        <div className="h-4 w-px bg-neutral-200 mx-1" />
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-1.5 rounded-md hover:bg-neutral-200/60 transition-colors cursor-pointer ${editor.isActive('heading', { level: 1 }) ? 'bg-neutral-200 text-neutral-950 font-semibold' : 'text-neutral-500'}`}
          data-tooltip="大标题"
          data-tooltip-placement="bottom"
        >
          <Heading1 className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-1.5 rounded-md hover:bg-neutral-200/60 transition-colors cursor-pointer ${editor.isActive('heading', { level: 2 }) ? 'bg-neutral-200 text-neutral-950 font-semibold' : 'text-neutral-500'}`}
          data-tooltip="小标题"
          data-tooltip-placement="bottom"
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <div className="h-4 w-px bg-neutral-200 mx-1" />
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded-md hover:bg-neutral-200/60 transition-colors cursor-pointer ${editor.isActive('bulletList') ? 'bg-neutral-200 text-neutral-950 font-semibold' : 'text-neutral-500'}`}
          data-tooltip="无序列表"
          data-tooltip-placement="bottom"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded-md hover:bg-neutral-200/60 transition-colors cursor-pointer ${editor.isActive('orderedList') ? 'bg-neutral-200 text-neutral-950 font-semibold' : 'text-neutral-500'}`}
          data-tooltip="有序列表"
          data-tooltip-placement="bottom"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-1.5 rounded-md hover:bg-neutral-200/60 transition-colors cursor-pointer ${editor.isActive('blockquote') ? 'bg-neutral-200 text-neutral-950 font-semibold' : 'text-neutral-500'}`}
          data-tooltip="引用段落"
          data-tooltip-placement="bottom"
        >
          <Quote className="w-4 h-4" />
        </button>
        <div className="h-4 w-px bg-neutral-200 mx-1" />
        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-1.5 text-neutral-500 rounded-md hover:bg-neutral-200/60 disabled:opacity-45 transition-colors cursor-pointer"
          data-tooltip="撤销"
          data-tooltip-placement="bottom"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-1.5 text-neutral-500 rounded-md hover:bg-neutral-200/60 disabled:opacity-45 transition-colors cursor-pointer"
          data-tooltip="重做"
          data-tooltip-placement="bottom"
        >
          <RotateCw className="w-4 h-4" />
        </button>

        <div className="ml-auto flex items-center gap-1">
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleExtractSelection}
            disabled={isSelectionEmpty}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-neutral-800 disabled:text-neutral-400 bg-white hover:bg-neutral-100 disabled:hover:bg-white border border-neutral-200 rounded-md shadow-sm disabled:shadow-none transition-all cursor-pointer disabled:cursor-not-allowed"
            data-tooltip="选取文本切成新的文本节点"
            data-tooltip-placement="bottom"
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>选取切片</span>
          </button>
          <button
            onClick={() => setIsToolsDrawerOpen((open) => !open)}
            className="cursor-pointer p-1.5 text-neutral-500 rounded-md hover:bg-neutral-200/60 transition-colors"
            data-tooltip="展开更多工具"
            data-tooltip-placement="bottom"
          >
            {isToolsDrawerOpen ? <ChevronUp className="w-4 h-4" /> : <MoreHorizontal className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div
        className={`overflow-hidden border-neutral-100 bg-white shadow-sm transition-[max-height,opacity,border-width,padding] duration-300 ease-out ${
          isToolsDrawerOpen ? 'max-h-28 border-b px-3 py-2 opacity-100' : 'max-h-0 border-b-0 px-3 py-0 opacity-0'
        }`}
      >
          <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-0.5">
            <button
              onClick={() => setIsOutlineOpen((open) => !open)}
              className={`flex shrink-0 cursor-pointer items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md border transition-colors ${
                isOutlineOpen ? 'border-neutral-200 bg-neutral-200 text-neutral-950' : 'border-neutral-200 text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              <PanelLeftOpen className="w-3.5 h-3.5" />
              目录
            </button>
            <button
              onClick={() => setIsSearchOpen((open) => !open)}
              className="flex shrink-0 cursor-pointer items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md border border-neutral-200 text-neutral-700 hover:bg-neutral-50"
            >
              <Search className="w-3.5 h-3.5" />
              查找替换
            </button>
            <button
              onClick={() => markdownInputRef.current?.click()}
              className="flex shrink-0 cursor-pointer items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md border border-neutral-200 text-neutral-700 hover:bg-neutral-50"
            >
              <Download className="w-3.5 h-3.5" />
              导入MD
            </button>
            <button
              onClick={() => downloadMarkdown(htmlToMarkdown(editor.getHTML()))}
              className="flex shrink-0 cursor-pointer items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md border border-neutral-200 text-neutral-700 hover:bg-neutral-50"
            >
              <Upload className="w-3.5 h-3.5" />
              导出MD
            </button>
          </div>
          <input
            ref={markdownInputRef}
            type="file"
            accept=".md,.markdown,text/markdown,text/plain"
            className="hidden"
            onChange={handleMarkdownImport}
          />
        </div>

      {isSearchPanelMounted && (
        <div
          className={`absolute right-3 top-[88px] z-50 w-[360px] max-w-[calc(100%-24px)] origin-top-right rounded-xl border border-neutral-200 bg-white px-2.5 py-2 shadow-xl shadow-neutral-900/10 transition-all duration-200 ease-out ${
            isSearchOpen
              ? 'translate-y-0 scale-100 opacity-100'
              : 'pointer-events-none -translate-y-1 scale-[0.98] opacity-0'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Search className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  handleFindNext();
                }
              }}
              placeholder="查找"
              className="h-7 min-w-0 flex-1 rounded-md border border-neutral-200 bg-white px-2 text-xs outline-none transition-colors focus:border-neutral-500"
              autoFocus
            />
            <input
              value={replaceValue}
              onChange={(event) => setReplaceValue(event.target.value)}
              placeholder="替换"
              className="h-7 min-w-0 flex-1 rounded-md border border-neutral-200 bg-white px-2 text-xs outline-none transition-colors focus:border-neutral-500"
            />
            <button
              onClick={() => setIsSearchOpen(false)}
              className="shrink-0 rounded-md p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-800"
              data-tooltip="关闭查找替换"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="mt-1.5 flex items-center gap-1.5">
            <span className="mr-auto max-w-32 truncate text-[10px] text-neutral-400">
              {searchResultText || '未查找'}
            </span>
            <div className="flex shrink-0 overflow-hidden rounded-md border border-neutral-200 bg-white">
              <button
                onClick={handleFindPrevious}
                className="flex h-7 w-7 items-center justify-center text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
                data-tooltip="上一处"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleFindNext}
                className="flex h-7 w-7 items-center justify-center border-l border-neutral-200 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
                data-tooltip="下一处"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <button
              onClick={handleReplaceCurrent}
              className="h-7 rounded-md border border-neutral-200 bg-white px-2.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-100"
            >
              替换
            </button>
            <button
              onClick={handleReplaceAll}
              className="h-7 rounded-md border border-neutral-200 bg-white px-2.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-100"
            >
              全部替换
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto bg-white p-6 md:p-8">
        <div className="w-full min-h-full">
          <EditorContent editor={editor} className="tiptap-content font-sans text-neutral-800 leading-relaxed outline-none" />
        </div>
      </div>

      {isExplorerCollapsed && (
        <div className="shrink-0 border-t border-neutral-100 bg-white px-4 py-2 text-left text-[11px] text-neutral-500">
          全文 {totalWordCount} 字 · 选区 {selectionCount} 字
        </div>
      )}

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
            data-tooltip={isExplorerCollapsed ? '展开管理器' : '收起管理器'}
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
                  key={`${p.id}-${index}`}
                  className="group flex items-start justify-between gap-3 p-2 hover:bg-neutral-50 rounded border border-neutral-100 transition-all text-neutral-600 hover:text-neutral-900"
                >
                  <span className="font-mono text-[10px] text-neutral-400 pt-0.5 select-none w-5">
                    {(index + 1).toString().padStart(2, '0')}
                  </span>
                  <p className="flex-1 line-clamp-1 text-neutral-700 leading-normal font-sans">
                    {p.text}
                  </p>
                  <span className="text-[10px] text-neutral-400 whitespace-nowrap pt-0.5">
                    {countReadableUnits(p.text)} 字
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); onExtractNode(p.text, `段落 ${index + 1}`); }}
                    className="p-1 text-neutral-400 hover:text-neutral-800 hover:bg-neutral-200 rounded-sm cursor-pointer opacity-80 group-hover:opacity-100 transition-all"
                    data-tooltip="生成画布节点"
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
      </div>
    </div>
  );
});

export default TiptapEditor;
