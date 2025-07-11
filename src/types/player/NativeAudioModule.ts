export interface NativeAudioModule {
  initializePlayer(): Promise<void>;
  loadTrack(url: string): Promise<void>;
  play(): Promise<void>;
  pause(): Promise<void>;
  seek(position: number): Promise<void>;
  setVolume(volume: number): Promise<void>;
  getCurrentPosition(): Promise<number>;
  getDuration(): Promise<number>;
  release(): Promise<void>;
}
