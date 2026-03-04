import React, { useRef, useState } from 'react';

interface Props {
  onMove: (angle: number | null, distance: number) => void;
}

const VirtualJoystick: React.FC<Props> = ({ onMove }) => {
  const [isActive, setIsActive] = useState(false);
  const [origin, setOrigin] = useState({ x: 0, y: 0 }); 
  const [current, setCurrent] = useState({ x: 0, y: 0 });
  
  // Track specific touch ID to avoid interference from other fingers
  const touchId = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    // If we are already tracking a finger, ignore new ones
    if (touchId.current !== null) return;

    const touch = e.changedTouches[0];
    touchId.current = touch.identifier;
    
    setOrigin({ x: touch.clientX, y: touch.clientY });
    setCurrent({ x: 0, y: 0 });
    setIsActive(true);
    
    // Initial zero movement
    onMove(null, 0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchId.current === null) return;
    
    // Find the specific touch we are tracking
    const touch = Array.from(e.changedTouches).find(t => t.identifier === touchId.current);
    if (!touch) return;

    const dx = touch.clientX - origin.x;
    const dy = touch.clientY - origin.y;
    
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDist = 80; // Logical max distance for input saturation
    const visualMaxDist = 60; // Max visual stick radius
    
    const angle = Math.atan2(dy, dx);
    
    // Clamp visual stick
    const clampedDist = Math.min(distance, visualMaxDist);
    
    setCurrent({
      x: Math.cos(angle) * clampedDist,
      y: Math.sin(angle) * clampedDist
    });

    // Pass data to game
    const force = Math.min(distance / maxDist, 1.0);
    
    // Apply deadzone
    if (force > 0.1) {
        onMove(angle, force);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchId.current === null) return;
    
    const touch = Array.from(e.changedTouches).find(t => t.identifier === touchId.current);
    if (!touch) return;

    setIsActive(false);
    setCurrent({ x: 0, y: 0 });
    touchId.current = null;
    onMove(null, 0);
  };

  return (
    <div 
      className="absolute top-0 left-0 w-full h-full z-40 outline-none select-none"
      style={{ touchAction: 'none' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {/* Visual Joystick Element - Only visible when active */}
      {isActive && (
        <div 
            className="absolute pointer-events-none animate-in fade-in duration-75"
            style={{ 
                left: origin.x, 
                top: origin.y,
                transform: 'translate(-50%, -50%)' 
            }}
        >
            {/* Base */}
            <div className="w-32 h-32 rounded-full border-2 border-white/10 bg-black/20 backdrop-blur-sm shadow-[0_0_15px_rgba(0,243,255,0.2)]"></div>
            
            {/* Stick */}
            <div 
                className="absolute w-12 h-12 bg-neon-blue rounded-full shadow-[0_0_20px_#00f3ff] transition-transform duration-75 ease-out"
                style={{
                    left: '50%',
                    top: '50%',
                    marginTop: -24,
                    marginLeft: -24,
                    transform: `translate(${current.x}px, ${current.y}px)`
                }}
            />
        </div>
      )}
      
      {/* Hint text when not active */}
      {!isActive && (
          <div className="absolute bottom-20 left-10 text-white/20 text-xs uppercase font-bold tracking-widest pointer-events-none animate-pulse">
              Drag to Steer
          </div>
      )}
    </div>
  );
};

export default VirtualJoystick;