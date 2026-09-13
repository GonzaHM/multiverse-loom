/**
 * Multiverse Loom - Timeline & Multiverse Graph Schema
 * ユニバース、映画ノード、劇中出来事（Events）、エッジ、アイテムの定義
 */

export type FranchiseType = 'marvel' | 'dc' | 'star-wars' | string;
export type MediaType = 'movie' | 'series' | 'special' | 'animation';

/**
 * 出来事（イベント）のカテゴリ
 */
export type EventType =
  | 'canon_milestone'        // 正史の重要事件（例: 超人血清実験、NY決戦、トニースナップ）
  | 'time_travel_departure'  // 過去/未来への時間跳躍出発
  | 'time_travel_arrival'    // 過去/未来の時代への到着（例: 1970年キャンプ・レハイ）
  | 'nexus_branch_point'     // 時間軸の分岐点（例: 2012年ロキの逃亡）
  | 'multiverse_crossover'   // 次元境界の裂開・他バース合流（例: NWHでの召喚）
  | 'timeline_pruning'       // TVAによる時間軸剪定
  | 'stone_return'           // ストーン返還による分岐修正
  | 'character_retirement';  // 過去時代での引退・余生選択（例: スティーブとペギー）

/**
 * エッジの接続関係タイプ
 */
export type EventRelationType =
  | 'direct_sequel'          // 同一ユニバース内の自然な後続作/時系列進行
  | 'chronological'          // 作中時間軸に沿った因果関係
  | 'time_travel'            // 時間跳躍（量子世界やタイムマシンによる時代移動）
  | 'multiverse_branch'      // 時間軸の分岐・新バース発生
  | 'crossover'              // 次元交差・異世界合流
  | 'prerequisite';          // 履修推奨・前提知識

export type LineStyle = 'solid' | 'dashed' | 'dotted';

export interface EdgeStyle {
  lineStyle?: LineStyle;
  color?: string;
  animated?: boolean;
  width?: number;
  opacity?: number;
}

export interface LocalizedTitle {
  ja: string;
  en: string;
}

/**
 * 劇中の重要アイテム（インフィニティ・ストーン、兵器等）
 */
export interface Artifact {
  id: string;                // 例: 'tesseract-space-stone'
  name: LocalizedTitle;
  type: 'infinity_stone' | 'weapon' | 'mystical_relic' | 'technology';
  color: string;             // スペース・ストーン（シアン: #06b6d4）など
  description: string;
  aliases?: string[];
}

/**
 * 映画内の個別出来事（Event）
 */
export interface MovieEvent {
  id: string;                      // 例: 'evt-1970-camp-lehigh-heist'
  movieId: string;                 // 所属する映画ID
  universeId?: string;             // 発生したユニバース
  title: LocalizedTitle;
  inUniverseYear: number;          // 作中年代 (例: 1970, 2012, 2023)
  inUniverseDateLabel: string;     // 作中日付・時期 (例: "1970年4月7日")
  inUniverseTimestamp?: number;    // ソート用正規化数値 (例: 1970.27)
  location?: string;               // 発生場所 (例: "キャンプ・レハイ地下")
  summary: string;                 // 出来事の詳細説明
  order: number;                   // 映画内での出来事順 (1, 2, 3...)
  eventType: EventType;
  keyCharacters?: string[];        // 登場キャラクター
  keyArtifacts?: string[];         // 関わったアイテムID (例: ['tesseract-space-stone'])
  isBranchPoint?: boolean;         // 時間軸の分岐点フラグ
  iconicQuote?: {
    text: LocalizedTitle;
    speaker: string;
  };
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

export interface AffiliateLink {
  type: 'amazon_bluray' | 'amazon_prime' | 'disney_plus' | 'comic_book';
  label: string;
  url: string;
}

/**
 * 映画・シリーズ作品ノード
 */
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
  events?: MovieEvent[];           // 映画内の劇中出来事リスト
  characters?: string[];
  tags?: string[];
  affiliateLinks?: AffiliateLink[];
}

/**
 * タイムライン接続エッジ
 */
export interface TimelineEdge {
  id: string;
  source: string;                  // 接続元映画ID
  sourceHandle?: string;           // 接続元の具体的出来事Handle ID
  target: string;                  // 接続先映画ID
  targetHandle?: string;           // 接続先の具体的出来事Handle ID
  relationType: EventRelationType;
  label?: string;
  description?: string;
  associatedArtifactId?: string;   // 関連するアイテム（例: 'tesseract-space-stone'）
  style?: EdgeStyle;
}

export interface MultiverseTimelineData {
  schemaVersion: string;
  lastUpdated: string;
  universes: Universe[];
  artifacts?: Artifact[];
  nodes: TimelineNode[];
  edges: TimelineEdge[];
}

/**
 * フランチャイズごとのUIテーマ設定
 */
export interface FranchiseTheme {
  primaryColor: string;     // メインブランドカラー (例: Marvelの赤, DCのブルー, SWのゴールド)
  accentColor: string;      // アクセントカラー (例: シアン, エレクトリックブルー, ライトセーバーグリーン)
  bgGradient: string;       // ツールバーやバッジのグラデーション
  badgeBorder: string;      // バッジ枠線カラー
  badgeBg: string;          // バッジ背景カラー
}

/**
 * フランチャイズ全体のメタデータ定義
 */
export interface FranchiseMetadata {
  id: string;
  slug: string;
  title: LocalizedTitle;
  tagline: LocalizedTitle;
  icon: string;             // 絵文字またはアイコン記号
  theme: FranchiseTheme;
  timelineData: MultiverseTimelineData;
}

export interface UserWatchProgress {
  userId: string;
  updatedAt: string;
  watchedNodes: Record<string, boolean>;
  favoriteNodes?: string[];
}
