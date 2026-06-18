import type { Connection, Edge, EdgeChange, NodeChange, OnEdgesChange, OnNodesChange } from '@xyflow/react';
import type {
  Dispatch,
  DragEvent as ReactDragEvent,
  MouseEvent as ReactMouseEvent,
  MutableRefObject,
  PointerEvent as ReactPointerEvent,
  SetStateAction,
} from 'react';
import type {
  AutoSaveStatus,
  CanvasMediaAsset,
  CanvasNodeData,
  WorkspaceNode,
  WorkspaceSaveState,
} from '../../types';
import type { ShortcutMap } from '../shortcuts';
import type { CanvasRegionTemplate } from './templates/types';

export interface CanvasContextMenuState {
  x: number;
  y: number;
  flowX: number;
  flowY: number;
}

export interface ClipboardState {
  nodes: WorkspaceNode[];
  edges: Edge[];
}

export interface PendingExtractedSlice {
  id: string;
  text: string;
  title?: string;
}

export interface FlowCanvasProps {
  nodes: WorkspaceNode[];
  edges: Edge[];
  onNodesChange: OnNodesChange<WorkspaceNode>;
  onEdgesChange: OnEdgesChange<Edge>;
  setNodes: Dispatch<SetStateAction<WorkspaceNode[]>>;
  setEdges: Dispatch<SetStateAction<Edge[]>>;
  onUpdateMainDocument: (newHtml: string) => void;
  onExportState: () => void;
  onImportState: (state: WorkspaceSaveState) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  saveStatus: AutoSaveStatus;
  lastSavedAt: number | null;
  saveError: string | null;
  pendingExtractedSlice: PendingExtractedSlice | null;
  onExtractedSlicePlaced: () => void;
  shortcuts: ShortcutMap;
  onOpenShortcutSettings: () => void;
}

export interface ViewportHandlers {
  onConnect: (params: Connection) => void;
  onNodeDragStop: (event: unknown, node: WorkspaceNode) => void;
  onNodeClick: () => void;
  onEdgeClick: (event: ReactMouseEvent, edge: Edge) => void;
  onPaneClick: () => void;
  onPaneContextMenu: (event: ReactMouseEvent) => void;
  onNodeContextMenu: (event: ReactMouseEvent, node: WorkspaceNode) => void;
  onEdgeContextMenu: (event: ReactMouseEvent) => void;
  onPointerDown: (event: ReactPointerEvent) => void;
  onPointerMove: (event: ReactPointerEvent) => void;
  onPointerUp: () => void;
  onPointerLeave: () => void;
  onPointerCancel: () => void;
  onDragOver: (event: ReactDragEvent<HTMLDivElement>) => void;
  onDrop: (event: ReactDragEvent<HTMLDivElement>) => void;
}

export interface ViewportShellHandlers {
  onPointerDownCapture: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerMoveCapture: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerUpCapture: () => void;
  onPointerLeave: () => void;
  onPointerCancelCapture: () => void;
  onContextMenu: (event: ReactMouseEvent<HTMLDivElement>) => void;
}

export interface CanvasNodeCommands {
  addNode: (type: CanvasNodeData['type']) => void;
  updateContent: (
    id: string,
    text: string,
    title?: string,
    imageUrl?: string,
    imageCaption?: string,
    extraData?: Partial<CanvasNodeData>,
  ) => void;
  deleteNode: (id: string) => void;
  deleteSelectedNodes: () => void;
  updateNodesFromPanel: (nodeIds: string[], patch: Partial<CanvasNodeData>) => void;
  resizeNodesFromPanel: (nodeIds: string[], width?: number, height?: number) => void;
  addCustomHandle: (nodeId: string, handle: NonNullable<CanvasNodeData['customHandles']>[number]) => void;
  deleteCustomHandle: (nodeId: string, handleId: string) => void;
  onNodeDragStop: (event: unknown, node: WorkspaceNode) => void;
  autoLayout: () => void;
  alignSelectedNodes: (axis: 'left' | 'top') => void;
  distributeSelectedNodes: (axis: 'horizontal' | 'vertical') => void;
}

export interface CanvasEdgeCommands {
  selectedEdge: Edge | null;
  setSelectedEdge: Dispatch<SetStateAction<Edge | null>>;
  customEdgeRelation: string;
  shortcutTags: string[];
  setShortcutTags: Dispatch<SetStateAction<string[]>>;
  onConnect: (params: Connection) => void;
  updateEdgeRelationship: (typeLabel: string) => void;
  deleteSelectedEdge: () => void;
  updateEdgeFromPanel: (edgeId: string, patch: Partial<Edge>) => void;
}

export interface CanvasClipboardCommands {
  clipboard: ClipboardState | null;
  copySelectedNodes: () => void;
  pasteNodes: (targetPosition?: { x: number; y: number }) => void;
  duplicateSelectedNodes: () => void;
}

export interface CanvasMediaLibraryState {
  isOpen: boolean;
  assets: CanvasMediaAsset[];
  fileInputRef: MutableRefObject<HTMLInputElement | null>;
  setOpen: Dispatch<SetStateAction<boolean>>;
  upload: (files: File[]) => void;
  insertAsset: (asset: CanvasMediaAsset) => void;
  deleteAsset: (assetId: string) => void;
  downloadAll: () => void;
}

export interface CanvasTemplateState {
  isOpen: boolean;
  templates: CanvasRegionTemplate[];
  canSaveSelection: boolean;
  templateCountLabel: string;
  setOpen: Dispatch<SetStateAction<boolean>>;
  saveSelectionAsTemplate: () => void;
  insertTemplate: (templateId: string) => void;
  renameTemplate: (templateId: string, name: string) => void;
  deleteTemplate: (templateId: string) => void;
}

export interface CanvasAssemblyState {
  isModalOpen: boolean;
  assembledDocText: string;
  isCopied: boolean;
  assembleDocument: () => void;
  applyToMainDocument: () => void;
  copyToClipboard: () => void;
  closeModal: () => void;
}
