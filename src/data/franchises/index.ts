import type { FranchiseMetadata, MultiverseTimelineData } from '../../types/timeline';

import marvelData from './marvel.json';
import dcData from './dc.json';
import starWarsData from './star-wars.json';

/**
 * 映画シリーズ（フランチャイズ）のプラグイン型レジストリ
 * 新しいシリーズを追加する場合は、JSONを作成してこの配列に1件追加するだけで
 * UI、テーマ、ルーティング、相関図全体に自動反映されます。
 */
export const FRANCHISES: FranchiseMetadata[] = [
  {
    id: 'marvel',
    slug: 'marvel',
    title: {
      ja: 'マーベル・シネマティック・ユニバース',
      en: 'Marvel Cinematic Universe (MCU)'
    },
    tagline: {
      ja: '神聖時間軸から解き放たれた多元宇宙の相関図',
      en: 'The Sacred Timeline & The Multiverse Saga'
    },
    icon: '🦸‍♂️',
    theme: {
      primaryColor: '#E23636',
      accentColor: '#06B6D4',
      bgGradient: 'from-red-600 via-rose-600 to-indigo-700',
      badgeBorder: 'border-red-500/40',
      badgeBg: 'bg-red-500/20 text-red-300'
    },
    timelineData: marvelData as unknown as MultiverseTimelineData
  },
  {
    id: 'dc',
    slug: 'dc',
    title: {
      ja: 'DC マルチバース',
      en: 'DC Multiverse (DCEU & Elseworlds)'
    },
    tagline: {
      ja: 'DCEUからダークナイト、フラッシュポイントによる交差世界',
      en: 'From DCEU to Elseworlds & The Flashpoint Convergence'
    },
    icon: '🦇',
    theme: {
      primaryColor: '#0284C7',
      accentColor: '#EAB308',
      bgGradient: 'from-blue-700 via-sky-600 to-indigo-900',
      badgeBorder: 'border-sky-500/40',
      badgeBg: 'bg-sky-500/20 text-sky-300'
    },
    timelineData: dcData as unknown as MultiverseTimelineData
  },
  {
    id: 'star-wars',
    slug: 'star-wars',
    title: {
      ja: 'スター・ウォーズ正史タイムライン',
      en: 'Star Wars Canon Timeline'
    },
    tagline: {
      ja: 'プリクエルからスカイウォーカーの夜明け、マンダバースの銀河年代記',
      en: 'From the Clone Wars to the Fall of the Empire and Beyond'
    },
    icon: '⚔️',
    theme: {
      primaryColor: '#EAB308',
      accentColor: '#38BDF8',
      bgGradient: 'from-amber-600 via-yellow-600 to-slate-900',
      badgeBorder: 'border-amber-500/40',
      badgeBg: 'bg-amber-500/20 text-amber-300'
    },
    timelineData: starWarsData as unknown as MultiverseTimelineData
  }
];

export const DEFAULT_FRANCHISE_ID = 'marvel';

export function getFranchiseById(id: string): FranchiseMetadata {
  const found = FRANCHISES.find((f) => f.id === id || f.slug === id);
  return found ?? FRANCHISES[0];
}

