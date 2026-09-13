import type { Node, Edge } from '@xyflow/svelte';
import type { MovieEvent, TimelineNode, Universe } from '../../types/timeline';

export interface ChronologicalLayoutOptions {
  startYear?: number;
  endYear?: number;
  yearScale?: number; // 1年あたりのピクセル幅
  nodeWidth?: number;
  nodeHeight?: number;
}

export interface LayoutResult {
  nodes: Node[];
  edges: Edge[];
  timelineBounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    startYear: number;
    endYear: number;
    yearScale: number;
    nullTimeX: number;
  };
}

export const DEFAULT_START_YEAR = 1940;
export const DEFAULT_END_YEAR = 2026;
export const DEFAULT_YEAR_SCALE = 65; // 1年 = 65px (10年 = 650px)
export const DEFAULT_NODE_WIDTH = 250;
export const DEFAULT_NODE_HEIGHT = 115;

/**
 * 年代から基準X座標を算出
 */
export function getYearX(
  year: number,
  startYear = DEFAULT_START_YEAR,
  yearScale = DEFAULT_YEAR_SCALE,
  endYear = DEFAULT_END_YEAR
): number {
  if (year >= 9000) {
    // 時間の外側 (Null-Time / TVA) はタイムラインの右端特別ゾーン
    return (endYear - startYear + 4) * yearScale;
  }
  return (year - startYear) * yearScale;
}

/**
 * 西暦の目盛りに忠実なタイムラインレイアウト
 */
export function getChronologicalLayout(
  nodes: Node[],
  edges: Edge[],
  options: ChronologicalLayoutOptions = {}
): LayoutResult {
  // 1. ノード群の西暦から開始年・終了年を自動検出
  const validYears = nodes
    .map((n) => {
      const d = n.data as { event?: MovieEvent; parentMovie?: TimelineNode };
      return d.event?.inUniverseYear ?? d.parentMovie?.releaseYear;
    })
    .filter((y): y is number => typeof y === 'number' && y < 9000);

  const autoStartYear = validYears.length > 0 ? Math.floor(Math.min(...validYears) / 10) * 10 : DEFAULT_START_YEAR;
  const autoEndYear = validYears.length > 0 ? Math.ceil(Math.max(...validYears) / 5) * 5 : DEFAULT_END_YEAR;

  const startYear = options.startYear ?? autoStartYear;
  const endYear = options.endYear ?? Math.max(autoEndYear, startYear + 20);
  const {
    yearScale = DEFAULT_YEAR_SCALE,
    nodeWidth = DEFAULT_NODE_WIDTH,
    nodeHeight = DEFAULT_NODE_HEIGHT
  } = options;

  const nullTimeX = (endYear - startYear + 4) * yearScale;

  // 1. ノードを「西暦年」ごとにグループ化
  const nodesByYear = new Map<number, Node[]>();

  nodes.forEach((node) => {
    const data = node.data as {
      event?: MovieEvent;
      parentMovie?: TimelineNode;
      universe?: Universe;
    };

    const year = data.event?.inUniverseYear ?? data.parentMovie?.releaseYear ?? 2012;
    if (!nodesByYear.has(year)) {
      nodesByYear.set(year, []);
    }
    nodesByYear.get(year)!.push(node);
  });

  // 2. 年ごとに重なりを解消しながら座標を決定
  const layoutedNodes: Node[] = [];

  nodesByYear.forEach((yearNodes, year) => {
    const baseX = getYearX(year, startYear, yearScale, endYear);

    // 同一年内のノードをユニバースやオーダーでソート
    yearNodes.sort((a, b) => {
      const dataA = a.data as { event?: MovieEvent; universe?: Universe };
      const dataB = b.data as { event?: MovieEvent; universe?: Universe };

      const orderA = dataA.event?.order ?? 1;
      const orderB = dataB.event?.order ?? 1;

      // TVA/分岐は上へ、異次元は下へ、正史は中央へ
      const priority = (uId?: string) => {
        if (uId === 'tva-outside-time' || uId?.includes('branch')) return -1;
        if (uId?.includes('raimi') || uId?.includes('webb') || uId === 'earth-96283' || uId === 'earth-120703') return 1;
        return 0;
      };

      const prioDiff = priority(dataA.universe?.id) - priority(dataB.universe?.id);
      if (prioDiff !== 0) return prioDiff;
      return orderA - orderB;
    });

    const count = yearNodes.length;

    yearNodes.forEach((node, index) => {
      const data = node.data as {
        event?: MovieEvent;
        parentMovie?: TimelineNode;
        universe?: Universe;
      };

      const uId = data.universe?.id ?? 'earth-616';
      const isBranchOrTimeTravel =
        uId === 'tva-outside-time' ||
        uId.includes('branch') ||
        data.event?.eventType === 'time_travel_heist' ||
        data.event?.eventType === 'timeline_branch';
      const isAlternateUniverse =
        uId === 'earth-96283' ||
        uId === 'earth-120703' ||
        uId.includes('raimi') ||
        uId.includes('webb');

      let targetY = 0;
      let xOffset = 0;

      if (count === 1) {
        // 単一ノードの場合
        if (isBranchOrTimeTravel) {
          targetY = -150;
        } else if (isAlternateUniverse) {
          targetY = 150;
        } else {
          // 正史は時間軸のすぐ上（見やすい位置）
          targetY = -75;
        }
      } else {
        // 複数ノードがある場合（2012年や2024年など）
        // 重なりを防ぐため上下に分散配置
        if (count === 2) {
          targetY = index === 0 ? -120 : 120;
          xOffset = index * 40;
        } else if (count === 3) {
          const ySlots = [-180, -60, 140];
          targetY = ySlots[index] ?? 0;
          xOffset = index * 35;
        } else {
          // 4つ以上（例: 2012年）
          // 上部分岐レーン (-310, -180), 正史レーン (-60), 別次元レーン (+150)
          const ySlots = [-310, -180, -60, 160];
          targetY = ySlots[index] ?? (index - count / 2) * 140;
          xOffset = index * 40;
        }
      }

      // X座標: 目盛り線からカードの左端が揃い、同一年内の複数カードは微小オフセットで流れる
      const finalX = baseX + xOffset;
      // Y座標: targetY はノードの中心基準。Svelte Flow は top-left なので - nodeHeight / 2
      const finalY = targetY - nodeHeight / 2;

      layoutedNodes.push({
        ...node,
        position: {
          x: finalX,
          y: finalY
        }
      });
    });
  });

  // バウンディングボックスの計算
  let minX = 0;
  let maxX = nullTimeX + 400;
  let minY = -400;
  let maxY = 400;

  layoutedNodes.forEach((n) => {
    if (n.position.x < minX) minX = n.position.x;
    if (n.position.x + nodeWidth > maxX) maxX = n.position.x + nodeWidth;
    if (n.position.y < minY) minY = n.position.y;
    if (n.position.y + nodeHeight > maxY) maxY = n.position.y + nodeHeight;
  });

  return {
    nodes: layoutedNodes,
    edges,
    timelineBounds: {
      minX,
      maxX,
      minY,
      maxY,
      startYear,
      endYear,
      yearScale,
      nullTimeX
    }
  };
}
