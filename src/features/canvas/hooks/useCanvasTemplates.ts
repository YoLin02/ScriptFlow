import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { Edge } from '@xyflow/react';
import type { WorkspaceNode } from '../../../types';
import { useFeedback } from '../../../shared/feedback/FeedbackProvider';
import { loadCanvasTemplates, saveCanvasTemplates } from '../templates/templateStorage';
import type { CanvasRegionTemplate } from '../templates/types';

interface UseCanvasTemplatesOptions {
  edges: Edge[];
  selectedNodes: WorkspaceNode[];
  setNodes: Dispatch<SetStateAction<WorkspaceNode[]>>;
  setEdges: Dispatch<SetStateAction<Edge[]>>;
  getCenteredNodePosition: (xOffset?: number, yOffset?: number) => { x: number; y: number };
}

function cloneValue<T>(value: T): T {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value)) as T;
}

function getNodeWidth(node: WorkspaceNode) {
  return Number(node.data.width || node.width || 260);
}

function getNodeHeight(node: WorkspaceNode) {
  return Number(node.data.height || node.height || 140);
}

function createTemplateName(index: number) {
  return `节点模板 ${String(index).padStart(2, '0')}`;
}

function createBounds(nodes: WorkspaceNode[]) {
  const minX = Math.min(...nodes.map((node) => node.position.x));
  const minY = Math.min(...nodes.map((node) => node.position.y));
  const maxX = Math.max(...nodes.map((node) => node.position.x + getNodeWidth(node)));
  const maxY = Math.max(...nodes.map((node) => node.position.y + getNodeHeight(node)));

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

export function useCanvasTemplates({
  edges,
  selectedNodes,
  setNodes,
  setEdges,
  getCenteredNodePosition,
}: UseCanvasTemplatesOptions) {
  const { confirm: askConfirm, toast } = useFeedback();
  const [templates, setTemplates] = useState<CanvasRegionTemplate[]>(() => loadCanvasTemplates());

  useEffect(() => {
    saveCanvasTemplates(templates);
  }, [templates]);

  const canSaveSelection = selectedNodes.length > 0;

  const saveSelectionAsTemplate = useCallback(() => {
    if (selectedNodes.length === 0) {
      toast('请先框选需要保存为模板的节点。');
      return;
    }

    const selectedIds = new Set(selectedNodes.map((node) => node.id));
    const bounds = createBounds(selectedNodes);
    const stamp = Date.now();
    const templateNodes = selectedNodes.map((node) => ({
      ...cloneValue(node),
      selected: false,
      position: {
        x: node.position.x - bounds.x,
        y: node.position.y - bounds.y,
      },
    })) as WorkspaceNode[];
    const templateEdges = edges
      .filter((edge) => selectedIds.has(edge.source) && selectedIds.has(edge.target))
      .map((edge) => ({ ...cloneValue(edge), selected: false }));

    const nextTemplate: CanvasRegionTemplate = {
      id: `template-${stamp}-${Math.random().toString(36).slice(2, 6)}`,
      name: createTemplateName(templates.length + 1),
      createdAt: stamp,
      updatedAt: stamp,
      nodes: templateNodes,
      edges: templateEdges,
      bounds: {
        x: 0,
        y: 0,
        width: bounds.width,
        height: bounds.height,
      },
    };

    setTemplates((current) => [nextTemplate, ...current]);
    toast(`已保存模板：${nextTemplate.name}`, 'success');
  }, [edges, selectedNodes, templates.length, toast]);

  const insertTemplate = useCallback((templateId: string) => {
    const template = templates.find((item) => item.id === templateId);
    if (!template) return;

    const insertPosition = getCenteredNodePosition(template.bounds.width / 2, template.bounds.height / 2);
    const idMap = new Map<string, string>();
    const stamp = Date.now();

    const nextNodes = template.nodes.map((node, index) => {
      const nextId = `node-${stamp}-tpl-${index}-${Math.random().toString(36).slice(2, 5)}`;
      idMap.set(node.id, nextId);
      return {
        ...cloneValue(node),
        id: nextId,
        selected: true,
        position: {
          x: insertPosition.x + node.position.x,
          y: insertPosition.y + node.position.y,
        },
        data: {
          ...cloneValue(node.data),
          id: nextId,
          createdAt: stamp,
        },
      } as WorkspaceNode;
    });

    const nextEdges = template.edges.flatMap((edge, index) => {
      const source = idMap.get(edge.source);
      const target = idMap.get(edge.target);
      if (!source || !target) return [];
      return [{
        ...cloneValue(edge),
        id: `e-${stamp}-tpl-${index}-${Math.random().toString(36).slice(2, 5)}`,
        source,
        target,
        selected: false,
      }];
    });

    setNodes((currentNodes) => [
      ...currentNodes.map((node) => ({ ...node, selected: false })),
      ...nextNodes,
    ]);
    setEdges((currentEdges) => [
      ...currentEdges.map((edge) => ({ ...edge, selected: false })),
      ...nextEdges,
    ]);
    toast(`已插入模板：${template.name}`, 'success');
  }, [getCenteredNodePosition, setEdges, setNodes, templates, toast]);

  const renameTemplate = useCallback((templateId: string, name: string) => {
    const trimmedName = name.trim();
    setTemplates((current) =>
      current.map((template) =>
        template.id === templateId
          ? {
              ...template,
              name: trimmedName || template.name,
              updatedAt: Date.now(),
            }
          : template,
      ),
    );
  }, []);

  const deleteTemplate = useCallback(async (templateId: string) => {
    const template = templates.find((item) => item.id === templateId);
    if (!template) return;

    const confirmed = await askConfirm({
      title: '删除节点模板',
      message: `确定删除「${template.name}」吗？该操作不会影响画布中已插入的节点。`,
      confirmText: '删除',
      destructive: true,
    });
    if (!confirmed) return;

    setTemplates((current) => current.filter((item) => item.id !== templateId));
    toast('模板已删除。', 'success');
  }, [askConfirm, templates, toast]);

  const templateCountLabel = useMemo(() => `${templates.length} 个模板`, [templates.length]);

  return {
    templates,
    canSaveSelection,
    templateCountLabel,
    saveSelectionAsTemplate,
    insertTemplate,
    renameTemplate,
    deleteTemplate,
  };
}
