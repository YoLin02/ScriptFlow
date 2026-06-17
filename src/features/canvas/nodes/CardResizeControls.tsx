import { NodeResizeControl, ResizeControlVariant, useReactFlow } from '@xyflow/react';
import type { ControlPosition, OnResize } from '@xyflow/react';
import { useCallback } from 'react';
import type { WorkspaceNode } from '../../../types';

type ResizeCorner = {
  position: ControlPosition;
  cursor: string;
};

interface CardResizeControlsProps {
  id: string;
  selected?: boolean;
  minWidth: number;
  minHeight: number;
  maxWidth?: number;
  maxHeight?: number;
}

const RESIZE_CORNERS: ResizeCorner[] = [
  { position: 'top-left', cursor: 'nwse-resize' },
  { position: 'top-right', cursor: 'nesw-resize' },
  { position: 'bottom-left', cursor: 'nesw-resize' },
  { position: 'bottom-right', cursor: 'nwse-resize' },
];

export default function CardResizeControls({
  id,
  selected,
  minWidth,
  minHeight,
  maxWidth,
  maxHeight,
}: CardResizeControlsProps) {
  const { setNodes } = useReactFlow<WorkspaceNode>();

  const syncNodeSize = useCallback<OnResize>(
    (_, params) => {
      setNodes((currentNodes) =>
        currentNodes.map((node) =>
          node.id === id
            ? {
                ...node,
                data: {
                  ...node.data,
                  width: Math.round(params.width),
                  height: Math.round(params.height),
                },
              }
            : node,
        ),
      );
    },
    [id, setNodes],
  );

  if (!selected) return null;

  return (
    <>
      {RESIZE_CORNERS.map(({ position, cursor }) => (
        <NodeResizeControl
          key={position}
          nodeId={id}
          position={position}
          variant={ResizeControlVariant.Handle}
          minWidth={minWidth}
          minHeight={minHeight}
          maxWidth={maxWidth}
          maxHeight={maxHeight}
          onResize={syncNodeSize}
          onResizeEnd={syncNodeSize}
          className="card-resize-control"
          style={{
            width: 10,
            height: 10,
            border: 'none',
            background: 'transparent',
            cursor,
            zIndex: 40,
          }}
        >
          <span className="pointer-events-none block h-2 w-2 rounded-sm border border-blue-500 bg-white shadow-sm" />
        </NodeResizeControl>
      ))}
    </>
  );
}
