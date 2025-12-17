export type Attribute = 'Sever' | 'Stable' | 'Flux' | 'Precision';

export interface Stats {
  PHY: number; // Physique: HP, Load, Melee Dmg
  AGI: number; // Agility: Evasion, Ranged Hit, Stealth
  MND: number; // Mind: Erosion Resist, Observation
  SYN: number; // Synchronization: AC Output, Skill Effect
}

export type ItemType = 'Weapon' | 'Armor' | 'Consumable' | 'Material' | 'AC' | 'Misc';

export type WeaponCategory = 'LightBlade' | 'HeavyImpact' | 'Polearm' | 'Ranged' | 'Sprayer';

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  weight: number; // Grid count
  value: number; // Credits
  rarity: 'G1' | 'G2' | 'G3' | 'G4' | 'G5';
  description: string;
  effect?: string; // Description of effect
  stats?: {
    damage?: number;
    defense?: number; // AV
    shielding?: number; // SR %
    range?: number;
    attribute?: Attribute;
    weaponCategory?: WeaponCategory; // For weapons
    modifiers?: Partial<Stats>; // For AC Cores: Base stat modifiers
    acSkillId?: string; // For AC Cores: Bound skill
  };
}

export interface Equipment {
  weapon: Item | null;
  armor: Item | null; // Renamed from body
  acCore: Item | null; // Renamed from acSlots, singular for now based on "bind to char"
}

export interface Skill {
  id: string;
  name: string;
  type: 'Damage' | 'Effect';
  cost: number; // Erosion cost
  description: string;
  cooldown: number; // Turns
  formula?: string; // For Damage type: e.g. "1d10 + SYN"
  statusEffectId?: string; // For Effect type: Bind status effect
}

export interface StatusEffect {
  id: string;
  name: string;
  description: string;
  type: 'Buff' | 'Debuff';
  duration: number; // Rounds, -1 for infinite
  maxStacks: number;
  modifiers?: Partial<Stats>;
  damageOverTime?: {
    type: 'HP' | 'Erosion';
    value: number; // Negative for healing/reduction
    trigger: 'StartTurn' | 'EndTurn';
  };
}

export interface Character {
  id: string;
  name: string;
  origin: string;
  baseStats: Stats; // Base stats without modifiers
  // derived stats and acAttribute are calculated at runtime
  
  hp: {
    current: number;
    max: number; // Base + Modifiers
  };
  erosion: number; // 0-100
  
  inventory: Item[];
  equipment: Equipment;
  
  credits: number; // Personal money
  battery: number; // Personal battery charge
  
  state: 'Idle' | 'Exploring' | 'Combat' | 'Dead';
  activeStatusEffects: { effectId: string; stacks: number; durationLeft: number }[];
  learnedSkills: string[]; // Skill IDs
}

export type EnemyType = 'Monster' | 'Human';

export interface Enemy {
  id: string;
  name: string;
  type: EnemyType;
  attribute: Attribute;
  stats: {
    hp: number;
    maxHp: number;
    av: number; // Armor Value
    attack: number;
    radiation: number; // Radiation damage per hit
  };
  description: string;
  skills?: string[]; // Skill IDs
  weight?: number; // Spawn weight
  dropTable: {
    itemId: string;
    chance: number; // 0-1
  }[];
}

export interface NodeContent {
    id: string;
    type: 'Combat' | 'Resource' | 'Event' | 'Safe';
    description: string;
    weight: number;
    // For combat
    enemyPool?: string[]; // Enemy IDs
    // For resource
    itemPool?: string[]; // Item IDs
}

export interface GameState {
  characters: Character[];
  sharedInventory: Item[]; // Public resource box
  credits: number; 
  
  currentLayer: 'Shallows' | 'RedForest' | 'DeepSky';
  explorationProgress: number; // Nodes visited?
  totalNodesVisited: number; // New field for tracking
  shops: Shop[];
  
  logs: LogEntry[];
  language: 'en' | 'zh';
  
  // Manager Configs
  configs: {
    nodeWeights: Record<string, number>; // Deprecated, use nodeRegistry
    nodeRegistry: NodeContent[]; // New registry for node contents
    enemyWeights: Record<string, number>;
    customItems: Item[];
    customEnemies: Enemy[];
    recipes: Recipe[];
    skills: Skill[];
    statusEffects: StatusEffect[];
  };
}

export interface Recipe {
  id: string;
  name?: string; // Optional name for custom recipes
  inputs: { itemId: string; count: number }[];
  outputs: { itemId: string; count: number }[];
}

export interface ShopItem {
  itemId: string;
  price: number;
  stock: number; // -1 for infinite
}

export interface Shop {
  id: string;
  name: string;
  inventory: ShopItem[];
  discount: number; // 0.0 to 1.0 (e.g. 0.9 for 10% off)
}

export interface LogEntry {
  id: string;
  timestamp: number;
  type: 'Combat' | 'Event' | 'System' | 'Loot';
  content: string;
  relatedEntityId?: string;
}

export interface MapNode {
  id: string;
  type: 'Combat' | 'Resource' | 'Event' | 'Safe';
  layer: 'Shallows' | 'RedForest' | 'DeepSky';
  description: string;
  resolved: boolean;
  enemies?: Enemy[]; // If combat
  loot?: Item[]; // If resource
}
