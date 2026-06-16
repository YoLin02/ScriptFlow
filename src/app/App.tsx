/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNodesState, useEdgesState, Edge, ReactFlowProvider } from '@xyflow/react';
import { Layout, FileText, ChevronLeft, ChevronRight } from 'lucide-react';

import FlowCanvas from '../features/canvas';
import TiptapEditor from '../features/script-editor';
import { DEFAULT_SHORTCUTS, SHORTCUT_STORAGE_KEY, ShortcutMap, ShortcutSettingsPanel } from '../features/shortcuts';
import { AutoSaveStatus, WorkspaceSaveState, WorkspaceNode, NodeType } from '../types';
import { quantumStoryPreset, brainstormPreset, blankPreset } from '../presets';
import { dbGet, dbSet, dbRemove } from '../shared/storage/db';
import { useFeedback } from '../shared/feedback/FeedbackProvider';

const STORAGE_KEY = 'visual_text_flow_state';
const MAX_HISTORY_ENTRIES = 50;

interface HistoryAvailability {
  canUndo: boolean;
  canRedo: boolean;
}

interface PendingExtractedSlice {
  id: string;
  text: string;
  title?: string;
}

export default function App() {
  const { confirm: askConfirm } = useFeedback();
  const [mainDocHtml, setMainDocHtml] = useState<string>('');
  const [nodes, setNodes, onNodesChange] = useNodesState<WorkspaceNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  
  // Responsive mode select: 'split' | 'editor' | 'canvas' 
  const [activeTab, setActiveTab] = useState<'editor' | 'canvas' | 'split'>('split');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isEditorOutlineOpen, setIsEditorOutlineOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<AutoSaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [historyAvailability, setHistoryAvailability] = useState<HistoryAvailability>({ canUndo: false, canRedo: false });
  const [pendingExtractedSlice, setPendingExtractedSlice] = useState<PendingExtractedSlice | null>(null);
  const [shortcuts, setShortcuts] = useState<ShortcutMap>(() => {
    try {
      const saved = localStorage.getItem(SHORTCUT_STORAGE_KEY);
      return saved ? { ...DEFAULT_SHORTCUTS, ...JSON.parse(saved) } : DEFAULT_SHORTCUTS;
    } catch (error) {
      console.warn('Failed to load shortcuts', error);
      return DEFAULT_SHORTCUTS;
    }
  });
  const [isShortcutPanelOpen, setIsShortcutPanelOpen] = useState(false);

  const undoStackRef = useRef<WorkspaceSaveState[]>([]);
  const redoStackRef = useRef<WorkspaceSaveState[]>([]);
  const lastHistorySignatureRef = useRef('');
  const didSeedHistoryRef = useRef(false);
  const isRestoringHistoryRef = useRef(false);

  const createWorkspaceSnapshot = useCallback((): WorkspaceSaveState => {
    const serializedNodes = nodes.filter(n => n && n.data).map((n) => ({
      id: n.id,
      type: n.type,
      position: n.position,
      width: n.width,
      height: n.height,
      data: {
        id: n.data.id || n.id,
        type: (n.data.type || n.type || 'text') as NodeType,
        title: n.data.title,
        content: n.data.content,
        tags: n.data.tags,
        status: n.data.status,
        color: n.data.color,
        width: n.data.width,
        height: n.data.height,
        imageUrl: n.data.imageUrl,
        imageCaption: n.data.imageCaption,
        imageDisplayMode: n.data.type === 'image' ? n.data.imageDisplayMode : undefined,
        highlighted: n.data.type === 'idea' ? n.data.highlighted : undefined,
        tableData: n.data.type === 'table' ? n.data.tableData : undefined,
        tableAlign: n.data.type === 'table' ? n.data.tableAlign : undefined,
        tableCellAlignments: n.data.type === 'table' ? n.data.tableCellAlignments : undefined,
        activeTableCell: n.data.type === 'table' ? n.data.activeTableCell : undefined,
        timelineData: n.data.type === 'timeline' ? n.data.timelineData : undefined,
        createdAt: n.data.createdAt || Date.now(),
      },
    })) as WorkspaceNode[];

    return {
      mainDocumentHtml: mainDocHtml,
      nodes: serializedNodes,
      edges: edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
        label: e.label,
        type: e.type,
        animated: e.animated,
        style: e.style,
        markerEnd: e.markerEnd,
      })),
    };
  }, [mainDocHtml, nodes, edges]);

  const cloneWorkspaceSnapshot = useCallback((snapshot: WorkspaceSaveState): WorkspaceSaveState => {
    return JSON.parse(JSON.stringify(snapshot));
  }, []);

  const updateHistoryAvailability = useCallback(() => {
    setHistoryAvailability({
      canUndo: undoStackRef.current.length > 0,
      canRedo: redoStackRef.current.length > 0,
    });
  }, []);

  const restoreWorkspaceSnapshot = useCallback((snapshot: WorkspaceSaveState) => {
    isRestoringHistoryRef.current = true;
    setMainDocHtml(snapshot.mainDocumentHtml || '');
    setNodes((snapshot.nodes || []) as WorkspaceNode[]);
    setEdges((snapshot.edges || []) as Edge[]);
  }, [setNodes, setEdges]);

  // Initialize and load saved state or defaults
  useEffect(() => {
    async function initWorkspace() {
      try {
        const parsed = await dbGet<WorkspaceSaveState>(STORAGE_KEY);
        if (parsed) {
          setMainDocHtml(parsed.mainDocumentHtml || '');
          setNodes((parsed.nodes as WorkspaceNode[]) || []);
          setEdges((parsed.edges as Edge[]) || []);
          setIsLoaded(true);
          return;
        }
      } catch (e) {
        console.error('Failed to load storage state', e);
      }
      // Load default
      setMainDocHtml(quantumStoryPreset.mainDocumentHtml);
      setNodes(quantumStoryPreset.nodes as WorkspaceNode[]);
      setEdges(quantumStoryPreset.edges as Edge[]);
      setIsLoaded(true);
    }
    initWorkspace();
  }, [setNodes, setEdges]);

  useEffect(() => {
    localStorage.setItem(SHORTCUT_STORAGE_KEY, JSON.stringify(shortcuts));
  }, [shortcuts]);

  // Local Database Save Sync Effect with Debounce to prevent lag during dragging or typing
  useEffect(() => {
    if (!isLoaded) return;
    if (mainDocHtml === '' && nodes.length === 0 && edges.length === 0) return;

    setSaveStatus('pending');
    setSaveError(null);

    const timeoutId = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        await dbSet(STORAGE_KEY, createWorkspaceSnapshot());
        setLastSavedAt(Date.now());
        setSaveStatus('saved');
      } catch (error) {
        setSaveError(error instanceof Error ? error.message : '自动保存失败');
        setSaveStatus('error');
      }
    }, 800); // 800ms debounce ensures zero performance footprint during continuous drag/typing

    return () => clearTimeout(timeoutId);
  }, [mainDocHtml, nodes, edges, isLoaded, createWorkspaceSnapshot]);

  useEffect(() => {
    if (!isLoaded) return;
    if (mainDocHtml === '' && nodes.length === 0 && edges.length === 0) return;

    const currentSnapshot = createWorkspaceSnapshot();
    const currentSignature = JSON.stringify(currentSnapshot);

    if (!didSeedHistoryRef.current) {
      didSeedHistoryRef.current = true;
      lastHistorySignatureRef.current = currentSignature;
      updateHistoryAvailability();
      return;
    }

    if (isRestoringHistoryRef.current) {
      isRestoringHistoryRef.current = false;
      lastHistorySignatureRef.current = currentSignature;
      updateHistoryAvailability();
      return;
    }

    const timeoutId = setTimeout(() => {
      const latestSnapshot = createWorkspaceSnapshot();
      const latestSignature = JSON.stringify(latestSnapshot);
      if (latestSignature === lastHistorySignatureRef.current) return;

      if (lastHistorySignatureRef.current) {
        const previousSnapshot = JSON.parse(lastHistorySignatureRef.current) as WorkspaceSaveState;
        undoStackRef.current = [...undoStackRef.current, previousSnapshot].slice(-MAX_HISTORY_ENTRIES);
        redoStackRef.current = [];
      }

      lastHistorySignatureRef.current = latestSignature;
      updateHistoryAvailability();
    }, 600);

    return () => clearTimeout(timeoutId);
  }, [mainDocHtml, nodes, edges, isLoaded, createWorkspaceSnapshot, updateHistoryAvailability]);

  const handleUndoWorkspace = useCallback(() => {
    const previousSnapshot = undoStackRef.current.pop();
    if (!previousSnapshot) return;

    const currentSnapshot = cloneWorkspaceSnapshot(createWorkspaceSnapshot());
    redoStackRef.current = [...redoStackRef.current, currentSnapshot].slice(-MAX_HISTORY_ENTRIES);
    lastHistorySignatureRef.current = JSON.stringify(previousSnapshot);
    restoreWorkspaceSnapshot(cloneWorkspaceSnapshot(previousSnapshot));
    updateHistoryAvailability();
  }, [cloneWorkspaceSnapshot, createWorkspaceSnapshot, restoreWorkspaceSnapshot, updateHistoryAvailability]);

  const handleRedoWorkspace = useCallback(() => {
    const nextSnapshot = redoStackRef.current.pop();
    if (!nextSnapshot) return;

    const currentSnapshot = cloneWorkspaceSnapshot(createWorkspaceSnapshot());
    undoStackRef.current = [...undoStackRef.current, currentSnapshot].slice(-MAX_HISTORY_ENTRIES);
    lastHistorySignatureRef.current = JSON.stringify(nextSnapshot);
    restoreWorkspaceSnapshot(cloneWorkspaceSnapshot(nextSnapshot));
    updateHistoryAvailability();
  }, [cloneWorkspaceSnapshot, createWorkspaceSnapshot, restoreWorkspaceSnapshot, updateHistoryAvailability]);

  // Handle Preset Load
  const handleLoadPreset = useCallback(async (presetName: string) => {
    let targetPreset = quantumStoryPreset;
    if (presetName === 'brainstorm') {
      targetPreset = brainstormPreset;
    } else if (presetName === 'blank') {
      targetPreset = blankPreset;
    }

    const confirmed = await askConfirm({
      title: '加载预设模板',
      message: '加载该预设模板将覆盖当前工作区内容，确定继续吗？',
      confirmText: '加载预设',
      cancelText: '取消',
      destructive: true,
    });

    if (confirmed) {
      setMainDocHtml(targetPreset.mainDocumentHtml);
      setNodes(targetPreset.nodes as WorkspaceNode[]);
      setEdges(targetPreset.edges as Edge[]);
    }
  }, [askConfirm, setNodes, setEdges]);

  // Reset entire Workspace
  const handleResetWorkspace = useCallback(async () => {
    const confirmed = await askConfirm({
      title: '清空工作区',
      message: '确定要清空整张文档及全部卡片内容吗？这个操作会移除当前本地保存的进度。',
      confirmText: '清空',
      cancelText: '取消',
      destructive: true,
    });

    if (confirmed) {
      setMainDocHtml('<h1>开始全新的书写...</h1><p>在此输入草稿，或从段落切片管理器点击 ➔ 将其转化为卡片节点。</p>');
      setNodes([]);
      setEdges([]);
      await dbRemove(STORAGE_KEY);
      setLastSavedAt(Date.now());
      setSaveStatus('saved');
    }
  }, [askConfirm, setNodes, setEdges]);

  // Export current State Obj as a backup JSON File
  const handleExportState = useCallback(() => {
    const backupObj = {
      mainDocumentHtml: mainDocHtml,
      nodes: createWorkspaceSnapshot().nodes,
      edges: createWorkspaceSnapshot().edges,
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupObj, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `visual-document-flow-backup-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }, [mainDocHtml, createWorkspaceSnapshot]);

  // Import State from user uploaded Backup JSON File
  const handleImportState = useCallback((state: WorkspaceSaveState) => {
    setMainDocHtml(state.mainDocumentHtml || '');
    setNodes((state.nodes || []) as WorkspaceNode[]);
    setEdges((state.edges || []) as Edge[]);
  }, [setNodes, setEdges]);

  // Custom text extraction into Canvas TextNode
  const handleExtractNode = useCallback((text: string, title?: string) => {
    setPendingExtractedSlice({
      id: `slice-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      text,
      title,
    });
    
    // Auto jump viewport to show the newly added card on mobile or small devices
    if (activeTab === 'editor') {
      setActiveTab('split');
    }
  }, [activeTab]);

  const handleUpdateMainDoc = useCallback((newHtml: string) => {
    setMainDocHtml(newHtml);
  }, []);

  const splitEditorWidth = isEditorOutlineOpen ? 'min(732px, 72vw)' : 'min(480px, 42vw)';

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-neutral-50 font-sans">
      {/* Main responsive Split view container */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Left Side: Long-Form Tiptap Editor Column */}
        <div 
          className={`h-full border-r border-neutral-200 transition-all duration-300 ease-in-out shrink-0 relative ${
            isSidebarCollapsed 
              ? 'w-0 border-r-0' 
              : activeTab === 'editor' 
                ? 'w-full' 
                : activeTab === 'canvas' 
                  ? 'hidden md:block md:w-0 md:border-r-0' 
                  : 'w-full md:w-[400px] lg:w-[480px]'
          }`}
          style={!isSidebarCollapsed && activeTab === 'split' ? { width: splitEditorWidth } : undefined}
        >
          {/* Inner content container to safely enforce overflow-hidden */}
          <div className="w-full h-full overflow-hidden absolute inset-0">
            <TiptapEditor 
              content={mainDocHtml} 
              onChange={handleUpdateMainDoc}
              onExtractNode={handleExtractNode}
              isCollapsed={isSidebarCollapsed}
              onOutlineOpenChange={setIsEditorOutlineOpen}
              shortcuts={shortcuts}
            />
          </div>
        </div>

        {/* Sidebar expand collapse trigger button - placed OUTSIDE the column to transition beautifully */}
        <div 
          className={`hidden md:flex cursor-pointer items-center absolute z-30 top-1/2 -translate-y-1/2 transition-all duration-300 ease-in-out ${
            isSidebarCollapsed 
              ? 'left-0' 
              : activeTab === 'editor'
                ? 'left-[100%] -translate-x-full'
                : activeTab === 'canvas'
                  ? 'left-0'
                  : ''
          }`}
          style={!isSidebarCollapsed && activeTab === 'split' ? { left: splitEditorWidth } : undefined}
        >
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="flex items-center justify-center w-5 h-10 bg-white hover:bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-200 shadow-md rounded-r-md transition-all cursor-pointer select-none -ml-px"
            title={isSidebarCollapsed ? "展开主编辑器" : "折叠主编辑器"}
          >
            {isSidebarCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Right Side: Interactive Flow whiteboard Canvas */}
        <div 
          className={`h-full flex-1 transition-all duration-300 overflow-hidden ${
            activeTab === 'editor' ? 'hidden md:block' : 'block'
          }`}
        >
          <ReactFlowProvider>
            <FlowCanvas
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              setNodes={setNodes}
              setEdges={setEdges}
              onUpdateMainDocument={handleUpdateMainDoc}
              onLoadPreset={handleLoadPreset}
              onExportState={handleExportState}
              onImportState={handleImportState}
              onResetWorkspace={handleResetWorkspace}
              canUndo={historyAvailability.canUndo}
              canRedo={historyAvailability.canRedo}
              onUndo={handleUndoWorkspace}
              onRedo={handleRedoWorkspace}
              saveStatus={saveStatus}
              lastSavedAt={lastSavedAt}
              saveError={saveError}
              pendingExtractedSlice={pendingExtractedSlice}
              onExtractedSlicePlaced={() => setPendingExtractedSlice(null)}
              shortcuts={shortcuts}
              onOpenShortcutSettings={() => setIsShortcutPanelOpen(true)}
            />
          </ReactFlowProvider>
        </div>
      </div>

      {/* Bottom responsive switch tab slider for tablet or smaller screens */}
      <div className="md:hidden bg-white border-t border-neutral-250 p-2 flex justify-center items-center z-40 shadow-lg">
        <div className="flex bg-neutral-100 p-1 rounded-lg border border-neutral-200 w-full max-w-sm">
          <button
            onClick={() => { setActiveTab('editor'); setIsSidebarCollapsed(false); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${activeTab === 'editor' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500'}`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>主编辑器</span>
          </button>
          <button
            onClick={() => { setActiveTab('split'); setIsSidebarCollapsed(false); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${activeTab === 'split' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500'}`}
          >
            <span>左右分栏</span>
          </button>
          <button
            onClick={() => { setActiveTab('canvas'); setIsSidebarCollapsed(false); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${activeTab === 'canvas' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500'}`}
          >
            <Layout className="w-3.5 h-3.5" />
            <span>创作画布</span>
          </button>
        </div>
      </div>

      <ShortcutSettingsPanel
        open={isShortcutPanelOpen}
        shortcuts={shortcuts}
        onChange={setShortcuts}
        onClose={() => setIsShortcutPanelOpen(false)}
      />
    </div>
  );
}
