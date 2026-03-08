
class AudioService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private enabled: boolean = true;
  
  private boostOsc: OscillatorNode | null = null;
  private boostGain: GainNode | null = null;

  private musicEnabled: boolean = true;
  private isMusicPlaying: boolean = false;
  private musicGain: GainNode | null = null;
  private musicInterval: number | null = null;
  private nextNoteTime: number = 0;
  private currentNoteIndex: number = 0;
  private lookahead: number = 25.0; // ms
  private scheduleAheadTime: number = 0.1; // s

  private musicVolume: number = 0.5;
  private soundVolume: number = 0.5;

  constructor() {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
        this.masterGain.gain.value = 1.0; // Master volume is 1.0, individual volumes control the rest
      }
    } catch (e) {
      console.warn("AudioContext not supported");
    }
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled) {
        this.stopBoost();
    }
    // Resume context on user interaction
    if (enabled && this.ctx?.state === 'suspended') {
      this.ctx.resume().catch(e => console.error("Audio resume failed", e));
    }
  }

  public setSoundVolume(volume: number) {
    this.soundVolume = volume;
  }

  public setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    if (!enabled) {
      this.stopMenuMusic();
    }
  }

  public setMusicVolume(volume: number) {
    this.musicVolume = volume;
    if (this.musicGain) {
      this.musicGain.gain.value = volume;
    }
  }

  private scheduler() {
    if (!this.isMusicPlaying || !this.ctx) return;
    
    if (this.ctx.state === 'running') {
      while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadTime) {
        this.scheduleNote(this.currentNoteIndex, this.nextNoteTime);
        this.nextNote();
      }
    } else {
      // If suspended, keep nextNoteTime synced with currentTime so we don't schedule a huge backlog
      this.nextNoteTime = this.ctx.currentTime + 0.05;
    }
    
    this.musicInterval = window.setTimeout(() => this.scheduler(), this.lookahead);
  }

  private nextNote() {
    const secondsPerBeat = 60.0 / 120; // 120 BPM
    this.nextNoteTime += 0.25 * secondsPerBeat; // 16th notes
    this.currentNoteIndex++;
    if (this.currentNoteIndex === 32) {
      this.currentNoteIndex = 0;
    }
  }

  private scheduleNote(beatNumber: number, time: number) {
    if (!this.musicGain || !this.ctx) return;
    
    // Synthwave / Cyberpunk style bassline
    const bassNotes = [
      110.00, 110.00, 0, 110.00, 110.00, 0, 110.00, 110.00, // A2
      87.31, 87.31, 0, 87.31, 87.31, 0, 87.31, 87.31,       // F2
      73.42, 73.42, 0, 73.42, 73.42, 0, 73.42, 73.42,       // D2
      82.41, 82.41, 0, 82.41, 82.41, 0, 82.41, 82.41        // E2
    ];
    
    // Melody on top
    const melodyNotes = [
      440.00, 0, 523.25, 0, 659.25, 0, 523.25, 0, // A4, C5, E5, C5
      349.23, 0, 440.00, 0, 523.25, 0, 440.00, 0, // F4, A4, C5, A4
      293.66, 0, 349.23, 0, 440.00, 0, 349.23, 0, // D4, F4, A4, F4
      329.63, 0, 392.00, 0, 493.88, 0, 392.00, 0  // E4, G4, B4, G4
    ];

    const bassFreq = bassNotes[beatNumber % 32];
    const melodyFreq = melodyNotes[beatNumber % 32];

    if (bassFreq > 0) {
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      bassOsc.type = 'sawtooth';
      bassOsc.frequency.value = bassFreq;
      
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, time);
      filter.frequency.exponentialRampToValueAtTime(100, time + 0.1);
      
      bassGain.gain.setValueAtTime(0, time);
      bassGain.gain.linearRampToValueAtTime(0.08, time + 0.02);
      bassGain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
      
      bassOsc.connect(filter);
      filter.connect(bassGain);
      bassGain.connect(this.musicGain);
      
      bassOsc.start(time);
      bassOsc.stop(time + 0.15);
    }

    if (melodyFreq > 0) {
      const melodyOsc = this.ctx.createOscillator();
      const melodyGain = this.ctx.createGain();
      melodyOsc.type = 'square';
      melodyOsc.frequency.value = melodyFreq;
      
      melodyGain.gain.setValueAtTime(0, time);
      melodyGain.gain.linearRampToValueAtTime(0.03, time + 0.02);
      melodyGain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
      
      melodyOsc.connect(melodyGain);
      melodyGain.connect(this.musicGain);
      
      melodyOsc.start(time);
      melodyOsc.stop(time + 0.2);
    }
  }

  public playMenuMusic() {
    if (!this.musicEnabled || !this.ctx || this.isMusicPlaying) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    
    this.isMusicPlaying = true;
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = this.musicVolume; // Music volume relative to master
    this.musicGain.connect(this.masterGain!);

    this.currentNoteIndex = 0;
    this.nextNoteTime = this.ctx.currentTime + 0.05;
    this.scheduler();
  }

  public stopMenuMusic() {
    this.isMusicPlaying = false;
    if (this.musicInterval !== null) {
      clearTimeout(this.musicInterval);
      this.musicInterval = null;
    }
    if (this.musicGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.musicGain.gain.cancelScheduledValues(now);
      this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, now);
      this.musicGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      
      const currentGain = this.musicGain;
      setTimeout(() => {
        try {
          currentGain.disconnect();
        } catch (e) {}
      }, 600);
      this.musicGain = null;
    }
  }

  public playEat() {
    if (!this.enabled || !this.ctx || !this.masterGain) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    // Higher pitch "bloop"
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.08);
    
    gain.gain.setValueAtTime(0.2 * this.soundVolume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  public playDie() {
    if (!this.enabled || !this.ctx || !this.masterGain) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sawtooth';
    // Low pitch descending crash
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.5);
    
    gain.gain.setValueAtTime(0.4 * this.soundVolume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.5);
  }

  public startBoost() {
    if (!this.enabled || !this.ctx || !this.masterGain || this.boostOsc) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    
    this.boostOsc = this.ctx.createOscillator();
    this.boostGain = this.ctx.createGain();
    
    this.boostOsc.type = 'sine'; // Softer boost sound
    this.boostOsc.frequency.setValueAtTime(100, this.ctx.currentTime);
    this.boostOsc.frequency.linearRampToValueAtTime(150, this.ctx.currentTime + 0.3);
    
    this.boostGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.boostGain.gain.linearRampToValueAtTime(0.03 * this.soundVolume, this.ctx.currentTime + 0.1);
    
    // Low pass filter to muffle the square wave a bit
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;

    this.boostOsc.connect(filter);
    filter.connect(this.boostGain);
    this.boostGain.connect(this.masterGain);
    
    this.boostOsc.start();
  }

  public stopBoost() {
    if (this.boostOsc && this.ctx) {
        const now = this.ctx.currentTime;
        if (this.boostGain) {
            this.boostGain.gain.cancelScheduledValues(now);
            this.boostGain.gain.setValueAtTime(this.boostGain.gain.value, now);
            this.boostGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        }
        if (this.boostOsc) {
            this.boostOsc.stop(now + 0.15);
        }
        
        // Cleanup refs after sound fades
        const currentOsc = this.boostOsc;
        const currentGain = this.boostGain;
        setTimeout(() => {
            try {
                currentOsc?.disconnect();
                currentGain?.disconnect();
            } catch (e) {}
        }, 200);
        
        this.boostOsc = null;
        this.boostGain = null;
    }
  }

  public playCoin() {
    if (!this.enabled || !this.ctx || !this.masterGain) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    // Bright "ding"
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1500, this.ctx.currentTime);
    
    gain.gain.setValueAtTime(0.15 * this.soundVolume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  public playMagnet() {
    if (!this.enabled || !this.ctx || !this.masterGain) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(800, this.ctx.currentTime + 0.2);
    osc.frequency.linearRampToValueAtTime(400, this.ctx.currentTime + 0.4);
    
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.2 * this.soundVolume, this.ctx.currentTime + 0.1);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.4);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.4);
  }

  public playLevelUp() {
    if (!this.enabled || !this.ctx || !this.masterGain) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc1.type = 'sine';
    osc2.type = 'triangle';
    
    osc1.frequency.setValueAtTime(440, this.ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.1);
    osc1.frequency.exponentialRampToValueAtTime(1760, this.ctx.currentTime + 0.3);
    
    osc2.frequency.setValueAtTime(554.37, this.ctx.currentTime); // C#
    osc2.frequency.exponentialRampToValueAtTime(1108.73, this.ctx.currentTime + 0.1);
    osc2.frequency.exponentialRampToValueAtTime(2217.46, this.ctx.currentTime + 0.3);
    
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.2 * this.soundVolume, this.ctx.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
    
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);
    
    osc1.start();
    osc2.start();
    osc1.stop(this.ctx.currentTime + 0.5);
    osc2.stop(this.ctx.currentTime + 0.5);
  }

  public playHit() {
    if (!this.enabled || !this.ctx || !this.masterGain) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(100, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(20, this.ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.2 * this.soundVolume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  public playClick() {
    if (!this.enabled || !this.ctx || !this.masterGain) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.05);
    
    gain.gain.setValueAtTime(0.1 * this.soundVolume, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.05);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }
}

export const audioService = new AudioService();
