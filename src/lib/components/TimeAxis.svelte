<script lang="ts">
  import {
    DEFAULT_START_YEAR,
    DEFAULT_END_YEAR,
    DEFAULT_YEAR_SCALE,
    getYearX
  } from '../layout/chronological-layout';

  let {
    franchiseColor = '#06b6d4',
    startYear = DEFAULT_START_YEAR,
    endYear = DEFAULT_END_YEAR,
    yearScale = DEFAULT_YEAR_SCALE,
    nullTimeX = (DEFAULT_END_YEAR - DEFAULT_START_YEAR + 4) * DEFAULT_YEAR_SCALE
  } = $props<{
    franchiseColor?: string;
    startYear?: number;
    endYear?: number;
    yearScale?: number;
    nullTimeX?: number;
  }>();

  // 10年刻みの主目盛り（Major Ticks）
  const majorYears = $derived.by(() => {
    const list: number[] = [];
    const firstDecade = Math.ceil(startYear / 10) * 10;
    for (let y = firstDecade; y <= endYear; y += 10) {
      list.push(y);
    }
    return list;
  });

  // 5年刻みの副目盛り（Minor Ticks: 10年の倍数を除く）
  const minorYears = $derived.by(() => {
    const list: number[] = [];
    const firstFive = Math.ceil(startYear / 5) * 5;
    for (let y = firstFive; y <= endYear; y += 5) {
      if (y % 10 !== 0) {
        list.push(y);
      }
    }
    return list;
  });

  // キーマイルストーン年（MCUで重要な年）
  const keyYears = [
    { year: 1942, label: '1942 (大戦 & キューブ)' },
    { year: 1970, label: '1970 (キャンプ・レハイ)' },
    { year: 2012, label: '2012 (NY決戦 & 分岐)' },
    { year: 2023, label: '2023 (指パッチン)' },
    { year: 2024, label: '2024 (三世代集結)' }
  ];

  const minX = $derived(getYearX(startYear, startYear, yearScale, endYear) - 300);
  const maxX = $derived(nullTimeX + 500);
  const totalWidth = $derived(maxX - minX);
</script>

<!-- Svelte Flow ビューポート内（ワールド座標系）に展開される水平時間軸 -->
<div
  class="pointer-events-none select-none z-0"
  style="position: absolute; left: 0; top: 0; width: 0; height: 0; overflow: visible;"
