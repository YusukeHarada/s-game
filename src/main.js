import { CANVAS_W, CANVAS_H, circleCollide, rectCircleCollide, randomRange, randomInt } from './utils.js';
import { InputManager } from './input.js';
import { AudioManager } from './audio.js';
import { Renderer } from './renderer.js';
import { BulletPool } from './bullet.js';
import { Player } from './player.js';
import { Enemy, Boss } from './enemy.js';
import { ItemManager } from './item.js';

// ─── Wave definitions per stage ───────────────────────────────────────────────

const WAVES = {
  1: [
    { time: 60,  type: 'fighter', count: 4 },
    { time: 200, type: 'zigzag',  count: 3 },
    { time: 360, type: 'bomber',  count: 2 },
    { time: 500, type: 'fighter', count: 6 },
    { time: 650, type: 'zigzag',  count: 4 },
    { time: 800, type: 'circler', count: 2 },
    { time: 980, type: 'bomber',  count: 3 },
    { time: 1100,type: 'fighter', count: 8 },
    { time: 1300,type: 'BOSS' },
  ],
  2: [
    { time: 60,  type: 'bomber',  count: 3 },
    { time: 200, type: 'circler', count: 3 },
    { time: 350, type: 'fighter', count: 8 },
    { time: 500, type: 'zigzag',  count: 6 },
    { time: 650, type: 'bomber',  count: 4 },
    { time: 800, type: 'circler', count: 4 },
    { time: 1000,type: 'fighter', count: 10 },
    { time: 1200,type: 'BOSS' },
  ],
  3: [
    { time: 60,  type: 'circler', count: 4 },
    { time: 200, type: 'bomber',  count: 5 },
    { time: 380, type: 'zigzag',  count: 8 },
    { time: 530, type: 'circler', count: 5 },
    { time: 700, type: 'fighter', count: 12 },
    { time: 880, type: 'bomber',  count: 5 },
    { time: 1050,type: 'circler', count: 6 },
    { time: 1200,type: 'BOSS' },
  ],
};

// ─── Game ─────────────────────────────────────────────────────────────────────

