import { useCallback, useState } from 'react';
import type { Edge } from '@xyflow/react';
import type { WorkspaceNode } from '../../../types';
import { useFeedback } from '../../../shared/feedback/FeedbackProvider';
import { assembleDocumentFromGraph, assembledTextToHtml } from '../utils/presentationUtils';

interface UseCanvasAssemblyOptions {
  nodes: WorkspaceNode[];
  edges: Edge[];
  onUpdateMainDocument: (newHtml: string) => void;
  onAfterAssemble?: () => void;
}

export function useCanvasAssembly({
  nodes,
  edges,
  onUpdateMainDocument,
  onAfterAssemble,
}: UseCanvasAssemblyOptions) {
  const { toast } = useFeedback();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [assembledDocText, setAssembledDocText] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  const assembleDocument = useCallback(() => {
    if (nodes.length === 0) {
      toast('画布中没有节点，无法生成。');
      return;
    }

    if (!nodes.some((node) => node.type === 'text' || node.type === 'idea')) {
      toast('画布中没有文本或灵感卡片，请先添加内容。');
      return;
    }

    setAssembledDocText(assembleDocumentFromGraph(nodes, edges));
    setIsModalOpen(true);
    onAfterAssemble?.();
  }, [edges, nodes, onAfterAssemble, toast]);

  const applyToMainDocument = useCallback(() => {
    onUpdateMainDocument(assembledTextToHtml(assembledDocText));
    setIsModalOpen(false);
    toast('已反向还原到左侧文本编辑器。', 'success');
  }, [assembledDocText, onUpdateMainDocument, toast]);

  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(assembledDocText);
    setIsCopied(true);
    window.setTimeout(() => setIsCopied(false), 2000);
  }, [assembledDocText]);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  return {
    isModalOpen,
    assembledDocText,
    isCopied,
    assembleDocument,
    applyToMainDocument,
    copyToClipboard,
    closeModal,
  };
}
