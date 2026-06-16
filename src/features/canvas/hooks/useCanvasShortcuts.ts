import { useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { Edge } from '@xyflow/react';
import type { ShortcutMap } from '../../shortcuts';
import { isEditableShortcutTarget, isShortcutEvent } from '../../shortcuts';
import type { WorkspaceNode } from '../../../types';

interface UseCanvasShortcutsOptions {
  shortcuts: ShortcutMap;
  setNodes: Dispatch<SetStateAction<WorkspaceNode[]>>;
  setEdges: Dispatch<SetStateAction<Edge[]>>;
  setSelectedEdge: Dispatch<SetStateAction<Edge | null>>;
  selectedEdge: Edge | null;
  selectedNodeCount: number;
  onOpenShortcutSettings: () => void;
  onToggleMenu: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onAddText: () => void;
  onAddImage: () => void;
  onAddIdea: () => void;
  onAddTable: () => void;
  onAddTimeline: () => void;
  onToggleMediaLibrary: () => void;
  onToggleMoreTools: () => void;
  onCopySelection: () => void;
  onPasteSelection: () => void;
  onDeleteSelection: () => void;
  onFitView: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onAutoLayout: () => void;
  onOpenClearConfirm: () => void;
  onDuplicateSelection: () => void;
  onAlignLeft: () => void;
  onAlignTop: () => void;
  onDistributeHorizontal: () => void;
  onDistributeVertical: () => void;
  onDeleteSelectedEdge: () => void;
  onCloseTransientUi: () => void;
}

export function useCanvasShortcuts({
  shortcuts,
  setNodes,
  setEdges,
  setSelectedEdge,
  selectedEdge,
  selectedNodeCount,
  onOpenShortcutSettings,
  onToggleMenu,
  onUndo,
  onRedo,
  onAddText,
  onAddImage,
  onAddIdea,
  onAddTable,
  onAddTimeline,
  onToggleMediaLibrary,
  onToggleMoreTools,
  onCopySelection,
  onPasteSelection,
  onDeleteSelection,
  onFitView,
  onZoomIn,
  onZoomOut,
  onAutoLayout,
  onOpenClearConfirm,
  onDuplicateSelection,
  onAlignLeft,
  onAlignTop,
  onDistributeHorizontal,
  onDistributeVertical,
  onDeleteSelectedEdge,
  onCloseTransientUi,
}: UseCanvasShortcutsOptions) {
  useEffect(() => {
    const handleShortcutKeyDown = (event: KeyboardEvent) => {
      if (isEditableShortcutTarget(event.target)) return;

      const run = (binding: string, action: () => void) => {
        if (!isShortcutEvent(event, binding)) return false;
        event.preventDefault();
        event.stopPropagation();
        action();
        return true;
      };

      if (run(shortcuts['system.openShortcuts'], onOpenShortcutSettings)) return;
      if (run(shortcuts['system.openMenu'], onToggleMenu)) return;
      if (run(shortcuts['workspace.undo'], onUndo)) return;
      if (run(shortcuts['workspace.redo'], onRedo)) return;
      if (run(shortcuts['canvas.addText'], onAddText)) return;
      if (run(shortcuts['canvas.addImage'], onAddImage)) return;
      if (run(shortcuts['canvas.addIdea'], onAddIdea)) return;
      if (run(shortcuts['canvas.addTable'], onAddTable)) return;
      if (run(shortcuts['canvas.addTimeline'], onAddTimeline)) return;
      if (run(shortcuts['canvas.toggleMediaLibrary'], onToggleMediaLibrary)) return;
      if (run(shortcuts['canvas.toggleMoreTools'], onToggleMoreTools)) return;
      if (run(shortcuts['selection.copy'], onCopySelection)) return;
      if (run(shortcuts['selection.paste'], onPasteSelection)) return;
      if (run(shortcuts['selection.delete'], () => {
        if (selectedEdge && selectedNodeCount === 0) {
          onDeleteSelectedEdge();
          return;
        }
        onDeleteSelection();
      })) return;
      if (run(shortcuts['selection.selectAll'], () => {
        setNodes((currentNodes) => currentNodes.map((node) => ({ ...node, selected: true })));
        setSelectedEdge(null);
        onCloseTransientUi();
      })) return;
      if (run(shortcuts['selection.clear'], () => {
        setNodes((currentNodes) => currentNodes.map((node) => ({ ...node, selected: false })));
        setEdges((currentEdges) => currentEdges.map((edge) => ({ ...edge, selected: false })));
        setSelectedEdge(null);
        onCloseTransientUi();
      })) return;
      if (run(shortcuts['canvas.fitView'], onFitView)) return;
      if (run(shortcuts['canvas.zoomIn'], onZoomIn)) return;
      if (run(shortcuts['canvas.zoomOut'], onZoomOut)) return;
      if (run(shortcuts['canvas.autoLayout'], onAutoLayout)) return;
      if (run(shortcuts['canvas.clear'], onOpenClearConfirm)) return;
      if (run(shortcuts['batch.duplicate'], onDuplicateSelection)) return;
      if (run(shortcuts['batch.alignLeft'], onAlignLeft)) return;
      if (run(shortcuts['batch.alignTop'], onAlignTop)) return;
      if (run(shortcuts['batch.distributeHorizontal'], onDistributeHorizontal)) return;
      run(shortcuts['batch.distributeVertical'], onDistributeVertical);
    };

    window.addEventListener('keydown', handleShortcutKeyDown);
    return () => window.removeEventListener('keydown', handleShortcutKeyDown);
  }, [
    onAddIdea,
    onAddImage,
    onAddTable,
    onAddText,
    onAddTimeline,
    onAlignLeft,
    onAlignTop,
    onAutoLayout,
    onCloseTransientUi,
    onCopySelection,
    onDeleteSelectedEdge,
    onDeleteSelection,
    onDistributeHorizontal,
    onDistributeVertical,
    onDuplicateSelection,
    onFitView,
    onOpenClearConfirm,
    onOpenShortcutSettings,
    onPasteSelection,
    onRedo,
    onToggleMediaLibrary,
    onToggleMenu,
    onToggleMoreTools,
    onUndo,
    onZoomIn,
    onZoomOut,
    selectedEdge,
    selectedNodeCount,
    setEdges,
    setNodes,
    setSelectedEdge,
    shortcuts,
  ]);
}
