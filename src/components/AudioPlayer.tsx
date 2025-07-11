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
} from 'react-native';
import { Colors } from '../constants/colors';
import { useAudiobook } from '../hooks/useAudiobook';
import { PlayerState } from '../types';

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
  }, [currentChapter]);

  const setupNativeEventListeners = () => {
    if (!AudioPlayerModule) return;
    
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

    setPlayerState(prev => ({ ...prev, isLoading: true, playbackState: 'loading' }));

    try {
      const trackData = {
        url: currentChapter.audioUrl,
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
    if (audiobook && currentChapterIndex < audiobook.audiobook.chapters.length - 1) {
      setCurrentChapterIndex(prev => prev + 1);
    }
  };

  const previousChapter = async () => {
    if (currentChapterIndex > 0) {
      setCurrentChapterIndex(prev => prev - 1);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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

  return (
    <View style={styles.container}>
      <View style={styles.architectureBadge}>
        <Text style={styles.architectureText}>
          React Native UI + Native {Platform.OS.toUpperCase()} Audio
        </Text>
      </View>

      <View style={styles.trackInfo}>
        <Text style={styles.trackTitle}>{audiobook.audiobook.title}</Text>
        <Text style={styles.trackSubtitle}>{currentChapter.title}</Text>
        <Text style={styles.authorText}>by {audiobook.audiobook.author}</Text>
        <Text style={styles.narratorText}>Narrated by {audiobook.audiobook.narrator}</Text>
      </View>

      <View style={styles.progressContainer}>
        <Text style={styles.timeText}>{formatTime(playerState.position)}</Text>
        <TouchableOpacity 
          style={styles.progressBar}
          onPress={(e) => {
            const { locationX } = e.nativeEvent;
            const progressBarWidth = 200;
            const newPosition = (locationX / progressBarWidth) * playerState.duration;
            seek(newPosition);
          }}
        >
          <View style={styles.progressTrack}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${Math.min((playerState.position / playerState.duration) * 100, 100)}%` }
              ]} 
            />
          </View>
        </TouchableOpacity>
        <Text style={styles.timeText}>{formatTime(playerState.duration)}</Text>
      </View>

      <View style={styles.controlsContainer}>
        <TouchableOpacity 
          style={[styles.controlButton, currentChapterIndex === 0 && styles.disabledButton]}
          onPress={previousChapter}
          disabled={currentChapterIndex === 0}
        >
          <Text style={styles.controlButtonText}>⏮</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.controlButton}
          onPress={() => seek(Math.max(0, playerState.position - 15))}
        >
          <Text style={styles.skipText}>-15s</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.controlButton, styles.playButton]}
          onPress={playerState.isPlaying ? pause : play}
          disabled={playerState.isLoading || playerState.playbackState === 'error'}
        >
          {playerState.isLoading ? (
            <ActivityIndicator size="small" color={Colors.text.inverse} />
          ) : (
            <Text style={styles.playButtonText}>
              {playerState.isPlaying ? '⏸' : '▶️'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.controlButton}
          onPress={() => seek(Math.min(playerState.duration, playerState.position + 30))}
        >
          <Text style={styles.skipText}>+30s</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.controlButton, 
            currentChapterIndex === audiobook.audiobook.chapters.length - 1 && styles.disabledButton
          ]}
          onPress={nextChapter}
          disabled={currentChapterIndex === audiobook.audiobook.chapters.length - 1}
        >
          <Text style={styles.controlButtonText}>⏭</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.chapterInfo}>
        <Text style={styles.chapterInfoText}>
          Chapter {currentChapterIndex + 1} of {audiobook.audiobook.chapters.length}
        </Text>
      </View>

      <View style={styles.bridgeContainer}>
        <Text style={styles.bridgeTitle}>Bridge Architecture:</Text>
        <Text style={styles.bridgeText}>• RN sends audiobook data to native</Text>
        <Text style={styles.bridgeText}>• Native {Platform.OS} handles audio playback</Text>
        <Text style={styles.bridgeText}>• Progress events flow back to RN UI</Text>
        <Text style={styles.bridgeText}>• Best of both: RN flexibility + Native performance</Text>
      </View>

      {playerState.error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{playerState.error}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  errorText: {
    color: Colors.status.error,
    fontSize: 16,
    textAlign: 'center',
  },
  architectureBadge: {
    backgroundColor: Colors.primary.orange,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    alignSelf: 'center',
    marginBottom: 30,
  },
  architectureText: {
    color: Colors.text.inverse,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  trackInfo: {
    alignItems: 'center',
    marginBottom: 40,
  },
  trackTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  trackSubtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 4,
  },
  authorText: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  narratorText: {
    fontSize: 12,
    color: Colors.text.light,
    fontStyle: 'italic',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
  },
  timeText: {
    fontSize: 14,
    color: Colors.text.secondary,
    minWidth: 45,
    textAlign: 'center',
  },
  progressBar: {
    flex: 1,
    marginHorizontal: 15,
    paddingVertical: 10,
  },
  progressTrack: {
    height: 8,
    backgroundColor: Colors.neutral.mediumGray,
    borderRadius: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary.orange,
    borderRadius: 4,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 6,
    shadowColor: Colors.shadow.light,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 3,
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary.orange,
    marginHorizontal: 12,
  },
  controlButtonText: {
    fontSize: 20,
    color: Colors.text.primary,
  },
  playButtonText: {
    fontSize: 28,
    color: Colors.text.inverse,
  },
  skipText: {
    fontSize: 12,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: Colors.neutral.lightGray,
  },
  chapterInfo: {
    alignItems: 'center',
    marginBottom: 30,
  },
  chapterInfoText: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  bridgeContainer: {
    backgroundColor: Colors.background.secondary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  bridgeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  bridgeText: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  errorBanner: {
    backgroundColor: Colors.status.error,
    padding: 12,
    borderRadius: 8,
  },
  errorBannerText: {
    color: Colors.text.inverse,
    fontSize: 14,
    textAlign: 'center',
  },
});
