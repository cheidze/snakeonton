
import { PlayerData, LevelReward, LevelUpEvent } from "../types";
import { DEFAULT_GOLD, DEFAULT_SKINS } from "./constants";
import { calculateXPForNextLevel, getLevelRewards } from "./xpService";
import { economyService } from "./economyService";

// Base key prefix
const STORAGE_PREFIX = "blue_origin_data_";

const DEFAULT_DATA: PlayerData = {
  gold: DEFAULT_GOLD,
  selectedSkinId: DEFAULT_SKINS[0].id,
  unlockedSkinIds: [DEFAULT_SKINS[0].id],
  unlockedCollectibles: [],
  selectedCollectibleId: null,
  xp: 0,
  level: 1,
  xpToNext: 1000,
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
  sessionMs: number = 60000 // mock 1 min for now unless tracked
): {
  newData: PlayerData;
  levelUpEvents: LevelUpEvent[]
} => {
  const gainedXP = Math.floor(score * 0.1);

  // Calculate verified allowed gold based on economy rules
  const verifiedGold = economyService.calculateMatchReward({
    userId,
    level: currentData.level,
    score,
    sessionMs,
    isBoosting: false
  });

  let newData = { ...currentData };

  // Add XP and Verified Gold
  newData.xp += gainedXP;
  // Admin bypass: if they collected some via code, but mostly we use calculated economy
  newData.gold += (collectedGold > 0 ? collectedGold : verifiedGold);

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
