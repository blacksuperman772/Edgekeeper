# EdgeKeeper — Design System Reference

Synthesized from three source systems: **Fey** (Bloomberg-derived obsidian terminal), **Dala** (particle cosmos on void), and **Linear** (midnight command deck). Applied to EdgeKeeper's institutional dark premium aesthetic.

---

## Guiding Principle

Three dark systems share one rule: **the accent earns attention by being rare.** One chromatic moment per viewport. Everything else lives in a tight monochrome scale. The void IS the atmosphere — depth comes from surface steps and inset borders, never from shadows or fills.

---

## Color Tokens

```css
:root {
  /* ── Surfaces (Fey + Linear) ─────────────────────────────── */
  --surface-canvas:   #0a0a0a;   /* Primary page void */
  --surface-card:     #111111;   /* First-level card surface */
  --surface-elevated: #191919;   /* Second-level, hover state */
  --surface-deep:     #000000;   /* Shadow core, deepest recess */

  /* ── Borders (Linear) ────────────────────────────────────── */
  --border-hairline:  #1e1e1e;   /* 1px inset card borders */
  --border-mid:       #2a2a2a;   /* Mid-emphasis dividers */
  --border-dim:       #525252;   /* Low-contrast grid lines */
  --border-ghost:     #e6e6e6;   /* Ghost button outline, 1px */

  /* ── Text (Fey scale) ────────────────────────────────────── */
  --text-primary:     #ffffff;   /* Snow — primary voice */
  --text-secondary:   #868f97;   /* Fog — muted body, labels */
  --text-tertiary:    #cccccc;   /* Ash — captions */
  --text-muted:       #525252;   /* Dim — lowest emphasis */

  /* ── Accent — EdgeKeeper Gold (maps to Fey Ember Orange) ─── */
  /* ONE moment per viewport. Headlines only. Never buttons.    */
  --accent-gold:      #b8a06a;   /* Primary accent — restrained */
  --accent-gold-dim:  #7a6a45;   /* Subdued version for labels */

  /* ── Supporting Accents (Fey secondary palette) ─────────── */
  --accent-green:     #4a7a5a;   /* Positive signal (not status) */
  --accent-green-on:  #6aaa7a;   /* Readable on canvas */

  /* ── Fey Reference ───────────────────────────────────────── */
  --fey-ember-orange: #ffa16c;
  --fey-signal-blue:  #479ffa;
  --fey-tape-green:   #4ebe96;
  --fey-obsidian:     #0b0b0b;
  --fey-graphite:     #131313;

  /* ── Dala Reference ──────────────────────────────────────── */
  --dala-void:        #000000;
  --dala-plum:        #8052ff;
  --dala-amber:       #ffb829;
  --dala-lichen:      #15846e;

  /* ── Linear Reference ────────────────────────────────────── */
  --linear-onyx:      #08090a;
  --linear-charcoal:  #0f1011;
  --linear-acid-lime: #e4f222;
  --linear-indigo:    #5e6ad2;
}
```

---

## Typography

**System:** Inter Tight (Calibre substitute) — sole typeface. Monotypographic.
**Rule:** Negative tracking at all display sizes. Positive/neutral at body. No serifs, no mono except technical labels.

