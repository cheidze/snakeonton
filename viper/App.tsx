import React, { useState, useEffect, useMemo } from "react";
import WebApp from "@twa-dev/sdk";
import GameCanvas from "./components/GameCanvas";
import MainMenu from "./components/MainMenu";
import HUD from "./components/HUD";
import Shop from "./components/Shop";
import LevelUpModal from "./components/LevelUpModal";
import AdminPanel from "./components/AdminPanel";
import LoadingScreen from "./components/LoadingScreen";
import LuckyWheel from "./components/LuckyWheel";
import TutorialOverlay from "./components/TutorialOverlay";
import { GameEngine } from "./services/gameEngine";
import {
  GameSettings,
  SnakeSkin,
  LevelUpEvent,
  Collectible,
  UserProfile,
  PlayerData,
  Snake,
} from "./types";
import { telegramService } from "./services/telegramService";
import { tonService } from "./services/tonService";
import { audioService } from "./services/audioService";
import { authService } from "./services/authService";
import {
  loadPlayerData,
  savePlayerData,
  processMatchProgression,
} from "./services/playerService";
import {
  DEFAULT_SKINS,
  DEFAULT_COLLECTIBLES,
  DEFAULT_GOLD,
  BOT_COUNT,
} from "./services/constants";

// Helper to get default data safely
const getDefaultData = (): PlayerData => ({
  gold: DEFAULT_GOLD,
  selectedSkinId: DEFAULT_SKINS[0].id,
  unlockedSkinIds: [DEFAULT_SKINS[0].id],
  unlockedCollectibles: [],
  selectedCollectibleId: null,
  transactions: [],
  xp: 0,
  level: 1,
  xpToNext: 1000,
  highScore: 0,
  hasSeenTutorial: false,
});

