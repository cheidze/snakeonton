
import { PlayerData, LevelReward, LevelUpEvent } from "../types";
import { DEFAULT_GOLD, DEFAULT_SKINS } from "./constants";
import { calculateXPForNextLevel, getLevelRewards } from "./xpService";
import { authService } from "./authService";

// Base key prefix
const STORAGE_PREFIX = "snakeon_data_";

const DEFAULT_DATA: PlayerData = {
  gold: DEFAULT_GOLD,
  selectedSkinId: DEFAULT_SKINS[0].id,
  unlockedSkinIds: [DEFAULT_SKINS[0].id],
  unlockedCollectibles: [],
  selectedCollectibleId: null,
  xp: 0,
  level: 1,
  xpToNext: 1000,
  highScore: 0,
  hasSeenTutorial: false,
  stats: {
    gamesPlayed: 0,
    gamesWon: 0,
    totalKills: 0,
    longestSnake: 0,
    totalPlayTime: 0,
  }
};

export const loadPlayerData = (userId: string): PlayerData => {
  try {
    const stored = localStorage.getItem(STORAGE_PREFIX + userId);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_DATA, ...parsed };
    }
  } catch (e) {
    console.warn("Failed to load player data", e);
  }
  return DEFAULT_DATA;
};

export const savePlayerData = (userId: string, data: PlayerData) => {
  try {
    localStorage.setItem(STORAGE_PREFIX + userId, JSON.stringify(data));
  } catch (e) {
    console.warn("Failed to save player data", e);
  }
};

// Helper to process progression 
export const processMatchProgression = (
  userId: string,
  currentData: PlayerData, 
  score: number,
  collectedGold: number,
  matchStats?: {
    kills: number;
    length: number;
    playTime: number;
    isWin: boolean;
  }
): { 
  newData: PlayerData; 
  levelUpEvents: LevelUpEvent[] 
} => {
  const gainedXP = Math.floor(score * 0.1); 
  let newData = { ...currentData };
  
  // Ensure stats object exists
  if (!newData.stats) {
    newData.stats = { ...DEFAULT_DATA.stats! };
  }
  
  // Add XP and Gold
  newData.xp += gainedXP;
  newData.gold += collectedGold;
  if (score > (newData.highScore || 0)) {
    newData.highScore = score;
  }

  // Update stats
  if (matchStats) {
    newData.stats.gamesPlayed += 1;
    if (matchStats.isWin) newData.stats.gamesWon += 1;
    newData.stats.totalKills += matchStats.kills;
    newData.stats.totalPlayTime += matchStats.playTime;
    if (matchStats.length > newData.stats.longestSnake) {
      newData.stats.longestSnake = matchStats.length;
    }
  }

  const levelUpEvents: LevelUpEvent[] = [];

  // Level Up Loop
  while (newData.xp >= newData.xpToNext) {
    newData.xp -= newData.xpToNext;
    newData.level += 1;
    newData.xpToNext = calculateXPForNextLevel(newData.level);
    
    const levelRewards = getLevelRewards(newData.level);
    
    // Apply rewards to data
    levelRewards.forEach(r => {
        if (r.type === "gold" && r.amount) {
          newData.gold += r.amount;
        }
        if (r.type === "skin" && r.id) {
          if (!newData.unlockedSkinIds.includes(r.id)) {
            newData.unlockedSkinIds.push(r.id);
          }
        }
    });

    levelUpEvents.push({
        level: newData.level,
        rewards: levelRewards
    });
  }

  savePlayerData(userId, newData);
  
  return { newData, levelUpEvents };
};

export interface LeaderboardEntry {
  username: string;
  highScore: number;
  level: number;
  country: string;
}

export const getLeaderboard = (): LeaderboardEntry[] => {
  const entries: LeaderboardEntry[] = [];
  try {
    const users = authService.getUsers();
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {
        const userId = key.replace(STORAGE_PREFIX, "");
        const dataStr = localStorage.getItem(key);
        if (dataStr) {
          const data = JSON.parse(dataStr) as PlayerData;
          const user = users.find(u => u.id === userId);
          if (user && data.highScore > 0) {
            entries.push({
              username: user.username,
              highScore: data.highScore || 0,
              level: data.level || 1,
              country: user.country || 'WW'
            });
          }
        }
      }
    }
  } catch (e) {
    console.error("Failed to load leaderboard", e);
  }
  
  // Sort by high score descending
  return entries.sort((a, b) => b.highScore - a.highScore).slice(0, 10);
};
