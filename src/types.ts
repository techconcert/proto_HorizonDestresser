export type VisualOption = 'option1_shader' | 'option2_solver' | 'option3_depths' | 'option4_grass';

export type UrgeWavePhase = 'rising' | 'cresting' | 'subsiding' | 'surfed';

export interface UrgeWaveStatus {
  phase: UrgeWavePhase;
  phaseTitle: string;
  phaseDescription: string;
  clinicalNote: string;
  progressPercent: number; // 0 to 100
  colorAccent: string;
}

export interface GroundingAffirmation {
  id: number;
  text: string;
  category: 'craving' | 'breath' | 'presence';
}

export interface PresetPalette {
  name: string;
  colors: string[];
}

