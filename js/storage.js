import { LAST_LEVEL } from "./levels.js";

const KEY = "starling-save-v1";

export function isMobile() {
  return (
    window.matchMedia("(pointer: coarse)").matches ||
    navigator.maxTouchPoints > 0 ||
    /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
  );
}

export function detectLang() {
  const raw = (navigator.language || "en").toLowerCase();
  if (raw.startsWith("hr")) return "hr";
  if (raw.startsWith("sr")) return "sr";
  if (raw.startsWith("bs") || raw.startsWith("sh")) return "bs";
  return "en";
}

function defaults() {
  const mobile = isMobile();
  return {
    lang: detectLang(),
    music: mobile ? false : true,
    sfx: mobile ? false : true,
    vibration: true,
    hasCampaign: false,
    campaignLevel: 1,
    unlockedLevel: 1,
    campaignComplete: false,
    endlessUnlocked: false,
    endlessBest: 0,
    visitorId: crypto.randomUUID ? crypto.randomUUID() : `v-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  };
}

function migrateCampaign(save) {
  if (save.campaignComplete && (save.unlockedLevel || 1) < LAST_LEVEL) {
    save.campaignComplete = false;
    const next = Math.min(LAST_LEVEL, (save.unlockedLevel || 1) + 1);
    save.unlockedLevel = Math.max(save.unlockedLevel || 1, next);
    save.campaignLevel = Math.max(save.campaignLevel || 1, save.unlockedLevel);
    writeSave(save);
  }
  return save;
}

export function loadSave() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaults();
    return migrateCampaign({ ...defaults(), ...JSON.parse(raw) });
  } catch {
    return defaults();
  }
}

export function writeSave(save) {
  localStorage.setItem(KEY, JSON.stringify(save));
  return save;
}

export function resetCampaign(save) {
  save.hasCampaign = false;
  save.campaignLevel = 1;
  save.unlockedLevel = 1;
  save.campaignComplete = false;
  return writeSave(save);
}
