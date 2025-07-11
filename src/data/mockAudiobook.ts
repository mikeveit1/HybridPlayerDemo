import { ImageSourcePropType } from 'react-native';

export const mockAudiobook = {
  audiobook: {
    id: "react_native_in_action",
    title: "React Native in Action", 
    author: "Nader Dabit",
    narrator: "Eleven Labs",
    coverArt: require('../assets/images/audiobook-cover.jpg') as ImageSourcePropType,
    chapters: [
      {
        id: "ch_001",
        title: "Getting Started with React Native",
        duration: 7,
        audioFile: require('../assets/audio/chapter1.mp3')
      },
      {
        id: "ch_002", 
        title: "Understanding React", 
        duration: 6,
        audioFile: require('../assets/audio/chapter2.mp3')
      },
      {
        id: "ch_003",
        title: "Building Your First App",
        duration: 5,
        audioFile: require('../assets/audio/chapter3.mp3')
      },
    ]
  }
};
