export class InputManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.active = false;
    this.rawX = 0;
    this.rawY = 0;
    this.bombPressed = false;
    this.canvasRect = canvas.getBoundingClientRect();
    this.scaleX = 1;
    this.scaleY = 1;
    this._updateScale();

    canvas.addEventListener('touchstart', this._onTouchStart.bind(this), { passive: false });
    canvas.addEventListener('touchmove', this._onTouchMove.bind(this), { passive: false });
    canvas.addEventListener('touchend', this._onTouchEnd.bind(this), { passive: false });
    canvas.addEventListener('touchcancel', this._onTouchEnd.bind(this), { passive: false });
    canvas.addEventListener('mousedown', this._onMouseDown.bind(this));
    canvas.addEventListener('mousemove', this._onMouseMove.bind(this));
    canvas.addEventListener('mouseup', this._onMouseUp.bind(this));
    window.addEventListener('resize', this._updateScale.bind(this));
  }

  _updateScale() {
    this.canvasRect = this.canvas.getBoundingClientRect();
    this.scaleX = this.canvas.width / (this.canvasRect.width || 1);
    this.scaleY = this.canvas.height / (this.canvasRect.height || 1);
  }

  _toCanvas(clientX, clientY) {
    return {
      x: (clientX - this.canvasRect.left) * this.scaleX,
      y: (clientY - this.canvasRect.top) * this.scaleY,
    };
  }

  _onTouchStart(e) {
    e.preventDefault();
    this.active = true;
    const t = e.touches[0];
    const p = this._toCanvas(t.clientX, t.clientY);
    this.rawX = p.x;
    this.rawY = p.y;
    if (e.touches.length >= 2) this.bombPressed = true;
  }

  _onTouchMove(e) {
    e.preventDefault();
    const t = e.touches[0];
    const p = this._toCanvas(t.clientX, t.clientY);
    this.rawX = p.x;
    this.rawY = p.y;
  }

  _onTouchEnd(e) {
    e.preventDefault();
    if (e.touches.length === 0) this.active = false;
  }

  _onMouseDown(e) {
    this.active = true;
    const p = this._toCanvas(e.clientX, e.clientY);
    this.rawX = p.x;
    this.rawY = p.y;
  }

  _onMouseMove(e) {
    if (!this.active) return;
    const p = this._toCanvas(e.clientX, e.clientY);
    this.rawX = p.x;
    this.rawY = p.y;
  }

  _onMouseUp() {
    this.active = false;
  }

  getPointer() {
    return { active: this.active, x: this.rawX, y: this.rawY };
  }
}
