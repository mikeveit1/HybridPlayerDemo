import { Chapter } from '../audiobook/Chapter';

export interface AudiobookResponse {
  audiobook: {
    id: string;
    title: string;
    author: string;
    narrator: string;
    coverArt: any;
    chapters: Chapter[];
  };
}
