---
name: Mayck Cuellar Portfolio
description: A cream page of stacked rounded panels, a dark blue hero with two pyramids drawn in particles, and content that arrives one step at a time.
colors:
  cream: "#f5ebe3"
  card: "#fffaf5"
  ink: "#1f1c1c"
  muted: "#655c57"
  line: "rgba(31, 28, 28, 0.14)"
  accent: "#f23a14"
  accent-text: "#c42d0c"
  accent-bright: "#ff6a45"
  violet: "#8a4be0"
  blue-panel: "#22126d"
  on-dark: "#f1eefd"
  on-dark-muted: "#c9c4ee"
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

A cream page built from rounded panels with a small gap between them. The hero follows ricardochance.com: a dark indigo ground with a slow haze of the blue (#22126d) and faint stars, the name and an italic serif headline top left, a short account bottom right (no buttons), and two pyramids drawn in fine soft particles in the middle. The pyramids are simply there on load; only the text has an entrance. The haze leans toward the cursor and a soft light trails it; the pyramids' particles drift gently toward the cursor. The hero stays pinned while two roles (Product design, AI strategy & product growth) appear either side of the pyramids. When the hero leaves, the pyramids' particles travel down, reshape into the headline's own lettering and darken to ink, and the real "I design" takes over. After that, content arrives step by step: a pinned card shows one message per scroll step over a faint construction blueprint of the M, all four case studies, the AI Assistant included, are cards that slide over one another, the chat sits on a blue panel with a soft light that follows the cursor, and the footer sits on the page's beige.

The direction was pinned by Mayck from references and adapted to his own mark and content: guillaumezhu.com for the hero and colours, awakeagency.dev for the step-by-step flow, stacked panels and the blueprint, ricardochance.com for the soft particles.

**Key Characteristics:**
- Cream ground, dark ink, one red-orange accent. Text never sits on particles.
- Rounded panels (28px) stacked with a 16px gap.
- One message, one card, one project in focus at a time.
- Particle pyramids in the hero, light on blue; they return in the footer, blue on beige.

## Colors

### Primary
- **Accent** (accent): headline phrases, quote marks, link arrows, the send button. Large type and fills only; small text on cream uses **Accent text**.
- **Hero background:** a dark ground (#0d0730) with a haze of the blue (#22126d, lifting to #4330c4) that drifts, slides against the cursor and carries faint twinkling stars. The chat panel uses a still version with a pale blue light under the cursor. The footer is the page's beige (#f5ebe3).
- **Hero text:** #f1eefd, with trailing words and secondary text dimmed. Particles are white, lilac, violet, pink and peach in the hero, and the hero's blues (#22126d to #5a3cf2) in the footer.

### Secondary
- **Blue panel** (blue-panel): the hero and the chat are the same blue; they carry **On dark** and **On dark muted** text (one cool white, never the cream) and **Accent bright** (accent-bright) for accents. The footer is the page's beige with ink text, a dark button and the standard accent.
- **Ink sets for the art stamps** (violet, red-orange, magenta, amber) are the only other colours, and stay inside the Art section.

### Neutral
- **Cream** (cream) page, **Card** (card) for pinned and stacked cards and media frames, **Ink** (ink), **Muted** (muted), **Line** (line).

### Named Rules
**The Clear Ground Rule.** Body text sits only on cream, card or the blue panels. Particles stay inside the hero and footer panels.

## Typography

**Display Font:** Bricolage Grotesque
**Serif:** Instrument Serif Italic, for speech and emphasis only: the hero statement and its two role labels, the emphasised words of the headline, and the recommendations. Never for body copy or labels.
**Label sizes:** every mono label is 12px.
**Body Font:** Geist
**Label/Mono Font:** Geist Mono

### Hierarchy
- **Logo:** two triangles side by side (▲▲), the same M the pyramids draw. It is the header mark and the favicon. The wordmark is no longer shown.
- **Display** (600, clamp 38 to 96px, tight): the headline, section titles (up to 176px), the closing line.
- **Figure** (600, up to 230px): one result per step in the intro.
- **Body** (17px, 1.55), up to 54ch. **Label** (mono 12px, uppercase): tags, and the company each project was made for. Project years are not shown. In Experience the years are set large in the display face, without brackets.

## Layout

Panels sit 16px from the viewport edge and from each other. The hero panel fills the first screen. The intro is a pinned card: six steps (headline, four results, education and certifications), about 58vh of scroll each, with a progress rail centred at the bottom of the card and no buttons. The four cases are sticky cards that stack on every screen size; none is treated differently. A card taller than the screen holds once its bottom is in view, so nothing is cut off. Below 820px each card is one column. With reduced motion or without scripts, the steps are simply laid out one after another.

## Elevation & Depth

Flat cards with a 1px inner line. Stacked cards cast a soft upward shadow onto the card they cover. Depth otherwise belongs to the hero's pyramids.

## Shapes

Pills for buttons, chips and the floating header; 28px panels; 18px media.

## Components

### Particle pyramids (signature)
- Two square pyramids side by side (an M), drawn only in particles. They are never a solid object, and they do not become anything else while the hero is pinned. Drag turns them, a press scatters them into particles that gather again in about a second, arrow keys nudge them.

### Hero entrance
- On load the hero's two text groups (name and headline; the paragraph) are drawn as dotted wireframes with guides, corner handles and size labels, then the real text is revealed behind a scan line, as if an agent had just built it. It uses the transitions.dev UI generation runtime (vendor/transitions, licence included). Mayck chose this over traced-type and agent-log variants.
- The drawing is one quiet lavender. It ends at once if the page is scrolled, and with reduced motion the text simply fades in.

### Particles
- Soft round motes in white, lilac, violet, pink and peach, small with a bright core (Mayck preferred these over larger rimmed blobs). They draw the pyramids in the hero and, in blue on the beige footer, draw them again. The pyramids never turn on their own: no idle sway, no facing the cursor, no turn on scroll. Only a drag turns them, and they ease back to face front. Every mote leans slightly toward the cursor wherever it is on the panel, and within reach they drift a little closer. They sit in the exact middle of the hero panel and are in the same place and state on both screens of the pinned hero, with the two role labels either side on the second. They respond to drags and presses throughout. When the hero lets go, the motes travel straight down, with no rotation, and become the headline's "I design".

### Step scene
- One step visible at a time, cross-fading with a short rise and blur; a rail shows position.

### Blueprint
- The serif M drawn as a real path: every vertex has an anchor, the bracketed serifs are true curves with their control handles, and guides mark the baseline, cap line and stems. It reacts to the scroll: a camera travels around the letter, each step framing another corner (top-left serif, top-right serif, then down to the left foot at the bottom left and across to the right foot at the bottom right), and the node in focus is picked out in the accent colour with its handles, like a selected point. Every anchor and handle can be dragged to reshape the letter (an anchor carries its handles, a handle bends its curve). There is no hint and no reset button. It fades back behind the education and certifications list so the list reads cleanly.

### Stamps
- 3D pieces shown as perforated stamps. Each prints as an ordered-dither pixel image in one ink (four tones on paper) and resolves into the full render on hover or focus. A click (or Enter) opens a spotlight: the page darkens around a card with the render, tools, year, the piece's story in Mayck's words, with the thumbnails directly under the year and above the story so they are never pushed out of view, and previous/next arrows on the card's left and right edges half way down (half way down the picture on phones). The card is one fixed size for every piece. The picture side is a square and the whole image is always shown, never cropped: a soft blurred copy of it fills the space left around tall or wide pieces. A long story scrolls inside its own side. Projects with more work show thumbnails of the other images; the Illustrations project plays its looping film; only Revista Avenida carries the link to the digital edition. The card opens and closes with the transitions.dev modal transition.

### Recommendations
- The two LinkedIn recommendations sit in one row that moves sideways with the page's own scroll: the row holds in the middle of the screen while scrolling slides it from the first card to the last, then the page carries on, with the last card resting at the left edge exactly as the first one starts. No buttons. With reduced motion or without scripts it is a row you swipe.

### How the 3D layers are attached
- The hero background is its own canvas inside the hero panel, and the footer pyramids are drawn in a canvas inside the footer panel, so both scroll with the page exactly. Only the hero's particles use a canvas fixed to the screen, because they have to leave the panel and land on the headline. Do not go back to one fixed canvas for everything: it trails the page by a frame while scrolling.
- The pinned hero cross-fades: the opening text leaves as the two role labels arrive, with no empty stretch between them.

### Spotlight
- The chat panel carries a soft pale-blue light at the cursor.

### Floating header
- A dark translucent pill, centred, legible over both the blue hero and the cream page.

## Do's and Don'ts

### Do:
- **Do** keep one idea per step and per card.
- **Do** keep text on clear ground.
- **Do** show the company a project was made for as an eyebrow above the project name on the large cards. The small tiles show no company or year.

### Don't:
- **Don't** let particles or gradients run behind body text.
- **Don't** use the accent red for small text on cream; use the darker accent-text.
- **Don't** add ruler frames or tick marks.
