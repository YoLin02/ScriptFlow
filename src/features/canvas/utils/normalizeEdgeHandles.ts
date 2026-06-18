import type { Edge } from '@xyflow/react';
import type { CanvasNodeHandleData, WorkspaceNode } from '../../../types';

const DEFAULT_SOURCE_HANDLE = 'r';
const DEFAULT_TARGET_HANDLE = 'l';
const DEFAULT_NODE_HANDLES = new Set(['t', 'r', 'b', 'l']);
const LEGACY_HANDLE_MAP: Record<string, string> = {
  't-src': 't',
  't-tgt': 't',
  'r-src': 'r',
  'r-tgt': 'r',
  'b-src': 'b',
  'b-tgt': 'b',
  'l-src': 'l',
  'l-tgt': 'l',
};

function getTimelineTickIds(node: WorkspaceNode | undefined) {
  if (!node || node.data.type !== 'timeline') return new Set<string>();
  const structuredTickIds = (node.data.timelineData?.ticks || []).map((tick) => tick.id);
  if (structuredTickIds.length > 0) return new Set(structuredTickIds);

  try {
    const parsed = JSON.parse(node.data.content || '{}') as { ticks?: Array<{ id?: string }> };
    if (!Array.isArray(parsed.ticks)) return new Set<string>();
    return new Set(parsed.ticks.map((tick) => tick.id).filter((id): id is string => !!id));
  } catch {
    return new Set<string>();
  }
}

function normalizeLegacyHandleId(handleId: string | null | undefined) {
  if (!handleId) return undefined;
  if (LEGACY_HANDLE_MAP[handleId]) return LEGACY_HANDLE_MAP[handleId];
  if (handleId.endsWith('-src') || handleId.endsWith('-tgt')) {
    return handleId.replace(/-(src|tgt)$/, '');
  }
  return handleId;
}

function isValidHandle(node: WorkspaceNode | undefined, handleId: string | null | undefined) {
  if (!node || !handleId) return false;
  if (node.data.type === 'timeline') return getTimelineTickIds(node).has(handleId);
  return DEFAULT_NODE_HANDLES.has(handleId)
    || (node.data.customHandles || []).some((handle: CanvasNodeHandleData) => handle.id === handleId);
}

function getFallbackHandle(node: WorkspaceNode | undefined, kind: 'source' | 'target') {
  if (node?.data.type === 'timeline') {
    return Array.from(getTimelineTickIds(node))[0];
  }
  return kind === 'source' ? DEFAULT_SOURCE_HANDLE : DEFAULT_TARGET_HANDLE;
}

export function normalizeEdgeHandles(nodes: WorkspaceNode[], edges: Edge[]) {
  const nodesById = new Map(nodes.map((node) => [node.id, node]));

  return edges.map((edge) => {
    const sourceNode = nodesById.get(edge.source);
    const targetNode = nodesById.get(edge.target);
    const normalizedSourceHandle = normalizeLegacyHandleId(edge.sourceHandle);
    const normalizedTargetHandle = normalizeLegacyHandleId(edge.targetHandle);
    const sourceHandle = isValidHandle(sourceNode, normalizedSourceHandle)
      ? normalizedSourceHandle
      : getFallbackHandle(sourceNode, 'source');
    const targetHandle = isValidHandle(targetNode, normalizedTargetHandle)
      ? normalizedTargetHandle
      : getFallbackHandle(targetNode, 'target');

    if (edge.sourceHandle === sourceHandle && edge.targetHandle === targetHandle) return edge;
    return {
      ...edge,
      sourceHandle: sourceHandle || edge.sourceHandle,
      targetHandle: targetHandle || edge.targetHandle,
    };
  });
}
