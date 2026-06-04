import { CANVAS_W, CANVAS_H, BULLET_SPEED_ENEMY, angleTowards, vecFromAngle, randomRange, clamp, lerp } from './utils.js';

// ─── Base Enemy ───────────────────────────────────────────────────────────────

export class Enemy {
  constructor(x, y, type) {
    this.x = x; this.y = y;
    this.type = type;
    this.vx = 0; this.vy = 2;
    this.hp = 1; this.maxHp = 1;
    this.dead = false;
    this.active = true;
    this.moveTimer = 0;
    this.fireTimer = 0;
    this.points = 100;
    this.dropChance = 0.15;
    this._setStats();
  }

  _setStats() {
    switch (this.type) {
      case 'fighter': this.hp = this.maxHp = 1; this.r = 14; this.points = 100; break;
      case 'bomber':  this.hp = this.maxHp = 3; this.r = 18; this.points = 300; this.dropChance = 0.35; break;
      case 'zigzag':  this.hp = this.maxHp = 2; this.r = 14; this.points = 200; break;
      case 'circler': this.hp = this.maxHp = 2; this.r = 16; this.points = 250; this.dropChance = 0.30; break;
    }
  }

  update(px, py, pool) {
    this.moveTimer++;
    this.fireTimer--;

    switch (this.type) {
      case 'fighter': this._updateFighter(px, py, pool); break;
      case 'bomber':  this._updateBomber(px, py, pool); break;
      case 'zigzag':  this._updateZigzag(px, py, pool); break;
      case 'circler': this._updateCircler(px, py, pool); break;
    }

    this.x += this.vx;
    this.y += this.vy;
    if (this.y > CANVAS_H + 40) this.active = false;
  }

  _updateFighter(px, py, pool) {
    this.vy = 2;
    if (this.fireTimer <= 0) {
      this.fireTimer = 80;
      this._fireAimed(px, py, pool, '#ff8800', BULLET_SPEED_ENEMY, 'orb');
    }
  }

  _updateBomber(px, py, pool) {
    this.vx = Math.sin(this.moveTimer * 0.015) * 2.5;
    this.vy = 1;
    if (this.fireTimer <= 0) {
      this.fireTimer = 120;
      this._fireFan(py, pool, 3, 20, '#cc44ff', BULLET_SPEED_ENEMY, 'orb');
    }
  }

  _updateZigzag(px, py, pool) {
    this.vx = Math.sin(this.moveTimer * 0.05) * 3;
    this.vy = 1.5;
    if (this.fireTimer <= 0) {
      this.fireTimer = 60;
      this._fireAimed(px, py, pool, '#ffff44', BULLET_SPEED_ENEMY, 'orb');
    }
  }

  _updateCircler(px, py, pool) {
    if (this.moveTimer < 180) {
      this.vx = Math.cos(this.moveTimer * 0.05) * 2.5;
      this.vy = 0.2;
    } else {
      this.vy = 2;
      this.vx *= 0.95;
    }
    if (this.fireTimer <= 0) {
      this.fireTimer = 150;
      this._fireBurst(pool, 8, '#ff44ff', BULLET_SPEED_ENEMY, 'orb');
    }
  }

  _fireAimed(px, py, pool, color, speed, shape) {
    const angle = angleTowards(this.x, this.y, px, py);
    const v = vecFromAngle(angle);
    pool.spawn(this.x, this.y, v.x * speed, v.y * speed, 'enemy', color, 1, shape);
  }

  _fireFan(py, pool, count, spreadDeg, color, speed, shape) {
    const baseAngle = Math.PI / 2;
    const half = (count - 1) * spreadDeg / 2;
    for (let i = 0; i < count; i++) {
      const deg = -half + i * spreadDeg;
      const rad = baseAngle + deg * Math.PI / 180;
      pool.spawn(this.x, this.y, Math.cos(rad) * speed, Math.sin(rad) * speed, 'enemy', color, 1, shape);
    }
  }

  _fireBurst(pool, count, color, speed, shape) {
    for (let i = 0; i < count; i++) {
      const rad = (i / count) * Math.PI * 2;
      pool.spawn(this.x, this.y, Math.cos(rad) * speed, Math.sin(rad) * speed, 'enemy', color, 1, shape);
    }
  }

