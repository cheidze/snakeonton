
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

  constructor() {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
        this.masterGain.gain.value = 0.3; // Master volume
      }
    } catch (e) {
      console.warn("AudioContext not supported");
    }
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (this.masterGain) {
      this.masterGain.gain.value = enabled ? 0.3 : 0;
    }
    if (!enabled) {
        this.stopBoost();
    }
    // Resume context on user interaction
    if (enabled && this.ctx?.state === 'suspended') {
      this.ctx.resume().catch(e => console.error("Audio resume failed", e));
    }
  }

  public setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    if (!enabled) {
      this.stopMenuMusic();
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
    if (this.currentNoteIndex === 16) {
      this.currentNoteIndex = 0;
    }
  }

  private scheduleNote(beatNumber: number, time: number) {
    if (!this.musicGain || !this.ctx) return;
    
    // Simple sequence: A minor arpeggio with some rests
    const notes = [220, 0, 261.63, 0, 329.63, 0, 392.00, 261.63, 220, 0, 261.63, 0, 329.63, 392.00, 440, 0];
    const freq = notes[beatNumber];
    if (freq === 0) return;

    const osc = this.ctx.createOscillator();
    const noteGain = this.ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.value = freq;
    
    noteGain.gain.setValueAtTime(0, time);
    noteGain.gain.linearRampToValueAtTime(0.05, time + 0.05);
    noteGain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
    
    osc.connect(noteGain);
    noteGain.connect(this.musicGain);
    
    osc.start(time);
    osc.stop(time + 0.2);
  }

  public playMenuMusic() {
    if (!this.musicEnabled || !this.ctx || this.isMusicPlaying) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    
    this.isMusicPlaying = true;
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.5; // Music volume relative to master
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
    
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
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
    
    gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
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
    
    this.boostOsc.type = 'square'; // Buzzier boost sound
    this.boostOsc.frequency.setValueAtTime(60, this.ctx.currentTime);
    this.boostOsc.frequency.linearRampToValueAtTime(100, this.ctx.currentTime + 0.3);
    
    this.boostGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.boostGain.gain.linearRampToValueAtTime(0.05, this.ctx.currentTime + 0.1);
    
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
    
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  public playClick() {
    if (!this.enabled || !this.ctx || !this.masterGain) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.05);
    
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.05);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }
}

export const audioService = new AudioService();
