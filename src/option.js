import { BULLET_SPEED_PLAYER, OPTION_TRAIL_GAP, POS_HISTORY_MAX } from './utils.js';

export class Option {
  constructor(index, player) {
    this.index = index;
    this.player = player;
    this.x = player.x;
    this.y = player.y;
    this.fireTimer = 0;
    this.fireCooldown = 20;
  }

  update() {
    const hist = this.player.posHistory;
    const behind = (this.index + 1) * OPTION_TRAIL_GAP;
    const idx = Math.max(0, hist.length - 1 - behind);
    const target = hist[idx];
    if (target) {
      this.x = target.x;
      this.y = target.y;
    }
    this.fireTimer--;
  }

  canShoot() {
    if (this.fireTimer <= 0) {
      this.fireTimer = this.fireCooldown;
      return true;
    }
    return false;
  }

  getShots(pool) {
    const pl = this.player.powerLevel;
    const cx = this.x;
    const cy = this.y;
    const s = BULLET_SPEED_PLAYER;
    const color = '#00ffcc';
    const shots = [];

    const spread = [
      [],
      [0],
      [0],
      [-10, 0, 10],
      [-20, -10, 0, 10, 20],
      [-20, -10, 0, 10, 20],
    ];
    const angles = spread[Math.min(pl, 5)] ?? [0];

    for (const deg of angles) {
      const rad = (deg - 90) * Math.PI / 180;
      const b = pool.spawn(cx, cy, Math.cos(rad) * s, Math.sin(rad) * s, 'player', color, 1, 'beam');
      if (b) shots.push(b);
    }
    return shots;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00ffcc';
    ctx.fillStyle = '#00ffcc';
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(8, 0);
    ctx.lineTo(0, 10);
    ctx.lineTo(-8, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