  hit(dmg) {
    this.hp -= dmg;
    if (this.hp <= 0) { this.dead = true; this.active = false; return true; }
    return false;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    switch (this.type) {
      case 'fighter': this._drawFighter(ctx); break;
      case 'bomber':  this._drawBomber(ctx); break;
      case 'zigzag':  this._drawZigzag(ctx); break;
      case 'circler': this._drawCircler(ctx); break;
    }
    ctx.restore();
  }

  _drawFighter(ctx) {
    ctx.shadowBlur = 8; ctx.shadowColor = '#ff6600';
    ctx.fillStyle = '#ff6600';
    ctx.beginPath();
    ctx.moveTo(0, 18); ctx.lineTo(-13, -14); ctx.lineTo(13, -14);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ff3300';
    ctx.beginPath();
    ctx.moveTo(0, 12); ctx.lineTo(-7, -10); ctx.lineTo(7, -10);
    ctx.closePath(); ctx.fill();
  }

  _drawBomber(ctx) {
    ctx.shadowBlur = 8; ctx.shadowColor = '#cc44ff';
    ctx.fillStyle = '#9922cc';
    ctx.fillRect(-20, -12, 40, 24);
    ctx.fillStyle = '#cc44ff';
    ctx.fillRect(-28, -6, 12, 12);
    ctx.fillRect(16, -6, 12, 12);
    ctx.fillRect(-10, -18, 20, 10);
  }

  _drawZigzag(ctx) {
    ctx.shadowBlur = 8; ctx.shadowColor = '#ffff00';
    ctx.fillStyle = '#cccc00';
    ctx.beginPath();
    ctx.moveTo(0, -16); ctx.lineTo(14, 0); ctx.lineTo(0, 16); ctx.lineTo(-14, 0);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffff44';
    ctx.beginPath();
    ctx.moveTo(0, -9); ctx.lineTo(7, 0); ctx.lineTo(0, 9); ctx.lineTo(-7, 0);
    ctx.closePath(); ctx.fill();
  }

  _drawCircler(ctx) {
    ctx.shadowBlur = 10; ctx.shadowColor = '#ff44ff';
    ctx.strokeStyle = '#ff44ff'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#cc22cc'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#ff44ff';
    ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
  }
}

// ─── Boss ────────────────────────────────────────────────────────────────────

export class Boss {
  constructor(stageIndex) {
    this.stageIndex = stageIndex;
    this.x = CANVAS_W / 2;
    this.y = -100;
    this.targetY = 150;
    this.entering = true;
    this.phase = 0;
    this.attackTimer = 0;
    this.moveTimer = 0;
    this.patrolDir = 1;
    this.orbitAngle = 0;
    this.dead = false;
    this.active = true;
    this.hitFlash = 0;

    const stats = [
      { hp: 100, name: 'VANGUARD Mk-I', r: 45, points: 5000 },
      { hp: 150, name: 'HYDRA',         r: 50, points: 8000 },
      { hp: 200, name: 'OMEGA CORE',    r: 55, points: 12000 },
    ];
    const s = stats[stageIndex - 1] ?? stats[0];
    this.hp = s.hp; this.maxHp = s.hp;
    this.name = s.name;
    this.r = s.r;
    this.points = s.points;
  }

  get phaseThresholds() { return [this.maxHp * 0.66, this.maxHp * 0.33]; }

  update(px, py, pool, audio) {
    if (this.entering) {
      this.y = lerp(this.y, this.targetY, 0.04);
      if (Math.abs(this.y - this.targetY) < 2) { this.y = this.targetY; this.entering = false; }
      return;
    }

    this.moveTimer++;
    this.attackTimer--;
    if (this.hitFlash > 0) this.hitFlash--;

    const prevPhase = this.phase;
    if (this.phase < 1 && this.hp <= this.phaseThresholds[0]) this.phase = 1;
    if (this.phase < 2 && this.hp <= this.phaseThresholds[1]) this.phase = 2;
    if (this.phase !== prevPhase) audio.play('phaseTransition');

    switch (this.stageIndex) {
      case 1: this._updateBoss1(px, py, pool); break;
      case 2: this._updateBoss2(px, py, pool); break;
      case 3: this._updateBoss3(px, py, pool); break;
    }
  }

