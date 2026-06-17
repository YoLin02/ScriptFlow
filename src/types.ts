/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Node, Edge } from '@xyflow/react';

export type NodeType = 'text' | 'image' | 'idea' | 'table' | 'timeline';

export interface TableNodeDataValue {
  headers: string[];
  rows: string[][];
}

export type TableTextAlign = 'left' | 'center' | 'right';

export interface TableCellSelection {
  section: 'header' | 'body';
  rowIndex?: number;
  columnIndex: number;
}

export interface TimelineTick {
  id: string;
  seconds: number;
  time?: string;
  percent?: number;
}

export interface TimelineTrackDataValue {
  ticks: TimelineTick[];
  width: number;
  activeTickId: string | null;
  fontSize?: number;
}

export interface CanvasNodeHandleData {
  id: string;
  side: 'top' | 'right' | 'bottom' | 'left';
  offset: number;
}

interface BaseCanvasNodeData extends Record<string, unknown> {
  id: string;
  type: NodeType;
  content: string;
  title?: string;
  tags?: string[];
  status?: string;
  color?: string;
  width?: number;
  height?: number;
  imageUrl?: string;
  imageCaption?: string;
  customHandles?: CanvasNodeHandleData[];
  createdAt: number;
}

export interface TextCanvasNodeData extends BaseCanvasNodeData {
  type: 'text';
}

export interface ImageCanvasNodeData extends BaseCanvasNodeData {
  type: 'image';
  imageUrl?: string;
  imageCaption?: string;
  imageNodeDisplayMode?: 'image-only' | 'image-card';
  imageDisplayMode?: 'contain' | 'cover' | 'original';
}

export interface IdeaCanvasNodeData extends BaseCanvasNodeData {
  type: 'idea';
  highlighted?: boolean;
}

export interface TableCanvasNodeData extends BaseCanvasNodeData {
  type: 'table';
  tableData?: TableNodeDataValue;
  tableAlign?: TableTextAlign;
  tableCellAlignments?: Record<string, TableTextAlign>;
  activeTableCell?: TableCellSelection | null;
}

export interface TimelineCanvasNodeData extends BaseCanvasNodeData {
  type: 'timeline';
  timelineData?: TimelineTrackDataValue;
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

export type AutoSaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

export interface WorkspaceSaveState {
  mainDocumentHtml: string;
  nodes: Array<WorkspaceNode>;
  edges: Array<Edge>;
}
