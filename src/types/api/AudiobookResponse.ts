import { Chapter } from '../audiobook/Chapter';
import { PlaybackInfo } from '../player/PlaybackInfo';
import { UserProgress } from '../audiobook/UserProgress';

export interface AudiobookResponse {
  audiobook: {
    id: string;
    title: string;
    author: string;
    narrator: string;
    description: string;
    duration: number;
    coverArt: string;
    publishDate: string;
    language: string;
    genre: string;
    isbn: string;
    chapters: Chapter[];
    playbackInfo: PlaybackInfo;
    userProgress: UserProgress;
    metadata: {
      fileSize: number;
      downloadable: boolean;
      streamingRequired: boolean;
      drm: boolean;
      tags: string[];
    };
  };
}
