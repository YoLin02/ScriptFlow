import type { Edge } from '@xyflow/react';
import type { CanvasNodeHandleData, WorkspaceNode } from '../../../types';

const DEFAULT_SOURCE_HANDLE = 'r-src';
const DEFAULT_TARGET_HANDLE = 'l-tgt';
const DEFAULT_SOURCE_HANDLES = new Set(['t-src', DEFAULT_SOURCE_HANDLE, 'b-src', 'l-src']);
const DEFAULT_TARGET_HANDLES = new Set(['t-tgt', 'r-tgt', 'b-tgt', DEFAULT_TARGET_HANDLE]);

function getCustomHandleIds(customHandles: CanvasNodeHandleData[] | undefined, suffix: 'src' | 'tgt') {
  return (customHandles || []).map((handle) => `${handle.id}-${suffix}`);
}

function isValidSourceHandle(node: WorkspaceNode | undefined, handleId: string | null | undefined) {
  if (!node || !handleId) return false;
  return DEFAULT_SOURCE_HANDLES.has(handleId) || getCustomHandleIds(node.data.customHandles, 'src').includes(handleId);
}

function isValidTargetHandle(node: WorkspaceNode | undefined, handleId: string | null | undefined) {
  if (!node || !handleId) return false;
  return DEFAULT_TARGET_HANDLES.has(handleId) || getCustomHandleIds(node.data.customHandles, 'tgt').includes(handleId);
}

export function normalizeEdgeHandles(nodes: WorkspaceNode[], edges: Edge[]) {
  const nodesById = new Map(nodes.map((node) => [node.id, node]));

  return edges.map((edge) => {
    const sourceNode = nodesById.get(edge.source);
    const targetNode = nodesById.get(edge.target);
    const sourceHandle = isValidSourceHandle(sourceNode, edge.sourceHandle)
      ? edge.sourceHandle
      : DEFAULT_SOURCE_HANDLE;
    const targetHandle = isValidTargetHandle(targetNode, edge.targetHandle)
      ? edge.targetHandle
      : DEFAULT_TARGET_HANDLE;

    if (edge.sourceHandle === sourceHandle && edge.targetHandle === targetHandle) return edge;
    return {
      ...edge,
      sourceHandle,
      targetHandle,
    };
  });
}
