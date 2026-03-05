

export interface Point {
  x: number;
  y: number;
}

export interface Vector {
  x: number;
  y: number;
}

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  picture?: string; // Google Avatar or Telegram photo
  gender?: 'male' | 'female' | 'other';
  dob?: {
    day: string;
    month: string;
    year: string;
  };
  createdAt: number;
  // Admin / Tracking Fields
  ip?: string;
  country?: string;
  city?: string;
  isBanned?: boolean;
  lastLogin?: number;
  termsAccepted?: boolean;
  totalPlayTime?: number; // in seconds
  device?: string; // User Agent
  // TON Blockchain
  tonAddress?: string; // Connected TON wallet address
  tonConnectedAt?: number;
  // Telegram Identity
  telegramId?: string;
  telegramUsername?: string;
  telegramPhoto?: string;
  referredBy?: string; // Who invited this user
  referralCode?: string; // This user's invite code
}

// Telegram WebApp user object
export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
}

export interface WithdrawRequest {
  userId: string;
  tonAddress: string;
  amount: number; // in gold
  tonAmount: number; // calculated TON amount
}

export interface TransactionRecord {
  id: string;
  type: 'buy_skin' | 'withdraw';
  amount: number;
  currency: 'TON' | 'GOLD';
  date: number; // timestamp
  itemName?: string; // e.g., "Neon Blue"
}

export interface SnakeSkin {
  id: string;
  name: string;
  price: number;
  tonPrice?: number;
  unlocked: boolean;
  colors: string[]; // [Primary, Secondary, ...]
  trailStyle?: "none" | "neon" | "fire" | "electric" | "cosmic";
}

export interface Collectible {
  id: string;
  name: string;
  type: 'particle' | 'theme';
  price: number;
  tonPrice?: number;
  description: string;
  color: string;
  icon: string;
}

export interface PlayerData {
  gold: number;
  selectedSkinId: string;
  unlockedSkinIds: string[];
  // Collectibles
  unlockedCollectibles: string[];
  selectedCollectibleId: string | null;
  // Transactions History
  transactions: TransactionRecord[];
  // Progression
  xp: number;
  level: number;
  xpToNext: number;
}

export interface LevelReward {
  type: "gold" | "skin";
  amount?: number; // For gold
  id?: string; // For skins
  name?: string; // Display name
}

export interface LevelUpEvent {
  level: number;
  rewards: LevelReward[];
}

export interface SnakeSegment {
  x: number;
  y: number;
}

export type BotDifficulty = 'easy' | 'medium' | 'hard' | 'nightmare';

export interface Snake {
  id: string;
  name: string;
  country: string;
  body: Point[];
  angle: number;
  targetAngle: number;
  length: number;
  speed: number;
  skin: SnakeSkin;
  // New field to override skin trail
  activeTrail?: string;
  isBoosting: boolean;
  isDead: boolean;
  isBot: boolean;
  difficulty?: BotDifficulty;
  score: number;
  sessionGold: number; // Gold collected in current match
  // Map Zone Effects
  inHazard?: boolean;
  inBoostZone?: boolean;
}

export interface Food {
  id: string;
  x: number;
  y: number;
  value: number;
  color: string;
  radius: number;
  glowing: boolean;
}

export interface Coin {
  id: string;
  x: number;
  y: number;
  value: number;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
  style?: "neon" | "fire" | "electric" | "cosmic" | "glitch" | "hearts" | "money";
}

export interface MapZone {
  id: string;
  x: number;
  y: number;
  radius: number;
  type: 'boost' | 'hazard';
}

export interface GameState {
  snakes: Map<string, Snake>;
  foods: Map<string, Food>;
  coins: Map<string, Coin>;
  particles: Map<string, Particle>;
  zones: Map<string, MapZone>; // Map Zones
  worldSize: number;
  camera: Point;
  myId: string | null;
  spectateId?: string | null;
}

export interface GameSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  quality: 'low' | 'medium' | 'high';
  sensitivity: number;
  playerName: string;
  botDifficulty: BotDifficulty;
  botCount: number; // New field
}