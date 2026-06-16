/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  addEdge,
  Connection,
  Edge,
  MarkerType,
  PanOnScrollMode,
  SelectionMode,
  useReactFlow,
} from '@xyflow/react';

import { TextNode, ImageNode, IdeaNode, TableNode, TimelineNode, NodeActionContext } from './CustomNodes';
import {
  AutoSaveStatus,
  CanvasMediaAsset,
  CanvasNodeData,
  NodeType,
  TableNodeDataValue,
  TimelineTrackDataValue,
  WorkspaceNode,
  WorkspaceSaveState,
} from '../types';
import Header from './Header';
import { dbGet, dbSet } from '../db';
import { useFeedback } from './feedback/FeedbackProvider';
import CanvasToolbar from './CanvasToolbar';
import WorkspaceHistoryControls from './WorkspaceHistoryControls';
import MediaLibraryDrawer from './MediaLibraryDrawer';
import AssemblyPreviewModal from './AssemblyPreviewModal';
import ClearCanvasConfirmModal from './ClearCanvasConfirmModal';
import CanvasHintBubble from './CanvasHintBubble';
import CanvasContextMenu from './CanvasContextMenu';
import CanvasPropertiesPanel from './CanvasPropertiesPanel';
import {
  DEFAULT_RELATION_TAGS,
  assembleDocumentFromGraph,
  assembledTextToHtml,
  getActiveTickDetails,
  getConnectedNodeIds,
  getEdgePresentation,
} from './flowCanvasUtils';

interface CanvasContextMenuState {
  x: number;
  y: number;
  flowX: number;
  flowY: number;
}

interface ClipboardState {
  nodes: WorkspaceNode[];
  edges: Edge[];
}

