import { AudiobookResponse } from '../types';
import mockAudiobook from '../data/mockAudiobook.json';

export class AudiobookService {
  static async getAudiobook(id: string): Promise<AudiobookResponse> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (id !== mockAudiobook.audiobook.id) {
      throw new Error(`Audiobook with id ${id} not found`);
    }
    
    return mockAudiobook as AudiobookResponse;
  }
  
  static async getCurrentAudiobook(): Promise<AudiobookResponse> {
    return this.getAudiobook('ab_mobile_architecture_guide');
  }
}
