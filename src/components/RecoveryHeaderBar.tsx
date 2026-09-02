import React from 'react';
import { VisualOption } from '../types';
import { Infinity as InfinityIcon, Hourglass, Waves, Sprout, Wind, Volume2, VolumeX, Code2, Smartphone, Monitor } from 'lucide-react';

interface RecoveryHeaderBarProps {
  activeOption: VisualOption;
  onChangeOption: (option: VisualOption) => void;
  audioPlaying: boolean;
  onToggleAudio: () => void;
  breathingActive: boolean;
  onToggleBreathing: () => void;
  onOpenCodeModal: () => void;
  mobileViewMode: boolean;
  onToggleViewMode: () => void;
}

export const RecoveryHeaderBar: React.FC<RecoveryHeaderBarProps> = ({
  activeOption,
  onChangeOption,
  audioPlaying,
  onToggleAudio,
  breathingActive,
  onToggleBreathing,
  onOpenCodeModal,
  mobileViewMode,
  onToggleViewMode,
}) => {
  return (
    <header className="relative z-30 w-full flex flex-col items-center select-none px-3 pt-2 sm:pt-3">
      <div className="w-full max-w-lg flex items-center justify-between gap-1.5 p-1.5 rounded-2xl bg-stone-950/80 backdrop-blur-xl border border-white/10 shadow-xl">
        {/* Navigation Tabs (Native Mobile Segmented Control) */}
        <div className="flex items-center space-x-1 flex-1">
          <button
            id="tab-flow"
            type="button"
            onClick={() => onChangeOption('option1_shader')}
            className={`flex-1 flex items-center justify-center space-x-1 py-1.5 px-2 rounded-xl text-xs font-medium transition-all ${
              activeOption === 'option1_shader'
                ? 'bg-amber-500/25 text-amber-200 border border-amber-400/40 shadow-sm'
                : 'text-stone-400 hover:text-stone-200 hover:bg-white/5'
            }`}
          >
            <InfinityIcon className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span className="text-[11px] sm:text-xs">Flow</span>
          </button>

          <button
            id="tab-sand"
            type="button"
            onClick={() => onChangeOption('option2_solver')}
            className={`flex-1 flex items-center justify-center space-x-1 py-1.5 px-2 rounded-xl text-xs font-medium transition-all ${
              activeOption === 'option2_solver'
                ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/40 shadow-sm'
                : 'text-stone-400 hover:text-stone-200 hover:bg-white/5'
            }`}
          >
            <Hourglass className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
            <span className="text-[11px] sm:text-xs">Sand</span>
          </button>

          <button
            id="tab-depths"
            type="button"
            onClick={() => onChangeOption('option3_depths')}
            className={`flex-1 flex items-center justify-center space-x-1 py-1.5 px-2 rounded-xl text-xs font-medium transition-all ${
              activeOption === 'option3_depths'
                ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/40 shadow-sm'
                : 'text-stone-400 hover:text-stone-200 hover:bg-white/5'
            }`}
          >
            <Waves className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
            <span className="text-[11px] sm:text-xs">Depths</span>
          </button>

          <button
            id="tab-grass"
            type="button"
            onClick={() => onChangeOption('option4_grass')}
            className={`flex-1 flex items-center justify-center space-x-1 py-1.5 px-2 rounded-xl text-xs font-medium transition-all ${
              activeOption === 'option4_grass'
                ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/40 shadow-sm'
                : 'text-stone-400 hover:text-stone-200 hover:bg-white/5'
            }`}
          >
            <Sprout className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
            <span className="text-[11px] sm:text-xs">Grass</span>
          </button>
        </div>

        {/* Action Icons Divider */}
        <div className="h-4 w-px bg-white/10 mx-0.5" />

        {/* Right Utility Icons */}
        <div className="flex items-center space-x-1">
          {/* Breathing Pacer */}
          <button
            id="btn-breathing"
            onClick={onToggleBreathing}
            className={`p-1.5 rounded-xl transition-colors ${
              breathingActive
                ? 'bg-teal-500/25 text-teal-200 border border-teal-500/40'
                : 'text-stone-400 hover:text-stone-200 hover:bg-white/5'
            }`}
            title="Breathing guide"
          >
            <Wind className="w-4 h-4" />
          </button>

          {/* Sound Drone */}
          <button
            id="btn-sound"
            onClick={onToggleAudio}
            className={`p-1.5 rounded-xl transition-colors ${
              audioPlaying
                ? 'bg-amber-500/25 text-amber-200 border border-amber-500/40'
                : 'text-stone-400 hover:text-stone-200 hover:bg-white/5'
            }`}
            title={audioPlaying ? 'Mute audio' : 'Play calming sound'}
          >
            {audioPlaying ? <Volume2 className="w-4 h-4 text-amber-300" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Device Preview Toggle */}
          <button
            id="btn-device-mode"
            onClick={onToggleViewMode}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-200 hover:bg-white/5 transition-colors hidden sm:inline-flex"
            title="Toggle device frame"
          >
            {mobileViewMode ? <Monitor className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
          </button>

          {/* Code Export */}
          <button
            id="btn-code"
            onClick={onOpenCodeModal}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-200 hover:bg-white/5 transition-colors"
            title="Export code"
          >
            <Code2 className="w-4 h-4 text-amber-400/80" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default RecoveryHeaderBar;
