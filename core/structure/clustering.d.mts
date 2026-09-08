// Объявления типов для `clustering.mjs`.
//
// Файл заведён не ради строгости, а ради тишины механической проверки:
// без него `astro check` сайта отдаёт ts(7016) на импорте из ядра —
// «нет файла объявлений, тип неявно any». Ошибкой это не считается,
// подсказкой считается, а подсказка, появившаяся вместе с правкой,
// через месяц выглядит как чужая.

export interface ClusteringPhrase {
  phrase: string;
  cluster: string;
  google: number;
  googlePhrase: string;
  match: string;
  yoy: string;
  competition: string;
  aggregatorsPct: number;
  mainPages: number;
  toponym: string;
  urls: string[];
  ws: number;
}

export interface ClusteringCluster {
  name: string;
  phrases: number;
  google: number;
  rankGoogle: number;
  topPhrase: string;
  ws: number;
  rankWs: number;
}

export interface ClusteringUnmatched {
  phrase: string;
  cluster: string;
  ws: number;
}

export interface ClusteringMeta {
  source: string;
  sha256: string;
  phrases: number;
  clusters: number;
  unmatched: number;
}

export interface Clustering {
  meta: ClusteringMeta;
  phrases: ClusteringPhrase[];
  clusters: ClusteringCluster[];
  unmatched: ClusteringUnmatched[];
  legend: string[];
}

export declare const UNCLUSTERED: string;
export declare function readClustering(path: string): Clustering;
export declare function groupPhrases(phrases: ClusteringPhrase[]): Map<string, ClusteringPhrase[]>;
export declare function clusterUrls(list: ClusteringPhrase[]): string[];
export declare function splitUrls(raw: string): string[];
export declare function hostOf(url: string): string;
