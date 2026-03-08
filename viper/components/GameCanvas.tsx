import React, { useEffect, useRef, useState } from "react";
import { GameEngine } from "../services/gameEngine";
import { GameSettings, Snake } from "../types";
import { SEGMENT_DISTANCE, isoToEmoji } from "../services/constants";
import VirtualJoystick from "./VirtualJoystick";
import {
  drawGrid,
  drawPowerup,
  drawFood,
  drawCoin,
  drawParticle,
  drawSnake,
} from "./GameCanvasHelpers";

interface Props {
  engine: GameEngine;
  settings: GameSettings;
  onDeath: (
    score: number,
    hasWon?: boolean,
    matchStats?: {
      kills: number;
      length: number;
      playTime: number;
      isWin: boolean;
    },
  ) => void;
  themeColor?: string;
  isSpectating?: boolean;
  isPaused?: boolean;
}

const GameCanvas: React.FC<Props> = ({
  engine,
  settings,
  onDeath,
  themeColor = "#ff0055",
  isSpectating = false,
  isPaused = false,
}) => {
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
  const hasDiedRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", resize);
    resize();

    const render = () => {
      // 1. Input Processing
      const mySnake = engine.getMySnake();

      if (mySnake && !mySnake.isDead) {
        hasDiedRef.current = false;
      }

      // Update engine:
      if (mySnake && !mySnake.isDead) {
        let angle = null;
        let isBoosting = false;

        if (isPaused) {
          angle = mySnake.angle + 0.15; // Circle around tightly
          isBoosting = false;
        } else if (settings.controlScheme === "joystick") {
          angle = mobileAngleRef.current;
          isBoosting = mobileBoostRef.current;
        } else if (settings.controlScheme === "mouse") {
          const centerX = window.innerWidth / 2;
          const centerY = window.innerHeight / 2;
          angle = Math.atan2(
            mouseRef.current.y - centerY,
            mouseRef.current.x - centerX,
          );
          isBoosting = isMouseDownRef.current || false;
        } else {
          // Hybrid
          if (mobileAngleRef.current !== null) {
            angle = mobileAngleRef.current;
            isBoosting = mobileBoostRef.current || isMouseDownRef.current;
          } else {
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            angle = Math.atan2(
              mouseRef.current.y - centerY,
              mouseRef.current.x - centerX,
            );
            isBoosting = isMouseDownRef.current || false;
          }
        }

        engine.update(angle, isBoosting);
      } else {
        // Keep world running
        engine.update(null, false);
      }

      // Check death condition
      if (
        mySnake &&
        engine.state.myId !== null &&
        !engine.state.snakes.has(engine.state.myId) &&
        !isSpectating &&
        !hasDiedRef.current
      ) {
        hasDiedRef.current = true;
        onDeath(Math.floor(mySnake.score), false, {
          kills: mySnake.kills || 0,
          length: mySnake.length,
          playTime: Math.floor(
            (performance.now() - engine.state.startTime) / 1000,
          ),
          isWin: false,
        });
      } else if (
        mySnake &&
        engine.state.myId !== null &&
        engine.state.snakes.has(engine.state.myId) &&
        !isSpectating &&
        engine.state.gameMode === "free-for-all" &&
        !hasDiedRef.current
      ) {
        const aliveSnakes = Array.from(engine.state.snakes.values()) as Snake[];
        if (aliveSnakes.length === 1 && aliveSnakes[0].id === mySnake.id) {
          hasDiedRef.current = true;
          onDeath(Math.floor(mySnake.score), true, {
            kills: mySnake.kills || 0,
            length: mySnake.length,
            playTime: Math.floor(
              (performance.now() - engine.state.startTime) / 1000,
            ),
            isWin: true,
          });
        }
      }

      // 2. Clear & Camera Logic
      const time = performance.now();

      // Dynamic neon background
      const bgGradient = ctx.createRadialGradient(
        canvas.width / 2 + Math.sin(time * 0.0005) * 100,
        canvas.height / 2 + Math.cos(time * 0.0005) * 100,
        0,
        canvas.width / 2,
        canvas.height / 2,
        Math.max(canvas.width, canvas.height),
      );

      // Pulsing dark neon colors
      const r = Math.floor(10 + Math.sin(time * 0.001) * 5);
      const g = Math.floor(10 + Math.sin(time * 0.0013) * 5);
      const b = Math.floor(20 + Math.sin(time * 0.0017) * 10);

      bgGradient.addColorStop(0, `rgb(${r}, ${g}, ${b})`);
      bgGradient.addColorStop(1, "#05050a");
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add subtle moving stars/dust in background
      ctx.save();
      ctx.fillStyle = "#ffffff";
      for (let i = 0; i < 50; i++) {
        const x =
          (Math.sin(i * 123.45 + time * 0.0001) * 0.5 + 0.5) * canvas.width;
        const y =
          (Math.cos(i * 321.54 + time * 0.00015) * 0.5 + 0.5) * canvas.height;
        const size = Math.sin(i * 789.12 + time * 0.002) * 1.5 + 1.5;
        ctx.globalAlpha =
          Math.max(0, Math.sin(i * 456.78 + time * 0.001)) * 0.5;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      let camX = 0;
      let camY = 0;
      let targetZoom = 1.0;

      // CAMERA FOLLOW LOGIC
      let cameraTarget: Snake | undefined = mySnake;

      // If my snake is dead, try to follow spectateId
      if (!mySnake || mySnake.isDead) {
        if (isSpectating) {
          cameraTarget = engine.getSpectatingSnake();
        } else {
          cameraTarget = undefined;
        }
      }

      if (cameraTarget && !cameraTarget.isDead) {
        const head = cameraTarget.body[0];
        camX = head.x;
        camY = head.y;

        // Dynamic Zoom Logic
        let nearbySnakes = 0;
        const viewRadius = 1500;
        engine.state.snakes.forEach((s) => {
          if (s.id !== cameraTarget!.id && !s.isDead) {
            const dist = Math.sqrt(
              Math.pow(s.body[0].x - head.x, 2) +
                Math.pow(s.body[0].y - head.y, 2),
            );
            if (dist < viewRadius) nearbySnakes++;
          }
        });

        const lengthFactor = Math.min(0.2, (cameraTarget.length - 10) * 0.0005);
        targetZoom = Math.max(0.6, 1.0 - nearbySnakes * 0.05 - lengthFactor);

        // Store last known position
        engine.state.camera = { x: camX, y: camY };
        // Store last known zoom in a custom property on state (or use zoomRef)
      } else {
        // Use last known camera position instead of center of world
        camX = engine.state.camera.x || engine.state.worldSize / 2;
        camY = engine.state.camera.y || engine.state.worldSize / 2;
        targetZoom = zoomRef.current; // Keep current zoom
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
      drawGrid(
        ctx,
        camX,
        camY,
        viewW,
        viewH,
        engine.state.worldSize,
        themeColor,
      );

      // 3.5 DRAW POWERUPS

      engine.state.powerups.forEach((powerup) => {
        if (
          powerup.x < viewLeft - powerup.radius ||
          powerup.x > viewRight + powerup.radius
        )
          return;
        if (
          powerup.y < viewTop - powerup.radius ||
          powerup.y > viewBottom + powerup.radius
        )
          return;

        drawPowerup(ctx, powerup, time, settings);
      });

      // 4. Draw Food
      engine.state.foods.forEach((food) => {
        if (
          food.x < viewLeft ||
          food.x > viewRight ||
          food.y < viewTop ||
          food.y > viewBottom
        )
          return;

        drawFood(ctx, food, time, settings);
      });

      // 5. Draw Coins
      engine.state.coins.forEach((coin) => {
        if (
          coin.x < viewLeft ||
          coin.x > viewRight ||
          coin.y < viewTop ||
          coin.y > viewBottom
        )
          return;

        drawCoin(ctx, coin, time, settings);
      });

      // 6. Draw Particles
      if (settings.quality !== "low") {
        ctx.globalCompositeOperation = "lighter";
      }

      engine.state.particles.forEach((p) => {
        if (
          p.x < viewLeft ||
          p.x > viewRight ||
          p.y < viewTop ||
          p.y > viewBottom
        )
          return;
        drawParticle(ctx, p, settings);
      });

      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;

      // 7. Draw Snakes
      const snakes: Snake[] = Array.from(engine.state.snakes.values());
      const specId = engine.state.spectateId;
      snakes.sort((a, b) => {
        if (a.id === engine.state.myId) return 1;
        if (a.id === specId) return 1;
        return -1;
      });

      snakes.forEach((snake) => {
        if (snake.isDead) return;
        const head = snake.body[0];
        if (
          head.x < viewLeft - 500 ||
          head.x > viewRight + 500 ||
          head.y < viewTop - 500 ||
          head.y > viewBottom + 500
        )
          return;

        drawSnake(ctx, snake, settings.quality);
      });

      // 8. Draw World Border
      // Multi-layered glowing border
      ctx.strokeStyle = themeColor;
      ctx.lineWidth = 4;
      ctx.shadowBlur = 20;
      ctx.shadowColor = themeColor;
      ctx.strokeRect(0, 0, engine.state.worldSize, engine.state.worldSize);

      ctx.lineWidth = 1;
      ctx.strokeStyle = "#ffffff";
      ctx.shadowBlur = 5;
      ctx.shadowColor = "#ffffff";
      ctx.strokeRect(0, 0, engine.state.worldSize, engine.state.worldSize);

      ctx.shadowBlur = 0;

      ctx.restore();
      animationFrameId.current = requestAnimationFrame(render);
    };

    animationFrameId.current = requestAnimationFrame(render);

    // Input Listeners
    const handlePointerMove = (e: PointerEvent) => {
      if (e.pointerType === "mouse") {
        mouseRef.current = { x: e.clientX, y: e.clientY };
        if (settings.controlScheme === "hybrid") {
          mobileAngleRef.current = null;
        }
      }
    };
    const handlePointerDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse") isMouseDownRef.current = true;
    };
    const handlePointerUp = (e: PointerEvent) => {
      if (e.pointerType === "mouse") isMouseDownRef.current = false;
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Shift") isMouseDownRef.current = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Shift") isMouseDownRef.current = false;
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      cancelAnimationFrame(animationFrameId.current);
    };
  }, [
    engine,
    onDeath,
    settings.controlScheme,
    settings.quality,
    themeColor,
    isSpectating,
    isPaused,
  ]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="block w-full h-full absolute inset-0"
      />

      {!isSpectating && settings.controlScheme !== "mouse" && (
        <div className="md:hidden absolute inset-0 z-30 pointer-events-none">
          {/* Left half: Dynamic Joystick (Pointer events allowed via component) */}
          <div className="absolute top-0 left-0 w-1/2 h-full pointer-events-auto touch-none">
            <VirtualJoystick
              onMove={(angle, dist) => {
                mobileAngleRef.current = angle;
              }}
            />
          </div>

          {/* Right half: Boost Button Area */}
          <div
            className="absolute top-0 right-0 w-1/2 h-full pointer-events-auto touch-manipulation"
            style={{ touchAction: "none" }}
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
            onMouseDown={() => {
              mobileBoostRef.current = true;
              setIsBoostPressed(true);
            }}
            onMouseUp={() => {
              mobileBoostRef.current = false;
              setIsBoostPressed(false);
            }}
            onMouseLeave={() => {
              mobileBoostRef.current = false;
              setIsBoostPressed(false);
            }}
          >
            {/* Visual Button - Positioned specifically */}
            <div
              className={`absolute bottom-8 right-8 w-24 h-24 rounded-full border-4 flex items-center justify-center transition-all duration-100 pointer-events-none ${
                isBoostPressed
                  ? "bg-neon-pink/80 border-white shadow-[0_0_50px_#ff00ff] scale-95"
                  : "bg-black/30 border-white/20 backdrop-blur-sm shadow-lg"
              }`}
            >
              <div
                className={`w-20 h-20 rounded-full border-2 border-dashed ${isBoostPressed ? "border-white animate-spin" : "border-white/30"} flex items-center justify-center`}
              >
                <span className="font-black text-white text-xs tracking-widest pointer-events-none select-none">
                  BOOST
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GameCanvas;
