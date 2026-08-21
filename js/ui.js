import { i18n } from "./i18n.js";
import { CAMPAIGN, LAST_LEVEL } from "./levels.js";

export class UI {
  constructor(hooks) {
    this.els = {
      menu: document.getElementById("menu"),
      settings: document.getElementById("settings"),
      confirm: document.getElementById("confirm"),
      map: document.getElementById("map"),
      share: document.getElementById("share"),
      paused: document.getElementById("paused"),
      gameover: document.getElementById("gameover"),
      cleared: document.getElementById("cleared"),
      ready: document.getElementById("ready"),
      hud: document.getElementById("hud"),
      splash: document.getElementById("splash"),
    };
    this.hooks = hooks;
    this.bind();
  }

  bind() {
    const tap = (id, fn) => {
      const el = document.getElementById(id);
      if (!el) return;
      const run = (e) => {
        e.preventDefault();
        e.stopPropagation();
        fn(e);
      };
      el.addEventListener("click", run);
      el.addEventListener("pointerdown", (e) => e.stopPropagation());
    };
    tap("btn-new", () => this.hooks.onNewGame());
    tap("btn-continue", () => this.hooks.onContinue());
    tap("btn-endless", () => this.hooks.onEndless());
    tap("btn-settings", () => this.hooks.onSettings());
    tap("btn-back", () => this.hooks.onBack());
    tap("btn-map-back", () => this.hooks.onBack());
    tap("btn-cancel", () => this.hooks.onBack());
    tap("btn-reset", () => this.hooks.onReset());
    tap("tog-music", () => this.hooks.onMusic());
    tap("tog-sfx", () => this.hooks.onSfx());
    tap("tog-vib", () => this.hooks.onVibration());
    tap("btn-retry", () => this.hooks.onShareRetry());
    tap("btn-menu", () => this.hooks.onShareMenu());
    tap("btn-copy", () => this.hooks.onCopy());
    tap("btn-share", () => this.hooks.onNativeShare());
    tap("btn-pause", () => this.hooks.onPause());
    tap("btn-resume", () => this.hooks.onResume());
    tap("btn-pause-restart", () => this.hooks.onRestartLevel());
    tap("btn-pause-menu", () => this.hooks.onShareMenu());
    tap("btn-over-restart", () => this.hooks.onRestartLevel());
    tap("btn-over-menu", () => this.hooks.onShareMenu());
    tap("btn-start", () => this.hooks.onStart());
    tap("btn-next-level", () => this.hooks.onNextLevel());
    tap("btn-cleared-menu", () => this.hooks.onShareMenu());
    const lang = document.getElementById("lang");
    if (lang) lang.onchange = (e) => this.hooks.onLang(e.target.value);
  }

  t() {
    const map = [
      ["btn-new", "newGame"],
      ["btn-continue", "continue"],
      ["btn-endless", "endless"],
      ["btn-settings", "settings"],
      ["btn-back", "back"],
      ["btn-map-back", "back"],
      ["btn-cancel", "cancel"],
      ["btn-reset", "reset"],
      ["btn-retry", "playAgain"],
      ["btn-menu", "menu"],
      ["btn-copy", "copyLink"],
      ["btn-share", "share"],
      ["lbl-settings-title", "settings"],
      ["tagline", "tagline"],
      ["lbl-lang", "language"],
      ["lbl-music", "music"],
      ["lbl-sfx", "sfx"],
      ["lbl-vib", "vibration"],
      ["confirm-title", "confirmTitle"],
      ["confirm-body", "confirmBody"],
      ["pause-title", "paused"],
      ["btn-resume", "resume"],
      ["btn-pause-restart", "restart"],
      ["btn-pause-menu", "mainMenu"],
      ["over-title", "crashed"],
      ["btn-over-restart", "restart"],
      ["btn-over-menu", "mainMenu"],
      ["btn-start", "start"],
      ["cleared-title", "levelClear"],
      ["btn-next-level", "nextLevel"],
      ["btn-cleared-menu", "mainMenu"],
      ["map-title", "tagline"],
      ["map-hint", "mapHint"],
    ];
    for (const [id, key] of map) {
      const el = document.getElementById(id);
      if (el) el.textContent = i18n.t(key);
    }
    const hint = document.getElementById("hud-hint");
    if (hint) hint.textContent = i18n.t("hint");
  }

  setCanvasPlaying(on) {
    const canvas = document.getElementById("game");
    if (canvas) canvas.classList.toggle("playing", !!on);
  }

  showMenu(save) {
    this.setCanvasPlaying(false);
    this.hideAll();
    this.els.menu.classList.remove("hidden");
    const cont = document.getElementById("btn-continue");
    cont.disabled = !save.hasCampaign;
    const endless = document.getElementById("btn-endless");
    if (endless) endless.classList.toggle("hidden", !save.endlessUnlocked);
    this.t();
  }

  showSettings(save) {
    this.hideAll();
    this.els.settings.classList.remove("hidden");
    document.getElementById("lang").value = i18n.lang;
    this.syncToggles(save);
    this.t();
  }

