import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { AudioPlayer } from '../components/AudioPlayer';
import { Colors } from '../constants/colors';

export const PlayerScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background.primary} />
      
      <View style={styles.header}>
        <Text style={styles.appName}>Hybrid Player Demo</Text>
        <Text style={styles.secondaryText}>React Native UI + Native {Platform.OS == 'ios' ? 'iOS' : 'Android'} Player</Text>
      </View>
      
      <AudioPlayer />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.mediumGray,
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  secondaryText: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
  },
  activeTab: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary.blue,
    paddingBottom: 4,
  },
  inactiveTab: {
    fontSize: 18,
    fontWeight: '400',
    color: Colors.text.secondary,
    paddingBottom: 4,
  },
});
