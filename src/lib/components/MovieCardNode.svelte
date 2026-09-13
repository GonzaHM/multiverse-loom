<script lang="ts">
  import { Handle, Position, useUpdateNodeInternals, type NodeProps } from '@xyflow/svelte';
  import type { TimelineNode, Universe, MovieEvent } from '../../types/timeline';

  type MovieCardNodeProps = NodeProps & {
    data: {
      node: TimelineNode;
      universe?: Universe;
      isWatched: boolean;
      isExpanded: boolean;
      onToggleWatch: (id: string) => void;
      onToggleExpand: (id: string) => void;
      onSelectNode: (node: TimelineNode) => void;
      onSelectEvent?: (event: MovieEvent, movie: TimelineNode) => void;
    };
  };

  let { id, data }: MovieCardNodeProps = $props();

  const updateNodeInternals = useUpdateNodeInternals();
  const node = $derived(data.node);
  const universe = $derived(data.universe);
  const watched = $derived(data.isWatched);
  const isExpanded = $derived(data.isExpanded);
  const events = $derived(node.events ?? []);

  // 展開状態が変わったら Svelte Flow にハンドルの座標再計算を通知
  $effect(() => {
    const _ = isExpanded;
    queueMicrotask(() => {
      updateNodeInternals(id);
    });
  });

  function handleToggleExpand(e: MouseEvent) {
    e.stopPropagation();
    data.onToggleExpand(id);
  }

  function handleToggleWatch(e: MouseEvent) {
    e.stopPropagation();
    data.onToggleWatch(node.id);
  }

  function handleCardClick() {
    data.onSelectNode(node);
  }
</script>

<!-- 映画単位のデフォルト入力ポート（左） -->
<Handle
  type="target"
  position={Position.Left}
  id="{id}__default_target"
  class="!w-3 !h-3 !bg-cyan-400 !border-2 !border-slate-900 !rounded-full transition-transform hover:scale-150 {isExpanded ? '!opacity-30' : '!opacity-100'}"
/>

<!-- 映画ノードカード本体 -->
<div
  role="button"
  tabindex="0"
  onclick={handleCardClick}
  onkeydown={(e) => e.key === 'Enter' && handleCardClick()}
  class="relative rounded-2xl border backdrop-blur-md shadow-2xl transition-all duration-300 select-none text-left overflow-hidden flex flex-col justify-between cursor-pointer
    {isExpanded
      ? 'w-[520px] min-h-[235px] bg-slate-950/95 border-cyan-500/80 shadow-cyan-950/50 ring-1 ring-cyan-500/40'
      : 'w-[260px] h-[115px] bg-slate-950/85 border-slate-800 hover:border-slate-600 shadow-black/40 hover:bg-slate-900/70'}
    {watched ? 'ring-1 ring-cyan-500/40' : ''}"
  style={universe ? `--universe-color: ${universe.color}` : ''}
