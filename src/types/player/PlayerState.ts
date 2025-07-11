import { PlaybackState } from "./PlaybackState";

export interface PlayerState {
  isPlaying: boolean;
  position: number;
  duration: number;
  volume: number;
  playbackState: PlaybackState;
  currentTrack: string | null;
  isLoading: boolean;
  error: string | null;
}
