import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  Wind,
  RefreshCw,
  Palette,
  Check,
  X,
  Flower2,
  Hand,
  Feather,
  Sprout,
} from 'lucide-react';

/**
 * ============================================================================
 * OPTION 4: "TOUCH GRASS" - TACTILE PROCEDURAL MEADOW IN LIGHT BREEZE
 * ============================================================================
 * A soothing, hyper-realistic interactive field of grass swaying in gentle wind waves.
 * Users can touch, drag, and part the blades of grass with real-time spring physics,
 * scatter seeds across the meadow to replant and bloom new flowers, choose from
 * Still / Whisper / Gentle breeze levels, and select from 10 meditative environmental themes.
 */

export interface MeadowTheme {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  previewColors: string[];
  skyGradient: [string, string, string]; // Top, middle, horizon
  sunGlow: {
    color: string;
    x: number; // 0..1
    y: number; // 0..1
    radius: number;
  };
  backGrass: { root: string; tip: string };
  midGrass: { root: string; tip: string };
  foreGrass: { root: string; tip: string };
  flowerTypes: ('chamomile' | 'dandelion' | 'lavender' | 'clover' | 'wheat' | 'sakura' | 'firefly' | 'glowing')[];
  particleType: 'dandelion' | 'pollen' | 'firefly' | 'dewdrop' | 'petal' | 'autumn_leaf' | 'starlight';
  fogColor: string;
}

