export type ZombiesSaga = 'aether' | 'chaos';

export type GuideStatus = 'not-started' | 'in-progress' | 'completed';

export type GuideDifficulty = 'easy' | 'medium' | 'hard' | 'very-hard';

export type ContentStatus = 'verified' | 'draft' | 'pending';

export interface ZombiesGame {
  id: string;
  slug: string;
  title: string;
  shortTitle: string;

  /**
   * Numeral estilo logo oficial: Black Ops usa "palitos" (I, II, III) y, para
  */
  numeral: string;
  releaseYear: number;
  description: string;
  order: number;
}

export interface EasterEggStep {
  id: string;
  order: number;
  title: string;
  description: string;
  instructions: string[];
  tips?: string[];
  warnings?: string[];
  verification?: string[];
  imageUrl?: string;
  spoiler?: boolean;
}

export interface SideEasterEgg {
  id: string;
  title: string;
  summary: string;
  steps: string[];
  reward?: string;
}

export interface GuideSource {
  label: string;
  url: string;
}

export interface RecommendedLoadout {
  weapons?: string[];
  perks?: string[];
  consumables?: string[];
  note?: string;
}

export interface ZombiesMap {
  id: string;
  slug: string;
  gameId: string;
  name: string;
  saga: ZombiesSaga;
  mainQuestName?: string;
  hasMainQuest: boolean;
  description: string;
  summary?: string;
  prerequisites?: string[];
  recommendedLoadout?: RecommendedLoadout;
  imageUrl?: string;
  imageAlt?: string;
  imagePosition?: string;
  difficulty?: GuideDifficulty;
  estimatedMinutes?: number;
  minimumPlayers: number;
  maximumPlayers: number;
  soloAvailable: boolean;
  releaseOrder: number;
  remasterOf?: string;
  collection?: string;
  steps: EasterEggStep[];
  sideEasterEggs: SideEasterEgg[];
  mainQuestReward?: string[];
  commonMistakes?: string[];
  tips?: string[];
  contentStatus: ContentStatus;
  sources?: GuideSource[];
}

export interface ZombiesFilterCriteria {
  gameId: string | null;
  saga: ZombiesSaga | null;
  hasMainQuest: boolean | null;
  soloOnly: boolean;
  minimumPlayers: number | null;
  status: GuideStatus | null;
  search: string;
}

export interface MapProgress {
  mapId: string;
  contentVersion: number;
  completedStepIds: string[];
  updatedAt: string;
}

export const EMPTY_FILTER_CRITERIA: ZombiesFilterCriteria = {
  gameId: null,
  saga: null,
  hasMainQuest: null,
  soloOnly: false,
  minimumPlayers: null,
  status: null,
  search: '',
};
