# EdgeKeeper — Project Handoff

## What This Is

EdgeKeeper is a premium behavioral operating system for traders. The core thesis: traders fail not from lack of knowledge but because pressure changes who they become. Two AI mentors — Mike and Ashley — function as long-term human mentors, not support agents or chatbots.

**Three files, no framework, no build step.** Everything is single-file HTML with inline CSS and JS.

---

## Files

| File | Purpose |
|------|---------|
| `edgekeeper.html` | Public landing page |
| `onboarding.html` | Private Intake Room — mentor selection + 6 questions + Guardian consent |
| `workspace.html` | Main mentor workspace — chat, panels, Guardian Layer |

---

## Design System

### CSS Custom Properties
```css
--black: #050505      --obsidian: #0a0a0a    --stone: #111111
--surface: #161616    --border: #1e1e1e      --dim: #2a2a2a
--muted: #555555      --faint: #888888       --text: #d4d0c8
--bright: #e8e4dc     --white: #f5f2ec
--gold: #b8a06a       --gold-dim: #7a6a45
--green: #4a5c4a      --green-bright: #6b8c6b
--serif: 'Cormorant Garamond'
--sans: 'Inter'
--mono: 'DM Mono'
```

### Mentor Theming
Set dynamically by JS based on URL param `?mentor=mike` or `?mentor=ashley`:
```css
--mentor-color        /* gold (#b8a06a) for Mike, green (#6b8c6b) for Ashley */
--mentor-color-dim    /* #7a6a45 / #4a5c4a */
--mentor-color-bg     /* rgba versions for backgrounds */
--mentor-color-border /* rgba versions for borders */
```

### Mentor Identities
- **Mike** — Direct, surgical, logical. Builds structure. Gold palette. Questions about rule-breaking, justification, discipline.
- **Ashley** — Warm, observant, empathetic. Notices what's unsaid. Green palette. Questions about feelings, life context, emotional experience.

They are **colleagues, not skins.** Never call them AI. Never call them support agents. They are senior mentors at EdgeKeeper, a private institution.

---

## Architecture

### edgekeeper.html — Landing Page
Sections in order:
1. `#hero` — Three.js particle system, human silhouette
2. Marquee strip
3. `#institution` — "EdgeKeeper is not software"
4. `#problem` — Why traders fail
5. `#narrative` — Scroll-driven storytelling
6. `#mentors` — Mike and Ashley intro cards
7. `#how` — How it works
8. `#engine` — Behavior engine
9. `#guardian` — Guardian Layer feature section (NEW)
10. `#results` — Outcomes
11. `#passport` — Decision Passport feature
12. `#pricing` — 4 tiers (NEW)
13. `#invitation` — CTA
14. Footer

**Pricing tiers** (sell depth, never mention message limits):
- **Explorer** — Free — "Meet EdgeKeeper"
- **Resident** — $49/mo ⭐ featured — "Work with Mike or Ashley every day"
- **Fellow** — $99/mo — "Deep accountability, Guardian Layer"
- **Private Office** — $199/mo — "Highest level of mentorship"

**Guardian Layer section** positioned between `#engine` and `#results`:
- Account Vision block (MetaTrader/cTrader connection)
- Dynamic Protection block
- 5 Emotional Lock Levels (full table)
- The Vault block
- Guardian Contract block (4 protection options)

### onboarding.html — Private Intake Room
Layout: `280px sidebar | 1fr conversation area`

Flow:
1. Mentor selector shown if no `?mentor=` param
2. 6 questions asked sequentially with typing indicators
3. Observation tags revealed in sidebar per answer
4. After question 6 → **Guardian consent step** (not a text reply — 4 clickable buttons):
   - Observe only
   - Warn me
   - Slow me down
   - Protect me aggressively ← I consent to the lock
5. Mentor acknowledges choice → cinematic overlay → `workspace.html?mentor=`

**Guardian consent UI**: text input hides, `#guardian-consent` div appears with `.guardian-opt` buttons.

Three.js ambient background: 1200 dim gold particles rotating slowly.

### workspace.html — Mentor Workspace
Grid: `240px sidebar | 1fr main`
Main: `chat-col (flex:1) | panel-col (width: 0 → 420px)`

**Keyboard shortcuts**: J=Journal, R=Rules, P=Passport, A=Analytics, G=Guardian, V=Vault, Escape=close/exit Break Room