export const MEADOW_THEMES: MeadowTheme[] = [
  {
    id: 'sunny_meadow',
    name: 'Sunny Summer Meadow',
    subtitle: 'Warm Daylight & Dandelions',
    description: 'Lush emerald green hills, golden afternoon sunbeams, yellow buttercups, and dewdrops.',
    previewColors: ['#1e4027', '#2e7d32', '#66bb6a', '#fbc02d', '#fff9c4'],
    skyGradient: ['#3b82f6', '#93c5fd', '#e0f2fe'],
    sunGlow: { color: 'rgba(254, 240, 138, 0.45)', x: 0.8, y: 0.2, radius: 260 },
    backGrass: { root: '#133519', tip: '#276831' },
    midGrass: { root: '#1e4624', tip: '#43a047' },
    foreGrass: { root: '#2e6b34', tip: '#7cb342' },
    flowerTypes: ['chamomile', 'dandelion', 'clover'],
    particleType: 'dandelion',
    fogColor: 'rgba(224, 242, 254, 0.25)',
  },
  {
    id: 'golden_sunset',
    name: 'Golden Sunset Prairie',
    subtitle: 'Warm Amber Dusk',
    description: 'Sun-drenched honey grasses, spiced terracotta sky, drifting golden chaff, and sunset warmth.',
    previewColors: ['#3e2008', '#8d4914', '#c97a2b', '#f59e0b', '#fef3c7'],
    skyGradient: ['#4c1d95', '#b45309', '#fef08a'],
    sunGlow: { color: 'rgba(251, 146, 60, 0.55)', x: 0.5, y: 0.45, radius: 320 },
    backGrass: { root: '#361c06', tip: '#78350f' },
    midGrass: { root: '#451a03', tip: '#b45309' },
    foreGrass: { root: '#78350f', tip: '#f59e0b' },
    flowerTypes: ['wheat', 'clover'],
    particleType: 'pollen',
    fogColor: 'rgba(254, 215, 170, 0.30)',
  },
  {
    id: 'lavender_field',
    name: 'Lavender & Herb Garden',
    subtitle: 'Calming Violet Aromatherapy',
    description: 'Soft purple lavender spikes, organic sage green foliage, and gentle twilight breeze.',
    previewColors: ['#1e142b', '#3b2554', '#6b4c8a', '#a78bfa', '#ede9fe'],
    skyGradient: ['#1e1b4b', '#4c1d95', '#c4b5fd'],
    sunGlow: { color: 'rgba(196, 181, 253, 0.35)', x: 0.75, y: 0.25, radius: 240 },
    backGrass: { root: '#1e1b2e', tip: '#3f3956' },
    midGrass: { root: '#282b30', tip: '#586b5e' },
    foreGrass: { root: '#334138', tip: '#8b5cf6' },
    flowerTypes: ['lavender', 'chamomile'],
    particleType: 'pollen',
    fogColor: 'rgba(196, 181, 253, 0.20)',
  },
  {
    id: 'alpine_spring',
    name: 'Alpine Mountain Pasture',
    subtitle: 'Crisp Mountain Breeze & Forget-Me-Nots',
    description: 'Crisp glacial mountain air, vibrant spring jade blades, and delicate blue alpine flowers.',
    previewColors: ['#0f2922', '#1b4d3e', '#2e856e', '#38bdf8', '#e0f2fe'],
    skyGradient: ['#0284c7', '#38bdf8', '#e0f2fe'],
    sunGlow: { color: 'rgba(224, 242, 254, 0.50)', x: 0.2, y: 0.25, radius: 280 },
    backGrass: { root: '#0c241c', tip: '#174737' },
    midGrass: { root: '#133a2d', tip: '#2a755d' },
    foreGrass: { root: '#1b4d3e', tip: '#4ade80' },
    flowerTypes: ['chamomile', 'clover'],
    particleType: 'dewdrop',
    fogColor: 'rgba(224, 242, 254, 0.28)',
  },
  {
    id: 'midnight_fireflies',
    name: 'Midnight Firefly Glade',
    subtitle: 'Luminescent Evening Peace',
    description: 'Deep velvet indigo blades illuminated by pulsating golden & emerald fireflies under starlight.',
    previewColors: ['#060814', '#0d1326', '#142742', '#34d399', '#fde047'],
    skyGradient: ['#030712', '#0f172a', '#1e293b'],
    sunGlow: { color: 'rgba(52, 211, 153, 0.22)', x: 0.5, y: 0.2, radius: 300 },
    backGrass: { root: '#060b13', tip: '#0f202e' },
    midGrass: { root: '#0a1724', tip: '#173647' },
    foreGrass: { root: '#0f2434', tip: '#246b5a' },
    flowerTypes: ['firefly'],
    particleType: 'firefly',
    fogColor: 'rgba(15, 23, 42, 0.45)',
  },
  {
    id: 'sakura_blossom',
    name: 'Sakura Breeze Meadow',
    subtitle: 'Pastel Petals in Spring Wind',
    description: 'Dusky pink horizon, soft mossy green grasses, and floating cherry blossom petals drifting by.',
    previewColors: ['#24121a', '#4a2536', '#834763', '#f472b6', '#fdf2f8'],
    skyGradient: ['#4a044e', '#831843', '#fbcfe8'],
    sunGlow: { color: 'rgba(244, 114, 182, 0.35)', x: 0.85, y: 0.3, radius: 270 },
    backGrass: { root: '#1c1f1a', tip: '#353c30' },
    midGrass: { root: '#293325', tip: '#57684e' },
    foreGrass: { root: '#3b4a36', tip: '#86efac' },
    flowerTypes: ['sakura', 'chamomile'],
    particleType: 'petal',
    fogColor: 'rgba(251, 207, 232, 0.25)',
  },
  {
    id: 'misty_morning',
    name: 'Misty Morning Dew',
    subtitle: 'Tranquil Fog & Silver Drops',
    description: 'Ethereal morning fog rising over deep teal & sage grasses with shimmering dew on every tip.',
    previewColors: ['#0d1c1a', '#1a3633', '#315e58', '#6ee7b7', '#ccfbf1'],
    skyGradient: ['#134e4a', '#2dd4bf', '#ccfbf1'],
    sunGlow: { color: 'rgba(204, 251, 241, 0.45)', x: 0.5, y: 0.35, radius: 340 },
    backGrass: { root: '#0d1f1c', tip: '#1c3e39' },
    midGrass: { root: '#163530', tip: '#2f635c' },
    foreGrass: { root: '#214e47', tip: '#5eead4' },
    flowerTypes: ['clover'],
    particleType: 'dewdrop',
    fogColor: 'rgba(204, 251, 241, 0.38)',
  },
  {
    id: 'autumn_whisper',
    name: 'Autumn Whisper Field',
    subtitle: 'Russet Ochre & Drifting Leaves',
    description: 'Rich auburn and bronze meadow grasses with crisp autumn winds and drifting gold leaves.',
    previewColors: ['#261005', '#522208', '#8a3c0f', '#d97706', '#fef3c7'],
    skyGradient: ['#451a03', '#9a3412', '#fed7aa'],
    sunGlow: { color: 'rgba(251, 146, 60, 0.40)', x: 0.3, y: 0.3, radius: 290 },
    backGrass: { root: '#2b1406', tip: '#5c2b0d' },
    midGrass: { root: '#3d1b08', tip: '#8c3d10' },
    foreGrass: { root: '#57270c', tip: '#d97706' },
    flowerTypes: ['wheat'],
    particleType: 'autumn_leaf',
    fogColor: 'rgba(254, 215, 170, 0.28)',
  },
  {
    id: 'zen_bamboo',
    name: 'Zen Bamboo Moss Garden',
    subtitle: 'Minimalist Jade Sanctuary',
    description: 'Serene slender reeds, deep dark river moss, soothing simplicity, and gentle whispering air.',
    previewColors: ['#0a140d', '#14291a', '#274e33', '#4ade80', '#dcfce7'],
    skyGradient: ['#064e3b', '#059669', '#d1fae5'],
    sunGlow: { color: 'rgba(209, 250, 229, 0.35)', x: 0.65, y: 0.2, radius: 260 },
    backGrass: { root: '#0d1e13', tip: '#1c3825' },
    midGrass: { root: '#132e1d', tip: '#295738' },
    foreGrass: { root: '#1b3f27', tip: '#4ade80' },
    flowerTypes: ['clover'],
    particleType: 'pollen',
    fogColor: 'rgba(209, 250, 229, 0.22)',
  },
  {
    id: 'bioluminescent_astro',
    name: 'Bioluminescent Star Meadow',
    subtitle: 'Cosmic Turquoise & Aurora Grass',
    description: 'Dreamlike starry violet atmosphere with glowing neon cyan tips that sparkle when touched.',
    previewColors: ['#080417', '#150d36', '#251b54', '#38bdf8', '#e879f9'],
    skyGradient: ['#020617', '#1e1b4b', '#4c1d95'],
    sunGlow: { color: 'rgba(56, 189, 248, 0.30)', x: 0.5, y: 0.15, radius: 320 },
    backGrass: { root: '#09081a', tip: '#1b173e' },
    midGrass: { root: '#12112e', tip: '#2a235c' },
    foreGrass: { root: '#1c1945', tip: '#38bdf8' },
    flowerTypes: ['glowing', 'firefly'],
    particleType: 'starlight',
    fogColor: 'rgba(76, 29, 149, 0.30)',
  },
];

