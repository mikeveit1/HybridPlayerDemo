import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  NativeModules,
  NativeEventEmitter,
  Image,
  ScrollView,
} from 'react-native';
import { Colors } from '../constants/colors';
import { useAudiobook } from '../hooks/useAudiobook';
import { PlayerState } from '../types';
import { formatTime } from '../assets/utils/formatTime';

const { AudioPlayerModule } = NativeModules;

export const AudioPlayer: React.FC = () => {
  const { audiobook, loading: audiobookLoading, error: audiobookError } = useAudiobook();
  
  const [playerState, setPlayerState] = useState<PlayerState>({
    isPlaying: false,
    position: 0,
    duration: 0,
    volume: 1.0,
    playbackState: 'idle',
    currentTrack: null,
    isLoading: false,
    error: null,
  });

  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const eventEmitter = useRef<NativeEventEmitter | null>(null);

  const currentChapter = audiobook?.audiobook.chapters[currentChapterIndex];

  useEffect(() => {
    if (currentChapter && AudioPlayerModule) {
      setupNativeEventListeners();
      loadTrackInNativePlayer();
    }
    return cleanupEventListeners;
  }, [currentChapter, currentChapterIndex]);

  const setupNativeEventListeners = () => {
    if (!AudioPlayerModule) return;
    
    cleanupEventListeners();
    
    eventEmitter.current = new NativeEventEmitter(AudioPlayerModule);
    
    eventEmitter.current.addListener('onPlaybackStateChanged', (data) => {
      setPlayerState(prev => ({ 
        ...prev, 
        playbackState: data.state,
        isPlaying: data.state === 'playing'
      }));
    });

    eventEmitter.current.addListener('onProgressUpdate', (data) => {
      setPlayerState(prev => ({ 
        ...prev, 
        position: data.position,
        duration: data.duration || prev.duration
      }));
    });

    eventEmitter.current.addListener('onTrackLoaded', (data) => {
      setPlayerState(prev => ({ 
        ...prev, 
        duration: data.duration,
        isLoading: false,
        playbackState: 'idle',
        currentTrack: currentChapter?.id || null
      }));
    });

    eventEmitter.current.addListener('onError', (data) => {
      setPlayerState(prev => ({ 
        ...prev, 
        error: data.message,
        playbackState: 'error',
        isLoading: false
      }));
    });
  };

  const cleanupEventListeners = () => {
    if (eventEmitter.current) {
      eventEmitter.current.removeAllListeners('onPlaybackStateChanged');
      eventEmitter.current.removeAllListeners('onProgressUpdate');
      eventEmitter.current.removeAllListeners('onTrackLoaded');
      eventEmitter.current.removeAllListeners('onError');
    }
  };

  const loadTrackInNativePlayer = async () => {
    if (!currentChapter || !AudioPlayerModule) {
      setPlayerState(prev => ({
        ...prev,
        error: `Native ${Platform.OS} audio module not available`,
        playbackState: 'error',
      }));
      return;
    }

    setPlayerState(prev => ({ 
      ...prev, 
      isLoading: true, 
      playbackState: 'loading',
      position: 0
    }));

    try {
      const audioSource = Image.resolveAssetSource(currentChapter.audioFile);
      
      const trackData = {
        url: audioSource.uri,
        title: currentChapter.title,
        duration: currentChapter.duration,
        chapterIndex: currentChapterIndex,
        totalChapters: audiobook?.audiobook.chapters.length || 0,
        bookMetadata: {
          title: audiobook?.audiobook.title,
          author: audiobook?.audiobook.author,
          narrator: audiobook?.audiobook.narrator,
        }
      };

      await AudioPlayerModule.loadTrack(trackData);
    } catch (error) {
      console.error('Failed to load track in native player:', error);
      setPlayerState(prev => ({
        ...prev,
        isLoading: false,
        error: `Failed to load audio in native ${Platform.OS} player`,
        playbackState: 'error',
      }));
    }
  };

  const play = async () => {
    if (!AudioPlayerModule) return;
    
    try {
      await AudioPlayerModule.play();
    } catch (error) {
      console.error('Native play failed:', error);
      setPlayerState(prev => ({ ...prev, error: 'Playback failed' }));
    }
  };

  const pause = async () => {
    if (!AudioPlayerModule) return;
    
    try {
      await AudioPlayerModule.pause();
    } catch (error) {
      console.error('Native pause failed:', error);
    }
  };

  const seek = async (position: number) => {
    if (!AudioPlayerModule) return;
    
    try {
      await AudioPlayerModule.seek(position);
    } catch (error) {
      console.error('Native seek failed:', error);
    }
  };

  const nextChapter = async () => {
    if (playerState.isPlaying) {
      await pause();
    }
    
    if (audiobook && currentChapterIndex < audiobook.audiobook.chapters.length - 1) {
      setCurrentChapterIndex(prev => prev + 1);
    }
  };

  const previousChapter = async () => {
    if (playerState.isPlaying) {
      await pause();
    }
    
    if (currentChapterIndex > 0) {
      setCurrentChapterIndex(prev => prev - 1);
    }
  };

  if (audiobookLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary.orange} />
          <Text style={styles.loadingText}>Loading audiobook...</Text>
        </View>
      </View>
    );
  }

  if (audiobookError || !audiobook || !currentChapter) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{audiobookError || 'Failed to load audiobook'}</Text>
        </View>
      </View>
    );
  }

  // Calculate time remaining
  const totalDuration = audiobook.audiobook.chapters.reduce((acc, chapter) => acc + chapter.duration, 0);
  const remainingTime = totalDuration - (playerState.position + 
    audiobook.audiobook.chapters.slice(0, currentChapterIndex).reduce((acc, chapter) => acc + chapter.duration, 0));

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Card */}
      <View style={styles.heroCard}>
        <View style={styles.coverContainer}>
          <Image 
            source={audiobook.audiobook.coverArt as any}
            style={styles.coverArt}
            resizeMode="cover"
          />
          <View style={styles.audioIndicator}>
            <Text style={styles.audioIcon}>🎧</Text>
          </View>
        </View>
        
        <View style={styles.bookInfo}>
          <Text style={styles.bookTitle}>{audiobook.audiobook.title}</Text>
          <Text style={styles.authorName}>{audiobook.audiobook.author}</Text>
          
          <View style={styles.timeRemaining}>
            <Text style={styles.timeIcon}>⏱</Text>
            <Text style={styles.timeText}>{Math.ceil(remainingTime)} sec left</Text>
          </View>
        </View>
      </View>

      {/* Now Playing */}
      <View style={styles.nowPlayingCard}>
        <Text style={styles.sectionTitle}>Now Playing</Text>
        <Text style={styles.chapterTitle}>{currentChapter.title}</Text>
        <Text style={styles.narratorText}>Narrated by {audiobook.audiobook.narrator}</Text>
        
        {/* Progress */}
        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${Math.min((playerState.position / playerState.duration) * 100, 100)}%` }
              ]} 
            />
          </View>
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>{formatTime(playerState.position)}</Text>
            <Text style={styles.timeText}>{formatTime(playerState.duration)}</Text>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity 
            style={[styles.controlButton, currentChapterIndex === 0 && styles.disabledButton]}
            onPress={previousChapter}
            disabled={currentChapterIndex === 0}
          >
            <Text style={styles.controlIcon}>⏮</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.playButton}
            onPress={playerState.isPlaying ? pause : play}
            disabled={playerState.isLoading || playerState.playbackState === 'error'}
          >
            {playerState.isLoading ? (
              <ActivityIndicator size="small" color={Colors.text.inverse} />
            ) : (
              <Text style={styles.playIcon}>
                {playerState.isPlaying ? '⏸' : '▶️'}
              </Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.controlButton, 
              currentChapterIndex === audiobook.audiobook.chapters.length - 1 && styles.disabledButton
            ]}
            onPress={nextChapter}
            disabled={currentChapterIndex === audiobook.audiobook.chapters.length - 1}
          >
            <Text style={styles.controlIcon}>⏭</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Chapter List */}
      <View style={styles.chapterList}>
        <Text style={styles.sectionTitle}>Chapters</Text>
        {audiobook.audiobook.chapters.map((chapter, index) => (
          <TouchableOpacity
            key={chapter.id}
            style={[
              styles.chapterItem,
              index === currentChapterIndex && styles.activeChapterItem
            ]}
            onPress={() => setCurrentChapterIndex(index)}
          >
            <View style={styles.chapterInfo}>
              <Text style={[
                styles.chapterNumber,
                index === currentChapterIndex && styles.activeChapterText
              ]}>
                {index + 1}
              </Text>
              <View style={styles.chapterDetails}>
                <Text style={[
                  styles.chapterTitleText,
                  index === currentChapterIndex && styles.activeChapterText
                ]}>
                  {chapter.title}
                </Text>
                <Text style={styles.chapterDuration}>
                  {formatTime(chapter.duration)}
                </Text>
              </View>
            </View>
            {index === currentChapterIndex && playerState.isPlaying && (
              <Text style={styles.playingIndicator}>♪</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {playerState.error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{playerState.error}</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    color: Colors.status.error,
    fontSize: 16,
    textAlign: 'center',
  },
  heroCard: {
    flexDirection: 'row',
    backgroundColor: Colors.background.card,
    margin: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: Colors.shadow.light,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  coverContainer: {
    position: 'relative',
    marginRight: 16,
  },
  coverArt: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: Colors.neutral.lightGray,
  },
  audioIndicator: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    backgroundColor: Colors.primary.orange,
    borderRadius: 20,
    padding: 8,
  },
  audioIcon: {
    fontSize: 16,
  },
  bookInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  bookTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 8,
    lineHeight: 28,
  },
  authorName: {
    fontSize: 16,
    color: Colors.text.secondary,
    marginBottom: 16,
  },
  timeRemaining: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  nowPlayingCard: {
    backgroundColor: Colors.background.card,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  chapterTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  narratorText: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 20,
  },
  progressSection: {
    marginBottom: 24,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.neutral.mediumGray,
    borderRadius: 3,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary.orange,
    borderRadius: 3,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.neutral.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlIcon: {
    fontSize: 18,
    color: Colors.text.primary,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary.orange,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    fontSize: 24,
    color: Colors.text.inverse,
  },
  disabledButton: {
    backgroundColor: Colors.neutral.darkGray,
  },
  chapterList: {
    backgroundColor: Colors.background.card,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
  },
  chapterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.mediumGray,
  },
  activeChapterItem: {
    backgroundColor: Colors.neutral.darkGray,
    marginHorizontal: -20,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  chapterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  chapterNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginRight: 16,
    minWidth: 24,
  },
  activeChapterText: {
    color: Colors.primary.orange,
  },
  chapterDetails: {
    flex: 1,
  },
  chapterTitleText: {
    fontSize: 16,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  chapterDuration: {
    fontSize: 12,
    color: Colors.text.tertiary,
  },
  playingIndicator: {
    fontSize: 16,
    color: Colors.primary.orange,
  },
  errorBanner: {
    backgroundColor: Colors.status.error,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 16,
  },
  errorBannerText: {
    color: Colors.text.inverse,
    fontSize: 14,
    textAlign: 'center',
  },
});
