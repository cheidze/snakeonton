import {
  GameState,
  Snake,
  Point,
  Food,
  SnakeSkin,
  BotDifficulty,
} from "../types";
import {
  WORLD_SIZE,
  INITIAL_SNAKE_LENGTH,
  BASE_SPEED,
  BOOST_SPEED,
  TURN_SPEED,
  SEGMENT_DISTANCE,
  FOOD_COUNT,
  BOT_COUNT,
  FOOD_COLORS,
  BOT_FLAGS,
  COIN_COUNT,
  COIN_VALUE,
  BOT_SKIN,
  BOT_DIFFICULTIES,
  POWERUP_COUNT,
} from "./constants";
import { audioService } from "./audioService";

// Helper math
const distance = (p1: Point, p2: Point) =>
  Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
const randRange = (min: number, max: number) =>
  Math.random() * (max - min) + min;

export class GameEngine {
  public state: GameState;
  private lastFrameTime: number = 0;
  private currentBotDifficulty: BotDifficulty = "medium";
  private targetBotCount: number = BOT_COUNT;
  private controlScheme: "mouse" | "joystick" | "hybrid" = "mouse";
  private visualEffects: "minimal" | "full" = "full";
  private wasBoosting: boolean = false;

  constructor() {
    this.state = {
      snakes: new Map(),
      foods: new Map(),
      coins: new Map(),
      particles: new Map(),
      powerups: new Map(), // Init powerups map
      worldSize: WORLD_SIZE,
      camera: { x: WORLD_SIZE / 2, y: WORLD_SIZE / 2 },
      myId: null,
      spectateId: null,
      gameMode: "classic",
      startTime: performance.now(),
    };
    this.initWorld();
  }

  public setBotDifficulty(difficulty: BotDifficulty) {
    this.currentBotDifficulty = difficulty;
  }

  public setBotCount(count: number) {
    this.targetBotCount = count;
  }

  public setGameMode(
    mode: "classic" | "survival" | "time-attack" | "free-for-all",
  ) {
    this.state.gameMode = mode;
  }

  public setControlScheme(scheme: "mouse" | "joystick" | "hybrid") {
    this.controlScheme = scheme;
  }

  public setVisualEffects(fx: "minimal" | "full") {
    this.visualEffects = fx;
  }

  public reset() {
    this.state.snakes.clear();
    this.state.foods.clear();
    this.state.coins.clear();
    this.state.particles.clear();
    this.state.powerups.clear();
    this.state.myId = null;
    this.state.spectateId = null;
    this.state.startTime = performance.now();
    if (this.state.gameMode === "time-attack") {
      this.state.timeRemaining = 180; // 3 minutes
    } else {
      this.state.timeRemaining = undefined;
    }
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
    // Generate Powerups
    this.initPowerups();

    // Generate Bots
    for (let i = 0; i < this.targetBotCount; i++) {
      this.spawnBot(i);
    }
  }

  private initPowerups() {
    for (let i = 0; i < POWERUP_COUNT; i++) {
      const id = `powerup-${i}`;
      const rand = Math.random();
      const type =
        rand > 0.66 ? "magnet" : rand > 0.33 ? "speed" : "invincible";
      const radius = 20;

      this.state.powerups.set(id, {
        id,
        x: randRange(radius, WORLD_SIZE - radius),
        y: randRange(radius, WORLD_SIZE - radius),
        radius,
        type,
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
      value: COIN_VALUE,
    });
  }

  private spawnBot(index: number) {
    const id = `bot-${index}-${Math.random().toString(36).substr(2, 4)}`; // Unique ID
    const startX = randRange(100, WORLD_SIZE - 100);
    const startY = randRange(100, WORLD_SIZE - 100);

    // Use selected difficulty
    const difficulty = this.currentBotDifficulty;

    let namePrefix = "Bot";
    if (difficulty === "nightmare") namePrefix = "ELITE";
    else if (difficulty === "hard") namePrefix = "Pro";
    else if (difficulty === "easy") namePrefix = "Noob";

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
      kills: 0,
      activePowerups: {},
    };

    // Initialize body
    for (let i = 0; i < INITIAL_SNAKE_LENGTH * SEGMENT_DISTANCE; i += 5) {
      bot.body.push({ x: startX, y: startY });
    }

    this.state.snakes.set(id, bot);
  }

