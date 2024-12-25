class AudioManager {
  private static instance: AudioManager;
  private backgroundMusic: HTMLAudioElement;
  private generateSound: HTMLAudioElement;

  private constructor() {
    this.backgroundMusic = new Audio('/christmas-magic.mp3');
    this.backgroundMusic.loop = true;
    this.backgroundMusic.volume = 0.3;
    
    this.generateSound = new Audio('/magic-spell.mp3');
    this.generateSound.volume = 0.5;
  }

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  playBackgroundMusic() {
    this.backgroundMusic.play().catch(err => console.log('Audio playback failed:', err));
  }

  pauseBackgroundMusic() {
    this.backgroundMusic.pause();
  }

  playGenerateSound() {
    this.generateSound.currentTime = 0;
    this.generateSound.play().catch(err => console.log('Audio playback failed:', err));
  }
}

export default AudioManager;