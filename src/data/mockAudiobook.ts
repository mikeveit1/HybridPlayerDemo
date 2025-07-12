import { ImageSourcePropType } from 'react-native';

export const mockAudiobook = {
  audiobook: {
    id: "react_native_in_action",
    title: "React Native in Action", 
    author: "Nader Dabit",
    narrator: "Eleven Labs",
    coverArt: require('../assets/audiobook-cover.jpg') as ImageSourcePropType,
    chapters: [
      {
        id: "ch_001",
        title: "Getting Started with React Native",
        duration: 7,
        audioFile: 'https://drive.google.com/uc?id=1N24ZOE1kk7Ue3VYILo7TQDxWuJIUuGID&export=download'
      },
      {
        id: "ch_002", 
        title: "Understanding React", 
        duration: 6,
        audioFile: 'https://drive.google.com/uc?id=1UrXWPt_XpA8GH7Yh-VFi6tbLvnp9AbFR&export=download'
      },
      {
        id: "ch_003",
        title: "Building Your First App",
        duration: 5,
        audioFile: 'https://drive.google.com/uc?id=1zEcnqRC4l5coW8zVwSKkQIL8zugLzXvY&export=download'
      },
    ]
  }
};
