export interface PlatformRect {
  x: number;
  y: number;
  w: number;
  h: number;
  type?: 'solid' | 'oneway' | 'hazard' | 'jumppad';
}

export interface PuzzleSwitchDef {
  id: string;
  x: number;
  y: number;
  targetGateId: string;
  label: string;
}

export interface LaserGateDef {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  requiredSwitches: number;
  color: string;
}

export interface EnemySpawnDef {
  id: string;
  type: 'patrol' | 'drone' | 'sentinel' | 'turret';
  x: number;
  y: number;
  patrolMinX?: number;
  patrolMaxX?: number;
}

export interface CheckpointDef {
  id: string;
  x: number;
  y: number;
}

export interface BossDef {
  name: string;
  title: string;
  maxHealth: number;
  x: number;
  y: number;
  radius: number;
  color: string;
  accentColor: string;
  attackPattern: 'spread' | 'ring' | 'homing' | 'laser' | 'combo';
  speed: number;
}

export interface LevelDef {
  id: number;
  name: string;
  sectorCode: string;
  biomeTheme: string;
  bgGradientTop: string;
  bgGradientBottom: string;
  accentColor: string;
  weaponUnlockedId: number;
  puzzleHint: string;
  worldWidth: number;
  worldHeight: number;
  playerStart: { x: number; y: number };
  platforms: PlatformRect[];
  switches: PuzzleSwitchDef[];
  gates: LaserGateDef[];
  checkpoints: CheckpointDef[];
  enemies: EnemySpawnDef[];
  boss: BossDef;
}

