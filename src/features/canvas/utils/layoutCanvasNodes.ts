import type { WorkspaceNode } from '../../../types';

export function layoutCanvasNodes(nodes: WorkspaceNode[]): WorkspaceNode[] {
  const textNodes = nodes.filter((node) => node.type === 'text');
  const imageNodes = nodes.filter((node) => node.type === 'image');
  const ideaNodes = nodes.filter((node) => node.type === 'idea');
  const tableNodes = nodes.filter((node) => node.type === 'table');
  const timelineNodes = nodes.filter((node) => node.type === 'timeline');

  return nodes.map((node) => {
    let position = { x: node.position.x, y: node.position.y };

    if (node.type === 'text') {
      const idx = textNodes.findIndex((candidate) => candidate.id === node.id);
      position = { x: 80 + (idx % 3) * 360, y: 80 + Math.floor(idx / 3) * 260 };
    } else if (node.type === 'image') {
      const idx = imageNodes.findIndex((candidate) => candidate.id === node.id);
      position = { x: 80 + (idx % 3) * 320, y: 480 + Math.floor(idx / 3) * 320 };
    } else if (node.type === 'idea') {
      const idx = ideaNodes.findIndex((candidate) => candidate.id === node.id);
      position = { x: 80 + (idx % 4) * 280, y: 880 + Math.floor(idx / 4) * 220 };
    } else if (node.type === 'table') {
      const idx = tableNodes.findIndex((candidate) => candidate.id === node.id);
      position = { x: 80 + (idx % 2) * 440, y: 1120 + Math.floor(idx / 2) * 280 };
    } else if (node.type === 'timeline') {
      const sortedTimeline = [...timelineNodes].sort((a, b) => a.position.x - b.position.x);
      const idx = sortedTimeline.findIndex((candidate) => candidate.id === node.id);
      position = { x: 80 + idx * 540, y: 500 };
    }

    return { ...node, position };
  });
}
