
import React from 'react';

interface Props {
  level: number;
  xp: number;
  xpToNext: number;
  compact?: boolean;
}

const XPBar: React.FC<Props> = ({ level, xp, xpToNext, compact = false }) => {
  const progress = Math.min(100, Math.max(0, (xp / xpToNext) * 100));

  return (
    <div className={`relative flex flex-col w-full ${compact ? 'gap-1' : 'gap-2'}`}>
      
      {/* Text Info */}
      {!compact && (
        <div className="flex justify-between items-end px-2">
          <div className="flex items-center gap-2">
             <span className="bg-neon-blue/20 text-neon-blue border border-neon-blue/50 px-2 py-0.5 rounded text-xs font-bold tracking-wider">LVL</span>
             <span className="text-white font-black text-xl italic">{level}</span>
          </div>
          <span className="text-gray-400 font-mono text-xs">{xp} / {xpToNext} XP</span>
        </div>
      )}

      {/* Bar Container */}
      <div className={`relative w-full bg-black/60 rounded-full border border-white/10 overflow-hidden shadow-inner ${compact ? 'h-2' : 'h-6'}`}>
        
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNCIgaGVpZ2h0PSI0IiB2aWV3Qm94PSIwIDAgNCA0IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxjaXJjbGUgY3g9IjIiIGN5PSIyIiByPSIxIiBmaWxsPSIjZmZmIi8+PC9zdmc+')]"></div>

        {/* Fill Gradient */}
        <div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink transition-all duration-1000 ease-out"
            style={{ width: `${progress}%` }}
        >
            {/* Shimmer Effect */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/30 to-transparent"></div>
            <div className="absolute top-0 right-0 bottom-0 w-2 bg-white/50 blur-[2px]"></div>
        </div>
      </div>

      {/* Compact Text */}
      {compact && (
        <div className="flex justify-between items-center text-[10px] font-bold leading-none px-1">
            <span className="text-neon-blue">LVL {level}</span>
            <span className="text-gray-500">{Math.floor(progress)}%</span>
        </div>
      )}
    </div>
  );
};

export default XPBar;
