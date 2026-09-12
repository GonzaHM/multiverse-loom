import { toPng } from 'html-to-image';

export async function exportTimelineAsPng(
  selector: string = '.svelte-flow__viewport',
  fileName: string = 'multiverse-loom-progress.png'
): Promise<boolean> {
  const node = document.querySelector(selector) as HTMLElement | null;
  if (!node) {
    alert('グラフの描画領域が見つかりませんでした。');
    return false;
  }

  try {
    const dataUrl = await toPng(node, {
      backgroundColor: '#020617',
      quality: 0.95,
      pixelRatio: 2, // 高解像度（Retina）
      filter: (domNode: HTMLElement) => {
        // コントロールやミニマップは画像から除外
        return (
          !domNode.classList?.contains('svelte-flow__controls') &&
          !domNode.classList?.contains('svelte-flow__minimap')
        );
      }
    });

    const link = document.createElement('a');
    link.download = fileName;
    link.href = dataUrl;
    link.click();
    return true;
  } catch (err) {
    console.error('画像生成に失敗しました:', err);
    alert('画像の生成中にエラーが発生しました。');
    return false;
  }
}

