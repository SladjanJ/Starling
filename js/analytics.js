import { CONFIG } from "./config.js";
import { isMobile, loadSave, writeSave } from "./storage.js";

const REGISTERED_KEY = "starling_db_registered";

function headers() {
  return {
    apikey: CONFIG.supabaseAnonKey,
    Authorization: `Bearer ${CONFIG.supabaseAnonKey}`,
    "Content-Type": "application/json",
  };
}

function clip(value, max) {
  return String(value || "")
    .trim()
    .slice(0, max);
}

function visitSource() {
  const params = new URLSearchParams(location.search);
  const utm = clip(params.get("utm_source") || params.get("ref") || "", 80).toLowerCase();
  if (utm) return utm;

  const raw = document.referrer;
  if (!raw) return "direct";
  try {
    const host = new URL(raw).hostname.replace(/^www\./, "").toLowerCase();
    if (!host || host === location.hostname) return "direct";
    if (host.includes("instagram")) return "instagram";
    if (host.includes("facebook") || host.includes("fb.com") || host.includes("fb.me")) return "facebook";
    if (host.includes("tiktok")) return "tiktok";
    if (host.includes("youtube") || host.includes("youtu.be")) return "youtube";
    if (host.includes("twitter") || host === "t.co" || host.includes("x.com")) return "twitter";
    if (host.includes("whatsapp") || host === "wa.me") return "whatsapp";
    if (host.includes("telegram") || host.includes("t.me")) return "telegram";
    if (host.includes("google")) return "google";
    if (host.includes("bing")) return "bing";
    if (host.includes("reddit")) return "reddit";
    if (host.includes("linkedin")) return "linkedin";
    return clip(host, 80);
  } catch {
    return "direct";
  }
}

function visitReferrer() {
  const raw = document.referrer;
  if (!raw) return "";
  try {
    const url = new URL(raw);
    if (url.hostname === location.hostname) return "";
    return clip(`${url.hostname}${url.pathname}`, 300);
  } catch {
    return "";
  }
}

async function detectCountry() {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 2500);
    const res = await fetch("https://ipwho.is/?fields=success,country,country_code", { signal: ctrl.signal });
    clearTimeout(timer);
    const data = await res.json();
    if (data && data.success !== false) {
      const name = clip(data.country, 80);
      const code = clip(data.country_code, 8).toUpperCase();
      return name || code;
    }
  } catch {
    /* geo is optional */
  }
  return "";
}

function visitorId() {
  const save = loadSave();
  if (!save.visitorId) {
    save.visitorId = crypto.randomUUID();
    writeSave(save);
  }
  return save.visitorId;
}

async function sendRegister() {
  const id = visitorId();
  const country = await detectCountry();
  const res = await fetch(`${CONFIG.supabaseUrl}/rest/v1/rpc/register_visitor`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      p_visitor_id: id,
      p_device: isMobile() ? "mobile" : "desktop",
      p_country: country,
      p_source: visitSource(),
      p_referrer: visitReferrer(),
      p_lang: clip((navigator.language || "").toLowerCase(), 8),
    }),
  });
  if (!res.ok) return;
  try {
    localStorage.setItem(REGISTERED_KEY, id);
  } catch {
    /* ignore */
  }
}

export function trackVisit() {
  try {
    const id = visitorId();
    if (localStorage.getItem(REGISTERED_KEY) === id) return;
  } catch {
    return;
  }
  sendRegister().catch(() => {});
}

let pendingSeconds = 0;
let flushTimer = 0;

function sendPlaySeconds(sec) {
  const id = visitorId();
  fetch(`${CONFIG.supabaseUrl}/rest/v1/rpc/add_play_seconds`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ p_visitor_id: id, p_seconds: sec }),
    keepalive: true,
  }).catch(() => {});
}

export function notePlaytime(dt) {
  if (!(dt > 0)) return;
  pendingSeconds += dt;
  if (pendingSeconds >= 20) flushPlaytime();
}

export function flushPlaytime() {
  const sec = Math.floor(pendingSeconds);
  if (sec < 1) return;
  pendingSeconds -= sec;
  sendPlaySeconds(sec);
}

export function initPlaytimeSync() {
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) flushPlaytime();
  });
  window.addEventListener("pagehide", () => flushPlaytime());
  if (flushTimer) clearInterval(flushTimer);
  flushTimer = setInterval(() => flushPlaytime(), 20000);
}
