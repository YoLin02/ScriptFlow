import { useCallback, useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { Edge } from '@xyflow/react';
import type { CanvasContextMenuState } from '../types';

interface UseCanvasContextMenuOptions {
  screenToFlowPosition: (position: { x: number; y: number }) => { x: number; y: number };
  setEditingId: Dispatch<SetStateAction<string | null>>;
  setSelectedEdge: Dispatch<SetStateAction<Edge | null>>;
  resetPointerPan: () => void;
}

export function useCanvasContextMenu({
  screenToFlowPosition,
  setEditingId,
  setSelectedEdge,
  resetPointerPan,
}: UseCanvasContextMenuOptions) {
  const [contextMenu, setContextMenu] = useState<CanvasContextMenuState | null>(null);

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const openCanvasContextMenu = useCallback((clientX: number, clientY: number) => {
    setEditingId(null);
    setSelectedEdge(null);
    resetPointerPan();
    const flowPosition = screenToFlowPosition({ x: clientX, y: clientY });
    setContextMenu({
      x: clientX,
      y: clientY,
      flowX: flowPosition.x,
      flowY: flowPosition.y,
    });
  }, [resetPointerPan, screenToFlowPosition, setEditingId, setSelectedEdge]);

  useEffect(() => {
    window.addEventListener('click', closeContextMenu);
    window.addEventListener('keydown', closeContextMenu);

    return () => {
      window.removeEventListener('click', closeContextMenu);
      window.removeEventListener('keydown', closeContextMenu);
    };
  }, [closeContextMenu]);

  return {
    contextMenu,
    setContextMenu,
    closeContextMenu,
    openCanvasContextMenu,
  };
}
