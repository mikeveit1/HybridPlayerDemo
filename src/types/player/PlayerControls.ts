export interface PlayerControls {
    play: () => Promise<void>;
    pause: () => Promise<void>;
    stop: () => Promise<void>;
    seek: (position: number) => Promise<void>;
    setVolume: (volume: number) => Promise<void>;
    nextChapter: () => Promise<void>;
    previousChapter: () => Promise<void>;
  }