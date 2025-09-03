// Conditional import to avoid crashes in Expo Go
let Voice: any = null;
let SpeechResultsEvent: any = null;
let SpeechErrorEvent: any = null;

try {
  const voiceModule = require('@react-native-voice/voice');
  Voice = voiceModule.default || voiceModule;
  SpeechResultsEvent = voiceModule.SpeechResultsEvent;
  SpeechErrorEvent = voiceModule.SpeechErrorEvent;
} catch (error) {
  // Voice module not available in Expo Go
}

export interface VoiceState {
  isListening: boolean;
  isAvailable: boolean;
  error: string | null;
  results: string[];
}

class VoiceService {
  private listeners: ((state: VoiceState) => void)[] = [];
  private state: VoiceState = {
    isListening: false,
    isAvailable: false,
    error: null,
    results: []
  };
  private isExpoGo: boolean;

  constructor() {
    // Check if we're in Expo Go environment
    this.isExpoGo = !Voice;
    
    if (!this.isExpoGo) {
      this.initializeVoice();
    } else {
      this.state.isAvailable = false;
      this.state.error = 'Voice not available in Expo Go';
    }
  }

  private initializeVoice() {
    try {
      if (!Voice) {
        throw new Error('Voice module not available');
      }

      Voice.onSpeechStart = this.onSpeechStart.bind(this);
      Voice.onSpeechEnd = this.onSpeechEnd.bind(this);
      Voice.onSpeechResults = this.onSpeechResults.bind(this);
      Voice.onSpeechError = this.onSpeechError.bind(this);
      Voice.onSpeechVolumeChanged = this.onSpeechVolumeChanged.bind(this);

      // Check if voice is available
      Voice.isAvailable().then((available) => {
        this.updateState({ isAvailable: available });
      }).catch(() => {
        this.updateState({ isAvailable: false, error: 'Voice recognition not supported' });
      });
    } catch (error) {
      this.updateState({ isAvailable: false, error: 'Voice recognition not available' });
    }
  }

  private updateState(updates: Partial<VoiceState>) {
    this.state = { ...this.state, ...updates };
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.state));
  }

  private onSpeechStart() {
    this.updateState({ isListening: true, error: null });
  }

  private onSpeechEnd() {
    this.updateState({ isListening: false });
  }

  private onSpeechResults(event: SpeechResultsEvent) {
    const results = event.value || [];
    this.updateState({ results });
  }

  private onSpeechError(event: SpeechErrorEvent) {
    const error = event.error?.message || 'Voice recognition error';
    this.updateState({ 
      isListening: false, 
      error,
      results: []
    });
  }

  private onSpeechVolumeChanged() {
    // Could be used for visual feedback
  }

  // Public methods
  async startListening(): Promise<void> {
    try {
      if (this.isExpoGo || !Voice) {
        throw new Error('Voice recognition not available in Expo Go');
      }

      if (!this.state.isAvailable) {
        throw new Error('Voice recognition not available');
      }

      this.updateState({ 
        isListening: false, 
        error: null, 
        results: [] 
      });

      await Voice.start('en-US');
    } catch (error) {
      this.updateState({ 
        error: error instanceof Error ? error.message : 'Failed to start voice recognition',
        isListening: false 
      });
    }
  }

  async stopListening(): Promise<void> {
    try {
      if (this.isExpoGo || !Voice) {
        return;
      }
      await Voice.stop();
    } catch (error) {
      this.updateState({ 
        error: error instanceof Error ? error.message : 'Failed to stop voice recognition',
        isListening: false 
      });
    }
  }

  async destroy(): Promise<void> {
    try {
      if (this.isExpoGo || !Voice) {
        return;
      }
      await Voice.destroy();
    } catch (error) {
      console.error('Error destroying voice service:', error);
    }
  }

  getState(): VoiceState {
    return { ...this.state };
  }

  subscribe(listener: (state: VoiceState) => void): () => void {
    this.listeners.push(listener);
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Get the best result from voice recognition
  getBestResult(): string {
    return this.state.results[0] || '';
  }

  // Clear results and error
  clearResults(): void {
    this.updateState({ results: [], error: null });
  }
}

export const voiceService = new VoiceService();
