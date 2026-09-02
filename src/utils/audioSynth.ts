/**
 * Calming harmonic audio synthesizer using Web Audio API
 * Generates an organic 432Hz grounding root drone with warm sub-bass,
 * binaural theta pulsation (6Hz diff), and slow sweeping low-pass filter.
 */

class CalmingAudioEngine {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private masterGain: GainNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private oscillators: OscillatorNode[] = [];
  private lfo: OscillatorNode | null = null;

  public init() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      this.ctx = new AudioContextClass();
    }
  }

  public async start() {
    this.init();
    if (!this.ctx) return;

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    if (this.isPlaying) return;

    const now = this.ctx.currentTime;

    // Master Gain with gentle fade-in
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.0001, now);
    this.masterGain.gain.exponentialRampToValueAtTime(0.18, now + 3.0);
    this.masterGain.connect(this.ctx.destination);

    // Warm Resonant Lowpass Filter
    this.filterNode = this.ctx.createBiquadFilter();
    this.filterNode.type = 'lowpass';
    this.filterNode.frequency.setValueAtTime(320, now);
    this.filterNode.Q.setValueAtTime(1.8, now);
    this.filterNode.connect(this.masterGain);

    // LFO for gentle breathing filter sweep (8 second cycle = 0.125 Hz)
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(120, now);
    lfoGain.connect(this.filterNode.frequency);

    this.lfo = this.ctx.createOscillator();
    this.lfo.frequency.setValueAtTime(0.12, now); // ~8.3s breathing period
    this.lfo.connect(lfoGain);
    this.lfo.start();

    // Harmonics: 108Hz (Root deep), 216Hz, 324Hz (Fifth), 432Hz (Pure octave)
    const chordFrequencies = [108.0, 108.0 + 5.5, 216.0, 324.0, 432.0];
    const gains = [0.45, 0.35, 0.22, 0.14, 0.08];

    this.oscillators = chordFrequencies.map((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const oscGain = this.ctx!.createGain();

      osc.type = i === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      oscGain.gain.setValueAtTime(gains[i], now);
      osc.connect(oscGain);
      oscGain.connect(this.filterNode!);
      osc.start();
      return osc;
    });

    this.isPlaying = true;
  }

  public stop() {
    if (!this.ctx || !this.isPlaying || !this.masterGain) return;

    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);

    setTimeout(() => {
      this.oscillators.forEach(osc => {
        try { osc.stop(); osc.disconnect(); } catch (e) {}
      });
      this.oscillators = [];
      if (this.lfo) {
        try { this.lfo.stop(); this.lfo.disconnect(); } catch (e) {}
        this.lfo = null;
      }
      this.isPlaying = false;
    }, 1600);
  }

  public toggle(): boolean {
    if (this.isPlaying) {
      this.stop();
      return false;
    } else {
      this.start();
      return true;
    }
  }

  public getStatus(): boolean {
    return this.isPlaying;
  }
}

export const calmingAudio = new CalmingAudioEngine();
