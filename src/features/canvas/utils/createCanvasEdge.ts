import { MarkerType, type Connection, type Edge } from '@xyflow/react';

export function createCanvasEdge(params: Connection): Edge {
  return {
    id: `e-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    source: params.source,
    target: params.target,
    sourceHandle: params.sourceHandle,
    targetHandle: params.targetHandle,
    type: 'default',
    label: '镜头关联',
    animated: true,
    style: { stroke: '#737373', strokeWidth: 1.5 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 16,
      height: 16,
      color: '#737373',
    },
  };
}

export function getEdgePresentation(typeLabel: string) {
  let style = { stroke: '#737373', strokeWidth: 1.5 };
  let animated = false;

  if (typeLabel.includes('转折') || typeLabel.includes('对比')) {
    style = { stroke: '#dc2626', strokeWidth: 1.5 };
  } else if (typeLabel.includes('因果') || typeLabel.includes('推导')) {
    style = { stroke: '#171717', strokeWidth: 2 };
    animated = true;
  } else if (typeLabel.includes('分支') || typeLabel.includes('并行')) {
    style = { stroke: '#2563eb', strokeWidth: 1.5 };
    animated = true;
  } else if (typeLabel.includes('补充') || typeLabel.includes('证据')) {
    style = { stroke: '#16a34a', strokeWidth: 1.5 };
  } else if (typeLabel.includes('批注') || typeLabel.includes('备注') || typeLabel.includes('注')) {
    style = { stroke: '#a3a3a3', strokeWidth: 1.2 };
  } else if (typeLabel) {
    style = { stroke: '#4f46e5', strokeWidth: 1.5 };
  }

  return { style, animated };
}
