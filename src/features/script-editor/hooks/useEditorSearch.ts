import { useCallback, useEffect, useState } from 'react';
import type { Editor } from '@tiptap/core';
import { SEARCH_PANEL_ANIMATION_MS } from '../constants';
import { searchHighlightPluginKey } from '../extensions/SearchHighlightExtension';
import type { SearchHighlightMeta, SearchMatch } from '../types';

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

export function useEditorSearch(editor: Editor | null, content: string) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceValue, setReplaceValue] = useState('');
  const [searchResultText, setSearchResultText] = useState('');
  const [searchMatches, setSearchMatches] = useState<SearchMatch[]>([]);
  const [activeSearchIndex, setActiveSearchIndex] = useState(-1);

  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setIsMounted(false);
    }, SEARCH_PANEL_ANIMATION_MS);

    return () => window.clearTimeout(timeoutId);
  }, [isOpen]);

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

  const activateSearchMatch = useCallback((matches: SearchMatch[], index: number) => {
    if (!editor) return;

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
  }, [editor]);

  const findNext = useCallback(() => {
    if (!editor) return;
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
  }, [activateSearchMatch, activeSearchIndex, editor, searchMatches, searchQuery]);

  const findPrevious = useCallback(() => {
    if (!editor) return;
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
  }, [activateSearchMatch, activeSearchIndex, editor, searchMatches, searchQuery]);

  const replaceCurrent = useCallback(() => {
    if (!editor || !searchQuery.trim()) return;

    const currentMatch = searchMatches[activeSearchIndex];
    if (!currentMatch) {
      findNext();
      return;
    }

    editor.chain().focus().insertContentAt(currentMatch, replaceValue).run();
    setSearchResultText('已替换当前匹配');
  }, [activeSearchIndex, editor, findNext, replaceValue, searchMatches, searchQuery]);

  const replaceAll = useCallback(() => {
    if (!editor || !searchQuery.trim()) return;

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
  }, [editor, replaceValue, searchQuery]);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    isMounted,
    searchQuery,
    replaceValue,
    searchResultText,
    searchMatches,
    activeSearchIndex,
    setSearchQuery,
    setReplaceValue,
    setIsOpen,
    close,
    findNext,
    findPrevious,
    replaceCurrent,
    replaceAll,
  };
}
