export interface UserProgress {
  currentPosition: number;
  currentChapter: string;
  bookmarkedPositions: number[];
  completedChapters: string[];
  lastPlayedAt: string | null;
}
