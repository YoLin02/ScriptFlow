import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

const StandardHandles = memo(() => {
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
    </>
  );
});

StandardHandles.displayName = 'StandardHandles';

export default StandardHandles;
