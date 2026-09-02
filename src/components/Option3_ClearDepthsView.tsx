import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Waves, RefreshCw, Compass, Droplets, Fish, Moon, Sun, Eye, Clock } from 'lucide-react';

/**
 * ============================================================================
 * Option 3: Clear Depths (Water Reveal & Underwater Discovery)
 * ============================================================================
 * A serene, mysterious body of water shrouded in meditative fog.
 * Sliding your finger gently parts the veil, unveiling rich distinctive riverbeds,
 * sea glass, glowing crystals, and realistic slow-gliding aquatic life.
 *
 * Two-Stage Veiling Architecture:
 * 1. Stage 1 (3s / 5s / 8s): Cleared window veils back to murky surface opacity / transparency.
 * 2. Stage 2 (+10s additional): Over an extra duration of quiet stillness, the water veils completely to deep serene darkness.
 * Touching at any time immediately pierces through both darkness and murkiness back to crisp transparency.
 */

interface Option3Props {
  className?: string;
  onInteraction?: () => void;
}

export type BiomeType = 'koi_pond' | 'ocean_tidepool' | 'midnight_lake';
export type RevealSpeed = 'slow' | 'medium' | 'fast';

// Fish species types across biomes
export type FishSpecies =
  // Koi Pond
  | 'koi_kohaku'
  | 'koi_sanke'
  | 'koi_ogon'
  | 'koi_tancho'
  // Tide Pool
  | 'reef_bluetang'
  | 'reef_clownfish'
  | 'reef_butterfly'
  | 'reef_damselfish'
  // Midnight Bioluminescent
  | 'midnight_phantom'
  | 'midnight_abyssal'
  | 'midnight_jelly';

interface FishEntity {
  id: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  vx: number;
  vy: number;
  angle: number;
  speed: number;
  baseSpeed: number;
  size: number;
  species: FishSpecies;
  tailPhase: number;
  pulsePhase: number;
  spineHistory: { x: number; y: number }[];
  targetTimer: number;
}

interface RiverbedItem {
  x: number; // 0..1 normalized
  y: number; // 0..1 normalized
  rx: number; // radius x
  ry: number; // radius y
  angle: number;
  category: 'rock' | 'seaglass' | 'crystal' | 'shell' | 'leaf' | 'anemone';
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  detailType?: string;
  speckles?: { ox: number; oy: number; r: number; color: string }[];
  glow?: boolean;
}

interface BiomeConfig {
  id: BiomeType;
  name: string;
  waterDeepBg: string;
  waterSurfaceColor: string;
  waterFogAlpha: number;
  causticColor: string;
  description: string;
  species: FishSpecies[];
}

const BIOMES: Record<BiomeType, BiomeConfig> = {
  koi_pond: {
    id: 'koi_pond',
    name: 'Zen Koi Pond',
    waterDeepBg: '#02090e',
    waterSurfaceColor: 'rgba(3, 12, 18, 0.94)',
    waterFogAlpha: 0.94,
    causticColor: 'rgba(110, 200, 180, 0.22)',
    description: 'Japanese river slate, mossy jade pebbles, maple leaves, and slow graceful Japanese koi.',
    species: ['koi_kohaku', 'koi_sanke', 'koi_ogon', 'koi_tancho'],
  },
  ocean_tidepool: {
    id: 'ocean_tidepool',
    name: 'Crystal Tide Pool',
    waterDeepBg: '#010d16',
    waterSurfaceColor: 'rgba(2, 18, 30, 0.93)',
    waterFogAlpha: 0.93,
    causticColor: 'rgba(70, 220, 240, 0.28)',
    description: 'Frosted sea glass, coral limestone, spiral shells, blue tangs, and vibrant reef life.',
    species: ['reef_bluetang', 'reef_clownfish', 'reef_butterfly', 'reef_damselfish'],
  },
  midnight_lake: {
    id: 'midnight_lake',
    name: 'Midnight Bioluminescent',
    waterDeepBg: '#000308',
    waterSurfaceColor: 'rgba(1, 4, 12, 0.97)',
    waterFogAlpha: 0.97,
    causticColor: 'rgba(80, 160, 255, 0.25)',
    description: 'Black obsidian sand, glowing crystals, ethereal phantom koi, and bioluminescent jellyfish.',
    species: ['midnight_phantom', 'midnight_abyssal', 'midnight_jelly'],
  },
};

interface Ripple {
  x: number;
  y: number;
  r: number;
  maxR: number;
  alpha: number;
  color: string;
}

