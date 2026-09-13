<script lang="ts">
  import { Handle, Position, type NodeProps } from '@xyflow/svelte';
  import type { MovieEvent, TimelineNode, Universe } from '../../types/timeline';

  type EventNodeProps = NodeProps & {
    data: {
      event: MovieEvent;
      parentMovie?: TimelineNode;
      universe?: Universe;
      isWatched: boolean;
      onSelectEvent: (event: MovieEvent, movie?: TimelineNode) => void;
    };
  };

  let { id, data }: EventNodeProps = $props();

  const event = $derived(data.event);
  const movie = $derived(data.parentMovie);
  const universe = $derived(data.universe);
  const watched = $derived(data.isWatched);

  // 出来事タイプに応じたバッジとアクセント
  const typeBadge = $derived.by(() => {
    if (event.isBranchPoint || event.eventType === 'nexus_branch_point') {
      return { label: '⚡ 分岐点 (Nexus)', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
    }
    if (event.eventType === 'time_travel_arrival' || event.eventType === 'time_travel_departure') {
      return { label: '⏳ 時間跳躍', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
    }
    if (event.eventType === 'multiverse_crossover') {
      return { label: '🌌 次元交差', bg: 'bg-pink-500/20 text-pink-300 border-pink-500/40' };
    }
    if (event.eventType === 'timeline_pruning') {
      return { label: '✂️ TVA剪定', bg: 'bg-orange-500/20 text-orange-300 border-orange-500/40' };
    }
    if (event.eventType === 'character_retirement') {
      return { label: '🕊️ 人生の選択', bg: 'bg-blue-500/20 text-blue-300 border-blue-500/40' };
    }
    return { label: '⚔️ 重要事件', bg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' };
  });

  function handleClick() {
    data.onSelectEvent(event, movie);
  }
</script>

<!-- 入力ポート（左: 過去の出来事・時間跳躍元から接続） -->
<Handle
  type="target"
  position={Position.Left}
  class="!w-3 !h-3 !bg-cyan-400 !border-2 !border-slate-900 !rounded-full transition-transform hover:scale-150 cursor-crosshair"
/>

<!-- 出来事カード本体（映画タイトルは隠し、出来事と年代を全面に押し出す） -->
<div
  role="button"
  tabindex="0"
  onclick={handleClick}
  onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && handleClick()}
  class="relative w-[250px] min-h-[110px] rounded-xl border p-2.5 backdrop-blur-md shadow-xl transition-all duration-200 select-none text-left overflow-hidden flex flex-col justify-between cursor-pointer group
    {event.isBranchPoint
      ? 'bg-slate-950/90 border-emerald-500/60 hover:border-emerald-400 shadow-emerald-950/40 hover:shadow-emerald-500/20'
      : event.eventType === 'time_travel_arrival'
      ? 'bg-slate-950/90 border-amber-500/60 hover:border-amber-400 shadow-amber-950/40 hover:shadow-amber-500/20'
      : 'bg-slate-950/85 border-slate-800 hover:border-cyan-500/60 shadow-black/40 hover:bg-slate-900/80 hover:shadow-cyan-500/10'}
    {watched ? 'ring-1 ring-cyan-500/40' : ''}"
  style={universe ? `--universe-color: ${universe.color}` : ''}
>
  <!-- 左端のカラーバー -->
  <div
    class="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
    style="background-color: {universe?.color ?? '#06b6d4'}"
  ></div>

  <!-- 上部: 作中年代・時期バッジ & 出来事種別 -->
  <div class="flex items-center justify-between gap-1 pl-1 pr-0.5">
    <span class="text-[11px] font-mono font-bold text-amber-300 bg-amber-950/50 px-1.5 py-0.5 rounded border border-amber-800/40">
      {event.inUniverseDateLabel}
    </span>
    <span class="text-[9px] font-bold px-1.5 py-0.5 rounded border {typeBadge.bg}">
      {typeBadge.label}
    </span>
  </div>

  <!-- 中央: 出来事タイトル -->
  <div class="my-1.5 pl-1">
    <h4 class="text-xs font-bold text-white leading-snug group-hover:text-cyan-300 transition-colors line-clamp-2">
      {event.title.ja}
    </h4>
    <p class="text-[10px] text-slate-400 line-clamp-2 mt-1 leading-tight">
      {event.summary}
    </p>
  </div>

  <!-- 下部: 関連アイテム & 映画タイトルを隠した「クリックで映画を明かす」ヒント -->
  <div class="flex items-center justify-between pl-1 pt-1 border-t border-slate-900 text-[10px]">
    <div class="flex items-center gap-1">
      {#if event.keyArtifacts && event.keyArtifacts.includes('tesseract-space-stone')}
        <span class="text-[9px] text-cyan-300 bg-cyan-950/60 px-1.5 py-0.2 rounded border border-cyan-800/50 font-mono flex items-center gap-0.5">
          <span>🔷</span> キューブ
        </span>
      {/if}
    </div>

    <!-- クリックで映画を明かすインジケーター -->
    <span class="text-[9px] text-slate-400 group-hover:text-cyan-300 flex items-center gap-0.5 transition-colors font-medium">
      <span>🎬 登場作品を見る</span>
      <span>›</span>
    </span>
  </div>
</div>

<!-- 出力ポート（右: 後続の出来事・合流先へ接続） -->
<Handle
  type="source"
  position={Position.Right}
  class="!w-3 !h-3 !bg-cyan-400 !border-2 !border-slate-900 !rounded-full transition-transform hover:scale-150 cursor-crosshair"
/>