  // Boss 1: Vanguard — left-right patrol + fan shots
  _updateBoss1(px, py, pool) {
    const speed = 1.5 + this.phase * 0.8;
    this.x += this.patrolDir * speed;
    if (this.x > CANVAS_W - 80 || this.x < 80) this.patrolDir *= -1;

    const cooldown = this.phase === 0 ? 60 : this.phase === 1 ? 45 : 30;
    if (this.attackTimer <= 0) {
      this.attackTimer = cooldown;
      const count = 3 + this.phase * 2;
      this._fireFan(px, py, pool, count, 15, '#ff8800', BULLET_SPEED_ENEMY + this.phase, 'orb');
      if (this.phase >= 1) {
        pool.spawn(this.x - 20, this.y + 30, 0, BULLET_SPEED_ENEMY + 1, 'enemy', '#ff4400', 2, 'orb');
        pool.spawn(this.x + 20, this.y + 30, 0, BULLET_SPEED_ENEMY + 1, 'enemy', '#ff4400', 2, 'orb');
      }
      if (this.phase >= 2) this._fireBurst(pool, 8, '#ff0000', BULLET_SPEED_ENEMY, 'ring');
    }
  }

  // Boss 2: Hydra — diagonal movement + spiral
  _updateBoss2(px, py, pool) {
    this.x += Math.sin(this.moveTimer * 0.02) * (2.5 + this.phase);
    this.y = 150 + Math.sin(this.moveTimer * 0.015) * 60;

    const cooldown = this.phase === 0 ? 50 : this.phase === 1 ? 40 : 28;
    if (this.attackTimer <= 0) {
      this.attackTimer = cooldown;
      if (this.phase === 0) {
        this._fireAimed(px, py, pool, '#44ffff', BULLET_SPEED_ENEMY + 1, 'orb');
        this._fireAimed(px, py, pool, '#44ffff', BULLET_SPEED_ENEMY + 1, 'orb', Math.PI / 8);
      }
      if (this.phase >= 1) {
        const spiral = (this.moveTimer / 5) % (Math.PI * 2);
        for (let i = 0; i < 8; i++) {
          const a = spiral + (i / 8) * Math.PI * 2;
          pool.spawn(this.x, this.y, Math.cos(a) * (BULLET_SPEED_ENEMY + 1), Math.sin(a) * (BULLET_SPEED_ENEMY + 1), 'enemy', '#44ffff', 1, 'orb');
        }
      }
      if (this.phase >= 2) this._fireFan(px, py, pool, 5, 20, '#00ffff', BULLET_SPEED_ENEMY + 2, 'ring');
    }
  }

  // Boss 3: Omega Core — orbit movement, multi-turret
  _updateBoss3(px, py, pool) {
    this.orbitAngle += 0.008 + this.phase * 0.004;
    this.x = CANVAS_W / 2 + Math.cos(this.orbitAngle) * 140;
    this.y = 180 + Math.sin(this.orbitAngle) * 70;

    const cooldown = this.phase === 0 ? 50 : this.phase === 1 ? 35 : 25;
    if (this.attackTimer <= 0) {
      this.attackTimer = cooldown;
      const turrets = [[0, -this.r], [0, this.r], [-this.r, 0], [this.r, 0]];
      for (const [tx, ty] of turrets) {
        this._fireAimed(px, py, pool, '#ff4444', BULLET_SPEED_ENEMY + 1, 'orb', 0, this.x + tx, this.y + ty);
      }
      if (this.phase >= 1) this._fireBurst(pool, 12, '#ff2222', BULLET_SPEED_ENEMY, 'ring');
      if (this.phase >= 2) {
        this._fireFan(px, py, pool, 7, 12, '#ff6666', BULLET_SPEED_ENEMY + 2, 'orb');
        this._fireBurst(pool, 6, '#ff0000', BULLET_SPEED_ENEMY + 1, 'ring');
      }
    }
  }

