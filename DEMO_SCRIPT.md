# Triveda Demo Script

## Deployment URLs

- **Frontend:** https://triveda-kappa.vercel.app (Vercel, `triveda` project, `feat/vedic-manuscript-ui` branch)
- **Backend:** https://triveda-api-production.up.railway.app (Railway, Bun runtime, Supavisor pooler)
- **Database:** Supabase `xadpvybhjjhbpdfxtrio` (AppYo account — use `SUPABASE_APPYO_ACCESS_TOKEN`)

## Pre-Demo Checklist (5 min before call)

- [ ] Run `bun run smoke` against production (should be 17/17 or higher)
- [ ] If green: use production (triveda-kappa.vercel.app)
- [ ] If red: start local API (`cd apps/api && bun run dev`), point frontend at localhost
- [ ] Open browser to demo URL
- [ ] In demo mode, AuthContext auto-authenticates as the seeded demo user (`00000000-0000-0000-0000-000000000001`)
- [ ] If seed is stale: `bun run seed-demo` (idempotent)
- [ ] Reset demo state (Profile > Reset Demo) to start at day 1
- [ ] Close browser extensions that might interfere
- [ ] Have this script on second screen

## Opening (30 seconds)

"Triveda reads your body through three healing traditions and tells you what to eat today. One food. Two sentences. Fifteen seconds."

## Beat 1: Quick Start (2 min)

**Action:** Navigate to Quick Start. Answer 3 questions. Submit.
**Show:** Constitution Card renders immediately.
**Talking point:** "This is the shareable artifact. Sasha, you said scalability -- this is it."
**Sasha ref:** Mar 15: "Three questions and submit. No next, no back."

## Beat 2: Constitution Card (1.5 min)

**Action:** Expand TCM and Naturopathy sections.
**Show:** Three tradition perspectives on the same body.
**Talking point:** "Ayurveda, TCM, Naturopathy -- three different lenses on the same body."
**Sasha ref:** Mar 22: tradition-specific analysis

## Beat 3: Daily Card (1 min)

**Action:** Navigate to Home.
**Show:** One food, two sentences, date, season, weather. `DailyProfilingQuestion` card may render above if profile < 100% complete ("One quick question for you.").
**Talking point:** "One food. Two sentences. Fifteen seconds. And one painless question a day refines your profile — 18 questions in 14 days, without anyone filling a form."
**Sasha ref:** Mar 15: "People can't even do 3-second Instagram reels."

## Beat 4: Why Panel (1.5 min)

**Action:** Tap "Why?"
**Show:** Three labeled tradition sections, convergence banner.
**Talking point:** "Depth on demand. Three traditions labeled. Convergence shown explicitly."

## Beat 5: Credit Row (2 min) -- MOST IMPORTANT

**Action:** Scroll to credit row. Hover/tap chips.
**Show:** 22 feature chips, active ones highlighted, source attribution tooltips.
**Talking point (VERBATIM):** "The only thing static is we have all 22 features. They are not going anywhere. They are all here, powering this recommendation."
**Sasha ref:** Mar 22 verbatim quote

## Beat 6: Day Travel (1 min) -- skip if running long

**Action:** Jump to Day 5. Reload page.
**Show:** Same recommendation persists.
**Talking point:** "Multi-day simulation for demo purposes."

## Beat 7: Blood Work (1.5 min) -- skip if running long

**Action:** Navigate to blood work. Show uploaded PDF and parsed biomarkers.
**Show:** Biomarker table, influence on today's card.
**Talking point:** "Blood work goes through all three traditions."

## Beat 8: Browse Foods (1 min) -- skip if running long

**Action:** Navigate to Browse. Search "oatmeal". Filter. Tap detail. Optionally search a food not in the 55 DB to show "Generate entry via AI".
**Show:** 55-food database, category filter chips, LLM-on-demand panel streams Ayurveda→TCM→Naturopathy properties with "Pending validation" badge.
**Talking point:** "55 foods curated, long tail via LLM with honest labeling. Nothing hidden."

## Beat 9: Share (30 sec)

**Action:** Return to Constitution Card. Tap Share.
**Show:** Share sheet/modal, OG image preview.
**Talking point:** "This is how it spreads."
**Sasha ref:** Mar 15: "A very scalable thing."

## Timing Note

Total budget: 13-15 minutes including transitions and Sasha questions.
Beats 6-8 are marked "skip if running long" -- they are impressive but not essential.
Beats 1-5 and 9 are non-negotiable.

## Closing (1 min)

- Reset demo state to show the mechanism
- "Thank you, Sasha. What resonated? What felt off?"
- Segue: "Here's what's next..."

## Live Failure Protocol

If production is down during the call:
1. **Localhost:** Start API locally (`cd apps/api && bun run dev`), frontend points to localhost. Takes 30 seconds.
2. **Screenshots:** Static PNGs in a backup slide deck (Google Slides, ready to share-screen).

The smoke test (`bun run smoke`) determines which layer to use. Run it 5 minutes before the call.

## Current Feature Status (Apr 2026)

| Feature | Status |
|-|-|
| Welcome → Quick-start → Constitution flow | Working end-to-end |
| Daily Card + Why panel + 22-credit row | Working with real scoring engine |
| Progressive daily profiling (day 2-14) | Mounted above Daily Card on home |
| Cultural matching (cuisine bonus) | Wired post-score, capped at +0.10 |
| Browse 55 foods + filter + search | Working |
| LLM-on-demand food entry | Frontend panel + backend SSE (see /browse zero-result) |
| Triggered outputs (poor-sleep-3-days, pitta streak) | Backend pattern detector + real triggers |
| Weekly Herb (ashwagandha + 5 more) | Scored weekly, tradition perspectives |
| Check-in (mood/energy/digestion/sleep) | Writes to DB, feeds pattern detector |
| Face scan (simulated tradition analysis) | Mock MediaPipe — not real CV |
| Blood work upload + parsing | PDF → biomarkers → daily scoring influence |
| Share constitution via OG card | Satori-generated PNG, crawler-aware /c/:id |

Face scan is the one demoable-but-simulated feature — flag it explicitly with the "Simulated" badge and move on.
