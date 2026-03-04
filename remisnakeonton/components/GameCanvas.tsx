import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from '../services/gameEngine';
import { GameSettings, Snake } from '../types';
import { SEGMENT_DISTANCE, isoToEmoji } from '../services/constants';
import VirtualJoystick from './VirtualJoystick';

interface Props {
  engine: GameEngine;
  settings: GameSettings;
  onDeath: (score: number) => void;
  themeColor?: string;
  isSpectating?: boolean;
}

const GameCanvas: React.FC<Props> = ({ engine, settings, onDeath, themeColor = '#ff0055', isSpectating = false }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number>(0);
  
  // Input state
  const mouseRef = useRef({ x: 0, y: 0 });
  const isMouseDownRef = useRef(false);
  const mobileAngleRef = useRef<number | null>(null);
  const mobileBoostRef = useRef(false);
  
  // Visual state for mobile controls
  const [isBoostPressed, setIsBoostPressed] = useState(false);
  
  // Camera state
  const zoomRef = useRef(1.0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false }); 
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const render = () => {
      // 1. Input Processing
      const mySnake = engine.getMySnake();
      
      // Update engine:
      if (mySnake && !mySnake.isDead) {
        if (mobileAngleRef.current === null) {
          // PC/Mouse Control
          const centerX = window.innerWidth / 2;
          const centerY = window.innerHeight / 2;
          const angle = Math.atan2(mouseRef.current.y - centerY, mouseRef.current.x - centerX);
          const isBoosting = isMouseDownRef.current || false; 
          engine.update(angle, isBoosting);
        } else {
          // Mobile Control
          engine.update(mobileAngleRef.current, mobileBoostRef.current);
        }
      } else {
         // Keep world running
         engine.update(null, false);
      }

      // Check death condition
      if (mySnake && mySnake.isDead && !isSpectating) {
        onDeath(Math.floor(mySnake.score));
      }

      // 2. Clear & Camera Logic
      ctx.fillStyle = '#050510';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      let camX = 0;
      let camY = 0;
      let targetZoom = 1.0;

      // CAMERA FOLLOW LOGIC
      let cameraTarget: Snake | undefined = mySnake;

      // If my snake is dead, try to follow spectateId
      if (!mySnake || mySnake.isDead) {
          cameraTarget = engine.getSpectatingSnake();
      }

      if (cameraTarget && !cameraTarget.isDead) {
         const head = cameraTarget.body[0];
         camX = head.x;
         camY = head.y;

         // Dynamic Zoom Logic
         let nearbySnakes = 0;
         const viewRadius = 1500;
         engine.state.snakes.forEach(s => {
             if (s.id !== cameraTarget!.id && !s.isDead) {
                 const dist = Math.sqrt(Math.pow(s.body[0].x - head.x, 2) + Math.pow(s.body[0].y - head.y, 2));
                 if (dist < viewRadius) nearbySnakes++;
             }
         });

         const lengthFactor = Math.min(0.2, (cameraTarget.length - 10) * 0.0005);
         targetZoom = Math.max(0.6, 1.0 - (nearbySnakes * 0.05) - lengthFactor);
      } else {
         camX = engine.state.worldSize / 2;
         camY = engine.state.worldSize / 2;
         targetZoom = 0.5;
      }
      
      zoomRef.current += (targetZoom - zoomRef.current) * 0.05;
      const zoom = zoomRef.current;

      ctx.save();
      
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.scale(zoom, zoom);
      ctx.translate(-camX, -camY);

      const viewW = canvas.width / zoom;
      const viewH = canvas.height / zoom;
      const viewLeft = camX - viewW / 2 - 100;
      const viewRight = camX + viewW / 2 + 100;
      const viewTop = camY - viewH / 2 - 100;
      const viewBottom = camY + viewH / 2 + 100;

      // 3. Draw Background Grid
      drawGrid(ctx, camX, camY, viewW, viewH, engine.state.worldSize, themeColor);

      // 3.5 DRAW MAP ZONES
      const time = performance.now();
      
      engine.state.zones.forEach(zone => {
          if (zone.x < viewLeft - zone.radius || zone.x > viewRight + zone.radius) return;
          if (zone.y < viewTop - zone.radius || zone.y > viewBottom + zone.radius) return;

          const pulse = zone.type === 'boost' ? 1 + Math.sin(time * 0.005) * 0.1 : 1;
          const radius = zone.radius * pulse;

          ctx.beginPath();
          ctx.arc(zone.x, zone.y, radius, 0, Math.PI * 2);
          
          if (zone.type === 'boost') {
              const gradient = ctx.createRadialGradient(zone.x, zone.y, 0, zone.x, zone.y, radius);
              gradient.addColorStop(0, 'rgba(0, 255, 255, 0.2)');
              gradient.addColorStop(1, 'rgba(0, 255, 255, 0.0)');
              ctx.fillStyle = gradient;
              ctx.fill();

              ctx.strokeStyle = 'rgba(0, 255, 255, 0.4)';
              ctx.lineWidth = 2;
              ctx.stroke();
              
              ctx.beginPath();
              ctx.arc(zone.x, zone.y, radius * 0.7, 0, Math.PI * 2);
              ctx.strokeStyle = `rgba(0, 255, 255, ${0.4 + Math.sin(time * 0.008) * 0.3})`;
              ctx.stroke();
              
              ctx.fillStyle = 'rgba(0, 255, 255, 0.8)';
              ctx.font = '40px Arial';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText('⚡', zone.x, zone.y);
          } else {
              const gradient = ctx.createRadialGradient(zone.x, zone.y, 0, zone.x, zone.y, radius);
              gradient.addColorStop(0, 'rgba(255, 0, 0, 0.15)');
              gradient.addColorStop(1, 'rgba(255, 0, 0, 0.0)');
              ctx.fillStyle = gradient;
              ctx.fill();

              ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
              ctx.lineWidth = 2;
              ctx.stroke();

              ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
              ctx.font = '40px Arial';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText('⚠️', zone.x, zone.y);
          }
      });

      // 4. Draw Food
      engine.state.foods.forEach(food => {
        if (food.x < viewLeft || food.x > viewRight || food.y < viewTop || food.y > viewBottom) return;

        ctx.beginPath();
        ctx.arc(food.x, food.y, food.radius, 0, Math.PI * 2);
        ctx.fillStyle = food.color;
        ctx.shadowBlur = settings.quality === 'high' ? 10 : 0;
        ctx.shadowColor = food.color;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // 5. Draw Coins
      engine.state.coins.forEach(coin => {
         if (coin.x < viewLeft || coin.x > viewRight || coin.y < viewTop || coin.y > viewBottom) return;

         const scale = 1 + Math.sin(time * 0.005) * 0.1;

         ctx.beginPath();
         ctx.arc(coin.x, coin.y, 10 * scale, 0, Math.PI * 2);
         ctx.fillStyle = '#ffd700'; 
         ctx.fill();

         ctx.beginPath();
         ctx.arc(coin.x, coin.y, 8 * scale, 0, Math.PI * 2);
         ctx.strokeStyle = '#b8860b';
         ctx.lineWidth = 2;
         ctx.stroke();

         ctx.fillStyle = '#b8860b';
         ctx.font = 'bold 12px monospace';
         ctx.textAlign = 'center';
         ctx.textBaseline = 'middle';
         ctx.fillText('$', coin.x, coin.y + 1);
      });

      // 6. Draw Particles
      if (settings.quality !== 'low') {
          ctx.globalCompositeOperation = 'lighter';
      }
      
      engine.state.particles.forEach(p => {
         if (p.x < viewLeft || p.x > viewRight || p.y < viewTop || p.y > viewBottom) return;
         const lifeRatio = p.life; 
         const pulse = 1 + Math.sin(p.life * 10) * 0.2;
         const dynamicSize = Math.max(0, p.size * lifeRatio * pulse);

         ctx.globalAlpha = p.life;

         if (p.style === 'glitch') {
             ctx.fillStyle = p.color;
             ctx.fillRect(p.x - dynamicSize, p.y - dynamicSize, dynamicSize * 2, dynamicSize * 2);
             if (Math.random() > 0.5) {
                 ctx.fillStyle = '#fff';
                 ctx.fillRect(p.x + 5, p.y, dynamicSize, 2);
             }
         } else if (p.style === 'hearts') {
             ctx.font = `${Math.floor(dynamicSize * 2)}px serif`;
             ctx.textAlign = 'center';
             ctx.textBaseline = 'middle';
             ctx.fillText('💖', p.x, p.y);
         } else if (p.style === 'money') {
             ctx.font = `${Math.floor(dynamicSize * 2)}px serif`;
             ctx.textAlign = 'center';
             ctx.textBaseline = 'middle';
             ctx.fillText('💸', p.x, p.y);
         } else {
             ctx.fillStyle = p.color;
             ctx.beginPath();
             ctx.arc(p.x, p.y, dynamicSize, 0, Math.PI * 2);
             ctx.fill();
         }
      });
      
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;

      // 7. Draw Snakes
      const snakes: Snake[] = Array.from(engine.state.snakes.values());
      const specId = engine.state.spectateId;
      snakes.sort((a, b) => {
          if (a.id === engine.state.myId) return 1;
          if (a.id === specId) return 1;
          return -1;
      });

      snakes.forEach(snake => {
        if (snake.isDead) return;
        const head = snake.body[0];
        if (head.x < viewLeft - 500 || head.x > viewRight + 500 || 
            head.y < viewTop - 500 || head.y > viewBottom + 500) return;

        drawSnake(ctx, snake, settings.quality);
      });

      // 8. Draw World Border
      ctx.strokeStyle = themeColor;
      ctx.lineWidth = 10;
      ctx.shadowBlur = 20;
      ctx.shadowColor = themeColor;
      ctx.strokeRect(0, 0, engine.state.worldSize, engine.state.worldSize);
      ctx.shadowBlur = 0;

      ctx.restore();
      animationFrameId.current = requestAnimationFrame(render);
    };

    animationFrameId.current = requestAnimationFrame(render);

    // Input Listeners
    const handleMouseMove = (e: MouseEvent) => { mouseRef.current = { x: e.clientX, y: e.clientY }; };
    const handleMouseDown = () => { isMouseDownRef.current = true; };
    const handleMouseUp = () => { isMouseDownRef.current = false; };
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Shift') isMouseDownRef.current = true; };
    const handleKeyUp = (e: KeyboardEvent) => { if (e.key === 'Shift') isMouseDownRef.current = false; };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animationFrameId.current);
    };
  }, [engine, onDeath, settings.quality, themeColor, isSpectating]);

  // Helper Drawing Functions
  const drawGrid = (ctx: CanvasRenderingContext2D, camX: number, camY: number, width: number, height: number, worldSize: number, themeColor: string) => {
    const gridSize = 100;
    const startX = Math.floor((camX - width/2) / gridSize) * gridSize;
    const startY = Math.floor((camY - height/2) / gridSize) * gridSize;
    
    ctx.beginPath();
    ctx.strokeStyle = themeColor + '33'; 
    ctx.lineWidth = 2;

    const extraBuffer = gridSize * 2;
    for (let x = startX - extraBuffer; x < startX + width + extraBuffer; x += gridSize) {
      if (x >= 0 && x <= worldSize) {
        ctx.moveTo(x, startY - extraBuffer);
        ctx.lineTo(x, startY + height + extraBuffer);
      }
    }
    for (let y = startY - extraBuffer; y < startY + height + extraBuffer; y += gridSize) {
        if (y >= 0 && y <= worldSize) {
            ctx.moveTo(startX - extraBuffer, y);
            ctx.lineTo(startX + width + extraBuffer, y);
        }
    }
    ctx.stroke();
  };

  const drawSnake = (ctx: CanvasRenderingContext2D, snake: Snake, quality: string) => {
    if (snake.body.length < 2) return;
    const head = snake.body[0];
    const primaryColor = snake.skin.colors[0];
    
    if (quality !== 'low') {
        ctx.shadowBlur = quality === 'high' ? 15 : 8;
        ctx.shadowColor = primaryColor;
    }
    const step = Math.floor(SEGMENT_DISTANCE / 2); 
    
    for (let i = snake.body.length - 1; i >= 0; i -= step) {
       let size = 12 + (snake.length / 100);
       if (i > snake.body.length - 10) {
           size *= (snake.body.length - i) / 10;
       }
       const seg = snake.body[i];
       
       if (i === 0) {
           ctx.fillStyle = '#ffffff'; 
       } else {
           const colorIndex = Math.floor(i / 10) % snake.skin.colors.length;
           ctx.fillStyle = snake.skin.colors[colorIndex];
       }
       ctx.beginPath();
       ctx.arc(seg.x, seg.y, size, 0, Math.PI * 2);
       ctx.fill();
    }
    
    ctx.shadowBlur = quality === 'high' ? 20 : 0;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(head.x, head.y, 14 + (snake.length/100), 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    const angle = snake.angle;
    const eyeOff = 8;
    const eyeSize = 4;
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(head.x + Math.cos(angle - 0.5) * eyeOff, head.y + Math.sin(angle - 0.5) * eyeOff, eyeSize, 0, Math.PI*2);
    ctx.arc(head.x + Math.cos(angle + 0.5) * eyeOff, head.y + Math.sin(angle + 0.5) * eyeOff, eyeSize, 0, Math.PI*2);
    ctx.fill();

    if (quality !== 'low') {
        ctx.font = 'bold 14px "Segoe UI Emoji", "Noto Color Emoji", sans-serif'; 
        ctx.textAlign = 'center';
        
        const flagEmoji = isoToEmoji(snake.country);
        let difficultyBadge = '';
        if (snake.isBot && snake.difficulty) {
            if (snake.difficulty === 'nightmare') difficultyBadge = '💀';
            else if (snake.difficulty === 'hard') difficultyBadge = '⚔️';
        }
        const label = `${flagEmoji} ${snake.name} ${difficultyBadge}`;
        
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(0,0,0,0.8)';
        ctx.strokeText(label, head.x, head.y - 30);
        ctx.fillStyle = '#fff';
        if (snake.difficulty === 'nightmare') ctx.fillStyle = '#ff0000';
        ctx.fillText(label, head.x, head.y - 30);
    }
    ctx.shadowBlur = 0;
  };

  return (
    <>
      <canvas ref={canvasRef} className="block w-full h-full absolute inset-0" />
      
      {!isSpectating && (
        <div className="md:hidden absolute inset-0 z-30 pointer-events-none">
          {/* Left half: Dynamic Joystick (Pointer events allowed via component) */}
          <div className="absolute top-0 left-0 w-1/2 h-full pointer-events-auto touch-none">
             <VirtualJoystick onMove={(angle, dist) => { mobileAngleRef.current = angle; }} />
          </div>

          {/* Right half: Boost Button Area */}
          <div className="absolute top-0 right-0 w-1/2 h-full pointer-events-none">
             {/* Hit Area Wrapper - Large touch target in bottom right */}
             <div 
                className="absolute bottom-0 right-0 w-64 h-64 flex items-center justify-center pointer-events-auto touch-manipulation"
                style={{ touchAction: 'none' }}
                onTouchStart={(e) => { 
                    mobileBoostRef.current = true; 
                    setIsBoostPressed(true);
                }}
                onTouchEnd={(e) => { 
                    mobileBoostRef.current = false; 
                    setIsBoostPressed(false);
                }}
                onTouchCancel={() => { 
                    mobileBoostRef.current = false; 
                    setIsBoostPressed(false);
                }}
                // PC Debugging support
                onMouseDown={() => { mobileBoostRef.current = true; setIsBoostPressed(true); }}
                onMouseUp={() => { mobileBoostRef.current = false; setIsBoostPressed(false); }}
                onMouseLeave={() => { mobileBoostRef.current = false; setIsBoostPressed(false); }}
             >
                 {/* Visual Button - Positioned specifically */}
                 <div 
                    className={`absolute bottom-8 right-8 w-24 h-24 rounded-full border-4 flex items-center justify-center transition-all duration-100 ${
                        isBoostPressed
                        ? 'bg-neon-pink/80 border-white shadow-[0_0_50px_#ff00ff] scale-95' 
                        : 'bg-black/30 border-white/20 backdrop-blur-sm shadow-lg'
                    }`}
                 >
                    <div className={`w-20 h-20 rounded-full border-2 border-dashed ${isBoostPressed ? 'border-white animate-spin' : 'border-white/30'} flex items-center justify-center`}>
                        <span className="font-black text-white text-xs tracking-widest pointer-events-none select-none">BOOST</span>
                    </div>
                 </div>
             </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GameCanvas;