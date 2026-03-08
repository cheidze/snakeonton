import React, { useState, useRef } from 'react';
import { PlayerData } from '../types';
import { audioService } from '../services/audioService';

interface Props {
  playerData: PlayerData;
  onClose: () => void;
  onWin: (prizeType: 'gold' | 'xp', amount: number) => void;
  themeColor?: string;
}

const PRIZES = [
  { label: '500 Gold', type: 'gold', amount: 500, color: '#FFD700' },
  { label: '100 XP', type: 'xp', amount: 100, color: '#00FFFF' },
  { label: '2000 Gold', type: 'gold', amount: 2000, color: '#FF8C00' },
  { label: '500 XP', type: 'xp', amount: 500, color: '#FF00FF' },
  { label: '1000 Gold', type: 'gold', amount: 1000, color: '#32CD32' },
  { label: '5000 Gold', type: 'gold', amount: 5000, color: '#FF4500' },
];

const SPIN_COST = 1000;

const LuckyWheel: React.FC<Props> = ({ playerData, onClose, onWin, themeColor = '#00f3ff' }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<typeof PRIZES[0] | null>(null);
  const [error, setError] = useState('');

  const spinWheel = () => {
    if (isSpinning) return;
    if (playerData.gold < SPIN_COST) {
      setError('Not enough gold!');
      return;
    }

    setError('');
    setIsSpinning(true);
    setResult(null);
    audioService.playClick();

    onWin('gold', -SPIN_COST);

    const spinDuration = 4000;
    const extraSpins = 5;
    const prizeIndex = Math.floor(Math.random() * PRIZES.length);
    const sliceAngle = 360 / PRIZES.length;
    
    const targetAngle = extraSpins * 360 + (360 - (prizeIndex * sliceAngle + sliceAngle / 2));
    const newRotation = rotation + targetAngle + (360 - (rotation % 360));

    setRotation(newRotation);

    setTimeout(() => {
      setIsSpinning(false);
      setResult(PRIZES[prizeIndex]);
      onWin(PRIZES[prizeIndex].type as 'gold' | 'xp', PRIZES[prizeIndex].amount);
    }, spinDuration);
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div 
        className="w-full max-w-md bg-gray-900 border-2 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300"
        style={{ borderColor: `${themeColor}60` }}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-white/10 bg-black/40">
          <h2 className="text-2xl font-black italic tracking-widest text-white">LUCKY WHEEL</h2>
          <button 
            onClick={() => { if (!isSpinning) { audioService.playClick(); onClose(); } }}
            disabled={isSpinning}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-red-500/80 flex items-center justify-center transition-colors font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col items-center relative">
          <p className="text-gray-400 text-sm mb-8 text-center">Spin the wheel for <span className="font-bold text-neon-yellow">{SPIN_COST} Gold</span>!</p>

          <div className="relative w-64 h-64 mb-8">
            {/* Pointer */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 z-10 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[20px] border-t-white drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]"></div>
            
            {/* Wheel */}
            <div 
              className="w-full h-full rounded-full border-4 border-white/20 overflow-hidden relative shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-transform ease-out"
              style={{ 
                transform: `rotate(${rotation}deg)`,
                transitionDuration: isSpinning ? '4s' : '0s',
                background: 'conic-gradient(' + PRIZES.map((p, i) => `${p.color} ${i * (360/PRIZES.length)}deg ${(i+1) * (360/PRIZES.length)}deg`).join(', ') + ')'
              }}
            >
              {PRIZES.map((prize, i) => {
                const angle = i * (360 / PRIZES.length) + (360 / PRIZES.length) / 2;
                return (
                  <div 
                    key={i}
                    className="absolute top-0 left-1/2 w-8 h-1/2 origin-bottom -translate-x-1/2 flex items-start justify-center pt-4"
                    style={{ transform: `rotate(${angle}deg)` }}
                  >
                    <span className="text-black font-bold text-xs whitespace-nowrap transform -rotate-90 origin-center drop-shadow-md">
                      {prize.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {error && <p className="text-red-500 font-bold mb-4 animate-pulse">{error}</p>}
          
          {result && !isSpinning && (
            <div className="mb-4 text-center animate-in zoom-in duration-300 bg-black/40 p-4 rounded-xl border border-white/10 w-full">
              <p className="text-white text-sm uppercase tracking-widest mb-1">You won</p>
              <p className="text-2xl font-black text-neon-yellow drop-shadow-[0_0_10px_rgba(255,215,0,0.8)]">
                {result.label}!
              </p>
            </div>
          )}

          <button
            onClick={spinWheel}
            disabled={isSpinning}
            className={`w-full py-4 rounded-xl font-black text-xl tracking-widest uppercase transition-all ${
              isSpinning 
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-neon-yellow to-neon-pink text-white hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(255,215,0,0.5)]'
            }`}
          >
            {isSpinning ? 'SPINNING...' : 'SPIN'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LuckyWheel;
