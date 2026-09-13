import dagre from '@dagrejs/dagre';
import type { Node, Edge } from '@xyflow/svelte';

export interface LayoutOptions {
  direction?: 'LR' | 'TB';
  expandedNodeIds?: Set<string>;
  collapsedWidth?: number;
  collapsedHeight?: number;
  expandedWidth?: number;
  expandedHeight?: number;
}

export function getLayoutedTimeline(
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions = {}
): { nodes: Node[]; edges: Edge[] } {
  const {
    direction = 'LR',
    expandedNodeIds = new Set<string>(),
    collapsedWidth = 260,
    collapsedHeight = 115,
    expandedWidth = 520,
    expandedHeight = 235
  } = options;

  const dagreGraph = new dagre.graphlib.Graph({ multigraph: true });
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  dagreGraph.setGraph({
    rankdir: direction, // 'LR' for chronological timeline
    nodesep: 45,        // vertical separation between branches
    ranksep: 85,        // horizontal spacing between stages
    ranker: 'network-simplex'
  });

  // 1. 展開状態に応じた動的なノードサイズ登録
  nodes.forEach((node) => {
    const isExpanded = expandedNodeIds.has(node.id);
    const width = isExpanded ? expandedWidth : collapsedWidth;
    const height = isExpanded ? expandedHeight : collapsedHeight;
    dagreGraph.setNode(node.id, { width, height });
  });

  // 2. エッジの重複を排除してランク歪みを防止
  const registeredPairs = new Set<string>();
  edges.forEach((edge) => {
    const pairKey = `${edge.source}-->${edge.target}`;
    if (!registeredPairs.has(pairKey)) {
      dagreGraph.setEdge(edge.source, edge.target, {}, edge.id);
      registeredPairs.add(pairKey);
    }
  });

  dagre.layout(dagreGraph);

  // 3. Svelte Flow のトップレフト座標にマッピング
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const isExpanded = expandedNodeIds.has(node.id);
    const width = isExpanded ? expandedWidth : collapsedWidth;
    const height = isExpanded ? expandedHeight : collapsedHeight;

    return {
      ...node,
      position: {
        x: nodeWithPosition.x - width / 2,
        y: nodeWithPosition.y - height / 2
      }
    };
  });

  return { nodes: layoutedNodes, edges };
}
