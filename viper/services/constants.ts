
import { SnakeSkin, Collectible, BotDifficulty } from "../types";

export const WORLD_SIZE = 12000; // Massive map (3x size)
export const INITIAL_SNAKE_LENGTH = 5; 
export const BASE_SPEED = 4;
export const BOOST_SPEED = 7;
export const TURN_SPEED = 0.12;
export const SEGMENT_DISTANCE = 10; 

// UPDATED DENSITY SETTINGS
export const FOOD_COUNT = 3000; // Significantly increased density
export const COIN_COUNT = 600;  // Separate collectible density
export const COIN_VALUE = 10;
export const BOT_COUNT = 10;    

// MAP ZONES
export const POWERUP_COUNT = 20;

export const DEFAULT_GOLD = 0;

export const DEFAULT_SKINS: SnakeSkin[] = [
  {
    id: "classic",
    name: "Classic Green",
    price: 0,
    unlocked: true,
    colors: ["#22c55e", "#4ade80"],
    trailStyle: "none"
  },
  {
    id: "neon-blue",
    name: "Neon Blue",
    price: 500,
    unlocked: false,
    colors: ["#00f3ff", "#005f7f"],
    trailStyle: "neon"
  },
  {
    id: "fire-red",
    name: "Fire Red",
    price: 800,
    unlocked: false,
    colors: ["#ef4444", "#f97316"],
    trailStyle: "fire"
  },
  {
    id: "toxic-waste",
    name: "Toxic Waste",
    price: 1200,
    unlocked: false,
    colors: ["#ccff00", "#39ff14"],
    trailStyle: "electric"
  },
  {
    id: "galaxy-purple",
    name: "Galaxy Purple",
    price: 2000,
    unlocked: false,
    colors: ["#bd00ff", "#7c3aed"],
    trailStyle: "cosmic"
  },
  {
    id: "gold-rush",
    name: "Gold Rush",
    price: 5000,
    unlocked: false,
    colors: ["#ffd700", "#b8860b"],
    trailStyle: "neon"
  },
  {
    id: "rainbow-dash",
    name: "Rainbow Dash",
    price: 3500,
    unlocked: false,
    colors: ["#ff0000", "#ff7f00", "#ffff00", "#00ff00", "#0000ff", "#4b0082", "#9400d3"],
    trailStyle: "cosmic"
  },
  {
    id: "cyber-punk",
    name: "Cyber Punk",
    price: 4000,
    unlocked: false,
    colors: ["#ff00ff", "#00ffff", "#ffff00"],
    trailStyle: "electric"
  },
  {
    id: "matrix-code",
    name: "The Matrix",
    price: 4500,
    unlocked: false,
    colors: ["#00ff00", "#003300", "#008800"],
    trailStyle: "electric"
  },
  {
    id: "usa-flag",
    name: "USA",
    price: 3000,
    unlocked: false,
    colors: ["#ff0000", "#ffffff", "#0000ff"],
    trailStyle: "none",
    pattern: "stripes"
  },
  {
    id: "georgia-flag",
    name: "Georgia",
    price: 3000,
    unlocked: false,
    colors: ["#ffffff", "#ff0000"],
    trailStyle: "none",
    pattern: "stripes"
  },
  {
    id: "mecha-dragon",
    name: "Mecha Dragon",
    price: 7000,
    unlocked: false,
    colors: ["#ff4500", "#8b0000"],
    trailStyle: "fire",
    pattern: "spikes"
  },
  {
    id: "abyssal-fish",
    name: "Abyssal Fish",
    price: 7500,
    unlocked: false,
    colors: ["#00008b", "#00ffff"],
    trailStyle: "electric",
    pattern: "fins"
  },
  {
    id: "tiger-snake",
    name: "Tiger Snake",
    price: 5000,
    unlocked: false,
    colors: ["#ff8c00", "#000000"],
    trailStyle: "none",
    pattern: "stripes"
  },
  {
    id: "radiant-spirit",
    name: "Radiant Spirit",
    price: 8000,
    unlocked: false,
    colors: ["#ffffff", "#ff00ff"],
    trailStyle: "cosmic",
    pattern: "glow"
  },
  {
    id: "armored-serpent",
    name: "Armored Serpent",
    price: 6500,
    unlocked: false,
    colors: ["#2f4f4f", "#708090"],
    trailStyle: "neon",
    pattern: "scales"
  }
];

