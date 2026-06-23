import type { Edge } from '@xyflow/react';
import type { TimelineTrackDataValue, WorkspaceNode } from '../../../types';

export function getActiveTickDetails(nodes: WorkspaceNode[], timelineFocusDisabledIds: Set<string>) {
  for (const node of nodes) {
    if (node.type !== 'timeline') continue;
    if (timelineFocusDisabledIds.has(node.id)) continue;

    const timelineData = (node.data as { timelineData?: TimelineTrackDataValue }).timelineData;
    if (timelineData?.activeTickId) {
      return { nodeId: node.id, tickId: timelineData.activeTickId };
    }

    if (node.data?.content) {
      try {
        const parsed = JSON.parse(node.data.content);
        if (parsed && parsed.activeTickId) {
          return { nodeId: node.id, tickId: parsed.activeTickId as string };
        }
      } catch {}
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
      const startsFromActiveTick =
        edge.source === activeTickDetails.nodeId && edge.sourceHandle === activeTickDetails.tickId;
      const endsAtActiveTick =
        edge.target === activeTickDetails.nodeId && edge.targetHandle === activeTickDetails.tickId;

      if (startsFromActiveTick) {
        visited.add(edge.target);
        queue.push(edge.target);
      }
      if (endsAtActiveTick) {
        visited.add(edge.source);
        queue.push(edge.source);
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
