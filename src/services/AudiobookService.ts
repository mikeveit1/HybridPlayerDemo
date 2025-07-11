import { AudiobookResponse } from '../types';
import { mockAudiobook } from '../data/mockAudiobook';

export class AudiobookService {
  static async getAudiobook(id: string): Promise<AudiobookResponse> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (id !== mockAudiobook.audiobook.id) {
      throw new Error(`Audiobook with id ${id} not found`);
    }
    
    return mockAudiobook as unknown as AudiobookResponse;
  }
  
  static async getCurrentAudiobook(): Promise<AudiobookResponse> {
    return this.getAudiobook('react_native_in_action');
  }
}
