import { CONFIG } from "./config.js";
import { isMobile, loadSave, writeSave } from "./storage.js";

function headers() {
  return {
    apikey: CONFIG.supabaseAnonKey,
    "Content-Type": "application/json",
  };
}

export function trackVisit() {
  try {
    if (sessionStorage.getItem("starling_visit_sent")) return;
    sessionStorage.setItem("starling_visit_sent", "1");
  } catch {
    return;
  }
  const save = loadSave();
  if (!save.visitorId) {
    save.visitorId = crypto.randomUUID();
    writeSave(save);
  }
  fetch(`${CONFIG.supabaseUrl}/rest/v1/rpc/track_visit`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      p_visitor_id: save.visitorId,
      p_device: isMobile() ? "mobile" : "desktop",
    }),
  }).catch(() => {});
}

export async function fetchStats(pin) {
  const res = await fetch(`${CONFIG.supabaseUrl}/rest/v1/rpc/get_visit_stats`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ p_pin: pin }),
  });
  if (!res.ok) throw new Error("network");
  return res.json();
}
