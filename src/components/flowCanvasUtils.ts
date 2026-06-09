import { Edge } from '@xyflow/react';
import { WorkspaceNode } from '../types';

export const DEFAULT_RELATION_TAGS = ['承接', '转折/对比', '因果/推导', '分支/并行', '补充证据', '批注备注'];

export function getEdgePresentation(typeLabel: string) {
  let style = { stroke: '#737373', strokeWidth: 1.5 };
  let animated = false;

  if (typeLabel.includes('转折') || typeLabel.includes('对比')) {
    style = { stroke: '#dc2626', strokeWidth: 1.5 };
  } else if (typeLabel.includes('因果') || typeLabel.includes('推导')) {
    style = { stroke: '#171717', strokeWidth: 2 };
    animated = true;
  } else if (typeLabel.includes('分支') || typeLabel.includes('并行')) {
    style = { stroke: '#2563eb', strokeWidth: 1.5 };
    animated = true;
  } else if (typeLabel.includes('补充') || typeLabel.includes('证据')) {
    style = { stroke: '#16a34a', strokeWidth: 1.5 };
  } else if (typeLabel.includes('批注') || typeLabel.includes('备注') || typeLabel.includes('注')) {
    style = { stroke: '#a3a3a3', strokeWidth: 1.2 };
  } else if (typeLabel) {
    style = { stroke: '#4f46e5', strokeWidth: 1.5 };
  }

  return { style, animated };
}

export function getActiveTickDetails(nodes: WorkspaceNode[]) {
  for (const node of nodes) {
    if (node.type === 'timeline' && node.data?.content) {
      try {
        const parsed = JSON.parse(node.data.content);
        if (parsed && parsed.activeTickId) {
          return { nodeId: node.id, tickId: parsed.activeTickId as string };
        }
      } catch (e) {}
    }
  }
  return null;
}

export function getConnectedNodeIds(
  nodes: WorkspaceNode[],
  edges: Edge[],
  activeTimelineNode: WorkspaceNode | undefined,
  activeTickDetails: { nodeId: string; tickId: string } | null,
) {
  const visited = new Set<string>();

  if (activeTickDetails) {
    visited.add(activeTickDetails.nodeId);
    const queue: string[] = [];

    edges.forEach((edge) => {
      if (edge.source === activeTickDetails.nodeId && edge.sourceHandle === activeTickDetails.tickId) {
        visited.add(edge.target);
        queue.push(edge.target);
      }
    });

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      edges.forEach((edge) => {
        if (edge.source === currentId && !visited.has(edge.target)) {
          visited.add(edge.target);
          queue.push(edge.target);
        } else if (edge.target === currentId && !visited.has(edge.source)) {
          visited.add(edge.source);
          queue.push(edge.source);
        }
      });
    }
  } else if (activeTimelineNode) {
    visited.add(activeTimelineNode.id);
    const queue: string[] = [activeTimelineNode.id];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      edges.forEach((edge) => {
        if (edge.source === currentId && !visited.has(edge.target)) {
          visited.add(edge.target);
          queue.push(edge.target);
        } else if (edge.target === currentId && !visited.has(edge.source)) {
          visited.add(edge.source);
          queue.push(edge.source);
        }
      });
    }
  }

  return visited;
}

export function assembleDocumentFromGraph(nodes: WorkspaceNode[], edges: Edge[]) {
  const textNodes = nodes.filter((node) => node.type === 'text' || node.type === 'idea');
  const adjList: Record<string, string[]> = {};
  const inDegree: Record<string, number> = {};

  textNodes.forEach((node) => {
    adjList[node.id] = [];
    inDegree[node.id] = 0;
  });

  edges.forEach((edge) => {
    if (adjList[edge.source] && adjList[edge.target]) {
      adjList[edge.source].push(edge.target);
      inDegree[edge.target] = (inDegree[edge.target] || 0) + 1;
    }
  });

  const visited = new Set<string>();
  const order: string[] = [];

  const dfs = (nodeId: string) => {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    order.push(nodeId);
    (adjList[nodeId] || []).forEach((neighbor) => dfs(neighbor));
  };

  Object.keys(inDegree).filter((id) => inDegree[id] === 0).forEach((rootId) => dfs(rootId));
  Object.keys(adjList).forEach((nodeId) => {
    if (!visited.has(nodeId)) dfs(nodeId);
  });

  return order
    .map((nodeId) => {
      const node = nodes.find((candidate) => candidate.id === nodeId);
      if (!node) return '';
      const titleText = node.data.title ? `## ${node.data.title}\n` : '';
      return `${titleText}${node.data.content || ''}\n\n`;
    })
    .join('');
}

export function assembledTextToHtml(assembledDocText: string) {
  return assembledDocText
    .split('\n\n')
    .filter((paragraph) => paragraph.trim())
    .map((paragraph) => {
      if (paragraph.startsWith('## ')) {
        return `<h2>${paragraph.replace('## ', '')}</h2>`;
      }
      return `<p>${paragraph}</p>`;
    })
    .join('');
}
