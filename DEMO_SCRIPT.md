# Triveda Demo Script

## Pre-Demo Checklist (5 min before call)

- [ ] Run `bun run smoke` against production
- [ ] If green: use production (triveda.vercel.app)
- [ ] If red: start local API (`cd apps/api && bun run dev`), point frontend at localhost
- [ ] Open browser to demo URL
- [ ] Log in as demo@triveda.app (password: triveda-demo-2026)
- [ ] Reset demo state (Profile > Reset Demo)
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
**Show:** One food, two sentences, date, season, weather.
**Talking point:** "One food. Two sentences. Fifteen seconds."
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

**Action:** Navigate to Browse. Search "oatmeal". Filter. Tap detail.
**Show:** Database depth, LLM-on-demand for unlisted foods.
**Talking point:** "55 foods structured, long tail via LLM with honest labeling."

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
1. **Localhost:** Start API locally, frontend points to localhost. Takes 30 seconds.
2. **Screenshots:** Static PNGs in a backup slide deck (Google Slides, ready to share-screen).

The smoke test (`bun run smoke`) determines which layer to use. Run it 5 minutes before the call.
