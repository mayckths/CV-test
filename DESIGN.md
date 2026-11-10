---
name: Mayck Cuellar Portfolio
description: A dark single-page portfolio where square pixels are the material and Mayck's M is built from them.
colors:
  ground: "#0a0915"
  surface: "#131127"
  surface-raised: "#1b1838"
  text: "#f2f0fa"
  text-muted: "#aaa6c4"
  line: "rgba(242, 240, 250, 0.13)"
  line-strong: "rgba(242, 240, 250, 0.28)"
  coral: "#ff6a45"
  violet: "#a391ff"
  aqua: "#62dbe0"
  yellow: "#ffc23a"
  indigo: "#2a2478"
typography:
  display:
    fontFamily: "Bodoni Moda, Didot, Bodoni MT, Georgia, serif"
    fontSize: "clamp(40px, 5.2vw, 80px)"
    fontWeight: 500
    lineHeight: 1.04
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Bodoni Moda, Didot, Bodoni MT, Georgia, serif"
    fontSize: "clamp(36px, 5vw, 72px)"
    fontWeight: 400
    lineHeight: 1
  statement:
    fontFamily: "Bodoni Moda, Didot, Bodoni MT, Georgia, serif"
    fontSize: "clamp(26px, 3.3vw, 48px)"
    fontWeight: 500
    lineHeight: 1.16
  figure:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "clamp(32px, 4vw, 58px)"
    fontWeight: 500
    letterSpacing: "-0.04em"
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
  gutter: "clamp(20px, 4vw, 64px)"
  max-width: "1320px"
components:
  button-primary:
    backgroundColor: "{colors.text}"
    textColor: "{colors.ground}"
    rounded: "{rounded.pill}"
    padding: "0 22px"
    height: "46px"
  button-primary-hover:
    backgroundColor: "{colors.coral}"
  button-ghost:
    textColor: "{colors.text}"
    rounded: "{rounded.pill}"
    padding: "0 18px"
    height: "40px"
---

# Design System: Mayck Cuellar Portfolio

## Overview

**Creative North Star: "Pixels as matter"**

The page is a dark indigo space with one material: square pixels. A single WebGL layer sits behind the content. In the hero the pixels form Mayck's serif M as a solid, turning letter; as the page scrolls they leave it and become a quiet field of dust; at the footer they gather into the M again. Everywhere, pixels step away from the cursor and show their colour when disturbed.

The look was pinned by Mayck from three references: ricardochance.com (dark ground, particle form, serif statements that light up as you read, pill buttons), mats.zip (point cloud mark, small labels, bracketed years, dot-matrix bands) and andreas.vision (chunky pixels, elegant italic serif). It is adapted to his own colours and mark, not copied.

**Key Characteristics:**
- Dark only: indigo-black ground with soft violet glows.
- Pixels are the only decoration: the M, the field, the dot-matrix bands, square bullets.
- A Didone serif, chosen to match the M's own letterform, for statements; a plain sans for reading.
- Colour appears through interaction: the field is pale until the cursor disturbs it.

## Colors

### Primary
- **Coral** (coral): the one accent on chrome: second headline phrase, link arrows, hover states, send button, quote marks.

### Secondary
- **Violet** (violet), **Aqua** (aqua), **Yellow** (yellow): the first headline phrase, focus rings, and the flagship result. With coral, magenta and indigo they are the colours pixels reveal under the cursor.

### Neutral
- **Ground** (ground), **Surface** (surface) for media panels, **Text** (text), **Muted** (text-muted) for body under headings, **Line** and **Line strong** for hairlines.

### Named Rules
**The Pale Field Rule.** Loose pixels stay pale and dim. Saturated colour appears only where the cursor touches the field or the M.

## Typography

**Display Font:** Bodoni Moda (Didot, Georgia fallback)
**Body Font:** Geist
**Label/Mono Font:** Geist Mono

**Character:** The display face echoes the M in Mayck's mark: high contrast, flat serifs. Italics carry emphasis.

### Hierarchy
- **Display** (500, clamp 40 to 80px): the hero headline; two phrases in italic, violet and coral.
- **Statement** (500, clamp 26 to 48px): the intro paragraph, read word by word.
- **Headline** (400, clamp 36 to 72px): section and project titles, the closing line.
- **Figure** (Geist 500, tight tracking): all numbers and results.
- **Body** (17px, 1.55): paragraphs, up to 54ch.
- **Label** (Geist Mono 12px, uppercase): tags, years, hints.

### Named Rules
**The Sans Figures Rule.** Numbers are never set in the serif: its hairline plus and comma disappear on the dark ground.

## Layout

A centred column up to 1320px. The hero pairs the headline with the M's slot (1.7 to 1), then the statement, four figures on hairlines and the certifications in one row. Projects alternate media and text in two columns from 820px and stack below it. Years sit in square brackets at the right of each label row. Dot-matrix bands separate the hero and footer from the middle. Four small corner marks sit on the viewport.

## Elevation & Depth

Depth comes from the pixel field's own perspective and from one violet glow under project media (0 50px 120px -60px). Panels are otherwise flat with a 1px inner line.

## Shapes

Pills for buttons, chips and the composer; 18px corners on media and 28px on the flagship and art panels. Pixels and bullets are square.

## Components

### Pixel M (signature)
- A voxel M sampled from the mark's outline, a few layers deep, drawn over an empty focusable button in the hero and in the footer. It sways slowly; drag turns it with inertia; a press scatters it and it re-forms; arrow keys nudge it. With reduced motion it rests in a three-quarter view.

### Buttons
- **Primary:** light pill with dark text; coral on hover.
- **Ghost:** 1px light outline pill; fills faintly on hover.

### Links
- Sans, 1px underline, coral drawn arrow that nudges on hover; 44px hit area.

### Flagship panel
- Indigo-to-violet panel holding the Ask Novo mark animation (white product card) and the scripted Ask panel.

### Scroll reading
- The statement, the recommendations and the closing line start at 22% and light up word by word.

## Do's and Don'ts

### Do:
- **Do** keep pixels as the only decorative material.
- **Do** set every number in the sans.
- **Do** put years in square brackets in the label row.

### Don't:
- **Don't** add a light theme or light sections; product UI cards are the only light surfaces.
- **Don't** brighten the resting field; it must stay behind the text.
- **Don't** add ruler frames or tick marks.
