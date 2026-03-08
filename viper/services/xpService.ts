
import { LevelReward } from "../types";
import { DEFAULT_SKINS } from "./constants";

export const calculateXPForNextLevel = (level: number): number => {
  // Formula: 2000 * 1.2^(level-1).
  // Level 1: 2000 XP
  // Level 5: ~4100 XP
  // Level 10: ~10300 XP
  // This ensures leveling gets harder exponentially.
  return Math.floor(2000 * Math.pow(1.2, level - 1)); 
};

export const getLevelRewards = (level: number): LevelReward[] => {
  const rewards: LevelReward[] = [];
  
  // Reward 50 gold every level
  rewards.push({ type: "gold", amount: 50 });

  // Special skin unlocks at milestone levels
  if (level === 5) {
      const skin = DEFAULT_SKINS.find(s => s.id === "neon-blue");
      if (skin) rewards.push({ type: "skin", id: skin.id, name: skin.name });
  }
  if (level === 10) {
      const skin = DEFAULT_SKINS.find(s => s.id === "galaxy-purple");
      if (skin) rewards.push({ type: "skin", id: skin.id, name: skin.name });
  }
  if (level === 20) {
      const skin = DEFAULT_SKINS.find(s => s.id === "gold-rush");
      if (skin) rewards.push({ type: "skin", id: skin.id, name: skin.name });
  }

  return rewards;
};