interface GrassBlade {
  x: number;
  baseY: number;
  height: number;
  width: number;
  layer: number; // 0 = back, 1 = mid, 2 = front
  naturalAngle: number; // Rest curvature
  currentAngle: number; // Instantaneous angle
  angularVel: number; // Angular velocity for spring physics
  stiffness: number; // Spring constant
  damping: number; // Velocity damping
  curveFactor: number; // Bendiness
  colorRoot: string;
  colorTip: string;
  hasFlower?: 'chamomile' | 'dandelion' | 'lavender' | 'clover' | 'wheat' | 'sakura' | 'firefly' | 'glowing';
  flowerSize?: number;
  bloomScale?: number; // 0.0 -> 1.0 growth animation
}

interface MeadowParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  rot: number;
  vRot: number;
  life: number;
  maxLife: number;
  type: string;
}

interface PointerInfo {
  x: number;
  y: number;
  px: number;
  py: number;
  speed: number;
}

interface Option4Props {
  className?: string;
}

export const Option4_TouchGrassView: React.FC<Option4Props> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // User Interactive State - Default to Whisper and Allow Still (Zero Wind)
  const [selectedThemeId, setSelectedThemeId] = useState<string>('sunny_meadow');
  const [breezeLevel, setBreezeLevel] = useState<'still' | 'whisper' | 'gentle'>('whisper');
  const [showThemeDrawer, setShowThemeDrawer] = useState<boolean>(false);
  const [bladesTouchedCount, setBladesTouchedCount] = useState<number>(0);
  const [seedsPlantedCount, setSeedsPlantedCount] = useState<number>(0);

  // Multi-Touch tracking
  const activePointers = useRef<Map<number, PointerInfo>>(new Map());

  // Simulation parameters refs for zero React lag
  const bladesRef = useRef<GrassBlade[]>([]);
  const particlesRef = useRef<MeadowParticle[]>([]);

  const selectedThemeRef = useRef<string>('sunny_meadow');
  useEffect(() => {
    selectedThemeRef.current = selectedThemeId;
  }, [selectedThemeId]);

  const breezeLevelRef = useRef<'still' | 'whisper' | 'gentle'>('whisper');
  useEffect(() => {
    breezeLevelRef.current = breezeLevel;
  }, [breezeLevel]);

  // Generate procedural blades when canvas or theme changes
  const initMeadow = (width: number, height: number) => {
    const theme = MEADOW_THEMES.find((t) => t.id === selectedThemeRef.current) || MEADOW_THEMES[0];
    const blades: GrassBlade[] = [];

    // Density of grass blades based on canvas width (1400 - 2600 blades for dense lush meadow)
    const bladeCount = Math.max(1200, Math.min(2600, Math.floor(width * 1.8)));

    for (let i = 0; i < bladeCount; i++) {
      const layerRand = Math.random();
      const layer = layerRand < 0.35 ? 0 : layerRand < 0.75 ? 1 : 2;

      // Base Y position distributed across lower half of screen
      const yMin = height * 0.72;
      const yMax = height * 1.02;
      const baseY = yMin + Math.random() * (yMax - yMin);

      // Height scales by layer (foreground is taller and wider)
      let baseHeight = height * (0.28 + Math.random() * 0.38);
      let bladeWidth = 2.5 + Math.random() * 2.5;

      let colorRoot = theme.midGrass.root;
      let colorTip = theme.midGrass.tip;

      if (layer === 0) {
        baseHeight *= 0.65;
        bladeWidth *= 0.7;
        colorRoot = theme.backGrass.root;
        colorTip = theme.backGrass.tip;
      } else if (layer === 2) {
        baseHeight *= 1.25;
        bladeWidth *= 1.35;
        colorRoot = theme.foreGrass.root;
        colorTip = theme.foreGrass.tip;
      }

      // Natural random curvature lean
      const naturalAngle = (Math.random() - 0.48) * 0.35;

      // Flowers on select blades initially
      let hasFlower: GrassBlade['hasFlower'] = undefined;
      let flowerSize = 0;
      if (layer >= 1 && Math.random() < 0.045 && theme.flowerTypes.length > 0) {
        hasFlower = theme.flowerTypes[Math.floor(Math.random() * theme.flowerTypes.length)];
        flowerSize = (hasFlower === 'chamomile' || hasFlower === 'dandelion' ? 9 : 14) + Math.random() * 6;
        if (layer === 2) flowerSize *= 1.2;
      }

      blades.push({
        x: Math.random() * width,
        baseY,
        height: baseHeight,
        width: bladeWidth,
        layer,
        naturalAngle,
        currentAngle: naturalAngle + (Math.random() - 0.5) * 0.1,
        angularVel: 0,
        stiffness: 14.0 + Math.random() * 10.0,
        damping: 3.2 + Math.random() * 1.2,
        curveFactor: 0.6 + Math.random() * 0.5,
        colorRoot,
        colorTip,
        hasFlower,
        flowerSize,
        bloomScale: 1.0,
      });
    }

    // Sort blades by layer and Y so background renders behind foreground
    blades.sort((a, b) => {
      if (a.layer !== b.layer) return a.layer - b.layer;
      return a.baseY - b.baseY;
    });

    bladesRef.current = blades;

    // Seed initial ambient particles (dandelion parachutes, fireflies, pollen motes)
    const initialParticles: MeadowParticle[] = [];
    for (let p = 0; p < 45; p++) {
      initialParticles.push({
        x: Math.random() * width,
        y: Math.random() * height * 0.9,
        vx: 15 + Math.random() * 35,
        vy: (Math.random() - 0.5) * 12,
        size: 2.5 + Math.random() * 4.5,
        alpha: 0.3 + Math.random() * 0.6,
        rot: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 1.5,
        life: Math.random() * 10,
        maxLife: 8 + Math.random() * 12,
        type: theme.particleType,
      });
    }
    particlesRef.current = initialParticles;
  };

  // Replant and sprout new flowers dynamically across blades
  const replantRandomBlades = (count = 12) => {
    const theme = MEADOW_THEMES.find((t) => t.id === selectedThemeRef.current) || MEADOW_THEMES[0];
    if (theme.flowerTypes.length === 0 || bladesRef.current.length === 0) return;

    const availableBlades = bladesRef.current.filter((b) => b.layer >= 1 && (!b.hasFlower || (b.bloomScale || 1) >= 1));
    if (availableBlades.length === 0) return;

    let planted = 0;
    for (let i = 0; i < count; i++) {
      const targetIdx = Math.floor(Math.random() * availableBlades.length);
      const targetBlade = availableBlades[targetIdx];
      if (targetBlade) {
        const flowerType = theme.flowerTypes[Math.floor(Math.random() * theme.flowerTypes.length)];
        let fSize = (flowerType === 'chamomile' || flowerType === 'dandelion' ? 9 : 14) + Math.random() * 6;
        if (targetBlade.layer === 2) fSize *= 1.2;

        targetBlade.hasFlower = flowerType;
        targetBlade.flowerSize = fSize;
        targetBlade.bloomScale = 0.05; // starts small and smoothly blooms open
        planted++;
      }
    }
    if (planted > 0) {
      setSeedsPlantedCount((prev) => prev + planted);
    }
  };

  // Scatter dandelion seeds / pollen across multiple randomized distributed points across the whole meadow & replant
  const scatterSeedsFieldWide = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.width;
    const h = canvas.height;
    const theme = MEADOW_THEMES.find((t) => t.id === selectedThemeRef.current) || MEADOW_THEMES[0];

    // Pick 10-16 distinct randomized seed origination points across the meadow
    const originCount = 12 + Math.floor(Math.random() * 6);
    for (let o = 0; o < originCount; o++) {
      const origX = Math.random() * w;
      const origY = h * 0.55 + Math.random() * (h * 0.35);
      const seedsPerOrigin = 4 + Math.floor(Math.random() * 4);

      for (let s = 0; s < seedsPerOrigin; s++) {
        const angle = -Math.PI * 0.5 + (Math.random() - 0.5) * 1.4; // upward spread
        const speed = 35 + Math.random() * 75;
        particlesRef.current.push({
          x: origX + (Math.random() - 0.5) * 25,
          y: origY + (Math.random() - 0.5) * 20,
          vx: Math.cos(angle) * speed + 20,
          vy: Math.sin(angle) * speed - 15,
          size: 2.5 + Math.random() * 4.0,
          alpha: 0.75 + Math.random() * 0.25,
          rot: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 2.5,
          life: 0,
          maxLife: 7 + Math.random() * 8,
          type: theme.particleType,
        });
      }
    }

    // Simultaneously replant and bloom new flowers across the field
    replantRandomBlades(10 + Math.floor(Math.random() * 6));
  };

  // Scatter pollen from local touch point
  const spawnPollenBurst = (x: number, y: number, count = 8) => {
    const theme = MEADOW_THEMES.find((t) => t.id === selectedThemeRef.current) || MEADOW_THEMES[0];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 25 + Math.random() * 70;
      particlesRef.current.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed + 15,
        vy: Math.sin(angle) * speed - 15,
        size: 2.5 + Math.random() * 4.0,
        alpha: 0.7 + Math.random() * 0.3,
        rot: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 2.5,
        life: 0,
        maxLife: 6 + Math.random() * 8,
        type: theme.particleType,
      });
    }
  };

  // Main Animation & Physics Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animId: number;
    let lastTime = performance.now();
    let simTime = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      const w = Math.floor(rect.width * dpr);
      const h = Math.floor(rect.height * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        initMeadow(w, h);
      }
    };

    resize();
    window.addEventListener('resize', resize);

    const render = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      simTime += dt;

      const width = canvas.width;
      const height = canvas.height;
      const theme = MEADOW_THEMES.find((t) => t.id === selectedThemeRef.current) || MEADOW_THEMES[0];

      // Wind parameters based on selected breeze level (Still = 0, Whisper = 0.45, Gentle = 0.95)
      const isStill = breezeLevelRef.current === 'still';
      const bSpeed = isStill ? 0 : breezeLevelRef.current === 'whisper' ? 0.45 : 0.95;
      const bAmp = isStill ? 0 : breezeLevelRef.current === 'whisper' ? 0.12 : 0.26;

      // ======================================================================
      // 1. Draw Meditative Atmospheric Sky Background
      // ======================================================================
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, theme.skyGradient[0]);
      skyGrad.addColorStop(0.55, theme.skyGradient[1]);
      skyGrad.addColorStop(1, theme.skyGradient[2]);
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Sun / Ambient Celestial Light Glow
      const sunX = width * theme.sunGlow.x;
      const sunY = height * theme.sunGlow.y;
      const sunGrad = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, theme.sunGlow.radius * 2);
      sunGrad.addColorStop(0, theme.sunGlow.color);
      sunGrad.addColorStop(0.5, theme.sunGlow.color.replace(/[\d\.]+\)$/, '0.12)'));
      sunGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = sunGrad;
      ctx.fillRect(0, 0, width, height);

      // Distant rolling meadow hill silhouettes
      ctx.save();
      ctx.fillStyle = theme.backGrass.root;
      ctx.beginPath();
      ctx.moveTo(0, height * 0.68);
      for (let x = 0; x <= width; x += 40) {
        const hillY =
          height * 0.68 +
          Math.sin(x * 0.002 + 1.2) * (height * 0.04) +
          Math.sin(x * 0.005) * (height * 0.02);
        ctx.lineTo(x, hillY);
      }
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // ======================================================================
      // 2. Simulate & Render Procedural Grass Blades
      // ======================================================================
      const blades = bladesRef.current;
      const pointers: PointerInfo[] = Array.from(activePointers.current.values());

      let touchedThisFrame = 0;

      for (let i = 0; i < blades.length; i++) {
        const blade = blades[i];

        // Animate blooming flower growth
        if (blade.bloomScale !== undefined && blade.bloomScale < 1.0) {
          blade.bloomScale = Math.min(1.0, blade.bloomScale + dt * 1.8);
        }

        // Multi-harmonic wind wave simulation (Traveling Sine Harmonics) - 0 when Still
        let targetWindAngle = blade.naturalAngle;
        if (!isStill) {
          const windWave1 = Math.sin(blade.x * 0.0035 - simTime * bSpeed * 1.8 + blade.layer * 0.8);
          const windWave2 = Math.cos(blade.x * 0.008 + simTime * bSpeed * 2.5);
          const windWave3 = Math.sin(blade.x * 0.0015 - simTime * bSpeed * 0.9);

          targetWindAngle +=
            (windWave1 * 0.65 + windWave2 * 0.25 + windWave3 * 0.4) * bAmp * (0.6 + blade.layer * 0.4);
        }

        // Touch & Finger Interaction: Part and bend grass blades under touch
        for (let p = 0; p < pointers.length; p++) {
          const ptr = pointers[p];
          const tipX = blade.x + Math.sin(blade.currentAngle) * blade.height;
          const tipY = blade.baseY - Math.cos(blade.currentAngle) * blade.height;

          const dx = tipX - ptr.x;
          const dy = tipY - ptr.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          const touchRadius = (90 + (blade.layer === 2 ? 40 : 0)) * (window.devicePixelRatio || 1);

          if (dist < touchRadius) {
            touchedThisFrame++;
            const pushFactor = 1 - dist / touchRadius;
            // Push grass aside in the direction away from the finger + swipe velocity impulse
            const pushDir = dx >= 0 ? 1 : -1;
            const velocityImpulse = (ptr.x - ptr.px) * 0.015;
            targetWindAngle += pushDir * pushFactor * 1.1 + velocityImpulse;
          }
        }

        // Spring Physics (Hooke's Law + Damping)
        const springForce = (targetWindAngle - blade.currentAngle) * blade.stiffness;
        const dampingForce = -blade.angularVel * blade.damping;
        const angularAcc = springForce + dampingForce;

        blade.angularVel += angularAcc * dt;
        blade.currentAngle += blade.angularVel * dt;

        // Draw Grass Blade as Smooth Quadratic Bézier Ribbon
        const tipX = blade.x + Math.sin(blade.currentAngle) * blade.height;
        const tipY = blade.baseY - Math.cos(blade.currentAngle) * blade.height;
        const cpX = blade.x + Math.sin(blade.currentAngle * 0.5) * (blade.height * blade.curveFactor);
        const cpY = blade.baseY - blade.height * 0.55;

        const bladeGrad = ctx.createLinearGradient(blade.x, blade.baseY, tipX, tipY);
        bladeGrad.addColorStop(0, blade.colorRoot);
        bladeGrad.addColorStop(0.7, blade.colorTip);
        // Sunlit tip highlight
        bladeGrad.addColorStop(1, blade.layer === 2 ? '#ffffff' : blade.colorTip);

        ctx.strokeStyle = bladeGrad;
        ctx.lineWidth = blade.width;
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.moveTo(blade.x, blade.baseY);
        ctx.quadraticCurveTo(cpX, cpY, tipX, tipY);
        ctx.stroke();

        // Draw flowers or florets attached to the blade tip
        if (blade.hasFlower) {
          const rawSize = blade.flowerSize || 10;
          const bloom = blade.bloomScale !== undefined ? blade.bloomScale : 1.0;
          const fSize = rawSize * bloom;

          if (fSize > 0.5) {
            ctx.save();
            ctx.translate(tipX, tipY);
            ctx.rotate(blade.currentAngle);

            if (blade.hasFlower === 'chamomile') {
              // White petals with golden yolk center
              ctx.fillStyle = '#ffffff';
              for (let petal = 0; petal < 8; petal++) {
                ctx.beginPath();
                ctx.rotate((Math.PI * 2) / 8);
                ctx.ellipse(0, fSize * 0.5, fSize * 0.22, fSize * 0.45, 0, 0, Math.PI * 2);
                ctx.fill();
              }
              ctx.fillStyle = '#f59e0b';
              ctx.beginPath();
              ctx.arc(0, 0, fSize * 0.28, 0, Math.PI * 2);
              ctx.fill();
            } else if (blade.hasFlower === 'dandelion') {
              // Fluffy dandelion puff or golden flower
              ctx.fillStyle = '#fbbf24';
              for (let d = 0; d < 12; d++) {
                ctx.beginPath();
                ctx.rotate((Math.PI * 2) / 12);
                ctx.ellipse(0, fSize * 0.45, fSize * 0.15, fSize * 0.35, 0, 0, Math.PI * 2);
                ctx.fill();
              }
              ctx.fillStyle = '#d97706';
              ctx.beginPath();
              ctx.arc(0, 0, fSize * 0.25, 0, Math.PI * 2);
              ctx.fill();
            } else if (blade.hasFlower === 'lavender') {
              // Violet stacked blossom beads
              ctx.fillStyle = '#a78bfa';
              for (let b = 0; b < 5; b++) {
                ctx.beginPath();
                ctx.ellipse(0, -b * (fSize * 0.4), fSize * 0.25, fSize * 0.35, 0, 0, Math.PI * 2);
                ctx.fill();
              }
            } else if (blade.hasFlower === 'clover') {
              // 3 Heart-shaped emerald leaflets
              ctx.fillStyle = '#4ade80';
              for (let c = 0; c < 3; c++) {
                ctx.beginPath();
                ctx.rotate((Math.PI * 2) / 3);
                ctx.ellipse(0, fSize * 0.4, fSize * 0.3, fSize * 0.35, 0, 0, Math.PI * 2);
                ctx.fill();
              }
            } else if (blade.hasFlower === 'wheat') {
              // Golden grain ears
              ctx.fillStyle = '#f59e0b';
              for (let w = 0; w < 6; w++) {
                ctx.beginPath();
                ctx.ellipse(
                  (w % 2 === 0 ? 1 : -1) * (fSize * 0.2),
                  -w * (fSize * 0.35),
                  fSize * 0.2,
                  fSize * 0.35,
                  0.4,
                  0,
                  Math.PI * 2
                );
                ctx.fill();
              }
            } else if (blade.hasFlower === 'sakura') {
              // Delicate pink cherry blossom
              ctx.fillStyle = '#f472b6';
              for (let s = 0; s < 5; s++) {
                ctx.beginPath();
                ctx.rotate((Math.PI * 2) / 5);
                ctx.ellipse(0, fSize * 0.45, fSize * 0.25, fSize * 0.4, 0, 0, Math.PI * 2);
                ctx.fill();
              }
              ctx.fillStyle = '#fb7185';
              ctx.beginPath();
              ctx.arc(0, 0, fSize * 0.2, 0, Math.PI * 2);
              ctx.fill();
            } else if (blade.hasFlower === 'firefly' || blade.hasFlower === 'glowing') {
              // Pulsating glowing lantern orb
              const glowPulse = Math.sin(simTime * 4 + blade.x) * 0.5 + 0.5;
              ctx.fillStyle = blade.hasFlower === 'glowing' ? '#38bdf8' : '#34d399';
              ctx.shadowColor = ctx.fillStyle;
              ctx.shadowBlur = 15 * glowPulse;
              ctx.beginPath();
              ctx.arc(0, 0, fSize * 0.25 * (0.8 + glowPulse * 0.4), 0, Math.PI * 2);
              ctx.fill();
              ctx.shadowBlur = 0;
            }

            ctx.restore();
          }
        }
      }

      if (touchedThisFrame > 0) {
        setBladesTouchedCount((prev) => prev + Math.min(touchedThisFrame, 4));
      }

      // ======================================================================
      // 3. Render Floating Meadow Particles (Dandelion Parachutes, Motes, Leaves)
      // ======================================================================
      const particles = particlesRef.current;
      for (let p = particles.length - 1; p >= 0; p--) {
        const pt = particles[p];
        pt.life += dt;
        if (pt.life >= pt.maxLife) {
          // Recycle to left or random top point
          pt.x = Math.random() < 0.3 ? -20 : Math.random() * width;
          pt.y = Math.random() * height * 0.75;
          pt.life = 0;
        }

        // Wind drift motion (calm thermal float when still, drifting drift in breeze)
        const windX = isStill ? 0 : pt.vx * bSpeed;
        pt.x += (windX + Math.sin(simTime * 0.8 + pt.y * 0.01) * 8) * dt;
        pt.y += (pt.vy + Math.cos(simTime * 1.2 + pt.x * 0.01) * 6) * dt;
        pt.rot += pt.vRot * dt;

        ctx.save();
        ctx.translate(pt.x, pt.y);
        ctx.rotate(pt.rot);
        ctx.globalAlpha = Math.sin((pt.life / pt.maxLife) * Math.PI) * pt.alpha;

        if (pt.type === 'dandelion') {
          // Delicate fluffy seed parachute with stalk
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(0, pt.size * 2.2);
          ctx.stroke();

          // Crown tuft
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          for (let tuft = 0; tuft < 6; tuft++) {
            ctx.beginPath();
            ctx.rotate((Math.PI * 2) / 6);
            ctx.moveTo(0, 0);
            ctx.lineTo(pt.size * 1.2, -pt.size * 0.4);
            ctx.stroke();
          }
        } else if (pt.type === 'firefly') {
          // Glowing pulsing firefly
          const fireflyPulse = Math.sin(simTime * 5 + pt.x) * 0.5 + 0.5;
          ctx.fillStyle = 'rgba(253, 224, 71, 0.9)';
          ctx.shadowColor = '#34d399';
          ctx.shadowBlur = 12 * fireflyPulse;
          ctx.beginPath();
          ctx.arc(0, 0, pt.size * (0.7 + fireflyPulse * 0.5), 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        } else if (pt.type === 'petal') {
          // Sakura petal
          ctx.fillStyle = 'rgba(244, 114, 182, 0.85)';
          ctx.beginPath();
          ctx.ellipse(0, 0, pt.size * 1.4, pt.size * 0.8, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (pt.type === 'autumn_leaf') {
          // Golden maple leaf
          ctx.fillStyle = 'rgba(245, 158, 11, 0.85)';
          ctx.beginPath();
          ctx.ellipse(0, 0, pt.size * 1.5, pt.size * 0.9, 0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Sun pollen mote / dewdrop sparkle
          ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
          ctx.beginPath();
          ctx.arc(0, 0, pt.size * 0.6, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      // Atmospheric meadow ground fog mist overlay
      const fogGrad = ctx.createLinearGradient(0, height * 0.8, 0, height);
      fogGrad.addColorStop(0, 'rgba(0,0,0,0)');
      fogGrad.addColorStop(1, theme.fogColor);
      ctx.fillStyle = fogGrad;
      ctx.fillRect(0, height * 0.78, width, height * 0.22);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  // Multi-Touch & Mouse Gesture Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const x = (e.clientX - rect.left) * dpr;
    const y = (e.clientY - rect.top) * dpr;

    activePointers.current.set(e.pointerId, { x, y, px: x, py: y, speed: 0 });

    spawnPollenBurst(x, y, 6);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const ptr = activePointers.current.get(e.pointerId);
    if (!ptr) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const x = (e.clientX - rect.left) * dpr;
    const y = (e.clientY - rect.top) * dpr;

    const dx = x - ptr.px;
    const dy = y - ptr.py;
    const dist = Math.hypot(dx, dy);

    ptr.px = ptr.x;
    ptr.py = ptr.y;
    ptr.x = x;
    ptr.y = y;
    ptr.speed = dist;

    // Release occasional seeds when moving swiftly through meadow
    if (Math.random() < 0.22 && dist > 6) {
      spawnPollenBurst(x, y, 2);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    activePointers.current.delete(e.pointerId);
  };

  const currentTheme = useMemo(
    () => MEADOW_THEMES.find((t) => t.id === selectedThemeId) || MEADOW_THEMES[0],
    [selectedThemeId]
  );

  return (
    <div className={`relative w-full h-full select-none overflow-hidden bg-stone-950 ${className}`}>
      {/* Meadow Grass Canvas */}
      <canvas
        ref={canvasRef}
        id="opt4-grass-canvas"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="w-full h-full block cursor-grab active:cursor-grabbing touch-none"
      />

      {/* Subtle Mobile Touch Cue */}
      <div className="absolute top-28 left-1/2 -translate-x-1/2 pointer-events-none z-10 select-none">
        <p className="text-xs text-stone-300/80 bg-stone-950/40 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/5">
          Run your finger over the grass
        </p>
      </div>

      {/* Bottom Floating Control Bar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 w-full max-w-lg px-4 flex flex-col items-center pointer-events-none select-none">
        <div className="bg-stone-950/85 backdrop-blur-2xl border border-white/10 rounded-2xl p-1.5 shadow-2xl flex items-center justify-center gap-1.5 pointer-events-auto transition-all">
          {/* Scatter Seeds & Bloom Action */}
          <button
            id="opt4-dandelion-btn"
            type="button"
            onClick={scatterSeedsFieldWide}
            className="h-8 flex items-center space-x-1.5 px-3 rounded-xl text-xs font-medium bg-gradient-to-r from-amber-600/30 to-emerald-600/30 text-amber-100 border border-amber-500/40 hover:brightness-125 active:scale-95 transition-all shadow-sm"
            title="Scatter seeds & bloom flowers"
          >
            <Feather className="w-3.5 h-3.5 text-amber-300" />
            <span>Bloom</span>
          </button>

          {/* Soothing Meadow Themes Drawer Toggle */}
          <button
            id="opt4-theme-toggle-btn"
            type="button"
            onClick={() => {
              setShowThemeDrawer(!showThemeDrawer);
            }}
            className={`h-8 flex items-center space-x-1.5 px-3 rounded-xl text-xs font-medium border transition-all ${
              showThemeDrawer
                ? 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40 shadow-sm'
                : 'bg-stone-800/80 text-stone-300 border-stone-700 hover:bg-stone-700/80'
            }`}
            title="Choose Meadow Theme"
          >
            <Palette className="w-3.5 h-3.5 text-emerald-400" />
            <span>Theme</span>
          </button>

          {/* Breeze Toggle */}
          <button
            id="opt4-breeze-speed-btn"
            type="button"
            onClick={() => {
              setBreezeLevel((prev) => (prev === 'whisper' ? 'gentle' : prev === 'gentle' ? 'still' : 'whisper'));
            }}
            className={`h-8 w-8 flex items-center justify-center rounded-xl border transition-all ${
              breezeLevel === 'still'
                ? 'bg-stone-800/50 text-stone-400 border-stone-700/60'
                : 'bg-teal-950/40 text-teal-200 border-teal-500/40'
            }`}
            title={`Breeze: ${breezeLevel}`}
          >
            <Wind className={`w-3.5 h-3.5 ${breezeLevel === 'still' ? 'text-stone-500 opacity-60' : 'text-teal-400'}`} />
          </button>

          {/* Reset Meadow */}
          <button
            id="opt4-reset-btn"
            type="button"
            onClick={() => {
              if (canvasRef.current) {
                initMeadow(canvasRef.current.width, canvasRef.current.height);
                setBladesTouchedCount(0);
                setSeedsPlantedCount(0);
              }
            }}
            className="h-8 w-8 flex items-center justify-center rounded-xl text-stone-400 hover:text-stone-200 border border-stone-800 hover:bg-stone-800/80 transition-all"
            title="Reset Meadow"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 10 Soothing Meadow Environments Drawer */}
        {showThemeDrawer && (
          <div
            id="opt4-meadow-theme-drawer"
            className="mt-2 w-full max-w-xl max-h-[52vh] overflow-y-auto p-3.5 bg-stone-900/95 backdrop-blur-2xl rounded-2xl border border-stone-800/90 shadow-2xl pointer-events-auto flex flex-col space-y-2.5 text-xs text-stone-200 animate-in fade-in slide-in-from-bottom-3"
          >
            <div className="flex items-center justify-between pb-1.5 border-b border-stone-800/80">
              <div className="flex items-center space-x-2">
                <Flower2 className="w-4 h-4 text-emerald-400" />
                <div>
                  <h3 className="font-semibold text-stone-100 text-xs sm:text-sm tracking-wide">
                    10 Soothing Meadow Themes
                  </h3>
                  <p className="text-[10px] text-stone-400">
                    Different skies, wild flora, and atmospheric lighting
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowThemeDrawer(false)}
                className="p-1 text-stone-400 hover:text-stone-200 rounded-lg hover:bg-stone-800 transition-colors"
                title="Close Themes"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Theme Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {MEADOW_THEMES.map((theme) => {
                const isSelected = theme.id === selectedThemeId;
                return (
                  <button
                    key={theme.id}
                    id={`meadow-theme-${theme.id}`}
                    onClick={() => {
                      setSelectedThemeId(theme.id);
                      if (canvasRef.current) {
                        initMeadow(canvasRef.current.width, canvasRef.current.height);
                      }
                    }}
                    className={`flex flex-col text-left p-2.5 rounded-xl border transition-all relative group ${
                      isSelected
                        ? 'bg-emerald-950/40 border-emerald-500/60 ring-1 ring-emerald-500/40 shadow-md'
                        : 'bg-stone-950/50 border-stone-800/70 hover:bg-stone-800/60 hover:border-stone-700'
                    }`}
                  >
                    {/* Color Preview Strip */}
                    <div className="h-3 w-full rounded-md overflow-hidden flex mb-2 border border-white/10 shadow-inner">
                      {theme.previewColors.map((color, idx) => (
                        <div key={idx} className="flex-1 h-full" style={{ backgroundColor: color }} />
                      ))}
                    </div>

                    <div className="flex items-start justify-between">
                      <div>
                        <p
                          className={`font-semibold text-xs transition-colors ${
                            isSelected ? 'text-emerald-200' : 'text-stone-200 group-hover:text-white'
                          }`}
                        >
                          {theme.name}
                        </p>
                        <p className="text-[10px] text-emerald-400/90 font-medium">{theme.subtitle}</p>
                        <p className="text-[10px] text-stone-400 line-clamp-1 mt-0.5">
                          {theme.description}
                        </p>
                      </div>

                      {isSelected && (
                        <div className="ml-2 flex-shrink-0 w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
