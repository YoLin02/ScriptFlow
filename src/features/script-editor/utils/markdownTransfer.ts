import { marked } from 'marked';
import TurndownService from 'turndown';

export const turndownService = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  strongDelimiter: '**',
  emDelimiter: '*',
});

export const markdownToHtml = (markdown: string) => {
  return marked.parse(markdown, {
    async: false,
    breaks: true,
    gfm: true,
  }) as string;
};

export const htmlToMarkdown = (html: string) => {
  return `${turndownService.turndown(html).trim()}\n`;
};

export const downloadMarkdown = (content: string) => {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `visual-text-flow-${new Date().toISOString().slice(0, 10)}.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};
