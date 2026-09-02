import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, RefreshCw, Feather } from 'lucide-react';
import { UrgeWavePhase } from '../types';
import { COGNITIVE_PROMPT_LIBRARY, CognitivePrompt } from '../data/cognitivePrompts';

interface CognitiveInterruptBannerProps {
  currentPhase: UrgeWavePhase;
  elapsedSeconds: number;
  isTimerRunning: boolean;
}

export const CognitiveInterruptBanner: React.FC<CognitiveInterruptBannerProps> = ({
  currentPhase,
  elapsedSeconds,
  isTimerRunning,
}) => {
  const [currentPrompt, setCurrentPrompt] = useState<CognitivePrompt | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [promptKey, setPromptKey] = useState<number>(0);
  const lastPromptTimeRef = useRef<number>(0);
  const hideTimeoutRef = useRef<number | null>(null);
  const promptHistoryRef = useRef<Set<string>>(new Set());

  // Pick a calming prompt tailored to the physiological wave phase
  const pickPromptForPhase = useCallback((phase: UrgeWavePhase): CognitivePrompt => {
    const candidates = COGNITIVE_PROMPT_LIBRARY.filter(
      (p) => p.phase === phase || p.phase === 'any'
    );
    const unshown = candidates.filter((p) => !promptHistoryRef.current.has(p.id));
    const pool = unshown.length > 0 ? unshown : candidates;
    const selected = pool[Math.floor(Math.random() * pool.length)] || candidates[0];

    promptHistoryRef.current.add(selected.id);
    if (promptHistoryRef.current.size > 25) {
      promptHistoryRef.current.clear();
    }
    return selected;
  }, []);

  const showPrompt = useCallback((promptToDisplay?: CognitivePrompt) => {
    const prompt = promptToDisplay || pickPromptForPhase(currentPhase);
    setCurrentPrompt(prompt);
    setPromptKey((prev) => prev + 1);
    setIsVisible(true);

    if (hideTimeoutRef.current) window.clearTimeout(hideTimeoutRef.current);

    // Auto-dismiss smoothly after 9.5 seconds without React re-render ticks
    hideTimeoutRef.current = window.setTimeout(() => {
      setIsVisible(false);
    }, 9500);
  }, [currentPhase, pickPromptForPhase]);

  const handleDismiss = () => {
    setIsVisible(false);
    if (hideTimeoutRef.current) window.clearTimeout(hideTimeoutRef.current);
  };

  const handleCycleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    showPrompt();
  };

  // Trigger prompt cadence (every ~90-110s and on wave milestones)
  useEffect(() => {
    if (!isTimerRunning) return;

    const timeSinceLastPrompt = elapsedSeconds - lastPromptTimeRef.current;

    const isAnchorMoment =
      (elapsedSeconds === 15 && lastPromptTimeRef.current === 0) ||
      (elapsedSeconds === 90 && timeSinceLastPrompt >= 60) ||
      (elapsedSeconds === 210 && timeSinceLastPrompt >= 60) ||
      (elapsedSeconds === 330 && timeSinceLastPrompt >= 60) ||
      (elapsedSeconds === 480 && timeSinceLastPrompt >= 60);

    const isCadenceTrigger = timeSinceLastPrompt >= 105;

    if (isAnchorMoment || isCadenceTrigger) {
      lastPromptTimeRef.current = elapsedSeconds;
      showPrompt();
    }
  }, [elapsedSeconds, isTimerRunning, showPrompt]);

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) window.clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  if (!isVisible || !currentPrompt) return null;

  return (
    <div
      id="cognitive-interrupt-banner"
      className="absolute bottom-18 sm:bottom-20 left-1/2 -translate-x-1/2 z-30 w-[92%] max-w-sm sm:max-w-md pointer-events-auto select-none transition-opacity duration-500 ease-out"
    >
      {/* 70% soft opacity container with subtle blur and low-contrast border */}
      <div className="relative overflow-hidden bg-stone-950/70 backdrop-blur-md border border-white/10 rounded-2xl p-3 sm:p-3.5 shadow-xl flex flex-col gap-1.5 opacity-90 hover:opacity-100 transition-opacity duration-300">
        {/* Header: Subtle Tag & Actions */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center space-x-1.5 text-stone-400 text-[11px] font-medium">
            <Feather className="w-3 h-3 text-stone-400 shrink-0" />
            <span>{currentPrompt.tag}</span>
          </div>

          <div className="flex items-center space-x-0.5">
            <button
              type="button"
              onClick={handleCycleNext}
              className="p-1 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-white/5 transition-colors"
              title="Next thought"
            >
              <RefreshCw className="w-3 h-3" />
            </button>

            <button
              id="btn-close-interrupt"
              type="button"
              onClick={handleDismiss}
              className="p-1 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-white/10 transition-colors"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Message Text - Calm, High-legibility neutral */}
        <p className="text-xs sm:text-[13px] font-normal leading-relaxed text-stone-200 pr-1">
          &ldquo;{currentPrompt.text}&rdquo;
        </p>

        {/* Buttery smooth GPU-accelerated CSS progress bar (Zero JavaScript re-renders) */}
        <div className="w-full h-0.5 bg-white/5 rounded-full overflow-hidden mt-1">
          <div
            key={promptKey}
            className="h-full bg-stone-400/40 rounded-full origin-left animate-[progressShrink_9.5s_linear_forwards]"
            style={{
              animation: 'progressShrink 9.5s linear forwards',
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default CognitiveInterruptBanner;
