# STARLING — Product Requirements Document

## 1. Overview

STARLING is a one-button web game in the Flappy Bird style: a single bird flies through dusk, dodging pipes above and below. There is no account: open the link and play.

**Working title:** STARLING  
**Platform:** Web (responsive: phone, tablet, desktop)  
**Stack:** HTML, CSS, vanilla JavaScript, Canvas 2D  
**Backend:** Supabase project `dmxlmoncttcfuphjeuqi` — private visit counter only  
**V1 goal:** People play it, and it looks professional in a portfolio.

This document describes **the game as built**, not the earlier rooftop-hopper draft. The bird is never grounded. It does not run on wires or land on buildings.

## 2. Goals and success

- Instant play (no registration).
- Hard to put down: fair deaths, overlay to restart, “one more try”.
- Attractive but not visually complex (dusk gold silhouettes).
- Campaign of 8 levels (easier → longer/harder) plus Endless.
- Private analytics only the owner can see.
- Hooks for later cosmetics and ads, disabled in v1.

**Out of v1:** accounts, global leaderboard, multiplayer, real ads, paid skins, personal name/credit on screen, PWA.

## 3. Audience and positioning

Casual players on any screen size. Controls must be obvious in a few seconds: **tap/click to flap**.

Fantasy: a starling flying home before night, through Mario-like tubes (pipes) in a dusk sky. One-button flight, not a platformer.

## 4. Player fantasy

You are a starling getting home before night. The sky goes from gold to purple. You stay in the gap between pipes above and below.

## 5. Core mechanic

- World auto-scrolls left; the bird stays on the left side of the screen.
- **Every tap / click / Space / ArrowUp = flap** (lift). There is no grounded state, no landing, no coyote time, no extra-flap limit.
- Between flaps the bird falls slowly (floaty gravity). It does not drop the instant you stop clicking.
- Obstacles: **pipes/tubes from the top and from the bottom**, with a gap in the middle (Flappy Bird / Super Mario pipe feel).
- Hit a pipe or the top/bottom of the screen = crash.
- Hitboxes are slightly friendlier than the art.
- **No screen shake** on death. The scene freezes, then a menu appears.
- Endless score = distance. Campaign progress = levels completed.

**Not in the game (old plan, discarded):** running on rooftops/wires, takeoff-and-land, antennas, wind as a core mechanic, instant auto-restart.

## 6. User flow

1. Open URL → main menu (New Game, Continue, Settings, Endless when unlocked).
2. **New Game** starts campaign at level 1.
3. **Ready overlay** — bird and world are frozen until the player presses **Start / Kreni**. Then the bird flaps and flight begins.
4. **Play** — tap to stay in the pipe gaps.
5. **Crash** → still frame + overlay:
   - Restart (same level, back to Ready / Start)
   - Main menu
6. **Pause** during flight:
   - **Esc** on computer, or **II** button (top-right) on any device
   - Continue (resume immediately, no Start button)
   - Restart
   - Main menu
   - Esc again = Continue
7. Finish a level → next level Ready overlay (Start again).
8. Finish level 8 → “night fell” share card; Endless unlocked.
9. Endless crash → game-over overlay with distance and best.

Clicks on menus do not flap the bird.

## 7. Settings

- Language: Bosnian, Croatian, Serbian (Latin), English.
- Music on/off.
- SFX on/off.
- Vibration on/off (phones only; ignored on desktop).
- On mobile, music and SFX default **off** until the player enables them.
- Language defaults from `navigator.language` when possible.

## 8. Campaign — “Home before night”

Eight levels. Each is longer, faster, and has a **tighter pipe gap** than the last. No mid-level checkpoints.

| Level | Intent |
| --- | --- |
| 1 | Wide gap, teach flap |
| 2–3 | Slightly tighter, faster |
| 4–6 | Narrower gaps, higher speed |
| 7–8 | Long endurance, densest pipes, darker dusk |

**Endless:** procedural pipes, speed ramps up, score is distance only.

