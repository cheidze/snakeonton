
import React, { useState, useEffect, useMemo } from 'react';
import GameCanvas from './components/GameCanvas';
import MainMenu from './components/MainMenu';
import HUD from './components/HUD';
import Shop from './components/Shop';
import LevelUpModal from './components/LevelUpModal';
import AdminPanel from './components/AdminPanel';
import { GameEngine } from './services/gameEngine';
import { GameSettings, SnakeSkin, LevelUpEvent, Collectible, UserProfile, PlayerData } from './types';
import { audioService } from './services/audioService';
import { authService } from './services/authService';
import { loadPlayerData, savePlayerData, processMatchProgression } from './services/playerService';
import { DEFAULT_SKINS, DEFAULT_COLLECTIBLES, DEFAULT_GOLD, BOT_COUNT } from './services/constants';
import { telegramService } from './services/telegramService';
import { tonService } from './services/tonService';

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
});

function App() {
  const engine = useMemo(() => new GameEngine(), []);

  const [gameState, setGameState] = useState<'MENU' | 'SHOP' | 'PLAYING' | 'GAMEOVER'>('MENU');
  const [showAdmin, setShowAdmin] = useState(false);

  const [finalScore, setFinalScore] = useState(0);
  const [sessionGold, setSessionGold] = useState(0);
  const [userCountry, setUserCountry] = useState<string>('WW');

  // Auth & Player Data State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [playerData, setPlayerData] = useState<PlayerData>(getDefaultData());
  const [tonAddress, setTonAddress] = useState<string | null>(null);
  const [isTelegram] = useState(() => telegramService.isTelegramContext());

  const [pendingLevelUps, setPendingLevelUps] = useState<LevelUpEvent[]>([]);

  const [settings, setSettings] = useState<GameSettings>({
    soundEnabled: true,
    musicEnabled: true,
    quality: 'high',
    sensitivity: 1.0,
    playerName: 'Guest',
    botDifficulty: 'medium',
    botCount: BOT_COUNT, // Initialize with default constant
  });

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
      setSettings(prev => ({ ...prev, playerName: user.username }));
    }
  }, [isTelegram]);

  // Handle Login
  const handleLogin = (user: UserProfile) => {
    setCurrentUser(user);
    setPlayerData(loadPlayerData(user.id));
    setSettings(prev => ({ ...prev, playerName: user.username }));

    // Track login with analytics
    telegramService.trackEvent('user_login', {
      user_id: user.id,
      username: user.username
    });
    telegramService.setUserProperty('username', user.username);
  };

  // Handle Logout
  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setPlayerData(getDefaultData()); // Reset to default
    setShowAdmin(false);
    setGameState('MENU');
  };

  // Sync Settings to Engine
  useEffect(() => {
    engine.setBotDifficulty(settings.botDifficulty);
    engine.setBotCount(settings.botCount);
  }, [settings.botDifficulty, settings.botCount, engine]);

  // Handle Menu Music
  useEffect(() => {
    if (gameState === 'MENU' || gameState === 'SHOP') {
      if (settings.musicEnabled) {
        audioService.playMenuMusic();
      } else {
        audioService.stopMenuMusic();
      }
    } else {
      audioService.stopMenuMusic();
    }
  }, [gameState, settings.musicEnabled]);

  const activeThemeItem = useMemo(() => {
    return DEFAULT_COLLECTIBLES.find(
      c => c.id === playerData.selectedCollectibleId && c.type === 'theme'
    );
  }, [playerData.selectedCollectibleId]);

  const themeColor = activeThemeItem ? activeThemeItem.color : '#00f3ff';

  useEffect(() => {
    if (userCountry === 'WW') {
      fetch('https://ipapi.co/json/')
        .then(res => res.json())
        .then(data => {
          if (data.country_code) {
            setUserCountry(data.country_code);
          }
        })
        .catch(() => {
          console.log('Could not fetch country data, defaulting to International');
        });
    }
  }, [userCountry]);

  // Shop Logic - Skins
  const buySkin = (skin: SnakeSkin): boolean => {
    if (!currentUser) return false;
    const currentData = loadPlayerData(currentUser.id);
    if (currentData.gold >= skin.price) {
      const newData = {
        ...currentData,
        gold: currentData.gold - skin.price,
        unlockedSkinIds: [...currentData.unlockedSkinIds, skin.id],
        selectedSkinId: skin.id
      };
      setPlayerData(newData);
      savePlayerData(currentUser.id, newData);
      return true;
    }
    return false;
  };

  const equipSkin = (skinId: string) => {
    if (!currentUser) return;
    const currentData = loadPlayerData(currentUser.id);
    const newData = { ...currentData, selectedSkinId: skinId };
    setPlayerData(newData);
    savePlayerData(currentUser.id, newData);
  };

  // Directly unlocks and equips a skin (e.g. from TON purchase)
  const handleUnlockSkin = (skinId: string) => {
    if (!currentUser) return;
    const currentData = loadPlayerData(currentUser.id);
    const newData = {
      ...currentData,
      unlockedSkinIds: Array.from(new Set([...currentData.unlockedSkinIds, skinId])),
      selectedSkinId: skinId
    };
    setPlayerData(newData);
    savePlayerData(currentUser.id, newData);
  };

  const handleRecordTransaction = (tx: import('./types').TransactionRecord) => {
    if (!currentUser) return;
    const currentData = loadPlayerData(currentUser.id);
    const newData = {
      ...currentData,
      transactions: [tx, ...(currentData.transactions || [])]
    };
    setPlayerData(newData);
    savePlayerData(currentUser.id, newData);
  };

  // Shop Logic - Collectibles
  const buyCollectible = (item: Collectible): boolean => {
    if (!currentUser) return false;
    const currentData = loadPlayerData(currentUser.id);
    if (currentData.gold >= item.price) {
      const newData = {
        ...currentData,
        gold: currentData.gold - item.price,
        unlockedCollectibles: [...currentData.unlockedCollectibles, item.id],
      };
      setPlayerData(newData);
      savePlayerData(currentUser.id, newData);
      return true;
    }
    return false;
  };

  const equipCollectible = (itemId: string) => {
    if (!currentUser) return;
    const currentData = loadPlayerData(currentUser.id);
    const newId = currentData.selectedCollectibleId === itemId ? null : itemId;
    const newData = { ...currentData, selectedCollectibleId: newId };
    setPlayerData(newData);
    savePlayerData(currentUser.id, newData);
  };

  const startGame = (name: string) => {
    const activeSkin = DEFAULT_SKINS.find(s => s.id === playerData.selectedSkinId) || DEFAULT_SKINS[0];
    engine.setBotDifficulty(settings.botDifficulty);
    engine.setBotCount(settings.botCount);
    engine.spawnPlayer(name, activeSkin, userCountry, playerData.selectedCollectibleId);
    setGameState('PLAYING');

    // Track game start
    telegramService.trackEvent('game_start', {
      player_name: name,
      skin_id: playerData.selectedSkinId,
      country: userCountry
    });
  };

  const handleDeath = (score: number) => {
    setFinalScore(score);
    const mySnake = engine.getMySnake();
    const collected = mySnake ? mySnake.sessionGold : 0;
    setSessionGold(collected);

    if (currentUser) {
      const { newData, levelUpEvents } = processMatchProgression(currentUser.id, playerData, score, collected);
      setPlayerData(newData);
      if (levelUpEvents.length > 0) {
        setPendingLevelUps(levelUpEvents);
      }

      // Track game end
      telegramService.trackEvent('game_end', {
        score: score,
        gold_collected: collected,
        xp_gained: Math.floor(score * 2),
        session_duration_ms: Date.now() // Could track actual duration
      });
    }

    setGameState('GAMEOVER');
  };

  const handleNextLevel = () => {
    setPendingLevelUps(prev => prev.slice(1));
  };

  const returnToMenu = () => {
    try {
      engine.reset();
      setFinalScore(0);
      setSessionGold(0);
      setPendingLevelUps([]);
      setGameState('MENU');
    } catch (e) {
      console.error("Error resetting game:", e);
      setGameState('MENU');
    }
  };

  const updateSettings = (newSettings: Partial<GameSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const showLevelUp = pendingLevelUps.length > 0;
  const currentLevelEvent = showLevelUp ? pendingLevelUps[0] : null;

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

      <GameCanvas
        engine={engine}
        settings={settings}
        onDeath={handleDeath}
        themeColor={themeColor}
      />

      {gameState === 'MENU' && (
        <MainMenu
          onStart={startGame}
          onOpenShop={() => setGameState('SHOP')}
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

      {gameState === 'SHOP' && (
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
          onClose={() => setGameState('MENU')}
          tonAddress={tonAddress}
        />
      )}

      {gameState === 'PLAYING' && (
        <HUD engine={engine} playerData={playerData} themeColor={themeColor} />
      )}

      {showLevelUp && currentLevelEvent && (
        <LevelUpModal
          level={currentLevelEvent.level}
          rewards={currentLevelEvent.rewards}
          isLast={pendingLevelUps.length === 1}
          onNext={handleNextLevel}
        />
      )}

      {gameState === 'GAMEOVER' && !showLevelUp && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-500">
          <div
            className="glass-panel p-10 rounded-3xl text-center transform transition-all scale-100 border-2"
            style={{ borderColor: `${themeColor}60`, boxShadow: `0 0 30px ${themeColor}30` }}
          >
            <h2 className="text-5xl font-black text-red-500 mb-2 drop-shadow-[0_0_15px_rgba(255,0,0,0.6)]">WASTED</h2>

            <div className="bg-white/5 rounded-xl p-6 mb-8 border border-white/10">
              <p className="text-sm text-gray-400 uppercase tracking-widest mb-1">Final Score</p>
              <p className="text-6xl font-mono font-bold text-white text-shadow-neon">{finalScore}</p>

              <div className="flex justify-center gap-4 mt-4">
                <div className="flex items-center gap-2 text-neon-yellow">
                  <span>+{sessionGold}</span>
                  <span className="text-xl">💰</span>
                  <span className="text-[10px] text-gray-500">(Collected)</span>
                </div>
                <div className="flex items-center gap-2" style={{ color: themeColor }}>
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
                  startGame(settings.playerName);
                }}
                className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full font-bold text-xl text-black shadow-lg hover:scale-105 transition-transform"
              >
                PLAY AGAIN
              </button>
              <button
                onClick={() => { audioService.playClick(); returnToMenu(); }}
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