export const Option3_ClearDepthsView: React.FC<Option3Props> = ({
  className = '',
  onInteraction,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const underwaterCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const clarityCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [biome, setBiome] = useState<BiomeType>('koi_pond');
  const [brushSize, setBrushSize] = useState<number>(85); // brush radius in px
  const [revealSpeed, setRevealSpeed] = useState<RevealSpeed>('medium'); // 3s, 5s, 8s to opacity
  const [darkExtraDuration, setDarkExtraDuration] = useState<number>(10); // +10s to complete dark
  const [fishCount] = useState<number>(6);
  const [liveVeilStage, setLiveVeilStage] = useState<{
    stage: 'cleared' | 'veiling_opacity' | 'veiling_dark' | 'deep_dark';
    text: string;
    progress: number;
  }>({
    stage: 'veiling_opacity',
    text: 'Veiling to Opacity (5s)',
    progress: 0,
  });

  // Entities & Animation State Refs
  const riverbedItemsRef = useRef<RiverbedItem[]>([]);
  const fishRef = useRef<FishEntity[]>([]);
  const ripplesRef = useRef<Ripple[]>([]);
  const activePointers = useRef<Map<number, { x: number; y: number; px: number; py: number; down: boolean; distAccum: number }>>(new Map());
  const animFrameId = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());
  const clarityClearRef = useRef<(() => void) | null>(null);
  const dropPebbleActionRef = useRef<((x?: number, y?: number) => void) | null>(null);

  // Two-Stage Veiling Timers and Factors
  const idleTimeRef = useRef<number>(0);
  const darkVeilFactorRef = useRef<number>(0);
  const lastStageUpdateRef = useRef<number>(0);

  // Initialize Bed Elements (Riverbed, Tide Pool, or Midnight Abyss)
  const initRiverbed = useCallback((b: BiomeType, width: number, height: number) => {
    const items: RiverbedItem[] = [];
    const count = Math.floor((width * height) / 5200);

    for (let i = 0; i < count; i++) {
      const x = Math.random();
      const y = Math.random();
      const angle = Math.random() * Math.PI;

      if (b === 'koi_pond') {
        // Japanese Koi Pond: River slate, mossy jade, amber pebbles, maple leaves
        const roll = Math.random();
        if (roll < 0.35) {
          // River slate (smooth dark charcoal/slate)
          const rx = 16 + Math.random() * 32;
          const ry = rx * (0.65 + Math.random() * 0.35);
          items.push({
            x, y, rx, ry, angle,
            category: 'rock',
            primaryColor: '#2b3338',
            secondaryColor: '#455057',
            accentColor: '#141a1e',
            detailType: 'slate',
          });
        } else if (roll < 0.65) {
          // Mossy river jade pebble
          const rx = 14 + Math.random() * 26;
          const ry = rx * (0.7 + Math.random() * 0.3);
          items.push({
            x, y, rx, ry, angle,
            category: 'rock',
            primaryColor: '#243d34',
            secondaryColor: '#3c6355',
            accentColor: '#0f1f19',
            detailType: 'moss',
          });
        } else if (roll < 0.88) {
          // Sandstone/amber pebble with quartz speckles
          const rx = 10 + Math.random() * 22;
          const ry = rx * (0.6 + Math.random() * 0.4);
          const speckles = [];
          for (let s = 0; s < 4; s++) {
            speckles.push({
              ox: (Math.random() - 0.5) * rx * 1.2,
              oy: (Math.random() - 0.5) * ry * 1.2,
              r: 1 + Math.random() * 2,
              color: Math.random() > 0.5 ? 'rgba(255,230,170,0.5)' : 'rgba(30,20,10,0.4)',
            });
          }
          items.push({
            x, y, rx, ry, angle,
            category: 'rock',
            primaryColor: '#6e5a44',
            secondaryColor: '#967d60',
            accentColor: '#33271b',
            detailType: 'amber',
            speckles,
          });
        } else {
          // Fallen Momiji Japanese red/amber leaf resting on riverbed
          const rx = 14 + Math.random() * 12;
          const ry = rx * 0.8;
          items.push({
            x, y, rx, ry, angle,
            category: 'leaf',
            primaryColor: roll > 0.94 ? '#c0392b' : '#d35400',
            secondaryColor: '#e67e22',
            accentColor: '#7b241c',
          });
        }
      } else if (b === 'ocean_tidepool') {
        // Crystal Tide Pool: Frosted sea glass, porous reef limestone, spiral shells
        const roll = Math.random();
        if (roll < 0.40) {
          // Frosted Sea Glass (Turquoise, Aqua, Cobalt, Seafoam)
          const glassColors = [
            { base: '#1e757c', light: '#45b8c4', shadow: '#0c383c' },
            { base: '#1d5e82', light: '#3a97c9', shadow: '#0b2b3d' },
            { base: '#2b8a6e', light: '#50c7a2', shadow: '#103d30' },
          ];
          const gc = glassColors[Math.floor(Math.random() * glassColors.length)];
          const rx = 14 + Math.random() * 28;
          const ry = rx * (0.6 + Math.random() * 0.35);
          items.push({
            x, y, rx, ry, angle,
            category: 'seaglass',
            primaryColor: gc.base,
            secondaryColor: gc.light,
            accentColor: gc.shadow,
          });
        } else if (roll < 0.70) {
          // Porous Coral Rock / Limestone
          const rx = 18 + Math.random() * 32;
          const ry = rx * (0.7 + Math.random() * 0.3);
          const speckles = [];
          for (let s = 0; s < 7; s++) {
            speckles.push({
              ox: (Math.random() - 0.5) * rx * 1.3,
              oy: (Math.random() - 0.5) * ry * 1.3,
              r: 1.5 + Math.random() * 2.5,
              color: 'rgba(20, 15, 10, 0.45)',
            });
          }
          items.push({
            x, y, rx, ry, angle,
            category: 'rock',
            primaryColor: '#7a6a5d',
            secondaryColor: '#a18e7f',
            accentColor: '#3d342c',
            detailType: 'limestone',
            speckles,
          });
        } else if (roll < 0.90) {
          // Spiral & Fan Seashells
          const rx = 12 + Math.random() * 18;
          const ry = rx * (0.65 + Math.random() * 0.25);
          items.push({
            x, y, rx, ry, angle,
            category: 'shell',
            primaryColor: '#d6c4b2',
            secondaryColor: '#faf0e6',
            accentColor: '#6e5b4b',
          });
        } else {
          // Swaying sea anemone / coral polyp cluster
          const rx = 16 + Math.random() * 14;
          const ry = rx;
          items.push({
            x, y, rx, ry, angle,
            category: 'anemone',
            primaryColor: '#c03975',
            secondaryColor: '#e06aa2',
            accentColor: '#5c1233',
          });
        }
      } else {
        // Midnight Bioluminescent: Volcanic black obsidian, glowing geode crystals, bio-lichen
        const roll = Math.random();
        if (roll < 0.45) {
          // Dark Volcanic Obsidian Stone
          const rx = 16 + Math.random() * 34;
          const ry = rx * (0.6 + Math.random() * 0.4);
          items.push({
            x, y, rx, ry, angle,
            category: 'rock',
            primaryColor: '#0a1017',
            secondaryColor: '#172330',
            accentColor: '#030508',
            detailType: 'obsidian',
          });
        } else if (roll < 0.85) {
          // Luminous Glowing Geode Crystal (Electric Cyan, Violet, Emerald)
          const crystalColors = [
            { base: '#008b8b', light: '#00ffff', shadow: '#003333' },
            { base: '#5c2d91', light: '#b366ff', shadow: '#220b38' },
            { base: '#007a5e', light: '#33ffb5', shadow: '#00291f' },
          ];
          const cc = crystalColors[Math.floor(Math.random() * crystalColors.length)];
          const rx = 12 + Math.random() * 24;
          const ry = rx * (0.55 + Math.random() * 0.35);
          items.push({
            x, y, rx, ry, angle,
            category: 'crystal',
            primaryColor: cc.base,
            secondaryColor: cc.light,
            accentColor: cc.shadow,
            glow: true,
          });
        } else {
          // Bio-lichen cluster on dark rock
          const rx = 15 + Math.random() * 22;
          const ry = rx * 0.75;
          items.push({
            x, y, rx, ry, angle,
            category: 'rock',
            primaryColor: '#0b1622',
            secondaryColor: '#1b404d',
            accentColor: '#04070a',
            detailType: 'biomoss',
            glow: true,
          });
        }
      }
    }

    items.sort((a, b) => a.y - b.y);
    riverbedItemsRef.current = items;
  }, []);

  // Initialize Fish Entities with slower, meditative pacing
  const initFish = useCallback((b: BiomeType, count: number, width: number, height: number) => {
    const biomeConfig = BIOMES[b];
    const fishList: FishEntity[] = [];

    for (let i = 0; i < count; i++) {
      const species = biomeConfig.species[i % biomeConfig.species.length];
      const x = Math.random() * width;
      const y = Math.random() * height;
      const angle = Math.random() * Math.PI * 2;
      const size = 38 + Math.random() * 26;

      const spineHistory: { x: number; y: number }[] = [];
      for (let s = 0; s < 14; s++) {
        spineHistory.push({ x: x - Math.cos(angle) * s * 3.5, y: y - Math.sin(angle) * s * 3.5 });
      }

      // Meditative, slow, tranquil swimming speed
      const baseSpeed = 0.32 + Math.random() * 0.24;

      fishList.push({
        id: i,
        x,
        y,
        targetX: 60 + Math.random() * (width - 120),
        targetY: 60 + Math.random() * (height - 120),
        vx: Math.cos(angle) * baseSpeed,
        vy: Math.sin(angle) * baseSpeed,
        angle,
        speed: baseSpeed,
        baseSpeed,
        size,
        species,
        tailPhase: Math.random() * Math.PI * 2,
        pulsePhase: Math.random() * Math.PI * 2,
        spineHistory,
        targetTimer: 10 + Math.random() * 15,
      });
    }

    fishRef.current = fishList;
  }, []);

  // Canvas Setup & Simulation Render Loop
  useEffect(() => {
    const container = containerRef.current;
    const underwaterCanvas = underwaterCanvasRef.current;
    const clarityCanvas = clarityCanvasRef.current;
    const displayCanvas = displayCanvasRef.current;
    if (!container || !underwaterCanvas || !clarityCanvas || !displayCanvas) return;

    const uCtx = underwaterCanvas.getContext('2d');
    const cCtx = clarityCanvas.getContext('2d');
    const dCtx = displayCanvas.getContext('2d');
    if (!uCtx || !cCtx || !dCtx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;

      [underwaterCanvas, clarityCanvas, displayCanvas].forEach((cvs) => {
        cvs.width = w * dpr;
        cvs.height = h * dpr;
        cvs.style.width = `${w}px`;
        cvs.style.height = `${h}px`;
      });

      cCtx.clearRect(0, 0, w * dpr, h * dpr);
      initRiverbed(biome, w, h);
      initFish(biome, fishCount, w, h);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    clarityClearRef.current = () => {
      cCtx.clearRect(0, 0, clarityCanvas.width, clarityCanvas.height);
    };

    // Slow, single tranquil ripple creator
    dropPebbleActionRef.current = (px?: number, py?: number) => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      const x = px !== undefined ? px : (0.3 + Math.random() * 0.4) * w;
      const y = py !== undefined ? py : (0.3 + Math.random() * 0.4) * h;

      // Spawn 1 calm, gentle, slow expanding ripple
      ripplesRef.current.push({
        x: x * dpr,
        y: y * dpr,
        r: 6 * dpr,
        maxR: 150 * dpr,
        alpha: 0.75,
        color: biome === 'midnight_lake' ? 'rgba(100, 240, 255, 0.8)' : biome === 'ocean_tidepool' ? 'rgba(140, 240, 255, 0.75)' : 'rgba(210, 245, 255, 0.7)',
      });

      // Soft circular reveal on clarity canvas
      cCtx.save();
      const grad = cCtx.createRadialGradient(x * dpr, y * dpr, 0, x * dpr, y * dpr, 130 * dpr);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
      grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.45)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      cCtx.fillStyle = grad;
      cCtx.beginPath();
      cCtx.arc(x * dpr, y * dpr, 130 * dpr, 0, Math.PI * 2);
      cCtx.fill();
      cCtx.restore();

      // Fish gently notice the disturbance and slowly glide toward it
      fishRef.current.forEach((fish) => {
        const dx = x - fish.x;
        const dy = y - fish.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 320) {
          fish.targetX = x + (Math.random() - 0.5) * 60;
          fish.targetY = y + (Math.random() - 0.5) * 60;
          fish.speed = fish.baseSpeed * 1.35; // modest gentle acceleration
          fish.targetTimer = 12;
        }
      });
    };

    let time = 0;
    const render = (now: number) => {
      const dt = Math.min((now - lastTimeRef.current) * 0.001, 0.033);
      lastTimeRef.current = now;
      time += dt;

      const w = container.clientWidth;
      const h = container.clientHeight;
      const dw = w * dpr;
      const dh = h * dpr;

      if (dw === 0 || dh === 0) {
        animFrameId.current = requestAnimationFrame(render);
        return;
      }

      const biomeConfig = BIOMES[biome];

      // ======================================================================
      // 1. Process Touch & Drag (Gentle, Progressive Reveal & Throttled Ripples)
      // ======================================================================
      activePointers.current.forEach((ptr) => {
        if (ptr.down) {
          const cx = ptr.x * dpr;
          const cy = ptr.y * dpr;
          const px = ptr.px * dpr;
          const py = ptr.py * dpr;
          const r = brushSize * dpr;

          // Progressive Soft Gaussian Brush with full 100% core clarity
          cCtx.save();
          const grad = cCtx.createRadialGradient(cx, cy, 0, cx, cy, r);
          grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
          grad.addColorStop(0.40, 'rgba(255, 255, 255, 0.85)');
          grad.addColorStop(0.75, 'rgba(255, 255, 255, 0.40)');
          grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

          cCtx.fillStyle = grad;
          cCtx.beginPath();
          cCtx.arc(cx, cy, r, 0, Math.PI * 2);
          cCtx.fill();

          const strokeDist = Math.hypot(cx - px, cy - py);
          if (strokeDist > 1) {
            cCtx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
            cCtx.lineWidth = r * 1.2;
            cCtx.lineCap = 'round';
            cCtx.beginPath();
            cCtx.moveTo(px, py);
            cCtx.lineTo(cx, cy);
            cCtx.stroke();
          }
          cCtx.restore();

          // Throttled Ripple Spawning (Less quantity, calm cadence)
          ptr.distAccum += strokeDist;
          if (ptr.distAccum > 140 * dpr) {
            ptr.distAccum = 0;
            // Spawn only 1 subtle slow ripple along the finger path
            ripplesRef.current.push({
              x: cx,
              y: cy,
              r: 8 * dpr,
              maxR: r * 1.15,
              alpha: 0.42,
              color: biome === 'midnight_lake' ? 'rgba(100, 240, 255, 0.65)' : 'rgba(210, 245, 255, 0.55)',
            });
          }

          // Throttled curiosity from nearby fish
          fishRef.current.forEach((fish) => {
            const fdx = ptr.x - fish.x;
            const fdy = ptr.y - fish.y;
            const fDist = Math.hypot(fdx, fdy);
            if (fDist < 200 && Math.random() < 0.015) {
              fish.targetX = ptr.x + (Math.random() - 0.5) * 80;
              fish.targetY = ptr.y + (Math.random() - 0.5) * 80;
            }
          });

          ptr.px = ptr.x;
          ptr.py = ptr.y;
        }
      });

      // ======================================================================
      // 2. Two-Stage Re-veiling / Water Settling Decay
      // ======================================================================
      // Stage 1: Cleared window decays back to murky surface opacity over 3s / 5s / 8s
      // Stage 2: Over additional time (+10s), veils completely to deep dark stillness
      const isTouching = activePointers.current.size > 0;

      if (isTouching) {
        idleTimeRef.current = 0;
        // Rapidly peel away dark veil on touch
        darkVeilFactorRef.current = Math.max(0, darkVeilFactorRef.current - dt * 6.0);
      } else {
        idleTimeRef.current += dt;
      }

      const stage1Duration = revealSpeed === 'slow' ? 8.0 : revealSpeed === 'medium' ? 5.0 : 3.0;
      const stage2Duration = darkExtraDuration; // +10s extra by default

      // Stage 1 exponential decay on clarity mask (returns to murky surface opacity)
      const fadeAlpha = 1.0 - Math.pow(0.001, Math.min(dt, 0.05) / stage1Duration);
      cCtx.save();
      cCtx.globalCompositeOperation = 'destination-out';
      cCtx.fillStyle = `rgba(0, 0, 0, ${fadeAlpha})`;
      cCtx.fillRect(0, 0, dw, dh);
      cCtx.restore();

      // Stage 2 progressive dark veil calculation (after stage 1 completes)
      if (stage2Duration > 0 && idleTimeRef.current >= stage1Duration) {
        const p = Math.min(1.0, (idleTimeRef.current - stage1Duration) / stage2Duration);
        const easedP = p * p * (3 - 2 * p); // smoothstep curve
        darkVeilFactorRef.current = Math.min(
          1.0,
          darkVeilFactorRef.current + (easedP - darkVeilFactorRef.current) * Math.min(dt * 3.5, 1.0)
        );
      } else if (idleTimeRef.current < stage1Duration && !isTouching) {
        darkVeilFactorRef.current = Math.max(0, darkVeilFactorRef.current - dt * 3.0);
      }

      // Update live status throttled for UI feedback
      if (now - lastStageUpdateRef.current > 100) {
        lastStageUpdateRef.current = now;
        if (isTouching) {
          setLiveVeilStage({
            stage: 'cleared',
            text: 'Water Window Cleared (Viewing Depths)',
            progress: 1.0,
          });
        } else if (idleTimeRef.current < stage1Duration) {
          const rem = Math.max(0, stage1Duration - idleTimeRef.current);
          const prog = 1.0 - rem / stage1Duration;
          setLiveVeilStage({
            stage: 'veiling_opacity',
            text: `Stage 1: Veiling to Opacity (${rem.toFixed(1)}s / ${stage1Duration}s)`,
            progress: prog,
          });
        } else if (stage2Duration > 0 && idleTimeRef.current < stage1Duration + stage2Duration) {
          const rem = Math.max(0, stage1Duration + stage2Duration - idleTimeRef.current);
          const prog = (idleTimeRef.current - stage1Duration) / stage2Duration;
          setLiveVeilStage({
            stage: 'veiling_dark',
            text: `Stage 2: Veiling to Deep Dark (+${rem.toFixed(1)}s / +${stage2Duration}s)`,
            progress: prog,
          });
        } else if (stage2Duration > 0) {
          setLiveVeilStage({
            stage: 'deep_dark',
            text: 'Deep Dark Stillness (Touch anywhere to reveal)',
            progress: 1.0,
          });
        } else {
          setLiveVeilStage({
            stage: 'veiling_opacity',
            text: 'Surface Veil Settled',
            progress: 1.0,
          });
        }
      }

      // ======================================================================
      // 3. Render Underwater Depth Canvas (Distinctive Riverbed & Fish)
      // ======================================================================
      uCtx.save();
      uCtx.clearRect(0, 0, dw, dh);

      // Deep Waterbed Foundation Gradient
      const bgGrad = uCtx.createLinearGradient(0, 0, 0, dh);
      bgGrad.addColorStop(0, biomeConfig.waterDeepBg);
      bgGrad.addColorStop(1, '#000000');
      uCtx.fillStyle = bgGrad;
      uCtx.fillRect(0, 0, dw, dh);

      // A. Render Riverbed / Tide Pool / Midnight Items
      riverbedItemsRef.current.forEach((item) => {
        const px = item.x * dw;
        const py = item.y * dh;
        const rx = item.rx * dpr;
        const ry = item.ry * dpr;

        uCtx.save();
        uCtx.translate(px, py);
        uCtx.rotate(item.angle);

        // Ambient shadow beneath item
        uCtx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        uCtx.beginPath();
        uCtx.ellipse(3 * dpr, 4 * dpr, rx * 1.05, ry * 1.05, 0, 0, Math.PI * 2);
        uCtx.fill();

        if (item.category === 'leaf') {
          // Japanese Momiji Maple Leaf
          uCtx.fillStyle = item.primaryColor;
          uCtx.beginPath();
          uCtx.moveTo(0, -ry * 1.2);
          uCtx.lineTo(rx * 0.4, -ry * 0.4);
          uCtx.lineTo(rx * 1.1, -ry * 0.5);
          uCtx.lineTo(rx * 0.5, 0);
          uCtx.lineTo(rx * 0.9, ry * 0.7);
          uCtx.lineTo(0, ry * 0.3);
          uCtx.lineTo(-rx * 0.9, ry * 0.7);
          uCtx.lineTo(-rx * 0.5, 0);
          uCtx.lineTo(-rx * 1.1, -ry * 0.5);
          uCtx.lineTo(-rx * 0.4, -ry * 0.4);
          uCtx.closePath();
          uCtx.fill();

          // Leaf stem & veins
          uCtx.strokeStyle = item.accentColor;
          uCtx.lineWidth = 1.2 * dpr;
          uCtx.beginPath();
          uCtx.moveTo(0, -ry * 1.1);
          uCtx.lineTo(0, ry * 0.9);
          uCtx.stroke();
        } else if (item.category === 'seaglass') {
          // Frosted Sea Glass (Luminous translucent body + soft refractive edge)
          const glassGrad = uCtx.createRadialGradient(-rx * 0.3, -ry * 0.3, rx * 0.1, 0, 0, rx);
          glassGrad.addColorStop(0, item.secondaryColor);
          glassGrad.addColorStop(0.7, item.primaryColor);
          glassGrad.addColorStop(1, item.accentColor);

          uCtx.fillStyle = glassGrad;
          uCtx.beginPath();
          uCtx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
          uCtx.fill();

          // Frosted glass curved highlight
          uCtx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
          uCtx.lineWidth = 1.5 * dpr;
          uCtx.beginPath();
          uCtx.ellipse(-rx * 0.15, -ry * 0.15, rx * 0.65, ry * 0.5, 0, Math.PI * 0.8, Math.PI * 1.9);
          uCtx.stroke();
        } else if (item.category === 'crystal') {
          // Midnight Bioluminescent Geode Crystal
          const pulse = (Math.sin(time * 1.5 + item.x * 10) * 0.5 + 0.5) * 0.3;
          
          // Outer Glow
          const glowGrad = uCtx.createRadialGradient(0, 0, rx * 0.2, 0, 0, rx * 2.2);
          glowGrad.addColorStop(0, item.secondaryColor);
          glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
          uCtx.fillStyle = glowGrad;
          uCtx.beginPath();
          uCtx.arc(0, 0, rx * 2.2, 0, Math.PI * 2);
          uCtx.fill();

          // Faceted crystal polygon
          uCtx.fillStyle = item.primaryColor;
          uCtx.beginPath();
          uCtx.moveTo(0, -ry * 1.1);
          uCtx.lineTo(rx * 0.85, -ry * 0.3);
          uCtx.lineTo(rx * 0.65, ry * 0.85);
          uCtx.lineTo(-rx * 0.65, ry * 0.85);
          uCtx.lineTo(-rx * 0.85, -ry * 0.3);
          uCtx.closePath();
          uCtx.fill();

          // Glowing central facet
          uCtx.strokeStyle = item.secondaryColor;
          uCtx.lineWidth = (1.5 + pulse * 2) * dpr;
          uCtx.stroke();
        } else if (item.category === 'shell') {
          // Spiral / Fan Seashell
          uCtx.fillStyle = item.primaryColor;
          uCtx.beginPath();
          uCtx.arc(0, 0, rx, Math.PI * 0.1, Math.PI * 0.9);
          uCtx.quadraticCurveTo(0, ry * 1.3, -rx * 0.9, 0);
          uCtx.fill();

          // Shell ridges
          uCtx.strokeStyle = item.accentColor;
          uCtx.lineWidth = 1.1 * dpr;
          for (let r = 1; r <= 4; r++) {
            uCtx.beginPath();
            uCtx.arc(0, 0, rx * (r / 4), Math.PI * 0.2, Math.PI * 0.8);
            uCtx.stroke();
          }
        } else if (item.category === 'anemone') {
          // Swaying Sea Anemone tentacles
          uCtx.fillStyle = item.accentColor;
          uCtx.beginPath();
          uCtx.ellipse(0, 0, rx * 0.5, ry * 0.5, 0, 0, Math.PI * 2);
          uCtx.fill();

          const tentacleCount = 8;
          for (let t = 0; t < tentacleCount; t++) {
            const tAngle = (t / tentacleCount) * Math.PI * 2;
            const sway = Math.sin(time * 2 + t) * rx * 0.3;
            uCtx.strokeStyle = item.secondaryColor;
            uCtx.lineWidth = 2 * dpr;
            uCtx.lineCap = 'round';
            uCtx.beginPath();
            uCtx.moveTo(Math.cos(tAngle) * rx * 0.3, Math.sin(tAngle) * ry * 0.3);
            uCtx.quadraticCurveTo(
              Math.cos(tAngle) * rx * 0.8 + sway,
              Math.sin(tAngle) * ry * 0.8,
              Math.cos(tAngle) * rx * 1.2 + sway,
              Math.sin(tAngle) * ry * 1.2
            );
            uCtx.stroke();
          }
        } else {
          // Standard Smooth / Speckled / Mossy Stone
          const stoneGrad = uCtx.createRadialGradient(-rx * 0.3, -ry * 0.35, rx * 0.1, 0, 0, rx);
          stoneGrad.addColorStop(0, item.secondaryColor);
          stoneGrad.addColorStop(0.65, item.primaryColor);
          stoneGrad.addColorStop(1, item.accentColor);

          uCtx.fillStyle = stoneGrad;
          uCtx.beginPath();
          uCtx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
          uCtx.fill();

          // Speckles
          if (item.speckles && item.speckles.length > 0) {
            item.speckles.forEach((sp) => {
              uCtx.fillStyle = sp.color;
              uCtx.beginPath();
              uCtx.arc(sp.ox * dpr, sp.oy * dpr, sp.r * dpr, 0, Math.PI * 2);
              uCtx.fill();
            });
          }

          // Moss patch
          if (item.detailType === 'moss') {
            uCtx.fillStyle = 'rgba(35, 125, 75, 0.45)';
            uCtx.beginPath();
            uCtx.ellipse(rx * 0.25, ry * 0.2, rx * 0.55, ry * 0.45, 0, 0, Math.PI * 2);
            uCtx.fill();
          } else if (item.detailType === 'biomoss') {
            const glow = (Math.sin(time * 1.8 + item.x * 8) * 0.5 + 0.5) * 0.35;
            uCtx.fillStyle = `rgba(0, 255, 180, ${0.25 + glow})`;
            uCtx.beginPath();
            uCtx.ellipse(rx * 0.2, ry * 0.15, rx * 0.45, ry * 0.35, 0, 0, Math.PI * 2);
            uCtx.fill();
          }
        }

        uCtx.restore();
      });

      // B. Swaying Sea Grass / Bamboo Reeds
      const numGrass = 6;
      for (let g = 0; g < numGrass; g++) {
        const gx = (0.1 + g * 0.18) * dw;
        const gy = dh * 0.98;
        const gh = (130 + Math.sin(g * 3) * 35) * dpr;

        uCtx.save();
        uCtx.strokeStyle = biome === 'midnight_lake'
          ? 'rgba(0, 180, 160, 0.3)'
          : biome === 'ocean_tidepool'
          ? 'rgba(40, 150, 120, 0.38)'
          : 'rgba(50, 110, 70, 0.45)';
        uCtx.lineWidth = 3.5 * dpr;
        uCtx.lineCap = 'round';
        uCtx.beginPath();
        uCtx.moveTo(gx, gy);

        // Very slow, tranquil water sway
        const sway = Math.sin(time * 0.8 + g) * 22 * dpr;
        uCtx.quadraticCurveTo(gx + sway * 0.5, gy - gh * 0.5, gx + sway, gy - gh);
        uCtx.stroke();
        uCtx.restore();
      }

      // C. Update & Render Aquatic Life (Slow, Realistic, Highly Differentiated)
      fishRef.current.forEach((fish) => {
        // Tranquil Wandering AI
        fish.targetTimer -= dt;
        const distToTarget = Math.hypot(fish.targetX - fish.x, fish.targetY - fish.y);
        if (distToTarget < 40 || fish.targetTimer <= 0) {
          fish.targetX = 60 + Math.random() * (w - 120);
          fish.targetY = 60 + Math.random() * (h - 120);
          fish.targetTimer = 12 + Math.random() * 15;
          fish.speed = fish.baseSpeed;
        }

        // Slow, graceful steering with minimal angular snap
        const desiredAngle = Math.atan2(fish.targetY - fish.y, fish.targetX - fish.x);
        let angleDiff = desiredAngle - fish.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        fish.angle += angleDiff * 0.018; // smooth, gentle turn
        fish.vx = Math.cos(fish.angle) * fish.speed;
        fish.vy = Math.sin(fish.angle) * fish.speed;

        fish.x += fish.vx;
        fish.y += fish.vy;
        fish.tailPhase += fish.speed * 0.07; // relaxed fin flapping
        fish.pulsePhase += dt * 1.5;

        // Wrap boundaries gently
        if (fish.x < -80) fish.x = w + 80;
        if (fish.x > w + 80) fish.x = -80;
        if (fish.y < -80) fish.y = h + 80;
        if (fish.y > h + 80) fish.y = -80;

        // Spine IK calculation
        const headX = fish.x * dpr;
        const headY = fish.y * dpr;
        const spine = fish.spineHistory;
        spine[0] = { x: headX, y: headY };

        const segmentLength = (fish.size * 0.12) * dpr;
        for (let s = 1; s < spine.length; s++) {
          const prev = spine[s - 1];
          const curr = spine[s];
          const sAngle = Math.atan2(curr.y - prev.y, curr.x - prev.x);
          const wiggle = Math.sin(fish.tailPhase - s * 0.45) * (s * 0.75 * dpr);
          curr.x = prev.x + Math.cos(sAngle) * segmentLength + Math.sin(sAngle) * wiggle * 0.12;
          curr.y = prev.y + Math.sin(sAngle) * segmentLength - Math.cos(sAngle) * wiggle * 0.12;
        }

        const fSize = fish.size * dpr;

        // Shadow on bed
        uCtx.save();
        uCtx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        uCtx.beginPath();
        uCtx.ellipse(headX + 10 * dpr, headY + 14 * dpr, fSize * 0.48, fSize * 0.22, fish.angle, 0, Math.PI * 2);
        uCtx.fill();
        uCtx.restore();

        // Specific Fish Species Rendering
        uCtx.save();
        uCtx.translate(headX, headY);
        uCtx.rotate(fish.angle);

        const finWiggle = Math.sin(fish.tailPhase) * 0.25;

        if (fish.species === 'koi_kohaku' || fish.species === 'koi_sanke' || fish.species === 'koi_ogon' || fish.species === 'koi_tancho') {
          // ------------------------------------------------------------------
          // JAPANESE KOI (Realistic elongated torso, barbels, fins, patterns)
          // ------------------------------------------------------------------
          // Whiskers (Barbels) on snout
          uCtx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
          uCtx.lineWidth = 1.2 * dpr;
          uCtx.beginPath();
          uCtx.moveTo(fSize * 0.45, -fSize * 0.08);
          uCtx.quadraticCurveTo(fSize * 0.65, -fSize * 0.18, fSize * 0.55, -fSize * 0.25);
          uCtx.moveTo(fSize * 0.45, fSize * 0.08);
          uCtx.quadraticCurveTo(fSize * 0.65, fSize * 0.18, fSize * 0.55, fSize * 0.25);
          uCtx.stroke();

          // Pectoral Fins (Flared, translucent with delicate fin rays)
          uCtx.fillStyle = fish.species === 'koi_ogon' ? 'rgba(255, 215, 0, 0.7)' : 'rgba(255, 255, 255, 0.75)';
          [-1, 1].forEach((dir) => {
            uCtx.save();
            uCtx.translate(-fSize * 0.1, dir * fSize * 0.22);
            uCtx.rotate(dir * (0.6 - finWiggle));
            uCtx.beginPath();
            uCtx.ellipse(0, 0, fSize * 0.42, fSize * 0.16, 0, 0, Math.PI * 2);
            uCtx.fill();
            uCtx.restore();
          });

          // Base Koi Body Gradient
          const bodyGrad = uCtx.createLinearGradient(-fSize * 0.8, 0, fSize * 0.5, 0);
          if (fish.species === 'koi_ogon') {
            bodyGrad.addColorStop(0, '#cda828');
            bodyGrad.addColorStop(0.5, '#ffd700');
            bodyGrad.addColorStop(1, '#fff3b0');
          } else {
            bodyGrad.addColorStop(0, '#e8e8e8');
            bodyGrad.addColorStop(0.5, '#fcfcfc');
            bodyGrad.addColorStop(1, '#ffffff');
          }

          uCtx.fillStyle = bodyGrad;
          uCtx.beginPath();
          uCtx.ellipse(0, 0, fSize * 0.52, fSize * 0.21, 0, 0, Math.PI * 2);
          uCtx.fill();

          // Distinctive Koi Markings
          if (fish.species === 'koi_kohaku') {
            // Vermilion / Crimson Red Hi Patches
            uCtx.fillStyle = '#d32f2f';
            uCtx.beginPath();
            uCtx.ellipse(fSize * 0.15, -fSize * 0.02, fSize * 0.22, fSize * 0.12, 0.2, 0, Math.PI * 2);
            uCtx.fill();
            uCtx.beginPath();
            uCtx.ellipse(-fSize * 0.22, fSize * 0.03, fSize * 0.25, fSize * 0.14, -0.3, 0, Math.PI * 2);
            uCtx.fill();
          } else if (fish.species === 'koi_sanke') {
            // Kohaku Red + Sumi Deep Black Ink Blotches
            uCtx.fillStyle = '#e64a19';
            uCtx.beginPath();
            uCtx.ellipse(fSize * 0.18, 0, fSize * 0.2, fSize * 0.12, 0, 0, Math.PI * 2);
            uCtx.fill();
            uCtx.beginPath();
            uCtx.ellipse(-fSize * 0.25, -fSize * 0.04, fSize * 0.22, fSize * 0.12, 0.3, 0, Math.PI * 2);
            uCtx.fill();

            // Sumi Black spots
            uCtx.fillStyle = '#1a1a1a';
            uCtx.beginPath();
            uCtx.ellipse(-fSize * 0.05, fSize * 0.08, fSize * 0.12, fSize * 0.07, -0.4, 0, Math.PI * 2);
            uCtx.fill();
            uCtx.beginPath();
            uCtx.ellipse(-fSize * 0.35, fSize * 0.05, fSize * 0.1, fSize * 0.06, 0.2, 0, Math.PI * 2);
            uCtx.fill();
          } else if (fish.species === 'koi_tancho') {
            // Pristine White with Solitary Round Crimson Crown on Head
            uCtx.fillStyle = '#c62828';
            uCtx.beginPath();
            uCtx.arc(fSize * 0.25, 0, fSize * 0.12, 0, Math.PI * 2);
            uCtx.fill();
          }

          // Tapering Tail & Broad Fan Tail Fin
          const tailWiggle = Math.sin(fish.tailPhase - 2.2) * fSize * 0.2;
          uCtx.fillStyle = bodyGrad;
          uCtx.beginPath();
          uCtx.moveTo(-fSize * 0.35, -fSize * 0.12);
          uCtx.quadraticCurveTo(-fSize * 0.7, 0, -fSize * 0.9, tailWiggle);
          uCtx.quadraticCurveTo(-fSize * 0.7, 0, -fSize * 0.35, fSize * 0.12);
          uCtx.closePath();
          uCtx.fill();

          // Tail fin fan
          uCtx.fillStyle = fish.species === 'koi_ogon' ? 'rgba(255, 220, 80, 0.7)' : 'rgba(255, 255, 255, 0.7)';
          uCtx.beginPath();
          uCtx.moveTo(-fSize * 0.9, tailWiggle);
          uCtx.lineTo(-fSize * 1.35, tailWiggle - fSize * 0.3);
          uCtx.quadraticCurveTo(-fSize * 1.15, tailWiggle, -fSize * 1.35, tailWiggle + fSize * 0.3);
          uCtx.closePath();
          uCtx.fill();
        } else if (fish.species === 'reef_bluetang') {
          // ------------------------------------------------------------------
          // BLUE TANG (Royal Blue Disc Body, Black Palette Swoosh, Yellow Tail)
          // ------------------------------------------------------------------
          // Deep Royal Blue Body
          const tangGrad = uCtx.createLinearGradient(-fSize * 0.5, 0, fSize * 0.4, 0);
          tangGrad.addColorStop(0, '#0d47a1');
          tangGrad.addColorStop(0.6, '#1976d2');
          tangGrad.addColorStop(1, '#2196f3');
          uCtx.fillStyle = tangGrad;
          uCtx.beginPath();
          uCtx.ellipse(0, 0, fSize * 0.45, fSize * 0.28, 0, 0, Math.PI * 2);
          uCtx.fill();

          // Black Palette Loop Pattern
          uCtx.fillStyle = '#111827';
          uCtx.beginPath();
          uCtx.ellipse(-fSize * 0.05, -fSize * 0.05, fSize * 0.3, fSize * 0.18, 0, 0, Math.PI * 2);
          uCtx.fill();
          // Inner blue hole
          uCtx.fillStyle = '#1976d2';
          uCtx.beginPath();
          uCtx.ellipse(-fSize * 0.05, -fSize * 0.05, fSize * 0.18, fSize * 0.09, 0, 0, Math.PI * 2);
          uCtx.fill();

          // Bright Canary Yellow Triangular Tail
          const tailWiggle = Math.sin(fish.tailPhase - 2.0) * fSize * 0.18;
          uCtx.fillStyle = '#ffd600';
          uCtx.beginPath();
          uCtx.moveTo(-fSize * 0.4, tailWiggle);
          uCtx.lineTo(-fSize * 0.85, tailWiggle - fSize * 0.25);
          uCtx.lineTo(-fSize * 0.75, tailWiggle);
          uCtx.lineTo(-fSize * 0.85, tailWiggle + fSize * 0.25);
          uCtx.closePath();
          uCtx.fill();
        } else if (fish.species === 'reef_clownfish') {
          // ------------------------------------------------------------------
          // CLOWNFISH (Vivid Orange with 3 Crisp White Vertical Bands)
          // ------------------------------------------------------------------
          uCtx.fillStyle = '#ff6d00';
          uCtx.beginPath();
          uCtx.ellipse(0, 0, fSize * 0.44, fSize * 0.24, 0, 0, Math.PI * 2);
          uCtx.fill();

          // 3 White Stripes edged with black
          [-0.2, 0.05, 0.3].forEach((pos) => {
            uCtx.strokeStyle = '#212121';
            uCtx.lineWidth = 1.8 * dpr;
            uCtx.fillStyle = '#ffffff';
            uCtx.beginPath();
            uCtx.ellipse(fSize * pos, 0, fSize * 0.06, fSize * 0.22, 0, 0, Math.PI * 2);
            uCtx.fill();
            uCtx.stroke();
          });

          // Round orange tail
          const tailWiggle = Math.sin(fish.tailPhase - 2.0) * fSize * 0.18;
          uCtx.fillStyle = '#ff6d00';
          uCtx.beginPath();
          uCtx.arc(-fSize * 0.55, tailWiggle, fSize * 0.2, -Math.PI * 0.6, Math.PI * 0.6);
          uCtx.fill();
        } else if (fish.species === 'reef_butterfly' || fish.species === 'reef_damselfish') {
          // ------------------------------------------------------------------
          // REEF BUTTERFLY / DAMSELFISH
          // ------------------------------------------------------------------
          const isButterfly = fish.species === 'reef_butterfly';
          const rGrad = uCtx.createLinearGradient(-fSize * 0.4, 0, fSize * 0.4, 0);
          if (isButterfly) {
            rGrad.addColorStop(0, '#fff9c4');
            rGrad.addColorStop(0.5, '#fff176');
            rGrad.addColorStop(1, '#ffd54f');
          } else {
            rGrad.addColorStop(0, '#00b0ff');
            rGrad.addColorStop(0.7, '#00e5ff');
            rGrad.addColorStop(1, '#b2ebf2');
          }
          uCtx.fillStyle = rGrad;
          uCtx.beginPath();
          uCtx.ellipse(0, 0, fSize * 0.42, fSize * 0.26, 0, 0, Math.PI * 2);
          uCtx.fill();

          if (isButterfly) {
            // Bold vertical eye stripe & trailing streamer
            uCtx.fillStyle = '#263238';
            uCtx.fillRect(fSize * 0.15, -fSize * 0.24, fSize * 0.08, fSize * 0.48);
          }
        } else if (fish.species === 'midnight_phantom') {
          // ------------------------------------------------------------------
          // PHANTOM GHOST KOI (Translucent Ethereal Cyan with Glowing Aura)
          // ------------------------------------------------------------------
          // Luminous aura
          const auraGrad = uCtx.createRadialGradient(0, 0, fSize * 0.2, 0, 0, fSize * 0.9);
          auraGrad.addColorStop(0, 'rgba(0, 255, 230, 0.45)');
          auraGrad.addColorStop(1, 'rgba(0, 255, 230, 0)');
          uCtx.fillStyle = auraGrad;
          uCtx.beginPath();
          uCtx.arc(0, 0, fSize * 0.9, 0, Math.PI * 2);
          uCtx.fill();

          // Translucent phantom body
          uCtx.fillStyle = 'rgba(220, 255, 255, 0.65)';
          uCtx.beginPath();
          uCtx.ellipse(0, 0, fSize * 0.5, fSize * 0.2, 0, 0, Math.PI * 2);
          uCtx.fill();

          // Glowing spine line
          uCtx.strokeStyle = 'rgba(0, 255, 230, 0.9)';
          uCtx.lineWidth = 2 * dpr;
          uCtx.beginPath();
          uCtx.moveTo(fSize * 0.35, 0);
          uCtx.lineTo(-fSize * 0.45, 0);
          uCtx.stroke();

          // Spectral trailing veil tail
          const tailWiggle = Math.sin(fish.tailPhase - 2.2) * fSize * 0.24;
          uCtx.fillStyle = 'rgba(0, 255, 230, 0.5)';
          uCtx.beginPath();
          uCtx.moveTo(-fSize * 0.4, 0);
          uCtx.quadraticCurveTo(-fSize * 0.9, tailWiggle - fSize * 0.3, -fSize * 1.4, tailWiggle);
          uCtx.quadraticCurveTo(-fSize * 0.9, tailWiggle + fSize * 0.3, -fSize * 0.4, 0);
          uCtx.fill();
        } else if (fish.species === 'midnight_abyssal') {
          // ------------------------------------------------------------------
          // ABYSSAL DRAGONFISH (Deep Obsidian with Glowing Neon Photophores)
          // ------------------------------------------------------------------
          uCtx.fillStyle = '#060b12';
          uCtx.beginPath();
          uCtx.ellipse(0, 0, fSize * 0.52, fSize * 0.18, 0, 0, Math.PI * 2);
          uCtx.fill();

          // Glowing photophore light dots along flank
          for (let dot = 0; dot < 6; dot++) {
            const dx = -fSize * 0.35 + dot * fSize * 0.12;
            uCtx.fillStyle = '#64ffda';
            uCtx.beginPath();
            uCtx.arc(dx, -fSize * 0.06, 1.8 * dpr, 0, Math.PI * 2);
            uCtx.fill();
          }

          // Glowing violet fin tips
          uCtx.strokeStyle = 'rgba(179, 102, 255, 0.8)';
          uCtx.lineWidth = 1.5 * dpr;
          uCtx.beginPath();
          uCtx.moveTo(-fSize * 0.1, -fSize * 0.18);
          uCtx.lineTo(-fSize * 0.3, -fSize * 0.4);
          uCtx.moveTo(-fSize * 0.1, fSize * 0.18);
          uCtx.lineTo(-fSize * 0.3, fSize * 0.4);
          uCtx.stroke();
        } else {
          // ------------------------------------------------------------------
          // CELESTIAL BIOLUMINESCENT JELLYFISH (Pulsing dome & glowing tentacles)
          // ------------------------------------------------------------------
          const pulse = Math.sin(fish.pulsePhase) * 0.15;
          const domeR = fSize * (0.35 + pulse);

          // Glowing bell dome
          const jellyGrad = uCtx.createRadialGradient(0, 0, domeR * 0.2, 0, 0, domeR);
          jellyGrad.addColorStop(0, 'rgba(100, 255, 230, 0.8)');
          jellyGrad.addColorStop(0.7, 'rgba(140, 80, 255, 0.5)');
          jellyGrad.addColorStop(1, 'rgba(140, 80, 255, 0)');
          uCtx.fillStyle = jellyGrad;
          uCtx.beginPath();
          uCtx.arc(0, 0, domeR, -Math.PI * 0.5, Math.PI * 0.5);
          uCtx.closePath();
          uCtx.fill();

          // Trailing glowing tentacles
          const tentCount = 5;
          for (let tn = 0; tn < tentCount; tn++) {
            const tx = -domeR * 0.6 + tn * (domeR * 0.3);
            const sway = Math.sin(time * 1.5 + tn) * fSize * 0.15;
            uCtx.strokeStyle = 'rgba(100, 255, 230, 0.6)';
            uCtx.lineWidth = 1.2 * dpr;
            uCtx.beginPath();
            uCtx.moveTo(0, tx);
            uCtx.quadraticCurveTo(-fSize * 0.5 + sway, tx * 0.7, -fSize * 1.1 + sway * 1.5, tx * 1.3);
            uCtx.stroke();
          }
        }

        uCtx.restore();
      });

      // D. Subtle Shimmering Light Caustics
      uCtx.save();
      uCtx.strokeStyle = biomeConfig.causticColor;
      uCtx.lineWidth = 1.5 * dpr;
      uCtx.globalCompositeOperation = 'screen';
      const causticGrid = 5;
      const cStepX = dw / causticGrid;
      const cStepY = dh / causticGrid;

      for (let cx = 0; cx < causticGrid; cx++) {
        for (let cy = 0; cy < causticGrid; cy++) {
          const x0 = cx * cStepX + Math.sin(time * 0.9 + cy * 0.8) * 18 * dpr;
          const y0 = cy * cStepY + Math.cos(time * 0.8 + cx * 0.7) * 18 * dpr;
          const x1 = (cx + 1) * cStepX + Math.sin(time * 0.85 + (cy + 1) * 0.8) * 18 * dpr;
          const y1 = (cy + 1) * cStepY + Math.cos(time * 0.95 + (cx + 1) * 0.7) * 18 * dpr;

          uCtx.beginPath();
          uCtx.arc((x0 + x1) * 0.5, (y0 + y1) * 0.5, (cStepX * 0.32), 0, Math.PI * 2);
          uCtx.stroke();
        }
      }
      uCtx.restore();

      uCtx.restore();

      // ======================================================================
      // 4. Composite Surface + Clarity Mask (Dark, Shrouded Veil + Crisp Reveal)
      // ======================================================================
      dCtx.save();
      dCtx.clearRect(0, 0, dw, dh);

      // 1. Draw High-Opacity Murky Dark Surface Water Layer
      dCtx.fillStyle = biomeConfig.waterSurfaceColor;
      dCtx.fillRect(0, 0, dw, dh);

      // Very subtle water surface shimmer lines
      dCtx.save();
      dCtx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      dCtx.lineWidth = 1.8 * dpr;
      for (let wave = 0; wave < 3; wave++) {
        const wy = (dh * 0.33 * wave) + Math.sin(time * 0.5 + wave) * 20 * dpr;
        dCtx.beginPath();
        dCtx.moveTo(0, wy);
        dCtx.bezierCurveTo(dw * 0.35, wy + 15 * dpr, dw * 0.65, wy - 15 * dpr, dw, wy);
        dCtx.stroke();
      }
      dCtx.restore();

      // 2. Cut Out Murky Fog with Clarity Mask (reveals underwater canvas)
      dCtx.globalCompositeOperation = 'destination-out';
      dCtx.drawImage(clarityCanvas, 0, 0);

      // 3. Render Crisp Underwater Depth Layer underneath
      dCtx.globalCompositeOperation = 'destination-over';
      dCtx.drawImage(underwaterCanvas, 0, 0);

      // 4. Render Surface Expanding Ripples (Slow, Minimal Quantity)
      dCtx.globalCompositeOperation = 'source-over';
      for (let rIdx = ripplesRef.current.length - 1; rIdx >= 0; rIdx--) {
        const rip = ripplesRef.current[rIdx];
        rip.r += 22 * dt * dpr; // Slower, gentle wave expansion
        rip.alpha -= 0.18 * dt; // Long, peaceful dissipation (~5.5s)

        if (rip.alpha <= 0 || rip.r >= rip.maxR) {
          ripplesRef.current.splice(rIdx, 1);
          continue;
        }

        dCtx.save();
        dCtx.strokeStyle = rip.color.replace(/[\d\.]+\)$/, `${rip.alpha * 0.8})`);
        dCtx.lineWidth = 2.2 * dpr;
        dCtx.beginPath();
        dCtx.arc(rip.x, rip.y, rip.r, 0, Math.PI * 2);
        dCtx.stroke();

        // Inner secondary harmonic wave
        if (rip.r > 24 * dpr) {
          dCtx.strokeStyle = rip.color.replace(/[\d\.]+\)$/, `${rip.alpha * 0.35})`);
          dCtx.lineWidth = 1.2 * dpr;
          dCtx.beginPath();
          dCtx.arc(rip.x, rip.y, rip.r * 0.65, 0, Math.PI * 2);
          dCtx.stroke();
        }
        dCtx.restore();
      }

      // 5. Stage 2: Deep Dark Veil Shroud (fades completely to dark over additional +10s)
      if (darkVeilFactorRef.current > 0.001) {
        dCtx.save();
        dCtx.fillStyle = `rgba(0, 2, 6, ${darkVeilFactorRef.current * 0.995})`;
        dCtx.fillRect(0, 0, dw, dh);
        // If actively touching or window clear, cut through dark veil
        if (isTouching) {
          dCtx.globalCompositeOperation = 'destination-out';
          dCtx.drawImage(clarityCanvas, 0, 0);
        }
        dCtx.restore();
      }

      // Meditative vignette border
      const vig = dCtx.createRadialGradient(dw * 0.5, dh * 0.5, Math.min(dw, dh) * 0.3, dw * 0.5, dh * 0.5, Math.max(dw, dh) * 0.78);
      vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vig.addColorStop(1, 'rgba(1, 4, 8, 0.7)');
      dCtx.fillStyle = vig;
      dCtx.fillRect(0, 0, dw, dh);

      dCtx.restore();

      animFrameId.current = requestAnimationFrame(render);
    };

    animFrameId.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animFrameId.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [biome, brushSize, revealSpeed, darkExtraDuration, fishCount, initRiverbed, initFish]);

  // Pointer Interaction Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    activePointers.current.set(e.pointerId, {
      x,
      y,
      px: x,
      py: y,
      down: true,
      distAccum: 0,
    });

    if (dropPebbleActionRef.current) {
      dropPebbleActionRef.current(x, y);
    }

    if (onInteraction) onInteraction();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ptr = activePointers.current.get(e.pointerId);
    if (ptr) {
      ptr.x = x;
      ptr.y = y;
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    activePointers.current.delete(e.pointerId);
  };

  return (
    <div
      id="option3-clear-depths-container"
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={`relative w-full h-full overflow-hidden bg-[#010408] select-none cursor-pointer touch-none ${className}`}
    >
      {/* Offscreen Underwater Canvas */}
      <canvas ref={underwaterCanvasRef} className="hidden" />

      {/* Offscreen Clarity Alpha Mask Canvas */}
      <canvas ref={clarityCanvasRef} className="hidden" />

      {/* Main Composite Display Canvas */}
      <canvas
        ref={displayCanvasRef}
        id="option3-display-canvas"
        className="w-full h-full block"
      />

      {/* Subtle Mobile Touch Cue */}
      <div className="absolute top-28 left-1/2 -translate-x-1/2 pointer-events-none z-10 select-none">
        <p className="text-xs text-stone-300/80 bg-stone-950/40 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/5">
          Sweep to clear the water
        </p>
      </div>

      {/* Bottom Floating Interaction Toolbar (Standardized Height & 1-Word Controls) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 w-full max-w-lg px-4 flex flex-col items-center pointer-events-none select-none">
        <div className="bg-stone-950/85 backdrop-blur-2xl border border-white/10 rounded-2xl p-1.5 shadow-2xl flex items-center justify-center gap-1.5 pointer-events-auto transition-all">
          {/* Biome Switcher */}
          <div className="h-8 flex items-center bg-stone-900/60 rounded-xl p-0.5 border border-white/5">
            <button
              id="biome-koi"
              type="button"
              onClick={() => setBiome('koi_pond')}
              className={`h-7 px-2.5 rounded-lg text-xs font-medium flex items-center justify-center transition-all ${
                biome === 'koi_pond' ? 'bg-amber-500/20 text-amber-200 border border-amber-400/30' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Koi
            </button>
            <button
              id="biome-tide"
              type="button"
              onClick={() => setBiome('ocean_tidepool')}
              className={`h-7 px-2.5 rounded-lg text-xs font-medium flex items-center justify-center transition-all ${
                biome === 'ocean_tidepool' ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/30' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Tide
            </button>
            <button
              id="biome-abyss"
              type="button"
              onClick={() => setBiome('midnight_lake')}
              className={`h-7 px-2.5 rounded-lg text-xs font-medium flex items-center justify-center transition-all ${
                biome === 'midnight_lake' ? 'bg-teal-500/20 text-teal-200 border border-teal-400/30' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Abyss
            </button>
          </div>

          {/* Drop Pebble */}
          <button
            id="btn-drop-pebble"
            type="button"
            onClick={() => {
              if (dropPebbleActionRef.current) dropPebbleActionRef.current();
            }}
            className="h-8 flex items-center space-x-1.5 px-3 rounded-xl text-xs font-medium bg-stone-800/80 hover:bg-stone-700/80 text-stone-300 border border-stone-700 transition-all active:scale-95"
            title="Drop Pebble"
          >
            <Droplets className="w-3.5 h-3.5 text-cyan-400" />
            <span>Pebble</span>
          </button>

          {/* Re-Veil */}
          <button
            id="btn-clear-window"
            type="button"
            onClick={() => {
              if (clarityClearRef.current) clarityClearRef.current();
            }}
            className="h-8 w-8 flex items-center justify-center rounded-xl text-stone-400 hover:text-stone-200 border border-stone-800 hover:bg-stone-800/80 transition-all active:scale-95"
            title="Re-veil water"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Option3_ClearDepthsView;
