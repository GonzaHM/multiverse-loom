<script lang="ts">
  import type { Universe, FranchiseMetadata, Artifact } from '../../types/timeline';

  let {
    franchises,
    currentFranchise,
    universes,
    totalCount,
    watchedCount,
    selectedUniverseId,
    selectedRelationFilter,
    activeArtifactId,
    onSelectFranchise,
    onFilterUniverse,
    onFilterRelation,
    onToggleArtifact,
    onExportImage
  } = $props<{
    franchises: FranchiseMetadata[];
    currentFranchise: FranchiseMetadata;
    universes: Universe[];
    totalCount: number;
    watchedCount: number;
    selectedUniverseId: string | 'all';
    selectedRelationFilter: 'all' | 'branches_only';
    activeArtifactId: string | null;
    onSelectFranchise: (id: string) => void;
    onFilterUniverse: (id: string | 'all') => void;
    onFilterRelation: (filter: 'all' | 'branches_only') => void;
    onToggleArtifact: (id: string | null) => void;
    onExportImage: () => void;
  }>();

  let isDropdownOpen = $state(false);

  const percentage = $derived(
    totalCount > 0 ? Math.round((watchedCount / totalCount) * 100) : 0
  );

  function handleSelect(id: string) {
    onSelectFranchise(id);
    isDropdownOpen = false;
  }
</script>

<header class="absolute top-0 left-0 right-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-3 select-none">
  <!-- 左側: シリーズスイッチャー & タイトル & 進捗 -->
  <div class="flex items-center gap-3">
    <!-- シリーズ選択ドロップダウン / スイッチャー -->
    <div class="relative">
      <button
        type="button"
        onclick={() => (isDropdownOpen = !isDropdownOpen)}
        class="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-700/80 bg-slate-900/90 hover:bg-slate-800 hover:border-slate-600 transition-all shadow-sm group"
        aria-expanded={isDropdownOpen}
        aria-haspopup="listbox"
      >
        <span class="text-lg leading-none">{currentFranchise.icon}</span>
        <div class="text-left hidden xs:block">
          <div class="flex items-center gap-1">
            <span class="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
              {currentFranchise.title.ja}
            </span>
            <svg class="w-3.5 h-3.5 text-slate-400 transition-transform {isDropdownOpen ? 'rotate-180' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          <span class="text-[10px] text-slate-400 block -mt-0.5 truncate max-w-[180px]">
            {currentFranchise.tagline.ja}
          </span>
        </div>
      </button>

      <!-- シリーズ選択ポップオーバーメニュー -->
      {#if isDropdownOpen}
        <div
          class="fixed inset-0 z-50"
          onclick={() => (isDropdownOpen = false)}
          role="presentation"
        ></div>

        <div class="absolute left-0 mt-1.5 w-64 rounded-xl border border-slate-700 bg-slate-900/95 backdrop-blur-xl shadow-2xl z-50 p-1.5 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-150">
          <div class="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            映画シリーズを選択
          </div>
          {#each franchises as f}
            <button
              type="button"
              onclick={() => handleSelect(f.id)}
              class="w-full flex items-center gap-3 p-2 rounded-lg text-left transition-all
                {currentFranchise.id === f.id
                  ? 'bg-slate-800 text-white font-semibold ring-1 ring-slate-600'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'}"
            >
              <span class="text-xl shrink-0 p-1 rounded-lg bg-slate-950/60 border border-slate-800">{f.icon}</span>
              <div class="flex flex-col min-w-0">
                <span class="text-xs font-bold truncate leading-tight">{f.title.ja}</span>
                <span class="text-[10px] text-slate-400 truncate mt-0.5">{f.title.en}</span>
              </div>
              {#if currentFranchise.id === f.id}
                <span class="ml-auto text-cyan-400 text-xs">✓</span>
              {/if}
            </button>
          {/each}
        </div>
      {/if}
    </div>

    <!-- 進捗ゲージ -->
    <div class="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-800">
      <div class="flex flex-col">
        <div class="flex items-center justify-between gap-2 text-[10px] text-slate-300">
          <span>進捗: <strong>{watchedCount}</strong> / {totalCount} 作品</span>
          <span class="font-mono text-cyan-400">{percentage}%</span>
        </div>
        <div class="w-20 sm:w-28 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-0.5">
          <div
            class="h-full rounded-full transition-all duration-300"
            style="width: {percentage}%; background-color: {currentFranchise.theme.primaryColor};"
          ></div>
        </div>
      </div>
    </div>
  </div>

  <!-- 右側: アイテム追跡 & フィルター & シェアボタン -->
  <div class="flex items-center gap-2 flex-wrap">
    <!-- マーベル専用: 四次元キューブ（スペース・ストーン）追跡ボタン -->
    {#if currentFranchise.id === 'marvel'}
      <button
        type="button"
        onclick={() => onToggleArtifact(activeArtifactId ? null : 'tesseract-space-stone')}
        class="px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all flex items-center gap-1.5 shadow-sm
          {activeArtifactId === 'tesseract-space-stone'
            ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 ring-2 ring-cyan-500/50 shadow-cyan-500/30'
            : 'bg-slate-900 border-slate-700/80 text-cyan-400 hover:bg-slate-800 hover:border-cyan-500/60'}"
        title="1942年からエンドゲーム、ロキまでの四次元キューブの流転経路をハイライト"
      >
        <span class="text-sm">🔷</span>
        <span class="text-[11px] font-semibold">
          {activeArtifactId ? 'キューブ追跡中' : '四次元キューブの航跡'}
        </span>
      </button>
    {/if}

    <!-- ユニバースフィルター -->
    <div class="flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800 text-xs">
      <button
        type="button"
        onclick={() => onFilterUniverse('all')}
        class="px-2 py-1 rounded transition-colors text-[11px] {selectedUniverseId === 'all' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'}"
      >
        全タイムライン
      </button>
      {#each universes as u}
        <button
          type="button"
          onclick={() => onFilterUniverse(u.id)}
          class="px-2 py-1 rounded transition-colors text-[11px] {selectedUniverseId === u.id ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-white'}"
          style={selectedUniverseId === u.id ? `color: ${u.color}` : ''}
          title={u.name}
        >
          {u.designation}
        </button>
      {/each}
    </div>

    <!-- 接続線フィルター -->
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
      <span class="hidden sm:inline">進捗画像を</span>出力
    </button>
  </div>
</header>