function App() {
  const engine = useMemo(() => new GameEngine(), []);

  useEffect(() => {
    WebApp.ready();
  }, []);

  const [gameState, setGameState] = useState<
    "LOADING" | "MENU" | "SHOP" | "PLAYING" | "GAMEOVER"
  >("LOADING");
  const [showAdmin, setShowAdmin] = useState(false);
  const [showLuckyWheel, setShowLuckyWheel] = useState(false);

  const [finalScore, setFinalScore] = useState(0);
  const [sessionGold, setSessionGold] = useState(0);
  const [finalLength, setFinalLength] = useState(0);
  const [finalRank, setFinalRank] = useState(0);
  const [hasWon, setHasWon] = useState(false);
  const [userCountry, setUserCountry] = useState<string>("WW");

  // Auth & Player Data State
  const [tonAddress, setTonAddress] = useState<string | null>(null);
  const [isTelegram] = useState(() => telegramService.isTelegramContext());
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [playerData, setPlayerData] = useState<PlayerData>(getDefaultData());

  const [pendingLevelUps, setPendingLevelUps] = useState<LevelUpEvent[]>([]);

  const [settings, setSettings] = useState<GameSettings>({
    soundEnabled: true,
    soundVolume: 0.5,
    musicEnabled: true,
    musicVolume: 0.5,
    quality: "high",
    visualEffects: "full",
    controlScheme: "hybrid",
    sensitivity: 1.0,
    playerName: "Guest",
    botDifficulty: "medium",
    botCount: BOT_COUNT, // Initialize with default constant
    gameMode: "classic",
  });

  const [isPaused, setIsPaused] = useState(false);

  // Initialize Telegram + TON on mount
  useEffect(() => {
    // 1. Init Telegram Mini App
    telegramService.init();

    // 2. Init TON Connect
    const manifestUrl = `${window.location.origin}/tonconnect-manifest.json`;
    tonService.init(manifestUrl).then(() => {
      // Sync wallet address with state
      const addr = tonService.getWalletAddress();
      setTonAddress(addr);

      // Listen for wallet connect/disconnect
      const unsub = tonService.onWalletChange((address) => {
        setTonAddress(address);
        if (currentUser) {
          authService.setTonAddress(currentUser.id, address);
          setCurrentUser(prev => prev ? { ...prev, tonAddress: address ?? undefined } : prev);
        }
      });
      return () => unsub();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Telegram Auto-Login
  useEffect(() => {
    if (!isTelegram) return;
    const tgUser = telegramService.getTelegramUser();
    if (!tgUser) return;
    const startParam = telegramService.getStartParam();
    authService.loginWithTelegram(tgUser, startParam).then(result => {
      if (result.success && result.user) {
        setCurrentUser(result.user);
        setPlayerData(loadPlayerData(result.user.id));
        setSettings(prev => ({ ...prev, playerName: result.user!.username }));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTelegram]);

  // Initialize Auth (web browser fallback)
  useEffect(() => {
    if (isTelegram) return; // Telegram already handles login above
    const user = authService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      setPlayerData(loadPlayerData(user.id));
      setSettings((prev) => ({ ...prev, playerName: user.username }));
    }
  }, [isTelegram]);

  // Handle Login
  const handleLogin = (user: UserProfile) => {
    setCurrentUser(user);
    setPlayerData(loadPlayerData(user.id));
    setSettings((prev) => ({ ...prev, playerName: user.username }));
  };

  // Handle Logout
  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setPlayerData(getDefaultData()); // Reset to default
    setShowAdmin(false);
    setGameState("MENU");
  };

  // Sync Settings to Engine
  useEffect(() => {
    engine.setBotDifficulty(settings.botDifficulty);
    engine.setBotCount(settings.botCount);
    engine.setControlScheme(settings.controlScheme);
    engine.setVisualEffects(settings.visualEffects);
    engine.setGameMode(settings.gameMode);
  }, [
    settings.botDifficulty,
    settings.botCount,
    settings.controlScheme,
    settings.visualEffects,
    settings.gameMode,
    engine,
  ]);

  // Handle Menu Music and Audio Settings
  useEffect(() => {
    audioService.setSoundVolume(settings.soundVolume);
    audioService.setMusicVolume(settings.musicVolume);

    if (gameState === "MENU" || gameState === "SHOP") {
      if (settings.musicEnabled) {
        audioService.playMenuMusic();
      } else {
        audioService.stopMenuMusic();
      }
    } else {
      audioService.stopMenuMusic();
    }
  }, [
    gameState,
    settings.musicEnabled,
    settings.soundVolume,
    settings.musicVolume,
  ]);

  const activeThemeItem = useMemo(() => {
    return DEFAULT_COLLECTIBLES.find(
      (c) => c.id === playerData.selectedCollectibleId && c.type === "theme",
    );
  }, [playerData.selectedCollectibleId]);

  const themeColor = activeThemeItem ? activeThemeItem.color : "#00f3ff";

  useEffect(() => {
    if (userCountry === "WW") {
      fetch("https://ipapi.co/json/")
        .then((res) => res.json())
        .then((data) => {
          if (data.country_code) {
            setUserCountry(data.country_code);
          }
        })
        .catch(() => {
          console.log(
            "Could not fetch country data, defaulting to International",
          );
        });
    }
  }, [userCountry]);

  // Shop Logic - Skins
  const buySkin = (skin: SnakeSkin): boolean => {
    if (!currentUser) return false;
    if (playerData.gold >= skin.price) {
      const newData = {
        ...playerData,
        gold: playerData.gold - skin.price,
        unlockedSkinIds: [...playerData.unlockedSkinIds, skin.id],
        selectedSkinId: skin.id,
      };
      setPlayerData(newData);
      savePlayerData(currentUser.id, newData);
      return true;
    }
    return false;
  };

  const equipSkin = (skinId: string) => {
    if (!currentUser) return;
    const newData = { ...playerData, selectedSkinId: skinId };
    setPlayerData(newData);
    savePlayerData(currentUser.id, newData);
  };

  const handleUnlockSkin = (skinId: string) => {
    if (!currentUser) return;
    const newData = {
      ...playerData,
      unlockedSkinIds: Array.from(new Set([...playerData.unlockedSkinIds, skinId])),
      selectedSkinId: skinId
    };
    setPlayerData(newData);
    savePlayerData(currentUser.id, newData);
  };

  const handleRecordTransaction = (tx: import('./types').TransactionRecord) => {
    if (!currentUser) return;
    const newData = {
      ...playerData,
      transactions: [tx, ...(playerData.transactions || [])]
    };
    setPlayerData(newData);
    savePlayerData(currentUser.id, newData);
  };

  const handleAddGold = (amount: number) => {
    if (!currentUser) return;
    const newData = {
      ...playerData,
      gold: playerData.gold + amount
    };
    setPlayerData(newData);
    savePlayerData(currentUser.id, newData);
  };

  // Shop Logic - Collectibles
  const buyCollectible = (item: Collectible): boolean => {
    if (!currentUser) return false;
    if (playerData.gold >= item.price) {
      const newData = {
        ...playerData,
        gold: playerData.gold - item.price,
        unlockedCollectibles: [...playerData.unlockedCollectibles, item.id],
      };
      setPlayerData(newData);
      savePlayerData(currentUser.id, newData);
      return true;
    }
    return false;
  };

  const equipCollectible = (itemId: string) => {
    if (!currentUser) return;
    const newId = playerData.selectedCollectibleId === itemId ? null : itemId;
    const newData = { ...playerData, selectedCollectibleId: newId };
    setPlayerData(newData);
    savePlayerData(currentUser.id, newData);
  };

  const [isSpectating, setIsSpectating] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  const handleTutorialComplete = () => {
    setShowTutorial(false);
    const newData = { ...playerData, hasSeenTutorial: true };
    setPlayerData(newData);
    if (currentUser) {
      savePlayerData(currentUser.id, newData);
    }
  };

  const startGame = (name: string) => {
    if (name === "Spectator") {
      setIsSpectating(true);
      engine.setBotDifficulty(settings.botDifficulty);
      engine.setBotCount(settings.botCount);
      // Do not spawn player
      setGameState("PLAYING");
      return;
    }

    setIsSpectating(false);
    if (!playerData.hasSeenTutorial) {
      setShowTutorial(true);
    }
    const activeSkin =
      DEFAULT_SKINS.find((s) => s.id === playerData.selectedSkinId) ||
      DEFAULT_SKINS[0];
    engine.setBotDifficulty(settings.botDifficulty);
    engine.setBotCount(settings.botCount);
    engine.spawnPlayer(
      name,
      activeSkin,
      userCountry,
      playerData.selectedCollectibleId,
    );
    setGameState("PLAYING");
  };

  const handleDeath = (score: number) => {
    if (gameState !== "PLAYING") return;

    setFinalScore(score);
    const mySnake = engine.getMySnake();
    const collected = mySnake ? mySnake.sessionGold : 0;
    setSessionGold(collected);

    const snakes = Array.from(engine.state.snakes.values()) as Snake[];
    snakes.sort((a, b) => b.score - a.score);
    const rank = mySnake ? snakes.findIndex((s) => s.id === mySnake.id) + 1 : 0;
    setFinalRank(rank);
    setFinalLength(mySnake ? Math.floor(mySnake.score) : Math.floor(score));

    if (currentUser) {
      const { newData, levelUpEvents } = processMatchProgression(
        currentUser.id,
        playerData,
        score,
        collected,
      );
      setPlayerData(newData);
      if (levelUpEvents.length > 0) {
        const finalLevel = levelUpEvents[levelUpEvents.length - 1].level;

        // Combine all rewards
        const combinedRewards: any[] = [];
        let totalGold = 0;
        const skins: any[] = [];

        levelUpEvents.forEach((event) => {
          event.rewards.forEach((reward) => {
            if (reward.type === "gold" && reward.amount) {
              totalGold += reward.amount;
            } else if (reward.type === "skin") {
              skins.push(reward);
            }
          });
        });

        if (totalGold > 0) {
          combinedRewards.push({
            type: "gold",
            amount: totalGold,
            name: "Gold",
          });
        }
        combinedRewards.push(...skins);

        setPendingLevelUps([
          {
            level: finalLevel,
            rewards: combinedRewards,
          },
        ]);
      }
    }

    setGameState("GAMEOVER");
  };

  const handleNextLevel = () => {
    setPendingLevelUps((prev) => prev.slice(1));
  };

  const returnToMenu = () => {
    try {
      engine.reset();
      setFinalScore(0);
      setSessionGold(0);
      setPendingLevelUps([]);
      setGameState("MENU");
    } catch (e) {
      console.error("Error resetting game:", e);
      setGameState("MENU");
    }
  };

  const updateSettings = (newSettings: Partial<GameSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const showLevelUp = pendingLevelUps.length > 0;
  const currentLevelEvent = showLevelUp ? pendingLevelUps[0] : null;

  const handleLuckyWheelWin = (prizeType: "gold" | "xp", amount: number) => {
    if (!currentUser) return;

    setPlayerData((prevData) => {
      const newData = { ...prevData };
      if (prizeType === "gold") {
        newData.gold += amount;
      } else if (prizeType === "xp") {
        newData.xp += amount;
        while (newData.xp >= newData.xpToNext) {
          newData.xp -= newData.xpToNext;
          newData.level += 1;
          newData.xpToNext = Math.floor(newData.xpToNext * 1.5);
        }
      }
      savePlayerData(currentUser.id, newData);
      return newData;
    });
  };

  // ADMIN MODE RENDER
  if (showAdmin) {
    return (
      <AdminPanel
        onLogout={handleLogout}
        settings={settings}
        onUpdateSettings={updateSettings}
      />
    );
  }

  return (
    <div className="relative w-full h-screen bg-dark-bg overflow-hidden">
      {gameState === "LOADING" && (
        <LoadingScreen
          onComplete={() => setGameState("MENU")}
          themeColor={themeColor}
        />
      )}

      <GameCanvas
        engine={engine}
        settings={settings}
        onDeath={handleDeath}
        themeColor={themeColor}
        isPaused={isPaused || showTutorial}
        isSpectating={isSpectating}
      />

      {gameState === "MENU" && (
        <MainMenu
          onStart={startGame}
          onOpenShop={() => setGameState("SHOP")}
          settings={settings}
          updateSettings={updateSettings}
          playerData={playerData}
          userCountry={userCountry}
          onSelectCountry={setUserCountry}
          themeColor={themeColor}
          currentUser={currentUser}
          onLogin={handleLogin}
          onLogout={handleLogout}
          onAdminLogin={() => setShowAdmin(true)}
          onOpenLuckyWheel={() => setShowLuckyWheel(true)}
          onUpdatePlayerData={(newData) => {
            setPlayerData(newData);
            if (currentUser) {
              savePlayerData(currentUser.id, newData);
            }
          }}
          tonAddress={tonAddress}
          isTelegram={isTelegram}
          onConnectWallet={async () => {
            const addr = await tonService.connectWallet();
            if (addr) {
              setTonAddress(addr);
              if (currentUser) authService.setTonAddress(currentUser.id, addr);
            }
          }}
          onDisconnectWallet={async () => {
            await tonService.disconnectWallet();
            setTonAddress(null);
            if (currentUser) authService.setTonAddress(currentUser.id, null);
          }}
        />
      )}

      {showLuckyWheel && gameState === "MENU" && (
        <LuckyWheel
          playerData={playerData}
          onClose={() => setShowLuckyWheel(false)}
          onWin={handleLuckyWheelWin}
          themeColor={themeColor}
        />
      )}

      {gameState === "SHOP" && (
        <Shop
          gold={playerData.gold}
          unlockedSkins={playerData.unlockedSkinIds}
          selectedSkinId={playerData.selectedSkinId}
          unlockedCollectibles={playerData.unlockedCollectibles}
          selectedCollectibleId={playerData.selectedCollectibleId}
          themeColor={themeColor}
          onBuySkin={buySkin}
          onEquipSkin={equipSkin}
          onUnlockSkin={handleUnlockSkin}
          onBuyCollectible={buyCollectible}
          onEquipCollectible={equipCollectible}
          onRecordTransaction={handleRecordTransaction}
          onAddGold={handleAddGold}
          onClose={() => setGameState("MENU")}
          tonAddress={tonAddress}
        />
      )}

      {gameState === "PLAYING" && (
        <HUD
          engine={engine}
          playerData={playerData}
          themeColor={themeColor}
          onReturnToMenu={() => setIsPaused(true)}
          isSpectating={isSpectating}
        />
      )}

      {showTutorial && gameState === "PLAYING" && (
        <TutorialOverlay
          onComplete={handleTutorialComplete}
          themeColor={themeColor}
        />
      )}

      {isPaused && gameState === "PLAYING" && !showTutorial && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div
            className="glass-panel p-8 rounded-3xl text-center transform transition-all scale-100 border-2 max-w-sm w-full"
            style={{
              borderColor: `${themeColor}60`,
              boxShadow: `0 0 30px ${themeColor}30`,
            }}
          >
            <h2 className="text-3xl font-black text-white mb-4">PAUSED</h2>
            <p className="text-gray-300 mb-8 text-sm">
              {isSpectating
                ? "Are you sure you want to return to the main menu?"
                : "Are you sure you want to return to the main menu? Your viper will die."}
            </p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  audioService.playClick();
                  setIsPaused(false);
                }}
                className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-full font-bold text-white transition-colors"
              >
                RESUME GAME
              </button>
              <button
                onClick={() => {
                  audioService.playClick();
                  setIsPaused(false);
                  const mySnake = engine.getMySnake();
                  if (mySnake && !isSpectating) {
                    engine.killSnake(mySnake);
                  } else {
                    returnToMenu();
                  }
                }}
                className="w-full py-3 bg-red-500/20 hover:bg-red-500/40 text-red-500 rounded-full font-bold transition-colors border border-red-500/50"
              >
                QUIT TO MENU
              </button>
            </div>
          </div>
        </div>
      )}

      {showLevelUp && currentLevelEvent && (
        <LevelUpModal
          level={currentLevelEvent.level}
          rewards={currentLevelEvent.rewards}
          isLast={pendingLevelUps.length === 1}
          onNext={handleNextLevel}
        />
      )}

      {gameState === "GAMEOVER" && !showLevelUp && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-500">
          <div
            className="glass-panel p-10 rounded-3xl text-center transform transition-all scale-100 border-2"
            style={{
              borderColor: `${themeColor}60`,
              boxShadow: `0 0 30px ${themeColor}30`,
            }}
          >
            <h2 className="text-5xl font-black text-red-500 mb-2 drop-shadow-[0_0_15px_rgba(255,0,0,0.6)]">
              WASTED
            </h2>

            <div className="bg-white/5 rounded-xl p-6 mb-8 border border-white/10">
              <p className="text-sm text-gray-400 uppercase tracking-widest mb-1">
                Final Score
              </p>
              <p className="text-6xl font-mono font-bold text-white text-shadow-neon">
                {finalScore}
              </p>

              <div className="flex justify-center gap-6 mt-4">
                <div className="flex flex-col items-center">
                  <span className="text-gray-400 text-xs uppercase tracking-wider">
                    Your Length
                  </span>
                  <span className="text-lg font-bold text-white">
                    {finalLength.toLocaleString()}"
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-gray-400 text-xs uppercase tracking-wider">
                    You ranked
                  </span>
                  <span className="text-lg font-bold text-white">
                    #{finalRank}
                  </span>
                </div>
              </div>

              <div className="flex justify-center gap-4 mt-4 pt-4 border-t border-white/10">
                <div className="flex items-center gap-2 text-neon-yellow">
                  <span>+{sessionGold}</span>
                  <span className="text-xl">💰</span>
                  <span className="text-[10px] text-gray-500">(Collected)</span>
                </div>
                <div
                  className="flex items-center gap-2"
                  style={{ color: themeColor }}
                >
                  <span>+{Math.floor(finalScore * 2)}</span>
                  <span className="text-xs font-bold">XP</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  audioService.playClick();
                  engine.reset();
                  startGame(isSpectating ? "Spectator" : settings.playerName);
                }}
                className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full font-bold text-xl text-black shadow-lg hover:scale-105 transition-transform"
              >
                {isSpectating ? "SPECTATE AGAIN" : "PLAY AGAIN"}
              </button>
              <button
                onClick={() => {
                  audioService.playClick();
                  returnToMenu();
                }}
                className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-full font-bold text-white transition-colors"
              >
                MAIN MENU
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
