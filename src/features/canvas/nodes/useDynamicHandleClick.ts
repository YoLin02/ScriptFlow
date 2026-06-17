import { useContext, useCallback } from 'react';
import type { MouseEvent } from 'react';
import { NodeActionContext } from './NodeActionContext';
import type { CanvasNodeHandleData } from '../../../types';

const EDGE_HIT_DISTANCE = 18;

function clampOffset(value: number) {
  return Math.min(0.96, Math.max(0.04, value));
}

function getHandleFromPointer(event: MouseEvent<HTMLElement>): Omit<CanvasNodeHandleData, 'id'> | null {
  const rect = event.currentTarget.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  const distances = [
    { side: 'top' as const, distance: y, offset: clampOffset(x / rect.width) },
    { side: 'right' as const, distance: rect.width - x, offset: clampOffset(y / rect.height) },
    { side: 'bottom' as const, distance: rect.height - y, offset: clampOffset(x / rect.width) },
    { side: 'left' as const, distance: x, offset: clampOffset(y / rect.height) },
  ].sort((a, b) => a.distance - b.distance);

  const nearest = distances[0];
  if (nearest.distance > EDGE_HIT_DISTANCE) return null;
  return { side: nearest.side, offset: nearest.offset };
}

export function useDynamicHandleClick(nodeId: string) {
  const { onAddCustomHandle } = useContext(NodeActionContext);

  return useCallback((event: MouseEvent<HTMLElement>) => {
    if (!event.ctrlKey || !event.altKey || event.button !== 0) return;
    if ((event.target as Element | null)?.closest('.react-flow__handle')) return;

    const nextHandle = getHandleFromPointer(event);
    if (!nextHandle) return;

    event.preventDefault();
    event.stopPropagation();
    onAddCustomHandle?.(nodeId, {
      id: `handle-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      ...nextHandle,
    });
  }, [nodeId, onAddCustomHandle]);
}
