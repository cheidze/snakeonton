
/**
 * Economy Service — off-chain gold system
 * Anti-inflation model with daily earning caps and match reward formulas.
 * 
 * Gold → TON exchange rate (future):
 *   1 TON = 10,000 gold
 *   Minimum withdraw: 100,000 gold = 10 TON
 */

const ECONOMY_KEY_PREFIX = 'snake_economy_';
const GOLD_PER_TON = 10_000;
const MIN_WITHDRAW_GOLD = 100_000; // 10 TON minimum

export interface DailyEconomy {
    date: string; // ISO date string yyyy-mm-dd
    earned: number;
    matchesPlayed: number;
}

export interface EconomyConfig {
    baseRewardPerScore: number;
    boostMultiplier: number;
    dailyCap: number;
    referralBonus: number; // gold per active referral per day
}

/** Level-scaled daily earning caps — prevent inflation */
const DAILY_CAPS: Record<number, number> = {
    1: 500,
    2: 600,
    3: 750,
    4: 900,
    5: 1100,
    6: 1350,
    7: 1650,
    8: 2000,
    9: 2500,
    10: 3200,
};

function getTodayKey(): string {
    return new Date().toISOString().split('T')[0];
}

function getDailyData(userId: string): DailyEconomy {
    const key = ECONOMY_KEY_PREFIX + userId;
    try {
        const stored = localStorage.getItem(key);
        if (stored) {
            const data: DailyEconomy = JSON.parse(stored);
            if (data.date === getTodayKey()) return data;
        }
    } catch (_) { }
    return { date: getTodayKey(), earned: 0, matchesPlayed: 0 };
}

function saveDailyData(userId: string, data: DailyEconomy): void {
    try {
        localStorage.setItem(ECONOMY_KEY_PREFIX + userId, JSON.stringify(data));
    } catch (_) { }
}

class EconomyService {
    /**
     * Get the daily earning cap for a given player level (1–10+)
     */
    public getDailyEarningCap(level: number): number {
        const clampedLevel = Math.min(Math.max(level, 1), 10);
        return DAILY_CAPS[clampedLevel] ?? 3200;
    }

    /**
     * How much gold can this user still earn today?
     */
    public getRemainingDailyCap(userId: string, level: number): number {
        const daily = getDailyData(userId);
        const cap = this.getDailyEarningCap(level);
        return Math.max(0, cap - daily.earned);
    }

    /**
     * Anti-inflation match reward formula:
     *   base = score * 0.05
     *   session length bonus: +10% per full minute (max +50%)
     *   boost penalty: no bonus if match < 30 sec (anti-AFK farm)
     *   cap applied → returns actual allowed gold
     */
    public calculateMatchReward(params: {
        userId: string;
        level: number;
        score: number;
        sessionMs: number;
        isBoosting: boolean;
    }): number {
        const { userId, level, score, sessionMs, isBoosting } = params;

        const sessionSec = sessionMs / 1000;
        const base = score * 0.05;

        // Time bonus: +10% / minute (capped at +50%)
        const minuteBonus = Math.min(Math.floor(sessionSec / 60) * 0.10, 0.5);
        let reward = base * (1 + minuteBonus);

        // Boosting adds slight bonus
        if (isBoosting) reward *= 1.05;

        // Anti-AFK: if match < 30 sec, only give 30% of reward
        if (sessionSec < 30) reward *= 0.3;

        const roundedReward = Math.floor(reward);

        // Apply daily cap
        const remaining = this.getRemainingDailyCap(userId, level);
        const actualReward = Math.min(roundedReward, remaining);

        if (actualReward > 0) {
            const daily = getDailyData(userId);
            daily.earned += actualReward;
            daily.matchesPlayed += 1;
            saveDailyData(userId, daily);
        }

        return actualReward;
    }

    /**
     * Record a manual gold grant (shop purchase bonus, referral, etc.)
     * Does NOT apply daily cap (admin/event grants bypass it).
     */
    public recordGrant(userId: string, amount: number): void {
        const daily = getDailyData(userId);
        daily.earned += amount;
        saveDailyData(userId, daily);
    }

    /**
     * Is the user capped out for today?
     */
    public isDailyCapped(userId: string, level: number): boolean {
        return this.getRemainingDailyCap(userId, level) === 0;
    }

    /**
     * Get today's stats for HUD display
     */
    public getTodayStats(userId: string): DailyEconomy {
        return getDailyData(userId);
    }

    // --- TON Conversion helpers ---

    public goldToTon(gold: number): number {
        return gold / GOLD_PER_TON;
    }

    public tonToGold(ton: number): number {
        return ton * GOLD_PER_TON;
    }

    public getMinWithdrawGold(): number {
        return MIN_WITHDRAW_GOLD;
    }

    public canWithdraw(gold: number): boolean {
        return gold >= MIN_WITHDRAW_GOLD;
    }

    /** Format withdraw preview string */
    public formatWithdrawPreview(gold: number): string {
        const ton = this.goldToTon(gold);
        return `${gold.toLocaleString()} 💰 = ${ton.toFixed(2)} TON`;
    }
}

export const economyService = new EconomyService();
