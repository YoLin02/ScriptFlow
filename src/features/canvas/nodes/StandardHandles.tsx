import { memo, useContext } from 'react';
import { Handle, Position, useUpdateNodeInternals } from '@xyflow/react';
import { useEffect } from 'react';
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

  useEffect(() => {
    updateNodeInternals(nodeId);
  }, [customHandles, nodeId, updateNodeInternals]);

  return (
    <>
      <Handle type="target" position={Position.Top} id="t-tgt" className="!bg-neutral-400" />
      <Handle type="source" position={Position.Top} id="t-src" className="!bg-neutral-400" style={{ opacity: 0, zIndex: 10 }} />
      <Handle type="target" position={Position.Right} id="r-tgt" className="!bg-neutral-400" style={{ opacity: 0, zIndex: 10 }} />
      <Handle type="source" position={Position.Right} id="r-src" className="!bg-neutral-400" />
      <Handle type="target" position={Position.Bottom} id="b-tgt" className="!bg-neutral-400" />
      <Handle type="source" position={Position.Bottom} id="b-src" className="!bg-neutral-400" style={{ opacity: 0, zIndex: 10 }} />
      <Handle type="target" position={Position.Left} id="l-tgt" className="!bg-neutral-400" style={{ opacity: 0, zIndex: 10 }} />
      <Handle type="source" position={Position.Left} id="l-src" className="!bg-neutral-400" />
      {customHandles.map((handle) => {
        const position = POSITION_BY_SIDE[handle.side];
        const style = getCustomHandleStyle(handle);
        return (
          <span key={handle.id}>
            <Handle
              type="target"
              position={position}
              id={`${handle.id}-tgt`}
              className="custom-node-handle custom-node-handle-target !bg-neutral-500"
              style={{ ...style, opacity: 0, zIndex: 14 }}
              onClick={(event) => {
                if (!event.altKey) return;
                event.preventDefault();
                event.stopPropagation();
                onDeleteCustomHandle?.(nodeId, handle.id);
              }}
            />
            <Handle
              type="source"
              position={position}
              id={`${handle.id}-src`}
              className="custom-node-handle custom-node-handle-source !bg-neutral-500"
              style={{ ...style, zIndex: 15 }}
              onClick={(event) => {
                if (!event.altKey) return;
                event.preventDefault();
                event.stopPropagation();
                onDeleteCustomHandle?.(nodeId, handle.id);
              }}
            />
          </span>
        );
      })}
    </>
  );
});

StandardHandles.displayName = 'StandardHandles';

export default StandardHandles;
