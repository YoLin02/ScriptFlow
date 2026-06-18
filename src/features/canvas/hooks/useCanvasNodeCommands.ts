import { useCallback, useEffect, useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { Edge } from '@xyflow/react';
import type { CanvasNodeData, TimelineTrackDataValue, WorkspaceNode } from '../../../types';
import type { PendingExtractedSlice } from '../types';
import { createCanvasNode, createExtractedTextNode } from '../utils/createCanvasNode';
import { layoutCanvasNodes } from '../utils/layoutCanvasNodes';

interface UseCanvasNodeCommandsOptions {
  selectedNodes: WorkspaceNode[];
  setNodes: Dispatch<SetStateAction<WorkspaceNode[]>>;
  setEdges: Dispatch<SetStateAction<Edge[]>>;
  getCenteredNodePosition: (xOffset?: number, yOffset?: number) => { x: number; y: number };
  pendingExtractedSlice: PendingExtractedSlice | null;
  onExtractedSlicePlaced: () => void;
  onAfterAddNode?: () => void;
  onAfterSelectionMutation?: () => void;
}

function isLegacyCustomHandleMatch(edgeHandleId: string | null | undefined, handleId: string) {
  return edgeHandleId === handleId
    || edgeHandleId === `${handleId}-src`
    || edgeHandleId === `${handleId}-tgt`;
}

function isEdgeUsingCustomHandle(edge: Edge, nodeId: string, handleId: string) {
  return (edge.source === nodeId && isLegacyCustomHandleMatch(edge.sourceHandle, handleId))
    || (edge.target === nodeId && isLegacyCustomHandleMatch(edge.targetHandle, handleId));
}

function isEdgeUsingInvalidTimelineTick(edge: Edge, nodeId: string, validTickIds: Set<string>) {
  if (edge.source === nodeId && edge.sourceHandle && !validTickIds.has(edge.sourceHandle)) return true;
  if (edge.target === nodeId && edge.targetHandle && !validTickIds.has(edge.targetHandle)) return true;
  return false;
}

export function useCanvasNodeCommands({
  selectedNodes,
  setNodes,
  setEdges,
  getCenteredNodePosition,
  pendingExtractedSlice,
  onExtractedSlicePlaced,
  onAfterAddNode,
  onAfterSelectionMutation,
}: UseCanvasNodeCommandsOptions) {
  const lastPlacedExtractedSliceIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!pendingExtractedSlice) return;
    if (lastPlacedExtractedSliceIdRef.current === pendingExtractedSlice.id) return;

    lastPlacedExtractedSliceIdRef.current = pendingExtractedSlice.id;
    const newNode = createExtractedTextNode(pendingExtractedSlice, getCenteredNodePosition());
    setNodes((currentNodes) => [...currentNodes, newNode]);
    onExtractedSlicePlaced();
  }, [getCenteredNodePosition, onExtractedSlicePlaced, pendingExtractedSlice, setNodes]);

  const addNode = useCallback((type: CanvasNodeData['type']) => {
    const newNode = createCanvasNode(type, getCenteredNodePosition());
    setNodes((currentNodes) => [...currentNodes, newNode]);
    onAfterAddNode?.();
  }, [getCenteredNodePosition, onAfterAddNode, setNodes]);

  const updateContent = useCallback((
    id: string,
    text: string,
    title?: string,
    imageUrl?: string,
    imageCaption?: string,
    extraData?: Partial<CanvasNodeData>,
  ) => {
    setNodes((currentNodes) =>
      currentNodes.map((node) => {
        if (node.id !== id) return node;
        return {
          ...node,
          data: {
            ...node.data,
            content: text,
            title: title !== undefined ? title : node.data.title,
            imageUrl: imageUrl !== undefined ? imageUrl : node.data.imageUrl,
            imageCaption: imageCaption !== undefined ? imageCaption : node.data.imageCaption,
            ...extraData,
          },
        } as WorkspaceNode;
      }),
    );

    const timelineData = (extraData as { timelineData?: TimelineTrackDataValue } | undefined)?.timelineData;
    if (timelineData?.ticks) {
      const validTickIds = new Set(timelineData.ticks.map((tick) => tick.id));
      setEdges((currentEdges) =>
        currentEdges.filter((edge) => !isEdgeUsingInvalidTimelineTick(edge, id, validTickIds)),
      );
      return;
    }

    try {
      if (!text.trim().startsWith('{')) return;
      const parsed = JSON.parse(text) as { ticks?: Array<{ id: string }> };
      if (!Array.isArray(parsed.ticks)) return;
      const validTickIds = new Set(parsed.ticks.map((tick) => tick.id));
      setEdges((currentEdges) =>
        currentEdges.filter((edge) => !isEdgeUsingInvalidTimelineTick(edge, id, validTickIds)),
      );
    } catch {}
  }, [setEdges, setNodes]);

  const deleteNode = useCallback((id: string) => {
    setNodes((currentNodes) => currentNodes.filter((node) => node.id !== id));
    setEdges((currentEdges) => currentEdges.filter((edge) => edge.source !== id && edge.target !== id));
  }, [setEdges, setNodes]);

  const deleteSelectedNodes = useCallback(() => {
    const selectedIds = new Set(selectedNodes.map((node) => node.id));
    if (selectedIds.size === 0) return;

    setNodes((currentNodes) => currentNodes.filter((node) => !selectedIds.has(node.id)));
    setEdges((currentEdges) =>
      currentEdges.filter((edge) => !selectedIds.has(edge.source) && !selectedIds.has(edge.target)),
    );
    onAfterSelectionMutation?.();
  }, [onAfterSelectionMutation, selectedNodes, setEdges, setNodes]);

  const updateNodesFromPanel = useCallback((nodeIds: string[], patch: Partial<CanvasNodeData>) => {
    const nodeIdSet = new Set(nodeIds);
    setNodes((currentNodes) =>
      currentNodes.map((node) => {
        if (!nodeIdSet.has(node.id)) return node;
        return {
          ...node,
          data: {
            ...node.data,
            ...patch,
          },
        } as WorkspaceNode;
      }),
    );
  }, [setNodes]);

  const resizeNodesFromPanel = useCallback((nodeIds: string[], width?: number, height?: number) => {
    const nodeIdSet = new Set(nodeIds);
    setNodes((currentNodes) =>
      currentNodes.map((node) => {
        if (!nodeIdSet.has(node.id)) return node;
        return {
          ...node,
          width: width ?? node.width,
          height: height ?? node.height,
          data: {
            ...node.data,
            width: width ?? node.data.width,
            height: height ?? node.data.height,
          },
        } as WorkspaceNode;
      }),
    );
  }, [setNodes]);

  const addCustomHandle = useCallback((nodeId: string, handle: NonNullable<CanvasNodeData['customHandles']>[number]) => {
    setNodes((currentNodes) =>
      currentNodes.map((node) => {
        if (node.id !== nodeId) return node;
        const currentHandles = node.data.customHandles || [];
        return {
          ...node,
          data: {
            ...node.data,
            customHandles: [...currentHandles, handle],
          },
        } as WorkspaceNode;
      }),
    );
  }, [setNodes]);

  const deleteCustomHandle = useCallback((nodeId: string, handleId: string) => {
    setNodes((currentNodes) =>
      currentNodes.map((node) => {
        if (node.id !== nodeId) return node;
        return {
          ...node,
          data: {
            ...node.data,
            customHandles: (node.data.customHandles || []).filter((handle) => handle.id !== handleId),
          },
        } as WorkspaceNode;
      }),
    );

    setEdges((currentEdges) =>
      currentEdges.filter((edge) =>
        !isEdgeUsingCustomHandle(edge, nodeId, handleId),
      ),
    );
  }, [setEdges, setNodes]);

  const onNodeDragStop = useCallback((_: unknown, node: WorkspaceNode) => {
    if (node.type !== 'timeline') return;

    setNodes((currentNodes) => {
      const otherTimelineYs = currentNodes
        .filter((candidate) => candidate.type === 'timeline' && candidate.id !== node.id)
        .map((candidate) => candidate.position.y);

      const snapDistance = 35;
      const closeY = otherTimelineYs.find((y) => Math.abs(y - node.position.y) < snapDistance);
      const targetY = closeY !== undefined ? closeY : Math.round(node.position.y / 20) * 20;

      return currentNodes.map((candidate) => {
        if (candidate.id !== node.id) return candidate;
        return {
          ...candidate,
          position: {
            x: Math.round(node.position.x / 20) * 20,
            y: targetY,
          },
        };
      });
    });
  }, [setNodes]);

  const autoLayout = useCallback(() => {
    setNodes((currentNodes) => layoutCanvasNodes(currentNodes));
  }, [setNodes]);

  const alignSelectedNodes = useCallback((axis: 'left' | 'top') => {
    if (selectedNodes.length < 2) return;
    const target = axis === 'left'
      ? Math.min(...selectedNodes.map((node) => node.position.x))
      : Math.min(...selectedNodes.map((node) => node.position.y));
    const selectedIds = new Set(selectedNodes.map((node) => node.id));

    setNodes((currentNodes) =>
      currentNodes.map((node) => {
        if (!selectedIds.has(node.id)) return node;
        return {
          ...node,
          position: axis === 'left'
            ? { ...node.position, x: target }
            : { ...node.position, y: target },
        };
      }),
    );
    onAfterSelectionMutation?.();
  }, [onAfterSelectionMutation, selectedNodes, setNodes]);

  const distributeSelectedNodes = useCallback((axis: 'horizontal' | 'vertical') => {
    if (selectedNodes.length < 3) return;

    const sorted = [...selectedNodes].sort((a, b) =>
      axis === 'horizontal' ? a.position.x - b.position.x : a.position.y - b.position.y,
    );
    const first = axis === 'horizontal' ? sorted[0].position.x : sorted[0].position.y;
    const last = axis === 'horizontal'
      ? sorted[sorted.length - 1].position.x
      : sorted[sorted.length - 1].position.y;
    const step = (last - first) / (sorted.length - 1);
    const nextPositions = new Map(sorted.map((node, index) => [node.id, first + step * index]));

    setNodes((currentNodes) =>
      currentNodes.map((node) => {
        const next = nextPositions.get(node.id);
        if (next === undefined) return node;
        return {
          ...node,
          position: axis === 'horizontal'
            ? { ...node.position, x: next }
            : { ...node.position, y: next },
        };
      }),
    );
    onAfterSelectionMutation?.();
  }, [onAfterSelectionMutation, selectedNodes, setNodes]);

  return {
    addNode,
    updateContent,
    deleteNode,
    deleteSelectedNodes,
    updateNodesFromPanel,
    resizeNodesFromPanel,
    addCustomHandle,
    deleteCustomHandle,
    onNodeDragStop,
    autoLayout,
    alignSelectedNodes,
    distributeSelectedNodes,
  };
}