export const DEFAULT_COLLECTIBLES: Collectible[] = [
    {
        id: "trail_hearts",
        name: "Love Trail",
        type: "particle",
        price: 1500,
        description: "Leaves a trail of hearts behind you",
        color: "#ff69b4",
        icon: "💖"
    },
    {
        id: "trail_money",
        name: "Cash Flow",
        type: "particle",
        price: 2500,
        description: "Make it rain while you boost",
        color: "#85bb65",
        icon: "💸"
    },
    {
        id: "theme_gold",
        name: "Midas UI",
        type: "theme",
        price: 5000,
        description: "A luxurious golden interface theme",
        color: "#ffd700",
        icon: "👑"
    },
    {
        id: "theme_dark",
        name: "Abyss UI",
        type: "theme",
        price: 3000,
        description: "Pitch black interface style",
        color: "#333333",
        icon: "🌑"
    },
    {
        id: "powerup_magnet",
        name: "Magnet",
        type: "powerup",
        price: 1500,
        description: "Attracts nearby food and coins",
        color: "#ff0000",
        icon: "🧲",
        radius: 250
    }
];

// Bot specific skin
export const BOT_SKIN: SnakeSkin = {
    id: "bot-standard",
    name: "Bot Standard",
    price: 0,
    unlocked: true,
    colors: ["#10b981", "#059669"], // Standard Green Emerald
    trailStyle: "none"
};

export const FOOD_COLORS = [
  '#ff00ff', '#00ffff', '#ffff00', '#ff0000', '#00ff00', '#ffffff'
];

export const SOUND_FREQUENCIES = {
  eat: [440, 880],
  die: [150, 50],
  boost: [200, 400],
};

export const BOT_FLAGS = [
  'US', 'GB', 'DE', 'FR', 'JP', 'KR', 'CN', 'BR', 'IN', 'CA', 'AU', 'GE', 'IT', 'ES', 'MX', 'UA', 'TR'
];

export const PLAYER_COUNTRIES = [
    { code: 'WW', name: 'International' },
    { code: 'US', name: 'United States' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' },
    { code: 'JP', name: 'Japan' },
    { code: 'KR', name: 'South Korea' },
    { code: 'CN', name: 'China' },
    { code: 'BR', name: 'Brazil' },
    { code: 'IN', name: 'India' },
    { code: 'CA', name: 'Canada' },
    { code: 'AU', name: 'Australia' },
    { code: 'GE', name: 'Georgia' },
    { code: 'IT', name: 'Italy' },
    { code: 'ES', name: 'Spain' },
    { code: 'MX', name: 'Mexico' },
    { code: 'UA', name: 'Ukraine' },
    { code: 'TR', name: 'Turkey' },
    { code: 'RU', name: 'Russia' },
    { code: 'ID', name: 'Indonesia' },
    { code: 'PH', name: 'Philippines' },
    { code: 'VN', name: 'Vietnam' },
    { code: 'TH', name: 'Thailand' },
    { code: 'PL', name: 'Poland' },
    { code: 'NL', name: 'Netherlands' }
];

// Bot Difficulty Configurations
export const BOT_DIFFICULTIES: Record<BotDifficulty, { 
    speedMult: number; 
    turnSpeedMult: number; 
    boostChance: number; 
    detectionRadius: number;
    viewDistance: number;
}> = {
    easy: {
        speedMult: 0.85,
        turnSpeedMult: 0.6,
        boostChance: 0.001,
        detectionRadius: 120,
        viewDistance: 300
    },
    medium: {
        speedMult: 1.0,
        turnSpeedMult: 1.0,
        boostChance: 0.02,
        detectionRadius: 200,
        viewDistance: 600
    },
    hard: {
        speedMult: 1.05,
        turnSpeedMult: 1.3,
        boostChance: 0.08,
        detectionRadius: 300,
        viewDistance: 900
    },
    nightmare: {
        speedMult: 1.15,
        turnSpeedMult: 1.8,
        boostChance: 0.15,
        detectionRadius: 400,
        viewDistance: 1200
    }
};

export const isoToEmoji = (code: string): string => {
  if (!code || code === 'WW') return '🌐';
  return code
    .toUpperCase()
    .replace(/./g, char => String.fromCodePoint(char.charCodeAt(0) + 127397));
};
