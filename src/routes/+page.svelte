<script lang="ts">
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';
  import {
    SvelteFlow,
    Controls,
    Background,
    BackgroundVariant,
    MiniMap,
    ViewportPortal,
    type Node,
    type Edge,
    type NodeTypes,
    type EdgeTypes
  } from '@xyflow/svelte';

  import { FRANCHISES, getFranchiseById, DEFAULT_FRANCHISE_ID } from '../data/franchises';
  import type { TimelineNode, TimelineEdge, Universe, FranchiseMetadata, MovieEvent } from '../types/timeline';
  import EventNode from '$lib/components/EventNode.svelte';
  import MultiverseEdge from '$lib/components/MultiverseEdge.svelte';
  import EventDetailModal from '$lib/components/EventDetailModal.svelte';
  import TimelineToolbar from '$lib/components/TimelineToolbar.svelte';
  import TimeAxis from '$lib/components/TimeAxis.svelte';
  import {
    getChronologicalLayout,
    DEFAULT_START_YEAR,
    DEFAULT_END_YEAR,
    DEFAULT_YEAR_SCALE,
    type LayoutResult
  } from '$lib/layout/chronological-layout';
  import { exportTimelineAsPng } from '$lib/utils/export-image';

  // カスタムノード & エッジ登録
  const nodeTypes: NodeTypes = {
    eventNode: EventNode
  };

  const edgeTypes: EdgeTypes = {
    multiverseEdge: MultiverseEdge
  };

  // 現在選択中のフランチャイズ
  let currentFranchiseId = $state<string>(DEFAULT_FRANCHISE_ID);
  const currentFranchise = $derived<FranchiseMetadata>(getFranchiseById(currentFranchiseId));

  // 現在のフランチャイズのタイムラインデータ
  const data = $derived(currentFranchise.timelineData);

  // アイテム追跡（例: 'tesseract-space-stone'）
  let activeArtifactId = $state<string | null>(null);

  // 視聴状態マップ（映画IDごとに管理）
  let watchedState = $state<Record<string, boolean>>({});

  // フィルター・選択状態
  let selectedUniverseId = $state<string | 'all'>('all');
  let selectedRelationFilter = $state<'all' | 'branches_only'>('all');
  let activeEvent = $state<MovieEvent | null>(null);
  let activeMovie = $state<TimelineNode | null>(null);

  // Svelte Flow 用ノード・エッジ
  let flowNodes = $state<Node[]>([]);
  let flowEdges = $state<Edge[]>([]);
  let timelineBounds = $state({
    startYear: DEFAULT_START_YEAR,
    endYear: DEFAULT_END_YEAR,
    yearScale: DEFAULT_YEAR_SCALE,
    nullTimeX: (DEFAULT_END_YEAR - DEFAULT_START_YEAR + 4) * DEFAULT_YEAR_SCALE
  });
  let isReady = $state(false);

  // 集計
  const totalCount = $derived(data.nodes.length);
  const watchedCount = $derived(
    Object.values(watchedState).filter(Boolean).length
  );

  // 選択中映画のユニバース
  const activeMovieUniverse = $derived(
    activeMovie ? data.universes.find((u) => u.id === activeMovie?.universeId) : undefined
  );

  // 視聴状態の読み込み
  function loadWatchProgress(franchiseId: string) {
    if (!browser) return;
    try {
      const saved = localStorage.getItem(`multiverse_loom_watched_${franchiseId}`);
      if (saved) {
        watchedState = JSON.parse(saved);
      } else {
        if (franchiseId === 'marvel') {
          const legacy = localStorage.getItem('multiverse_loom_watched');
          if (legacy) {
            watchedState = JSON.parse(legacy);
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

  // 映画の視聴状態の切り替え
  function toggleWatch(movieId: string) {
    const next = !watchedState[movieId];
    watchedState[movieId] = next;

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
      if ((fn.data as any).parentMovie?.id === movieId) {
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

  // グラフデータ再構築 & レイアウト計算（主役は出来事 Event！）
  function updateGraph() {
    // 1. 全映画から出来事（Events）ノードを抽出
    const rawNodes: Node[] = [];
    const eventIdMap = new Map<string, { event: MovieEvent; movie: TimelineNode }>();

    data.nodes.forEach((movie) => {
      const u = data.universes.find((uni) => uni.id === movie.universeId);
      const isMovieWatched = !!watchedState[movie.id];

      if (movie.events && movie.events.length > 0) {
        movie.events.forEach((evt) => {
          // ユニバースフィルター
          if (selectedUniverseId !== 'all' && movie.universeId !== selectedUniverseId) {
            return;
          }

          eventIdMap.set(evt.id, { event: evt, movie });

          rawNodes.push({
            id: evt.id,
            type: 'eventNode',
            draggable: false,
            selectable: false,
            deletable: false,
            data: {
              event: evt,
              parentMovie: movie,
              universe: u,
              isWatched: isMovieWatched,
              onSelectEvent: (selectedEvt: MovieEvent, selectedMov?: TimelineNode) => {
                activeEvent = selectedEvt;
                activeMovie = selectedMov ?? movie;
              }
            },
            position: { x: 0, y: 0 }
          });
        });
      } else {
        // 出来事が定義されていない作品（フォールバック）
        if (selectedUniverseId === 'all' || movie.universeId === selectedUniverseId) {
          const pseudoEvent: MovieEvent = {
            id: `evt-${movie.id}`,
            movieId: movie.id,
            title: movie.title,
            inUniverseYear: movie.releaseYear,
            inUniverseDateLabel: `${movie.releaseYear}年`,
            summary: movie.summary,
            order: 1,
            eventType: 'canon_milestone'
          };
          eventIdMap.set(pseudoEvent.id, { event: pseudoEvent, movie });

          rawNodes.push({
            id: pseudoEvent.id,
            type: 'eventNode',
            draggable: false,
            selectable: false,
            deletable: false,
            data: {
              event: pseudoEvent,
              parentMovie: movie,
              universe: u,
              isWatched: isMovieWatched,
              onSelectEvent: (selectedEvt: MovieEvent, selectedMov?: TimelineNode) => {
                activeEvent = selectedEvt;
                activeMovie = selectedMov ?? movie;
              }
            },
            position: { x: 0, y: 0 }
          });
        }
      }
    });

    const activeNodeIds = new Set(rawNodes.map((n) => n.id));

    // 2. 出来事同士をつなぐエッジの構築
    const rawEdges: Edge[] = data.edges
      .map((e) => {
        // sourceHandle / targetHandle から出来事IDを抽出（なければ映画の先頭出来事）
        let sourceEventId = e.sourceHandle ? e.sourceHandle.replace('__source', '') : e.source;
        let targetEventId = e.targetHandle ? e.targetHandle.replace('__target', '') : e.target;

        // もし映画IDが指定されていたら、その映画の第1出来事IDを補完
        if (!eventIdMap.has(sourceEventId)) {
          const sm = data.nodes.find((m) => m.id === sourceEventId);
          if (sm?.events?.[0]) sourceEventId = sm.events[0].id;
        }
        if (!eventIdMap.has(targetEventId)) {
          const tm = data.nodes.find((m) => m.id === targetEventId);
          if (tm?.events?.[0]) targetEventId = tm.events[0].id;
        }

        return {
          ...e,
          resolvedSource: sourceEventId,
          resolvedTarget: targetEventId
        };
      })
      .filter((e) => {
        // 両端の出来事ノードが存在するか
        if (!activeNodeIds.has(e.resolvedSource) || !activeNodeIds.has(e.resolvedTarget)) return false;
        // 分岐・合流フィルター
        if (selectedRelationFilter === 'branches_only') {
          return (
            e.relationType === 'multiverse_branch' ||
            e.relationType === 'crossover' ||
            e.relationType === 'time_travel'
          );
        }
        return true;
      })
      .map((e) => {
        const isArtifactAssociated =
          activeArtifactId && e.associatedArtifactId === activeArtifactId;
        const isDimmed = !!activeArtifactId && !isArtifactAssociated;

        return {
          id: e.id,
          source: e.resolvedSource,
          target: e.resolvedTarget,
          type: 'multiverseEdge',
          data: {
            relationType: e.relationType,
            label: e.label,
            isHighlighted: isArtifactAssociated,
            isDimmed
          }
        };
      });

    // 3. 西暦の目盛りに忠実なタイムラインレイアウト計算
    const layout = getChronologicalLayout(rawNodes, rawEdges, {
      startYear: DEFAULT_START_YEAR,
      endYear: DEFAULT_END_YEAR,
      yearScale: DEFAULT_YEAR_SCALE,
      nodeWidth: 250,
      nodeHeight: 115
    });
    flowNodes = layout.nodes;
    flowEdges = layout.edges;
    timelineBounds = layout.timelineBounds;
  }

  // シリーズ切り替え
  function handleSelectFranchise(id: string) {
    if (id === currentFranchiseId) return;
    currentFranchiseId = id;
    selectedUniverseId = 'all';
    activeEvent = null;
    activeMovie = null;
    activeArtifactId = null;

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

  function handleToggleArtifact(id: string | null) {
    activeArtifactId = id;
    updateGraph();
  }

  // 画像エクスポート
  function handleExportImage() {
    const fileName = `multiverse-loom-${currentFranchise.slug}-timeline.png`;
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
  <title>Multiverse Loom - 劇中出来事タイムライン相関図</title>
</svelte:head>

<main class="w-screen h-screen bg-slate-950 flex flex-col relative overflow-hidden">
  <!-- トップツールバー（シリーズスイッチャー & アイテム追跡付き） -->
  <TimelineToolbar
    franchises={FRANCHISES}
    {currentFranchise}
    universes={data.universes}
    {totalCount}
    {watchedCount}
    {selectedUniverseId}
    {selectedRelationFilter}
    {activeArtifactId}
    onSelectFranchise={handleSelectFranchise}
    onFilterUniverse={handleFilterUniverse}
    onFilterRelation={handleFilterRelation}
    onToggleArtifact={handleToggleArtifact}
    onExportImage={handleExportImage}
  />

  <!-- グラフキャンバスエリア（出来事ノードが時系列で流れる） -->
  <div class="w-full h-full pt-14 pb-0 relative overflow-hidden touch-none">
    <!-- タイムライン案内バッジ（画面上部中央） -->
    <div class="pointer-events-none absolute top-16 inset-x-0 z-10 flex justify-center">
      <div class="px-3 py-1 rounded-full bg-slate-900/80 border border-cyan-500/30 backdrop-blur-md shadow-lg shadow-cyan-950/40 flex items-center gap-2 text-[10px] font-mono text-cyan-300">
        <span class="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
        <span class="tracking-widest uppercase font-semibold">CHRONOLOGICAL TIMELINE</span>
        <span class="text-slate-400 hidden sm:inline">| 西暦目盛り連動モード (1940年 ➔ 未来)</span>
      </div>
    </div>

    {#if browser && isReady}
      <SvelteFlow
        bind:nodes={flowNodes}
        bind:edges={flowEdges}
        {nodeTypes}
        {edgeTypes}
        nodesDraggable={false}
        elementsSelectable={false}
        nodesConnectable={false}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.15}
        maxZoom={1.8}
        panOnDrag={true}
        zoomOnPinch={true}
        panOnScroll={false}
        preventScrolling={true}
      >
        <!-- キャンバス内部（ワールド座標系）に配置される水平時間軸 & 西暦目盛り -->
        <ViewportPortal target="back">
          <TimeAxis
            franchiseColor={currentFranchise.theme.accentColor}
            startYear={timelineBounds.startYear}
            endYear={timelineBounds.endYear}
            yearScale={timelineBounds.yearScale}
            nullTimeX={timelineBounds.nullTimeX}
          />
        </ViewportPortal>
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
          nodeColor={() => currentFranchise.theme.primaryColor}
          class="!bg-slate-900/80 !border-slate-800 !rounded-lg hidden md:block !bottom-4 !right-4"
          maskColor="rgba(2, 6, 23, 0.75)"
        />
      </SvelteFlow>
    {:else}
      <!-- ローディングスケルトン -->
      <div class="w-full h-full flex flex-col items-center justify-center gap-3 text-cyan-400">
        <div class="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin"></div>
        <p class="text-xs font-mono tracking-widest uppercase text-slate-400">
          劇中出来事タイムラインを構築中...
        </p>
      </div>
    {/if}
  </div>

  <!-- 出来事タップ時に開くモーダル（映画タイトルとポスターをここで暴露！） -->
  <EventDetailModal
    event={activeEvent}
    movie={activeMovie}
    universe={activeMovieUniverse}
    isWatched={activeMovie ? !!watchedState[activeMovie.id] : false}
    onClose={() => {
      activeEvent = null;
      activeMovie = null;
    }}
    onToggleWatch={toggleWatch}
  />
</main>
