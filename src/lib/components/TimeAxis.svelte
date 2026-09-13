<script lang="ts">
  let { franchiseColor = '#06b6d4' } = $props<{
    franchiseColor?: string;
  }>();
</script>

<!-- 画面上下の中心に配置される水平時間軸（Time Axis） -->
<div class="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 z-10 select-none flex flex-col items-center justify-center">
  <!-- 背景の薄いグラデーション光彩ゾーン -->
  <div
    class="absolute inset-x-0 h-16 bg-gradient-to-b from-transparent via-cyan-950/10 to-transparent pointer-events-none"
    style="--axis-color: {franchiseColor};"
  ></div>

  <!-- 水平ライン本体（両端フェードアウト・中央ネオン発光） -->
  <div class="relative w-full flex items-center">
    <!-- 左側ライン（フェードイン） -->
    <div class="flex-1 h-[2px] bg-gradient-to-r from-transparent via-cyan-500/40 to-cyan-400/70 shadow-[0_0_8px_rgba(6,182,212,0.4)]"></div>

    <!-- 中央のインジケーターバッジ -->
    <div class="shrink-0 mx-3 px-3 py-1 rounded-full bg-slate-950/90 border border-cyan-500/50 backdrop-blur-md shadow-lg shadow-cyan-500/20 flex items-center gap-2">
      <span class="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
      <span class="text-[10px] font-mono font-bold tracking-widest uppercase text-cyan-300">
        TIME AXIS ── 時間軸
      </span>
      <span class="text-[9px] font-mono text-slate-400 hidden sm:inline">
        ( 過去 ──► 未来 )
      </span>
    </div>

    <!-- 右側ライン（フェードアウト） -->
    <div class="flex-1 h-[2px] bg-gradient-to-r from-cyan-400/70 via-cyan-500/40 to-transparent shadow-[0_0_8px_rgba(6,182,212,0.4)]"></div>
  </div>

  <!-- 時間軸の目盛り（HUD調の等間隔目盛り） -->
  <div class="w-full flex justify-between px-8 sm:px-16 mt-1 text-[9px] font-mono text-slate-400/80">
    <div class="flex items-center gap-1">
      <span class="text-slate-400">◀ 過去 (PAST)</span>
      <span class="text-slate-500 hidden md:inline">| 1940s</span>
    </div>
    <div class="hidden sm:flex items-center gap-6 text-slate-500/70">
      <span>1970s</span>
      <span>2000s</span>
      <span>2012 (NY)</span>
      <span>2023 (Endgame)</span>
    </div>
    <div class="flex items-center gap-1">
      <span class="text-slate-500 hidden md:inline">2024+ |</span>
      <span class="text-cyan-400 font-semibold">未来・多元宇宙 (FUTURE) ▶</span>
    </div>
  </div>
</div>
