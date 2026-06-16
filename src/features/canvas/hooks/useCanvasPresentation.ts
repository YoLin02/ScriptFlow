import { useMemo } from 'react';
import type { Edge } from '@xyflow/react';
import type { WorkspaceNode } from '../../../types';
import { getActiveTickDetails, getConnectedNodeIds } from '../utils/presentationUtils';

export function useCanvasPresentation(nodes: WorkspaceNode[], edges: Edge[]) {
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

  return {
    activeTimelineNode,
    activeTickDetails,
    isFilterActive,
    connectedNodeIds,
    selectedNodes,
    selectedNodesForProperties,
    displayNodes,
    displayEdges,
  };
}