  syncToggles(save) {
    document.getElementById("tog-music").textContent = save.music ? i18n.t("on") : i18n.t("off");
    document.getElementById("tog-sfx").textContent = save.sfx ? i18n.t("on") : i18n.t("off");
    document.getElementById("tog-vib").textContent = save.vibration ? i18n.t("on") : i18n.t("off");
  }

  setPlaying(on, meta = {}) {
    this.setCanvasPlaying(!!on);
    this.els.menu.classList.add("hidden");
    this.els.settings.classList.add("hidden");
    this.els.confirm.classList.add("hidden");
    if (this.els.map) this.els.map.classList.add("hidden");
    this.els.share.classList.add("hidden");
    this.els.paused.classList.add("hidden");
    this.els.gameover.classList.add("hidden");
    if (this.els.cleared) this.els.cleared.classList.add("hidden");
    if (this.els.ready) this.els.ready.classList.add("hidden");
    this.els.hud.classList.toggle("hidden", !on);
    const pauseBtn = document.getElementById("btn-pause");
    if (pauseBtn) pauseBtn.classList.toggle("hidden", !on);
    if (on) {
      document.getElementById("hud-level").textContent = meta.endless
        ? i18n.t("endless")
        : `${i18n.t("level")} ${meta.level}`;
    }
  }

  setHud({ distance, level, hint }) {
    document.getElementById("hud-dist").textContent = `${Math.floor(distance)} m`;
    document.getElementById("hud-hint").classList.toggle("hidden", !hint);
    if (level) document.getElementById("hud-level").textContent = `${i18n.t("level")} ${level}`;
  }

  setSplash(text) {
    if (!text) {
      this.els.splash.classList.add("hidden");
      return;
    }
    this.els.splash.classList.remove("hidden");
    this.els.splash.textContent = text === "Endless" ? i18n.t("endless") : `${i18n.t("level")} ${text}`;
  }

  showReady(meta = {}) {
    this.setCanvasPlaying(false);
    this.els.menu.classList.add("hidden");
    this.els.settings.classList.add("hidden");
    this.els.confirm.classList.add("hidden");
    if (this.els.map) this.els.map.classList.add("hidden");
    this.els.paused.classList.add("hidden");
    this.els.gameover.classList.add("hidden");
    this.els.share.classList.add("hidden");
    if (this.els.cleared) this.els.cleared.classList.add("hidden");
    this.els.ready.classList.remove("hidden");
    this.els.hud.classList.remove("hidden");
    const pauseBtn = document.getElementById("btn-pause");
    if (pauseBtn) pauseBtn.classList.add("hidden");
    const title = document.getElementById("ready-title");
    if (title) {
      title.textContent = meta.endless ? i18n.t("endless") : `${i18n.t("level")} ${meta.level}`;
    }
    const body = document.getElementById("ready-body");
    if (body) body.textContent = i18n.t("readyHint");
    if (meta.level || meta.endless) {
      document.getElementById("hud-level").textContent = meta.endless
        ? i18n.t("endless")
        : `${i18n.t("level")} ${meta.level}`;
    }
    document.getElementById("hud-dist").textContent = "0 m";
    this.t();
    if (title && meta.endless) title.textContent = i18n.t("endless");
    else if (title) title.textContent = `${i18n.t("level")} ${meta.level}`;
  }

  hideReady() {
    if (this.els.ready) this.els.ready.classList.add("hidden");
  }

  showPause(info = {}) {
    this.setCanvasPlaying(false);
    this.els.paused.classList.remove("hidden");
    this.els.gameover.classList.add("hidden");
    if (this.els.map) this.els.map.classList.add("hidden");
    if (this.els.cleared) this.els.cleared.classList.add("hidden");
    if (this.els.ready) this.els.ready.classList.add("hidden");
    const pauseBtn = document.getElementById("btn-pause");
    if (pauseBtn) pauseBtn.classList.add("hidden");
    const body = document.getElementById("pause-body");
    if (body) {
      const bits = [];
      if (info.level) bits.push(`${i18n.t("level")} ${info.level}`);
      if (info.distance != null) bits.push(`${i18n.t("distance")} ${Math.floor(info.distance)} m`);
      body.textContent = bits.join(" · ");
    }
    this.t();
  }

  hidePause() {
    this.els.paused.classList.add("hidden");
    this.setCanvasPlaying(true);
    const pauseBtn = document.getElementById("btn-pause");
    if (pauseBtn) pauseBtn.classList.remove("hidden");
  }

