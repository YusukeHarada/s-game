import { CANVAS_W, CANVAS_H } from './utils.js';

const STAR_COUNT_DIM = 80;
const STAR_COUNT_BRIGHT = 40;

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.stars = [];
    this.flashTimer = 0;
    this.bossBarDisplayHp = 0;
    this.bossBarShake = 0;
    this._initStars();
  }

  _initStars() {
    for (let i = 0; i < STAR_COUNT_DIM; i++) {
      this.stars.push({ x: Math.random() * CANVAS_W, y: Math.random() * CANVAS_H, speed: 0.4 + Math.random() * 0.3, size: 1, alpha: 0.3 + Math.random() * 0.4 });
    }
    for (let i = 0; i < STAR_COUNT_BRIGHT; i++) {
      this.stars.push({ x: Math.random() * CANVAS_W, y: Math.random() * CANVAS_H, speed: 1.2 + Math.random() * 0.5, size: 2, alpha: 0.7 + Math.random() * 0.3 });
    }
  }

  triggerFlash() { this.flashTimer = 10; }

  _updateStars() {
    for (const s of this.stars) {
      s.y += s.speed;
      if (s.y > CANVAS_H + 2) { s.y = -2; s.x = Math.random() * CANVAS_W; }
    }
  }

  render(state) {
    const ctx = this.ctx;
    const { gameState, player, enemies, boss, itemManager, playerBulletPool, enemyBulletPool, frame } = state;

    this._updateStars();

    ctx.fillStyle = '#050510';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    for (const s of this.stars) {
      ctx.globalAlpha = s.alpha;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(s.x, s.y, s.size, s.size);
    }
    ctx.globalAlpha = 1;

    itemManager.drawAll(ctx);
    playerBulletPool.drawAll(ctx);
    enemyBulletPool.drawAll(ctx);

    for (const e of enemies) e.draw(ctx);
    if (boss) boss.draw(ctx, frame);

    for (const opt of player.options) opt.draw(ctx);
    player.draw(ctx, frame);

    if (this.flashTimer > 0) {
      ctx.fillStyle = `rgba(255,0,0,${this.flashTimer * 0.04})`;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      this.flashTimer--;
    }

    this._drawHUD(ctx, player, gameState, boss, frame);
    this._drawStateOverlay(ctx, gameState, player, frame);
  }

  _drawHUD(ctx, player, gameState, boss, frame) {
    ctx.shadowBlur = 0;
    ctx.font = '16px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${player.score}`, 10, 24);

    ctx.textAlign = 'center';
    const hiScore = parseInt(localStorage.getItem('shmup-hi') ?? '0');
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText(`HI: ${Math.max(hiScore, player.score)}`, CANVAS_W / 2, 24);

    ctx.textAlign = 'right';
    for (let i = 0; i < player.lives; i++) {
      this._drawMiniShip(ctx, CANVAS_W - 14 - i * 20, 16);
    }

    this._drawPowerBar(ctx, player);
    this._drawBombButton(ctx, player, frame);

    if (boss && !boss.entering) {
      this._drawBossBar(ctx, boss, frame);
    }
  }

  _drawMiniShip(ctx, x, y) {
    ctx.fillStyle = '#00ffff';
    ctx.beginPath();
    ctx.moveTo(x, y - 6);
    ctx.lineTo(x - 5, y + 4);
    ctx.lineTo(x + 5, y + 4);
    ctx.closePath();
    ctx.fill();
  }

  _drawPowerBar(ctx, player) {
    const bx = 10, by = CANVAS_H - 30;
    ctx.font = '11px monospace';
    ctx.fillStyle = '#888888';
    ctx.textAlign = 'left';
    ctx.fillText('PWR', bx, by - 2);
    for (let i = 0; i < 5; i++) {
      ctx.strokeStyle = '#444444';
      ctx.lineWidth = 1;
      ctx.strokeRect(bx + 30 + i * 16, by - 12, 12, 12);
      if (i < player.powerLevel) {
        ctx.fillStyle = '#00ffff';
        ctx.fillRect(bx + 31 + i * 16, by - 11, 10, 10);
      }
    }
  }

  _drawBombButton(ctx, player, frame) {
    const bx = CANVAS_W - 70, by = CANVAS_H - 50;
    const w = 60, h = 40;
    if (player.bombReady) {
      const pulse = 0.6 + 0.4 * Math.abs(Math.sin(frame * 0.1));
      ctx.globalAlpha = pulse;
      ctx.shadowBlur = 14;
      ctx.shadowColor = '#ff4400';
      ctx.strokeStyle = '#ff4400';
      ctx.lineWidth = 2;
      ctx.strokeRect(bx, by, w, h);
      ctx.fillStyle = 'rgba(255,68,0,0.2)';
      ctx.fillRect(bx, by, w, h);
      ctx.fillStyle = '#ff6622';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('BOMB', bx + w / 2, by + 15);
      ctx.font = '10px monospace';
      ctx.fillStyle = '#ffaa88';
      ctx.fillText('2-finger', bx + w / 2, by + 30);
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    } else {
      ctx.globalAlpha = 0.3;
      ctx.strokeStyle = '#555555';
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, by, w, h);
      ctx.fillStyle = '#555555';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('BOMB', bx + w / 2, by + 15);
      ctx.globalAlpha = 1;
    }
  }

  _drawBossBar(ctx, boss, frame) {
    if (this.bossBarDisplayHp === 0) this.bossBarDisplayHp = boss.maxHp;
    this.bossBarDisplayHp += (boss.hp - this.bossBarDisplayHp) * 0.1;
    if (this.bossBarShake > 0) this.bossBarShake--;

    const bw = 300, bh = 14;
    const bx = (CANVAS_W - bw) / 2 + Math.sin(this.bossBarShake * 0.7) * 4;
    const by = 36;
    const fillW = Math.max(0, (this.bossBarDisplayHp / boss.maxHp) * bw);

    ctx.fillStyle = '#330000';
    ctx.fillRect(bx, by, bw, bh);
    const grad = ctx.createLinearGradient(bx, by, bx + fillW, by);
    grad.addColorStop(0, '#ff4400');
    grad.addColorStop(1, '#ff0000');
    ctx.fillStyle = grad;
    ctx.fillRect(bx, by, fillW, bh);
    ctx.strokeStyle = '#ff6666';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, by, bw, bh);

    ctx.fillStyle = '#ffffff';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(boss.name, CANVAS_W / 2, by - 4);

    const t1 = bx + bw * 0.66, t2 = bx + bw * 0.33;
    ctx.strokeStyle = '#ffaa00'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(t1, by); ctx.lineTo(t1, by + bh); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(t2, by); ctx.lineTo(t2, by + bh); ctx.stroke();

    if (boss.phase !== this._lastBossPhase) {
      this.bossBarShake = 30;
      this._lastBossPhase = boss.phase;
    }
  }

  _drawStateOverlay(ctx, gameState, player, frame) {
    if (gameState === 'TITLE') {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.shadowBlur = 20; ctx.shadowColor = '#00ffff';
      ctx.fillStyle = '#00ffff';
      ctx.font = 'bold 48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('S-GAME', CANVAS_W / 2, CANVAS_H / 2 - 60);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.font = '18px monospace';
      ctx.fillText('VERTICAL SHOOTER', CANVAS_W / 2, CANVAS_H / 2 - 20);
      if (Math.floor(frame / 30) % 2 === 0) {
        ctx.fillStyle = '#ffff00';
        ctx.font = '16px monospace';
        ctx.fillText('TAP TO START', CANVAS_W / 2, CANVAS_H / 2 + 40);
      }
      ctx.fillStyle = '#888888';
      ctx.font = '13px monospace';
      ctx.fillText('DRAG to move  AUTO-FIRE', CANVAS_W / 2, CANVAS_H / 2 + 80);
      ctx.fillText('Collect items to power up!', CANVAS_W / 2, CANVAS_H / 2 + 100);
      const hi = localStorage.getItem('shmup-hi') ?? '0';
      ctx.fillStyle = '#aaaaaa';
      ctx.fillText(`HI-SCORE: ${hi}`, CANVAS_W / 2, CANVAS_H / 2 + 140);
    }

    if (gameState === 'STAGE_CLEAR') {
      ctx.fillStyle = 'rgba(0,0,20,0.55)';
      ctx.fillRect(0, CANVAS_H / 2 - 60, CANVAS_W, 120);
      ctx.shadowBlur = 16; ctx.shadowColor = '#00ff88';
      ctx.fillStyle = '#00ff88';
      ctx.font = 'bold 32px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('STAGE CLEAR!', CANVAS_W / 2, CANVAS_H / 2);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px monospace';
      ctx.fillText(`SCORE: ${player.score}`, CANVAS_W / 2, CANVAS_H / 2 + 36);
    }

    if (gameState === 'GAME_OVER') {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.shadowBlur = 16; ctx.shadowColor = '#ff0000';
      ctx.fillStyle = '#ff4444';
      ctx.font = 'bold 40px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', CANVAS_W / 2, CANVAS_H / 2 - 40);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.font = '18px monospace';
      ctx.fillText(`SCORE: ${player.score}`, CANVAS_W / 2, CANVAS_H / 2 + 10);
      if (Math.floor(frame / 30) % 2 === 0) {
        ctx.fillStyle = '#ffff00';
        ctx.font = '16px monospace';
        ctx.fillText('TAP TO RETRY', CANVAS_W / 2, CANVAS_H / 2 + 60);
      }
    }
  }
}
