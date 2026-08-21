import { GRAVITY, FLAP_V, MAX_FALL, BIRD_W, BIRD_H } from "./constants.js";
import { cosmetics } from "./monetization.js";

export class Bird {
  constructor() {
    this.reset(200);
  }

  reset(y) {
    this.y = y;
    this.vy = 0;
    this.wing = 0;
    this.squashX = 1;
    this.squashY = 1;
    this.tilt = 0;
    this.dead = false;
  }

  hitbox() {
    return {
      y: this.y - BIRD_H * 0.32,
      w: BIRD_W * 0.62,
      h: BIRD_H * 0.62,
    };
  }

  flap() {
    if (this.dead) return null;
    this.vy = FLAP_V;
    this.squashX = 0.82;
    this.squashY = 1.22;
    this.wing = 0;
    return "flap";
  }

  update(dt) {
    this.squashX += (1 - this.squashX) * Math.min(1, dt * 12);
    this.squashY += (1 - this.squashY) * Math.min(1, dt * 12);
    this.wing += dt * 18;
    this.vy += GRAVITY * dt;
    if (this.vy > MAX_FALL) this.vy = MAX_FALL;
    this.y += this.vy * dt;
    const targetTilt = Math.max(-0.55, Math.min(0.7, this.vy / 700));
    this.tilt += (targetTilt - this.tilt) * 8 * dt;
  }

  draw(ctx, x) {
    ctx.save();
    ctx.translate(x, this.y);
    ctx.rotate(this.tilt);
    ctx.scale(this.squashX, this.squashY);

    const wing = Math.sin(this.wing) * 10;
    const body = cosmetics.birdTint || "#e8b45a";
    const chest = cosmetics.birdChest || "#f7ead3";
    const ink = cosmetics.birdOutline || "#2a1838";

    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.strokeStyle = ink;
    ctx.lineWidth = 2.4;

    ctx.fillStyle = "#d4923a";
    ctx.beginPath();
    ctx.ellipse(-3, -2, 15, 5, -0.45 + wing * 0.04, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.ellipse(0, 0, 17, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = chest;
    ctx.beginPath();
    ctx.ellipse(3, 3, 10, 6, 0.15, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.ellipse(13, -4, 8, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#c45c28";
    ctx.beginPath();
    ctx.moveTo(20, -3);
    ctx.lineTo(28, -1);
    ctx.lineTo(20, 1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.moveTo(-15, 2);
    ctx.quadraticCurveTo(-26, 0, -24, 9);
    ctx.quadraticCurveTo(-16, 4, -12, 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = ink;
    ctx.beginPath();
    ctx.arc(16, -5, 1.6, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
