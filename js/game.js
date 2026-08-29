import { Bird } from "./bird.js";
import { World } from "./world.js";
import { getLevel, ENDLESS, LAST_LEVEL } from "./levels.js";
import { audio } from "./audio.js";
import { writeSave } from "./storage.js";
import { showRewardedRevive } from "./monetization.js";
import { flushPlaytime, notePlaytime } from "./analytics.js";

export class Game {
  constructor(canvas, ui, save) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.ui = ui;
    this.save = save;
    this.bird = new Bird();
    this.world = new World();
    this.mode = "menu";
    this.levelId = 1;
    this.endless = false;
    this.shake = 0;
    this.freeze = 0;
    this.splash = 0;
    this.hint = 0;
    this.dpr = 1;
    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  birdX() {
    return Math.max(72, Math.min(140, this.world.viewW * 0.16));
  }

  resize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, window.innerWidth);
    const h = Math.max(1, window.innerHeight);
    this.canvas.width = Math.floor(w * this.dpr);
    this.canvas.height = Math.floor(h * this.dpr);
    this.world.setSize(w, h);
  }

  startCampaign(levelId) {
    this.endless = false;
    this.levelId = levelId;
    this.begin(getLevel(levelId));
  }

  startEndless() {
    this.endless = true;
    this.levelId = "endless";
    const cfg = { ...ENDLESS, seed: (Date.now() % 99991) + 3 };
    this.begin(cfg);
  }

  begin(cfg) {
    this.cfg = cfg;
    this.world.start(cfg);
    this.bird.reset(this.world.viewH * 0.45);
    this.mode = "ready";
    this.freeze = 0;
    this.shake = 0;
    this.hint = cfg.id === 1 ? 3.4 : 0;
    this.splash = 0;
    this.ui.showReady({
      endless: this.endless,
      level: this.endless ? null : this.levelId,
    });
  }

  startFlying() {
    if (this.mode !== "ready") return;
    this.mode = "play";
    this.ui.hideReady();
    this.ui.setPlaying(true, {
      endless: this.endless,
      level: this.endless ? null : this.levelId,
    });
    this.bird.flap();
  }

  tap() {
    if (this.mode !== "play") return;
    const kind = this.bird.flap();
    if (kind) {
      audio.flap();
      this.world.burst(this.birdX(), this.bird.y, 6);
      if (this.save.vibration && navigator.vibrate) navigator.vibrate(8);
    }
  }

  update(dt) {
    if (this.mode !== "play") {
      this.drawBackdrop();
      return;
    }
    notePlaytime(dt);
    this.ui.setSplash(null);

    this.bird.update(dt);
    this.world.update(dt, this.birdX(), this.bird.y);
    this.hint = Math.max(0, this.hint - dt);

    const hit = this.world.collide(this.birdX(), this.bird.hitbox());
    if (hit) {
      this.die();
      return;
    }

    if (!this.endless && this.world.crossedFinish(this.birdX())) {
      this.completeLevel();
      return;
    }

    this.ui.setHud({
      distance: Math.floor(this.world.distance),
      level: this.endless ? null : this.levelId,
      hint: this.hint > 0,
    });
    this.draw();
  }

  pause() {
    if (this.mode !== "play") return;
    flushPlaytime();
    this.mode = "pause";
    this.ui.showPause({
      level: this.endless ? null : this.levelId,
      distance: this.world.distance,
    });
  }

  resume() {
    if (this.mode !== "pause") return;
    this.mode = "play";
    this.ui.hidePause();
    this.ui.setPlaying(true, {
      endless: this.endless,
      level: this.endless ? null : this.levelId,
    });
  }

  togglePause() {
    if (this.mode === "play") this.pause();
    else if (this.mode === "pause") this.resume();
  }

  restartLevel() {
    if (!this.cfg) return;
    this.begin(this.cfg);
  }

  goToMenu() {
    flushPlaytime();
    this.mode = "menu";
    this.ui.showMenu(this.save);
  }

  die() {
    flushPlaytime();
    void showRewardedRevive();
    audio.die();
    this.bird.dead = true;
    this.shake = 0;
    this.mode = "dead";
    this.world.burst(this.birdX(), this.bird.y, 16);
    if (this.save.vibration && navigator.vibrate) navigator.vibrate(24);
    const dist = Math.floor(this.world.distance);
    if (this.endless && dist > this.save.endlessBest) {
      this.save.endlessBest = dist;
      writeSave(this.save);
    }
    this.ui.showGameOver({
      distance: dist,
      best: this.endless ? this.save.endlessBest : null,
      level: this.endless ? null : this.levelId,
    });
  }

  completeLevel() {
    flushPlaytime();
    audio.win();
    this.save.hasCampaign = true;
    this.save.endlessUnlocked = true;
    const dist = Math.floor(this.world.distance);
    if (this.levelId >= LAST_LEVEL) {
      this.save.campaignComplete = true;
      this.save.campaignLevel = LAST_LEVEL;
      this.save.unlockedLevel = LAST_LEVEL;
      writeSave(this.save);
      this.mode = "share";
      this.ui.showShare({
        kind: "campaign",
        level: LAST_LEVEL,
        distance: dist,
      });
      this.ui.setPlaying(false);
      this.draw();
      return;
    }
    const next = this.levelId + 1;
    this.save.unlockedLevel = Math.max(this.save.unlockedLevel || 1, next);
    this.save.campaignLevel = Math.max(this.save.campaignLevel || 1, next);
    writeSave(this.save);
    this.mode = "cleared";
    this.ui.showCleared({
      level: this.levelId,
      next: next,
      distance: dist,
    });
    this.draw();
  }

  goToNextLevel() {
    if (this.mode !== "cleared") return;
    this.startCampaign(this.levelId + 1);
  }

  applyCamera() {
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  drawBackdrop() {
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.fillStyle = "#1b1033";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.applyCamera();
    if (!this.cfg) {
      this.world.cfg = this.world.cfg || { dusk: 0.3, speed: 0, gap: 0.4 };
      this.world.drawSky(this.ctx);
    } else {
      this.world.draw(this.ctx);
      this.bird.draw(this.ctx, this.birdX());
    }
  }

  draw() {
    const ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#1b1033";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.applyCamera();
    this.world.draw(ctx);
    this.bird.draw(ctx, this.birdX());
  }
}