function buildStandardLevel(
  id: number,
  name: string,
  sectorCode: string,
  biomeTheme: string,
  bgTop: string,
  bgBottom: string,
  accentColor: string,
  puzzleHint: string,
  bossName: string,
  bossTitle: string,
  bossHp: number,
  bossPattern: BossDef['attackPattern']
): LevelDef {
  const worldWidth = 3400;
  const worldHeight = 900;
  const diffMultiplier = 1 + (id - 1) * 0.14;

  // Base floor and ceiling walls
  const platforms: PlatformRect[] = [
    // Main Ground Segments
    { x: 0, y: 760, w: 1100, h: 140, type: 'solid' },
    // Acid / Plasma Hazard Pit 1
    { x: 1100, y: 810, w: 280, h: 90, type: 'hazard' },
    { x: 1100, y: 860, w: 280, h: 40, type: 'solid' },
    // Middle Sector Ground
    { x: 1380, y: 760, w: 920, h: 140, type: 'solid' },
    // Hazard Pit 2
    { x: 2300, y: 810, w: 240, h: 90, type: 'hazard' },
    { x: 2300, y: 860, w: 240, h: 40, type: 'solid' },
    // Boss Arena Ground
    { x: 2540, y: 760, w: 860, h: 140, type: 'solid' },

    // Left & Right World Boundaries
    { x: -40, y: 0, w: 40, h: worldHeight, type: 'solid' },
    { x: worldWidth, y: 0, w: 40, h: worldHeight, type: 'solid' },

    // Exploration & Puzzle Platforms
    { x: 260, y: 630, w: 180, h: 24, type: 'solid' },
    { x: 520, y: 510, w: 220, h: 24, type: 'solid' },
    { x: 840, y: 600, w: 170, h: 24, type: 'solid' },

    // Bridge over Pit 1
    { x: 1150, y: 640, w: 180, h: 22, type: 'solid' },
    // Jump pad to upper puzzle alcove
    { x: 960, y: 740, w: 70, h: 20, type: 'jumppad' },
    { x: 1080, y: 380, w: 260, h: 24, type: 'solid' },

    // Mid-Sector Multi-Tier Puzzle Structure
    { x: 1520, y: 620, w: 200, h: 24, type: 'solid' },
    { x: 1800, y: 490, w: 240, h: 24, type: 'solid' },
    { x: 1640, y: 350, w: 200, h: 24, type: 'solid' },
    { x: 2100, y: 610, w: 170, h: 24, type: 'solid' },

    // Jump Pad before Gate 2
    { x: 2200, y: 740, w: 70, h: 20, type: 'jumppad' },
    { x: 2340, y: 550, w: 160, h: 22, type: 'solid' },

    // Boss Arena Tactical Platforms
    { x: 2720, y: 610, w: 180, h: 22, type: 'solid' },
    { x: 3060, y: 610, w: 180, h: 22, type: 'solid' },
    { x: 2890, y: 470, w: 180, h: 22, type: 'solid' }
  ];

  // Add level-specific platform variations
  if (id % 2 === 0) {
    platforms.push({ x: 640, y: 360, w: 190, h: 22, type: 'solid' });
    platforms.push({ x: 1980, y: 340, w: 190, h: 22, type: 'solid' });
  }

  const gates: LaserGateDef[] = [
    {
      id: `gate_1_lvl_${id}`,
      x: 1390,
      y: 500,
      w: 28,
      h: 260,
      requiredSwitches: 1,
      color: '#F43F5E'
    },
    {
      id: `gate_boss_lvl_${id}`,
      x: 2550,
      y: 440,
      w: 32,
      h: 320,
      requiredSwitches: 2,
      color: '#A855F7'
    }
  ];

  const switches: PuzzleSwitchDef[] = [
    {
      id: `sw_1_lvl_${id}`,
      x: 1190,
      y: 340,
      targetGateId: `gate_1_lvl_${id}`,
      label: 'ALPHA CONDUIT NODE'
    },
    {
      id: `sw_2a_lvl_${id}`,
      x: 1720,
      y: 310,
      targetGateId: `gate_boss_lvl_${id}`,
      label: 'CITADEL LOCK NODE A'
    },
    {
      id: `sw_2b_lvl_${id}`,
      x: 2410,
      y: 510,
      targetGateId: `gate_boss_lvl_${id}`,
      label: 'CITADEL LOCK NODE B'
    }
  ];

  const checkpoints: CheckpointDef[] = [
    { id: `cp_start_${id}`, x: 160, y: 760 },
    { id: `cp_mid_${id}`, x: 1450, y: 760 },
    { id: `cp_boss_${id}`, x: 2600, y: 760 }
  ];

  const enemies: EnemySpawnDef[] = [
    { id: `e1_${id}`, type: 'patrol', x: 560, y: 720, patrolMinX: 440, patrolMaxX: 780 },
    { id: `e2_${id}`, type: 'drone', x: 760, y: 440 },
    { id: `e3_${id}`, type: 'sentinel', x: 1180, y: 600, patrolMinX: 1150, patrolMaxX: 1310 },
    { id: `e4_${id}`, type: 'patrol', x: 1680, y: 720, patrolMinX: 1500, patrolMaxX: 1920 },
    { id: `e5_${id}`, type: 'turret', x: 1910, y: 450 },
    { id: `e6_${id}`, type: 'drone', x: 2050, y: 380 },
    { id: `e7_${id}`, type: 'sentinel', x: 2150, y: 570, patrolMinX: 2100, patrolMaxX: 2250 }
  ];

  if (id >= 4) {
    enemies.push({ id: `e8_${id}`, type: 'drone', x: 1220, y: 280 });
    enemies.push({ id: `e9_${id}`, type: 'turret', x: 910, y: 560 });
  }
  if (id >= 7) {
    enemies.push({ id: `e10_${id}`, type: 'sentinel', x: 1850, y: 450, patrolMinX: 1800, patrolMaxX: 2020 });
    enemies.push({ id: `e11_${id}`, type: 'drone', x: 2420, y: 420 });
  }

  return {
    id,
    name,
    sectorCode,
    biomeTheme,
    bgGradientTop: bgTop,
    bgGradientBottom: bgBottom,
    accentColor,
    weaponUnlockedId: id,
    puzzleHint,
    worldWidth,
    worldHeight,
    playerStart: { x: 140, y: 690 },
    platforms,
    switches,
    gates,
    checkpoints,
    enemies,
    boss: {
      name: bossName,
      title: bossTitle,
      maxHealth: Math.round(bossHp * diffMultiplier),
      x: 3120,
      y: 620,
      radius: 46 + Math.min(20, id * 2),
      color: accentColor,
      accentColor: '#F43F5E',
      attackPattern: bossPattern,
      speed: 2.3 + id * 0.18
    }
  };
}

