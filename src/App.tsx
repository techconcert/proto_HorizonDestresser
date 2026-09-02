import React, { useState, useEffect, useMemo } from 'react';
import { VisualOption, UrgeWavePhase } from './types';
import { Option1_ShaderView } from './components/Option1_ShaderView';
import { Option2_FluidSolverView } from './components/Option2_FluidSolverView';
import { Option3_ClearDepthsView } from './components/Option3_ClearDepthsView';
import { Option4_TouchGrassView } from './components/Option4_TouchGrassView';
import { RecoveryHeaderBar } from './components/RecoveryHeaderBar';
import { GroundingOverlay } from './components/GroundingOverlay';
import { CodeExportModal } from './components/CodeExportModal';
import { UrgeSurfingCrestingHUD } from './components/UrgeSurfingCrestingHUD';
import { UrgeWaveCheckInModal } from './components/UrgeWaveCheckInModal';
import { CognitiveInterruptBanner } from './components/CognitiveInterruptBanner';
import { calmingAudio } from './utils/audioSynth';

export default function App() {
  const [activeOption, setActiveOption] = useState<VisualOption>(() => {
    try {
      const saved = localStorage.getItem('preferred_recovery_option');
      if (saved && ['option1_shader', 'option2_solver', 'option3_depths', 'option4_grass'].includes(saved)) {
        return saved as VisualOption;
      }
    } catch {}
    return 'option2_solver';
  });

  const [audioPlaying, setAudioPlaying] = useState<boolean>(false);
  const [breathingActive, setBreathingActive] = useState<boolean>(false);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState<boolean>(false);
  const [mobileViewMode, setMobileViewMode] = useState<boolean>(false);
  const [isCheckInOpen, setIsCheckInOpen] = useState<boolean>(false);

  // Marlatt Urge Surfing Wave Timer (Default: 8 minutes = 480s)
  const [totalTargetSeconds, setTotalTargetSeconds] = useState<number>(480);
  const [timerSecondsRemaining, setTimerSecondsRemaining] = useState<number>(480);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);

  // Save active option to localStorage
  const handleSelectOption = (opt: VisualOption) => {
    setActiveOption(opt);
    try {
      localStorage.setItem('preferred_recovery_option', opt);
    } catch {}
  };

  // Timer interval effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && timerSecondsRemaining > 0) {
      interval = setInterval(() => {
        setTimerSecondsRemaining((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            setIsCheckInOpen(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timerSecondsRemaining]);

  const handleToggleTimer = () => {
    if (timerSecondsRemaining === 0) {
      setTimerSecondsRemaining(totalTargetSeconds);
    }
    setIsTimerRunning(!isTimerRunning);
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    setTimerSecondsRemaining(totalTargetSeconds);
  };

  const handleSetPresetSeconds = (seconds: number) => {
    setTotalTargetSeconds(seconds);
    setTimerSecondsRemaining(seconds);
    setIsTimerRunning(true);
  };

  const handleAddSeconds = (seconds: number) => {
    setTotalTargetSeconds((prev) => prev + seconds);
    setTimerSecondsRemaining((prev) => prev + seconds);
    if (!isTimerRunning) setIsTimerRunning(true);
  };

  const handleToggleAudio = () => {
    const isNowPlaying = calmingAudio.toggle();
    setAudioPlaying(isNowPlaying);
  };

  const handleToggleBreathing = () => {
    setBreathingActive(!breathingActive);
  };

  const elapsedSeconds = Math.max(0, totalTargetSeconds - timerSecondsRemaining);
  const progressRatio = totalTargetSeconds > 0 ? Math.min(1, elapsedSeconds / totalTargetSeconds) : 0;

  const currentPhase: UrgeWavePhase = useMemo(() => {
    const elapsedMinutes = elapsedSeconds / 60;
    const progress = progressRatio * 100;
    if (elapsedMinutes < 3 || progress < 30) return 'rising';
    if (elapsedMinutes < 5 || progress < 55) return 'cresting';
    if (elapsedMinutes < 8 || progress < 90) return 'subsiding';
    return 'surfed';
  }, [elapsedSeconds, progressRatio]);

  return (
    <div className="relative w-screen h-screen bg-stone-950 text-stone-100 flex flex-col items-center justify-center overflow-hidden font-sans">
      {/* Background radial gradient to avoid pure black */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-stone-900/40 via-stone-950 to-black pointer-events-none z-0" />

      {/* Main Viewport Container (Switchable between Mobile Phone Viewport Frame or Full-Bleed Canvas) */}
      <div
        className={`relative z-10 w-full h-full flex flex-col transition-all duration-500 overflow-hidden ${
          mobileViewMode
            ? 'max-w-[420px] max-h-[860px] rounded-[40px] border-[10px] border-stone-800 shadow-[0_25px_70px_rgba(0,0,0,0.8)] my-auto'
            : 'max-w-none max-h-none border-none rounded-none'
        }`}
      >
        {/* Header Control Bar */}
        <RecoveryHeaderBar
          activeOption={activeOption}
          onChangeOption={handleSelectOption}
          audioPlaying={audioPlaying}
          onToggleAudio={handleToggleAudio}
          breathingActive={breathingActive}
          onToggleBreathing={handleToggleBreathing}
          onOpenCodeModal={() => setIsCodeModalOpen(true)}
          mobileViewMode={mobileViewMode}
          onToggleViewMode={() => setMobileViewMode(!mobileViewMode)}
        />

        {/* Dynamic Visual Grounding Canvas Layer */}
        <main className="relative flex-1 w-full h-full overflow-hidden">
          {/* Integrated Urge Surfing Wave & Cresting HUD */}
          <UrgeSurfingCrestingHUD
            totalTargetSeconds={totalTargetSeconds}
            secondsRemaining={timerSecondsRemaining}
            isTimerRunning={isTimerRunning}
            onToggleTimer={handleToggleTimer}
            onResetTimer={handleResetTimer}
            onSetPresetSeconds={handleSetPresetSeconds}
            onAddSeconds={handleAddSeconds}
            onTriggerCheckIn={() => setIsCheckInOpen(true)}
          />

          {/* Option 1: Quiet Flow (GLSL Shader Impasto) */}
          {activeOption === 'option1_shader' && (
            <Option1_ShaderView
              className="w-full h-full animate-in fade-in duration-500"
              intensity={1.1}
              speedMultiplier={0.9}
            />
          )}

          {/* Option 2: Ink & Touch (2D Navier-Stokes Fluid Solver) */}
          {activeOption === 'option2_solver' && (
            <Option2_FluidSolverView
              className="w-full h-full animate-in fade-in duration-500"
              splatRadius={0.0035}
              viscosity={0.985}
              dissipation={0.985}
              vorticityStrength={24.0}
            />
          )}

          {/* Option 3: Clear Depths (Water Reveal & Underwater Life) */}
          {activeOption === 'option3_depths' && (
            <Option3_ClearDepthsView
              className="w-full h-full animate-in fade-in duration-500"
            />
          )}

          {/* Option 4: Touch Grass (Breeze & Meadow Grounding) */}
          {activeOption === 'option4_grass' && (
            <Option4_TouchGrassView
              className="w-full h-full animate-in fade-in duration-500"
            />
          )}

          {/* Grounding & Breath Guidance Overlay */}
          <GroundingOverlay
            breathingActive={breathingActive}
            activeOption={activeOption}
          />

          {/* Intermittent On-Screen Cognitive Interrupt / Reinforcement Banner */}
          <CognitiveInterruptBanner
            currentPhase={currentPhase}
            elapsedSeconds={elapsedSeconds}
            isTimerRunning={isTimerRunning}
          />
        </main>
      </div>

      {/* Somatic Urge Wave Check-In Modal (Marlatt Self-Efficacy Model) */}
      <UrgeWaveCheckInModal
        isOpen={isCheckInOpen}
        onClose={() => setIsCheckInOpen(false)}
        onAddMinutes={(mins) => handleAddSeconds(mins * 60)}
        onSelectOption={handleSelectOption}
        onEnableBreathing={() => setBreathingActive(true)}
        onEnableAudio={() => {
          if (!audioPlaying) handleToggleAudio();
        }}
        audioPlaying={audioPlaying}
        breathingActive={breathingActive}
      />

      {/* Code Deliverables & Standalone Exporter Modal */}
      <CodeExportModal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
        activeOption={activeOption}
      />
    </div>
  );
}
