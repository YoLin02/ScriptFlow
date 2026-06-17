import type { Edge } from '@xyflow/react';
import type { WorkspaceNode } from '../../../types';

export interface CanvasRegionTemplate {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  nodes: WorkspaceNode[];
  edges: Edge[];
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}
