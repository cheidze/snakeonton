

import { GameState, Snake, Point, Food, SnakeSkin, BotDifficulty } from '../types';
import { WORLD_SIZE, INITIAL_SNAKE_LENGTH, BASE_SPEED, BOOST_SPEED, TURN_SPEED, SEGMENT_DISTANCE, FOOD_COUNT, BOT_COUNT, FOOD_COLORS, BOT_FLAGS, COIN_COUNT, COIN_VALUE, BOT_SKIN, BOT_DIFFICULTIES, ZONE_COUNT, ZONE_RADIUS_BOOST, ZONE_RADIUS_HAZARD } from './constants';
import { audioService } from './audioService';

// Helper math
const distance = (p1: Point, p2: Point) => Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
const randRange = (min: number, max: number) => Math.random() * (max - min) + min;

export class GameEngine {
  public state: GameState;
  private lastFrameTime: number = 0;
  private currentBotDifficulty: BotDifficulty = 'medium';
  private targetBotCount: number = BOT_COUNT;
  private wasBoosting: boolean = false;

  constructor() {
    this.state = {
      snakes: new Map(),
      foods: new Map(),
      coins: new Map(),
      particles: new Map(),
      zones: new Map(), // Init zones map
      worldSize: WORLD_SIZE,
      camera: { x: WORLD_SIZE / 2, y: WORLD_SIZE / 2 },
      myId: null,
      spectateId: null,
    };
    this.initWorld();
  }

  public setBotDifficulty(difficulty: BotDifficulty) {
    this.currentBotDifficulty = difficulty;
  }

  public setBotCount(count: number) {
      this.targetBotCount = count;
  }

  public reset() {
    this.state.snakes.clear();
    this.state.foods.clear();
    this.state.coins.clear();
    this.state.particles.clear();
    this.state.zones.clear();
    this.state.myId = null;
    this.state.spectateId = null;
    this.wasBoosting = false;
    audioService.stopBoost();
    this.initWorld();
  }

  private initWorld() {
    // Generate Food - Batch process
    for (let i = 0; i < FOOD_COUNT; i++) {
      this.addFood();
    }
    // Generate Coins
    for (let i = 0; i < COIN_COUNT; i++) {
        this.addCoin();
    }
    // Generate Zones
    this.initZones();
    
    // Generate Bots
    for (let i = 0; i < this.targetBotCount; i++) {
      this.spawnBot(i);
    }
  }

  private initZones() {
      for (let i = 0; i < ZONE_COUNT; i++) {
          const id = `zone-${i}`;
          const type = Math.random() > 0.3 ? 'boost' : 'hazard'; // 70% boost, 30% hazard
          const radius = type === 'boost' ? ZONE_RADIUS_BOOST : ZONE_RADIUS_HAZARD;
          
          this.state.zones.set(id, {
              id,
              x: randRange(radius, WORLD_SIZE - radius),
              y: randRange(radius, WORLD_SIZE - radius),
              radius,
              type
          });
      }
  }

  private addFood(x?: number, y?: number, value = 1) {
    const id = Math.random().toString(36).substr(2, 9);
    // If dropping loot (x/y provided), add some random scatter
    const finalX = x ? x + randRange(-20, 20) : randRange(0, WORLD_SIZE);
    const finalY = y ? y + randRange(-20, 20) : randRange(0, WORLD_SIZE);

    this.state.foods.set(id, {
      id,
      x: finalX,
      y: finalY,
      value,
      color: FOOD_COLORS[Math.floor(Math.random() * FOOD_COLORS.length)],
      radius: value === 1 ? 4 : 8,
      glowing: true,
    });
  }

  private addCoin(x?: number, y?: number) {
      const id = Math.random().toString(36).substr(2, 9);
      // Scatter coins on drop
      const finalX = x ? x + randRange(-30, 30) : randRange(0, WORLD_SIZE);
      const finalY = y ? y + randRange(-30, 30) : randRange(0, WORLD_SIZE);

      this.state.coins.set(id, {
          id,
          x: finalX,
          y: finalY,
          value: COIN_VALUE
      });
  }