>
  <svg
    class="overflow-visible pointer-events-none"
    style="position: absolute; left: {minX}px; top: -500px; width: {totalWidth}px; height: 1000px; overflow: visible;"
    viewBox="{minX} -500 {totalWidth} 1000"
  >
    <defs>
      <!-- 水平ラインのネオングローフィルター -->
      <filter id="axis-glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>

      <!-- 時間の外側ゾーンのグラデーション -->
      <linearGradient id="tva-zone-grad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.03" />
        <stop offset="100%" stop-color="#f59e0b" stop-opacity="0.15" />
      </linearGradient>

      <!-- タイムライン水平ビームのグラデーション -->
      <linearGradient id="timeline-beam" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.1" />
        <stop offset="5%" stop-color="#06b6d4" stop-opacity="0.8" />
        <stop offset="85%" stop-color="#06b6d4" stop-opacity="0.9" />
        <stop offset="95%" stop-color="#f59e0b" stop-opacity="0.9" />
        <stop offset="100%" stop-color="#f59e0b" stop-opacity="0.2" />
      </linearGradient>
    </defs>

    <!-- 時間の外側（TVA / Null-Time）の領域ハイライト背景 -->
    <rect
      x={nullTimeX - 80}
      y="-420"
      width="500"
      height="840"
      fill="url(#tva-zone-grad)"
      rx="16"
      stroke="#f59e0b"
      stroke-width="1"
      stroke-opacity="0.25"
      stroke-dasharray="6,6"
    />

    <!-- 背景の縦グリッド破線（10年ごとの主目盛りから上下に貫通） -->
    {#each majorYears as year}
      {@const x = getYearX(year, startYear, yearScale, endYear)}
      <line
        x1={x}
        y1="-440"
        x2={x}
        y2="440"
        stroke="#334155"
        stroke-width="1"
        stroke-dasharray="4,6"
        stroke-opacity="0.45"
      />
    {/each}

    <!-- 背景の縦グリッド破線（5年ごとの副目盛り） -->
    {#each minorYears as year}
      {@const x = getYearX(year, startYear, yearScale, endYear)}
      <line
        x1={x}
        y1="-320"
        x2={x}
        y2="320"
        stroke="#1e293b"
        stroke-width="1"
        stroke-dasharray="2,6"
        stroke-opacity="0.3"
      />
    {/each}

    <!-- メイン水平軸（Y = 0）のバックグロー -->
    <line
      x1={minX}
      y1="0"
      x2={maxX}
      y2="0"
      stroke="#06b6d4"
      stroke-width="6"
      stroke-opacity="0.2"
      filter="url(#axis-glow)"
    />

    <!-- メイン水平軸（Y = 0）の実線ライン -->
    <line
      x1={minX}
      y1="0"
      x2={maxX}
      y2="0"
      stroke="url(#timeline-beam)"
      stroke-width="2.5"
    />

    <!-- キャンバス内の中央時間軸バッジ（画面と一緒に完全に動く！） -->
    <g transform="translate({getYearX(1985, startYear, yearScale, endYear)}, 0)">
      <rect
        x="-145"
        y="-14"
        width="290"
        height="28"
        rx="14"
        fill="#020617"
        fill-opacity="0.92"
        stroke="#06b6d4"
        stroke-width="1.5"
        filter="url(#axis-glow)"
      />
      <circle cx="-122" cy="0" r="4" fill="#22d3ee" />
      <text
        x="-106"
        y="4"
        fill="#a5f3fc"
        font-family="monospace"
        font-size="11"
        font-weight="bold"
        letter-spacing="2px"
      >
        TIME AXIS ── 時間軸
      </text>
      <text
        x="60"
        y="4"
        fill="#64748b"
        font-family="monospace"
        font-size="9"
      >
        (過去 ➔ 未来)
      </text>
    </g>

    <!-- 10年刻みの主目盛り（Ticks） & 西暦ラベル -->
    {#each majorYears as year}
      {@const x = getYearX(year, startYear, yearScale, endYear)}
      <!-- 上下目盛り線 -->
      <line
        x1={x}
        y1="-16"
        x2={x}
        y2="16"
        stroke="#22d3ee"
        stroke-width="2"
      />
      <!-- 中央のドット -->
      <circle cx={x} cy="0" r="3" fill="#0891b2" stroke="#22d3ee" stroke-width="1" />
      <!-- 西暦ラベル（下側） -->
      <text
        x={x}
        y="36"
        text-anchor="middle"
        fill="#a5f3fc"
        font-family="monospace"
        font-size="13"
        font-weight="bold"
        letter-spacing="1px"
      >
        {year}
      </text>
    {/each}

    <!-- 5年刻みの副目盛り（Ticks） & 西暦ラベル -->
    {#each minorYears as year}
      {@const x = getYearX(year, startYear, yearScale, endYear)}
      <!-- 上下目盛り線 -->
      <line
        x1={x}
        y1="-9"
        x2={x}
        y2="9"
        stroke="#64748b"
        stroke-width="1.5"
      />
      <!-- 小さな西暦ラベル -->
      <text
        x={x}
        y="28"
        text-anchor="middle"
        fill="#64748b"
        font-family="monospace"
        font-size="10"
      >
        {year}
      </text>
    {/each}

    <!-- MCUキー年代のアクセントマーカー -->
    {#each keyYears as item}
      {@const x = getYearX(item.year, startYear, yearScale, endYear)}
      <!-- 小さなハイライトドット -->
      <circle
        cx={x}
        cy="0"
        r="4.5"
        fill="#f43f5e"
        stroke="#ffffff"
        stroke-width="1.5"
      />
      <text
        x={x}
        y="-12"
        text-anchor="middle"
        fill="#fda4af"
        font-family="monospace"
        font-size="9"
        font-weight="bold"
      >
        {item.year}
      </text>
    {/each}

    <!-- 時間の外側 (End of Time) 特別マーカー -->
    <g transform="translate({nullTimeX}, 0)">
      <!-- 垂直境界線 -->
      <line
        x1="0"
        y1="-420"
        x2="0"
        y2="420"
        stroke="#f59e0b"
        stroke-width="2"
        stroke-dasharray="6,4"
        stroke-opacity="0.8"
      />
      <circle cx="0" cy="0" r="6" fill="#f59e0b" stroke="#ffffff" stroke-width="2" />

      <!-- バッジテキスト -->
      <text
        x="18"
        y="5"
        fill="#fcd34d"
        font-family="monospace"
        font-size="12"
        font-weight="bold"
        letter-spacing="1px"
      >
        ⚡ TVA / 時間の外側 (NULL-TIME)
      </text>
      <text
        x="18"
        y="22"
        fill="#d97706"
        font-family="sans-serif"
        font-size="9"
      >
        時の終わりの城・神聖時間軸解放
      </text>
    </g>

    <!-- タイムラインの始点・終点アノテーション -->
    <text
      x={minX + 80}
      y="-14"
      fill="#64748b"
      font-family="monospace"
      font-size="11"
      letter-spacing="1.5px"
    >
      ◀ 過去 (PAST: 1940s)
    </text>
  </svg>
</div>
