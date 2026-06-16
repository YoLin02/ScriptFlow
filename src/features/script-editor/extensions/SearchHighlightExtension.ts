import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import type { SearchHighlightMeta } from '../types';

export const searchHighlightPluginKey = new PluginKey<DecorationSet>('searchHighlight');

export const SearchHighlightExtension = Extension.create({
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