  private spawnBot(index: number) {
    const id = `bot-${index}-${Math.random().toString(36).substr(2,4)}`; // Unique ID
    const startX = randRange(100, WORLD_SIZE - 100);
    const startY = randRange(100, WORLD_SIZE - 100);
    
    // Use selected difficulty
    const difficulty = this.currentBotDifficulty;
    
    let namePrefix = "Bot";
    if (difficulty === 'nightmare') namePrefix = "ELITE";
    else if (difficulty === 'hard') namePrefix = "Pro";
    else if (difficulty === 'easy') namePrefix = "Noob";

    const bot: Snake = {
      id,
      name: `${namePrefix} ${Math.floor(Math.random() * 999)}`,
      country: BOT_FLAGS[Math.floor(Math.random() * BOT_FLAGS.length)],
      body: [],
      angle: Math.random() * Math.PI * 2,
      targetAngle: Math.random() * Math.PI * 2,
      length: INITIAL_SNAKE_LENGTH,
      speed: BASE_SPEED,
      skin: BOT_SKIN, // STRICTLY USE BOT SKIN
      isBoosting: false,
      isDead: false,
      isBot: true,
      difficulty: difficulty,
      score: 0,
      sessionGold: 0,
    };
    
    // Initialize body
    for (let i = 0; i < INITIAL_SNAKE_LENGTH * SEGMENT_DISTANCE; i+=5) {
       bot.body.push({ x: startX, y: startY });
    }

    this.state.snakes.set(id, bot);
  }

  public spawnPlayer(name: string, skin: SnakeSkin, country: string = 'WW', activeTrail: string | null = null): string {
    const id = 'player-1';
    const startX = randRange(WORLD_SIZE / 4, WORLD_SIZE * 0.75);
    const startY = randRange(WORLD_SIZE / 4, WORLD_SIZE * 0.75);
    
    const player: Snake = {
      id,
      name: name || 'You',
      country: country,
      body: [],
      angle: Math.random() * Math.PI * 2,
      targetAngle: 0,
      length: INITIAL_SNAKE_LENGTH,
      speed: BASE_SPEED,
      skin: skin,
      activeTrail: activeTrail || undefined,
      isBoosting: false,
      isDead: false,
      isBot: false,
      score: 0,
      sessionGold: 0,
    };

    // Initialize body history
    for (let i = 0; i < INITIAL_SNAKE_LENGTH * SEGMENT_DISTANCE; i+=5) {
       player.body.push({ x: startX, y: startY });
    }

    this.state.snakes.set(id, player);
    this.state.myId = id;
    this.wasBoosting = false;
    return id;
  }

