# STARLING

One-tap web game. A starling flies home before night, through dusk pipes.
Open the link and play — no account.

**Play:** [https://starling-game.netlify.app](https://starling-game.netlify.app)

**Home before night.**

## Play

- Tap, click, Space or ArrowUp to flap
- Avoid pipes and the edges of the screen
- 20 campaign levels (each longer and tighter) plus Endless
- Languages: Bosnian, Croatian, Serbian, English
- On phones, sound starts off until you enable it in Settings

Progress is saved in the browser. Clearing site data resets it.

## Play locally

From this folder:

```bash
python -m http.server 4173
```

Then open http://localhost:4173  
Do not open `index.html` by double-click (the game will not load).

## Stack

HTML, CSS, vanilla JavaScript, Canvas 2D.  
Supabase is used only for a private visit counter (`/admin`), never shown in the game.

## Admin

Run `supabase/schema.sql` in the Supabase SQL editor (replace `CHANGE_ME` with your PIN first).
Open [https://starling-game.netlify.app/admin](https://starling-game.netlify.app/admin) and enter that PIN. Do not put the PIN in this repo.
