import { memo, useContext, useEffect, useMemo } from 'react';
import { Handle, Position, useUpdateNodeInternals } from '@xyflow/react';
import { NodeActionContext } from './NodeActionContext';
import type { CanvasNodeHandleData } from '../../../types';

const POSITION_BY_SIDE: Record<CanvasNodeHandleData['side'], Position> = {
  top: Position.Top,
  right: Position.Right,
  bottom: Position.Bottom,
  left: Position.Left,
};

function getCustomHandleStyle(handle: CanvasNodeHandleData) {
  const value = `${handle.offset * 100}%`;
  if (handle.side === 'top' || handle.side === 'bottom') return { left: value };
  return { top: value };
}

const StandardHandles = memo(({ nodeId, customHandles = [] }: { nodeId: string; customHandles?: CanvasNodeHandleData[] }) => {
  const { onDeleteCustomHandle } = useContext(NodeActionContext);
  const updateNodeInternals = useUpdateNodeInternals();
  const handleSignature = useMemo(
    () => customHandles.map((handle) => `${handle.id}:${handle.side}:${handle.offset}`).join('|'),
    [customHandles],
  );

  useEffect(() => {
    updateNodeInternals(nodeId);
  }, [handleSignature, nodeId, updateNodeInternals]);

  return (
    <>
      <Handle type="source" position={Position.Top} id="t" className="!bg-neutral-400" />
      <Handle type="source" position={Position.Right} id="r" className="!bg-neutral-400" />
      <Handle type="source" position={Position.Bottom} id="b" className="!bg-neutral-400" />
      <Handle type="source" position={Position.Left} id="l" className="!bg-neutral-400" />
      {customHandles.map((handle) => {
        const position = POSITION_BY_SIDE[handle.side];
        const style = getCustomHandleStyle(handle);
        return (
          <Handle
            key={handle.id}
            type="source"
            position={position}
            id={handle.id}
            className="custom-node-handle custom-node-handle-source !bg-neutral-500"
            style={{ ...style, zIndex: 15 }}
            onClick={(event) => {
              if (!event.altKey) return;
              event.preventDefault();
              event.stopPropagation();
              onDeleteCustomHandle?.(nodeId, handle.id);
            }}
          />
        );
      })}
    </>
  );
});

StandardHandles.displayName = 'StandardHandles';

export default StandardHandles;