  _fireAimed(px, py, pool, color, speed, shape, angleOffset = 0, ox, oy) {
    const sx = ox ?? this.x; const sy = oy ?? this.y;
    const angle = Math.atan2(py - sy, px - sx) + angleOffset;
    pool.spawn(sx, sy, Math.cos(angle) * speed, Math.sin(angle) * speed, 'enemy', color, 1, shape);
  }

  _fireFan(px, py, pool, count, spreadDeg, color, speed, shape) {
    const base = Math.atan2(py - this.y, px - this.x);
    const half = ((count - 1) * spreadDeg / 2) * Math.PI / 180;
    for (let i = 0; i < count; i++) {
      const a = base - half + i * spreadDeg * Math.PI / 180;
      pool.spawn(this.x, this.y, Math.cos(a) * speed, Math.sin(a) * speed, 'enemy', color, 1, shape);
    }
  }

  _fireBurst(pool, count, color, speed, shape) {
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      pool.spawn(this.x, this.y, Math.cos(a) * speed, Math.sin(a) * speed, 'enemy', color, 1, shape);
    }
  }

  hit(dmg) {
    this.hp -= dmg;
    this.hitFlash = 6;
    if (this.hp <= 0) { this.hp = 0; this.dead = true; this.active = false; return true; }
    return false;
  }

  draw(ctx, frame) {
    ctx.save();
    ctx.translate(this.x, this.y);
    if (this.hitFlash > 0) ctx.globalAlpha = 0.5 + 0.5 * Math.sin(frame * 1.5);
    switch (this.stageIndex) {
      case 1: this._drawBoss1(ctx, frame); break;
      case 2: this._drawBoss2(ctx, frame); break;
      case 3: this._drawBoss3(ctx, frame); break;
    }
    ctx.restore();
  }

  _drawBoss1(ctx, frame) {
    ctx.shadowBlur = 20; ctx.shadowColor = '#ffaa00';
    ctx.fillStyle = '#cc6600';
    ctx.fillRect(-40, -25, 80, 50);
    ctx.fillStyle = '#ffaa00';
    ctx.fillRect(-60, -15, 25, 30);
    ctx.fillRect(35, -15, 25, 30);
    ctx.fillStyle = '#ff6600';
    ctx.fillRect(-20, -35, 40, 20);
    ctx.fillStyle = '#ffff00';
    const eng = Math.abs(Math.sin(frame * 0.15)) * 8;
    ctx.fillRect(-15, 20, 12, 8 + eng);
    ctx.fillRect(3, 20, 12, 8 + eng);
  }

  _drawBoss2(ctx, frame) {
    ctx.shadowBlur = 20; ctx.shadowColor = '#00ff88';
    ctx.strokeStyle = '#00ff88'; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -50); ctx.lineTo(50, 0); ctx.lineTo(0, 50); ctx.lineTo(-50, 0);
    ctx.closePath(); ctx.stroke();
    ctx.fillStyle = '#004422';
    ctx.fill();
    ctx.fillStyle = '#00ff88';
    ctx.fillRect(-65, -8, 20, 16);
    ctx.fillRect(45, -8, 20, 16);
    ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fillStyle = '#00aa55'; ctx.fill();
    ctx.strokeStyle = '#00ffaa'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.stroke();
  }

  _drawBoss3(ctx, frame) {
    ctx.shadowBlur = 25; ctx.shadowColor = '#ff2222';
    ctx.strokeStyle = '#ff4444'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(0, 0, 45, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#330000';
    ctx.beginPath(); ctx.arc(0, 0, 45, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ff2222'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, 30, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#ff4444';
    ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff2222';
    const turrets = [[0, -45], [0, 45], [-45, 0], [45, 0]];
    for (const [tx, ty] of turrets) {
      ctx.fillRect(tx - 6, ty - 6, 12, 12);
    }
    ctx.strokeStyle = '#ff6666'; ctx.lineWidth = 1;
    const rot = frame * 0.03;
    for (let i = 0; i < 6; i++) {
      const a = rot + (i / 6) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 14, Math.sin(a) * 14);
      ctx.lineTo(Math.cos(a) * 42, Math.sin(a) * 42);
      ctx.stroke();
    }
  }
}
