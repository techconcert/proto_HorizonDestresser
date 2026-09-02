import React, { useMemo } from 'react';
import { Play, Pause, RotateCcw, Waves, CheckCircle2 } from 'lucide-react';
import { UrgeWaveStatus } from '../types';

interface UrgeSurfingCrestingHUDProps {
  totalTargetSeconds: number;
  secondsRemaining: number;
  isTimerRunning: boolean;
  onToggleTimer: () => void;
  onResetTimer: () => void;
  onSetPresetSeconds: (seconds: number) => void;
  onAddSeconds: (seconds: number) => void;
  onTriggerCheckIn: () => void;
}

export const UrgeSurfingCrestingHUD: React.FC<UrgeSurfingCrestingHUDProps> = ({
  totalTargetSeconds,
  secondsRemaining,
  isTimerRunning,
  onToggleTimer,
  onResetTimer,
  onTriggerCheckIn,
}) => {
  const elapsedSeconds = Math.max(0, totalTargetSeconds - secondsRemaining);
  const progressRatio = totalTargetSeconds > 0 ? Math.min(1, elapsedSeconds / totalTargetSeconds) : 0;

  // Compute physiological wave phase (Marlatt model)
  const waveStatus: UrgeWaveStatus = useMemo(() => {
    const elapsedMinutes = elapsedSeconds / 60;
    const progress = progressRatio * 100;

    if (elapsedMinutes < 3 || progress < 30) {
      return {
        phase: 'rising',
        phaseTitle: 'Rising',
        phaseDescription: 'Urge building',
        clinicalNote: '',
        progressPercent: progress,
        colorAccent: 'text-amber-400 bg-amber-500/20 border-amber-500/30',
      };
    } else if (elapsedMinutes < 5 || progress < 55) {
      return {
        phase: 'cresting',
        phaseTitle: 'Peak Crest',
        phaseDescription: 'Peak surge',
        clinicalNote: '',
        progressPercent: progress,
        colorAccent: 'text-rose-400 bg-rose-500/20 border-rose-500/30',
      };
    } else if (elapsedMinutes < 8 || progress < 90) {
      return {
        phase: 'subsiding',
        phaseTitle: 'Dropping',
        phaseDescription: 'Settling',
        clinicalNote: '',
        progressPercent: progress,
        colorAccent: 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30',
      };
    } else {
      return {
        phase: 'surfed',
        phaseTitle: 'Surfed',
        phaseDescription: 'Calm restored',
        clinicalNote: '',
        progressPercent: progress,
        colorAccent: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30',
      };
    }
  }, [elapsedSeconds, progressRatio]);

  const formatTime = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // SVG Wave Curve Coordinates for Viewbox 0 0 120 28
  // Bell curve: Base (5, 24) -> Peak Crest (58, 5) -> Landing (115, 24)
  const markerPos = useMemo(() => {
    const t = Math.max(0, Math.min(1, progressRatio));
    const x = 6 + t * 108;
    // Bell curve factor centered around 0.45
    const bellFactor = Math.exp(-0.5 * Math.pow((t - 0.45) / 0.22, 2));
    const y = 23 - 18 * bellFactor;
    return { x, y };
  }, [progressRatio]);

  return (
    <div
      id="compact-wave-pill"
      className="absolute top-16 sm:top-18 left-1/2 -translate-x-1/2 z-20 pointer-events-auto select-none"
    >
      <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-stone-950/80 backdrop-blur-xl border border-white/10 shadow-lg text-stone-200">
        {/* Play/Pause Button */}
        <button
          onClick={onToggleTimer}
          className="p-1 rounded-full text-stone-300 hover:text-white hover:bg-white/10 transition-colors"
          title={isTimerRunning ? 'Pause timer' : 'Start timer'}
        >
          {isTimerRunning ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5" />}
        </button>

        {/* Single Countdown Timer */}
        <span className="font-mono text-xs font-semibold tracking-wider text-stone-100 min-w-[38px]">
          {formatTime(secondsRemaining)}
        </span>

        {/* Mini Wave Sparkline Curve with Progress Dot */}
        <div className="relative w-20 h-5 flex items-center">
          <svg viewBox="0 0 120 28" className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="miniWaveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
                <stop offset="45%" stopColor="#f43f5e" stopOpacity="0.8" />
                <stop offset="75%" stopColor="#06b6d4" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.7" />
              </linearGradient>
            </defs>
            {/* Background base guide curve */}
            <path
              d="M 6 23 C 30 23, 40 5, 58 5 C 76 5, 86 23, 114 23"
              fill="none"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Colored wave curve */}
            <path
              d="M 6 23 C 30 23, 40 5, 58 5 C 76 5, 86 23, 114 23"
              fill="none"
              stroke="url(#miniWaveGrad)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Live Progress Dot */}
            <circle
              cx={markerPos.x}
              cy={markerPos.y}
              r="3.5"
              className={
                waveStatus.phase === 'cresting'
                  ? 'fill-rose-400 drop-shadow-[0_0_6px_rgba(244,63,94,0.9)]'
                  : waveStatus.phase === 'rising'
                  ? 'fill-amber-400 drop-shadow-[0_0_6px_rgba(245,158,11,0.9)]'
                  : waveStatus.phase === 'subsiding'
                  ? 'fill-cyan-400 drop-shadow-[0_0_6px_rgba(6,182,212,0.9)]'
                  : 'fill-emerald-400 drop-shadow-[0_0_6px_rgba(16,185,129,0.9)]'
              }
            />
          </svg>
        </div>

        {/* Phase Pill Button - Tap to Check-in */}
        <button
          onClick={onTriggerCheckIn}
          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-all hover:scale-105 active:scale-95 ${waveStatus.colorAccent}`}
          title="Tap for somatic check-in"
        >
          {waveStatus.phaseTitle}
        </button>

        {/* Quick Reset */}
        <button
          onClick={onResetTimer}
          className="p-1 text-stone-400 hover:text-stone-200 rounded-full hover:bg-white/5 transition-colors"
          title="Reset timer"
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export default UrgeSurfingCrestingHUD;