```css
:root {
  --font-display: 'Inter Tight', ui-sans-serif, system-ui, sans-serif;

  /* ── Scale ───────────────────────────────────────────────── */
  /* caption   */ --text-caption:       10px;   --lead-caption:    1.5;   --track-caption:   -0.53px;
  /* body      */ --text-body:          14px;   --lead-body:       1.5;   --track-body:      -0.742px;
  /* body-lg   */ --text-body-lg:       16px;   --lead-body-lg:    1.6;   --track-body-lg:   -0.8px;
  /* heading-sm*/ --text-heading-sm:    18px;   --lead-heading-sm: 1.3;   --track-heading-sm:-0.954px;
  /* heading   */ --text-heading:       24px;   --lead-heading:    1.25;  --track-heading:   -1.92px;
  /* heading-lg*/ --text-heading-lg:    32px;   --lead-heading-lg: 1.2;   --track-heading-lg:-2.56px;
  /* display   */ --text-display:       48px;   --lead-display:    1.1;   --track-display:   -3.84px;
  /* display-lg*/ --text-display-lg:    60px;   --lead-display-lg: 1.0;   --track-display-lg:-4.8px;
  /* hero      */ --text-hero:          72px;   --lead-hero:       0.95;  --track-hero:      -5.76px;

  /* ── Weights ─────────────────────────────────────────────── */
  --weight-light:    300;   /* Display restraint — whispers authority */
  --weight-regular:  400;   /* Body workhorse */
  --weight-medium:   500;   /* Nav links, labels */
  --weight-semibold: 600;   /* Section headings, emphasis */
  --weight-bold:     700;   /* Buttons, CTA text */
}
```