  showGameOver(info = {}) {
    this.setCanvasPlaying(false);
    this.els.paused.classList.add("hidden");
    this.els.gameover.classList.remove("hidden");
    if (this.els.map) this.els.map.classList.add("hidden");
    if (this.els.cleared) this.els.cleared.classList.add("hidden");
    if (this.els.ready) this.els.ready.classList.add("hidden");
    const pauseBtn = document.getElementById("btn-pause");
    if (pauseBtn) pauseBtn.classList.add("hidden");
    const body = document.getElementById("over-body");
    if (body) {
      const bits = [`${i18n.t("distance")} ${Math.floor(info.distance || 0)} m`];
      if (info.best != null) bits.push(`${i18n.t("best")} ${Math.floor(info.best)} m`);
      if (info.level) bits.push(`${i18n.t("level")} ${info.level}`);
      body.textContent = bits.join(" · ");
    }
    this.t();
  }

  showMap(save) {
    this.setCanvasPlaying(false);
    this.hideAll();
    this.els.map.classList.remove("hidden");
    this.t();
    const last = Math.max(1, CAMPAIGN.length - 1);
    const nodes = CAMPAIGN.map((lvl, i) => ({
      id: lvl.id,
      x: i % 2 === 0 ? 22 : 78,
      y: 94 - (i * 88) / last,
    }));
    const trail = document.querySelector(".map-trail path");
    if (trail) {
      trail.setAttribute(
        "d",
        nodes.map((n, i) => `${i ? "L" : "M"} ${n.x} ${n.y}`).join(" ")
      );
    }
    const wrap = document.getElementById("level-map");
    wrap.innerHTML = "";
    const unlocked = save.unlockedLevel || 1;
    const current = save.campaignLevel || 1;
    for (const n of nodes) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "map-node";
      btn.textContent = String(n.id);
      btn.style.left = `${n.x}%`;
      btn.style.top = `${n.y}%`;
      if (n.id <= unlocked) {
        btn.classList.add("unlocked");
        if (n.id < unlocked || save.campaignComplete) btn.classList.add("done");
        if (!save.campaignComplete && n.id === current) btn.classList.add("current");
        if (save.campaignComplete && n.id === LAST_LEVEL) btn.classList.add("current");
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.hooks.onPickLevel(n.id);
        });
      } else {
        btn.classList.add("locked");
        btn.disabled = true;
      }
      btn.addEventListener("pointerdown", (e) => e.stopPropagation());
      wrap.appendChild(btn);
    }
    const currentBtn = wrap.querySelector(".map-node.current");
    if (currentBtn) {
      requestAnimationFrame(() => {
        currentBtn.scrollIntoView({ block: "center", inline: "nearest" });
      });
    }
    const oldEndless = document.getElementById("map-endless");
    if (oldEndless) oldEndless.remove();
    if (save.endlessUnlocked) {
      const endless = document.createElement("button");
      endless.id = "map-endless";
      endless.type = "button";
      endless.className = "btn";
      endless.textContent = save.endlessBest
        ? `${i18n.t("endless")} · ${save.endlessBest} m`
        : i18n.t("endless");
      endless.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.hooks.onEndless();
      });
      endless.addEventListener("pointerdown", (e) => e.stopPropagation());
      this.els.map.insertBefore(endless, document.getElementById("btn-map-back"));
    }
  }

  showConfirm() {
    this.setCanvasPlaying(false);
    this.hideAll();
    this.els.confirm.classList.remove("hidden");
    this.t();
  }

  showCleared(info = {}) {
    this.setCanvasPlaying(false);
    this.els.menu.classList.add("hidden");
    this.els.paused.classList.add("hidden");
    this.els.gameover.classList.add("hidden");
    if (this.els.ready) this.els.ready.classList.add("hidden");
    this.els.share.classList.add("hidden");
    if (this.els.map) this.els.map.classList.add("hidden");
    this.els.cleared.classList.remove("hidden");
    const pauseBtn = document.getElementById("btn-pause");
    if (pauseBtn) pauseBtn.classList.add("hidden");
    const body = document.getElementById("cleared-body");
    if (body) {
      const bits = [];
      if (info.level) bits.push(`${i18n.t("level")} ${info.level}`);
      if (info.distance != null) bits.push(`${i18n.t("distance")} ${Math.floor(info.distance)} m`);
      body.textContent = bits.join(" · ");
    }
    this.t();
  }

  showShare(payload) {
    this.setCanvasPlaying(false);
    this.hideAll();
    this.els.share.classList.remove("hidden");
    const title = document.getElementById("share-title");
    const body = document.getElementById("share-body");
    if (payload.kind === "campaign") {
      title.textContent = i18n.t("nightFell");
      body.textContent = `${i18n.t("campaignDone")} · ${i18n.t("distance")} ${payload.distance} m`;
    } else {
      title.textContent = i18n.t("endlessOver");
      body.textContent = `${i18n.t("distance")} ${payload.distance} m · ${i18n.t("best")} ${payload.best} m`;
    }
    this.lastShare = payload;
    this.t();
    if (!navigator.share) document.getElementById("btn-share").classList.add("hidden");
  }

  hideAll() {
    for (const el of Object.values(this.els)) {
      if (el !== this.els.hud && el !== this.els.splash) el.classList.add("hidden");
    }
    this.els.hud.classList.add("hidden");
    this.els.splash.classList.add("hidden");
  }
}