  public spawnPlayer(
    name: string,
    skin: SnakeSkin,
    country: string = "WW",
    activeTrail: string | null = null,
  ): string {
    const id = "player-1";
    const startX = randRange(WORLD_SIZE / 4, WORLD_SIZE * 0.75);
    const startY = randRange(WORLD_SIZE / 4, WORLD_SIZE * 0.75);

    const player: Snake = {
      id,
      name: name || "You",
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
      kills: 0,
      activePowerups: {},
    };

    // Initialize body history
    for (let i = 0; i < INITIAL_SNAKE_LENGTH * SEGMENT_DISTANCE; i += 5) {
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
      const diffConfig =
        snake.isBot && snake.difficulty
          ? BOT_DIFFICULTIES[snake.difficulty]
          : { speedMult: 1, turnSpeedMult: 1 };

      // Smooth Turning
      let diff = snake.targetAngle - snake.angle;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;

      const isEffectiveBoost = snake.isBoosting && snake.length > 5;
      const turnMult = isEffectiveBoost ? 0.7 : 1.0; // Slightly wider turns when boosting
      const effectiveTurnSpeed =
        TURN_SPEED * diffConfig.turnSpeedMult * turnMult;
      snake.angle +=
        Math.sign(diff) * Math.min(Math.abs(diff), effectiveTurnSpeed * dt);

      // POWERUP INTERACTIONS
      const head = snake.body[0];
      const nowMs = Date.now();

      this.state.powerups.forEach((powerup) => {
        if (distance(head, powerup) < powerup.radius + 15) {
          // Collect powerup
          if (powerup.type === "magnet") {
            snake.activePowerups.magnet = nowMs + 10000;
            if (snake.id === this.state.myId) audioService.playMagnet();
          }
          if (powerup.type === "speed")
            snake.activePowerups.speed = nowMs + 5000;
          if (powerup.type === "invincible")
            snake.activePowerups.invincible = nowMs + 8000;
          if (powerup.type === "ghost")
            snake.activePowerups.ghost = nowMs + 8000;

          if (snake.id === this.state.myId) {
            audioService.playLevelUp(); // Reusing level up sound for powerup
            this.spawnParticle(head.x, head.y, "#ffffff", 30, "neon");
          }

          this.state.powerups.delete(powerup.id);

          // Respawn powerup
          setTimeout(() => {
            const id = `powerup-${Math.random()}`;
            const rand = Math.random();
            const type =
              rand > 0.75
                ? "magnet"
                : rand > 0.5
                  ? "speed"
                  : rand > 0.25
                    ? "invincible"
                    : "ghost";
            this.state.powerups.set(id, {
              id,
              x: randRange(20, WORLD_SIZE - 20),
              y: randRange(20, WORLD_SIZE - 20),
              radius: 20,
              type,
            });
          }, 10000);
        }
      });

      // Calculate speed (Base + Boost) * Difficulty * Powerup
      let targetSpeed = isEffectiveBoost ? BOOST_SPEED : BASE_SPEED;
      if (snake.activePowerups.speed && snake.activePowerups.speed > nowMs) {
        targetSpeed *= 1.5;
      }
      targetSpeed *= diffConfig.speedMult;

      // Smooth acceleration and deceleration
      snake.speed += (targetSpeed - snake.speed) * 0.15 * dt;

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
      }

      // Survival Mode Drain Logic
      if (this.state.gameMode === "survival" && !snake.isBot) {
        if (Math.random() < 0.02) {
          snake.length -= 0.05;
          if (snake.length < 5) {
            this.killSnake(snake);
          }
        }
      }

      if (isEffectiveBoost) {
        // Determine effective trail style
        let trailStyle: string = snake.skin.trailStyle || "none";
        if (snake.activeTrail && snake.activeTrail.startsWith("trail_")) {
          const styleName = snake.activeTrail.replace("trail_", "");
          if (["hearts", "money"].includes(styleName)) {
            trailStyle = styleName as any;
          }
        }

        // Boost Trail Particles
        if (trailStyle !== "none") {
          const particlesPerFrame = 2;
          for (let i = 0; i < particlesPerFrame; i++) {
            const pid = Math.random().toString(36).substr(2, 9);
            const emitIndex = Math.min(snake.body.length - 1, 2);
            const emitPos = snake.body[emitIndex];

            if (emitPos) {
              const angle = snake.angle + Math.PI + randRange(-0.5, 0.5);
              const speed = randRange(2, 6);

              let pColor = snake.skin.colors[1] || snake.skin.colors[0];
              if (trailStyle === "fire")
                pColor = Math.random() > 0.5 ? "#ff3300" : "#ffcc00";
              if (trailStyle === "electric")
                pColor = Math.random() > 0.5 ? "#00ffff" : "#ffffff";
              if (trailStyle === "cosmic")
                pColor = Math.random() > 0.5 ? "#ff00ff" : "#00ffff";
              if (trailStyle === "hearts") pColor = "#ff0066";
              if (trailStyle === "money") pColor = "#00ff00";

              this.state.particles.set(pid, {
                id: pid,
                x: emitPos.x + randRange(-5, 5),
                y: emitPos.y + randRange(-5, 5),
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: randRange(0.4, 0.8),
                color: pColor,
                size: randRange(4, 9),
                style: trailStyle as any,
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
      if (
        newHead.x < 0 ||
        newHead.x > WORLD_SIZE ||
        newHead.y < 0 ||
        newHead.y > WORLD_SIZE
      ) {
        snake.angle += Math.PI;
        snake.targetAngle = snake.angle;
        newHead.x = Math.max(0, Math.min(WORLD_SIZE, newHead.x));
        newHead.y = Math.max(0, Math.min(WORLD_SIZE, newHead.y));

        if (snake.id === this.state.myId) {
          audioService.playHit();
          this.spawnParticle(newHead.x, newHead.y, "#ff0000", 20, "fire");
        }
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
    const currentBots = Array.from(this.state.snakes.values()).filter(
      (s) => s.isBot,
    );
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

    // Time Attack Logic
    if (
      this.state.gameMode === "time-attack" &&
      this.state.timeRemaining !== undefined
    ) {
      this.state.timeRemaining -= dt * 0.01666; // dt is in 16.66ms units
      if (this.state.timeRemaining <= 0) {
        this.state.timeRemaining = 0;
        const mySnake = this.getMySnake();
        if (mySnake && !mySnake.isDead) {
          this.killSnake(mySnake);
        }
      }
    }
  }

  private updateBotAI(bot: Snake) {
    const head = bot.body[0];
    const diffConfig = bot.difficulty
      ? BOT_DIFFICULTIES[bot.difficulty]
      : BOT_DIFFICULTIES.medium;

    // 1. Boundary Avoidance
    const margin = 300;
    if (
      head.x < margin ||
      head.x > WORLD_SIZE - margin ||
      head.y < margin ||
      head.y > WORLD_SIZE - margin
    ) {
      const centerAngle = Math.atan2(
        WORLD_SIZE / 2 - head.y,
        WORLD_SIZE / 2 - head.x,
      );
      bot.targetAngle = centerAngle;
      bot.isBoosting = true;
      return;
    }

    // 2. Collision Avoidance
    let avoidanceVector = { x: 0, y: 0 };
    let threatDetected = false;
    const detectionRadius = diffConfig.detectionRadius;

    this.state.snakes.forEach((other) => {
      if (other.id === bot.id || other.isDead) return;

      const distToHead = distance(head, other.body[0]);

      if (distToHead < detectionRadius) {
        threatDetected = true;
        avoidanceVector.x -= other.body[0].x - head.x;
        avoidanceVector.y -= other.body[0].y - head.y;
      }

      // Harder bots check more segments
      const segmentStep =
        bot.difficulty === "nightmare" ? 3 : bot.difficulty === "hard" ? 5 : 10;

      for (let i = 0; i < other.body.length; i += segmentStep) {
        const seg = other.body[i];
        const d = distance(head, seg);
        if (d < detectionRadius) {
          threatDetected = true;
          avoidanceVector.x -= seg.x - head.x;
          avoidanceVector.y -= seg.y - head.y;
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
    const maxScans =
      bot.difficulty === "nightmare"
        ? 100
        : bot.difficulty === "easy"
          ? 20
          : 50;

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
      bot.targetAngle = Math.atan2(
        targetFood.y - head.y,
        targetFood.x - head.x,
      );
      bot.isBoosting =
        targetFood.value > 1 &&
        distance(head, targetFood) < 300 &&
        Math.random() < diffConfig.boostChance;
    } else {
      if (Math.random() < 0.02) {
        bot.targetAngle += randRange(-0.5, 0.5);
      }
      bot.isBoosting = false;
    }
  }

  private checkCollisions(snake: Snake) {
    const head = snake.body[0];
    const headRadius = 10 + snake.length / 10;

    // 1. Food Collision
    const nowMs = Date.now();
    const isMagnetActive =
      snake.activePowerups.magnet && snake.activePowerups.magnet > nowMs;
    const magnetRadius = isMagnetActive ? 200 : 0;

    this.state.foods.forEach((food, id) => {
      const dist = distance(head, food);

      // Magnet Effect
      if (isMagnetActive && dist < magnetRadius) {
        const angle = Math.atan2(head.y - food.y, head.x - food.x);
        food.x += Math.cos(angle) * 10;
        food.y += Math.sin(angle) * 10;
      }

      if (dist < headRadius + food.radius + 10) {
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
    const isInvincible =
      snake.activePowerups.invincible &&
      snake.activePowerups.invincible > nowMs;
    const isGhost =
      snake.activePowerups.ghost && snake.activePowerups.ghost > nowMs;
    let nearMiss = false;

    this.state.snakes.forEach((other) => {
      if (other.isDead) return;
      if (other.id === snake.id) return;

      const otherIsGhost =
        other.activePowerups.ghost && other.activePowerups.ghost > nowMs;
      if (isGhost || otherIsGhost) return; // Pass through if either is ghost

      const otherHead = other.body[0];
      if (distance(head, otherHead) > 1000) return;

      let collision = false;
      for (let i = 0; i < other.body.length; i += 2) {
        const seg = other.body[i];
        const dist = distance(head, seg);

        if (
          dist < headRadius + 40 &&
          snake.id === this.state.myId &&
          !isInvincible
        ) {
          nearMiss = true;
        }

        if (dist < headRadius + 8) {
          collision = true;
          break;
        }
      }

      if (collision && !isInvincible) {
        this.killSnake(snake);
        other.kills += 1; // The other snake gets the kill
      } else if (collision && isInvincible) {
        // If invincible, kill the other snake instead if we hit their body
        this.killSnake(other);
        snake.kills += 1; // This snake gets the kill
      }
    });

    if (nearMiss && Math.random() < 0.1) {
      this.spawnParticle(head.x, head.y, "#ffff00", 10, "electric");
    }
  }

  public killSnake(snake: Snake) {
    snake.isDead = true;
    if (snake.id === this.state.myId) {
      audioService.playDie();
      audioService.stopBoost();
      this.wasBoosting = false;
    }

    // VISUALLY APPEALING SCATTERED DISTRIBUTION
    for (let i = 0; i < snake.body.length; i += 3) {
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
    const particleStyle = snake.isBot
      ? "glitch"
      : snake.skin.trailStyle === "none"
        ? "neon"
        : snake.skin.trailStyle;

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * (snake.isBot ? 10 : 8);

      let color = snake.skin.colors[0];
      // Bot death colors (Matrix Green/White glitch)
      if (snake.isBot) {
        const r = Math.random();
        if (r < 0.6) color = "#00ff00";
        else if (r < 0.8) color = "#ffffff";
        else color = "#003300";
      }

      this.spawnParticle(
        head.x,
        head.y,
        color,
        Math.random() * 6 + 2,
        particleStyle as any,
        angle,
        speed,
        randRange(0.8, 1.4),
      );
    }

    if (snake.id !== this.state.myId) {
      this.state.snakes.delete(snake.id);
    }
  }

  private spawnParticle(
    x: number,
    y: number,
    color: string,
    size: number,
    style: any,
    angle?: number,
    speed?: number,
    life?: number,
  ) {
    const pid = Math.random().toString();
    const pAngle = angle !== undefined ? angle : Math.random() * Math.PI * 2;
    const pSpeed = speed !== undefined ? speed : Math.random() * 5 + 2;

    this.state.particles.set(pid, {
      id: pid,
      x: x,
      y: y,
      vx: Math.cos(pAngle) * pSpeed,
      vy: Math.sin(pAngle) * pSpeed,
      life: life !== undefined ? life : randRange(0.5, 1.0),
      color: color,
      size: size,
      style: style,
    });
  }

  public getMySnake(): Snake | undefined {
    return this.state.snakes.get(this.state.myId || "");
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
      .filter((s) => !s.isDead)
      .sort((a, b) => b.score - a.score)[0];

    if (bestCandidate) {
      this.state.spectateId = bestCandidate.id;
      return bestCandidate;
    }

    this.state.spectateId = null;
    return undefined;
  }

  public cycleSpectateTarget(direction: 1 | -1) {
    const aliveSnakes = Array.from(this.state.snakes.values())
      .filter((s) => !s.isDead)
      .sort((a, b) => b.score - a.score);

    if (aliveSnakes.length === 0) {
      this.state.spectateId = null;
      return;
    }

    if (!this.state.spectateId) {
      this.state.spectateId = aliveSnakes[0].id;
      return;
    }

    const currentIndex = aliveSnakes.findIndex(
      (s) => s.id === this.state.spectateId,
    );
    if (currentIndex === -1) {
      this.state.spectateId = aliveSnakes[0].id;
      return;
    }

    let nextIndex = currentIndex + direction;
    if (nextIndex >= aliveSnakes.length) nextIndex = 0;
    if (nextIndex < 0) nextIndex = aliveSnakes.length - 1;

    this.state.spectateId = aliveSnakes[nextIndex].id;
  }
}
