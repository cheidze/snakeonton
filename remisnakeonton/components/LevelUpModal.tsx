
import React, { useEffect } from 'react';
import { LevelReward } from '../types';
import { audioService } from '../services/audioService';

interface Props {
  level: number;
  rewards: LevelReward[];
  isLast: boolean;
  onNext: () => void;
}

const LevelUpModal: React.FC<Props> = ({ level, rewards, isLast, onNext }) => {
  
  useEffect(() => {
    // Play sound trigger if needed
  }, [level]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative bg-dark-grid border-2 border-neon-purple rounded-3xl p-8 max-w-sm w-full text-center shadow-[0_0_50px_rgba(189,0,255,0.4)] transform scale-100 animate-in zoom-in-90 duration-300">
        
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-40 h-40 bg-neon-pink rounded-full mix-blend-screen filter blur-[60px] opacity-50 animate-pulse"></div>
        
        <h2 className="text-5xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-neon-blue via-white to-neon-pink drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] mb-2">
          LEVEL UP!
        </h2>
        
        <div key={level} className="text-8xl font-black text-white mb-6 drop-shadow-[0_0_15px_rgba(189,0,255,0.8)] animate-in zoom-in duration-500">
          {level}
        </div>

        <div className="space-y-3 mb-8">
          <p className="text-gray-400 uppercase tracking-widest text-xs font-bold">Rewards Unlocked</p>
          
          <div className="flex flex-col gap-2">
            {rewards.map((reward, idx) => (
              <div key={idx} className="flex items-center justify-center gap-3 bg-white/5 border border-white/10 p-3 rounded-xl animate-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                <span className="text-2xl">{reward.type === 'gold' ? '💰' : '🎨'}</span>
                <div className="text-left">
                  <div className="font-bold text-white">
                    {reward.type === 'gold' ? `+${reward.amount} Gold` : reward.name}
                  </div>
                  <div className="text-xs text-neon-green uppercase">
                    {reward.type === 'skin' ? 'New Skin!' : 'Currency'}
                  </div>
                </div>
              </div>
            ))}
            {rewards.length === 0 && (
                <div className="text-gray-500 text-sm italic">No rewards this level</div>
            )}
          </div>
        </div>

        <button 
          onClick={() => { audioService.playClick(); onNext(); }}
          className="w-full py-3 bg-gradient-to-r from-neon-purple to-neon-pink rounded-full font-bold text-white text-lg shadow-lg hover:scale-105 transition-transform"
        >
          {isLast ? 'AWESOME!' : 'NEXT LEVEL >>'}
        </button>
      </div>
    </div>
  );
};

export default LevelUpModal;
