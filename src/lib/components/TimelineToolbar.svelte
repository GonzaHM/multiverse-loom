<script lang="ts">
  import type { Universe } from '../../types/timeline';

  let {
    universes,
    totalCount,
    watchedCount,
    selectedUniverseId,
    selectedRelationFilter,
    onFilterUniverse,
    onFilterRelation,
    onExportImage
  } = $props<{
    universes: Universe[];
    totalCount: number;
    watchedCount: number;
    selectedUniverseId: string | 'all';
    selectedRelationFilter: 'all' | 'branches_only';
    onFilterUniverse: (id: string | 'all') => void;
    onFilterRelation: (filter: 'all' | 'branches_only') => void;
    onExportImage: () => void;
  }>();

  const percentage = $derived(
    totalCount > 0 ? Math.round((watchedCount / totalCount) * 100) : 0
  );
</script>

<header class="absolute top-0 left-0 right-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 select-none">
  <!-- 左: ロゴ & コンセプト -->
  <div class="flex items-center gap-3">
    <div class="flex items-center gap-2">
      <div class="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center shadow-md shadow-cyan-500/20">
        <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>
      <div>
        <h1 class="text-sm font-bold text-white tracking-wide flex items-center gap-1.5">
          Multiverse Loom
          <span class="text-[10px] font-normal text-cyan-400 bg-cyan-950/60 px-1.5 py-0.2 rounded border border-cyan-800/50">
            PoC
          </span>
        </h1>
        <p class="text-[10px] text-slate-400 hidden sm:block">
          マルチバース時系列・分岐 相関図
        </p>
      </div>
    </div>

    <!-- 進捗ゲージ -->
    <div class="flex items-center gap-2 pl-3 border-l border-slate-800">
      <div class="flex flex-col">
        <div class="flex items-center justify-between gap-2 text-[10px] text-slate-300">
          <span>進捗: <strong>{watchedCount}</strong> / {totalCount} 作品</span>
          <span class="font-mono text-cyan-400">{percentage}%</span>
        </div>
        <div class="w-24 sm:w-32 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-0.5">
          <div
            class="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full transition-all duration-300"
            style="width: {percentage}%"
          ></div>
        </div>
      </div>
    </div>
  </div>

  <!-- 右: フィルター & シェアボタン -->
  <div class="flex items-center gap-2 flex-wrap">
    <!-- ユニバースフィルター -->
    <div class="flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800 text-xs">
      <button
        type="button"
        onclick={() => onFilterUniverse('all')}
        class="px-2 py-1 rounded transition-colors text-[11px] {selectedUniverseId === 'all' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'}"
      >
        全バース
      </button>
      {#each universes as u}
        <button
          type="button"
          onclick={() => onFilterUniverse(u.id)}
          class="px-2 py-1 rounded transition-colors text-[11px] {selectedUniverseId === u.id ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-white'}"
          style={selectedUniverseId === u.id ? `color: ${u.color}` : ''}
        >
          {u.designation}
        </button>
      {/each}
    </div>

    <!-- 接続線フィルター（全線 vs 分岐・合流のみ） -->
    <button
      type="button"
      onclick={() => onFilterRelation(selectedRelationFilter === 'all' ? 'branches_only' : 'all')}
      class="px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors hidden md:inline-flex items-center gap-1.5
        {selectedRelationFilter === 'branches_only'
          ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'}"
      title="表示するエッジを分岐・クロスオーバーのみに絞り込み"
    >
      <span>{selectedRelationFilter === 'branches_only' ? '⚡ 分岐・合流のみ' : '🔗 全ての接続'}</span>
    </button>

    <!-- SNS画像エクスポートボタン -->
    <button
      type="button"
      onclick={onExportImage}
      class="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-semibold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20 transition-transform active:scale-95"
    >
      <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 22.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
      <span>進捗画像を出力</span>
    </button>
  </div>
</header>
