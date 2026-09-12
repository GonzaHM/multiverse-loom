/**
 * Multiverse Loom - Timeline & Multiverse Graph Schema
 * ユニバース、タイムラインノード、エッジ、およびグラフ構造の定義
 */

export type FranchiseType = 'marvel' | 'dc';
export type MediaType = 'movie' | 'series' | 'special';

/**
 * ノード間の接続関係タイプ
 * - 'direct_sequel': 同一ユニバース内の直接的な続編・後続作（例: アイアンマン -> アベンジャーズ）
 * - 'multiverse_branch': 時間軸の分岐・別ライン発生（例: エンドゲーム -> ロキTVA）
 * - 'crossover': 次元を超えた合流・交差（例: ライミ版・アメスパ版 -> ノー・ウェイ・ホーム）
 * - 'prerequisite': ユニバースを跨ぐ前提知識・推奨予習作品
 */
export type RelationType =
  | 'direct_sequel'
  | 'multiverse_branch'
  | 'crossover'
  | 'prerequisite';

export type LineStyle = 'solid' | 'dashed' | 'dotted';

export interface EdgeStyle {
  lineStyle?: LineStyle;
  color?: string;
  animated?: boolean;
  width?: number;
  opacity?: number;
}

export interface Universe {
  id: string;
  name: string;
  designation: string;
  color: string;
  secondaryColor?: string;
  franchise: FranchiseType;
  description: string;
}

export interface LocalizedTitle {
  ja: string;
  en: string;
}

export interface AffiliateLink {
  type: 'amazon_bluray' | 'amazon_prime' | 'disney_plus' | 'comic_book';
  label: string;
  url: string;
}

export interface TimelineNode {
  id: string;
  title: LocalizedTitle;
  releaseYear: number;
  releaseDate: string;
  type: MediaType;
  phase: number | string;
  chronologicalOrder: number;
  inUniverseTimeLabel?: string;
  universeId: string;
  posterUrl: string;
  summary: string;
  watchStatus: boolean;
  characters?: string[];
  tags?: string[];
  affiliateLinks?: AffiliateLink[];
}

export interface TimelineEdge {
  id: string;
  source: string;
  target: string;
  relationType: RelationType;
  label?: string;
  description?: string;
  style?: EdgeStyle;
}

export interface MultiverseTimelineData {
  schemaVersion: string;
  lastUpdated: string;
  universes: Universe[];
  nodes: TimelineNode[];
  edges: TimelineEdge[];
}

export interface UserWatchProgress {
  userId: string;
  updatedAt: string;
  watchedNodes: Record<string, boolean>;
  favoriteNodes?: string[];
}
