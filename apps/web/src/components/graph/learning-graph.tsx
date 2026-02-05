'use client';

import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ConceptNode } from './concept-node';
import type { ConceptGraphNode, ConceptGraphEdge } from '@codementor/shared';

interface LearningGraphProps {
  nodes: ConceptGraphNode[];
  edges: ConceptGraphEdge[];
}

const nodeTypes = {
  concept: ConceptNode,
};

const TIER_Y_POSITIONS = {
  1: 50,
  2: 250,
  3: 450,
} as const;

const CATEGORY_COLORS = {
  HTML: '#E34F26',
  CSS: '#1572B6',
  JavaScript: '#F7DF1E',
  'DOM & Events': '#9B59B6',
  'Async & APIs': '#3498DB',
  'Modern Tooling': '#2ECC71',
} as Record<string, string>;

export function LearningGraph({ nodes: graphNodes, edges: graphEdges }: LearningGraphProps) {
  // Group nodes by category for horizontal positioning
  const nodesByCategory = useMemo(() => {
    const grouped = new Map<string, ConceptGraphNode[]>();
    for (const node of graphNodes) {
      const existing = grouped.get(node.category) ?? [];
      existing.push(node);
      grouped.set(node.category, existing);
    }
    return grouped;
  }, [graphNodes]);

  // Calculate positions
  const initialNodes: Node[] = useMemo(() => {
    const categories = Array.from(nodesByCategory.keys());
    const CATEGORY_WIDTH = 200;
    const NODE_SPACING = 120;

    return graphNodes.map((node) => {
      const categoryIndex = categories.indexOf(node.category);
      const nodesInCategory = nodesByCategory.get(node.category) ?? [];
      const nodeIndexInCategory = nodesInCategory.findIndex((n) => n.id === node.id);

      // Position within tier and category
      const x = categoryIndex * CATEGORY_WIDTH + (nodeIndexInCategory % 2) * 100 + 50;
      const y = TIER_Y_POSITIONS[node.tier] + Math.floor(nodeIndexInCategory / 2) * NODE_SPACING;

      return {
        id: node.id,
        type: 'concept',
        position: { x, y },
        data: {
          ...node,
          categoryColor: CATEGORY_COLORS[node.category] ?? '#6B7280',
        },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      };
    });
  }, [graphNodes, nodesByCategory]);

  const initialEdges: Edge[] = useMemo(() => {
    return graphEdges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: 'smoothstep',
      animated: false,
      style: { stroke: '#94a3b8', strokeWidth: 1.5 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#94a3b8',
        width: 15,
        height: 15,
      },
    }));
  }, [graphEdges]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    console.log('Clicked node:', node.id);
  }, []);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={onNodeClick}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      minZoom={0.3}
      maxZoom={1.5}
      proOptions={{ hideAttribution: true }}
    >
      <Background color="#e2e8f0" gap={20} />
      <Controls />
      <MiniMap
        nodeColor={(node) => {
          const status = node.data?.status as string;
          if (status === 'mastered') return '#22C55E';
          if (status === 'in_progress') return '#3B82F6';
          return '#6B7280';
        }}
        maskColor="rgba(0, 0, 0, 0.1)"
      />
    </ReactFlow>
  );
}