interface FlowCanvasProps {
  nodes: WorkspaceNode[];
  edges: Edge[];
  onNodesChange: any;
  onEdgesChange: any;
  setNodes: React.Dispatch<React.SetStateAction<WorkspaceNode[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  onUpdateMainDocument: (newHtml: string) => void;
  onLoadPreset: (presetName: string) => void;
  onExportState: () => void;
  onImportState: (state: WorkspaceSaveState) => void;
  onResetWorkspace: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  saveStatus: AutoSaveStatus;
  lastSavedAt: number | null;
  saveError: string | null;
}

export default function FlowCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  setNodes,
  setEdges,
  onUpdateMainDocument,
  onLoadPreset,
  onExportState,
  onImportState,
  onResetWorkspace,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  saveStatus,
  lastSavedAt,
  saveError,
}: FlowCanvasProps) {
  const { screenToFlowPosition } = useReactFlow();
  const { toast } = useFeedback();

  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [customEdgeRelation, setCustomEdgeRelation] = useState('');
  const [shortcutTags, setShortcutTags] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('custom_relation_tags');
      return saved ? JSON.parse(saved) : DEFAULT_RELATION_TAGS;
    } catch (e) {
      console.error(e);
      return DEFAULT_RELATION_TAGS;
    }
  });

  const [isAssemblyModalOpen, setIsAssemblyModalOpen] = useState(false);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [assembledDocText, setAssembledDocText] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showHints, setShowHints] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isMediaLibraryOpen, setIsMediaLibraryOpen] = useState(false);
  const [mediaAssets, setMediaAssets] = useState<CanvasMediaAsset[]>([]);
  const [isAssetsLoaded, setIsAssetsLoaded] = useState(false);
  const [contextMenu, setContextMenu] = useState<CanvasContextMenuState | null>(null);
  const [clipboard, setClipboard] = useState<ClipboardState | null>(null);
  const [isPanningByPointer, setIsPanningByPointer] = useState(false);

  const fileFolderInputRef = useRef<HTMLInputElement>(null);
  const rightPointerRef = useRef({ active: false, startX: 0, startY: 0, moved: false });

  const beginPointerPan = useCallback((clientX: number, clientY: number) => {
    rightPointerRef.current = { active: true, startX: clientX, startY: clientY, moved: false };
    setIsPanningByPointer(true);
  }, []);

  const updatePointerPan = useCallback((clientX: number, clientY: number) => {
    const pointerState = rightPointerRef.current;
    if (!pointerState.active) return;

    const distance = Math.hypot(clientX - pointerState.startX, clientY - pointerState.startY);
    if (distance > 6) {
      pointerState.moved = true;
    }
  }, []);

  const endPointerPan = useCallback(() => {
    setIsPanningByPointer(false);
  }, []);

  const resetPointerPan = useCallback(() => {
    rightPointerRef.current = { active: false, startX: 0, startY: 0, moved: false };
    setIsPanningByPointer(false);
  }, []);

  useEffect(() => {
    localStorage.setItem('custom_relation_tags', JSON.stringify(shortcutTags));
  }, [shortcutTags]);

  useEffect(() => {
    setCustomEdgeRelation(selectedEdge ? (selectedEdge.label as string) || '' : '');
  }, [selectedEdge]);

  useEffect(() => {
    async function loadAssets() {
      try {
        const saved = await dbGet<CanvasMediaAsset[]>('canvas_media_assets');
        if (saved) {
          setMediaAssets(saved);
        }
      } catch (e) {
        console.error('Failed to load media assets', e);
      } finally {
        setIsAssetsLoaded(true);
      }
    }
    loadAssets();
  }, []);

  useEffect(() => {
    if (!isAssetsLoaded) return;
    dbSet('canvas_media_assets', mediaAssets).catch((e) => {
      console.error('Failed to save media assets', e);
    });
  }, [mediaAssets, isAssetsLoaded]);

  useEffect(() => {
    const closeContextMenu = () => setContextMenu(null);
    window.addEventListener('click', closeContextMenu);
    window.addEventListener('keydown', closeContextMenu);
    return () => {
      window.removeEventListener('click', closeContextMenu);
      window.removeEventListener('keydown', closeContextMenu);
    };
  }, []);

  const nodeTypes = useMemo(() => ({
    text: TextNode,
    image: ImageNode,
    idea: IdeaNode,
    table: TableNode,
    timeline: TimelineNode,
  }), []);

  const activeTimelineNode = useMemo(
    () => nodes.find((node) => node.type === 'timeline' && node.selected),
    [nodes],
  );
  const selectedNodes = useMemo(() => nodes.filter((node) => node.selected), [nodes]);
  const selectedNodesForProperties = useMemo(
    () => selectedNodes.some((node) => node.type === 'timeline') ? [] : selectedNodes,
    [selectedNodes],
  );
  const activeTickDetails = useMemo(() => getActiveTickDetails(nodes), [nodes]);
  const isFilterActive = !!(activeTimelineNode || activeTickDetails);
  const connectedNodeIds = useMemo(
    () => getConnectedNodeIds(nodes, edges, activeTimelineNode, activeTickDetails),
    [nodes, edges, activeTimelineNode, activeTickDetails],
  );

  const displayNodes = useMemo(() => {
    if (!isFilterActive) return nodes;

    return nodes.map((node) => {
      const isConnected = connectedNodeIds.has(node.id);
      return {
        ...node,
        style: {
          ...node.style,
          opacity: isConnected ? 1.0 : 0.15,
          transition: 'opacity 0.25s ease-in-out',
          filter: isConnected ? 'none' : 'grayscale(25%)',
        },
      };
    });
  }, [nodes, isFilterActive, connectedNodeIds]);

  const displayEdges = useMemo(() => {
    if (!isFilterActive) return edges;

    return edges.map((edge) => {
      const isSourceConnected = connectedNodeIds.has(edge.source);
      const isTargetConnected = connectedNodeIds.has(edge.target);
      const isLinkActive = activeTickDetails
        ? edge.source === activeTickDetails.nodeId
          ? edge.sourceHandle === activeTickDetails.tickId
          : isSourceConnected && isTargetConnected
        : isSourceConnected && isTargetConnected;

      return {
        ...edge,
        animated: isLinkActive ? true : edge.animated,
        style: {
          ...edge.style,
          opacity: isLinkActive ? 1.0 : 0.12,
          stroke: isLinkActive ? '#171717' : '#e5e5e5',
          strokeWidth: isLinkActive ? 2.5 : 1.0,
          transition: 'opacity 0.2s ease, stroke 0.2s ease',
        },
        labelStyle: {
          ...edge.labelStyle,
          opacity: isLinkActive ? 1 : 0.08,
          transition: 'opacity 0.2s ease',
        },
        labelBgStyle: {
          ...edge.labelBgStyle,
          opacity: isLinkActive ? 1 : 0,
          transition: 'opacity 0.2s ease',
        },
      };
    });
  }, [edges, isFilterActive, activeTickDetails, connectedNodeIds]);

  const getCenteredNodePosition = useCallback((xOffset = 120, yOffset = 120) => {
    try {
      const flowContainer = document.querySelector('.react-flow');
      let clientX = window.innerWidth / 2;
      let clientY = window.innerHeight / 2;

      if (flowContainer) {
        const rect = flowContainer.getBoundingClientRect();
        clientX = rect.left + rect.width / 2;
        clientY = rect.top + rect.height / 2;
      }

      const flowPos = screenToFlowPosition({ x: clientX, y: clientY });
      return {
        x: flowPos.x - xOffset + (Math.random() - 0.5) * 40,
        y: flowPos.y - yOffset + (Math.random() - 0.5) * 40,
      };
    } catch (err) {
      console.warn('screenToFlowPosition error, using fallback coordinates', err);
      return {
        x: 100 + Math.random() * 150,
        y: 100 + Math.random() * 150,
      };
    }
  }, [screenToFlowPosition]);

  const openCanvasContextMenu = useCallback((clientX: number, clientY: number) => {
    setEditingId(null);
    setSelectedEdge(null);
    setIsPanningByPointer(false);
    const flowPosition = screenToFlowPosition({ x: clientX, y: clientY });
    setContextMenu({ x: clientX, y: clientY, flowX: flowPosition.x, flowY: flowPosition.y });
  }, [screenToFlowPosition]);

  const handleNodeDragStop = useCallback((event: any, node: WorkspaceNode) => {
    if (node.type !== 'timeline') return;

    setNodes((currentNodes) => {
      const otherTimelineYs = currentNodes
        .filter((candidate) => candidate.type === 'timeline' && candidate.id !== node.id)
        .map((candidate) => candidate.position.y);

      const snapDistance = 35;
      const closeY = otherTimelineYs.find((y) => Math.abs(y - node.position.y) < snapDistance);
      const targetY = closeY !== undefined ? closeY : Math.round(node.position.y / 20) * 20;

      return currentNodes.map((candidate) => {
        if (candidate.id !== node.id) return candidate;
        return {
          ...candidate,
          position: {
            x: Math.round(node.position.x / 20) * 20,
            y: targetY,
          },
        };
      });
    });
  }, [setNodes]);

  const handleUpdateNodeContent = useCallback((
    id: string,
    text: string,
    title?: string,
    imageUrl?: string,
    imageCaption?: string,
    extraData?: Partial<CanvasNodeData>,
  ) => {
    setNodes((currentNodes) =>
      currentNodes.map((node) => {
        if (node.id !== id) return node;
        return {
          ...node,
          data: {
            ...node.data,
            content: text,
            title: title !== undefined ? title : node.data.title,
            imageUrl: imageUrl !== undefined ? imageUrl : node.data.imageUrl,
            imageCaption: imageCaption !== undefined ? imageCaption : node.data.imageCaption,
            ...extraData,
          },
        } as WorkspaceNode;
      }),
    );

    const timelineData = (extraData as { timelineData?: TimelineTrackDataValue } | undefined)?.timelineData;
    if (timelineData?.ticks) {
      const validTickIds = new Set(timelineData.ticks.map((tick) => tick.id));
      setEdges((currentEdges) =>
        currentEdges.filter((edge) => edge.source !== id || !edge.sourceHandle || validTickIds.has(edge.sourceHandle)),
      );
      return;
    }

    try {
      if (text.trim().startsWith('{')) {
        const parsed = JSON.parse(text);
        if (parsed.ticks && Array.isArray(parsed.ticks)) {
          const validTickIds = new Set(parsed.ticks.map((tick: any) => tick.id));
          setEdges((currentEdges) =>
            currentEdges.filter((edge) => edge.source !== id || !edge.sourceHandle || validTickIds.has(edge.sourceHandle)),
          );
        }
      }
    } catch (e) {}
  }, [setNodes, setEdges]);

  const handleDeleteNode = useCallback((id: string) => {
    setNodes((currentNodes) => currentNodes.filter((node) => node.id !== id));
    setEdges((currentEdges) => currentEdges.filter((edge) => edge.source !== id && edge.target !== id));
  }, [setNodes, setEdges]);

  const handleAutoLayout = useCallback(() => {
    setNodes((currentNodes) => {
      const textNodes = currentNodes.filter((node) => node.type === 'text');
      const imageNodes = currentNodes.filter((node) => node.type === 'image');
      const ideaNodes = currentNodes.filter((node) => node.type === 'idea');
      const tableNodes = currentNodes.filter((node) => node.type === 'table');
      const timelineNodes = currentNodes.filter((node) => node.type === 'timeline');

      return currentNodes.map((node) => {
        let position = { x: node.position.x, y: node.position.y };

        if (node.type === 'text') {
          const idx = textNodes.findIndex((candidate) => candidate.id === node.id);
          position = { x: 80 + (idx % 3) * 360, y: 80 + Math.floor(idx / 3) * 260 };
        } else if (node.type === 'image') {
          const idx = imageNodes.findIndex((candidate) => candidate.id === node.id);
          position = { x: 80 + (idx % 3) * 320, y: 480 + Math.floor(idx / 3) * 320 };
        } else if (node.type === 'idea') {
          const idx = ideaNodes.findIndex((candidate) => candidate.id === node.id);
          position = { x: 80 + (idx % 4) * 280, y: 880 + Math.floor(idx / 4) * 220 };
        } else if (node.type === 'table') {
          const idx = tableNodes.findIndex((candidate) => candidate.id === node.id);
          position = { x: 80 + (idx % 2) * 440, y: 1120 + Math.floor(idx / 2) * 280 };
        } else if (node.type === 'timeline') {
          const sortedTimeline = [...timelineNodes].sort((a, b) => a.position.x - b.position.x);
          const idx = sortedTimeline.findIndex((candidate) => candidate.id === node.id);
          position = { x: 80 + idx * 540, y: 500 };
        }

        return { ...node, position };
      });
    });
  }, [setNodes]);

  const onConnect = useCallback((params: Connection) => {
    const newEdge: Edge = {
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
    setEdges((currentEdges) => addEdge(newEdge, currentEdges));
  }, [setEdges]);

  const handleUpdateEdgeRelationship = useCallback((typeLabel: string) => {
    if (!selectedEdge) return;

    const trimmed = typeLabel.trim();
    if (trimmed) {
      setShortcutTags((currentTags) => currentTags.includes(trimmed) ? currentTags : [...currentTags, trimmed]);
    }

    setEdges((currentEdges) =>
      currentEdges.map((edge) => {
        if (edge.id !== selectedEdge.id) return edge;
        const presentation = getEdgePresentation(typeLabel);
        return {
          ...edge,
          label: typeLabel,
          ...presentation,
        };
      }),
    );
    setSelectedEdge(null);
  }, [selectedEdge, setEdges]);

  const handleDeleteSelectedEdge = useCallback(() => {
    if (!selectedEdge) return;
    setEdges((currentEdges) => currentEdges.filter((edge) => edge.id !== selectedEdge.id));
    setSelectedEdge(null);
  }, [selectedEdge, setEdges]);

  const handleAddNewNode = useCallback((type: NodeType) => {
    const id = `node-${Date.now()}`;
    let content = '双击此卡片输入内容...';
    let title = '新建卡片';
    let extraData: Partial<CanvasNodeData> = {};

    if (type === 'image') {
      content = '';
      title = '图片节点';
    } else if (type === 'idea') {
      content = '记录突发的写作灵感或批注备注';
      title = '灵感火花';
    } else if (type === 'table') {
      content = '';
      const tableData: TableNodeDataValue = {
        headers: ['项目', '分工', '状态'],
        rows: [
          ['模块A', '张三', '进行中'],
          ['模块B', '李四', '未开始'],
        ],
      };
      extraData = { tableData } as Partial<CanvasNodeData>;
      title = '结构化数据表';
    } else if (type === 'timeline') {
      content = '';
      const timelineData: TimelineTrackDataValue = {
        ticks: [
          { id: `tick-${Date.now()}-0`, seconds: 0 },
          { id: `tick-${Date.now()}-1`, seconds: 600 },
          { id: `tick-${Date.now()}-2`, seconds: 1200 },
        ],
        width: 750,
        activeTickId: null,
        fontSize: 12,
      };
      extraData = { timelineData } as Partial<CanvasNodeData>;
      title = '时间轴轨道';
    }

    const newNode: WorkspaceNode = {
      id,
      type,
      position: getCenteredNodePosition(),
      data: {
        id,
        type,
        content,
        title,
        createdAt: Date.now(),
        ...extraData,
      },
    } as WorkspaceNode;

    setNodes((currentNodes) => [...currentNodes, newNode]);
    setIsDrawerOpen(false);
  }, [getCenteredNodePosition, setNodes]);

  const handleBatchImageUpload = useCallback((files: File[]) => {
    files.forEach((file) => {
      const nameWithoutExtension = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const newAsset: CanvasMediaAsset = {
          id: `asset-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          url: base64String,
          name: nameWithoutExtension,
          uploadedAt: Date.now(),
        };

        setMediaAssets((currentAssets) => {
          if (currentAssets.some((asset) => asset.name === nameWithoutExtension)) {
            return currentAssets;
          }
          return [newAsset, ...currentAssets];
        });

        const nodeId = `node-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
        const newNode: WorkspaceNode = {
          id: nodeId,
          type: 'image',
          position: {
            x: 100 + Math.random() * 250,
            y: 100 + Math.random() * 250,
          },
          data: {
            id: nodeId,
            type: 'image',
            content: '',
            title: nameWithoutExtension,
            imageUrl: base64String,
            imageCaption: nameWithoutExtension,
            createdAt: Date.now(),
          },
        };

        setNodes((currentNodes) => [...currentNodes, newNode]);
      };
      reader.readAsDataURL(file);
    });
  }, [setNodes]);

  const handleInsertAssetNode = useCallback((asset: CanvasMediaAsset) => {
    setNodes((currentNodes) => {
      const selectedNode = currentNodes.find((node) => node.selected);

      if (selectedNode) {
        return currentNodes.map((node) => {
          if (node.id !== selectedNode.id) return node;
          return {
            ...node,
            type: 'image',
            data: {
              ...node.data,
              type: 'image',
              imageUrl: asset.url,
              title: asset.name,
              imageCaption: asset.name,
            },
          } as WorkspaceNode;
        });
      }

      const nodeId = `node-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      const newNode: WorkspaceNode = {
        id: nodeId,
        type: 'image',
        position: getCenteredNodePosition(140, 100),
        data: {
          id: nodeId,
          type: 'image',
          content: '',
          title: asset.name,
          imageUrl: asset.url,
          imageCaption: asset.name,
          createdAt: Date.now(),
        },
      };
      return [...currentNodes, newNode];
    });
  }, [getCenteredNodePosition, setNodes]);

  const handleDownloadAllImages = useCallback(() => {
    if (mediaAssets.length === 0) {
      toast('配图文件夹中现在没有图片。');
      return;
    }

    mediaAssets.forEach((asset, idx) => {
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = asset.url;
        let extension = 'png';
        if (asset.url.startsWith('data:image/jpeg') || asset.url.startsWith('data:image/jpg')) extension = 'jpg';
        else if (asset.url.startsWith('data:image/webp')) extension = 'webp';
        else if (asset.url.startsWith('data:image/gif')) extension = 'gif';

        link.download = `${asset.name}.${extension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, idx * 250);
    });
  }, [mediaAssets, toast]);

  const handleAssembleDocument = useCallback(() => {
    if (nodes.length === 0) {
      toast('画布中没有节点，无法生成。');
      return;
    }

    if (!nodes.some((node) => node.type === 'text' || node.type === 'idea')) {
      toast('画布中没有文本或灵感卡片，请先添加内容。');
      return;
    }

    setAssembledDocText(assembleDocumentFromGraph(nodes, edges));
    setIsAssemblyModalOpen(true);
    setIsDrawerOpen(false);
  }, [nodes, edges, toast]);

  const handleApplyAssembledToMainDoc = () => {
    onUpdateMainDocument(assembledTextToHtml(assembledDocText));
    setIsAssemblyModalOpen(false);
    toast('已反向还原到左侧文本编辑器。', 'success');
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(assembledDocText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleCopySelectedNodes = useCallback(() => {
    const selectedIds = new Set(selectedNodes.map((node) => node.id));
    if (selectedIds.size === 0) return;

    setClipboard({
      nodes: selectedNodes.map((node) => ({ ...node, selected: false })),
      edges: edges.filter((edge) => selectedIds.has(edge.source) && selectedIds.has(edge.target)),
    });
    setContextMenu(null);
  }, [selectedNodes, edges]);

  const handlePasteNodes = useCallback(() => {
    if (!clipboard || !contextMenu) return;

    const minX = Math.min(...clipboard.nodes.map((node) => node.position.x));
    const minY = Math.min(...clipboard.nodes.map((node) => node.position.y));
    const idMap = new Map<string, string>();
    const stamp = Date.now();

    const pastedNodes = clipboard.nodes.map((node, index) => {
      const newId = `node-${stamp}-${index}-${Math.random().toString(36).slice(2, 5)}`;
      idMap.set(node.id, newId);
      return {
        ...node,
        id: newId,
        selected: true,
        position: {
          x: contextMenu.flowX + (node.position.x - minX),
          y: contextMenu.flowY + (node.position.y - minY),
        },
        data: {
          ...node.data,
          id: newId,
          createdAt: Date.now(),
        },
      } as WorkspaceNode;
    });

    const pastedEdges = clipboard.edges.flatMap((edge, index) => {
      const source = idMap.get(edge.source);
      const target = idMap.get(edge.target);
      if (!source || !target) return [];
      return [{
        ...edge,
        id: `e-${stamp}-${index}-${Math.random().toString(36).slice(2, 5)}`,
        source,
        target,
        selected: false,
      }];
    });

    setNodes((currentNodes) => [
      ...currentNodes.map((node) => ({ ...node, selected: false })),
      ...pastedNodes,
    ]);
    setEdges((currentEdges) => [...currentEdges.map((edge) => ({ ...edge, selected: false })), ...pastedEdges]);
    setSelectedEdge(null);
    setContextMenu(null);
  }, [clipboard, contextMenu, setNodes, setEdges]);

  const handleDeleteSelectedNodes = useCallback(() => {
    const selectedIds = new Set(selectedNodes.map((node) => node.id));
    if (selectedIds.size === 0) return;

    setNodes((currentNodes) => currentNodes.filter((node) => !selectedIds.has(node.id)));
    setEdges((currentEdges) => currentEdges.filter((edge) => !selectedIds.has(edge.source) && !selectedIds.has(edge.target)));
    setContextMenu(null);
  }, [selectedNodes, setNodes, setEdges]);

  const alignSelectedNodes = useCallback((axis: 'left' | 'top') => {
    if (selectedNodes.length < 2) return;
    const target = axis === 'left'
      ? Math.min(...selectedNodes.map((node) => node.position.x))
      : Math.min(...selectedNodes.map((node) => node.position.y));
    const selectedIds = new Set(selectedNodes.map((node) => node.id));

    setNodes((currentNodes) =>
      currentNodes.map((node) => {
        if (!selectedIds.has(node.id)) return node;
        return {
          ...node,
          position: axis === 'left'
            ? { ...node.position, x: target }
            : { ...node.position, y: target },
        };
      }),
    );
    setContextMenu(null);
  }, [selectedNodes, setNodes]);

  const distributeSelectedNodes = useCallback((axis: 'horizontal' | 'vertical') => {
    if (selectedNodes.length < 3) return;
    const sorted = [...selectedNodes].sort((a, b) =>
      axis === 'horizontal' ? a.position.x - b.position.x : a.position.y - b.position.y,
    );
    const first = axis === 'horizontal' ? sorted[0].position.x : sorted[0].position.y;
    const last = axis === 'horizontal'
      ? sorted[sorted.length - 1].position.x
      : sorted[sorted.length - 1].position.y;
    const step = (last - first) / (sorted.length - 1);
    const nextPositions = new Map(sorted.map((node, index) => [node.id, first + step * index]));

    setNodes((currentNodes) =>
      currentNodes.map((node) => {
        const next = nextPositions.get(node.id);
        if (next === undefined) return node;
        return {
          ...node,
          position: axis === 'horizontal'
            ? { ...node.position, x: next }
            : { ...node.position, y: next },
        };
      }),
    );
    setContextMenu(null);
  }, [selectedNodes, setNodes]);

  const handleUpdateNodesFromPanel = useCallback((nodeIds: string[], patch: Partial<CanvasNodeData>) => {
    const nodeIdSet = new Set(nodeIds);
    setNodes((currentNodes) =>
      currentNodes.map((node) => {
        if (!nodeIdSet.has(node.id)) return node;
        return {
          ...node,
          data: {
            ...node.data,
            ...patch,
          },
        } as WorkspaceNode;
      }),
    );
  }, [setNodes]);

  const handleResizeNodesFromPanel = useCallback((nodeIds: string[], width?: number, height?: number) => {
    const nodeIdSet = new Set(nodeIds);
    setNodes((currentNodes) =>
      currentNodes.map((node) => {
        if (!nodeIdSet.has(node.id)) return node;
        return {
          ...node,
          width: width ?? node.width,
          height: height ?? node.height,
          data: {
            ...node.data,
            width: width ?? node.data.width,
            height: height ?? node.data.height,
          },
        } as WorkspaceNode;
      }),
    );
  }, [setNodes]);

  const handleUpdateEdgeFromPanel = useCallback((edgeId: string, patch: Partial<Edge>) => {
    setEdges((currentEdges) =>
      currentEdges.map((edge) => edge.id === edgeId ? { ...edge, ...patch } : edge),
    );
    setSelectedEdge((currentEdge) => currentEdge?.id === edgeId ? { ...currentEdge, ...patch } : currentEdge);
  }, [setEdges]);

  const nodeActionContextValue = useMemo(() => ({
    onDeleteNode: handleDeleteNode,
    onUpdateContent: handleUpdateNodeContent,
    editingId,
    setEditingId,
  }), [handleDeleteNode, handleUpdateNodeContent, editingId]);

  return (
    <div className="h-full w-full bg-neutral-50 relative overflow-hidden flex flex-col">
      <Header
        onLoadPreset={onLoadPreset}
        onExportState={onExportState}
        onImportState={onImportState}
        onResetWorkspace={onResetWorkspace}
        menuOpen={isMenuOpen}
        onMenuOpenChange={(open) => {
          setIsMenuOpen(open);
          if (open) {
            setIsDrawerOpen(false);
            setIsMediaLibraryOpen(false);
          }
        }}
        leadingActions={
          <WorkspaceHistoryControls
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={onUndo}
            onRedo={onRedo}
          />
        }
        onAutoLayout={handleAutoLayout}
        onAssembleDocument={handleAssembleDocument}
        onRequestClearCanvas={() => setShowClearConfirmModal(true)}
      />

      <div
        className="flex-1 w-full h-full relative"
        id="reactflow-container"
        onPointerDownCapture={(event) => {
          if (event.button === 1 || event.button === 2) {
            beginPointerPan(event.clientX, event.clientY);
          }
        }}
        onPointerMoveCapture={(event) => {
          updatePointerPan(event.clientX, event.clientY);
        }}
        onPointerUpCapture={endPointerPan}
        onPointerLeave={endPointerPan}
        onPointerCancelCapture={resetPointerPan}
        onContextMenu={(event) => {
          const target = event.target as Element;
          if (!target.closest('.react-flow')) return;

          event.preventDefault();
          event.stopPropagation();

          const wasRightDrag = rightPointerRef.current.moved;
          resetPointerPan();

          if (wasRightDrag) {
            setContextMenu(null);
            return;
          }

          openCanvasContextMenu(event.clientX, event.clientY);
        }}
      >
        <NodeActionContext.Provider value={nodeActionContextValue}>
          <ReactFlow
            nodes={displayNodes}
            edges={displayEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            onNodeDragStop={handleNodeDragStop}
            onNodeClick={() => setSelectedEdge(null)}
            onEdgeClick={(event, edge) => {
              setSelectedEdge(edges.find((candidate) => candidate.id === edge.id) || edge);
              setNodes((currentNodes) => currentNodes.map((node) => ({ ...node, selected: false })));
            }}
            panOnDrag={[1, 2]}
            selectionOnDrag
            selectionMode={SelectionMode.Partial}
            panOnScroll
            panOnScrollMode={PanOnScrollMode.Vertical}
            zoomOnScroll={false}
            zoomActivationKeyCode="Control"
            onPaneClick={() => {
              setEditingId(null);
              setSelectedEdge(null);
              setContextMenu(null);
            }}
            onPaneContextMenu={(e) => {
              e.preventDefault();
              if (rightPointerRef.current.moved) {
                resetPointerPan();
                setContextMenu(null);
                return;
              }
              openCanvasContextMenu(e.clientX, e.clientY);
            }}
            onNodeContextMenu={(e, node) => {
              e.preventDefault();
              e.stopPropagation();
              if (rightPointerRef.current.moved) {
                resetPointerPan();
                setContextMenu(null);
                return;
              }
              setEditingId(null);
              setSelectedEdge(null);
              const isAlreadySelected = selectedNodes.some((selectedNode) => selectedNode.id === node.id);
              if (!isAlreadySelected) {
                setNodes((currentNodes) =>
                  currentNodes.map((candidate) => ({ ...candidate, selected: candidate.id === node.id })),
                );
              }
              const flowPosition = screenToFlowPosition({ x: e.clientX, y: e.clientY });
              setContextMenu({ x: e.clientX, y: e.clientY, flowX: flowPosition.x, flowY: flowPosition.y });
            }}
            onEdgeContextMenu={(e) => { e.preventDefault(); setEditingId(null); }}
            fitView
            className={`bg-white ${isPanningByPointer ? 'is-pointer-panning' : ''}`}
            onPointerDown={(event) => {
              if (event.button === 1 || event.button === 2) {
                beginPointerPan(event.clientX, event.clientY);
              }
            }}
            onPointerMove={(event) => {
              updatePointerPan(event.clientX, event.clientY);
            }}
            onPointerUp={endPointerPan}
            onPointerLeave={endPointerPan}
            onPointerCancel={resetPointerPan}
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
        </NodeActionContext.Provider>

        {showHints && <CanvasHintBubble onClose={() => setShowHints(false)} />}

        <CanvasPropertiesPanel
          selectedNodes={selectedNodesForProperties}
          selectedEdge={selectedNodes.length > 0 ? null : selectedEdge}
          onUpdateNodes={handleUpdateNodesFromPanel}
          onResizeNodes={handleResizeNodesFromPanel}
          onUpdateEdge={handleUpdateEdgeFromPanel}
        />

        {contextMenu && (
          <CanvasContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            selectedCount={selectedNodes.length}
            canPaste={!!clipboard}
            onCopy={handleCopySelectedNodes}
            onPaste={handlePasteNodes}
            onDelete={handleDeleteSelectedNodes}
            onAlignLeft={() => alignSelectedNodes('left')}
            onAlignTop={() => alignSelectedNodes('top')}
            onDistributeHorizontal={() => distributeSelectedNodes('horizontal')}
            onDistributeVertical={() => distributeSelectedNodes('vertical')}
            onClose={() => setContextMenu(null)}
          />
        )}

        <CanvasToolbar
          isDrawerOpen={isDrawerOpen}
          isMediaLibraryOpen={isMediaLibraryOpen}
          mediaAssetCount={mediaAssets.length}
          saveStatus={saveStatus}
          lastSavedAt={lastSavedAt}
          saveError={saveError}
          onToggleMediaLibrary={() => {
            const nextState = !isMediaLibraryOpen;
            setIsMediaLibraryOpen(nextState);
            setIsDrawerOpen(false);
            setIsMenuOpen(false);
          }}
          onToggleDrawer={() => {
            const nextState = !isDrawerOpen;
            setIsDrawerOpen(nextState);
            if (nextState) {
              setIsMenuOpen(false);
              setIsMediaLibraryOpen(false);
            }
          }}
          onAddNode={handleAddNewNode}
        />
      </div>

      <MediaLibraryDrawer
        open={isMediaLibraryOpen}
        assets={mediaAssets}
        fileInputRef={fileFolderInputRef}
        onClose={() => setIsMediaLibraryOpen(false)}
        onUpload={handleBatchImageUpload}
        onInsertAsset={handleInsertAssetNode}
        onDeleteAsset={(assetId) => setMediaAssets((currentAssets) => currentAssets.filter((asset) => asset.id !== assetId))}
        onDownloadAll={handleDownloadAllImages}
      />

      <AssemblyPreviewModal
        open={isAssemblyModalOpen}
        assembledDocText={assembledDocText}
        isCopied={isCopied}
        onClose={() => setIsAssemblyModalOpen(false)}
        onCopy={handleCopyToClipboard}
        onApply={handleApplyAssembledToMainDoc}
      />

      <ClearCanvasConfirmModal
        open={showClearConfirmModal}
        onCancel={() => setShowClearConfirmModal(false)}
        onConfirm={() => {
          setNodes([]);
          setEdges([]);
          setShowClearConfirmModal(false);
        }}
      />
    </div>
  );
}
