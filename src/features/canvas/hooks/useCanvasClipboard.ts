import { useCallback, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { Edge } from '@xyflow/react';
import type { WorkspaceNode } from '../../../types';
import type { CanvasContextMenuState, ClipboardState } from '../types';

interface UseCanvasClipboardOptions {
  edges: Edge[];
  selectedNodes: WorkspaceNode[];
  contextMenu: CanvasContextMenuState | null;
  setNodes: Dispatch<SetStateAction<WorkspaceNode[]>>;
  setEdges: Dispatch<SetStateAction<Edge[]>>;
  setSelectedEdge: Dispatch<SetStateAction<Edge | null>>;
  getCenteredNodePosition: (xOffset?: number, yOffset?: number) => { x: number; y: number };
  onAfterAction?: () => void;
}

export function useCanvasClipboard({
  edges,
  selectedNodes,
  contextMenu,
  setNodes,
  setEdges,
  setSelectedEdge,
  getCenteredNodePosition,
  onAfterAction,
}: UseCanvasClipboardOptions) {
  const [clipboard, setClipboard] = useState<ClipboardState | null>(null);

  const copySelectedNodes = useCallback(() => {
    const selectedIds = new Set(selectedNodes.map((node) => node.id));
    if (selectedIds.size === 0) return;

    setClipboard({
      nodes: selectedNodes.map((node) => ({ ...node, selected: false })),
      edges: edges.filter((edge) => selectedIds.has(edge.source) && selectedIds.has(edge.target)),
    });
    onAfterAction?.();
  }, [edges, onAfterAction, selectedNodes]);

  const pasteNodes = useCallback((targetPosition?: { x: number; y: number }) => {
    if (!clipboard) return;

    const minX = Math.min(...clipboard.nodes.map((node) => node.position.x));
    const minY = Math.min(...clipboard.nodes.map((node) => node.position.y));
    const pastePosition = targetPosition ?? (contextMenu
      ? { x: contextMenu.flowX, y: contextMenu.flowY }
      : getCenteredNodePosition(0, 0));
    const idMap = new Map<string, string>();
    const stamp = Date.now();

    const pastedNodes = clipboard.nodes.map((node, index) => {
      const newId = `node-${stamp}-${index}-${Math.random().toString(36).slice(2, 5)}`;
      idMap.set(node.id, newId);
      return {
        ...node,
        id: newId,
        selected: true,
        position: {
          x: pastePosition.x + (node.position.x - minX),
          y: pastePosition.y + (node.position.y - minY),
        },
        data: {
          ...node.data,
          id: newId,
          createdAt: Date.now(),
        },
      } as WorkspaceNode;
    });

    const pastedEdges = clipboard.edges.flatMap((edge, index) => {
      const source = idMap.get(edge.source);
      const target = idMap.get(edge.target);
      if (!source || !target) return [];
      return [{
        ...edge,
        id: `e-${stamp}-${index}-${Math.random().toString(36).slice(2, 5)}`,
        source,
        target,
        selected: false,
      }];
    });

    setNodes((currentNodes) => [
      ...currentNodes.map((node) => ({ ...node, selected: false })),
      ...pastedNodes,
    ]);
    setEdges((currentEdges) => [
      ...currentEdges.map((edge) => ({ ...edge, selected: false })),
      ...pastedEdges,
    ]);
    setSelectedEdge(null);
    onAfterAction?.();
  }, [clipboard, contextMenu, getCenteredNodePosition, onAfterAction, setEdges, setNodes, setSelectedEdge]);

  const duplicateSelectedNodes = useCallback(() => {
    if (selectedNodes.length === 0) return;

    const selectedIds = new Set(selectedNodes.map((node) => node.id));
    const idMap = new Map<string, string>();
    const stamp = Date.now();

    const duplicatedNodes = selectedNodes.map((node, index) => {
      const newId = `node-${stamp}-dup-${index}-${Math.random().toString(36).slice(2, 5)}`;
      idMap.set(node.id, newId);
      return {
        ...node,
        id: newId,
        selected: true,
        position: {
          x: node.position.x + 32,
          y: node.position.y + 32,
        },
        data: {
          ...node.data,
          id: newId,
          createdAt: Date.now(),
        },
      } as WorkspaceNode;
    });

    const duplicatedEdges = edges.flatMap((edge, index) => {
      if (!selectedIds.has(edge.source) || !selectedIds.has(edge.target)) return [];
      const source = idMap.get(edge.source);
      const target = idMap.get(edge.target);
      if (!source || !target) return [];
      return [{
        ...edge,
        id: `e-${stamp}-dup-${index}-${Math.random().toString(36).slice(2, 5)}`,
        source,
        target,
        selected: false,
      }];
    });

    setNodes((currentNodes) => [
      ...currentNodes.map((node) => ({ ...node, selected: false })),
      ...duplicatedNodes,
    ]);
    setEdges((currentEdges) => [
      ...currentEdges.map((edge) => ({ ...edge, selected: false })),
      ...duplicatedEdges,
    ]);
    setSelectedEdge(null);
    onAfterAction?.();
  }, [edges, onAfterAction, selectedNodes, setEdges, setNodes, setSelectedEdge]);

  return {
    clipboard,
    copySelectedNodes,
    pasteNodes,
    duplicateSelectedNodes,
  };
}
