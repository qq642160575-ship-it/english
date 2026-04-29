export interface WordItem {
  en: string;
  zh: string;
  ipa: string;
  ib: number[];
  category?: string;
  difficulty?: 1 | 2 | 3;
  chapter?: number;
}

export interface ChapterMeta {
  chapter: number;
  title: string;
  count: number;
}

export interface SentenceWordIpa {
  ipa: string;
  ib: number[];
}

export interface SentenceItem {
  en: string;
  zh: string;
  iw: SentenceWordIpa[];
  category?: string;
  difficulty?: 1 | 2 | 3;
}

export type LearningItem = WordItem | SentenceItem;
export type LearningMode = "word" | "sentence";

export interface CharResult {
  char: string;
  correct: boolean;
}

export interface GameStats {
  letters: number;
  correct: number;
  errors: number;
}

export interface GameState {
  mode: LearningMode;
  index: number;
  chapter: number;
  input: CharResult[];
  target: string;
  isComplete: boolean;
  stats: GameStats;
  completedIndices: number[];
  category: string;
  wrongIndices: number[];
  revealedCount: number;
  revealedLetters: boolean[];
  wordErrorCount: number;
}

export interface ChapterProgress {
  index: number;
  completed: number[];
}

export interface DataCategoryMeta {
  id: string;
  type: "word" | "sentence";
  title: string;
  description: string;
  difficulty: 1 | 2 | 3;
  tags: string[];
  itemCount: number;
  isBuiltin: boolean;
}

export interface DataPack {
  meta: DataCategoryMeta;
  items: WordItem[] | SentenceItem[];
}

export interface StoredProgress {
  word: Record<string, Record<string, ChapterProgress>>;
  sentence: Record<string, Record<string, ChapterProgress>>;
}

export interface DailyGoalData {
  newWordsPerDay: number;
  reviewPerDay: number;
  todayNewCount: number;
  todayReviewCount: number;
  date: string;
}

export function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
