<script lang="ts">
  import { BaseEdge, getBezierPath, type EdgeProps } from '@xyflow/svelte';
  import type { EventRelationType } from '../../types/timeline';

  let {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
    style = ''
  }: EdgeProps = $props();

  const relationType: EventRelationType = $derived(data?.relationType ?? 'chronological');
  const isTimeTravel = $derived(relationType === 'time_travel');
  const isBranch = $derived(relationType === 'multiverse_branch' || relationType === 'crossover');
  const isHighlighted = $derived(data?.isHighlighted ?? false);
  const isDimmed = $derived(data?.isDimmed ?? false);

  // 過去への時間跳躍（targetX <= sourceX）の場合、上空を迂回するアーチ型放物線を描画
  const isRetrograde = $derived(isTimeTravel && targetX <= sourceX + 60);

  const [edgePath, labelX, labelY] = $derived.by(() => {
    if (isRetrograde) {
      const dx = targetX - sourceX;
      const dy = targetY - sourceY;
      // 過去へ戻るためのアーチの高さ
      const arcHeight = Math.max(100, Math.abs(dx) * 0.35 + 60);
      const controlY = Math.min(sourceY, targetY) - arcHeight;
      const path = `M ${sourceX} ${sourceY} C ${sourceX + 60} ${controlY}, ${targetX - 60} ${controlY}, ${targetX} ${targetY}`;
      return [path, (sourceX + targetX) / 2, controlY + 25];
    }

    return getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      curvature: isBranch ? 0.35 : 0.25
    });
  });

  // スタイル決定
  const strokeColor = $derived.by(() => {
    if (isHighlighted) return '#22d3ee'; // 超発光シアン
    if (isTimeTravel) return '#f59e0b'; // ゴールド
    if (isBranch) return '#ec4899';     // ネオンピンク/マゼンタ
    return '#06b6d4';                   // デフォルトシアン
  });

  const strokeWidth = $derived.by(() => {
    if (isHighlighted) return 3.5;
    if (isTimeTravel || isBranch) return 2.5;
    return 2;
  });

  const strokeDash = $derived.by(() => {
    if (isTimeTravel) return '6, 4';
    if (relationType === 'prerequisite') return '3, 3';
    return 'none';
  });

  const opacity = $derived.by(() => {
    if (isDimmed) return 0.12;
    if (isHighlighted) return 1.0;
    return 0.85;
  });
</script>

<!-- SVGフィルター & マーカー定義 -->
<defs>
  <!-- ネオングロー -->
  <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
    <feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="#06b6d4" flood-opacity="0.8" />
  </filter>
  <filter id="glow-gold" x="-20%" y="-20%" width="140%" height="140%">
    <feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="#f59e0b" flood-opacity="0.8" />
  </filter>
  <filter id="glow-pink" x="-20%" y="-20%" width="140%" height="140%">
    <feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="#ec4899" flood-opacity="0.8" />
  </filter>

  <!-- マーカー -->
  <marker id="arrow-cyan" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
    <path d="M 0 1 L 10 5 L 0 9 z" fill="#06b6d4" />
  </marker>
  <marker id="arrow-gold" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
    <path d="M 0 1 L 10 5 L 0 9 z" fill="#f59e0b" />
  </marker>
  <marker id="arrow-pink" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
    <path d="M 0 1 L 10 5 L 0 9 z" fill="#ec4899" />
  </marker>
</defs>

<!-- 背景グローパス（分岐や強調時） -->
{#if (isBranch || isHighlighted) && !isDimmed}
  <path
    d={edgePath}
    fill="none"
    stroke={isHighlighted ? '#06b6d4' : '#ec4899'}
    stroke-width={strokeWidth + 4}
    opacity="0.3"
    class="pointer-events-none blur-[2px]"
  />
{/if}

<!-- メインエッジ本体 -->
<BaseEdge
  {id}
  path={edgePath}
  style="{style}; stroke: {strokeColor}; stroke-width: {strokeWidth}px; stroke-dasharray: {strokeDash}; opacity: {opacity};"
  markerEnd={isTimeTravel ? 'url(#arrow-gold)' : isBranch ? 'url(#arrow-pink)' : 'url(#arrow-cyan)'}
  class="{isTimeTravel ? 'animate-pulse' : ''} {isHighlighted ? 'filter drop-shadow(0 0 6px #06b6d4)' : ''}"
/>

<!-- 時間跳躍や分岐線上を走る光の粒子（Nexus Spark） -->
{#if (isTimeTravel || isBranch || isHighlighted) && !isDimmed}
  <circle r="3" fill="#ffffff" class="pointer-events-none shadow-lg">
    <animateMotion dur={isTimeTravel ? '2.5s' : '3.5s'} repeatCount="indefinite" path={edgePath} />
  </circle>
{/if}

