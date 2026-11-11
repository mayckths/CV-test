---
name: Mayck Cuellar Portfolio
description: A cream page of stacked rounded panels, a gradient hero with a glass M, and content that arrives one step at a time.
colors:
  cream: "#f5ebe3"
  card: "#fffaf5"
  ink: "#1f1c1c"
  muted: "#655c57"
  line: "rgba(31, 28, 28, 0.14)"
  accent: "#f23a14"
  accent-text: "#c42d0c"
  coral-on-dark: "#ff6a45"
  violet: "#8a4be0"
  dark-panel: "#1f1c1c"
  on-dark: "#f5ebe3"
  on-dark-muted: "#cdbfb6"
typography:
  display:
    fontFamily: "Bricolage Grotesque, system-ui, sans-serif"
    fontSize: "clamp(38px, 6.2vw, 96px)"
    fontWeight: 600
    lineHeight: 0.98
    letterSpacing: "-0.04em"
  giant:
    fontFamily: "Bricolage Grotesque, system-ui, sans-serif"
    fontSize: "clamp(64px, 18.5vw, 290px)"
    fontWeight: 500
    lineHeight: 0.84
    letterSpacing: "-0.045em"
  body:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "12px"
    fontWeight: 500
    letterSpacing: "0.06em"
rounded:
  pill: "999px"
  media: "18px"
  panel: "28px"
spacing:
  panel-gap: "16px"
  gutter: "clamp(20px, 4vw, 64px)"
  max-width: "1320px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.cream}"
    rounded: "{rounded.pill}"
    height: "46px"
    padding: "0 22px"
  button-primary-hover:
    backgroundColor: "{colors.accent}"
  button-ghost:
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    height: "40px"
    padding: "0 18px"
---

# Design System: Mayck Cuellar Portfolio

## Overview

**Creative North Star: "One thing at a time"**

A cream page built from rounded panels with a small gap between them. The hero is a vivid gradient panel (red-orange into pink and violet) that opens on load, with Mayck's name set huge and a glass M turning in front of it, bending the letters behind it. After that, content arrives step by step: a pinned card shows one message per scroll step over a faint construction blueprint of the M, case studies are cards that slide over one another, and dark panels carry the flagship work and the footer with a soft light that follows the cursor.

The direction was pinned by Mayck from references and adapted to his own mark and content: guillaumezhu.com for the hero and colours, awakeagency.dev for the step-by-step flow, stacked panels and the blueprint, ricardochance.com for the soft particles.

**Key Characteristics:**
- Cream ground, dark ink, one red-orange accent. Text never sits on particles.
- Rounded panels (28px) stacked with a 16px gap.
- One message, one card, one project in focus at a time.
- The M has two states: glass in the hero, particles in the footer and on press.

## Colors

### Primary
- **Accent** (accent): headline phrases, quote marks, link arrows, the send button. Large type and fills only; small text on cream uses **Accent text**.
- **Hero gradient:** #ff2a10 to #ff5a1c to #ff4f80 to #a44ce4, with drifting violet, orange and pink blooms.

### Secondary
- **Dark panel** (dark-panel) with **On dark** and **On dark muted** text, and **Coral on dark** (coral-on-dark) for accents and the cursor spotlight.

### Neutral
- **Cream** (cream) page, **Card** (card) for pinned and stacked cards and media frames, **Ink** (ink), **Muted** (muted), **Line** (line).

### Named Rules
**The Clear Ground Rule.** Body text sits only on cream, card or the dark panel. Particles and gradients stay inside the hero and footer panels.

## Typography

**Display Font:** Bricolage Grotesque
**Body Font:** Geist
**Label/Mono Font:** Geist Mono

### Hierarchy
- **Giant** (500, up to 290px, lowercase): the name in the hero.
- **Display** (600, clamp 38 to 96px, tight): the headline, section titles (up to 176px), the closing line.
- **Figure** (600, up to 230px): one result per step in the intro.
- **Body** (17px, 1.55), up to 54ch. **Label** (mono 12px, uppercase): tags, bracketed years.

## Layout

Panels sit 16px from the viewport edge and from each other. The hero panel fills the first screen. The intro is a pinned card: seven steps (headline, statement, four results, certifications), about 58vh of scroll each, with a progress rail and the two calls to action fixed at the bottom of the card. The flagship is a dark panel; the three other cases are sticky cards that stack. Below 820px cards stop stacking and everything is one column. With reduced motion or without scripts, the steps are simply laid out one after another.

## Elevation & Depth

Flat cards with a 1px inner line. Stacked cards cast a soft upward shadow onto the card they cover. Depth otherwise belongs to the glass M.

## Shapes

Pills for buttons, chips and the floating header; 28px panels; 18px media.

## Components

### Glass M (signature)
- An extruded serif M with clear glass faces and pink sides, turning in front of the name. The name is drawn in WebGL so the glass can bend it, with colour fringes. Drag turns it, a press scatters it into particles that gather again, arrow keys nudge it.

### Particle M
- Soft round motes in white, lilac, violet and pink, denser along the letter's edges. They gather into the glass M on load and are the M itself on the dark footer panel. They step away from the cursor.

### Step scene
- One step visible at a time, cross-fading with a short rise and blur; a rail shows position.

### Blueprint
- The M's outline with anchor points, handles, guides and a construction circle, drawn in as the intro scrolls.

### Spotlight
- Dark panels carry a soft coral light at the cursor.

### Floating header
- A dark translucent pill, centred, legible over both the gradient and the cream page.

## Do's and Don'ts

### Do:
- **Do** keep one idea per step and per card.
- **Do** keep text on clear ground.
- **Do** put years in square brackets in the label row.

### Don't:
- **Don't** let particles or gradients run behind body text.
- **Don't** use the accent red for small text on cream; use the darker accent-text.
- **Don't** add ruler frames or tick marks.
