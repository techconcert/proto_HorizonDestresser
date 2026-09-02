import React, { useState } from 'react';
import {
  CheckCircle2,
  TrendingDown,
  Activity,
  HeartHandshake,
  ShieldCheck,
  X,
} from 'lucide-react';
import { VisualOption } from '../types';

interface UrgeWaveCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMinutes: (mins: number) => void;
  onSelectOption: (option: VisualOption) => void;
  onEnableBreathing: () => void;
  onEnableAudio: () => void;
  audioPlaying: boolean;
  breathingActive: boolean;
}

export const UrgeWaveCheckInModal: React.FC<UrgeWaveCheckInModalProps> = ({
  isOpen,
  onClose,
  onAddMinutes,
  onEnableBreathing,
  onEnableAudio,
  audioPlaying,
}) => {
  const [outcome, setOutcome] = useState<'prompt' | 'passed' | 'cresting' | 'intense'>('prompt');
  const [surfedCount, setSurfedCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('craving_waves_surfed_count');
      return saved ? parseInt(saved, 10) : 1;
    } catch {
      return 1;
    }
  });

  if (!isOpen) return null;

  const handlePassed = () => {
    try {
      const newCount = surfedCount + 1;
      localStorage.setItem('craving_waves_surfed_count', newCount.toString());
      setSurfedCount(newCount);
    } catch {}
    setOutcome('passed');
  };

  const handleCresting = () => {
    setOutcome('cresting');
  };

  const handleIntense = () => {
    setOutcome('intense');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        id="urge-wave-checkin-modal"
        className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-sm p-5 shadow-2xl overflow-hidden flex flex-col text-stone-100 animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-300">
              <HeartHandshake className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-sm font-semibold text-stone-100">Urge Check-In</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Prompt */}
        {outcome === 'prompt' && (
          <div className="pt-3 flex flex-col space-y-2.5">
            <p className="text-xs text-stone-300">
              How does the urge feel right now?
            </p>

            <button
              onClick={handlePassed}
              className="w-full p-3 rounded-2xl bg-stone-950/60 border border-emerald-500/40 hover:bg-emerald-950/20 transition-all text-left flex items-center space-x-2.5"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-emerald-200">Wave passed</p>
                <p className="text-[10px] text-stone-400">Feeling calm and grounded</p>
              </div>
            </button>

            <button
              onClick={handleCresting}
              className="w-full p-3 rounded-2xl bg-stone-950/60 border border-cyan-500/40 hover:bg-cyan-950/20 transition-all text-left flex items-center space-x-2.5"
            >
              <TrendingDown className="w-4 h-4 text-cyan-300 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-cyan-200">Dropping</p>
                <p className="text-[10px] text-stone-400">Peak passed, tension settling</p>
              </div>
            </button>

            <button
              onClick={handleIntense}
              className="w-full p-3 rounded-2xl bg-stone-950/60 border border-rose-500/40 hover:bg-rose-950/20 transition-all text-left flex items-center space-x-2.5"
            >
              <Activity className="w-4 h-4 text-rose-300 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-rose-200">Still intense</p>
                <p className="text-[10px] text-stone-400">Need more time</p>
              </div>
            </button>
          </div>
        )}

        {/* Passed */}
        {outcome === 'passed' && (
          <div className="pt-4 flex flex-col items-center text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-xl">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-emerald-300">Surge Surfed</h4>
              <p className="text-xs text-stone-300">
                You sat with the wave until it faded.
              </p>
            </div>

            <div className="w-full p-2 bg-stone-950/60 rounded-xl border border-stone-800 flex items-center justify-between text-xs px-3">
              <span className="text-stone-400">Waves Surfed:</span>
              <span className="font-mono font-bold text-emerald-300">{surfedCount}</span>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all"
            >
              Done
            </button>
          </div>
        )}

        {/* Cresting */}
        {outcome === 'cresting' && (
          <div className="pt-3 flex flex-col space-y-3">
            <p className="text-xs text-cyan-200">
              Peak is broken. Two more minutes to settle into stillness.
            </p>

            <button
              onClick={() => {
                onAddMinutes(2);
                onClose();
              }}
              className="w-full py-2.5 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-all"
            >
              +2 Minutes
            </button>
          </div>
        )}

        {/* Intense */}
        {outcome === 'intense' && (
          <div className="pt-3 flex flex-col space-y-3">
            <p className="text-xs text-rose-200">
              Take 3 more minutes with guided breathing.
            </p>

            <button
              onClick={() => {
                onAddMinutes(3);
                onEnableBreathing();
                if (!audioPlaying) onEnableAudio();
                onClose();
              }}
              className="w-full py-2.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-all"
            >
              +3m with Breath &amp; Tone
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UrgeWaveCheckInModal;
