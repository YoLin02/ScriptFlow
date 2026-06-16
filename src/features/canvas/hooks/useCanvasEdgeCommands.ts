import { addEdge } from '@xyflow/react';
import { useCallback, useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { Connection, Edge } from '@xyflow/react';
import { DEFAULT_RELATION_TAGS, RELATION_TAGS_STORAGE_KEY } from '../constants';
import { createCanvasEdge, getEdgePresentation } from '../utils/createCanvasEdge';

interface UseCanvasEdgeCommandsOptions {
  setEdges: Dispatch<SetStateAction<Edge[]>>;
}

export function useCanvasEdgeCommands({ setEdges }: UseCanvasEdgeCommandsOptions) {
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [customEdgeRelation, setCustomEdgeRelation] = useState('');
  const [shortcutTags, setShortcutTags] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(RELATION_TAGS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_RELATION_TAGS;
    } catch (error) {
      console.error(error);
      return DEFAULT_RELATION_TAGS;
    }
  });

  useEffect(() => {
    localStorage.setItem(RELATION_TAGS_STORAGE_KEY, JSON.stringify(shortcutTags));
  }, [shortcutTags]);

  useEffect(() => {
    setCustomEdgeRelation(selectedEdge ? (selectedEdge.label as string) || '' : '');
  }, [selectedEdge]);

  const onConnect = useCallback((params: Connection) => {
    const newEdge = createCanvasEdge(params);
    setEdges((currentEdges) => addEdge(newEdge, currentEdges));
  }, [setEdges]);

  const updateEdgeRelationship = useCallback((typeLabel: string) => {
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

  const deleteSelectedEdge = useCallback(() => {
    if (!selectedEdge) return;
    setEdges((currentEdges) => currentEdges.filter((edge) => edge.id !== selectedEdge.id));
    setSelectedEdge(null);
  }, [selectedEdge, setEdges]);

  const updateEdgeFromPanel = useCallback((edgeId: string, patch: Partial<Edge>) => {
    setEdges((currentEdges) =>
      currentEdges.map((edge) => edge.id === edgeId ? { ...edge, ...patch } : edge),
    );
    setSelectedEdge((currentEdge) => currentEdge?.id === edgeId ? { ...currentEdge, ...patch } : currentEdge);
  }, [setEdges]);

  return {
    selectedEdge,
    setSelectedEdge,
    customEdgeRelation,
    shortcutTags,
    setShortcutTags,
    onConnect,
    updateEdgeRelationship,
    deleteSelectedEdge,
    updateEdgeFromPanel,
  };
}
