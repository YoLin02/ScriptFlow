/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Node, Edge } from '@xyflow/react';

export type NodeType = 'text' | 'image' | 'idea' | 'table' | 'timeline';

interface BaseCanvasNodeData extends Record<string, unknown> {
  id: string;
  type: NodeType;
  content: string;
  title?: string;
  tags?: string[];
  imageUrl?: string;
  imageCaption?: string;
  createdAt: number;
}

export interface TextCanvasNodeData extends BaseCanvasNodeData {
  type: 'text';
}

export interface ImageCanvasNodeData extends BaseCanvasNodeData {
  type: 'image';
  imageUrl?: string;
  imageCaption?: string;
}

export interface IdeaCanvasNodeData extends BaseCanvasNodeData {
  type: 'idea';
}

export interface TableCanvasNodeData extends BaseCanvasNodeData {
  type: 'table';
}

export interface TimelineCanvasNodeData extends BaseCanvasNodeData {
  type: 'timeline';
}

export type CanvasNodeData =
  | TextCanvasNodeData
  | ImageCanvasNodeData
  | IdeaCanvasNodeData
  | TableCanvasNodeData
  | TimelineCanvasNodeData;

export type WorkspaceNode = Node<CanvasNodeData>;

export interface CanvasMediaAsset {
  id: string;
  url: string;
  name: string;
  uploadedAt: number;
}

export interface WorkspaceSaveState {
  mainDocumentHtml: string;
  nodes: Array<WorkspaceNode>;
  edges: Array<Edge>;
}
