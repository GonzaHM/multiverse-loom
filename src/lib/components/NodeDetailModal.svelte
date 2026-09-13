<script lang="ts">
  import type { TimelineNode, Universe, MovieEvent } from '../../types/timeline';

  let { 
    node, 
    universe, 
    selectedEvent = null,
    isWatched, 
    onClose, 
    onToggleWatch 
  } = $props<{
    node: TimelineNode | null;
    universe?: Universe;
    selectedEvent?: MovieEvent | null;
    isWatched: boolean;
    onClose: () => void;
    onToggleWatch: (id: string) => void;
  }>();

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      onClose();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if node}
  <!-- モーダル背景オーバーレイ -->
  <div
    class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity animate-in fade-in duration-200"
    onclick={onClose}
    role="presentation"
  >
    <!-- モーダル本体 -->
    <div
      class="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl p-6 text-slate-100 flex flex-col gap-4 relative"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
      tabindex="-1"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <!-- 閉じるボタン -->
      <button
        type="button"
        onclick={onClose}
        class="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        aria-label="閉じる"
      >
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <!-- 選択された特定の出来事のハイライトカード（もしあれば） -->
      {#if selectedEvent}
        <div class="rounded-xl p-3.5 border border-cyan-500/50 bg-cyan-950/30 flex flex-col gap-1.5 shadow-md">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              ⚡ 選択中の出来事: {selectedEvent.inUniverseDateLabel}
            </span>
            {#if selectedEvent.isBranchPoint}
              <span class="text-[10px] text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/40 font-semibold animate-pulse">
                分岐点 (Nexus Event)
              </span>
            {/if}
          </div>
          <h4 class="text-sm font-bold text-white mt-1">
            {selectedEvent.title.ja}
          </h4>
          <p class="text-xs text-slate-300 leading-relaxed">
            {selectedEvent.summary}
          </p>
          {#if selectedEvent.keyCharacters && selectedEvent.keyCharacters.length > 0}
            <div class="flex flex-wrap gap-1 mt-1">
              {#each selectedEvent.keyCharacters as c}
                <span class="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded border border-slate-700">
                  {c}
                </span>
              {/each}
            </div>
          {/if}
        </div>
      {/if}

      <!-- 映画ヘッダー情報 -->
      <div class="flex gap-4 items-start">
        <div class="relative w-24 h-36 shrink-0 rounded-lg overflow-hidden bg-slate-800 shadow-md">
          <img
            src={node.posterUrl}
            alt={node.title.ja}
            class="w-full h-full object-cover"
          />
        </div>

        <div class="flex flex-col flex-1 min-w-0 pr-6">
          <div class="flex flex-wrap gap-1.5 mb-1.5 items-center">
            <span
              class="text-xs font-bold px-2 py-0.5 rounded border"
              style="color: {universe?.color ?? '#94a3b8'}; border-color: {universe?.color ?? '#475569'}; background-color: {universe?.color ?? '#475569'}20;"
            >
              {universe?.name ?? node.universeId}
            </span>
            <span class="text-xs text-slate-400 font-mono px-1.5 py-0.5 bg-slate-800 rounded">
              {typeof node.phase === 'number' ? `Phase ${node.phase}` : node.phase}
            </span>
          </div>

          <h3 id="modal-title" class="text-lg font-bold text-white leading-tight">
            {node.title.ja}
          </h3>
          <p class="text-xs text-slate-400 font-medium mt-0.5">
            {node.title.en}
          </p>

          <div class="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-400 font-mono mt-2">
            <span>公開: {node.releaseDate}</span>
            {#if node.inUniverseTimeLabel}
              <span class="text-amber-300">作中時期: {node.inUniverseTimeLabel}</span>
            {/if}
          </div>

          <!-- 視聴ステータスボタン -->
          <button
            type="button"
            onclick={() => onToggleWatch(node.id)}
            class="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all w-fit
              {isWatched
                ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-md shadow-cyan-500/20'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600'}"
          >
            <span>{isWatched ? '✓ 視聴済み（クリックで解除）' : '○ 視聴済みにする'}</span>
          </button>
        </div>
      </div>

      <!-- あらすじ -->
      <div class="border-t border-slate-800 pt-3">
        <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
          概要・マルチバース重要ポイント
        </h4>
        <p class="text-sm text-slate-300 leading-relaxed">
          {node.summary}
        </p>
      </div>

      <!-- 登場キャラクター -->
      {#if node.characters && node.characters.length > 0}
        <div class="border-t border-slate-800 pt-3">
          <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            主要登場人物
          </h4>
          <div class="flex flex-wrap gap-1.5">
            {#each node.characters as char}
              <span class="text-xs bg-slate-800/80 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700/60">
                {char}
              </span>
            {/each}
          </div>
        </div>
      {/if}

      <!-- タグ -->
      {#if node.tags && node.tags.length > 0}
        <div class="border-t border-slate-800 pt-3">
          <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            タグ
          </h4>
          <div class="flex flex-wrap gap-1.5">
            {#each node.tags as tag}
              <span class="text-[11px] text-cyan-400/90 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
                #{tag}
              </span>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}
