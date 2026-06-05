export const CANVAS_W = 480;
export const CANVAS_H = 854;

export const PLAYER_SPEED_BASE = 4;
export const BULLET_SPEED_PLAYER = 11;
export const BULLET_SPEED_ENEMY = 4;
export const MAX_OPTIONS = 4;
export const ITEM_RADIUS = 14;
export const POS_HISTORY_MAX = 120;
export const OPTION_TRAIL_GAP = 20;

export function circleCollide(ax, ay, ar, bx, by, br) {
  const dx = ax - bx;
  const dy = ay - by;
  const r = ar + br;
  return dx * dx + dy * dy < r * r;
}

export function rectCircleCollide(rx, ry, rw, rh, cx, cy, cr) {
  const nearX = Math.max(rx, Math.min(cx, rx + rw));
  const nearY = Math.max(ry, Math.min(cy, ry + rh));
  const dx = cx - nearX;
  const dy = cy - nearY;
  return dx * dx + dy * dy < cr * cr;
}

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function randomRange(lo, hi) {
  return lo + Math.random() * (hi - lo);
}

export function randomInt(lo, hi) {
  return Math.floor(lo + Math.random() * (hi - lo + 1));
}

export function angleTowards(x1, y1, x2, y2) {
  return Math.atan2(y2 - y1, x2 - x1);
}

export function vecFromAngle(angle) {
  return { x: Math.cos(angle), y: Math.sin(angle) };
}

export function weightedRandom(weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return weights.length - 1;
}
