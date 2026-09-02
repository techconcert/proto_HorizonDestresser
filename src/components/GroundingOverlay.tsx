import React, { useState, useEffect } from 'react';
import { VisualOption } from '../types';

interface GroundingOverlayProps {
  breathingActive: boolean;
  activeOption: VisualOption;
}

export const GroundingOverlay: React.FC<GroundingOverlayProps> = ({
  breathingActive,
}) => {
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale' | 'Rest'>('Inhale');

  // Breathing 4-4-4-4 cycle
  useEffect(() => {
    if (!breathingActive) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const cycleTime = 16000; // 16s box breathing cycle
      const phaseTime = 4000; // 4s per phase
      const elapsed = now % cycleTime;
      const currentPhaseIdx = Math.floor(elapsed / phaseTime);

      if (currentPhaseIdx === 0) setBreathPhase('Inhale');
      else if (currentPhaseIdx === 1) setBreathPhase('Hold');
      else if (currentPhaseIdx === 2) setBreathPhase('Exhale');
      else setBreathPhase('Rest');
    }, 100);

    return () => clearInterval(interval);
  }, [breathingActive]);

  if (!breathingActive) return null;

  return (
    <div className="pointer-events-none absolute top-28 right-4 sm:right-6 z-20 select-none">
      {/* Compact Minimal Breathing Indicator */}
      <div className="bg-stone-950/80 backdrop-blur-md border border-teal-500/30 rounded-full px-3 py-1.5 shadow-xl flex items-center space-x-2 animate-in fade-in duration-300">
        <div className="relative flex items-center justify-center w-5 h-5">
          <div
            className={`w-3.5 h-3.5 rounded-full bg-teal-400 transition-transform duration-1000 ${
              breathPhase === 'Inhale' || breathPhase === 'Hold' ? 'scale-125' : 'scale-75 opacity-60'
            }`}
          />
        </div>
        <span className="text-[11px] font-medium text-teal-200">
          {breathPhase}
        </span>
      </div>
    </div>
  );
};

export default GroundingOverlay;
