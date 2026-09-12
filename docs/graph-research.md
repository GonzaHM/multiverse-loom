# Multiverse Loom: グラフ可視化技術リサーチ & 選定レポート

## 1. 結論・推奨構成

### 推奨: `@xyflow/svelte` (Svelte Flow) + `@dagrejs/dagre` (レイアウト)

```
+-------------------------------------------------------------------------------+
|                             MULTIVERSE LOOM STACK                             |
|                                                                               |
|  [ SvelteKit (Svelte 5 Runes) + Cloud Run + Firebase Hosting + Firestore ]     |
|                                     │                                         |
|                 ┌───────────────────┴───────────────────┐                     |
|                 ▼                                       ▼                     |
|       可視化エンジン:                               レイアウトエンジン:             |
|       @xyflow/svelte (v0.x/v1.x)            @dagrejs/dagre (Phase 1 / MVP)    |
|   - Svelte 5 Custom Nodes (純粋なDOM)       elkjs (Phase 2 / スイムレーン分割)  |
|   - モバイルピンチ/パン (d3-zoomベース)                                          |
|   - 1-Click SNS画像エクスポート (html-to-image)                                  |
+-------------------------------------------------------------------------------+
```

### なぜ Cytoscape や Vis-network ではなく `@xyflow/svelte` なのか？

1. **Svelte 5 Runes対応の完全なSvelteコンポーネントノード**:
   * 作品カード内にポスター画像、タイトル、公開年、フェーズバッジ、および「視聴済み切り替えボタン」を配置する要件において、Svelte Flowはノード自体が通常の `.svelte` コンポーネントとして動作する。
   * CytoscapeやVis-networkはHTML5 `<canvas>` 描画のため、リッチなHTMLオーバーレイ（`cytoscape-node-html-label`等）を載せるとモバイルでのズーム・パン時にラベルがズレて遅延（ジッター）し、ボタンのタップ判定も競合して壊れやすい。
2. **PWA・スマホ操作の快適性**:
   * d3-zoomをベースにしたCSS `transform3d` によるハードウェアアクセラレーションにより、スマホ実機でのピンチイン/アウト・パン操作が60fpsで滑らかに動作。
3. **SNSシェア（バイラル拡散）用画像出力**:
   * `html-to-image` を組み合わせることで、ユーザーがチェックを入れた状態の相関図をRetina解像度（高画質PNG）で瞬時にキャプチャし、X（Twitter）等へシェア可能。
4. **レイアウトエンジンの柔軟な切り替え**:
   * 描画とレイアウト計算が分離されているため、MVPでは高速・軽量な **Dagre**（左→右への時系列DAGレイアウト）を採用し、作品数が増えたフェーズ2で **ELK**（ユニバース別スイムレーン）へシームレスに拡張可能。

---

## 2. 比較検討マトリクス

| 評価項目 | `@xyflow/svelte` (Svelte Flow) | `cytoscape.js` (+ dagre) | `vis-network` |
| :--- | :--- | :--- | :--- |
| **Svelte 5 親和性** | ⭐⭐⭐⭐⭐ ネイティブ対応（`$state`, `$props`） | ⭐⭐⭐ `onMount`での手動バインド必須 | ⭐⭐ レガシー命令的API |
| **SSR 安全性** | ⭐⭐⭐⭐⭐ `browser` / `onMount` で安全に分離 | ⭐⭐⭐ canvasのSSRガード必須 | ⭐⭐⭐ canvasのSSRガード必須 |
| **ノード表現力 (HTML/Tailwind)** | ⭐⭐⭐⭐⭐ **最高**: Svelteコンポーネントそのもの | ⭐⭐ 低: Canvas描画のためHTMLオーバーレイが不安定 | ⭐ 極低: ほぼCanvas描画のみ |
| **スマホ/PWA タッチ操作** | ⭐⭐⭐⭐⭐ 滑らかなピンチ/パン/タップ | ⭐⭐⭐⭐ Canvas操作は良いがHTMLラベルが遅延 | ⭐⭐⭐ 慣性スクロール・ピンチがぎこちない |
| **SNS用画像エクスポート** | ⭐⭐⭐⭐⭐ `html-to-image` で完全出力 | ⭐⭐ Canvasのみ出力されHTMLラベルが消える | ⭐⭐ DOM要素を含められない |
| **バンドルサイズ (gzip)** | 約 45 KB | 約 110 KB (プラグイン含む) | 約 125 KB |

