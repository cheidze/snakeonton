import React, { useState, useEffect } from 'react';

const TIPS = [
  "Tip: Use the boost to escape tight situations, but watch your length!",
  "Tip: Collect coins to buy new skins in the shop.",
  "Tip: Cutting off other vipers is the best way to grow fast.",
  "Tip: The magnet powerup pulls food towards you.",
  "Tip: Ghost powerup lets you pass through other vipers safely.",
  "Tip: Stay near the center to find more action, or hide at the edges to survive.",
  "Tip: Invincibility lets you smash through other vipers without dying.",
  "Tip: Speed powerup makes you incredibly fast without losing length!"
];

interface Props {
  onComplete: () => void;
  themeColor?: string;
}

const LoadingScreen: React.FC<Props> = ({ onComplete, themeColor = '#00f3ff' }) => {
  const [progress, setProgress] = useState(0);
  const [tip] = useState(TIPS[Math.floor(Math.random() * TIPS.length)]);

  useEffect(() => {
    const duration = 2000; // 2 seconds loading simulation
    const interval = 50;
    const steps = duration / interval;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      setProgress(Math.min(100, (currentStep / steps) * 100));
      
      if (currentStep >= steps) {
        clearInterval(timer);
        setTimeout(onComplete, 200);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-dark-bg">
      {/* Animated Visual */}
      <div className="relative w-32 h-32 mb-8">
        <div className="absolute inset-0 border-4 rounded-full border-t-transparent animate-spin" style={{ borderColor: themeColor, borderTopColor: 'transparent', animationDuration: '1s' }}></div>
        <div className="absolute inset-2 border-4 border-white/50 rounded-full border-b-transparent animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
        <div className="absolute inset-4 border-4 rounded-full border-l-transparent animate-spin" style={{ borderColor: '#bd00ff', borderLeftColor: 'transparent', animationDuration: '2s' }}></div>
        <div className="absolute inset-0 flex items-center justify-center" style={{ filter: `drop-shadow(0 0 15px ${themeColor})` }}>
          <img src="/logo.jpg" alt="Viper Logo" className="w-24 h-24 object-contain rounded-full" />
        </div>
      </div>

      <h1 className="text-4xl font-black italic text-transparent bg-clip-text mb-8 tracking-widest"
          style={{ backgroundImage: `linear-gradient(to right, ${themeColor}, #ffffff, #bd00ff)`, filter: `drop-shadow(0 0 10px ${themeColor}80)` }}>
        VIPER
      </h1>

      {/* Progress Bar */}
      <div className="w-64 h-2 bg-white/10 rounded-full overflow-hidden mb-8 shadow-[0_0_10px_rgba(0,0,0,0.5)]">
        <div 
          className="h-full transition-all duration-75 ease-linear"
          style={{ width: `${progress}%`, backgroundImage: `linear-gradient(to right, ${themeColor}, #bd00ff)`, boxShadow: `0 0 10px ${themeColor}` }}
        ></div>
      </div>

      {/* Tip */}
      <div className="h-12 flex items-center justify-center">
        <p className="text-gray-400 text-sm max-w-xs text-center animate-pulse">
          {tip}
        </p>
      </div>
    </div>
  );
};

export default LoadingScreen;