export const LEVELS: LevelDef[] = [
  buildStandardLevel(
    1,
    'Bioluminescent Outpost',
    'SECTOR 01 // ENTRY NEXUS',
    'Subterranean Cyan Cavern',
    '#0B0F19',
    '#0F2942',
    '#38BDF8',
    'Shoot or Press [E] on glowing Energy Switches to deactivate Laser Barrier Gates.',
    'VEX-01: GUARDIAN CONSTRUCT',
    'Automated Perimeter Warden',
    420,
    'spread'
  ),
  buildStandardLevel(
    2,
    'Crystalline Conduit',
    'SECTOR 02 // PRISM MINES',
    'Emerald Resonance Vaults',
    '#09141A',
    '#06373A',
    '#34D399',
    'Use Jump Pads to reach upper crystal relays and unlock the Boss Chamber.',
    'KRYPTOR: PRISM GOLIATH',
    'Refractive Crystal Core',
    560,
    'ring'
  ),
  buildStandardLevel(
    3,
    'Ion Foundry',
    'SECTOR 03 // SMELTING REACTOR',
    'Amber Industrial Catacombs',
    '#17110B',
    '#3B2110',
    '#FBBF24',
    'Your Ricochet Ion Carbine can bounce shots off walls to hit switches from cover!',
    'IGNIS-PRIME: FORGE OVERLORD',
    'Thermonuclear Smelting Unit',
    720,
    'laser'
  ),
  buildStandardLevel(
    4,
    'Crimson Relay Array',
    'SECTOR 04 // LASER GRID',
    'High-Security Defense Spine',
    '#1A0B12',
    '#3F1021',
    '#F43F5E',
    'The Piercing Rail-Lance penetrates through multiple Shield Sentinels at once.',
    'VALKYR-IX: CRIMSON ARCHON',
    'High-Velocity Interceptor',
    890,
    'homing'
  ),
  buildStandardLevel(
    5,
    'Cryo-Stasis Vault',
    'SECTOR 05 // FROZEN ARCHIVE',
    'Sub-Zero Glacial Lab',
    '#0B1325',
    '#172E5C',
    '#60A5FA',
    'Cryo-Nova splash explosions can trigger switches and damage clustered drones.',
    'GLACIUS: ZERO-KELVIN TITAN',
    'Cryogenic Containment AI',
    1080,
    'combo'
  ),
  buildStandardLevel(
    6,
    'Nebula Observatory',
    'SECTOR 06 // ASTRAL SPIRE',
    'Violet Zero-G Spire',
    '#140C24',
    '#2E1454',
    '#A855F7',
    'Seeker Swarm missiles automatically lock onto high-altitude switches and bosses.',
    'ASTRALIS: VOID NAVIGATOR',
    'Quantum Celestial Construct',
    1260,
    'homing'
  ),
  buildStandardLevel(
    7,
    'Tesla Dynamo Core',
    'SECTOR 07 // HIGH VOLTAGE',
    'Arc-Lightning Power Plant',
    '#07171E',
    '#0D3B49',
    '#22D3EE',
    'Volt-Arc bolts chain between nearby enemies and electrify power relays.',
    'VOLTARC: THUNDER SOVEREIGN',
    'Megawatt Dynamo Core',
    1480,
    'ring'
  ),
  buildStandardLevel(
    8,
    'Magma Core Trench',
    'SECTOR 08 // GEOTHERMAL ABYSS',
    'Molten Core Conduit',
    '#1C0E08',
    '#4A1D0D',
    '#FB923C',
    'Unleash rapid-fire Solar Magma streams to melt heavy Sentinel plating.',
    'PYROCLAST: MOLTEN BEHEMOTH',
    'Geothermal Magma Leviathan',
    1720,
    'spread'
  ),
  buildStandardLevel(
    9,
    'Singularity Sanctum',
    'SECTOR 09 // EVENT HORIZON',
    'Dark Matter Research Wing',
    '#13091F',
    '#2B124C',
    '#C084FC',
    'Void Singularity projectiles crush heavy shields with gravitational shockwaves.',
    'NIHILUS: EVENT HORIZON',
    'Gravitational Anomaly Core',
    2050,
    'combo'
  ),
  buildStandardLevel(
    10,
    'Obsidian Citadel Apex',
    'SECTOR 10 // THRONE OF AETHER',
    'Sovereign Neural Core',
    '#090D16',
    '#1E293B',
    '#38BDF8',
    'Wield the Aether-Forge Omega Array and defeat the Sovereign Architect to save the Citadel!',
    'AETHER-OMEGA: THE ARCHITECT',
    'Supreme Citadel Singularity',
    2600,
    'combo'
  )
];