class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this._resize();
    window.addEventListener('resize', () => this._resize());

    this.input    = new InputManager(this.canvas);
    this.audio    = new AudioManager();
    this.renderer = new Renderer(this.canvas);

    this.playerBulletPool = new BulletPool(250);
    this.enemyBulletPool  = new BulletPool(400);

    this.state = 'TITLE';
    this.frame = 0;
    this.lastTime = 0;
    this.stage = 1;
    this.stageClearTimer = 0;
    this.gameOverTimer = 0;
    this.waveIndex = 0;
    this.waveFrame = 0;
    this.enemies = [];
    this.boss = null;
    this.itemManager = new ItemManager();
    this.player = this._makePlayer();
    this.shootSoundTimer = 0;

    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  _resize() {
    const scale = Math.min(window.innerWidth / CANVAS_W, window.innerHeight / CANVAS_H);
    this.canvas.width  = CANVAS_W;
    this.canvas.height = CANVAS_H;
    this.canvas.style.width  = `${CANVAS_W * scale}px`;
    this.canvas.style.height = `${CANVAS_H * scale}px`;
    if (this.input) this.input._updateScale();
  }

  _makePlayer() {
    return new Player(CANVAS_W / 2, CANVAS_H * 0.8);
  }

  loop(timestamp) {
    const dt = Math.min((timestamp - this.lastTime) / (1000 / 60), 3);
    this.lastTime = timestamp;
    this.frame++;

    switch (this.state) {
      case 'TITLE':       this._updateTitle(); break;
      case 'PLAYING':     this._updatePlaying(dt); break;
      case 'BOSS':        this._updateBoss(dt); break;
      case 'STAGE_CLEAR': this._updateStageClear(); break;
      case 'GAME_OVER':   this._updateGameOver(); break;
    }

    this.renderer.render({
      gameState: this.state,
      player: this.player,
      enemies: this.enemies,
      boss: this.boss,
      itemManager: this.itemManager,
      playerBulletPool: this.playerBulletPool,
      enemyBulletPool: this.enemyBulletPool,
      frame: this.frame,
    });

    requestAnimationFrame(this.loop);
  }

  _updateTitle() {
    this.player.update(this.input);
    const ptr = this.input.getPointer();
    if (ptr.active) {
      this.audio.resume();
      this._startGame();
    }
  }

  _startGame() {
    this.stage = 1;
    this.player = this._makePlayer();
    this.enemies = [];
    this.boss = null;
    this.itemManager = new ItemManager();
    this.playerBulletPool.clearAll();
    this.enemyBulletPool.clearAll();
    this.waveIndex = 0;
    this.waveFrame = 0;
    this.state = 'PLAYING';
  }

  _startStage(stage) {
    this.stage = stage;
    this.enemies = [];
    this.boss = null;
    this.itemManager = new ItemManager();
    this.playerBulletPool.clearAll();
    this.enemyBulletPool.clearAll();
    this.waveIndex = 0;
    this.waveFrame = 0;
    this.player.shieldTimer = 120;
    this.state = 'PLAYING';
  }

  _updatePlaying(dt) {
    this.waveFrame++;
    this._spawnWaves();
    this.player.update(this.input);

    if (this.player.canShoot()) {
      this.player.getShots(this.playerBulletPool);
      if (this.shootSoundTimer <= 0) {
        this.audio.play('shoot');
        this.shootSoundTimer = 6;
      }
    }
    if (this.shootSoundTimer > 0) this.shootSoundTimer--;

    this._tryBomb(this.enemies, null);

    for (const e of this.enemies) e.update(this.player.x, this.player.y, this.enemyBulletPool);
    this.playerBulletPool.updateAll();
    this.enemyBulletPool.updateAll();
    this.itemManager.updateAll();
    this.itemManager.checkCollect(this.player, this.audio);

    this._collidePlayerBulletsEnemies();
    this._collideEnemyBulletsPlayer();
    this._collideEnemiesPlayer();

    this.enemies = this.enemies.filter(e => e.active);
  }

  _updateBoss(dt) {
    this.player.update(this.input);

    if (this.player.canShoot()) {
      this.player.getShots(this.playerBulletPool);
      if (this.shootSoundTimer <= 0) { this.audio.play('shoot'); this.shootSoundTimer = 6; }
    }
    if (this.shootSoundTimer > 0) this.shootSoundTimer--;

    this._tryBomb([], this.boss);

    this.boss.update(this.player.x, this.player.y, this.enemyBulletPool, this.audio);
    this.playerBulletPool.updateAll();
    this.enemyBulletPool.updateAll();
    this.itemManager.updateAll();
    this.itemManager.checkCollect(this.player, this.audio);

    this._collidePlayerBulletsBoss();
    this._collideEnemyBulletsPlayer();
    this._collideBossPlayer();

    if (this.boss.dead) {
      this.player.score += this.boss.points;
      this.audio.play('explosionLarge');
      this.audio.play('stageClear');
      this.itemManager.spawnGuaranteed(this.boss.x, this.boss.y, ['OPTION', 'SHIELD', 'POWER']);
      this._savHiScore();
      this.stageClearTimer = 200;
      this.state = 'STAGE_CLEAR';
    }
  }

  _updateStageClear() {
    this.stageClearTimer--;
    if (this.stageClearTimer <= 0) {
      if (this.stage >= 3) {
        this.state = 'TITLE';
      } else {
        this._startStage(this.stage + 1);
      }
    }
  }

  _updateGameOver() {
    this.gameOverTimer++;
    if (this.gameOverTimer > 60 && this.input.getPointer().active) {
      this.audio.resume();
      this.state = 'TITLE';
      this.player = this._makePlayer();
      this.enemies = [];
      this.boss = null;
      this.itemManager = new ItemManager();
      this.playerBulletPool.clearAll();
      this.enemyBulletPool.clearAll();
    }
  }

  _spawnWaves() {
    const waves = WAVES[Math.min(this.stage, 3)];
    while (this.waveIndex < waves.length) {
      const w = waves[this.waveIndex];
      if (this.waveFrame < w.time) break;
      this.waveIndex++;

      if (w.type === 'BOSS') {
        this.boss = new Boss(this.stage);
        this.audio.play('bossAlarm');
        this.enemyBulletPool.clearAll();
        this.enemies = [];
        this.renderer.bossBarDisplayHp = 0;
        this.state = 'BOSS';
        break;
      }

      for (let i = 0; i < w.count; i++) {
        const x = 50 + (i / Math.max(w.count - 1, 1)) * (CANVAS_W - 100);
        const e = new Enemy(x, randomRange(-60, -20), w.type);
        e.fireTimer = randomInt(20, 80);
        this.enemies.push(e);
      }
    }
  }

  _tryBomb(enemies, boss) {
    if (!this.input.bombPressed || !this.player.bombReady) return;
    this.input.bombPressed = false;
    this.player.bombReady = false;
    this.player.useBomb(this.enemyBulletPool, enemies, boss);
    this.audio.play('explosionLarge');
    this.renderer.triggerFlash();
    for (const e of enemies) {
      if (e.dead) {
        this.player.score += e.points;
        if (Math.random() < e.dropChance) this.itemManager.spawnRandom(e.x, e.y);
      }
    }
    this.enemies = enemies.filter(e => !e.dead);
  }

  _collidePlayerBulletsEnemies() {
    const bullets = this.playerBulletPool.getActive();
    for (const b of bullets) {
      for (const e of this.enemies) {
        if (!e.active) continue;
        if (circleCollide(b.x, b.y, b.r, e.x, e.y, e.r)) {
          b.active = false;
          if (e.hit(b.damage)) {
            this.player.score += e.points;
            this.audio.play('explosion');
            if (Math.random() < e.dropChance) this.itemManager.spawnRandom(e.x, e.y);
          }
          break;
        }
      }
    }
  }

  _collidePlayerBulletsBoss() {
    const bullets = this.playerBulletPool.getActive();
    for (const b of bullets) {
      if (!this.boss || !this.boss.active) continue;
      if (circleCollide(b.x, b.y, b.r, this.boss.x, this.boss.y, this.boss.r)) {
        b.active = false;
        this.boss.hit(b.damage);
        this.audio.play('bossHit');
      }
    }
  }

  _collideEnemyBulletsPlayer() {
    if (this.player.invincible) return;
    const bullets = this.enemyBulletPool.getActive();
    for (const b of bullets) {
      if (circleCollide(b.x, b.y, b.r, this.player.x, this.player.y, 12)) {
        b.active = false;
        if (this.player.hit()) {
          this.renderer.triggerFlash();
          this.audio.play('explosion');
          if (this.player.dead) {
            this._savHiScore();
            this.audio.play('gameOver');
            this.gameOverTimer = 0;
            this.state = 'GAME_OVER';
          }
        }
        return;
      }
    }
  }

  _collideEnemiesPlayer() {
    if (this.player.invincible) return;
    for (const e of this.enemies) {
      if (!e.active) continue;
      if (circleCollide(this.player.x, this.player.y, 12, e.x, e.y, e.r * 0.7)) {
        e.hit(99);
        if (Math.random() < e.dropChance) this.itemManager.spawnRandom(e.x, e.y);
        if (this.player.hit()) {
          this.renderer.triggerFlash();
          this.audio.play('explosion');
          if (this.player.dead) {
            this._savHiScore();
            this.audio.play('gameOver');
            this.gameOverTimer = 0;
            this.state = 'GAME_OVER';
          }
        }
        return;
      }
    }
  }

  _collideBossPlayer() {
    if (this.player.invincible || !this.boss) return;
    if (circleCollide(this.player.x, this.player.y, 12, this.boss.x, this.boss.y, this.boss.r * 0.6)) {
      if (this.player.hit()) {
        this.renderer.triggerFlash();
        this.audio.play('explosion');
        if (this.player.dead) {
          this._savHiScore();
          this.audio.play('gameOver');
          this.gameOverTimer = 0;
          this.state = 'GAME_OVER';
        }
      }
    }
  }

  _savHiScore() {
    const prev = parseInt(localStorage.getItem('shmup-hi') ?? '0');
    if (this.player.score > prev) localStorage.setItem('shmup-hi', String(this.player.score));
  }
}

new Game();
