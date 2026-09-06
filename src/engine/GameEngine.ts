import { LevelDef, PlatformRect } from '../data/levels';
import { WeaponDef, WEAPONS } from '../data/weapons';
import { soundService } from '../services/soundService';

export interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  color: string;
  glowColor: string;
  fromPlayer: boolean;
  pierceLeft: number;
  bounceLeft: number;
  isHoming: boolean;
  splashRadius: number;
  chainLeft: number;
  hitIds: Set<string>;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface FloatingText {
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  alpha: number;
}

export interface ActiveEnemy {
  id: string;
  type: 'patrol' | 'drone' | 'sentinel' | 'turret';
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  hp: number;
  maxHp: number;
  patrolMinX: number;
  patrolMaxX: number;
  shootCooldown: number;
  facingRight: boolean;
}

export interface ActiveBoss {
  name: string;
  title: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
  maxHp: number;
  color: string;
  accentColor: string;
  attackPattern: 'spread' | 'ring' | 'homing' | 'laser' | 'combo';
  phase: 1 | 2;
  attackCooldown: number;
  active: boolean;
  defeated: boolean;
}

export interface GameStats {
  enemiesDefeated: number;
  shotsFired: number;
  damageDealt: number;
  timeElapsedSec: number;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private level: LevelDef;
  private currentWeapon: WeaponDef;
  private unlockedWeaponIds: number[];

  // Player state
  public player = {
    x: 140,
    y: 690,
    vx: 0,
    vy: 0,
    w: 34,
    h: 50,
    hp: 100,
    maxHp: 100,
    shield: 0,
    grounded: false,
    coyoteTimer: 0,
    jumpsLeft: 2,
    facingRight: true,
    aimAngle: 0,
    invulnTimer: 0,
    lastShootTime: 0,
    dead: false
  };

  // Checkpoint state
  public activeCheckpointId: string = '';
  private checkpointPos = { x: 140, y: 690 };

  // World entities
  private projectiles: Projectile[] = [];
  private particles: Particle[] = [];
  private floatingTexts: FloatingText[] = [];
  private enemies: ActiveEnemy[] = [];
  public boss: ActiveBoss;

  // Puzzles state
  public activatedSwitches: Set<string> = new Set();
  public openGates: Set<string> = new Set();

  // Camera & Input
  private camera = { x: 0, y: 0, shake: 0 };
  private keys: Record<string, boolean> = {};
  private mouse = { x: 0, y: 0, worldX: 0, worldY: 0, down: false };

  // Callbacks
  private onPlayerDeath: () => void;
  private onLevelComplete: (stats: GameStats) => void;
  private onHudUpdate: () => void;

  // Loop management
  private animFrameId: number | null = null;
  private isPaused: boolean = false;
  private stats: GameStats = {
    enemiesDefeated: 0,
    shotsFired: 0,
    damageDealt: 0,
    timeElapsedSec: 0
  };
  private lastTickTime: number = performance.now();

  constructor(
    canvas: HTMLCanvasElement,
    level: LevelDef,
    initialWeaponId: number,
    unlockedWeaponIds: number[],
    onPlayerDeath: () => void,
    onLevelComplete: (stats: GameStats) => void,
    onHudUpdate: () => void
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.level = level;
    this.unlockedWeaponIds = unlockedWeaponIds;
    this.currentWeapon = WEAPONS.find((w) => w.id === initialWeaponId) || WEAPONS[0];
    this.onPlayerDeath = onPlayerDeath;
    this.onLevelComplete = onLevelComplete;
    this.onHudUpdate = onHudUpdate;

    // Initialize player at start
    this.player.x = level.playerStart.x;
    this.player.y = level.playerStart.y;
    this.checkpointPos = { x: level.playerStart.x, y: level.playerStart.y };
    this.activeCheckpointId = level.checkpoints[0]?.id || 'start';

    // Initialize enemies
    this.enemies = level.enemies.map((e) => {
      const baseHp = e.type === 'sentinel' ? 95 : e.type === 'turret' ? 80 : 55;
      const scaledHp = Math.round(baseHp * (1 + (level.id - 1) * 0.12));
      return {
        id: e.id,
        type: e.type,
        x: e.x,
        y: e.y,
        vx: e.type === 'patrol' || e.type === 'sentinel' ? 1.8 : 0,
        vy: 0,
        w: e.type === 'sentinel' ? 40 : 34,
        h: e.type === 'drone' ? 32 : 46,
        hp: scaledHp,
        maxHp: scaledHp,
        patrolMinX: e.patrolMinX || e.x - 120,
        patrolMaxX: e.patrolMaxX || e.x + 120,
        shootCooldown: Math.random() * 80 + 60,
        facingRight: false
      };
    });

    // Initialize Boss
    this.boss = {
      name: level.boss.name,
      title: level.boss.title,
      x: level.boss.x,
      y: level.boss.y,
      vx: 0,
      vy: 0,
      radius: level.boss.radius,
      hp: level.boss.maxHealth,
      maxHp: level.boss.maxHealth,
      color: level.boss.color,
      accentColor: level.boss.accentColor,
      attackPattern: level.boss.attackPattern,
      phase: 1,
      attackCooldown: 90,
      active: false,
      defeated: false
    };

    this.setupListeners();
  }

