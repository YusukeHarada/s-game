import { CANVAS_H, ITEM_RADIUS, circleCollide, weightedRandom } from './utils.js';

export const ITEM_TYPES = ['OPTION', 'POWER', 'SPEED', 'SHIELD', 'BOMB', 'SCORE'];
const WEIGHTS = [10, 30, 20, 15, 8, 17];
const COLORS = {
  OPTION: '#00ffff',
  POWER: '#ffff00',
  SPEED: '#00ff88',
  SHIELD: '#4488ff',
  BOMB: '#ff4400',
  SCORE: '#ffcc00',
};

export class Item {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.vy = 1.5;
    this.type = type;
    this.radius = ITEM_RADIUS;
    this.active = true;
    this.pulseTimer = 0;
    this.color = COLORS[type];
  }

  update() {
    this.y += this.vy;
    this.pulseTimer++;
    if (this.y > CANVAS_H + 30) this.active = false;
  }

  draw(ctx) {
    if (!this.active) return;
    const s = 1 + 0.12 * Math.sin(this.pulseTimer * 0.1);
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(s, s);
    ctx.shadowBlur = 12;
    ctx.shadowColor = this.color;

    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = this.color;
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    switch (this.type) {
      case 'OPTION':
        ctx.beginPath();
        ctx.moveTo(0, -8); ctx.lineTo(6, 0); ctx.lineTo(0, 8); ctx.lineTo(-6, 0);
        ctx.closePath(); ctx.fill();
        break;
      case 'POWER':
        ctx.fillText('P', 0, 1);
        break;
      case 'SPEED':
        ctx.fillText('S', 0, 1);
        break;
      case 'SHIELD':
        ctx.fillText('SH', 0, 1);
        break;
      case 'BOMB':
        ctx.fillText('B', 0, 1);
        break;
      case 'SCORE':
        ctx.fillText('1K', 0, 1);
        break;
    }
    ctx.restore();
  }
}

export class ItemManager {
  constructor() {
    this.items = [];
  }

  spawnAt(x, y, type) {
    this.items.push(new Item(x, y, type));
  }

  spawnRandom(x, y) {
    const idx = weightedRandom(WEIGHTS);
    this.spawnAt(x, y, ITEM_TYPES[idx]);
  }

  spawnGuaranteed(x, y, types) {
    const type = types[Math.floor(Math.random() * types.length)];
    this.spawnAt(x, y, type);
  }

  updateAll() {
    for (const item of this.items) item.update();
    this.items = this.items.filter(i => i.active);
  }

  checkCollect(player, audio) {
    for (const item of this.items) {
      if (!item.active) continue;
      if (circleCollide(player.x, player.y, 40, item.x, item.y, item.radius)) {
        item.active = false;
        audio.play('itemPickup');
        switch (item.type) {
          case 'OPTION': player.addOption(); break;
          case 'POWER': player.addPower(); break;
          case 'SPEED': player.addSpeed(); break;
          case 'SHIELD': player.addShield(); break;
          case 'BOMB': player.bombReady = true; break;
          case 'SCORE': player.score += 1000; break;
        }
      }
    }
  }

  drawAll(ctx) {
    for (const item of this.items) item.draw(ctx);
  }
}
