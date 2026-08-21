import { COLORS } from "./constants.js";

export function mulberry32(a) {
  return function rand() {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class World {
  constructor() {
    this.pipes = [];
    this.particles = [];
    this.distance = 0;
    this.speed = 150;
    this.cfg = null;
    this.rand = () => Math.random();
    this.viewW = 800;
    this.viewH = 450;
  }

  setSize(w, h) {
    this.viewW = Math.max(320, w);
    this.viewH = Math.max(240, h);
  }

  start(cfg) {
    this.cfg = cfg;
    this.rand = mulberry32(cfg.seed || 1);
    this.pipes = [];
    this.particles = [];
    this.distance = 0;
    this.speed = cfg.speed;
    this.cursor = Math.max(260, Math.min(480, this.viewW * 0.5));
    while (this.shouldSpawn()) this.spawn();
  }

  finishX() {
    if (!this.cfg || this.cfg.id === "endless" || !Number.isFinite(this.cfg.distance)) return null;
    return this.cfg.distance;
  }

  shouldSpawn() {
    if (this.cursor >= this.distance + this.viewW * 1.8) return false;
    const finish = this.finishX();
    if (finish == null) return true;
    return this.cursor < finish - 110;
  }

  crossedFinish(birdX) {
    const finish = this.finishX();
    if (finish == null) return false;
    return this.distance + birdX >= finish;
  }

  spawn() {
    const cfg = this.cfg;
    const gap = cfg.gap || 0.38;
    const margin = 0.14;
    const center = margin + gap / 2 + this.rand() * (1 - margin * 2 - gap);
    const w = Math.max(52, Math.min(72, this.viewH * 0.12));
    this.pipes.push({
      x: this.cursor,
      w,
      gapCenter: center,
      gapSize: gap,
    });
    this.cursor += cfg.spacing || 240;
  }

  pipeRects(p) {
    const gapH = p.gapSize * this.viewH;
    const mid = p.gapCenter * this.viewH;
    const top = mid - gapH / 2;
    const bot = mid + gapH / 2;
    return { top, bot, x: p.x, w: p.w };
  }

  update(dt, birdX, birdY) {
    if (this.cfg.speedGain) {
      this.speed = Math.min(this.cfg.maxSpeed || 280, this.speed + this.cfg.speedGain * dt);
    }
    this.distance += this.speed * dt;
    while (this.shouldSpawn()) this.spawn();
    this.pipes = this.pipes.filter((p) => p.x + p.w > this.distance - 40);
    for (const p of this.particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 380 * dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
    if (Math.random() < dt * 10) {
      this.particles.push({
        x: birdX - 10,
        y: birdY + 4,
        vx: -50 - Math.random() * 40,
        vy: -8,
        life: 0.3,
        r: 1.4,
      });
    }
  }

  worldToScreen(x) {
    return x - this.distance;
  }

  collide(birdX, box) {
    const pad = 3;
    const left = this.distance + birdX - box.w * 0.2;
    const right = this.distance + birdX + box.w * 0.55;
    const top = box.y;
    const bottom = box.y + box.h;
    if (top < 8 || bottom > this.viewH - 8) return "edge";
    for (const p of this.pipes) {
      const r = this.pipeRects(p);
      if (right < r.x + pad || left > r.x + r.w - pad) continue;
      if (top < r.top - pad || bottom > r.bot + pad) return "pipe";
    }
    return null;
  }

  burst(x, y, n = 10) {
    for (let i = 0; i < n; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 180,
        vy: -40 - Math.random() * 120,
        life: 0.3 + Math.random() * 0.3,
        r: 1 + Math.random() * 2,
      });
    }
  }

  drawSky(ctx) {
    const dusk = this.cfg?.dusk || 0.25;
    const w = this.viewW;
    const h = this.viewH;
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, mix("#0c0820", COLORS.skyTop, 1 - dusk * 0.5));
    g.addColorStop(0.45, mix("#4a1d4a", COLORS.skyMid, 1 - dusk * 0.35));
    g.addColorStop(1, mix("#7a4a2a", COLORS.skyLow, 1 - dusk * 0.55));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    const sunX = w * 0.78;
    const sunY = h * 0.22 + dusk * h * 0.12;
    const sunG = ctx.createRadialGradient(sunX, sunY, 4, sunX, sunY, h * 0.22);
    sunG.addColorStop(0, "rgba(255, 230, 160, 0.95)");
    sunG.addColorStop(0.4, "rgba(255, 170, 80, 0.35)");
    sunG.addColorStop(1, "rgba(255, 140, 60, 0)");
    ctx.fillStyle = sunG;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = COLORS.sun;
    ctx.beginPath();
    ctx.arc(sunX, sunY, Math.max(16, h * 0.035), 0, Math.PI * 2);
    ctx.fill();

    this.drawHills(ctx, 0.22, h * 0.72, "#2a1838", h * 0.08);
    this.drawHills(ctx, 0.4, h * 0.8, "#1a1028", h * 0.06);
  }

  drawHills(ctx, parallax, base, color, amp) {
    const off = this.distance * parallax;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, this.viewH);
    for (let x = 0; x <= this.viewW; x += 10) {
      const wx = x + off;
      const y = base + Math.sin(wx * 0.012) * amp + Math.sin(wx * 0.03) * amp * 0.4;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(this.viewW, this.viewH);
    ctx.closePath();
    ctx.fill();
  }

  drawPipe(ctx, x, y, w, h, capAt) {
    ctx.fillStyle = COLORS.pipe;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = COLORS.pipeLip;
    const lip = 10;
    if (capAt === "bottom") ctx.fillRect(x - 8, y + h - lip, w + 16, lip);
    else ctx.fillRect(x - 8, y, w + 16, lip);
    ctx.fillStyle = COLORS.gold;
    ctx.globalAlpha = 0.35;
    if (capAt === "bottom") ctx.fillRect(x - 8, y + h - 3, w + 16, 3);
    else ctx.fillRect(x - 8, y, w + 16, 3);
    ctx.globalAlpha = 1;
  }

  drawFinish(ctx) {
    const finish = this.finishX();
    if (finish == null) return;
    const x = this.worldToScreen(finish);
    const w = 20;
    if (x < -w || x > this.viewW + w) return;
    const cell = 14;
    ctx.save();
    for (let y = 0; y < this.viewH; y += cell) {
      const even = Math.floor(y / cell) % 2 === 0;
      ctx.fillStyle = even ? "#f7ead3" : "#0b0814";
      ctx.fillRect(x - w / 2, y, w / 2, cell);
      ctx.fillStyle = even ? "#0b0814" : "#f7ead3";
      ctx.fillRect(x, y, w / 2, cell);
    }
    ctx.fillStyle = COLORS.gold;
    ctx.fillRect(x - 2, 0, 4, 10);
    ctx.beginPath();
    ctx.moveTo(x + 2, 8);
    ctx.lineTo(x + 38, 22);
    ctx.lineTo(x + 2, 36);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#2a1838";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }

  draw(ctx) {
    this.drawSky(ctx);
    for (const p of this.pipes) {
      const x = this.worldToScreen(p.x);
      if (x > this.viewW + 30 || x + p.w < -30) continue;
      const r = this.pipeRects(p);
      this.drawPipe(ctx, x, 0, r.w, r.top, "bottom");
      this.drawPipe(ctx, x, r.bot, r.w, this.viewH - r.bot, "top");
    }
    this.drawFinish(ctx);
    ctx.fillStyle = "rgba(247,234,211,0.55)";
    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.life * 2);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

function mix(a, b, t) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ar = (pa >> 16) & 255,
    ag = (pa >> 8) & 255,
    ab = pa & 255;
  const br = (pb >> 16) & 255,
    bg = (pb >> 8) & 255,
    bb = pb & 255;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `rgb(${r},${g},${bl})`;
}
