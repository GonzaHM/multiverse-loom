<script lang="ts">
  import { Handle, Position, type NodeProps } from '@xyflow/svelte';
  import type { TimelineNode, Universe } from '../../types/timeline';

  type MovieNodeProps = NodeProps & {
    data: {
      node: TimelineNode;
      universe?: Universe;
      isWatched: boolean;
      onToggleWatch: (id: string) => void;
      onSelectNode: (node: TimelineNode) => void;
    };
  };

  let { id, data }: MovieNodeProps = $props();

  const node = $derived(data.node);
  const universe = $derived(data.universe);
  const watched = $derived(data.isWatched);

  function handleToggle(e: MouseEvent) {
    e.stopPropagation();
    data.onToggleWatch(node.id);
  }

  function handleCardClick() {
    data.onSelectNode(node);
  }
</script>

<!-- 入力ハンドル（左側: 過去の作品や分岐元から接続） -->
<Handle
  type="target"
  position={Position.Left}
  class="!w-3 !h-3 !bg-cyan-400 !border-2 !border-slate-900 !rounded-full transition-transform hover:scale-150 cursor-crosshair"
/>

<!-- ノードカード本体 -->
<div
  role="button"
  tabindex="0"
  onclick={handleCardClick}
  onkeydown={(e) => e.key === 'Enter' && handleCardClick()}
  class="relative w-[260px] h-[110px] rounded-xl border p-2.5 backdrop-blur-md shadow-lg transition-all duration-200 cursor-pointer select-none text-left overflow-hidden flex flex-col justify-between
    {watched 
      ? 'bg-slate-900/90 border-cyan-500/60 shadow-cyan-950/40 ring-1 ring-cyan-500/30' 
      : 'bg-slate-950/85 border-slate-800 hover:border-slate-600 shadow-black/40 hover:bg-slate-900/60'}"
  style={universe ? `--universe-color: ${universe.color}` : ''}
>
  <!-- 背景ユニバースカラーアクセント（左端の縦線） -->
  <div 
    class="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
    style="background-color: {universe?.color ?? '#64748b'}"
  ></div>

  <!-- 上部: バッジエリア -->
  <div class="flex items-center justify-between gap-1 pl-1.5 pr-0.5">
    <span
      class="text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded border leading-none truncate max-w-[150px]"
      style="color: {universe?.color ?? '#94a3b8'}; border-color: {universe?.color ?? '#475569'}40; background-color: {universe?.color ?? '#475569'}15;"
    >
      {universe?.name ?? node.universeId}
    </span>
    <span class="text-[10px] text-slate-400 font-mono tracking-tight shrink-0">
      {typeof node.phase === 'number' ? `Phase ${node.phase}` : node.phase}
    </span>
  </div>

  <!-- 中央: ポスター + タイトル -->
  <div class="flex gap-2.5 items-center pl-1.5 my-auto">
    <!-- ポスター画像サムネイル -->
    <div class="relative w-12 h-16 shrink-0 rounded overflow-hidden bg-slate-800 shadow-inner flex items-center justify-center">
      <img
        src={node.posterUrl}
        alt={node.title.ja}
        loading="lazy"
        class="w-full h-full object-cover"
        onerror={(e) => {
          // 画像ロード失敗時のフォールバック
          (e.currentTarget as HTMLImageElement).style.display = 'none';
        }}
      />
      {#if watched}
        <div class="absolute inset-0 bg-cyan-950/60 flex items-center justify-center backdrop-blur-[0.5px]">
          <svg class="w-6 h-6 text-cyan-400 drop-shadow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      {/if}
    </div>

    <!-- タイトル・公開年 -->
    <div class="flex flex-col flex-1 min-w-0">
      <h4 class="text-xs font-semibold text-white truncate leading-snug" title={node.title.ja}>
        {node.title.ja}
      </h4>
      <span class="text-[10px] text-slate-400 truncate" title={node.title.en}>
        {node.title.en}
      </span>
      <div class="flex items-center gap-1.5 mt-1">
        <span class="text-[10px] text-slate-400 font-mono">
          {node.releaseYear}
        </span>
        {#if node.inUniverseTimeLabel}
          <span class="text-[9px] text-amber-300/80 bg-amber-950/40 px-1 py-0.2 rounded border border-amber-800/40 truncate">
            {node.inUniverseTimeLabel}
          </span>
        {/if}
      </div>
    </div>
  </div>

  <!-- 下部: 視聴ステータスボタン & 詳細案内 -->
  <div class="flex items-center justify-between pl-1.5 pt-0.5 border-t border-slate-800/60">
    <button
      type="button"
      onclick={handleToggle}
      class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors
        {watched
          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30'
          : 'bg-slate-800/90 text-slate-400 border border-slate-700 hover:text-slate-200 hover:bg-slate-700/80'}"
      title="クリックして視聴済みを切り替え"
    >
      <span>{watched ? '✓ 視聴済' : '○ 未視聴'}</span>
    </button>

    <span class="text-[9px] text-slate-500 flex items-center gap-0.5 group-hover:text-slate-400">
      詳細 <span>›</span>
    </span>
  </div>
</div>

<!-- 出力ハンドル（右側: 続編や合流先へ接続） -->
<Handle
  type="source"
  position={Position.Right}
  class="!w-3 !h-3 !bg-cyan-400 !border-2 !border-slate-900 !rounded-full transition-transform hover:scale-150 cursor-crosshair"
/>

