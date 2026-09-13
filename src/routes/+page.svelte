<script lang="ts">
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';
  import {
    SvelteFlow,
    Controls,
    Background,
    BackgroundVariant,
    MiniMap,
    type Node,
    type Edge,
    type NodeTypes
  } from '@xyflow/svelte';

  import { FRANCHISES, getFranchiseById, DEFAULT_FRANCHISE_ID } from '../data/franchises';
  import type { TimelineNode, TimelineEdge, Universe, FranchiseMetadata } from '../types/timeline';
  import MovieNode from '$lib/components/MovieNode.svelte';
  import NodeDetailModal from '$lib/components/NodeDetailModal.svelte';
  import TimelineToolbar from '$lib/components/TimelineToolbar.svelte';
  import { getLayoutedTimeline } from '$lib/layout/dagre-layout';
  import { exportTimelineAsPng } from '$lib/utils/export-image';

  // ノードコンポーネント定義
  const nodeTypes: NodeTypes = {
    movieNode: MovieNode
  };

  // 現在選択中のフランチャイズ
  let currentFranchiseId = $state<string>(DEFAULT_FRANCHISE_ID);
  const currentFranchise = $derived<FranchiseMetadata>(getFranchiseById(currentFranchiseId));

  // 現在のフランチャイズのタイムラインデータ
  const data = $derived(currentFranchise.timelineData);

  // 視聴状態マップ（フランチャイズごとにlocalStorageを分離）
  let watchedState = $state<Record<string, boolean>>({});

  // フィルター・選択状態
  let selectedUniverseId = $state<string | 'all'>('all');
  let selectedRelationFilter = $state<'all' | 'branches_only'>('all');
  let selectedNode = $state<TimelineNode | null>(null);

  // Svelte Flow 用ノード・エッジ
  let flowNodes = $state<Node[]>([]);
  let flowEdges = $state<Edge[]>([]);
  let isReady = $state(false);

  // 集計
  const totalCount = $derived(data.nodes.length);
  const watchedCount = $derived(
    Object.values(watchedState).filter(Boolean).length
  );

  // 選択中ノードのユニバース
  const selectedNodeUniverse = $derived(
    selectedNode ? data.universes.find((u) => u.id === selectedNode?.universeId) : undefined
  );

  // 視聴状態の読み込み（フランチャイズ個別）
  function loadWatchProgress(franchiseId: string) {
    if (!browser) return;
    try {
      const saved = localStorage.getItem(`multiverse_loom_watched_${franchiseId}`);
      if (saved) {
        watchedState = JSON.parse(saved);
      } else {
        // 後方互換性（旧キーからのマイグレーション）
        if (franchiseId === 'marvel') {
          const legacy = localStorage.getItem('multiverse_loom_watched');
          if (legacy) {
            watchedState = JSON.parse(legacy);
            localStorage.setItem('multiverse_loom_watched_marvel', legacy);
          } else {
            watchedState = {};
          }
        } else {
          watchedState = {};
        }
      }
    } catch (e) {
      console.error('LocalStorage read error:', e);
      watchedState = {};
    }
  }

  // 視聴状態の切り替え
  function toggleWatch(nodeId: string) {
    const next = !watchedState[nodeId];
    watchedState[nodeId] = next;

    if (browser) {
      try {
        localStorage.setItem(
          `multiverse_loom_watched_${currentFranchiseId}`,
          JSON.stringify(watchedState)
        );
      } catch (e) {
        console.error('LocalStorage write error:', e);
      }
    }

    // ノード内データのリアクティブ更新
    flowNodes = flowNodes.map((fn) => {
      if (fn.id === nodeId) {
        return {
          ...fn,
          data: {
            ...fn.data,
            isWatched: next
          }
        };
      }
      return fn;
    });
  }

  // グラフデータ再構築 & レイアウト計算
  function updateGraph() {
    // 1. ノードのフィルタリング & マッピング
    const filteredRawNodes = data.nodes.filter((n) => {
      if (selectedUniverseId === 'all') return true;
      return n.universeId === selectedUniverseId;
    });

    const activeNodeIds = new Set(filteredRawNodes.map((n) => n.id));

    const rawNodes: Node[] = filteredRawNodes.map((n) => {
      const u = data.universes.find((uni) => uni.id === n.universeId);
      return {
        id: n.id,
        type: 'movieNode',
        data: {
          node: n,
          universe: u,
          isWatched: !!watchedState[n.id],
          onToggleWatch: toggleWatch,
          onSelectNode: (targetNode: TimelineNode) => {
            selectedNode = targetNode;
          }
        },
        position: { x: 0, y: 0 }
      };
    });

    // 2. エッジのフィルタリング & マッピング
    const rawEdges: Edge[] = data.edges
      .filter((e) => {
        // 両端のノードがアクティブか
        if (!activeNodeIds.has(e.source) || !activeNodeIds.has(e.target)) return false;
        // エッジタイプフィルター
        if (selectedRelationFilter === 'branches_only') {
          return e.relationType === 'multiverse_branch' || e.relationType === 'crossover';
        }
        return true;
      })
      .map((e) => {
        const isBranch = e.relationType === 'multiverse_branch';
        const isCrossover = e.relationType === 'crossover';
        const isPrereq = e.relationType === 'prerequisite';

        // スタイル設定
        const strokeColor = e.style?.color ?? currentFranchise.theme.accentColor;
        const width = e.style?.width ?? (isBranch || isCrossover ? 2.5 : 2);
        const animated = e.style?.animated ?? (isBranch || isCrossover);
        const strokeDash = e.style?.lineStyle === 'dashed' || isBranch
          ? '5 5'
          : e.style?.lineStyle === 'dotted' || isPrereq
          ? '3 3'
          : 'none';

        return {
          id: e.id,
          source: e.source,
          target: e.target,
          type: 'smoothstep',
          animated,
          label: e.label,
          style: `stroke: ${strokeColor}; stroke-width: ${width}; opacity: 0.85; stroke-dasharray: ${strokeDash};`
        };
      });

    // 3. Dagreレイアウト計算
    const layout = getLayoutedTimeline(rawNodes, rawEdges, { direction: 'LR' });
    flowNodes = layout.nodes;
    flowEdges = layout.edges;
  }

  // シリーズ切り替え
  function handleSelectFranchise(id: string) {
    if (id === currentFranchiseId) return;
    currentFranchiseId = id;
    selectedUniverseId = 'all';
    selectedNode = null;

    loadWatchProgress(id);
    updateGraph();

    if (browser) {
      const url = new URL(window.location.href);
      url.searchParams.set('series', id);
      window.history.replaceState({}, '', url.toString());
    }
  }

  // フィルター変更ハンドラ
  function handleFilterUniverse(id: string | 'all') {
    selectedUniverseId = id;
    updateGraph();
  }

  function handleFilterRelation(filter: 'all' | 'branches_only') {
    selectedRelationFilter = filter;
    updateGraph();
  }

  // 画像エクスポート
  function handleExportImage() {
    const fileName = `multiverse-loom-${currentFranchise.slug}-progress.png`;
    exportTimelineAsPng('.svelte-flow__viewport', fileName);
  }

  onMount(() => {
    if (browser) {
      const params = new URLSearchParams(window.location.search);
      const seriesParam = params.get('series') ?? params.get('franchise');
      if (seriesParam && FRANCHISES.some((f) => f.id === seriesParam || f.slug === seriesParam)) {
        currentFranchiseId = seriesParam;
      }
    }

    loadWatchProgress(currentFranchiseId);
    updateGraph();
    isReady = true;
  });