>
  <!-- 左端のユニバースアクセントバー -->
  <div
    class="absolute left-0 top-0 bottom-0 w-1.5"
    style="background-color: {universe?.color ?? '#06b6d4'}"
  ></div>

  <!-- ヘッダー: ユニバース名 + フェーズ + 展開ボタン -->
  <div class="flex items-center justify-between px-3 pt-2 pl-4">
    <div class="flex items-center gap-1.5 truncate">
      <span
        class="text-[10px] font-bold px-1.5 py-0.5 rounded border leading-none truncate max-w-[140px]"
        style="color: {universe?.color ?? '#38bdf8'}; border-color: {universe?.color ?? '#38bdf8'}40; background-color: {universe?.color ?? '#38bdf8'}15;"
      >
        {universe?.name ?? node.universeId}
      </span>
      <span class="text-[10px] text-slate-400 font-mono">
        {typeof node.phase === 'number' ? `Phase ${node.phase}` : node.phase}
      </span>
    </div>

    <!-- 出来事展開 / 収納ボタン -->
    {#if events.length > 0}
      <button
        type="button"
        onclick={handleToggleExpand}
        class="text-[10px] font-mono px-2 py-0.5 rounded border transition-colors flex items-center gap-1
          {isExpanded
            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/30'
            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'}"
        title="劇中出来事タイムラインを展開"
      >
        <span>⚡ {events.length} 出来事</span>
        <span>{isExpanded ? '▲ 収納' : '▼ 展開'}</span>
      </button>
    {/if}
  </div>

  <!-- 中央: ポスター + タイトル + 作中時期 -->
  <div class="flex gap-2.5 items-center px-3 pl-4 py-1.5">
    <div class="relative w-12 h-16 shrink-0 rounded overflow-hidden bg-slate-800 shadow-md">
      <img
        src={node.posterUrl}
        alt={node.title.ja}
        class="w-full h-full object-cover"
        loading="lazy"
        onerror={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
      />
      {#if watched}
        <div class="absolute inset-0 bg-cyan-950/70 flex items-center justify-center backdrop-blur-[0.5px]">
          <svg class="w-5 h-5 text-cyan-400 drop-shadow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      {/if}
    </div>

    <div class="flex flex-col flex-1 min-w-0">
      <h4 class="text-xs font-semibold text-white truncate leading-tight" title={node.title.ja}>
        {node.title.ja}
      </h4>
      <span class="text-[10px] text-slate-400 truncate mt-0.5" title={node.title.en}>
        {node.title.en}
      </span>
      <div class="flex items-center gap-2 mt-1">
        <span class="text-[10px] text-slate-400 font-mono">{node.releaseYear}</span>
        {#if node.inUniverseTimeLabel}
          <span class="text-[9px] text-amber-300/90 bg-amber-950/50 px-1.5 py-0.2 rounded border border-amber-800/40 truncate">
            {node.inUniverseTimeLabel}
          </span>
        {/if}
      </div>
    </div>
  </div>

  <!-- 下部: 収納時（リボンドット） vs 展開時（出来事タイムライン） -->
  {#if !isExpanded}
    <!-- 収納時: 出来事ドットリボン & 視聴済みボタン -->
    <div class="px-3 pl-4 pb-2 pt-1 border-t border-slate-900 flex items-center justify-between">
      <div class="flex items-center gap-1.5">
        {#each events as evt}
          <span
            class="w-2 h-2 rounded-full border transition-all hover:scale-125
              {evt.isBranchPoint ? 'bg-emerald-400 border-emerald-300' : evt.eventType === 'time_travel_arrival' ? 'bg-amber-400 border-amber-300' : 'bg-cyan-500 border-cyan-400'}"
            title="{evt.inUniverseDateLabel}: {evt.title.ja}"
          ></span>
        {/each}
        {#if events.length > 0}
          <span class="text-[9px] text-slate-500 font-mono ml-0.5">時系列</span>
        {/if}
      </div>

      <button
        type="button"
        onclick={handleToggleWatch}
        class="text-[9px] px-1.5 py-0.5 rounded border transition-colors
          {watched
            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/30'
            : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200 hover:bg-slate-700'}"
      >
        {watched ? '✓ 視聴済' : '○ 未視聴'}
      </button>
    </div>
  {:else}
    <!-- 展開時: 劇中出来事タイムライン（個別のHandle埋め込み） -->
    <div class="px-3 pl-4 pb-3 pt-2 border-t border-slate-800/80 bg-slate-950/70 flex-1 flex flex-col gap-1.5">
      <div class="text-[10px] font-mono text-cyan-400 flex items-center justify-between">
        <span>劇中出来事タイムライン（因果接続中）</span>
        <span class="text-slate-500 text-[9px]">左右のポートで他作品と連動</span>
      </div>

      <!-- 横スクロール出来事トラック -->
      <div class="grid grid-flow-col auto-cols-[150px] gap-2 overflow-x-auto py-1 pr-1">
        {#each events as evt (evt.id)}
          <div
            role="button"
            tabindex="0"
            class="relative rounded-lg border p-2 bg-slate-900/90 flex flex-col justify-between min-h-[95px] text-left transition-all hover:border-slate-600 cursor-pointer
              {evt.isBranchPoint
                ? 'border-emerald-500/60 bg-emerald-950/20'
                : evt.eventType === 'time_travel_arrival'
                ? 'border-amber-500/60 bg-amber-950/20'
                : 'border-slate-800'}"
            onclick={(e) => {
              e.stopPropagation();
              data.onSelectEvent?.(evt, node);
            }}
            onkeydown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.stopPropagation();
                data.onSelectEvent?.(evt, node);
              }
            }}
          >
            <!-- 出来事の専用ターゲットポート（左側） -->
            <Handle
              type="target"
              position={Position.Left}
              id="{evt.id}__target"
              class="!w-2.5 !h-2.5 !-left-1.5 !bg-purple-400 !border-2 !border-slate-950 !rounded-full !z-30 hover:!scale-150 transition-transform"
            />

            <!-- 出来事の内容 -->
            <div>
              <div class="flex items-center justify-between text-[9px] font-mono mb-1">
                <span class="text-amber-400 font-semibold truncate max-w-[95px]">{evt.inUniverseDateLabel}</span>
                <span class="text-slate-500">#{evt.order}</span>
              </div>
              <h5 class="text-[11px] font-medium text-white leading-snug line-clamp-2" title={evt.title.ja}>
                {evt.title.ja}
              </h5>
            </div>

            <p class="text-[9px] text-slate-400 line-clamp-2 mt-1 leading-tight">
              {evt.summary}
            </p>

            <!-- 出来事の専用ソースポート（右側） -->
            <Handle
              type="source"
              position={Position.Right}
              id="{evt.id}__source"
              class="!w-2.5 !h-2.5 !-right-1.5 !bg-cyan-400 !border-2 !border-slate-950 !rounded-full !z-30 hover:!scale-150 transition-transform"
            />
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<!-- 映画単位のデフォルト出力ポート（右） -->
<Handle
  type="source"
  position={Position.Right}
  id="{id}__default_source"
  class="!w-3 !h-3 !bg-cyan-400 !border-2 !border-slate-900 !rounded-full transition-transform hover:scale-150 {isExpanded ? '!opacity-30' : '!opacity-100'}"
/>
