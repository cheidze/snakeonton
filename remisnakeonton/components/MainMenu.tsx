
import React, { useState, useEffect } from 'react';
import { GameSettings, PlayerData, BotDifficulty, UserProfile } from '../types';
import { audioService } from '../services/audioService';
import { authService } from '../services/authService';
import { PLAYER_COUNTRIES } from '../services/constants';
import { tonService } from '../services/tonService';
import XPBar from './XPBar';
import CountrySelector from './CountrySelector';
import Transactions from './Transactions';

interface Props {
  onStart: (name: string) => void;
  onOpenShop: () => void;
  settings: GameSettings;
  updateSettings: (s: Partial<GameSettings>) => void;
  playerData: PlayerData;
  userCountry: string;
  onSelectCountry: (flag: string) => void;
  themeColor?: string;
  currentUser: UserProfile | null;
  onLogin: (user: UserProfile) => void;
  onLogout: () => void;
  onAdminLogin: () => void; // New callback
  tonAddress?: string | null;
  onConnectWallet?: () => void;
  onDisconnectWallet?: () => void;
  isTelegram?: boolean; // New prop to detect Telegram context
}

const MainMenu: React.FC<Props> = ({
  onStart,
  onOpenShop,
  settings,
  updateSettings,
  playerData,
  userCountry,
  onSelectCountry,
  themeColor = '#00f3ff',
  currentUser,
  onLogin,
  onLogout,
  onAdminLogin,
  tonAddress = null,
  onConnectWallet,
  onDisconnectWallet,
  isTelegram = false
}) => {
  // View state: 'auth' | 'profile-completion' | 'main' | 'settings' | 'user-profile' | 'transactions'
  const [view, setView] = useState<'auth' | 'profile-completion' | 'main' | 'settings' | 'user-profile' | 'transactions'>('auth');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Auth inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  // Date of Birth state
  const [dobDay, setDobDay] = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobYear, setDobYear] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>('');

  const [error, setError] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const [showCountrySelector, setShowCountrySelector] = useState(false);

  // Strict check for profile completeness
  useEffect(() => {
    if (currentUser) {
      const isProfileComplete =
        currentUser.username &&
        currentUser.username.trim() !== "" &&
        currentUser.dob &&
        currentUser.dob.day &&
        currentUser.dob.year &&
        currentUser.gender;

      if (!isProfileComplete) {
        setView('profile-completion');
      } else {
        setView('main');
      }
    } else {
      setView('auth');
    }
  }, [currentUser]);

  const handleStart = () => {
    audioService.playClick();
    updateSettings({ playerName: currentUser?.username || 'Guest' });
    onStart(currentUser?.username || 'Guest');
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Check for Admin Login Trigger
    if (authService.isAdmin(email, password)) {
      onAdminLogin();
      return;
    }

    if (authMode === 'login') {
      if (!password) { setError("Password required"); return; }
      const res = await authService.login(email, password);
      if (res.success && res.user) {
        onLogin(res.user);
      } else {
        setError(res.message);
      }
    } else {
      // Register validation
      if (!username) { setError("Username required"); return; }
      if (!password) { setError("Password required"); return; }
      if (!dobDay || !dobMonth || !dobYear) { setError("Date of birth required"); return; }
      if (!gender) { setError("Gender required"); return; }

      const res = await authService.register(email, username, password, {
        day: dobDay,
        month: dobMonth,
        year: dobYear
      }, gender as any);

      if (res.success && res.user) {
        onLogin(res.user);
      } else {
        setError(res.message);
      }
    }
  };

  const handleGoogleLogin = async () => {
    audioService.playClick();
    setIsGoogleLoading(true);
    try {
      const res = await authService.loginWithGoogle();
      if (res.success && res.user) {
        onLogin(res.user);
      } else {
        if (res.message !== "Login cancelled") {
          setError(res.message);
        }
      }
    } catch (e) {
      setError("Connection Error");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleProfileCompletion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!username.trim()) { setError("Username required"); return; }
    if (!dobDay || !dobMonth || !dobYear) { setError("Date of birth required"); return; }
    if (!gender) { setError("Gender required"); return; }

    const updatedUser = authService.updateUser(currentUser.id, {
      username,
      dob: { day: dobDay, month: dobMonth, year: dobYear },
      gender: gender as any
    });

    if (updatedUser) {
      onLogin(updatedUser); // This updates state and triggers useEffect -> switches to 'main'
    } else {
      setError("Username is already taken.");
    }
  };

  const getFlagContent = () => {
    const code = userCountry.toLowerCase();
    if (code === 'ww') return <span className="text-2xl">🌐</span>;
    return (
      <img
        src={`https://flagcdn.com/w80/${code}.png`}
        alt={userCountry}
        className="w-8 h-auto object-cover rounded shadow-sm"
      />
    );
  };

  // Helper to render Avatar or Fallback
  const renderAvatar = (sizeClass: string = "w-20 h-20", textClass: string = "text-3xl") => {
    if (currentUser?.picture) {
      return (
        <img
          src={currentUser.picture}
          alt="Profile"
          className={`${sizeClass} rounded-full border-2 object-cover bg-black`}
          style={{ borderColor: themeColor }}
        />
      );
    }
    return (
      <div className={`${sizeClass} rounded-full bg-gradient-to-tr from-gray-800 to-gray-700 border-2 flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.5)]`} style={{ borderColor: themeColor }}>
        <span className={textClass}>👨‍🚀</span>
      </div>
    );
  };

  const cyberBtnStyle = {
    clipPath: 'polygon(10% 0, 100% 0, 100% 70%, 90% 100%, 0 100%, 0 30%)'
  };

  // Styles
  const inputStyle = "w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-neon-blue focus:outline-none mb-3";
  const labelStyle = "block text-xs text-gray-400 uppercase font-bold mb-1 ml-1";

  return (
    <div className="absolute inset-0 flex items-center justify-center z-50 bg-dark-bg/90 backdrop-blur-sm">

      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full mix-blend-screen filter blur-[100px] animate-pulse" style={{ backgroundColor: themeColor }}></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500 rounded-full mix-blend-screen filter blur-[100px] animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center w-full max-w-md p-8">

        <div className="mb-6 text-center group cursor-default">
          <h1
            className="text-6xl md:text-7xl font-black italic text-transparent bg-clip-text drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] tracking-tighter transform -skew-x-6 transition-transform duration-500 group-hover:skew-x-0 group-hover:scale-105"
            style={{ backgroundImage: `linear-gradient(to right, ${themeColor}, #ffffff, #bd00ff)` }}
          >
            BLUE<br />ORIGIN
          </h1>
          <p className="tracking-widest font-mono mt-2 text-shadow-neon animate-pulse" style={{ color: themeColor }}>SPACE ARENA</p>
        </div>

        {/* AUTH VIEW */}
        {view === 'auth' && (
          <div className="w-full glass-panel p-8 rounded-2xl animate-in zoom-in-95 duration-300 max-h-[80vh] overflow-y-auto custom-scrollbar" style={{ borderColor: `${themeColor}40` }}>

            {isTelegram ? (
              // Telegram Mini App Context - Simplified Login
              <div className="text-center py-8">
                <h2 className="text-2xl font-black text-white mb-4 uppercase tracking-widest">Telegram Login</h2>
                <p className="text-gray-400 text-sm mb-6">Authenticating via Telegram securely...</p>

                {/* In a real app, App.tsx handles the actual login auto-magically, 
                         but we show this loading/processing state if it takes a second */}
                <div className="w-12 h-12 mx-auto border-4 border-t-blue-500 border-white/20 rounded-full animate-spin"></div>

                {error && <p className="text-red-500 text-sm mt-6 font-bold bg-red-500/10 py-2 rounded">{error}</p>}
              </div>
            ) : (
              // Normal Browser Context - Email/Google Forms
              <>
                <h2 className="text-xl font-bold text-white mb-6 text-center uppercase tracking-widest">
                  {authMode === 'login' ? 'Login' : 'New Account'}
                </h2>

                <form onSubmit={handleAuthSubmit}>
                  <div>
                    <label className={labelStyle}>Email or Username</label>
                    <input
                      type="text"
                      placeholder="pilot@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className={inputStyle}
                      required
                    />
                  </div>

                  {authMode === 'register' && (
                    <div>
                      <label className={labelStyle}>Callsign (Username)</label>
                      <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        className={inputStyle}
                        required
                        maxLength={12}
                      />
                    </div>
                  )}

                  <div>
                    <label className={labelStyle}>Password</label>
                    <input
                      type="password"
                      placeholder="******"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className={inputStyle}
                      required
                    />
                  </div>

                  {authMode === 'register' && (
                    <>
                      <div className="mb-3">
                        <label className={labelStyle}>Date of Birth</label>
                        <div className="flex gap-2">
                          <input
                            type="number" placeholder="DD" min="1" max="31"
                            value={dobDay} onChange={e => setDobDay(e.target.value)}
                            className={`${inputStyle} mb-0`} required
                          />
                          <select
                            value={dobMonth} onChange={e => setDobMonth(e.target.value)}
                            className={`${inputStyle} mb-0`} required
                          >
                            <option value="" disabled>MM</option>
                            {Array.from({ length: 12 }, (_, i) => (
                              <option key={i} value={i + 1}>{new Date(0, i).toLocaleString('default', { month: 'short' })}</option>
                            ))}
                          </select>
                          <input
                            type="number" placeholder="YYYY" min="1900" max={new Date().getFullYear()}
                            value={dobYear} onChange={e => setDobYear(e.target.value)}
                            className={`${inputStyle} mb-0`} required
                          />
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className={labelStyle}>Gender</label>
                        <div className="flex gap-2">
                          {['male', 'female', 'other'].map(g => (
                            <button
                              key={g}
                              type="button"
                              onClick={() => setGender(g as any)}
                              className={`flex-1 py-2 rounded border ${gender === g
                                ? `bg-white/20 border-${themeColor} text-white`
                                : 'bg-black/50 border-white/10 text-gray-500'
                                } uppercase text-xs font-bold transition-all`}
                              style={{ borderColor: gender === g ? themeColor : '' }}
                            >
                              {g}
                            </button>
                          ))}
                        </div>
                      </div>
                      {/* Terms Simulation */}
                      <div className="text-[10px] text-gray-500 mb-4 text-center">
                        By registering, you agree to our Terms of Service.
                      </div>
                    </>
                  )}

                  {error && <p className="text-red-500 text-sm mb-3 font-bold text-center bg-red-500/10 py-2 rounded">{error}</p>}

                  <button
                    type="submit"
                    className="w-full py-3 rounded-lg font-bold text-black uppercase tracking-widest transition-transform hover:scale-[1.02] mb-4 shadow-lg mt-2"
                    style={{ background: `linear-gradient(to right, ${themeColor}, #bd00ff)` }}
                    onClick={() => audioService.playClick()}
                  >
                    {authMode === 'login' ? 'ENTER' : 'REGISTER'}
                  </button>
                </form>

                <div className="relative flex py-2 items-center mb-4">
                  <div className="flex-grow border-t border-white/10"></div>
                  <span className="flex-shrink-0 mx-4 text-gray-500 text-xs uppercase">Or</span>
                  <div className="flex-grow border-t border-white/10"></div>
                </div>

                {/* CYBERPUNK GOOGLE BUTTON - MONOCHROME & GLOWING */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isGoogleLoading}
                  className="relative group w-full py-3 bg-[#0a0a0a] border border-neon-blue/40 rounded-lg overflow-hidden transition-all hover:border-neon-blue hover:shadow-[0_0_20px_rgba(0,243,255,0.6)] flex items-center justify-center gap-3 mb-4"
                >
                  <div className="absolute inset-0 bg-neon-blue/5 group-hover:bg-neon-blue/10 transition-colors duration-300"></div>

                  {isGoogleLoading ? (
                    <span className="animate-pulse text-neon-blue font-bold relative z-10 uppercase text-xs tracking-widest">Connecting...</span>
                  ) : (
                    <>
                      {/* Monochrome Google 'G' Icon (White fill) */}
                      <div className="w-5 h-5 flex items-center justify-center shrink-0 relative z-10">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="text-white w-full h-full">
                          <path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z" />
                        </svg>
                      </div>
                      <span className="text-white text-sm font-bold tracking-wide relative z-10 group-hover:text-neon-blue transition-colors uppercase">Sign in with Google</span>
                    </>
                  )}
                </button>

                <div className="text-center">
                  <button
                    onClick={() => {
                      audioService.playClick();
                      setAuthMode(authMode === 'login' ? 'register' : 'login');
                      setError('');
                    }}
                    className="text-sm text-gray-400 hover:text-white underline"
                  >
                    {authMode === 'login' ? "Need an account? Register" : "Have an account? Login"}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* PROFILE COMPLETION VIEW (AFTER GOOGLE LOGIN) */}
        {view === 'profile-completion' && (
          <div className="w-full glass-panel p-8 rounded-2xl animate-in zoom-in-95 duration-300" style={{ borderColor: `${themeColor}40` }}>
            <h2 className="text-xl font-bold text-white mb-2 text-center uppercase tracking-widest">Complete Profile</h2>
            <p className="text-xs text-center text-gray-400 mb-6">Google provided your email, but we need your pilot details to continue.</p>

            <form onSubmit={handleProfileCompletion}>
              <div>
                <label className={labelStyle}>Choose Username</label>
                <input
                  type="text"
                  placeholder="Callsign"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className={inputStyle}
                  required
                  maxLength={12}
                />
              </div>

              <div className="mb-3">
                <label className={labelStyle}>Date of Birth</label>
                <div className="flex gap-2">
                  <input
                    type="number" placeholder="DD" min="1" max="31"
                    value={dobDay} onChange={e => setDobDay(e.target.value)}
                    className={`${inputStyle} mb-0`} required
                  />
                  <select
                    value={dobMonth} onChange={e => setDobMonth(e.target.value)}
                    className={`${inputStyle} mb-0`} required
                  >
                    <option value="" disabled>MM</option>
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i} value={i + 1}>{new Date(0, i).toLocaleString('default', { month: 'short' })}</option>
                    ))}
                  </select>
                  <input
                    type="number" placeholder="YYYY" min="1900" max={new Date().getFullYear()}
                    value={dobYear} onChange={e => setDobYear(e.target.value)}
                    className={`${inputStyle} mb-0`} required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className={labelStyle}>Gender</label>
                <div className="flex gap-2">
                  {['male', 'female', 'other'].map(g => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(g as any)}
                      className={`flex-1 py-2 rounded border ${gender === g
                        ? `bg-white/20 border-${themeColor} text-white`
                        : 'bg-black/50 border-white/10 text-gray-500'
                        } uppercase text-xs font-bold transition-all`}
                      style={{ borderColor: gender === g ? themeColor : '' }}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {error && <p className="text-red-500 text-sm mb-3 font-bold text-center">{error}</p>}

              <button
                type="submit"
                className="w-full py-3 rounded-lg font-bold text-black uppercase tracking-widest shadow-lg"
                style={{ background: `linear-gradient(to right, ${themeColor}, #bd00ff)` }}
                onClick={() => audioService.playClick()}
              >
                FINISH SETUP
              </button>
            </form>
          </div>
        )}

        {/* MAIN MENU VIEW */}
        {view === 'main' && currentUser && (
          <div className="flex flex-col items-center w-full animate-in fade-in slide-in-from-bottom-8 duration-500">

            {/* Player Stats Card */}
            <div
              className="w-full mb-6 bg-black/40 p-4 rounded-2xl border shadow-lg transition-colors"
              style={{ borderColor: `${themeColor}30` }}
            >
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-3">
                  {/* AVATAR DISPLAY IN HEADER */}
                  <div className="w-10 h-10 shrink-0">
                    {renderAvatar("w-10 h-10", "text-lg")}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-400 uppercase">Pilot</span>
                    <span className="font-bold text-white text-lg">{currentUser.username}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">💰</span>
                  <span className="font-mono font-bold text-neon-yellow text-xl text-shadow-neon">{playerData.gold}</span>
                </div>
              </div>
              <XPBar level={playerData.level} xp={playerData.xp} xpToNext={playerData.xpToNext} />
            </div>

            {/* WALLET INTEGRATION HEADER */}
            <div className="w-full flex items-center justify-between gap-2 mb-4">
              <div className="flex-1 bg-black/60 border border-white/10 rounded-lg p-3 flex items-center justify-between">
                {tonAddress ? (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-blue-400 text-xl">💎</span>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">TON Wallet</span>
                        <span className="text-sm font-mono font-bold text-white">{tonService.formatAddress(tonAddress)}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => { audioService.playClick(); onDisconnectWallet?.(); }}
                      className="w-8 h-8 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors border border-red-500/30"
                      title="Disconnect Wallet"
                    >
                      ✕
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => { audioService.playClick(); onConnectWallet?.(); }}
                    className="w-full flex items-center justify-center gap-2 text-blue-400 hover:text-white transition-colors py-1 group"
                  >
                    <span className="text-xl group-hover:scale-110 transition-transform">🔗</span>
                    <span className="font-bold text-sm tracking-widest uppercase">Connect TON Wallet</span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 w-72 mb-4 transform transition-all z-20">
              <button
                onClick={() => setShowCountrySelector(true)}
                className="w-16 h-14 flex items-center justify-center bg-black/60 border-b-2 transition-all rounded-lg overflow-hidden hover:bg-white/10"
                style={{ borderColor: themeColor }}
                title="Change Region"
              >
                {getFlagContent()}
              </button>

              {/* View Profile Button */}
              <button
                onClick={() => { audioService.playClick(); setView('user-profile'); }}
                className="flex-1 h-14 bg-black/60 border-b-2 border-white/20 hover:border-white/50 text-white hover:bg-white/5 rounded-lg font-bold text-sm uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
              >
                <span>👤</span> PROFILE
              </button>
            </div>

            {/* PLAY BUTTON */}
            <button
              onClick={handleStart}
              className="w-72 h-16 mb-4 relative group focus:outline-none"
            >
              <div className="absolute inset-0 rounded-xl blur opacity-60 group-hover:opacity-100 transition-opacity duration-300 animate-pulse" style={{ background: `linear-gradient(to right, ${themeColor}, #bd00ff)` }}></div>
              <div
                className="relative h-full bg-black/80 border border-white/20 flex items-center justify-center gap-3 transition-all duration-200 group-hover:scale-[1.02] group-active:scale-95"
                style={cyberBtnStyle}
              >
                <span className="text-2xl font-black italic text-white tracking-widest drop-shadow-md transition-colors" style={{ textShadow: `0 0 10px ${themeColor}` }}>PLAY ONLINE</span>
              </div>
            </button>

            {/* TRANSACTIONS BUTTON */}
            <button
              onClick={() => { audioService.playClick(); setView('transactions'); }}
              className="w-64 h-12 mb-3 relative group focus:outline-none"
            >
              <div
                className="relative h-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300"
                style={{ ...cyberBtnStyle, borderColor: `rgba(255,255,255,0.1)` }}
              >
                <div className="flex items-center justify-center h-full gap-2">
                  <span className="text-blue-400">📜</span>
                  <span className="font-bold text-sm uppercase tracking-wider text-gray-300 group-hover:tracking-[0.2em] transition-all duration-300 drop-shadow-md group-hover:text-white">TRANSACTIONS</span>
                </div>
              </div>
            </button>

            {/* SHOP BUTTON */}
            <button
              onClick={() => { audioService.playClick(); onOpenShop(); }}
              className="w-64 h-14 mb-3 relative group focus:outline-none"
            >
              <div
                className="relative h-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300"
                style={{ ...cyberBtnStyle, borderColor: `rgba(255,255,255,0.1)` }}
              >
                <div
                  className="absolute inset-0 transition-opacity opacity-0 group-hover:opacity-100"
                  style={{ border: `1px solid ${themeColor}` }}
                />
                <div className="flex items-center justify-center h-full">
                  <span className="font-bold text-xl uppercase tracking-wider text-white group-hover:tracking-[0.2em] transition-all duration-300 drop-shadow-md group-hover:text-white">SHOP</span>
                </div>
              </div>
            </button>

            {/* SETTINGS BUTTON */}
            <button
              onClick={() => { audioService.playClick(); setView('settings'); }}
              className="w-64 h-14 relative group focus:outline-none"
            >
              <div
                className="relative h-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300"
                style={cyberBtnStyle}
              >
                <div className="flex items-center justify-center h-full">
                  <span className="font-bold text-xl uppercase tracking-wider text-white group-hover:tracking-[0.2em] transition-all duration-300 drop-shadow-md">SETTINGS</span>
                </div>
              </div>
            </button>

            {/* Logout Link */}
            <button
              onClick={onLogout}
              className="mt-2 text-red-400/50 hover:text-red-400 text-xs font-bold uppercase tracking-widest hover:underline"
            >
              Log Out
            </button>
          </div>
        )}

        {/* USER PROFILE VIEW */}
        {view === 'user-profile' && currentUser && (
          <div className="w-full glass-panel p-6 rounded-2xl animate-in fade-in zoom-in-95 duration-300 border shadow-[0_0_30px_rgba(0,0,0,0.5)]" style={{ borderColor: `${themeColor}40` }}>
            <div className="text-center mb-6">
              <div className="mx-auto mb-3">
                {renderAvatar("w-24 h-24", "text-4xl")}
              </div>
              <h2 className="text-2xl font-bold text-white uppercase tracking-wider">{currentUser.username}</h2>
              <p className="text-xs text-neon-blue uppercase font-bold tracking-widest">Level {playerData.level} Pilot</p>
            </div>

            <div className="space-y-4 mb-6 bg-black/30 p-4 rounded-xl border border-white/5">
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-gray-500 text-xs uppercase font-bold">Email</span>
                <span className="text-gray-300 text-sm">{currentUser.email}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-gray-500 text-xs uppercase font-bold">Location</span>
                <span className="text-gray-300 text-sm">
                  {currentUser.city && currentUser.country ? `${currentUser.city}, ${currentUser.country}` : 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-gray-500 text-xs uppercase font-bold">Date of Birth</span>
                <span className="text-gray-300 text-sm">
                  {currentUser.dob ? `${currentUser.dob.day}/${currentUser.dob.month}/${currentUser.dob.year}` : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-gray-500 text-xs uppercase font-bold">Gender</span>
                <span className="text-gray-300 text-sm capitalize">{currentUser.gender || 'Unknown'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 text-xs uppercase font-bold">Member Since</span>
                <span className="text-gray-300 text-sm">
                  {new Date(currentUser.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <button
              onClick={() => { audioService.playClick(); setView('main'); }}
              className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg font-bold tracking-widest transition-all hover:text-white hover:border-white"
            >
              BACK
            </button>
          </div>
        )}

        {view === 'settings' && (
          <div className="w-full glass-panel p-6 rounded-2xl animate-in fade-in zoom-in-95 duration-300 border shadow-[0_0_30px_rgba(0,0,0,0.5)]" style={{ borderColor: `${themeColor}40` }}>
            <h2 className="text-2xl font-bold mb-6 text-center text-white tracking-wider border-b border-white/10 pb-4">SETTINGS</h2>

            <div className="space-y-6 mb-8">
              <div className="flex justify-between items-center p-2 hover:bg-white/5 rounded-lg transition-colors">
                <span className="font-bold text-gray-200">Sound Effects</span>
                <button
                  onClick={() => {
                    const newState = !settings.soundEnabled;
                    updateSettings({ soundEnabled: newState });
                    audioService.setEnabled(newState);
                    audioService.playClick();
                  }}
                  className={`w-12 h-6 rounded-full relative transition-all duration-300 shadow-inner ${settings.soundEnabled ? 'bg-green-500' : 'bg-gray-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-300 ${settings.soundEnabled ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              <div className="flex justify-between items-center p-2 hover:bg-white/5 rounded-lg transition-colors">
                <span className="font-bold text-gray-200">Music</span>
                <button
                  onClick={() => {
                    const newState = !settings.musicEnabled;
                    updateSettings({ musicEnabled: newState });
                    audioService.setMusicEnabled(newState);
                    audioService.playClick();
                  }}
                  className={`w-12 h-6 rounded-full relative transition-all duration-300 shadow-inner ${settings.musicEnabled ? 'bg-green-500' : 'bg-gray-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-300 ${settings.musicEnabled ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              <div className="space-y-3 p-2 hover:bg-white/5 rounded-lg transition-colors">
                <div className="flex justify-between text-sm text-gray-400 font-bold uppercase">
                  <span>Graphics Quality</span>
                  <span style={{ color: themeColor }}>{settings.quality}</span>
                </div>
                <div className="relative flex items-center">
                  <input
                    type="range" min="0" max="2" step="1"
                    value={settings.quality === 'low' ? 0 : settings.quality === 'medium' ? 1 : 2}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      updateSettings({ quality: val === 0 ? 'low' : val === 1 ? 'medium' : 'high' });
                    }}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer hover:bg-gray-600 transition-colors"
                    style={{ accentColor: themeColor }}
                  />
                </div>
              </div>

              {/* BOT DIFFICULTY */}
              <div className="space-y-2 p-2 hover:bg-white/5 rounded-lg transition-colors">
                <span className="text-sm text-gray-400 font-bold uppercase block">Bot Difficulty</span>
                <div className="grid grid-cols-2 gap-2">
                  {(['easy', 'medium', 'hard', 'nightmare'] as BotDifficulty[]).map(diff => (
                    <button
                      key={diff}
                      onClick={() => updateSettings({ botDifficulty: diff })}
                      className={`px-2 py-2 rounded text-xs font-bold uppercase border transition-all ${settings.botDifficulty === diff
                        ? 'bg-neon-blue/20 text-neon-blue border-neon-blue'
                        : 'bg-black/40 text-gray-500 border-white/5 hover:bg-white/5'
                        }`}
                      style={{
                        borderColor: settings.botDifficulty === diff ? themeColor : undefined,
                        color: settings.botDifficulty === diff ? themeColor : undefined,
                        backgroundColor: settings.botDifficulty === diff ? `${themeColor}20` : undefined
                      }}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button onClick={() => { audioService.playClick(); setView('main'); }} className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg font-bold tracking-widest transition-all hover:text-white hover:border-white">
              BACK
            </button>
          </div>
        )}

        {/* TRANSACTIONS VIEW */}
        {view === 'transactions' && (
          <div className="w-full glass-panel rounded-2xl animate-in fade-in zoom-in-95 duration-300 border shadow-[0_0_30px_rgba(0,0,0,0.5)] bg-black/80" style={{ borderColor: `${themeColor}40`, height: '500px' }}>
            <Transactions
              transactions={playerData.transactions || []}
              onBack={() => setView('main')}
              themeColor={themeColor}
            />
          </div>
        )}
      </div>

      {showCountrySelector && (
        <CountrySelector
          currentFlag={userCountry}
          onSelect={(flag) => {
            onSelectCountry(flag);
            setShowCountrySelector(false);
          }}
          onClose={() => setShowCountrySelector(false)}
        />
      )}
    </div>
  );
};

export default MainMenu;
