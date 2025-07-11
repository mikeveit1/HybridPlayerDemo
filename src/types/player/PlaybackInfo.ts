import { QualityLevel } from "./QualityLevel";

export interface PlaybackInfo {
    bitrate: number;
    format: string;
    qualityLevels: {
      high: QualityLevel;
      medium: QualityLevel;
      low?: QualityLevel;
    };
  }