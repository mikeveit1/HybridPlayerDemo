import { ImageSourcePropType } from 'react-native';

export const mockAudiobook = {
  audiobook: {
    id: "react_native_in_action",
    title: "React Native in Action",
    author: "Nader Dabit",
    narrator: "Eleven Labs",
    description: "Developing iOS and Android apps with JavaScript. Learn to build cross-platform mobile applications using React Native.",
    duration: 18,
    coverArt: require('../assets/images/audiobook-cover.jpg') as ImageSourcePropType,
    publishDate: "2019-03-01T00:00:00Z",
    language: "en-US",
    genre: "Technology",
    isbn: "978-1617294051",
    chapters: [
      {
        id: "ch_001",
        title: "Getting Started with React Native",
        startTime: 0,
        duration: 7,
        audioFile: require('../assets/audio/chapter1.mp3')
      },
      {
        id: "ch_002", 
        title: "Understanding React", 
        startTime: 7,
        duration: 6,
        audioFile: require('../assets/audio/chapter2.mp3')
      },
      {
        id: "ch_003",
        title: "Building Your First App",
        startTime: 13,
        duration: 5,
        audioFile: require('../assets/audio/chapter3.mp3')
      },
    ],
    playbackInfo: {
      bitrate: 128,
      format: "mp3",
    },
    userProgress: {
      currentPosition: 0,
      currentChapter: "ch_001",
      bookmarkedPositions: [],
      completedChapters: [],
      lastPlayedAt: null
    },
    metadata: {
      fileSize: 115200,
      downloadable: true,
      streamingRequired: false,
      drm: false,
      tags: ["react-native", "mobile-development", "javascript", "ios", "android"]
    }
  }
};
