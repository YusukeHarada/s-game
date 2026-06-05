import { CANVAS_W, CANVAS_H, BULLET_SPEED_PLAYER, MAX_OPTIONS, POS_HISTORY_MAX, clamp, lerp } from './utils.js';
import { Option } from './option.js';

const FIRE_COOLDOWNS = [20, 16, 12, 10, 8, 7];

export class Player {
  constructor(cx, cy) {
    this.x = cx;
    this.y = cy;
    this.w = 32;
    this.h = 32;
    this.lives = 3;
    this.score = 0;
    this.powerLevel = 0;
    this.speedBonus = 0;
    this.shieldTimer = 0;
    this.fireTimer = 0;
    this.options = [];
    this.posHistory = [];
    this.dead = false;
    this.active = true;
    this.bombReady = false;
    this._wasActive = false;
    this._touchOffsetX = 0;
    this._touchOffsetY = 0;
  }

  get invincible() { return this.shieldTimer > 0; }
  get fireCooldown() { return FIRE_COOLDOWNS[Math.min(this.powerLevel, 5)]; }

  update(input) {
    const ptr = input.getPointer();
    const justStarted = ptr.active && !this._wasActive;
    this._wasActive = ptr.active;

    if (ptr.active) {
      if (justStarted) {
        // Compute offset so ship stays at current position — no jump on touch start
        this._touchOffsetX = this.x - ptr.x;
        this._touchOffsetY = this.y - ptr.y;
      }
      const tx = ptr.x + this._touchOffsetX;
      const ty = ptr.y + this._touchOffsetY;
      const t = 0.35 + this.speedBonus * 0.06;
      this.x = lerp(this.x, tx, t);
      this.y = lerp(this.y, ty, t);
    }
    this.x = clamp(this.x, this.w / 2, CANVAS_W - this.w / 2);
    this.y = clamp(this.y, this.h / 2, CANVAS_H - this.h / 2);

    if (this.shieldTimer > 0) this.shieldTimer--;
    this.fireTimer--;

    this.posHistory.push({ x: this.x, y: this.y });
    if (this.posHistory.length > POS_HISTORY_MAX) this.posHistory.shift();

    for (const opt of this.options) opt.update();
  }

  canShoot() {
    if (this.fireTimer <= 0) {
      this.fireTimer = this.fireCooldown;
      return true;
    }
    return false;
  }

  getShots(pool) {
    const pl = this.powerLevel;
    const cx = this.x;
    const cy = this.y - 18;
    const s = BULLET_SPEED_PLAYER;
    const color = '#00ffff';

    const spreadDefs = [
      [0],
      [0],
      [-10, 0, 10],
      [-20, -10, 0, 10, 20],
      [-20, -10, 0, 10, 20],
      [-30, -15, 0, 15, 30],
    ];
    const angles = spreadDefs[Math.min(pl, 5)];
    const shots = [];

    for (const deg of angles) {
      const rad = (deg - 90) * Math.PI / 180;
      const b = pool.spawn(cx, cy, Math.cos(rad) * s, Math.sin(rad) * s, 'player', color, 1, 'beam');
      if (b) shots.push(b);
    }

    for (const opt of this.options) {
      if (opt.canShoot()) {
        opt.getShots(pool);
      }
    }

    return shots;
  }

  hit() {
    if (this.invincible) return false;
    this.lives--;
    this.shieldTimer = 180;
    this.powerLevel = Math.max(0, this.powerLevel - 1);
    if (this.lives <= 0) {
      this.dead = true;
      this.active = false;
    }
    return true;
  }

  addOption() {
    if (this.options.length < MAX_OPTIONS) {
      this.options.push(new Option(this.options.length, this));
    }
  }

  addPower() { this.powerLevel = Math.min(5, this.powerLevel + 1); }
  addSpeed() { this.speedBonus = Math.min(3, this.speedBonus + 1); }
  addShield() { this.shieldTimer = 300; }

  useBomb(enemyBulletPool, enemies, boss) {
    enemyBulletPool.clearAll();
    for (const e of enemies) {
      e.hp -= 30;
      if (e.hp <= 0) e.dead = true;
    }
    if (boss) boss.hp = Math.max(1, boss.hp - 50);
    this.shieldTimer = Math.max(this.shieldTimer, 60);
  }

  draw(ctx, frame) {
    ctx.save();
    ctx.translate(this.x, this.y);

    if (this.invincible && Math.floor(frame / 4) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }

    ctx.shadowBlur = 14;
    ctx.shadowColor = '#00ffff';

    ctx.fillStyle = '#00ffff';
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(-14, 14);
    ctx.lineTo(-6, 8);
    ctx.lineTo(0, 12);
    ctx.lineTo(6, 8);
    ctx.lineTo(14, 14);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(-7, 8);
    ctx.lineTo(0, 5);
    ctx.lineTo(7, 8);
    ctx.closePath();
    ctx.fill();

    const grad = ctx.createRadialGradient(0, 12, 0, 0, 12, 8);
    grad.addColorStop(0, '#ffaa00');
    grad.addColorStop(1, 'rgba(255,80,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 14, 6, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    if (this.invincible) {
      ctx.globalAlpha = 0.3 + 0.2 * Math.sin(frame * 0.2);
      ctx.strokeStyle = '#4488ff';
      ctx.lineWidth = 3;
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#4488ff';
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }
}
