import { loadSave, writeSave, resetCampaign } from "./storage.js";
import { i18n } from "./i18n.js";
import { audio } from "./audio.js";
import { UI } from "./ui.js";
import { Game } from "./game.js";
import { trackVisit } from "./analytics.js";
import { unlockCosmetic, showBannerAd } from "./monetization.js";

function bootError(msg) {
  const el = document.getElementById("boot-error");
  if (!el) return;
  el.textContent = msg;
  el.classList.remove("hidden");
}

function safeUnlock() {
  try {
    audio.unlock();
  } catch {
    /* ignore */
  }
}

try {
  const save = loadSave();
  i18n.setLang(save.lang);
  audio.init({ music: save.music, sfx: save.sfx });
  unlockCosmetic("default");
  showBannerAd();
  trackVisit();

  const canvas = document.getElementById("game");
  let game;

  function startNew() {
    try {
      resetCampaign(save);
      save.hasCampaign = true;
      writeSave(save);
      game.mode = "menu";
      ui.showMap(save);
    } catch (err) {
      console.error(err);
      bootError(String(err && err.message ? err.message : err));
    }
  }

  const ui = new UI({
    onNewGame: () => {
      safeUnlock();
      if (save.hasCampaign) ui.showConfirm();
      else startNew();
    },
    onNextLevel: () => {
      safeUnlock();
      game.goToNextLevel();
    },
    onContinue: () => {
      safeUnlock();
      ui.showMap(save);
    },
    onPickLevel: (id) => {
      safeUnlock();
      game.startCampaign(id);
    },
    onEndless: () => {
      safeUnlock();
      game.startEndless();
    },
    onSettings: () => ui.showSettings(save),
    onBack: () => ui.showMenu(save),
    onReset: () => startNew(),
    onPause: () => game.pause(),
    onResume: () => game.resume(),
    onRestartLevel: () => {
      safeUnlock();
      game.restartLevel();
    },
    onStart: () => {
      safeUnlock();
      game.startFlying();
    },
    onLang: (lang) => {
      save.lang = lang;
      i18n.setLang(lang);
      writeSave(save);
      ui.t();
      ui.syncToggles(save);
    },
    onMusic: () => {
      safeUnlock();
      save.music = !save.music;
      audio.setMusic(save.music);
      writeSave(save);
      ui.syncToggles(save);
    },
    onSfx: () => {
      safeUnlock();
      save.sfx = !save.sfx;
      audio.setSfx(save.sfx);
      writeSave(save);
      ui.syncToggles(save);
    },
    onVibration: () => {
      save.vibration = !save.vibration;
      writeSave(save);
      ui.syncToggles(save);
    },
    onShareRetry: () => {
      safeUnlock();
      if (game.endless || (ui.lastShare && ui.lastShare.kind === "endless")) game.startEndless();
      else game.startCampaign(save.campaignLevel || 1);
    },
    onShareMenu: () => game.goToMenu(),
    onCopy: async () => {
      try {
        await navigator.clipboard.writeText(location.href.split("?")[0].replace(/admin\.html$/, ""));
        document.getElementById("btn-copy").textContent = i18n.t("copied");
      } catch {
        /* ignore */
      }
    },
    onNativeShare: async () => {
      const p = ui.lastShare;
      const text = p && p.kind === "endless" ? `STARLING — ${p.distance} m` : "STARLING";
      try {
        await navigator.share({ title: "STARLING", text, url: location.href });
      } catch {
        /* ignore */
      }
    },
  });

  game = new Game(canvas, ui, save);
  ui.showMenu(save);
  window.__STARLING_OK = true;

  window.addEventListener(
    "pointerdown",
    (e) => {
      if (!game || game.mode !== "play") return;
      if (e.target && e.target.closest && e.target.closest("button, select, a, .panel")) return;
      if (e.cancelable) e.preventDefault();
      game.tap();
    },
    { passive: false }
  );

  window.addEventListener("keydown", (e) => {
    if (e.code === "Escape") {
      e.preventDefault();
      if (game) game.togglePause();
      return;
    }
    if (e.code === "Space" || e.code === "ArrowUp") {
      e.preventDefault();
      if (game) game.tap();
    }
  });

  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    try {
      game.update(dt);
    } catch (err) {
      console.error(err);
      bootError(String(err && err.message ? err.message : err));
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
} catch (err) {
  console.error(err);
  bootError("Igra se nije učitala: " + (err && err.message ? err.message : err));
}
