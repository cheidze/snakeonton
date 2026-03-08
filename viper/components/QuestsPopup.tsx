import React, { useState, useEffect } from 'react';
import { audioService } from '../services/audioService';
import { PlayerData } from '../types';

interface Props {
  onClose: () => void;
  themeColor?: string;
  playerData: PlayerData;
  onUpdatePlayerData: (data: PlayerData) => void;
}

interface Mission {
  id: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  reward: number;
  completed: boolean;
  type: 'daily' | 'lifetime';
}

const QuestsPopup: React.FC<Props> = ({ onClose, themeColor = '#00f3ff', playerData, onUpdatePlayerData }) => {
  const [activeTab, setActiveTab] = useState<'checkin' | 'daily' | 'lifetime'>('checkin');
  
  const [checkInDays, setCheckInDays] = useState(playerData.checkInDays || 0);
  const [canCheckIn, setCanCheckIn] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (!playerData.lastCheckInDate) {
      setCanCheckIn(true);
      setCheckInDays(0);
    } else {
      const lastCheckIn = new Date(playerData.lastCheckInDate);
      const currentDate = new Date(today);
      const diffTime = Math.abs(currentDate.getTime() - lastCheckIn.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

      if (playerData.lastCheckInDate === today) {
        setCanCheckIn(false);
        setCheckInDays(playerData.checkInDays || 0);
      } else if (diffDays === 1) {
        setCanCheckIn(true);
        setCheckInDays(playerData.checkInDays || 0);
      } else {
        // Reset if missed a day
        setCanCheckIn(true);
        setCheckInDays(0);
      }
    }
  }, [playerData.lastCheckInDate, playerData.checkInDays]);

  const [missions, setMissions] = useState<Mission[]>([
    { id: 'd1', title: 'First Blood', description: 'Kill 1 viper today', progress: 0, target: 1, reward: 50, completed: false, type: 'daily' },
    { id: 'd2', title: 'Glutton', description: 'Eat 100 food today', progress: 45, target: 100, reward: 100, completed: false, type: 'daily' },
    { id: 'l1', title: 'Veteran', description: 'Play 100 games', progress: playerData.stats?.gamesPlayed || 0, target: 100, reward: 1000, completed: false, type: 'lifetime' },
    { id: 'l2', title: 'Millionaire', description: 'Collect 10,000 gold', progress: playerData.gold || 0, target: 10000, reward: 5000, completed: false, type: 'lifetime' },
  ]);

  useEffect(() => {
    // Sync completed missions from playerData
    if (playerData.claimedMissions) {
      setMissions(prev => prev.map(m => 
        playerData.claimedMissions?.includes(m.id) ? { ...m, completed: true } : m
      ));
    }
  }, [playerData.claimedMissions]);

  const handleCheckIn = () => {
    if (!canCheckIn) return;
    audioService.playClick();
    
    const newDays = Math.min(checkInDays + 1, 7);
    const reward = newDays * 50;
    
    setCheckInDays(newDays);
    setCanCheckIn(false);
    
    onUpdatePlayerData({
      ...playerData,
      gold: playerData.gold + reward,
      checkInDays: newDays === 7 ? 0 : newDays, // Reset after day 7
      lastCheckInDate: new Date().toISOString().split('T')[0]
    });
  };

  const handleClaim = (id: string) => {
    audioService.playClick();
    
    const mission = missions.find(m => m.id === id);
    if (!mission || mission.completed) return;

    setMissions(prev => prev.map(m => m.id === id ? { ...m, completed: true } : m));
    
    const claimed = playerData.claimedMissions ? [...playerData.claimedMissions, id] : [id];
    
    onUpdatePlayerData({
      ...playerData,
      gold: playerData.gold + mission.reward,
      claimedMissions: claimed
    });
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div 
        className="w-full max-w-lg bg-gray-900 border-2 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300"
        style={{ borderColor: `${themeColor}60` }}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-white/10 bg-black/40">
          <h2 className="text-2xl font-black italic tracking-widest text-white">MISSIONS</h2>
          <button 
            onClick={() => { audioService.playClick(); onClose(); }}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-red-500/80 flex items-center justify-center transition-colors font-bold text-white"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 bg-black/20">
          {(['checkin', 'daily', 'lifetime'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => { audioService.playClick(); setActiveTab(tab); }}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${
                activeTab === tab ? 'text-white bg-white/10' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
              }`}
              style={{ borderBottom: activeTab === tab ? `2px solid ${themeColor}` : '2px solid transparent' }}
            >
              {tab === 'checkin' ? 'Daily Gift' : tab === 'daily' ? 'Daily Quests' : 'Lifetime'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
          
          {/* Daily Check-in */}
          {activeTab === 'checkin' && (
            <div className="flex flex-col items-center space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-bold text-white mb-2">Daily Check-In</h3>
                <p className="text-sm text-gray-400">Log in every day to claim increasing rewards!</p>
              </div>
              
              <div className="grid grid-cols-4 gap-3 w-full">
                {[1, 2, 3, 4, 5, 6, 7].map(day => {
                  const isClaimed = day <= checkInDays;
                  const isToday = day === checkInDays + 1;
                  return (
                    <div 
                      key={day}
                      className={`relative flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                        isClaimed ? 'bg-green-500/20 border-green-500/50' : 
                        isToday ? 'bg-white/10 animate-pulse' : 'bg-black/40 border-white/5 opacity-50'
                      } ${day === 7 ? 'col-span-2' : ''}`}
                      style={{ borderColor: isToday ? themeColor : undefined }}
                    >
                      <span className="text-xs text-gray-400 font-bold mb-1">Day {day}</span>
                      <span className="text-2xl mb-1">{day === 7 ? '🎁' : '💰'}</span>
                      <span className="text-sm font-bold text-neon-yellow">{day * 50}</span>
                      {isClaimed && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-xl">
                          <span className="text-green-400 text-2xl">✓</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                onClick={handleCheckIn}
                disabled={!canCheckIn}
                className={`w-full py-3 rounded-xl font-bold uppercase tracking-widest transition-all ${
                  canCheckIn 
                    ? 'bg-white text-black hover:scale-105 shadow-[0_0_15px_rgba(255,255,255,0.5)]' 
                    : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                }`}
                style={canCheckIn ? { background: `linear-gradient(to right, ${themeColor}, #bd00ff)` } : {}}
              >
                {canCheckIn ? 'Claim Reward' : 'Come back tomorrow'}
              </button>
            </div>
          )}

          {/* Missions List */}
          {(activeTab === 'daily' || activeTab === 'lifetime') && (
            <div className="space-y-4">
              {missions.filter(m => m.type === activeTab).map(mission => (
                <div key={mission.id} className="bg-black/40 border border-white/10 rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-white text-lg">{mission.title}</h4>
                      <p className="text-xs text-gray-400">{mission.description}</p>
                    </div>
                    <div className="flex items-center gap-1 bg-black/50 px-2 py-1 rounded border border-neon-yellow/30">
                      <span className="text-sm">💰</span>
                      <span className="text-neon-yellow font-bold text-sm">{mission.reward}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-3 bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full transition-all duration-500"
                        style={{ 
                          width: `${Math.min(100, (mission.progress / mission.target) * 100)}%`,
                          background: `linear-gradient(to right, ${themeColor}, #bd00ff)`
                        }}
                      />
                    </div>
                    <span className="text-xs font-mono text-gray-400 whitespace-nowrap">
                      {mission.progress} / {mission.target}
                    </span>
                  </div>

                  {mission.progress >= mission.target && !mission.completed && (
                    <button 
                      onClick={() => handleClaim(mission.id)}
                      className="w-full py-2 mt-2 bg-green-500/20 hover:bg-green-500/40 border border-green-500 text-green-400 font-bold rounded-lg uppercase tracking-widest text-sm transition-colors"
                    >
                      Claim Reward
                    </button>
                  )}
                  {mission.completed && (
                    <div className="w-full py-2 mt-2 bg-black/50 border border-white/5 text-gray-500 font-bold rounded-lg uppercase tracking-widest text-sm text-center">
                      Completed
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestsPopup;
