import { useCallback, useMemo, useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import type { Edge } from '@xyflow/react';
import { NodeActionContext } from './nodes';
import { CANVAS_NODE_TYPES } from './constants';
import CanvasOverlays from './CanvasOverlays';
import CanvasViewport from './CanvasViewport';
import { useCanvasAssembly } from './hooks/useCanvasAssembly';
import { useCanvasClipboard } from './hooks/useCanvasClipboard';
import { useCanvasContextMenu } from './hooks/useCanvasContextMenu';
import { useCanvasEdgeCommands } from './hooks/useCanvasEdgeCommands';
import { useCanvasMediaLibrary } from './hooks/useCanvasMediaLibrary';
import { useCanvasNodeCommands } from './hooks/useCanvasNodeCommands';
import { useCanvasPointerPan } from './hooks/useCanvasPointerPan';
import { useCanvasPresentation } from './hooks/useCanvasPresentation';
import { useCanvasShortcuts } from './hooks/useCanvasShortcuts';
import { useCanvasTemplates } from './hooks/useCanvasTemplates';
import { createImageNodeFromAsset, createMediaAsset } from './utils/mediaAssetUtils';
import type { FlowCanvasProps, ViewportHandlers, ViewportShellHandlers } from './types';

export default function FlowCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  setNodes,
  setEdges,
  onUpdateMainDocument,
  onExportState,
  onImportState,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  saveStatus,
  lastSavedAt,
  saveError,
  pendingExtractedSlice,
  onExtractedSlicePlaced,
  shortcuts,
  onOpenShortcutSettings,
}: FlowCanvasProps) {
  const { screenToFlowPosition, fitView, zoomIn, zoomOut } = useReactFlow();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showHints, setShowHints] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [isTemplatePanelOpen, setIsTemplatePanelOpen] = useState(false);

  const pointerPan = useCanvasPointerPan();
  const edgeCommands = useCanvasEdgeCommands({ setEdges });
  const presentation = useCanvasPresentation(nodes, edges);
  const contextMenu = useCanvasContextMenu({
    screenToFlowPosition,
    setEditingId,
    setSelectedEdge: edgeCommands.setSelectedEdge,
    resetPointerPan: pointerPan.resetPointerPan,
  });

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

      const flowPosition = screenToFlowPosition({ x: clientX, y: clientY });
      return {
        x: flowPosition.x - xOffset + (Math.random() - 0.5) * 40,
        y: flowPosition.y - yOffset + (Math.random() - 0.5) * 40,
      };
    } catch (error) {
      console.warn('screenToFlowPosition error, using fallback coordinates', error);
      return {
        x: 100 + Math.random() * 150,
        y: 100 + Math.random() * 150,
      };
    }
  }, [screenToFlowPosition]);

  const closeTransientUi = useCallback(() => {
    contextMenu.closeContextMenu();
  }, [contextMenu]);

  const nodeCommands = useCanvasNodeCommands({
    selectedNodes: presentation.selectedNodes,
    setNodes,
    setEdges,
    getCenteredNodePosition,
    pendingExtractedSlice,
    onExtractedSlicePlaced,
    onAfterAddNode: () => setIsDrawerOpen(false),
    onAfterSelectionMutation: closeTransientUi,
  });

  const mediaLibrary = useCanvasMediaLibrary({
    setNodes,
    getCenteredNodePosition,
  });

  const assembly = useCanvasAssembly({
    nodes,
    edges,
    onUpdateMainDocument,
    onAfterAssemble: () => setIsDrawerOpen(false),
  });

  const clipboard = useCanvasClipboard({
    edges,
    selectedNodes: presentation.selectedNodes,
    contextMenu: contextMenu.contextMenu,
    setNodes,
    setEdges,
    setSelectedEdge: edgeCommands.setSelectedEdge,
    getCenteredNodePosition,
    onAfterAction: closeTransientUi,
  });

  const templates = useCanvasTemplates({
    edges,
    selectedNodes: presentation.selectedNodes,
    setNodes,
    setEdges,
    getCenteredNodePosition,
  });

  const addImageFilesToCanvas = useCallback((files: File[], clientX: number, clientY: number) => {
    const imageFiles = files.filter((file) => file.type.startsWith('image/'));
    if (imageFiles.length === 0) return;

    imageFiles.forEach((file, index) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const asset = createMediaAsset(file.name, String(reader.result || ''));
        const basePosition = screenToFlowPosition({
          x: clientX + index * 24,
          y: clientY + index * 24,
        });
        const newNode = createImageNodeFromAsset(asset, basePosition);
        setNodes((currentNodes) => [...currentNodes, newNode]);
      };
      reader.readAsDataURL(file);
    });
  }, [screenToFlowPosition, setNodes]);

  useCanvasShortcuts({
    shortcuts,
    setNodes,
    setEdges,
    setSelectedEdge: edgeCommands.setSelectedEdge,
    selectedEdge: edgeCommands.selectedEdge,
    selectedNodeCount: presentation.selectedNodes.length,
    onOpenShortcutSettings,
    onToggleMenu: () => {
      setIsMenuOpen((open) => !open);
      setIsDrawerOpen(false);
      mediaLibrary.setOpen(false);
      setIsTemplatePanelOpen(false);
    },
    onUndo,
    onRedo,
    onAddText: () => nodeCommands.addNode('text'),
    onAddImage: () => nodeCommands.addNode('image'),
    onAddIdea: () => nodeCommands.addNode('idea'),
    onAddTable: () => nodeCommands.addNode('table'),
    onAddTimeline: () => nodeCommands.addNode('timeline'),
    onToggleMediaLibrary: () => {
      mediaLibrary.setOpen((open) => !open);
      setIsDrawerOpen(false);
      setIsMenuOpen(false);
      setIsTemplatePanelOpen(false);
    },
    onToggleMoreTools: () => {
      setIsDrawerOpen((open) => {
        const nextOpen = !open;
        if (nextOpen) setIsTemplatePanelOpen(false);
        return nextOpen;
      });
      mediaLibrary.setOpen(false);
      setIsMenuOpen(false);
    },
    onCopySelection: clipboard.copySelectedNodes,
    onPasteSelection: () => clipboard.pasteNodes(),
    onDeleteSelection: nodeCommands.deleteSelectedNodes,
    onFitView: () => fitView({ padding: 0.18, duration: 220 }),
    onZoomIn: () => zoomIn({ duration: 160 }),
    onZoomOut: () => zoomOut({ duration: 160 }),
    onAutoLayout: nodeCommands.autoLayout,
    onOpenClearConfirm: () => setShowClearConfirmModal(true),
    onDuplicateSelection: clipboard.duplicateSelectedNodes,
    onAlignLeft: () => nodeCommands.alignSelectedNodes('left'),
    onAlignTop: () => nodeCommands.alignSelectedNodes('top'),
    onDistributeHorizontal: () => nodeCommands.distributeSelectedNodes('horizontal'),
    onDistributeVertical: () => nodeCommands.distributeSelectedNodes('vertical'),
    onDeleteSelectedEdge: edgeCommands.deleteSelectedEdge,
    onCloseTransientUi: closeTransientUi,
  });

  const nodeActionContextValue = useMemo(() => ({
    onDeleteNode: nodeCommands.deleteNode,
    onUpdateContent: nodeCommands.updateContent,
    onAddCustomHandle: nodeCommands.addCustomHandle,
    onDeleteCustomHandle: nodeCommands.deleteCustomHandle,
    editingId,
    setEditingId,
    shortcuts,
  }), [
    editingId,
    nodeCommands.addCustomHandle,
    nodeCommands.deleteCustomHandle,
    nodeCommands.deleteNode,
    nodeCommands.updateContent,
    shortcuts,
  ]);

  const viewportHandlers: ViewportHandlers = {
    onConnect: edgeCommands.onConnect,
    onNodeDragStop: nodeCommands.onNodeDragStop,
    onNodeClick: () => edgeCommands.setSelectedEdge(null),
    onEdgeClick: (_event, edge) => {
      edgeCommands.setSelectedEdge(edges.find((candidate) => candidate.id === edge.id) || edge);
      setNodes((currentNodes) => currentNodes.map((node) => ({ ...node, selected: false })));
    },
    onPaneClick: () => {
      setEditingId(null);
      edgeCommands.setSelectedEdge(null);
      contextMenu.closeContextMenu();
    },
    onPaneContextMenu: (event) => {
      event.preventDefault();
      if (pointerPan.rightPointerRef.current.moved) {
        pointerPan.resetPointerPan();
        contextMenu.closeContextMenu();
        return;
      }
      contextMenu.openCanvasContextMenu(event.clientX, event.clientY);
    },
    onNodeContextMenu: (event, node) => {
      event.preventDefault();
      event.stopPropagation();
      if (pointerPan.rightPointerRef.current.moved) {
        pointerPan.resetPointerPan();
        contextMenu.closeContextMenu();
        return;
      }

      setEditingId(null);
      edgeCommands.setSelectedEdge(null);

      const isAlreadySelected = presentation.selectedNodes.some((selectedNode) => selectedNode.id === node.id);
      if (!isAlreadySelected) {
        setNodes((currentNodes) =>
          currentNodes.map((candidate) => ({ ...candidate, selected: candidate.id === node.id })),
        );
      }

      const flowPosition = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      contextMenu.setContextMenu({
        x: event.clientX,
        y: event.clientY,
        flowX: flowPosition.x,
        flowY: flowPosition.y,
      });
    },
    onEdgeContextMenu: (event) => {
      event.preventDefault();
      setEditingId(null);
    },
    onPointerDown: (event) => {
      if (event.button === 1 || event.button === 2) {
        pointerPan.beginPointerPan(event.clientX, event.clientY);
      }
    },
    onPointerMove: (event) => {
      pointerPan.updatePointerPan(event.clientX, event.clientY);
    },
    onPointerUp: pointerPan.endPointerPan,
    onPointerLeave: pointerPan.endPointerPan,
    onPointerCancel: pointerPan.resetPointerPan,
    onDragOver: (event) => {
      const hasImage = Array.from(event.dataTransfer.items || []).some((item) => item.kind === 'file' && item.type.startsWith('image/'));
      if (!hasImage) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
    },
    onDrop: (event) => {
      const files = Array.from(event.dataTransfer.files || []).filter((file) => file.type.startsWith('image/'));
      if (files.length === 0) return;
      event.preventDefault();
      event.stopPropagation();
      addImageFilesToCanvas(files, event.clientX, event.clientY);
    },
  };

  const viewportShellHandlers: ViewportShellHandlers = {
    onPointerDownCapture: (event) => {
      if (event.button === 1 || event.button === 2) {
        pointerPan.beginPointerPan(event.clientX, event.clientY);
      }
    },
    onPointerMoveCapture: (event) => {
      pointerPan.updatePointerPan(event.clientX, event.clientY);
    },
    onPointerUpCapture: pointerPan.endPointerPan,
    onPointerLeave: pointerPan.endPointerPan,
    onPointerCancelCapture: pointerPan.resetPointerPan,
    onContextMenu: (event) => {
      const target = event.target as Element;
      if (!target.closest('.react-flow')) return;

      event.preventDefault();
      event.stopPropagation();

      const wasRightDrag = pointerPan.rightPointerRef.current.moved;
      pointerPan.resetPointerPan();

      if (wasRightDrag) {
        contextMenu.closeContextMenu();
        return;
      }

      contextMenu.openCanvasContextMenu(event.clientX, event.clientY);
    },
  };

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-neutral-50">
      <div
        className="relative h-full w-full flex-1"
        id="reactflow-container"
        onPointerDownCapture={viewportShellHandlers.onPointerDownCapture}
        onPointerMoveCapture={viewportShellHandlers.onPointerMoveCapture}
        onPointerUpCapture={viewportShellHandlers.onPointerUpCapture}
        onPointerLeave={viewportShellHandlers.onPointerLeave}
        onPointerCancelCapture={viewportShellHandlers.onPointerCancelCapture}
        onContextMenu={viewportShellHandlers.onContextMenu}
      >
        <NodeActionContext.Provider value={nodeActionContextValue}>
          <CanvasViewport
            nodes={presentation.displayNodes}
            edges={presentation.displayEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={CANVAS_NODE_TYPES}
            viewportHandlers={viewportHandlers}
            isPanningByPointer={pointerPan.isPanningByPointer}
          />
        </NodeActionContext.Provider>

        <CanvasOverlays
          header={{
            onExportState,
            onImportState,
            canUndo,
            canRedo,
            onUndo,
            onRedo,
            menuOpen: isMenuOpen,
            onMenuOpenChange: (open) => {
              setIsMenuOpen(open);
              if (open) {
                setIsDrawerOpen(false);
                mediaLibrary.setOpen(false);
                setIsTemplatePanelOpen(false);
              }
            },
            onAutoLayout: nodeCommands.autoLayout,
            onAssembleDocument: assembly.assembleDocument,
            onRequestClearCanvas: () => setShowClearConfirmModal(true),
            onOpenShortcutSettings,
          }}
          hints={{
            show: showHints,
            onClose: () => setShowHints(false),
          }}
          properties={{
            selectedNodes: presentation.selectedNodesForProperties,
            selectedEdge: presentation.selectedNodes.length > 0 ? null : edgeCommands.selectedEdge,
            onUpdateNodes: nodeCommands.updateNodesFromPanel,
            onResizeNodes: nodeCommands.resizeNodesFromPanel,
            onUpdateEdge: edgeCommands.updateEdgeFromPanel,
            onSaveSelectionAsTemplate: templates.saveSelectionAsTemplate,
          }}
          contextMenu={{
            state: contextMenu.contextMenu,
            selectedCount: presentation.selectedNodes.length,
            canPaste: !!clipboard.clipboard,
            onCopy: clipboard.copySelectedNodes,
            onPaste: () => clipboard.pasteNodes(),
            onDelete: nodeCommands.deleteSelectedNodes,
            onAlignLeft: () => nodeCommands.alignSelectedNodes('left'),
            onAlignTop: () => nodeCommands.alignSelectedNodes('top'),
            onDistributeHorizontal: () => nodeCommands.distributeSelectedNodes('horizontal'),
            onDistributeVertical: () => nodeCommands.distributeSelectedNodes('vertical'),
            onClose: contextMenu.closeContextMenu,
          }}
          toolbar={{
            isDrawerOpen,
            mediaAssetCount: mediaLibrary.assets.length,
            saveStatus,
            lastSavedAt,
            saveError,
            shortcuts,
            mediaLibraryOpen: mediaLibrary.isOpen,
            onToggleMediaLibrary: () => {
              const nextState = !mediaLibrary.isOpen;
              mediaLibrary.setOpen(nextState);
              setIsDrawerOpen(false);
              setIsMenuOpen(false);
              setIsTemplatePanelOpen(false);
            },
            onToggleDrawer: () => {
              const nextState = !isDrawerOpen;
              setIsDrawerOpen(nextState);
              if (nextState) {
                setIsMenuOpen(false);
                mediaLibrary.setOpen(false);
                setIsTemplatePanelOpen(false);
              }
            },
            onOpenTemplates: () => {
              setIsTemplatePanelOpen(true);
              setIsDrawerOpen(false);
              setIsMenuOpen(false);
              mediaLibrary.setOpen(false);
              edgeCommands.setSelectedEdge(null);
            },
            onAddNode: nodeCommands.addNode,
          }}
          mediaLibrary={mediaLibrary}
          templates={{
            isOpen: isTemplatePanelOpen,
            setOpen: setIsTemplatePanelOpen,
            templates: templates.templates,
            canSaveSelection: templates.canSaveSelection,
            templateCountLabel: templates.templateCountLabel,
            saveSelectionAsTemplate: templates.saveSelectionAsTemplate,
            insertTemplate: templates.insertTemplate,
            renameTemplate: templates.renameTemplate,
            deleteTemplate: templates.deleteTemplate,
          }}
          assembly={assembly}
          clearCanvas={{
            open: showClearConfirmModal,
            onCancel: () => setShowClearConfirmModal(false),
            onConfirm: () => {
              setNodes([]);
              setEdges([]);
              setShowClearConfirmModal(false);
            },
          }}
        />
      </div>
    </div>
  );
}