  private setupListeners() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mouseup', this.handleMouseUp);
  }

  public destroy() {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
    }
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    window.removeEventListener('mouseup', this.handleMouseUp);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    this.keys[e.code] = true;

    // Jump trigger on Space or W or ArrowUp
    if ((e.code === 'Space' || e.code === 'KeyW' || e.code === 'ArrowUp') && !this.isPaused && !this.player.dead) {
      if (this.player.grounded || this.player.coyoteTimer > 0) {
        this.player.vy = -12.4;
        this.player.grounded = false;
        this.player.coyoteTimer = 0;
        this.player.jumpsLeft = 1;
        soundService.playJump();
        this.spawnParticles(this.player.x + this.player.w / 2, this.player.y + this.player.h, '#38BDF8', 8);
      } else if (this.player.jumpsLeft > 0) {
        this.player.vy = -11.2;
        this.player.jumpsLeft--;
        soundService.playJump();
        this.spawnParticles(this.player.x + this.player.w / 2, this.player.y + this.player.h, '#A855F7', 10);
      }
    }

    // Interact with E
    if (e.code === 'KeyE' && !this.isPaused && !this.player.dead) {
      this.checkSwitchManualInteraction();
    }

    // Weapon hotkeys 1 - 0
    if (e.code.startsWith('Digit')) {
      const digit = parseInt(e.code.replace('Digit', ''), 10);
      const weaponId = digit === 0 ? 10 : digit;
      if (this.unlockedWeaponIds.includes(weaponId)) {
        this.setWeapon(weaponId);
      }
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keys[e.code] = false;
  };

  private handleMouseMove = (e: MouseEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    this.mouse.x = (e.clientX - rect.left) * scaleX;
    this.mouse.y = (e.clientY - rect.top) * scaleY;
  };

  private handleMouseDown = (e: MouseEvent) => {
    if (e.button === 0) {
      this.mouse.down = true;
    }
  };

  private handleMouseUp = (e: MouseEvent) => {
    if (e.button === 0) {
      this.mouse.down = false;
    }
  };

  public setWeapon(weaponId: number) {
    const found = WEAPONS.find((w) => w.id === weaponId);
    if (found) {
      this.currentWeapon = found;
      this.onHudUpdate();
    }
  }

  public getWeapon(): WeaponDef {
    return this.currentWeapon;
  }

  public setPaused(paused: boolean) {
    this.isPaused = paused;
    this.lastTickTime = performance.now();
  }

  public revivePlayer() {
    this.player.dead = false;
    this.player.hp = Math.round(this.player.maxHp * 0.65);
    this.player.x = this.checkpointPos.x;
    this.player.y = this.checkpointPos.y - 20;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.invulnTimer = 180; // 3 seconds of shield invulnerability
    this.projectiles = [];
    this.isPaused = false;
    this.spawnParticles(this.player.x + 17, this.player.y + 25, '#34D399', 26);
    this.addFloatingText(this.player.x, this.player.y - 20, 'REVIVED +SHIELD!', '#34D399');
    this.onHudUpdate();
  }

  public start() {
    this.lastTickTime = performance.now();
    const loop = (now: number) => {
      const dt = (now - this.lastTickTime) / 1000;
      this.lastTickTime = now;

      if (!this.isPaused) {
        this.stats.timeElapsedSec += dt;
        this.update();
      }
      this.render();
      this.animFrameId = requestAnimationFrame(loop);
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  private update() {
    if (this.player.dead) return;

    // 1. Player horizontal movement
    const moveSpeed = 5.4;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) {
      this.player.vx = -moveSpeed;
      this.player.facingRight = false;
    } else if (this.keys['KeyD'] || this.keys['ArrowRight']) {
      this.player.vx = moveSpeed;
      this.player.facingRight = true;
    } else {
      this.player.vx *= 0.78;
    }

    // Gravity
    this.player.vy += 0.56;
    if (this.player.vy > 14) this.player.vy = 14;

    // Update world mouse coordinates & player aim angle
    this.mouse.worldX = this.mouse.x + this.camera.x;
    this.mouse.worldY = this.mouse.y + this.camera.y;
    const playerCenterX = this.player.x + this.player.w / 2;
    const playerCenterY = this.player.y + this.player.h / 2;
    this.player.aimAngle = Math.atan2(this.mouse.worldY - playerCenterY, this.mouse.worldX - playerCenterX);
    this.player.facingRight = Math.cos(this.player.aimAngle) >= 0;

    // Shooting weapon
    const now = performance.now();
    if (this.mouse.down && now - this.player.lastShootTime >= this.currentWeapon.fireRateMs) {
      this.fireWeapon();
      this.player.lastShootTime = now;
    }

    // Apply player X velocity & check collisions
    this.player.x += this.player.vx;
    this.resolvePlayerCollisionsX();

    // Apply player Y velocity & check collisions
    this.player.y += this.player.vy;
    this.player.grounded = false;
    this.resolvePlayerCollisionsY();

    if (this.player.grounded) {
      this.player.coyoteTimer = 7;
      this.player.jumpsLeft = 2;
    } else if (this.player.coyoteTimer > 0) {
      this.player.coyoteTimer--;
    }

    if (this.player.invulnTimer > 0) {
      this.player.invulnTimer--;
    }

    // Check checkpoints
    for (const cp of this.level.checkpoints) {
      const dist = Math.hypot(playerCenterX - cp.x, playerCenterY - cp.y);
      if (dist < 65 && this.activeCheckpointId !== cp.id) {
        this.activeCheckpointId = cp.id;
        this.checkpointPos = { x: cp.x, y: cp.y - 50 };
        soundService.playCheckpoint();
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + 25);
        this.spawnParticles(cp.x, cp.y - 20, '#38BDF8', 20);
        this.addFloatingText(cp.x, cp.y - 45, 'CHECKPOINT SAVED +25 HP', '#38BDF8');
        this.onHudUpdate();
      }
    }

    // Activate boss when player enters arena
    if (!this.boss.active && !this.boss.defeated && this.player.x > 2460) {
      this.boss.active = true;
      soundService.playBossSpawn();
      this.camera.shake = 12;
      this.addFloatingText(this.boss.x, this.boss.y - 70, `${this.boss.name} AWAKENS!`, '#F43F5E');
      this.onHudUpdate();
    }

    // Update Projectiles
    this.updateProjectiles();

    // Update Enemies
    this.updateEnemies(playerCenterX, playerCenterY);

    // Update Boss
    if (this.boss.active && !this.boss.defeated) {
      this.updateBoss(playerCenterX, playerCenterY);
    }

    // Update Particles & Floating Text
    this.updateParticles();

    // Update Camera
    const targetCamX = Math.max(0, Math.min(this.level.worldWidth - this.canvas.width, playerCenterX - this.canvas.width / 2 + Math.cos(this.player.aimAngle) * 75));
    const targetCamY = Math.max(0, Math.min(this.level.worldHeight - this.canvas.height, playerCenterY - this.canvas.height / 2));
    this.camera.x += (targetCamX - this.camera.x) * 0.1;
    this.camera.y += (targetCamY - this.camera.y) * 0.1;

    if (this.camera.shake > 0) {
      this.camera.shake *= 0.88;
      if (this.camera.shake < 0.4) this.camera.shake = 0;
    }
  }

  private resolvePlayerCollisionsX() {
    const obstacles = this.getSolidObstacles();
    for (const plat of obstacles) {
      if (this.aabbOverlap(this.player.x, this.player.y, this.player.w, this.player.h, plat.x, plat.y, plat.w, plat.h)) {
        if (this.player.vx > 0) {
          this.player.x = plat.x - this.player.w;
        } else if (this.player.vx < 0) {
          this.player.x = plat.x + plat.w;
        }
        this.player.vx = 0;
      }
    }
  }

  private resolvePlayerCollisionsY() {
    const obstacles = this.getSolidObstacles();
    for (const plat of obstacles) {
      if (this.aabbOverlap(this.player.x, this.player.y, this.player.w, this.player.h, plat.x, plat.y, plat.w, plat.h)) {
        if (plat.type === 'hazard') {
          this.damagePlayer(18);
          this.player.vy = -10.5;
          return;
        }
        if (plat.type === 'jumppad') {
          this.player.y = plat.y - this.player.h;
          this.player.vy = -17.5;
          soundService.playJump();
          this.spawnParticles(this.player.x + 17, plat.y, '#38BDF8', 15);
          return;
        }

        if (this.player.vy > 0) {
          this.player.y = plat.y - this.player.h;
          this.player.vy = 0;
          this.player.grounded = true;
        } else if (this.player.vy < 0) {
          this.player.y = plat.y + plat.h;
          this.player.vy = 0;
        }
      }
    }
  }

  private getSolidObstacles(): PlatformRect[] {
    const list: PlatformRect[] = [...this.level.platforms];
    // Add closed Laser Gates as solid barriers
    for (const gate of this.level.gates) {
      if (!this.openGates.has(gate.id)) {
        list.push({ x: gate.x, y: gate.y, w: gate.w, h: gate.h, type: 'solid' });
      }
    }
    return list;
  }

  private fireWeapon() {
    const w = this.currentWeapon;
    soundService.playShoot(w.soundPitch);
    this.stats.shotsFired++;

    const barrelX = this.player.x + this.player.w / 2 + Math.cos(this.player.aimAngle) * 24;
    const barrelY = this.player.y + this.player.h / 2 + Math.sin(this.player.aimAngle) * 24;

    const count = w.projectileCount;
    const spreadRad = (w.spreadAngleDeg * Math.PI) / 180;

    for (let i = 0; i < count; i++) {
      let angle = this.player.aimAngle;
      if (count > 1) {
        angle += -spreadRad / 2 + (spreadRad / (count - 1)) * i;
      }

      this.projectiles.push({
        x: barrelX,
        y: barrelY,
        vx: Math.cos(angle) * w.projectileSpeed,
        vy: Math.sin(angle) * w.projectileSpeed,
        radius: w.projectileRadius,
        damage: w.damage,
        color: w.color,
        glowColor: w.glowColor,
        fromPlayer: true,
        pierceLeft: w.pierceCount,
        bounceLeft: w.bounceCount,
        isHoming: w.isHoming,
        splashRadius: w.splashRadius,
        chainLeft: w.chainCount,
        hitIds: new Set()
      });
    }

    this.spawnParticles(barrelX, barrelY, w.color, 5);
  }

  private updateProjectiles() {
    const solidPlats = this.getSolidObstacles();

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];

      // Homing logic for player missiles
      if (p.fromPlayer && p.isHoming) {
        let closestTarget: { x: number; y: number } | null = null;
        let bestDist = 420;

        for (const e of this.enemies) {
          const d = Math.hypot(e.x + e.w / 2 - p.x, e.y + e.h / 2 - p.y);
          if (d < bestDist) {
            bestDist = d;
            closestTarget = { x: e.x + e.w / 2, y: e.y + e.h / 2 };
          }
        }
        if (this.boss.active && !this.boss.defeated) {
          const d = Math.hypot(this.boss.x - p.x, this.boss.y - p.y);
          if (d < bestDist) {
            closestTarget = { x: this.boss.x, y: this.boss.y };
          }
        }

        if (closestTarget) {
          const desiredAngle = Math.atan2(closestTarget.y - p.y, closestTarget.x - p.x);
          const currentAngle = Math.atan2(p.vy, p.vx);
          const speed = Math.hypot(p.vx, p.vy);
          let diff = desiredAngle - currentAngle;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          const newAngle = currentAngle + Math.sign(diff) * Math.min(Math.abs(diff), 0.08);
          p.vx = Math.cos(newAngle) * speed;
          p.vy = Math.sin(newAngle) * speed;
        }
      }

      p.x += p.vx;
      p.y += p.vy;

      // Check puzzle switches hit by player projectiles
      if (p.fromPlayer) {
        for (const sw of this.level.switches) {
          if (!this.activatedSwitches.has(sw.id)) {
            const d = Math.hypot(p.x - sw.x, p.y - sw.y);
            if (d < 26) {
              this.activateSwitch(sw.id, sw.targetGateId);
              this.spawnParticles(sw.x, sw.y, '#34D399', 18);
            }
          }
        }
      }

      // Check wall collisions / bounces
      let hitWall = false;
      for (const plat of solidPlats) {
        if (p.x + p.radius > plat.x && p.x - p.radius < plat.x + plat.w && p.y + p.radius > plat.y && p.y - p.radius < plat.y + plat.h) {
          if (p.bounceLeft > 0) {
            p.bounceLeft--;
            // Determine bounce axis
            const prevX = p.x - p.vx;
            if (prevX + p.radius <= plat.x || prevX - p.radius >= plat.x + plat.w) {
              p.vx = -p.vx;
            } else {
              p.vy = -p.vy;
            }
            this.spawnParticles(p.x, p.y, p.color, 4);
          } else {
            hitWall = true;
          }
          break;
        }
      }

      if (hitWall) {
        if (p.splashRadius > 0 && p.fromPlayer) {
          this.triggerSplashDamage(p.x, p.y, p.splashRadius, p.damage * 0.65, p.color);
        }
        this.spawnParticles(p.x, p.y, p.color, 6);
        this.projectiles.splice(i, 1);
        continue;
      }

      // Check Player hit by Enemy/Boss projectile
      if (!p.fromPlayer) {
        if (
          this.aabbOverlap(
            p.x - p.radius,
            p.y - p.radius,
            p.radius * 2,
            p.radius * 2,
            this.player.x,
            this.player.y,
            this.player.w,
            this.player.h
          )
        ) {
          this.damagePlayer(p.damage);
          this.spawnParticles(p.x, p.y, '#F43F5E', 8);
          this.projectiles.splice(i, 1);
          continue;
        }
      } else {
        // Player projectile hitting enemies
        let destroyed = false;
        for (let eIdx = this.enemies.length - 1; eIdx >= 0; eIdx--) {
          const e = this.enemies[eIdx];
          if (!p.hitIds.has(e.id) && this.aabbOverlap(p.x - p.radius, p.y - p.radius, p.radius * 2, p.radius * 2, e.x, e.y, e.w, e.h)) {
            p.hitIds.add(e.id);
            this.damageEnemy(e, p.damage, p.color);

            if (p.splashRadius > 0) {
              this.triggerSplashDamage(p.x, p.y, p.splashRadius, p.damage * 0.55, p.color);
            }

            if (p.pierceLeft > 0) {
              p.pierceLeft--;
            } else {
              destroyed = true;
              break;
            }
          }
        }

        // Player projectile hitting Boss
        if (!destroyed && this.boss.active && !this.boss.defeated) {
          const distBoss = Math.hypot(p.x - this.boss.x, p.y - this.boss.y);
          if (distBoss < this.boss.radius + p.radius) {
            this.damageBoss(p.damage, p.color);
            if (p.splashRadius > 0) {
              this.triggerSplashDamage(p.x, p.y, p.splashRadius, p.damage * 0.5, p.color);
            }
            if (p.pierceLeft > 0) {
              p.pierceLeft--;
            } else {
              destroyed = true;
            }
          }
        }

        if (destroyed) {
          this.projectiles.splice(i, 1);
          continue;
        }
      }

      // Out of bounds cleanup
      if (p.x < -100 || p.x > this.level.worldWidth + 100 || p.y < -100 || p.y > this.level.worldHeight + 100) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  private triggerSplashDamage(x: number, y: number, radius: number, dmg: number, color: string) {
    this.spawnParticles(x, y, color, 18);
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      const dist = Math.hypot(e.x + e.w / 2 - x, e.y + e.h / 2 - y);
      if (dist <= radius) {
        this.damageEnemy(e, Math.round(dmg), color);
      }
    }
    if (this.boss.active && !this.boss.defeated) {
      const dist = Math.hypot(this.boss.x - x, this.boss.y - y);
      if (dist <= radius + this.boss.radius) {
        this.damageBoss(Math.round(dmg), color);
      }
    }
  }

  private checkSwitchManualInteraction() {
    const px = this.player.x + this.player.w / 2;
    const py = this.player.y + this.player.h / 2;
    for (const sw of this.level.switches) {
      if (!this.activatedSwitches.has(sw.id)) {
        const d = Math.hypot(px - sw.x, py - sw.y);
        if (d < 70) {
          this.activateSwitch(sw.id, sw.targetGateId);
          this.spawnParticles(sw.x, sw.y, '#34D399', 22);
        }
      }
    }
  }

  private activateSwitch(switchId: string, targetGateId: string) {
    this.activatedSwitches.add(switchId);
    soundService.playSwitchActivate();

    // Check if target gate has all required switches active
    const targetGate = this.level.gates.find((g) => g.id === targetGateId);
    if (targetGate) {
      const activeForGate = this.level.switches.filter((s) => s.targetGateId === targetGateId && this.activatedSwitches.has(s.id)).length;
      if (activeForGate >= targetGate.requiredSwitches) {
        this.openGates.add(targetGateId);
        this.camera.shake = 8;
        this.addFloatingText(targetGate.x, targetGate.y - 20, 'LASER BARRIER DEACTIVATED!', '#34D399');
      } else {
        this.addFloatingText(
          this.player.x,
          this.player.y - 30,
          `NODE ONLINE (${activeForGate}/${targetGate.requiredSwitches})`,
          '#38BDF8'
        );
      }
    }
    this.onHudUpdate();
  }

  private updateEnemies(playerX: number, playerY: number) {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];

      // Patrol movement
      if (e.type === 'patrol' || e.type === 'sentinel') {
        e.x += e.vx;
        if (e.x <= e.patrolMinX) {
          e.x = e.patrolMinX;
          e.vx = Math.abs(e.vx);
          e.facingRight = true;
        } else if (e.x >= e.patrolMaxX) {
          e.x = e.patrolMaxX;
          e.vx = -Math.abs(e.vx);
          e.facingRight = false;
        }
      } else if (e.type === 'drone') {
        // Hover sine wave + gentle chase
        e.y += Math.sin(performance.now() * 0.004 + i) * 0.8;
        const dist = Math.hypot(playerX - e.x, playerY - e.y);
        if (dist < 460) {
          e.x += Math.sign(playerX - e.x) * 1.4;
          e.facingRight = playerX > e.x;
        }
      }

      // Shooting logic if within range
      const distToPlayer = Math.hypot(playerX - (e.x + e.w / 2), playerY - (e.y + e.h / 2));
      if (distToPlayer < 520) {
        e.shootCooldown--;
        if (e.shootCooldown <= 0) {
          const angle = Math.atan2(playerY - (e.y + e.h / 2), playerX - (e.x + e.w / 2));
          this.projectiles.push({
            x: e.x + e.w / 2,
            y: e.y + e.h / 2,
            vx: Math.cos(angle) * 6.5,
            vy: Math.sin(angle) * 6.5,
            radius: 5,
            damage: 14,
            color: '#F43F5E',
            glowColor: 'rgba(244, 63, 94, 0.7)',
            fromPlayer: false,
            pierceLeft: 0,
            bounceLeft: 0,
            isHoming: false,
            splashRadius: 0,
            chainLeft: 0,
            hitIds: new Set()
          });
          e.shootCooldown = e.type === 'turret' ? 65 : 105;
        }
      }

      // Contact damage
      if (this.aabbOverlap(this.player.x, this.player.y, this.player.w, this.player.h, e.x, e.y, e.w, e.h)) {
        this.damagePlayer(15);
      }
    }
  }

  private updateBoss(playerX: number, playerY: number) {
    const b = this.boss;

    // Hover & pursue movement
    const targetY = 560 + Math.sin(performance.now() * 0.003) * 75;
    b.y += (targetY - b.y) * 0.04;

    const desiredX = playerX > b.x ? Math.min(3250, playerX - 240) : Math.max(2640, playerX + 240);
    b.x += (desiredX - b.x) * 0.025;

    // Phase 2 transition at 50% HP
    if (b.phase === 1 && b.hp <= b.maxHp * 0.5) {
      b.phase = 2;
      this.camera.shake = 14;
      soundService.playBossSpawn();
      this.addFloatingText(b.x, b.y - 80, 'OVERDRIVE PHASE II ENGAGED!', '#F59E0B');
    }

    b.attackCooldown--;
    if (b.attackCooldown <= 0) {
      const aimAngle = Math.atan2(playerY - b.y, playerX - b.x);

      if (b.attackPattern === 'spread' || b.attackPattern === 'combo') {
        const count = b.phase === 2 ? 7 : 5;
        for (let i = 0; i < count; i++) {
          const a = aimAngle - 0.45 + (0.9 / (count - 1)) * i;
          this.projectiles.push({
            x: b.x,
            y: b.y,
            vx: Math.cos(a) * 7.5,
            vy: Math.sin(a) * 7.5,
            radius: 7,
            damage: 18,
            color: b.accentColor,
            glowColor: 'rgba(244, 63, 94, 0.8)',
            fromPlayer: false,
            pierceLeft: 0,
            bounceLeft: 0,
            isHoming: false,
            splashRadius: 0,
            chainLeft: 0,
            hitIds: new Set()
          });
        }
      } else if (b.attackPattern === 'ring') {
        const count = b.phase === 2 ? 14 : 10;
        for (let i = 0; i < count; i++) {
          const a = (Math.PI * 2 * i) / count;
          this.projectiles.push({
            x: b.x,
            y: b.y,
            vx: Math.cos(a) * 6.2,
            vy: Math.sin(a) * 6.2,
            radius: 6,
            damage: 16,
            color: b.color,
            glowColor: b.color,
            fromPlayer: false,
            pierceLeft: 0,
            bounceLeft: 0,
            isHoming: false,
            splashRadius: 0,
            chainLeft: 0,
            hitIds: new Set()
          });
        }
      } else {
        // Laser / Rapid Burst
        for (let i = -1; i <= 1; i++) {
          this.projectiles.push({
            x: b.x,
            y: b.y,
            vx: Math.cos(aimAngle + i * 0.1) * 9.5,
            vy: Math.sin(aimAngle + i * 0.1) * 9.5,
            radius: 8,
            damage: 20,
            color: '#F59E0B',
            glowColor: 'rgba(245, 158, 11, 0.8)',
            fromPlayer: false,
            pierceLeft: 0,
            bounceLeft: 0,
            isHoming: false,
            splashRadius: 0,
            chainLeft: 0,
            hitIds: new Set()
          });
        }
      }

      b.attackCooldown = b.phase === 2 ? 52 : 78;
    }
  }

  private damageEnemy(enemy: ActiveEnemy, amount: number, color: string) {
    enemy.hp -= amount;
    soundService.playHit();
    this.stats.damageDealt += amount;
    this.addFloatingText(enemy.x + enemy.w / 2, enemy.y - 10, `-${amount}`, color);
    this.spawnParticles(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, color, 8);

    if (enemy.hp <= 0) {
      this.stats.enemiesDefeated++;
      this.spawnParticles(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, '#F43F5E', 22);
      const idx = this.enemies.indexOf(enemy);
      if (idx !== -1) this.enemies.splice(idx, 1);
    }
  }

  private damageBoss(amount: number, color: string) {
    if (this.boss.defeated) return;
    this.boss.hp -= amount;
    soundService.playHit();
    this.stats.damageDealt += amount;
    this.addFloatingText(this.boss.x + (Math.random() - 0.5) * 40, this.boss.y - 35, `-${amount}`, color);
    this.spawnParticles(this.boss.x, this.boss.y, color, 10);
    this.onHudUpdate();

    if (this.boss.hp <= 0) {
      this.boss.hp = 0;
      this.boss.defeated = true;
      this.camera.shake = 20;
      soundService.playVictory();
      this.spawnParticles(this.boss.x, this.boss.y, '#38BDF8', 55);
      this.spawnParticles(this.boss.x, this.boss.y, '#F43F5E', 45);
      this.addFloatingText(this.boss.x, this.boss.y - 60, 'BOSS ANNIHILATED!', '#34D399');

      setTimeout(() => {
        this.onLevelComplete(this.stats);
      }, 1300);
    }
  }

  private damagePlayer(amount: number) {
    if (this.player.invulnTimer > 0 || this.player.dead) return;
    this.player.hp -= amount;
    this.player.invulnTimer = 45;
    this.camera.shake = 9;
    soundService.playPlayerDamage();
    this.addFloatingText(this.player.x + 17, this.player.y - 12, `-${amount} HP`, '#EF4444');
    this.spawnParticles(this.player.x + 17, this.player.y + 25, '#EF4444', 14);
    this.onHudUpdate();

    if (this.player.hp <= 0) {
      this.player.hp = 0;
      this.player.dead = true;
      this.isPaused = true;
      this.onPlayerDeath();
    }
  }

  private spawnParticles(x: number, y: number, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 1.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 4 + 2,
        color,
        alpha: 1,
        life: 0,
        maxLife: Math.random() * 22 + 12
      });
    }
  }

  private addFloatingText(x: number, y: number, text: string, color: string) {
    this.floatingTexts.push({
      x,
      y,
      vy: -1.4,
      text,
      color,
      alpha: 1
    });
  }

  private updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.life++;
      pt.alpha = 1 - pt.life / pt.maxLife;
      if (pt.life >= pt.maxLife) {
        this.particles.splice(i, 1);
      }
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy;
      ft.alpha -= 0.02;
      if (ft.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  private aabbOverlap(x1: number, y1: number, w1: number, h1: number, x2: number, y2: number, w2: number, h2: number): boolean {
    return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
  }

  private render() {
    const ctx = this.ctx;
    const { width, height } = this.canvas;

    // 1. Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, this.level.bgGradientTop);
    grad.addColorStop(1, this.level.bgGradientBottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    const shakeX = (Math.random() - 0.5) * this.camera.shake;
    const shakeY = (Math.random() - 0.5) * this.camera.shake;
    ctx.translate(-this.camera.x + shakeX, -this.camera.y + shakeY);

    // 2. Parallax Cyber-Ruins Grid Lines
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.06)';
    ctx.lineWidth = 1;
    const gridSize = 120;
    for (let gx = 0; gx < this.level.worldWidth; gx += gridSize) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, this.level.worldHeight);
      ctx.stroke();
    }

    // 3. Draw connection beams from active switches to their gates
    for (const sw of this.level.switches) {
      const gate = this.level.gates.find((g) => g.id === sw.targetGateId);
      if (gate) {
        const isActive = this.activatedSwitches.has(sw.id);
        ctx.strokeStyle = isActive ? 'rgba(52, 211, 153, 0.45)' : 'rgba(244, 63, 94, 0.25)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(sw.x, sw.y);
        ctx.lineTo(gate.x + gate.w / 2, gate.y + gate.h / 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // 4. Platforms
    for (const plat of this.level.platforms) {
      if (plat.type === 'hazard') {
        ctx.fillStyle = '#EF4444';
        ctx.shadowColor = '#EF4444';
        ctx.shadowBlur = 12;
        ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
        ctx.shadowBlur = 0;
      } else if (plat.type === 'jumppad') {
        ctx.fillStyle = '#38BDF8';
        ctx.shadowColor = '#38BDF8';
        ctx.shadowBlur = 15;
        ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
        ctx.shadowBlur = 0;
      } else {
        ctx.fillStyle = '#1E293B';
        ctx.strokeStyle = this.level.accentColor;
        ctx.lineWidth = 2;
        ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
        ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);
      }
    }

    // 5. Checkpoints
    for (const cp of this.level.checkpoints) {
      const isActive = this.activeCheckpointId === cp.id;
      ctx.fillStyle = isActive ? '#34D399' : '#64748B';
      ctx.fillRect(cp.x - 6, cp.y - 48, 12, 48);

      ctx.beginPath();
      ctx.arc(cp.x, cp.y - 54, 10, 0, Math.PI * 2);
      ctx.fillStyle = isActive ? '#34D399' : '#38BDF8';
      ctx.shadowColor = isActive ? '#34D399' : '#38BDF8';
      ctx.shadowBlur = isActive ? 16 : 6;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // 6. Puzzle Switches
    for (const sw of this.level.switches) {
      const isActive = this.activatedSwitches.has(sw.id);
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, 16, 0, Math.PI * 2);
      ctx.fillStyle = isActive ? '#34D399' : '#F43F5E';
      ctx.shadowColor = isActive ? '#34D399' : '#F43F5E';
      ctx.shadowBlur = 16;
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#F1F5F9';
      ctx.font = 'bold 11px "Space Grotesk"';
      ctx.textAlign = 'center';
      ctx.fillText(isActive ? 'ONLINE' : 'SHOOT / [E]', sw.x, sw.y - 24);
    }

    // 7. Laser Gates
    for (const gate of this.level.gates) {
      if (!this.openGates.has(gate.id)) {
        ctx.fillStyle = 'rgba(244, 63, 94, 0.75)';
        ctx.shadowColor = '#F43F5E';
        ctx.shadowBlur = 18;
        ctx.fillRect(gate.x, gate.y, gate.w, gate.h);
        ctx.shadowBlur = 0;
      }
    }

    // 8. Enemies
    for (const e of this.enemies) {
      ctx.fillStyle = e.type === 'sentinel' ? '#A855F7' : e.type === 'drone' ? '#FBBF24' : '#F43F5E';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 10;
      ctx.fillRect(e.x, e.y, e.w, e.h);
      ctx.shadowBlur = 0;

      // Enemy Health bar
      const hpRatio = Math.max(0, e.hp / e.maxHp);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
      ctx.fillRect(e.x, e.y - 10, e.w, 5);
      ctx.fillStyle = '#EF4444';
      ctx.fillRect(e.x, e.y - 10, e.w * hpRatio, 5);
    }

    // 9. Boss
    if (this.boss.active && !this.boss.defeated) {
      const b = this.boss;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fillStyle = b.phase === 2 ? '#F43F5E' : b.color;
      ctx.shadowColor = b.phase === 2 ? '#F43F5E' : b.color;
      ctx.shadowBlur = 24;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Inner Core
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius * 0.45, 0, Math.PI * 2);
      ctx.fillStyle = '#F1F5F9';
      ctx.fill();
    }

    // 10. Player
    if (!this.player.dead) {
      const isInvuln = this.player.invulnTimer > 0 && Math.floor(this.player.invulnTimer / 4) % 2 === 0;
      if (!isInvuln) {
        ctx.fillStyle = '#38BDF8';
        ctx.shadowColor = '#38BDF8';
        ctx.shadowBlur = 14;
        ctx.fillRect(this.player.x, this.player.y, this.player.w, this.player.h);
        ctx.shadowBlur = 0;

        // Visor eye
        ctx.fillStyle = '#0F172A';
        const eyeX = this.player.facingRight ? this.player.x + 20 : this.player.x + 6;
        ctx.fillRect(eyeX, this.player.y + 10, 10, 6);

        // Aiming Arm & Weapon Barrel
        const cx = this.player.x + this.player.w / 2;
        const cy = this.player.y + this.player.h / 2;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(this.player.aimAngle);
        ctx.fillStyle = this.currentWeapon.color;
        ctx.fillRect(8, -4, 22, 8);
        ctx.restore();
      }
    }

    // 11. Projectiles
    for (const p of this.projectiles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.glowColor;
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // 12. Particles
    for (const pt of this.particles) {
      ctx.globalAlpha = pt.alpha;
      ctx.fillStyle = pt.color;
      ctx.fillRect(pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size);
    }
    ctx.globalAlpha = 1;

    // 13. Floating Combat Text
    for (const ft of this.floatingTexts) {
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.font = 'bold 13px "JetBrains Mono"';
      ctx.fillStyle = ft.color;
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
    }
    ctx.globalAlpha = 1;

    // 14. Tactical Crosshair
    ctx.strokeStyle = this.currentWeapon.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.mouse.worldX, this.mouse.worldY, 12, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }
}
