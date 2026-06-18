import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  MiniMap,
  PanOnScrollMode,
  ReactFlow,
  SelectionMode,
  useReactFlow,
} from '@xyflow/react';
import type { Edge, NodeTypes } from '@xyflow/react';
import { Maximize2, Minus, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { WorkspaceNode } from '../../types';
import type { FlowCanvasProps, ViewportHandlers } from './types';

interface CanvasViewportProps {
  nodes: WorkspaceNode[];
  edges: Edge[];
  onNodesChange: FlowCanvasProps['onNodesChange'];
  onEdgesChange: FlowCanvasProps['onEdgesChange'];
  nodeTypes: NodeTypes;
  viewportHandlers: ViewportHandlers;
  isPanningByPointer: boolean;
}

export default function CanvasViewport({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  nodeTypes,
  viewportHandlers,
  isPanningByPointer,
}: CanvasViewportProps) {
  const [isDynamicHandleMode, setIsDynamicHandleMode] = useState(false);

  useEffect(() => {
    const syncModifierState = (event: KeyboardEvent) => {
      setIsDynamicHandleMode(event.ctrlKey && event.altKey);
    };
    const resetModifierState = () => setIsDynamicHandleMode(false);

    window.addEventListener('keydown', syncModifierState);
    window.addEventListener('keyup', syncModifierState);
    window.addEventListener('blur', resetModifierState);
    return () => {
      window.removeEventListener('keydown', syncModifierState);
      window.removeEventListener('keyup', syncModifierState);
      window.removeEventListener('blur', resetModifierState);
    };
  }, []);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={viewportHandlers.onConnect}
      nodeTypes={nodeTypes}
      connectionMode={ConnectionMode.Loose}
      onNodeDragStop={viewportHandlers.onNodeDragStop}
      onNodeClick={viewportHandlers.onNodeClick}
      onEdgeClick={viewportHandlers.onEdgeClick}
      panOnDrag={[1, 2]}
      selectionOnDrag
      selectionMode={SelectionMode.Partial}
      panOnScroll
      panOnScrollMode={PanOnScrollMode.Vertical}
      zoomOnScroll={false}
      zoomActivationKeyCode="Control"
      onPaneClick={viewportHandlers.onPaneClick}
      onPaneContextMenu={viewportHandlers.onPaneContextMenu}
      onNodeContextMenu={viewportHandlers.onNodeContextMenu}
      onEdgeContextMenu={viewportHandlers.onEdgeContextMenu}
      fitView
      className={`bg-white ${isPanningByPointer ? 'is-pointer-panning' : ''} ${isDynamicHandleMode ? 'is-dynamic-handle-mode' : ''}`}
      onPointerDown={viewportHandlers.onPointerDown}
      onPointerMove={viewportHandlers.onPointerMove}
      onPointerUp={viewportHandlers.onPointerUp}
      onPointerLeave={viewportHandlers.onPointerLeave}
      onPointerCancel={viewportHandlers.onPointerCancel}
      onDragOver={viewportHandlers.onDragOver}
      onDrop={viewportHandlers.onDrop}
    >
      <Background
        variant={BackgroundVariant.Dots}
        color="#9ca3af"
        gap={39}
        size={1.35}
      />
      <CanvasViewportControls />
      <MiniMap
        nodeColor={(node) => {
          if (node.type === 'text') return '#f5f5f5';
          if (node.type === 'image') return '#e5e5e5';
          if (node.type === 'idea') return '#d4d4d4';
          if (node.type === 'timeline') return '#171717';
          return '#fff';
        }}
        style={{
          borderRadius: '8px',
          border: '1px solid #e5e5e5',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          width: 120,
          height: 90,
          margin: 0,
          right: 16,
          bottom: 16,
          boxShadow: '0 2px 5px rgba(0,0,0,0.06)',
        }}
        position="bottom-right"
      />
    </ReactFlow>
  );
}

function CanvasViewportControls() {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  return (
    <div className="absolute bottom-[115px] right-4 z-20 flex flex-col overflow-visible rounded-md border border-neutral-200 bg-white/95 p-0.5 shadow-sm backdrop-blur-sm">
      <ViewportControlButton label="放大" onClick={() => zoomIn({ duration: 180 })}>
        <Plus className="h-4 w-4" />
      </ViewportControlButton>
      <ViewportControlButton label="缩小" onClick={() => zoomOut({ duration: 180 })}>
        <Minus className="h-4 w-4" />
      </ViewportControlButton>
      <ViewportControlButton label="适配视图" onClick={() => fitView({ duration: 220, padding: 0.2 })}>
        <Maximize2 className="h-4 w-4" />
      </ViewportControlButton>
    </div>
  );
}

function ViewportControlButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      data-tooltip={label}
      data-tooltip-placement="left"
      className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-sm text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-neutral-950"
    >
      {children}
    </button>
  );
}
