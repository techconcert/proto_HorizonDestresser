export interface CognitivePrompt {
  id: string;
  text: string;
  phase: 'rising' | 'cresting' | 'subsiding' | 'surfed' | 'any';
  tag: string;
}

export const COGNITIVE_PROMPT_LIBRARY: CognitivePrompt[] = [
  // --- RISING PHASE (0 - 3 MINS): Awareness, Tension Release, Curiosity ---
  {
    id: 'r-1',
    phase: 'rising',
    tag: 'Body Anchor',
    text: 'Notice where you feel tension in your body right now. Drop your shoulders.',
  },
  {
    id: 'r-2',
    phase: 'rising',
    tag: 'Brain Chemistry',
    text: 'This is a temporary dopamine spike, not an emergency. It will pass.',
  },
  {
    id: 'r-3',
    phase: 'rising',
    tag: 'Mindful Pause',
    text: 'Unclench your jaw and let your tongue rest gently at the bottom of your mouth.',
  },
  {
    id: 'r-4',
    phase: 'rising',
    tag: 'Urge Surfing',
    text: 'An urge is just a sensation in the body. You can watch it without acting on it.',
  },
  {
    id: 'r-5',
    phase: 'rising',
    tag: 'Grounding',
    text: 'Feel the solid contact beneath you. You are safe right here in this moment.',
  },
  {
    id: 'r-6',
    phase: 'rising',
    tag: 'Control',
    text: 'You do not have to fight this feeling—just ride it like a wave.',
  },
  {
    id: 'r-7',
    phase: 'rising',
    tag: 'Breath Shift',
    text: 'Take one long, slow exhale through slightly parted lips. Feel your chest settle.',
  },
  {
    id: 'r-8',
    phase: 'rising',
    tag: 'Curiosity',
    text: 'Treat this feeling like curious weather passing across the sky.',
  },
  {
    id: 'r-9',
    phase: 'rising',
    tag: 'Self-Efficacy',
    text: 'Cravings are automatic, but your response is completely in your control.',
  },
  {
    id: 'r-10',
    phase: 'rising',
    tag: 'Body Anchor',
    text: 'Notice your hands. Soften your grip and let your fingers relax.',
  },
  {
    id: 'r-11',
    phase: 'rising',
    tag: 'Mindful Pause',
    text: 'Observe the urge with gentle detachment. You are the observer, not the storm.',
  },
  {
    id: 'r-12',
    phase: 'rising',
    tag: 'Brain Chemistry',
    text: 'Your brain is asking for an old habit. Every second you wait rewires the circuit.',
  },
  {
    id: 'r-13',
    phase: 'rising',
    tag: 'Grounding',
    text: 'Notice subtle colors moving on your screen. Rest your gaze here.',
  },

  // --- CRESTING PHASE (3 - 5 MINS): Peak Surge, Endurance, De-escalation ---
  {
    id: 'c-1',
    phase: 'cresting',
    tag: 'Brain Chemistry',
    text: "The wave has crested. Your brain's chemistry is already rebalancing.",
  },
  {
    id: 'c-2',
    phase: 'cresting',
    tag: 'Breath Shift',
    text: 'Count 5 slow breaths with the crest of the moving visual.',
  },
  {
    id: 'c-3',
    phase: 'cresting',
    tag: 'Urge Surfing',
    text: 'You are at the top of the peak. It cannot stay this intense for long.',
  },
  {
    id: 'c-4',
    phase: 'cresting',
    tag: 'Self-Efficacy',
    text: 'This peak is temporary. You have the strength to let it roll past you.',
  },
  {
    id: 'c-5',
    phase: 'cresting',
    tag: 'Body Anchor',
    text: 'Breathe directly into the center of tightness. Give it room to soften.',
  },
  {
    id: 'c-6',
    phase: 'cresting',
    tag: 'Control',
    text: 'You are outlasting the surge. Keep your eyes on the fluid motion.',
  },
  {
    id: 'c-7',
    phase: 'cresting',
    tag: 'Mindful Pause',
    text: 'Notice: the urge feels powerful, yet it has zero power over your hands.',
  },
  {
    id: 'c-8',
    phase: 'cresting',
    tag: 'Breath Shift',
    text: 'Make your exhale twice as long as your inhale. Signal safety to your nervous system.',
  },
  {
    id: 'c-9',
    phase: 'cresting',
    tag: 'Brain Chemistry',
    text: 'Adrenaline metabolizes quickly when you stay present with your breath.',
  },
  {
    id: 'c-10',
    phase: 'cresting',
    tag: 'Urge Surfing',
    text: 'Stay on the surfboard. The water is beginning to calm beneath you.',
  },
  {
    id: 'c-11',
    phase: 'cresting',
    tag: 'Self-Efficacy',
    text: 'Discomfort is not dangerous. You are doing the real work of freedom right now.',
  },
  {
    id: 'c-12',
    phase: 'cresting',
    tag: 'Grounding',
    text: 'Trace a slow circle with your finger across the surface. Anchor to this movement.',
  },

  // --- SUBSIDING PHASE (5 - 8 MINS): Relief, Receding Wave, Neuroplasticity ---
  {
    id: 's-1',
    phase: 'subsiding',
    tag: 'Relief',
    text: 'The hardest part is behind you. Notice the space opening up.',
  },
  {
    id: 's-2',
    phase: 'subsiding',
    tag: 'Brain Chemistry',
    text: 'Your nervous system is settling back into baseline equilibrium.',
  },
  {
    id: 's-3',
    phase: 'subsiding',
    tag: 'Neuroplasticity',
    text: 'You just starved an old impulse and reinforced a new neural pathway.',
  },
  {
    id: 's-4',
    phase: 'subsiding',
    tag: 'Body Anchor',
    text: 'Check your stomach and forehead. Notice how the tightness is draining away.',
  },
  {
    id: 's-5',
    phase: 'subsiding',
    tag: 'Self-Efficacy',
    text: 'Feel the quiet relief of not giving in. You chose peace.',
  },
  {
    id: 's-6',
    phase: 'subsiding',
    tag: 'Breath Shift',
    text: 'Take a calm, natural breath in. Exhale with a quiet sense of ease.',
  },
  {
    id: 's-7',
    phase: 'subsiding',
    tag: 'Mindful Pause',
    text: 'Notice how the urge weakened on its own without you having to satisfy it.',
  },
  {
    id: 's-8',
    phase: 'subsiding',
    tag: 'Control',
    text: 'The wave is turning into flat water. You are steering your own life.',
  },
  {
    id: 's-9',
    phase: 'subsiding',
    tag: 'Grounding',
    text: 'Look at how smoothly the colors interact. Let your mind mirror this ease.',
  },
  {
    id: 's-10',
    phase: 'subsiding',
    tag: 'Neuroplasticity',
    text: 'Next time an urge arrives, your brain will remember that you outlasted this one.',
  },
  {
    id: 's-11',
    phase: 'subsiding',
    tag: 'Relief',
    text: 'The mental storm has cleared. Enjoy the quiet room in your thoughts.',
  },
  {
    id: 's-12',
    phase: 'subsiding',
    tag: 'Self-Efficacy',
    text: 'Minutes ago this felt intense. Look at how calm you are now.',
  },

  // --- SURFED PHASE (8+ MINS): Victory, Groundedness, Total Control ---
  {
    id: 'f-1',
    phase: 'surfed',
    tag: 'Victory',
    text: 'You just bought yourself 8 minutes. The hardest part is behind you.',
  },
  {
    id: 'f-2',
    phase: 'surfed',
    tag: 'Mastery',
    text: 'You just proved to yourself that an urge is merely a sensation, not a command.',
  },
  {
    id: 'f-3',
    phase: 'surfed',
    tag: 'Self-Efficacy',
    text: 'Feel the calm in your chest. You took back control of this moment.',
  },
  {
    id: 'f-4',
    phase: 'surfed',
    tag: 'Clarity',
    text: 'The craving passed, just as science predicts. You are stronger than your impulses.',
  },
  {
    id: 'f-5',
    phase: 'surfed',
    tag: 'Presence',
    text: 'Rest in this stillness for a moment. You earned this clarity.',
  },
  {
    id: 'f-6',
    phase: 'surfed',
    tag: 'Mastery',
    text: 'Every urge surfed is lasting freedom earned for your future self.',
  },
  {
    id: 'f-7',
    phase: 'surfed',
    tag: 'Body Anchor',
    text: 'Notice your pulse: steady, quiet, and grounded.',
  },
  {
    id: 'f-8',
    phase: 'surfed',
    tag: 'Victory',
    text: 'You chose yourself today. Be proud of this discipline.',
  },

  // --- UNIVERSAL GROUNDING PROMPTS ---
  {
    id: 'u-1',
    phase: 'any',
    tag: 'Presence',
    text: 'This breath is the only moment you need to navigate right now.',
  },
  {
    id: 'u-2',
    phase: 'any',
    tag: 'Body Anchor',
    text: 'Feel the gentle rhythm of your breathing as it rises and falls.',
  },
  {
    id: 'u-3',
    phase: 'any',
    tag: 'Control',
    text: 'Thoughts and cravings are visitors. You do not have to invite them to stay.',
  },
  {
    id: 'u-4',
    phase: 'any',
    tag: 'Mindful Pause',
    text: 'Let your eyes softly follow the gentlest swirl on your screen.',
  },
  {
    id: 'u-5',
    phase: 'any',
    tag: 'Self-Efficacy',
    text: 'Small moments of patience build lasting inner peace.',
  },
];
