import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  PanOnScrollMode,
  ReactFlow,
  SelectionMode,
} from '@xyflow/react';
import type { Edge, NodeTypes } from '@xyflow/react';
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
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={viewportHandlers.onConnect}
      nodeTypes={nodeTypes}
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
      className={`bg-white ${isPanningByPointer ? 'is-pointer-panning' : ''}`}
      onPointerDown={viewportHandlers.onPointerDown}
      onPointerMove={viewportHandlers.onPointerMove}
      onPointerUp={viewportHandlers.onPointerUp}
      onPointerLeave={viewportHandlers.onPointerLeave}
      onPointerCancel={viewportHandlers.onPointerCancel}
    >
      <Background
        variant={BackgroundVariant.Dots}
        color="#9ca3af"
        gap={39}
        size={1.35}
      />
      <Controls
        position="bottom-right"
        style={{
          bottom: 115,
          right: 16,
          margin: 0,
          boxShadow: '0 2px 5px rgba(0,0,0,0.06)',
          border: '1px solid #e0e0e0',
          borderRadius: '6px',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          padding: '2px',
        }}
        showInteractive={false}
      />
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