  public update(inputAngle: number | null, isBoosting: boolean) {
    const now = performance.now();
    const dt = (now - this.lastFrameTime) / 16.66; 
    this.lastFrameTime = now;

    // Update Snakes
    this.state.snakes.forEach((snake) => {
      if (snake.isDead) {
          // Stop audio if local player died while boosting
          if (snake.id === this.state.myId && this.wasBoosting) {
              audioService.stopBoost();
              this.wasBoosting = false;
          }
          return;
      }

      // AI Logic for bots
      if (snake.isBot) {
        this.updateBotAI(snake);
      } else if (snake.id === this.state.myId && inputAngle !== null) {
        snake.targetAngle = inputAngle;
        snake.isBoosting = isBoosting;
      }

      // Config for movement based on difficulty (or default for player)
      const diffConfig = snake.isBot && snake.difficulty ? BOT_DIFFICULTIES[snake.difficulty] : { speedMult: 1, turnSpeedMult: 1 };

      // Smooth Turning
      let diff = snake.targetAngle - snake.angle;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      
      const effectiveTurnSpeed = TURN_SPEED * diffConfig.turnSpeedMult;
      snake.angle += Math.sign(diff) * Math.min(Math.abs(diff), effectiveTurnSpeed * dt);

      // ZONE INTERACTIONS
      let zoneSpeedMult = 1;
      snake.inHazard = false;
      snake.inBoostZone = false;

      const head = snake.body[0];
      this.state.zones.forEach(zone => {
          if (distance(head, zone) < zone.radius) {
              if (zone.type === 'boost') {
                  zoneSpeedMult = 1.5;
                  snake.inBoostZone = true;
              } else if (zone.type === 'hazard') {
                  zoneSpeedMult = 0.6;
                  snake.inHazard = true;
                  // Hazard: Slight length decay?
                  if (Math.random() < 0.02 && snake.length > INITIAL_SNAKE_LENGTH) {
                      snake.length -= 0.1;
                  }
              }
          }
      });

      // Calculate speed (Base + Boost) * Difficulty * Zone
      const isEffectiveBoost = snake.isBoosting && snake.length > 5;
      const baseMoveSpeed = isEffectiveBoost ? BOOST_SPEED : BASE_SPEED;
      snake.speed = baseMoveSpeed * diffConfig.speedMult * zoneSpeedMult;

      // Handle Audio for Local Player
      if (snake.id === this.state.myId) {
          if (isEffectiveBoost && !this.wasBoosting) {
              audioService.startBoost();
              this.wasBoosting = true;
          } else if (!isEffectiveBoost && this.wasBoosting) {
              audioService.stopBoost();
              this.wasBoosting = false;
          }
      }

      // Boost Logic
      if (isEffectiveBoost) {
        // Cost of boosting
        if (Math.random() < 0.05) {
          snake.length = Math.max(5, snake.length - 0.1);
          snake.score -= 1;
          // Drop food occasionally when boosting
          if (Math.random() < 0.3) {
               const tail = snake.body[snake.body.length - 1];
               this.addFood(tail.x, tail.y, 1);
          }
        }

        // Determine effective trail style
        let trailStyle: string = snake.skin.trailStyle || 'none';
        if (snake.activeTrail && snake.activeTrail.startsWith('trail_')) {
            const styleName = snake.activeTrail.replace('trail_', '');
            if (['hearts', 'money'].includes(styleName)) {
                trailStyle = styleName as any;
            }
        }

        // Boost Trail Particles
        if (trailStyle !== 'none') {
          const particlesPerFrame = 2;
          for(let i=0; i<particlesPerFrame; i++) {
              const pid = Math.random().toString(36).substr(2, 9);
              const emitIndex = Math.min(snake.body.length - 1, 2);
              const emitPos = snake.body[emitIndex];
              
              if (emitPos) {
                  const angle = snake.angle + Math.PI + randRange(-0.5, 0.5); 
                  const speed = randRange(2, 6);
                  
                  let pColor = snake.skin.colors[1] || snake.skin.colors[0];
                  if (trailStyle === 'fire') pColor = Math.random() > 0.5 ? '#ff4500' : '#ffff00';
                  if (trailStyle === 'electric') pColor = Math.random() > 0.5 ? '#ccff00' : '#ffffff';
                  if (trailStyle === 'cosmic') pColor = Math.random() > 0.5 ? '#bd00ff' : '#00ffff';
                  if (trailStyle === 'hearts') pColor = '#ff69b4';
                  if (trailStyle === 'money') pColor = '#85bb65';

                  this.state.particles.set(pid, {
                      id: pid,
                      x: emitPos.x + randRange(-5, 5),
                      y: emitPos.y + randRange(-5, 5),
                      vx: Math.cos(angle) * speed, 
                      vy: Math.sin(angle) * speed,
                      life: randRange(0.3, 0.6), 
                      color: pColor, 
                      size: randRange(3, 7),
                      style: trailStyle as any
                  });
              }
          }
        }
      }

      // Move Head
      const newHead = {
        x: head.x + Math.cos(snake.angle) * snake.speed * dt,
        y: head.y + Math.sin(snake.angle) * snake.speed * dt,
      };

      // World Bounds
      if (newHead.x < 0 || newHead.x > WORLD_SIZE || newHead.y < 0 || newHead.y > WORLD_SIZE) {
        snake.angle += Math.PI; 
        snake.targetAngle = snake.angle;
        newHead.x = Math.max(0, Math.min(WORLD_SIZE, newHead.x));
        newHead.y = Math.max(0, Math.min(WORLD_SIZE, newHead.y));
      }

      snake.body.unshift(newHead);

      // Limit body history
      const requiredHistory = snake.length * SEGMENT_DISTANCE;
      if (snake.body.length > requiredHistory) {
        snake.body.pop();
      }

      this.checkCollisions(snake);
    });

    // Update Particles
    this.state.particles.forEach((p, key) => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= 0.03 * dt; 
      if (p.life <= 0) {
        this.state.particles.delete(key);
      }
    });

