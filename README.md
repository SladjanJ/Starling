# STARLING

One-button web game: a starling getting home across rooftops before night. Open the link and play — no account.

## Play locally

From this folder:

```bash
npx --yes serve -p 4173
```

Then open http://localhost:4173

## Admin visits

1. In `supabase/schema.sql` replace `CHANGE_ME` with your PIN (the one from chat).
2. Open the **new** Supabase project SQL Editor: https://supabase.com/dashboard/project/dmxlmoncttcfuphjeuqi/sql
3. Paste `supabase/schema.sql` and Run.
4. Open `/admin.html` and enter that PIN.

The visit counter is never shown in the game. Do not put the PIN in a public file.

## Settings

New Game / Continue / Settings. Languages: BS, HR, SR, EN. On phones, sound starts off.

## Stack

HTML, CSS, vanilla JS, Canvas 2D. Supabase only for private visit stats.
