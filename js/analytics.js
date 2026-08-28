import { CONFIG } from "./config.js";
import { isMobile, loadSave, writeSave } from "./storage.js";

function headers() {
  return {
    apikey: CONFIG.supabaseAnonKey,
    Authorization: `Bearer ${CONFIG.supabaseAnonKey}`,
    "Content-Type": "application/json",
    Prefer: "return=minimal",
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
    const res = await fetch("https://ipwho.is/?fields=success,country_code", { signal: ctrl.signal });
    clearTimeout(timer);
    const data = await res.json();
    if (data && data.success !== false && data.country_code) {
      return clip(data.country_code, 8).toUpperCase();
    }
  } catch {
    /* geo is optional */
  }
  return "";
}

async function insertVisit(row) {
  const res = await fetch(`${CONFIG.supabaseUrl}/rest/v1/visits`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(row),
  });
  return res.ok;
}

async function sendVisit() {
  const save = loadSave();
  if (!save.visitorId) {
    save.visitorId = crypto.randomUUID();
    writeSave(save);
  }
  const country = await detectCountry();
  const full = {
    visitor_id: save.visitorId,
    device: isMobile() ? "mobile" : "desktop",
    country: country || null,
    source: visitSource(),
    referrer: visitReferrer() || null,
    lang: clip((navigator.language || "").toLowerCase(), 8) || null,
  };
  const ok = await insertVisit(full);
  if (!ok) {
    await insertVisit({ visitor_id: full.visitor_id, device: full.device });
  }
}

export function trackVisit() {
  try {
    if (sessionStorage.getItem("starling_visit_sent")) return;
    sessionStorage.setItem("starling_visit_sent", "1");
  } catch {
    return;
  }
  sendVisit().catch(() => {});
}