    // Dynamic Bot Spawning and Despawning
    const currentBots = Array.from(this.state.snakes.values()).filter(s => s.isBot);
    const botCount = currentBots.length;

    if (botCount < this.targetBotCount && Math.random() < 0.05) { 
       this.spawnBot(Math.floor(Math.random() * 1000));
    } else if (botCount > this.targetBotCount) {
       // Despawn logic: Kill a random bot nicely
       const botToRemove = currentBots[0];
       if (botToRemove && !botToRemove.isDead) {
           this.killSnake(botToRemove);
       }
    }
    
    // Respawn Food Aggressively (3x Spawn Rate simulation)
    let attempts = 0;
    while (this.state.foods.size < FOOD_COUNT && attempts < 10) {
        this.addFood();
        attempts++;
    }

    // Respawn Coins
    if (this.state.coins.size < COIN_COUNT) {
        if (Math.random() < 0.05) this.addCoin();
    }
  }

  private updateBotAI(bot: Snake) {
    const head = bot.body[0];
    const diffConfig = bot.difficulty ? BOT_DIFFICULTIES[bot.difficulty] : BOT_DIFFICULTIES.medium;

    // 1. Boundary Avoidance
    const margin = 300;
    if (head.x < margin || head.x > WORLD_SIZE - margin || head.y < margin || head.y > WORLD_SIZE - margin) {
      const centerAngle = Math.atan2(WORLD_SIZE/2 - head.y, WORLD_SIZE/2 - head.x);
      bot.targetAngle = centerAngle;
      bot.isBoosting = true; 
      return;
    }

    // 2. Collision Avoidance
    let avoidanceVector = { x: 0, y: 0 };
    let threatDetected = false;
    const detectionRadius = diffConfig.detectionRadius;

    this.state.snakes.forEach(other => {
        if (other.id === bot.id || other.isDead) return;
        
        const distToHead = distance(head, other.body[0]);
        
        if (distToHead < detectionRadius) {
            threatDetected = true;
            avoidanceVector.x -= (other.body[0].x - head.x);
            avoidanceVector.y -= (other.body[0].y - head.y);
        }

        // Harder bots check more segments
        const segmentStep = bot.difficulty === 'nightmare' ? 3 : bot.difficulty === 'hard' ? 5 : 10;
        
        for(let i=0; i<other.body.length; i+=segmentStep) {
            const seg = other.body[i];
            const d = distance(head, seg);
            if (d < detectionRadius) {
                threatDetected = true;
                avoidanceVector.x -= (seg.x - head.x);
                avoidanceVector.y -= (seg.y - head.y);
            }
        }
    });

    if (threatDetected) {
        bot.targetAngle = Math.atan2(avoidanceVector.y, avoidanceVector.x);
        bot.isBoosting = true; 
        return; 
    }

    // 3. Food Seeking
    let bestScore = -Infinity;
    let targetFood: Food | null = null;

    const viewDist = diffConfig.viewDistance;
    let scanCount = 0;
    const maxScans = bot.difficulty === 'nightmare' ? 100 : bot.difficulty === 'easy' ? 20 : 50;

    for (const food of this.state.foods.values()) {
      if (scanCount++ > maxScans) break; 

      const d = distance(head, food);
      if (d > viewDist) continue; 

      const score = (food.value * 100) / (d + 1); 
      
      if (score > bestScore) {
        bestScore = score;
        targetFood = food;
      }
    }

    if (targetFood) {
      bot.targetAngle = Math.atan2(targetFood.y - head.y, targetFood.x - head.x);
      bot.isBoosting = (targetFood.value > 1 && distance(head, targetFood) < 300 && Math.random() < diffConfig.boostChance); 
    } else {
      if (Math.random() < 0.02) {
        bot.targetAngle += randRange(-0.5, 0.5);
      }
      bot.isBoosting = false;
    }
  }

  private checkCollisions(snake: Snake) {
    const head = snake.body[0];
    const headRadius = 10 + (snake.length / 50); 

    // 1. Food Collision
    this.state.foods.forEach((food, id) => {
       if (distance(head, food) < headRadius + food.radius + 10) {
         this.state.foods.delete(id);
         snake.length += food.value * 0.5;
         snake.score += Math.floor(food.value * 10);
         
         if (snake.id === this.state.myId) {
           audioService.playEat();
         }
       }
    });

    // 2. Coin Collision
    if (!snake.isBot) {
        this.state.coins.forEach((coin, id) => {
            if (distance(head, coin) < headRadius + 15) {
                this.state.coins.delete(id);
                snake.sessionGold += coin.value;
                if (snake.id === this.state.myId) {
                    audioService.playCoin();
                }
            }
        });
    }

    // 3. Snake-Snake Collision
    this.state.snakes.forEach((other) => {
      if (other.isDead) return;
      if (other.id === snake.id) return; 

      const otherHead = other.body[0];
      if (distance(head, otherHead) > 1000) return; 

      let collision = false;
      for (let i = 0; i < other.body.length; i += 4) {
          const seg = other.body[i];
          const dist = distance(head, seg);
          if (dist < headRadius + 8) { 
             collision = true;
             break;
          }
      }

      if (collision) {
        this.killSnake(snake);
      }
    });
  }

  private killSnake(snake: Snake) {
    snake.isDead = true;
    if (snake.id === this.state.myId) {
      audioService.playDie();
      audioService.stopBoost();
      this.wasBoosting = false;
    }

    // VISUALLY APPEALING SCATTERED DISTRIBUTION
    for (let i = 0; i < snake.body.length; i+=3) {
      const seg = snake.body[i];
      
      // Add randomness to positions
      const scatterX = seg.x + randRange(-30, 30);
      const scatterY = seg.y + randRange(-30, 30);

      // Drop Food
      if (Math.random() > 0.3) {
         this.addFood(scatterX, scatterY, 2);
      }
      // Chance to drop coin
      if (Math.random() < 0.15) {
         this.addCoin(scatterX, scatterY); 
      }
    }
    
    // UNIQUE BOT DEATH PARTICLE EFFECT
    const head = snake.body[0];
    const particleCount = snake.isBot ? 40 : 25;
    // Bots get 'glitch' style
    const particleStyle = snake.isBot ? 'glitch' : (snake.skin.trailStyle === 'none' ? 'neon' : snake.skin.trailStyle);
    
    for(let i=0; i<particleCount; i++) {
        const pid = Math.random().toString();
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * (snake.isBot ? 10 : 8);
        
        let color = snake.skin.colors[0];
        // Bot death colors (Matrix Green/White glitch)
        if (snake.isBot) {
            const r = Math.random();
            if (r < 0.6) color = '#00ff00';
            else if (r < 0.8) color = '#ffffff';
            else color = '#003300';
        }

        this.state.particles.set(pid, {
            id: pid,
            x: head.x,
            y: head.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: randRange(0.8, 1.4), // Longer lasting
            color: color,
            size: Math.random() * 6 + 2,
            style: particleStyle as any
        });
    }
  }
  
  public getMySnake(): Snake | undefined {
      return this.state.snakes.get(this.state.myId || '');
  }

  public getSpectatingSnake(): Snake | undefined {
      // If we are already spectating someone and they are alive, return them
      if (this.state.spectateId) {
          const target = this.state.snakes.get(this.state.spectateId);
          if (target && !target.isDead) {
              return target;
          }
      }
      
      // Otherwise find a new target (highest score)
      const bestCandidate = Array.from(this.state.snakes.values())
          .filter(s => !s.isDead)
          .sort((a, b) => b.score - a.score)[0];
          
      if (bestCandidate) {
          this.state.spectateId = bestCandidate.id;
          return bestCandidate;
      }
      
      this.state.spectateId = null;
      return undefined;
  }
}