### Rules (from Fey + Linear)
- Track all sizes 24px+ at negative values from the scale above — flat tracking makes type feel generic
- Body copy (≤18px) uses slight negative tracking or zero — never positive
- White (#fff) is the loudest voice — muted copy must be Fog (#868f97) or below
- No second typeface — the system is monotypographic

---

## Spacing

Base unit: 4px (Linear). Comfortable density.

```css
:root {
  --spacing-4:   4px;
  --spacing-8:   8px;
  --spacing-12:  12px;
  --spacing-16:  16px;
  --spacing-20:  20px;
  --spacing-24:  24px;
  --spacing-32:  32px;
  --spacing-40:  40px;
  --spacing-48:  48px;
  --spacing-56:  56px;
  --spacing-64:  64px;
  --spacing-80:  80px;
  --spacing-96:  96px;
  --spacing-120: 120px;
  --spacing-160: 160px;

  /* ── Layout ────────────────────────────────────────────── */
  --page-max:      1200px;
  --section-gap:   120px;   /* Between major bands */
  --card-padding:  24px;
  --element-gap:   12px;
}
```

---

## Border Radius

Three tiers. Non-negotiable (Fey rule).

```css
:root {
  --radius-sm:   6px;    /* Buttons, icons, inputs */
  --radius-md:   12px;   /* Cards, image frames */
  --radius-pill: 9999px; /* Nav CTA only */
}
```

---

## Elevation

**Rule (Fey + Dala):** No decorative drop-shadows. Depth = surface color step + 1px inset border.
The only permitted large shadow is on the hero product mockup.

```css
:root {
  /* Card inset border (replaces shadow for elevation) */
  --shadow-inset:  inset 0 0 0 1px #1e1e1e;

  /* Hero mockup ambient glow — the ONE large shadow allowed */
  --shadow-hero:   rgba(0, 0, 0, 0.8) 0px 0px 44px 0px;

  /* Subtle button depth stack (Linear) */
  --shadow-button: 0px 1px 1px 0px rgba(0,0,0,0.08),
                   0px 3px 2px 0px rgba(0,0,0,0.04);
}
```

---

## Components

### Top Navigation Bar
Transparent over canvas. Height 56px.
- Logo: Inter Tight 16px weight 600, white. Single character accent in `--accent-gold`.
- Nav links: 14px weight 500, `--text-secondary` (#868f97) → white on hover. No underline.
- CTA: `--radius-pill` (9999px), 1px `--border-ghost` (#e6e6e6), transparent fill, white text, 6px 18px padding.

### Section Label (Fey "Section Label")
Maps to Fey's Ember Orange role but using `--accent-gold`.
- Inter Tight 11px weight 500, `--accent-gold`, letter-spacing 0.1em, uppercase.
- ONE per viewport — the gold label is the only warm moment on that screen.
- Always 20–24px above the heading it belongs to.

### Display Heading
- Inter Tight 48–72px weight 300 (Linear's anti-loud restraint) or weight 600 (Fey's architectural tightness).
- Letter-spacing from `--track-display` / `--track-hero`.
- Color: white (#ffffff) primary, `--accent-gold` for ONE em/span per section.
- Never use gold on more than one word per heading.

### Card Surface
- Background: `--surface-card` (#111111).
- Border: `--shadow-inset` (1px inset #1e1e1e).
- Radius: `--radius-md` (12px).
- No drop-shadow. Hover state: background lifts to `--surface-elevated` (#191919).
- Padding: `--card-padding` (24px).

### Primary CTA Button
- Background: transparent.
- Border: 1px `--accent-gold` or 1px `--border-ghost`.
- Text: white, 13px weight 500, letter-spacing 0.12em, uppercase.
- Radius: `--radius-sm` (6px).
- Padding: 12px 28px.
- Gold is NEVER a filled button background. (Fey rule: accent = text/stroke only.)

### Ghost Nav Button (pill)
- `--radius-pill`, 1px `--border-ghost`, transparent, white text.
- Only in the nav bar. Body CTAs use `--radius-sm`.

### Mentor Entry Points
Mike and Ashley are **destinations**, not widgets. They are accessed only via explicit CTA buttons — "Enter with Mike" / "Enter with Ashley". They do not appear as chat bubbles, support widgets, or floating elements on the landing page. The landing page describes who they are; the session IS them.

### Behavior / Data Row
Linear "Insider Transaction Row" adapted:
- `--surface-card` background, 1px `--border-hairline` bottom border.
- Label: 11px weight 500 `--text-secondary`. Value: 14px weight 400 white.
- Padding: 14px 0.

### Pill Chip / Tag
- Fey "Action Chip" style: 6px radius, 1px border, transparent fill, 6px 12px padding.
- Gold variant: `--accent-gold` text + border.
- Green variant: `--accent-green-on` text + border.
- Never solid/filled.

---

## Surfaces Stack

| Level | Token | Value | Use |
|-------|-------|-------|-----|
| 0 | `--surface-canvas` | `#0a0a0a` | Page void, hero background |
| 1 | `--surface-card` | `#111111` | Cards, section backgrounds |
| 2 | `--surface-elevated` | `#191919` | Hover states, stacked layers |
| 3 | `--surface-deep` | `#000000` | Shadow core, deepest elements |

---

## Do's and Don'ts

### Do
- Use `--surface-canvas` → `--surface-card` → `--surface-elevated` for depth. Never paint a card with a chromatic color.
- Reserve `--accent-gold` for ONE label or ONE word in a headline per viewport. Gold earns attention by being rare.
- Set all display sizes (24px+) with negative letter-spacing from the scale. Flat tracking is the failure mode.
- Use 12px radius on cards, 6px on buttons and inputs, 9999px only on the nav pill.
- Let 80–120px section gaps breathe. Resist filling void with decoration.
- Describe Mike and Ashley as private mentors accessed through a deliberate choice — never as assistants, bots, or support.

### Don't
- Don't add drop-shadows to cards. Elevation is a surface-color step + inset border.
- Don't use gold as a filled background on any element.
- Don't put gold on two elements in the same viewport — it stops feeling rare.
- Don't use white (#fff) for secondary or muted text. It only speaks once per block.
- Don't introduce a second typeface.
- Don't frame Mike or Ashley as "AI assistants," "chatbots," or "support." They are mentors. The user enters their world.
- Don't show a chat bubble / floating widget for Mike or Ashley on the marketing page.

---

## Source References

| System | Theme | Signature |
|--------|-------|-----------|
| **Fey** | Bloomberg obsidian terminal | Inter Tight + aggressive negative tracking + Ember Orange once per viewport |
| **Dala** | Particle cosmos on void | Ultra-thin display type + particle constellation as brand identity + single violet authority |
| **Linear** | Midnight command deck | Inter Variable 510 + inset borders for elevation + acid lime as sole filled CTA |
