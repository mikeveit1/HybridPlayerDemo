import { useState, useEffect } from 'react';
import { AudiobookResponse } from '../types';
import { AudiobookService } from '../services/AudiobookService';

export const useAudiobook = () => {
  const [audiobook, setAudiobook] = useState<AudiobookResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAudiobook();
  }, []);

  const loadAudiobook = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await AudiobookService.getCurrentAudiobook();
      setAudiobook(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audiobook');
    } finally {
      setLoading(false);
    }
  };

  return {
    audiobook,
    loading,
    error,
    refetch: loadAudiobook,
  };
};