## 9. Save data (`localStorage`)

- Language, music, SFX, vibration.
- Campaign current level, highest unlocked level, campaign complete flag.
- Endless unlocked, Endless best distance.
- Anonymous `visitor_id` (analytics).

No account. Clearing site data resets progress.

## 10. Presentation

- Palette: dusk gold — deep purple, warm orange, gold, near-black silhouettes, cream UI.
- Art: canvas-drawn bird, pipes with a gold lip, parallax hills, sun glow. Full-window canvas (responsive; not a cropped phone frame).
- Juice: squash/stretch, wing beat, flap particles. **No camera shake.**
- Overlays: Ready (Start), Pause, Game over, Share.
- **No personal name** on splash or footer.

## 11. Technical architecture

- `index.html` — menu + canvas + overlays (ready, pause, game over, share)
- `admin.html` — private stats (PIN)
- `css/style.css`
- `js/main.js` — boot, input (including Esc), loop
- `js/game.js` — states: `menu`, `ready`, `play`, `pause`, `dead`, `share`
- `js/bird.js` — flap physics and bird draw (never grounded)
- `js/world.js` — scrolling pipes, parallax sky
- `js/levels.js` — 8 levels + endless (`speed`, `gap`, `spacing`, `dusk`)
- `js/ui.js` — all overlays and HUD
- `js/i18n.js` — BS / HR / SR / EN
- `js/audio.js` — Web Audio
- `js/storage.js` — localStorage
- `js/analytics.js` — visit ping
- `js/monetization.js` — no-op hooks
- `js/config.js` — public Supabase URL + publishable key
- `data/` — JSON copies of levels and locales
- `supabase/schema.sql` — visits + admin RPC for the new project

ES modules. Static hosting. No bundler required. Serve over `http://` (not `file://`).

Game states:

- `ready` — world frozen, Start button required
- `play` — physics on
- `pause` — frozen, Continue / Restart / Main menu
- `dead` — frozen, Restart / Main menu (no shake)

## 12. Private visit counter

Visible **only** on `/admin.html`, never in the game UI.

- One row per first load in a tab (`sessionStorage` prevents refresh spam).
- `visitor_id` in `localStorage` for approximate uniques.
- Device: mobile vs desktop.
- Admin sees: total visits, unique visitors, last 7 days, mobile vs desktop.

Security:

- `visits` is insert-only for the anonymous/publishable key (RLS).
- Stats are read through a `SECURITY DEFINER` RPC that requires the owner PIN.
- PIN is **not** stored in frontend source. Hash lives in the database (`CHANGE_ME` in `schema.sql` before first run).
- Do not put `SUPABASE_SECRET_KEY` in the client. Do not use `@supabase/server` for this static game.

If tracking fails, the game still runs.

## 13. Monetization (v1 hooks only)

- `unlockCosmetic(id)` — no-op, returns false
- `showRewardedRevive()` — no-op; no revive in v1
- `showBannerAd()` — no-op

Later: bird colors, sky themes, trails; ads only after there is an audience.

## 14. Compatibility

- iOS Safari, Android Chrome, desktop Chrome/Firefox/Edge.
- Touch, mouse, Space / ArrowUp to flap; Esc to pause.
- Canvas uses the full window (CSS pixels × `devicePixelRatio`).
- UI panels sit above the canvas (`pointer-events`); canvas does not steal menu clicks.

## 15. Deployment

Static files on Vercel, Netlify, Cloudflare Pages, or GitHub Pages. Public URL, no login wall. Upload the whole `game` folder (`index.html` + `js/` + `css/`).

Local: from the `game` folder, `python -m http.server 4173` then http://localhost:4173

## 16. V1 non-goals

- User accounts, cloud saves, chat.
- Server-side leaderboards.
- Paid unlocks or ads turned on.
- Creator name on the product.
- Heavy engines (Phaser, Unity, React).
- Grounded / rooftop-hopper gameplay (explicitly dropped).
