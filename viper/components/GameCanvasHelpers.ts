import { Snake, Food, Coin, Particle, PowerUp, GameSettings } from '../types';
import { isoToEmoji } from '../services/constants';

export const drawGrid = (
  ctx: CanvasRenderingContext2D,
  camX: number,
  camY: number,
  width: number,
  height: number,
  worldSize: number,
  themeColor: string
) => {
  const hexSize = 60;
  const hexWidth = Math.sqrt(3) * hexSize;
  const hexHeight = 2 * hexSize;
  const yOffset = hexHeight * 0.75;

  const startX = camX - width / 2 - hexWidth;
  const endX = camX + width / 2 + hexWidth;
  const startY = camY - height / 2 - hexHeight;
  const endY = camY + height / 2 + hexHeight;

  const startRow = Math.floor(startY / yOffset);
  const endRow = Math.ceil(endY / yOffset);

  ctx.beginPath();
  ctx.strokeStyle = themeColor + '20';
  ctx.lineWidth = 1.5;

  for (let row = startRow; row <= endRow; row++) {
    const isOddRow = row % 2 !== 0;
    const xOffset = isOddRow ? hexWidth / 2 : 0;

    const startCol = Math.floor((startX - xOffset) / hexWidth);
    const endCol = Math.ceil((endX - xOffset) / hexWidth);

    for (let col = startCol; col <= endCol; col++) {
      const cx = col * hexWidth + xOffset;
      const cy = row * yOffset;

      if (cx >= -hexWidth && cx <= worldSize + hexWidth && cy >= -hexHeight && cy <= worldSize + hexHeight) {
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i - Math.PI / 6;
          const px = cx + hexSize * Math.cos(angle);
          const py = cy + hexSize * Math.sin(angle);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
      }
    }
  }
  ctx.stroke();
};

export const drawPowerup = (
  ctx: CanvasRenderingContext2D,
  powerup: PowerUp,
  time: number,
  settings: GameSettings
) => {
  const pulse = 1 + Math.sin(time * 0.005) * 0.1;
  const radius = powerup.radius * pulse;

  ctx.beginPath();
  ctx.arc(powerup.x, powerup.y, radius, 0, Math.PI * 2);

  let color = '#ffffff';
  let icon = '⚡';
  if (powerup.type === 'magnet') { color = '#ff00ff'; icon = '🧲'; }
  if (powerup.type === 'speed') { color = '#00ffff'; icon = '⚡'; }
  if (powerup.type === 'invincible') { color = '#ffff00'; icon = '🛡️'; }
  if (powerup.type === 'ghost') { color = '#e0e0e0'; icon = '👻'; }

  const gradient = ctx.createRadialGradient(powerup.x, powerup.y, 0, powerup.x, powerup.y, radius);
  gradient.addColorStop(0, `${color}40`);
  gradient.addColorStop(1, `${color}00`);
  ctx.fillStyle = gradient;
  ctx.fill();

  // Rotating dashed ring
  ctx.save();
  ctx.translate(powerup.x, powerup.y);
  ctx.rotate(time * 0.001);
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  if (settings.quality === 'high') {
    ctx.shadowBlur = 15;
    ctx.shadowColor = color;
  }
  ctx.setLineDash([10, 10]);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  const floatOffset = Math.sin(time * 0.003 + powerup.x) * 4;
  const iconScale = 1 + Math.sin(time * 0.005 + powerup.y) * 0.15;
  const iconRotation = Math.sin(time * 0.002 + powerup.x) * 0.15;

  ctx.translate(powerup.x, powerup.y + floatOffset);
  ctx.scale(iconScale, iconScale);
  ctx.rotate(iconRotation);

  ctx.fillStyle = color;
  ctx.font = '20px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (settings.quality === 'high') {
    ctx.shadowBlur = 15;
    ctx.shadowColor = color;
  }
  ctx.fillText(icon, 0, 0);
  ctx.restore();
};

