<script lang="ts">
  import type { MovieEvent, TimelineNode, Universe } from '../../types/timeline';

  let {
    event,
    movie,
    universe,
    isWatched,
    onClose,
    onToggleWatch
  } = $props<{
    event: MovieEvent | null;
    movie?: TimelineNode | null;
    universe?: Universe;
    isWatched: boolean;
    onClose: () => void;
    onToggleWatch: (movieId: string) => void;
  }>();

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      onClose();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if event}
  <!-- モーダル背景オーバーレイ -->
  <div
    class="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 transition-opacity animate-in fade-in duration-200"
    onclick={onClose}
    role="presentation"
  >
    <!-- モーダル本体 -->
    <div
      class="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg max-h-[88vh] overflow-y-auto shadow-2xl p-6 text-slate-100 flex flex-col gap-4 relative"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
      tabindex="-1"
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-modal-title"
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

      <!-- 出来事ヘッダー -->
      <div class="flex flex-col gap-1.5 border-b border-slate-800 pb-3 pr-8">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-xs font-mono font-bold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/50">
            作中時期: {event.inUniverseDateLabel}
          </span>
          {#if event.isBranchPoint}
            <span class="text-xs font-bold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/50 animate-pulse">
              ⚡ 時間軸分岐 (Nexus Event)
            </span>
          {/if}
          {#if event.eventType === 'time_travel_arrival' || event.eventType === 'time_travel_departure'}
            <span class="text-xs font-bold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/50">
              ⏳ 時間跳躍
            </span>
          {/if}
        </div>

        <h3 id="event-modal-title" class="text-lg font-bold text-white leading-snug mt-1">
          {event.title.ja}
        </h3>
        <p class="text-xs text-slate-400">
          {event.title.en}
        </p>
      </div>

      <!-- 出来事の詳細あらすじ -->
      <div class="flex flex-col gap-2">
        <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          出来事の真相・因果関係
        </h4>
        <p class="text-sm text-slate-200 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800">
          {event.summary}
        </p>
      </div>

      <!-- 登場人物 & アイテム -->
      {#if event.keyCharacters || event.keyArtifacts}
        <div class="flex flex-wrap gap-2 text-xs">
          {#if event.keyCharacters && event.keyCharacters.length > 0}
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="text-slate-400 font-medium">関係者:</span>
              {#each event.keyCharacters as char}
                <span class="bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                  {char}
                </span>
              {/each}
            </div>
          {/if}
          {#if event.keyArtifacts && event.keyArtifacts.includes('tesseract-space-stone')}
            <div class="flex items-center gap-1">
              <span class="text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60 font-mono">
                🔷 四次元キューブが関与
              </span>
            </div>
          {/if}
        </div>
      {/if}

      <!-- 🎬 登場映画の暴露（Reveal）セクション -->
      {#if movie}
        <div class="mt-2 pt-3 border-t border-slate-800/80 bg-gradient-to-r from-slate-950 to-slate-900/90 -mx-6 -mb-6 p-6 rounded-b-2xl border-b border-cyan-500/20">
          <div class="flex items-center gap-2 mb-3">
            <span class="text-base">🎬</span>
            <span class="text-xs font-bold text-cyan-400 tracking-wider uppercase">
              この出来事が描かれている映画作品
            </span>
          </div>

          <div class="flex gap-4 items-start">
            <div class="relative w-20 h-28 shrink-0 rounded-lg overflow-hidden bg-slate-800 shadow-xl border border-slate-700">
              <img
                src={movie.posterUrl}
                alt={movie.title.ja}
                class="w-full h-full object-cover"
              />
            </div>

            <div class="flex flex-col flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1 flex-wrap">
                <span
                  class="text-[10px] font-bold px-1.5 py-0.5 rounded border leading-none"
                  style="color: {universe?.color ?? '#94a3b8'}; border-color: {universe?.color ?? '#475569'}; background-color: {universe?.color ?? '#475569'}20;"
                >
                  {universe?.name ?? movie.universeId}
                </span>
                <span class="text-[10px] text-slate-400 font-mono">
                  公開: {movie.releaseYear}年
                </span>
              </div>

              <h4 class="text-base font-bold text-white leading-tight">
                {movie.title.ja}
              </h4>
              <p class="text-[11px] text-slate-400">
                {movie.title.en}
              </p>

              <button
                type="button"
                onclick={() => onToggleWatch(movie.id)}
                class="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all w-fit
                  {isWatched
                    ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-md shadow-cyan-500/20'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600'}"
              >
                <span>{isWatched ? '✓ この映画は視聴済み' : '○ この映画を視聴済みにする'}</span>
              </button>
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}