</script>

<svelte:head>
  <title>Multiverse Loom - {currentFranchise.title.ja}</title>
</svelte:head>

<main class="w-screen h-screen bg-slate-950 flex flex-col relative overflow-hidden">
  <!-- トップツールバー（シリーズスイッチャー付き） -->
  <TimelineToolbar
    franchises={FRANCHISES}
    {currentFranchise}
    universes={data.universes}
    {totalCount}
    {watchedCount}
    {selectedUniverseId}
    {selectedRelationFilter}
    onSelectFranchise={handleSelectFranchise}
    onFilterUniverse={handleFilterUniverse}
    onFilterRelation={handleFilterRelation}
    onExportImage={handleExportImage}
  />

  <!-- グラフキャンバスエリア -->
  <div class="w-full h-full pt-14 pb-0 relative overflow-hidden touch-none">
    {#if browser && isReady}
      <SvelteFlow
        bind:nodes={flowNodes}
        bind:edges={flowEdges}
        {nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.2}
        maxZoom={1.8}
        panOnDrag={true}
        zoomOnPinch={true}
        panOnScroll={false}
        preventScrolling={true}
      >
        <!-- 背景の宇宙ドットグリッド -->
        <Background
          variant={BackgroundVariant.Dots}
          gap={28}
          size={1.5}
          color="#334155"
        />

        <!-- ズーム・リセットコントローラー -->
        <Controls
          showInteractive={false}
          class="!bg-slate-900/90 !border-slate-800 !text-slate-200 !rounded-xl overflow-hidden shadow-2xl !bottom-4 !left-4"
        />

        <!-- ミニマップ -->
        <MiniMap
          nodeColor={(n) => {
            const isW = (n.data as any)?.isWatched;
            return isW ? currentFranchise.theme.accentColor : '#475569';
          }}
          class="!bg-slate-900/80 !border-slate-800 !rounded-lg hidden md:block !bottom-4 !right-4"
          maskColor="rgba(2, 6, 23, 0.75)"
        />
      </SvelteFlow>
    {:else}
      <!-- ローディングスケルトン -->
      <div class="w-full h-full flex flex-col items-center justify-center gap-3 text-cyan-400">
        <div class="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin"></div>
        <p class="text-xs font-mono tracking-widest uppercase text-slate-400">
          織り成されるタイムラインを構築中...
        </p>
      </div>
    {/if}
  </div>

  <!-- ノード詳細モーダル -->
  <NodeDetailModal
    node={selectedNode}
    universe={selectedNodeUniverse}
    isWatched={selectedNode ? !!watchedState[selectedNode.id] : false}
    onClose={() => {
      selectedNode = null;
    }}
    onToggleWatch={toggleWatch}
  />
</main>