export const drawFood = (
  ctx: CanvasRenderingContext2D,
  food: Food,
  time: number,
  settings: GameSettings
) => {
  const pulse = 1 + Math.sin(time * 0.01 + food.x) * 0.15;
  const currentRadius = food.radius * pulse;

  // Glowing orb effect
  const gradient = ctx.createRadialGradient(food.x, food.y, 0, food.x, food.y, currentRadius * 2);
  gradient.addColorStop(0, '#ffffff');
  gradient.addColorStop(0.1, food.color);
  gradient.addColorStop(0.4, `${food.color}80`);
  gradient.addColorStop(1, 'transparent');

  ctx.beginPath();
  ctx.arc(food.x, food.y, currentRadius * 2, 0, Math.PI * 2);
  ctx.fillStyle = gradient;

  if (settings.quality === 'high') {
    ctx.globalCompositeOperation = 'lighter';
    ctx.shadowBlur = 15;
    ctx.shadowColor = food.color;
  }
  ctx.fill();
  ctx.shadowBlur = 0;

  // Inner core
  ctx.beginPath();
  ctx.arc(food.x, food.y, food.radius * 0.4, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  ctx.globalCompositeOperation = 'source-over';
};

export const drawCoin = (
  ctx: CanvasRenderingContext2D,
  coin: Coin,
  time: number,
  settings: GameSettings
) => {
  const scale = 1 + Math.sin(time * 0.005 + coin.x) * 0.1;
  const coinRadius = 12 * scale;

  // Metallic gradient
  const gradient = ctx.createLinearGradient(coin.x - coinRadius, coin.y - coinRadius, coin.x + coinRadius, coin.y + coinRadius);
  gradient.addColorStop(0, '#ffea00');
  gradient.addColorStop(0.3, '#fff9a6');
  gradient.addColorStop(0.5, '#ffd700');
  gradient.addColorStop(0.8, '#b8860b');
  gradient.addColorStop(1, '#8b6508');

  ctx.beginPath();
  ctx.arc(coin.x, coin.y, coinRadius, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.shadowBlur = settings.quality === 'high' ? 25 : 0;
  ctx.shadowColor = '#ffd700';
  ctx.fill();
  ctx.shadowBlur = 0;

  // Inner ring
  ctx.beginPath();
  ctx.arc(coin.x, coin.y, coinRadius * 0.75, 0, Math.PI * 2);
  ctx.strokeStyle = '#ffffe0';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#ffffe0';
  ctx.font = `bold ${Math.floor(16 * scale)}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowBlur = 8;
  ctx.shadowColor = '#000000';
  ctx.fillText('$', coin.x, coin.y + 1);
  ctx.shadowBlur = 0;
};

export const drawParticle = (
  ctx: CanvasRenderingContext2D,
  p: Particle,
  settings: GameSettings
) => {
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
    if (dynamicSize > 0) {
      // Vibrant neon particle
      if (settings.quality === 'high') {
        ctx.shadowBlur = 15;
        ctx.shadowColor = p.color;
      }

      // White core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, dynamicSize * 0.4, 0, Math.PI * 2);
      ctx.fill();

      // Colored glow
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life * 0.6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, dynamicSize, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = p.life;
      ctx.shadowBlur = 0;
    }
  }
};

export const drawSnake = (
  ctx: CanvasRenderingContext2D,
  snake: Snake,
  quality: string
) => {
  if (snake.body.length < 2) return;
  const head = snake.body[0];
  const primaryColor = snake.skin.colors[0];
  const nowMs = Date.now();
  const isGhost = snake.activePowerups.ghost && snake.activePowerups.ghost > nowMs;
  const isInvincible = snake.activePowerups.invincible && snake.activePowerups.invincible > nowMs;
  const isMagnet = snake.activePowerups.magnet && snake.activePowerups.magnet > nowMs;

  ctx.save();

  if (isGhost) {
    ctx.globalAlpha = 0.4;
  }

  if (quality !== 'low') {
    ctx.shadowBlur = quality === 'high' ? 25 : 15;
    ctx.shadowColor = isInvincible ? '#ffff00' : primaryColor;
  }
  const step = 2; // Draw more frequently to make balls closer

  // Draw glowing trail
  if (snake.isBoosting && quality === 'high') {
    ctx.beginPath();
    for (let i = snake.body.length - 1; i >= 0; i -= step) {
      const seg = snake.body[i];
      if (i === snake.body.length - 1) {
        ctx.moveTo(seg.x, seg.y);
      } else {
        ctx.lineTo(seg.x, seg.y);
      }
    }
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 10 + (snake.length / 10);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = 0.3;
    ctx.shadowBlur = 30;
    ctx.shadowColor = primaryColor;
    ctx.stroke();
    ctx.globalAlpha = isGhost ? 0.4 : 1.0;
    ctx.shadowBlur = quality === 'high' ? 25 : 15;
  }

  for (let i = snake.body.length - 1; i >= 0; i -= step) {
    let size = 8 + (snake.length / 10);
    if (i > snake.body.length - 10) {
      size *= (snake.body.length - i) / 10;
    }
    const seg = snake.body[i];

    const colorIndex = Math.floor(i / 10) % snake.skin.colors.length;
    let segColor = i === 0 ? '#ffffff' : snake.skin.colors[colorIndex];

    if (isInvincible) {
      segColor = i % 2 === 0 ? '#ffff00' : '#ffffff';
    }

    // Draw patterns (underneath the segment)
    if (snake.skin.pattern && snake.skin.pattern !== 'none' && i > 0) {
      const nextSeg = snake.body[i - 1];
      const segAngle = Math.atan2(nextSeg.y - seg.y, nextSeg.x - seg.x);

      ctx.save();
      ctx.translate(seg.x, seg.y);
      ctx.rotate(segAngle);

      if (snake.skin.pattern === 'fins' && i % 6 === 0) {
        ctx.fillStyle = snake.skin.colors[1] || primaryColor;
        ctx.beginPath();
        // Left fin
        ctx.moveTo(size * 0.5, -size * 0.2);
        ctx.lineTo(-size * 0.5, -size * 1.8);
        ctx.lineTo(-size * 1.2, -size * 0.2);
        // Right fin
        ctx.moveTo(size * 0.5, size * 0.2);
        ctx.lineTo(-size * 0.5, size * 1.8);
        ctx.lineTo(-size * 1.2, size * 0.2);
        ctx.fill();
      } else if (snake.skin.pattern === 'spikes' && i % 4 === 0) {
        ctx.fillStyle = snake.skin.colors[1] || '#ffffff';
        ctx.beginPath();
        // Spikes on sides
        ctx.moveTo(size * 0.2, -size * 0.5);
        ctx.lineTo(-size * 0.5, -size * 1.5);
        ctx.lineTo(-size * 0.8, -size * 0.5);

        ctx.moveTo(size * 0.2, size * 0.5);
        ctx.lineTo(-size * 0.5, size * 1.5);
        ctx.lineTo(-size * 0.8, size * 0.5);
        ctx.fill();
      } else if (snake.skin.pattern === 'glow') {
        ctx.shadowBlur = 20;
        ctx.shadowColor = snake.skin.colors[1] || '#ffffff';
        ctx.strokeStyle = snake.skin.colors[1] || '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, size * 1.2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      ctx.restore();
    }

    // 3D Spherical look using radial gradient
    const gradient = ctx.createRadialGradient(seg.x - size / 3, seg.y - size / 3, size / 10, seg.x, seg.y, size);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.4, segColor);
    gradient.addColorStop(1, '#000000');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(seg.x, seg.y, size, 0, Math.PI * 2);
    ctx.fill();

    // Add a subtle highlight reflection
    if (quality === 'high') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.beginPath();
      ctx.ellipse(seg.x - size / 3, seg.y - size / 3, size / 3, size / 6, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw patterns (on top of the segment)
    if (snake.skin.pattern && snake.skin.pattern !== 'none' && i > 0) {
      const nextSeg = snake.body[i - 1];
      const segAngle = Math.atan2(nextSeg.y - seg.y, nextSeg.x - seg.x);

      ctx.save();
      ctx.translate(seg.x, seg.y);
      ctx.rotate(segAngle);

      if (snake.skin.pattern === 'stripes' && i % 4 === 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath();
        ctx.ellipse(0, 0, size * 0.3, size, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (snake.skin.pattern === 'scales') {
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(size * 0.3, 0, size * 0.6, -Math.PI / 2, Math.PI / 2);
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  ctx.shadowBlur = quality === 'high' ? 35 : 0;
  ctx.shadowColor = isInvincible ? '#ffff00' : '#ffffff';

  // Head gradient
  const headSize = 10 + (snake.length / 10);
  const headGradient = ctx.createRadialGradient(head.x - headSize / 3, head.y - headSize / 3, headSize / 10, head.x, head.y, headSize);
  headGradient.addColorStop(0, '#ffffff');
  headGradient.addColorStop(0.5, isInvincible ? '#ffff00' : '#e0e0e0');
  headGradient.addColorStop(1, '#888888');

  ctx.fillStyle = headGradient;
  ctx.beginPath();
  ctx.arc(head.x, head.y, headSize, 0, Math.PI * 2);
  ctx.fill();

  // Eyes
  const angle = snake.angle;
  const eyeOff = 8;
  const eyeSize = 4;
  ctx.shadowBlur = 0;

  // Eye whites
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(head.x + Math.cos(angle - 0.5) * eyeOff, head.y + Math.sin(angle - 0.5) * eyeOff, eyeSize + 1, 0, Math.PI * 2);
  ctx.arc(head.x + Math.cos(angle + 0.5) * eyeOff, head.y + Math.sin(angle + 0.5) * eyeOff, eyeSize + 1, 0, Math.PI * 2);
  ctx.fill();

  // Eye pupils
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.arc(head.x + Math.cos(angle - 0.5) * eyeOff + Math.cos(angle) * 1.5, head.y + Math.sin(angle - 0.5) * eyeOff + Math.sin(angle) * 1.5, eyeSize - 1.5, 0, Math.PI * 2);
  ctx.arc(head.x + Math.cos(angle + 0.5) * eyeOff + Math.cos(angle) * 1.5, head.y + Math.sin(angle + 0.5) * eyeOff + Math.sin(angle) * 1.5, eyeSize - 1.5, 0, Math.PI * 2);
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

  // Magnet Range Indicator
  if (isMagnet) {
    ctx.beginPath();
    ctx.arc(head.x, head.y, 200, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 0, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 15]);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = 'rgba(255, 0, 255, 0.05)';
    ctx.fill();
  }

  // Invincible Aura
  if (isInvincible) {
    const pulse = 1 + Math.sin(Date.now() * 0.01) * 0.2;
    ctx.beginPath();
    ctx.arc(head.x, head.y, headSize * 1.5 * pulse, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  ctx.restore();
};
