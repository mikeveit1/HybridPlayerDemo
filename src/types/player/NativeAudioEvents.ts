import { PlaybackState } from "./PlaybackState";
import { ProgressData } from "./ProgressData";

export interface NativeAudioEvents {
    onPlaybackStateChanged: (state: PlaybackState) => void;
    onProgressUpdate: (progress: ProgressData) => void;
    onError: (error: string) => void;
    onTrackLoaded: (duration: number) => void;
  }