**Chat commands**: `/journal`, `/rules`, `/passport`, `/analytics`, `/guardian`, `/vault`, `/breakroom`

**Panels** (slide in from right, 420px):
- Journal — entries + new entry form
- Rules (Personal Laws) — checkboxes + add rule
- Decision Passport — score card + log
- Analytics — stats grid + behavior bars
- Guardian — account stats, lock levels, position suggestion
- Vault — intercepted decisions with Mike's narration

**Sidebar footer** (bottom to top):
- 7-day streak dots
- Discipline score bar (78%)
- Confidence Budget meter (NEW) — shows current emotional state, updates dynamically

**The Guardian Layer** (workspace):
- `buildGuardian()` — 6 account stat cards (balance, equity, P&L, lots, drawdown, consecutive losses), mentor suggestion, 5 lock level rows with active indicator
- `buildVault()` — total intercepted count, individual vault entries with date/decision/mentor narration/estimated save
- `triggerBreakRoom(level)` — full-screen overlay with countdown timer, level-specific message, `exitBreakRoom()` + `overrideBreakRoom()` handlers
- Break Room overlay (`#break-room`) — position fixed z-index 800, backdrop-filter blur, countdown in `br-countdown`, override button appears after 30s via CSS `opacity: 0; transition: opacity 1s ease 30s`

---

## The Mentor Constitution (behavioral rules for Mike and Ashley)

1. **Observe first** — never give advice before understanding the situation
2. **Time-aware** — know if it's morning/evening, pre-market/post-market, week start/end
3. **Psychological model** — maintain a running model of this trader's patterns, fears, and defaults
4. **Identity model** — track who this trader is becoming, not just what they did
5. **Private notes** — treat each conversation as part of a long file, not a fresh start
6. **Pattern detection** — name patterns, not just incidents
7. **Challenge gently** — push back without breaking trust
8. **Never create dependency** — build independence, not reliance on the mentor
9. **Reference EdgeKeeper as institution** — "here at EdgeKeeper", "what we do here"
10. **Colleagues not skins** — Mike and Ashley have their own perspectives, they don't always agree

---

## What's Done

- [x] Landing page with all sections, Three.js hero, luxury aesthetic
- [x] Chat bubble removed (Mike and Ashley are not support)
- [x] Guardian Layer section on landing page
- [x] 4-tier pricing (Explorer/Resident/Fellow/Private Office)
- [x] Onboarding — 6 questions per mentor, observation tags, progress bar
- [x] Guardian consent step in onboarding (4 clickable options, not text input)
- [x] Workspace — chat, all 4 original panels, keyboard shortcuts, slash commands
- [x] Workspace — Guardian panel (account stats, lock levels, suggestion)
- [x] Workspace — The Vault panel (intercepted decisions + narration)
- [x] Workspace — Break Room overlay (countdown, exit, override)
- [x] Workspace — Confidence Budget meter in sidebar

---

## Possible Next Steps

- [ ] **Guardian Replay** — after a break room session ends, Mike narrates what would have happened: "Here's what the market did during your 15 minutes."
- [ ] **Future-self simulation** — Mike walks the user through a scenario as their future disciplined self
- [ ] **Identity Timeline** — visual progression of who the trader is becoming, milestones
- [ ] **Voice access** — Web Speech API integration for voice conversations with Mike/Ashley
- [ ] **Real broker connection** — MetaTrader 5 Web API integration (account data currently mocked)
- [ ] **Mobile view** — responsive layout for workspace and onboarding
- [ ] **Persistence** — localStorage for journal entries, rules, discipline score
- [ ] **Email waitlist** — form on landing page `#invitation` section
- [ ] **Auth flow** — login/signup before onboarding, session persistence

---

## Aesthetic Rules

- **Never use bullet points in mentor speech** — mentors speak in complete sentences
- **Serif for mentor voice** — Cormorant Garamond for all mentor messages
- **Mono for system labels** — DM Mono for tags, timestamps, labels, shortcut hints
- **Sans for body/UI** — Inter for user input, descriptions, navigation
- **Gold for Mike** — `#b8a06a` and its dim/bg variants
- **Green for Ashley** — `#6b8c6b` and its dim/bg variants
- **No emojis anywhere**
- **No rounded corners** — the institution is precise, not friendly-app
- **Hover states are subtle** — background shifts, border color changes, never transforms or scaling
- **Everything is dark** — no light mode exists
