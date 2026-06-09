/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { useNodesState, useEdgesState, Edge, ReactFlowProvider } from '@xyflow/react';
import { Layout, FileText, ChevronLeft, ChevronRight } from 'lucide-react';

import Header from './components/Header';
import TiptapEditor from './components/TiptapEditor';
import FlowCanvas from './components/FlowCanvas';
import { WorkspaceSaveState, WorkspaceNode, NodeType } from './types';
import { quantumStoryPreset, brainstormPreset, blankPreset } from './presets';
import { dbGet, dbSet, dbRemove } from './db';

const STORAGE_KEY = 'visual_text_flow_state';

export default function App() {
  const [mainDocHtml, setMainDocHtml] = useState<string>('');
  const [nodes, setNodes, onNodesChange] = useNodesState<WorkspaceNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  
  // Responsive mode select: 'split' | 'editor' | 'canvas' 
  const [activeTab, setActiveTab] = useState<'editor' | 'canvas' | 'split'>('split');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

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

  // Local Database Save Sync Effect with Debounce to prevent lag during dragging or typing
  useEffect(() => {
    if (!isLoaded) return;
    if (mainDocHtml === '' && nodes.length === 0 && edges.length === 0) return;

    const timeoutId = setTimeout(async () => {
      // Clean callback mappings off node models to avoid serializing functions
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
          imageUrl: n.data.imageUrl,
          imageCaption: n.data.imageCaption,
          createdAt: n.data.createdAt || Date.now(),
        },
      })) as WorkspaceNode[];

      const saveObj: WorkspaceSaveState = {
        mainDocumentHtml: mainDocHtml,
        nodes: serializedNodes,
        edges: edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          label: e.label,
          type: e.type,
          animated: e.animated,
          style: e.style,
        })),
      };

      await dbSet(STORAGE_KEY, saveObj);
    }, 800); // 800ms debounce ensures zero performance footprint during continuous drag/typing

    return () => clearTimeout(timeoutId);
  }, [mainDocHtml, nodes, edges, isLoaded]);

  // Handle Preset Load
  const handleLoadPreset = useCallback((presetName: string) => {
    let targetPreset = quantumStoryPreset;
    if (presetName === 'brainstorm') {
      targetPreset = brainstormPreset;
    } else if (presetName === 'blank') {
      targetPreset = blankPreset;
    }

    if (confirm(`加载该预设模板将覆盖您当前的全部写入数据，确定吗？`)) {
      setMainDocHtml(targetPreset.mainDocumentHtml);
      setNodes(targetPreset.nodes as WorkspaceNode[]);
      setEdges(targetPreset.edges as Edge[]);
    }
  }, [setNodes, setEdges]);

  // Reset entire Workspace
  const handleResetWorkspace = useCallback(async () => {
    if (confirm('确定要清空整张文档及全部卡片内容吗？所有的进度将不予保存。')) {
      setMainDocHtml('<h1>开始全新的书写...</h1><p>在此输入草稿，或从段落切片管理器点击 ➔ 将其转化为卡片节点。</p>');
      setNodes([]);
      setEdges([]);
      await dbRemove(STORAGE_KEY);
    }
  }, [setNodes, setEdges]);

  // Export current State Obj as a backup JSON File
  const handleExportState = useCallback(() => {
    const backupObj = {
      mainDocumentHtml: mainDocHtml,
      nodes: nodes,
      edges: edges,
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupObj, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `visual-document-flow-backup-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }, [mainDocHtml, nodes, edges]);

  // Import State from user uploaded Backup JSON File
  const handleImportState = useCallback((state: WorkspaceSaveState) => {
    setMainDocHtml(state.mainDocumentHtml || '');
    setNodes((state.nodes || []) as WorkspaceNode[]);
    setEdges((state.edges || []) as Edge[]);
  }, [setNodes, setEdges]);

  // Custom text extraction into Canvas TextNode
  const handleExtractNode = useCallback((text: string, title?: string) => {
    const id = `node-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    
    // Position staggered random coordinates to prevent exact stack overlapping
    const newNode: WorkspaceNode = {
      id,
      type: 'text',
      position: {
        x: 180 + Math.random() * 120,
        y: 150 + Math.random() * 120,
      },
      data: {
        id,
        type: 'text',
        title: title || '切片文本卡片',
        content: text,
        createdAt: Date.now(),
      },
    };

    setNodes((prev) => [...prev, newNode]);
    
    // Auto jump viewport to show the newly added card on mobile or small devices
    if (activeTab === 'editor') {
      setActiveTab('split');
    }
  }, [setNodes, activeTab]);

  const handleUpdateMainDoc = useCallback((newHtml: string) => {
    setMainDocHtml(newHtml);
  }, []);

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
        >
          {/* Inner content container to safely enforce overflow-hidden */}
          <div className="w-full h-full overflow-hidden absolute inset-0">
            <TiptapEditor 
              content={mainDocHtml} 
              onChange={handleUpdateMainDoc}
              onExtractNode={handleExtractNode}
            />
          </div>
        </div>

        {/* Sidebar expand collapse trigger button - placed OUTSIDE the column to transition beautifully */}
        <div 
          className={`hidden md:flex items-center absolute z-30 top-1/2 -translate-y-1/2 transition-all duration-300 ease-in-out ${
            isSidebarCollapsed 
              ? 'left-0' 
              : activeTab === 'editor'
                ? 'left-[100%] -translate-x-full'
                : activeTab === 'canvas'
                  ? 'left-0'
                  : 'left-[400px] lg:left-[480px]'
          }`}
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
    </div>
  );
}
