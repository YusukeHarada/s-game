import { CANVAS_W, CANVAS_H } from './utils.js';

export class Bullet {
  constructor() {
    this.active = false;
    this.x = 0; this.y = 0;
    this.vx = 0; this.vy = 0;
    this.r = 4;
    this.damage = 1;
    this.type = 'player';
    this.color = '#00ffff';
    this.shape = 'beam';
  }

  init(x, y, vx, vy, type, color, damage, shape) {
    this.active = true;
    this.x = x; this.y = y;
    this.vx = vx; this.vy = vy;
    this.type = type;
    this.color = color;
    this.damage = damage ?? 1;
    this.shape = shape ?? 'beam';
    this.r = type === 'player' ? 4 : 5;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    if (this.x < -20 || this.x > CANVAS_W + 20 || this.y < -20 || this.y > CANVAS_H + 20) {
      this.active = false;
    }
  }

  draw(ctx) {
    if (!this.active) return;
    ctx.save();
    const angle = Math.atan2(this.vy, this.vx);
    ctx.translate(this.x, this.y);
    ctx.rotate(angle + Math.PI / 2);

    if (this.shape === 'beam') {
      ctx.shadowBlur = 6;
      ctx.shadowColor = this.color;
      ctx.fillStyle = this.color;
      ctx.fillRect(-2, -8, 4, 16);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-1, -7, 2, 14);
    } else if (this.shape === 'orb') {
      ctx.shadowBlur = 8;
      ctx.shadowColor = this.color;
      ctx.beginPath();
      ctx.arc(0, 0, this.r, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0, this.r * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    } else if (this.shape === 'ring') {
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 6;
      ctx.shadowColor = this.color;
      ctx.beginPath();
      ctx.arc(0, 0, this.r + 2, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
}

export class BulletPool {
  constructor(size) {
    this.pool = Array.from({ length: size }, () => new Bullet());
  }

  spawn(x, y, vx, vy, type, color, damage, shape) {
    for (const b of this.pool) {
      if (!b.active) {
        b.init(x, y, vx, vy, type, color, damage, shape);
        return b;
      }
    }
    return null;
  }

  updateAll() {
    for (const b of this.pool) {
      if (b.active) b.update();
    }
  }

  drawAll(ctx) {
    for (const b of this.pool) {
      if (b.active) b.draw(ctx);
    }
  }

  getActive() {
    return this.pool.filter(b => b.active);
  }

  clearAll() {
    for (const b of this.pool) b.active = false;
  }
}
