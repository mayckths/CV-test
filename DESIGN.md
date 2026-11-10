---
name: Mayck Cuellar Portfolio
description: A single-page portfolio drawn as one construction drawing set, with 3D work as its material.
colors:
  drafting-film: "#f2f4f6"
  sheet-white: "#ffffff"
  graphite: "#1d1e24"
  graphite-muted: "#5d606b"
  hairline: "#d8dae2"
  construction-blue: "#2f3fd6"
  guide-blue-soft: "#aab2e8"
  material-coral: "#ff5a36"
  material-coral-ink: "#e0451f"
  material-aqua: "#57d3d9"
  material-violet: "#6a4cdb"
  material-indigo: "#2d2a8c"
  material-magenta: "#e0399b"
  material-yellow: "#ffc23a"
  blueprint: "#1e1b66"
  blueprint-text: "#eef0ff"
  blueprint-muted: "#bcc0f2"
typography:
  display:
    fontFamily: "Archivo, Arial Narrow, system-ui, sans-serif"
    fontSize: "clamp(40px, 6.3vw, 90px)"
    fontWeight: 750
    lineHeight: 0.94
    letterSpacing: "-0.012em"
    fontVariation: "'wdth' 72"
  headline:
    fontFamily: "Archivo, Arial Narrow, system-ui, sans-serif"
    fontSize: "clamp(34px, 5vw, 68px)"
    fontWeight: 750
    lineHeight: 0.95
    letterSpacing: "-0.01em"
    fontVariation: "'wdth' 72"
  title:
    fontFamily: "Archivo, Arial Narrow, system-ui, sans-serif"
    fontSize: "clamp(32px, 3.8vw, 52px)"
    fontWeight: 750
    lineHeight: 0.95
    fontVariation: "'wdth' 72"
  figure:
    fontFamily: "Archivo, Arial Narrow, system-ui, sans-serif"
    fontSize: "clamp(30px, 3.6vw, 50px)"
    fontWeight: 750
    lineHeight: 1
    fontFeature: "'tnum'"
    fontVariation: "'wdth' 75"
  body:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: "0.06em"
rounded:
  none: "0px"
  product-card: "22px"
spacing:
  gutter: "clamp(20px, 4vw, 64px)"
  section: "clamp(64px, 9vw, 128px)"
  case: "clamp(32px, 5vw, 72px)"
  max-width: "1280px"
components:
  button-primary:
    backgroundColor: "{colors.graphite}"
    textColor: "{colors.drafting-film}"
    rounded: "{rounded.none}"
    padding: "16px 24px"
    typography: "{typography.label}"
  button-primary-hover:
    backgroundColor: "{colors.construction-blue}"
  button-keyline:
    backgroundColor: "{colors.drafting-film}"
    textColor: "{colors.graphite}"
    rounded: "{rounded.none}"
    padding: "10px 16px"
    typography: "{typography.label}"
  link:
    textColor: "{colors.graphite}"
    typography: "{typography.label}"
  chip-blueprint:
    textColor: "{colors.blueprint-text}"
    rounded: "{rounded.none}"
    padding: "9px 14px"
    height: "42px"
  input-composer:
    backgroundColor: "{colors.drafting-film}"
    textColor: "{colors.graphite}"
    rounded: "{rounded.none}"
---

# Design System: Mayck Cuellar Portfolio

## Overview

**Creative North Star: "The Drawing Set"**

The portfolio is one construction drawing set. Every section is a sheet: a cool drafting-film ground, graphite ink, and construction blue for each guide line, tick, dimension and small label. The page proves its thesis by its own drawing: results are dimensioned, views are framed with registration corners, and the hero sculpture sits inside live construction lines that measure it.

Colour does not decorate the drawing. It arrives only as material, taken from Mayck's 3D art (coral, aqua, violet, indigo, magenta and yellow), and lives in the WebGL sculptures, the iridescent art panel, the material swatches and the discipline key that tags each project. The one inversion is the blueprint detail sheet for Ask Novo, set in deep indigo with yellow dimensions.

Density is calm and technical: square corners, hairlines, mono labels, condensed capitals. The headline carries two phrases in material colour; that is an intended exception to the brief's "refuses accent-word" line, recorded here so it stays deliberate.

**Key Characteristics:**
- Cool off-white film ground, never cream.
- Construction blue is the only line colour on the light sheet.
- Colour is material: sculptures, art and the discipline key.
- Condensed uppercase display, mono labels, plain body text.
- Square corners everywhere except the product UI being shown.

## Colors

A neutral drafting palette with one line colour, plus a six-colour material set from the 3D work.

### Primary
- **Construction Blue** (construction-blue): every guide, tick, dimension rule, registration corner, small label, active nav state, focus ring and link underline on the light sheet. 6.8:1 on the film.
- **Soft Guide Blue** (guide-blue-soft): the sheet border, the dashed construction circle, title block rules and spec-line rules.

### Secondary
- **Blueprint Indigo** (blueprint): the ground of the Ask Novo detail sheet, with Blueprint Text and Blueprint Muted for type on it.
- **Material Yellow** (material-yellow): the only accent on the blueprint: result figures, dimension ticks, the user's chat bubble, chips on hover, the send button.

### Tertiary
- **Material set** (material-coral, material-aqua, material-violet, material-indigo, material-magenta, material-yellow): sculpture surfaces and the discipline key. Violet marks AI, coral fintech, yellow research, aqua systems, magenta 3D and motion, indigo UI.
- **Coral Ink** (material-coral-ink) and **Violet** (material-violet): the two headline phrases. Coral Ink is for large type only (3.8:1).

### Neutral
- **Drafting Film** (drafting-film): page ground.
- **Sheet White** (sheet-white): view frames behind media.
- **Graphite** (graphite): all type and the primary button.
- **Graphite Muted** (graphite-muted): body copy under headings, captions (5.7:1).
- **Hairline** (hairline): dividers between cases and table rows.

### Named Rules
**The Material Rule.** A material colour appears only where it means a material or a discipline: on the 3D, in the art, in a swatch or key. Chrome, borders and backgrounds on the light sheet never use it.

**The One Line Colour Rule.** Every line on the light sheet is construction blue or its soft tint. A graphite rule marks only a section's top edge.

## Typography

**Display Font:** Archivo at condensed width (with Arial Narrow, system sans)
**Body Font:** Archivo at normal width (with system sans)
**Label/Mono Font:** JetBrains Mono (with ui-monospace)

**Character:** One variable family stretched two ways: condensed technical capitals for anything that names a sheet, normal width for reading. Mono is reserved for measurements and labels, the way a drawing sets its annotations.

### Hierarchy
- **Display** (750, clamp 40 to 90px, 0.94): the hero statement, uppercase, about two thirds of the sheet width.
- **Headline** (750, clamp 34 to 68px, 0.95): section titles such as Selected work and Experience, uppercase.
- **Title** (750, clamp 32 to 52px, 0.95): project names, uppercase; the flagship project runs larger (up to 104px).
- **Figure** (750, clamp 30 to 50px, tabular): results set above their dimension rules.
- **Body** (400, 17px, 1.55): paragraphs, 54 to 58ch.
- **Label** (500, 12px, 0.06em, uppercase): nav, spec lines, title blocks, links, dimensions.

### Named Rules
**The Annotation Rule.** Mono is for measurement and labelling only. Sentences longer than a label (such as the chat disclosure) set in mono stay in sentence case.

## Layout

A centred sheet up to 1280px wide with a fluid gutter (clamp 20 to 64px), inside a fixed sheet border inset 10px from the viewport (6px on phones) with zone ticks every 160px. Sections open with a headline over a graphite rule and a keylined title box at the right. Projects alternate media and text in two columns from 820px up and stack media first below it. The Huge work is a four-column grid, two at 980px and one at 440px. The header is full-bleed with its content aligned to the sheet; on phones it becomes two rows with the four section links spread across 44px targets.

**The Dimension Rule.** A result is always drawn: a 1px rule with end ticks above the figure. The hero stats, every case result and the chat's stat answers use it.

## Elevation & Depth

The sheet is flat. Depth comes from the WebGL sculptures behind the content and from one soft shadow under the Ask Novo product card (0 40px 80px -30px at 70% black) and under grid views on hover (0 18px 36px -24px). Views otherwise sit flat in their frames.

## Shapes

Square corners and 1px hairlines. Views carry registration corners: two blue L-marks, top left and bottom right. The keylined Say hi button carries the same marks just outside its box. The only rounded shapes are depicted product UI (the Ask Novo card at 22px) and circular items (the M badge, swatches, media pause controls).

## Components

### Buttons
- **Shape:** square (0px).
- **Primary:** graphite fill, film text, mono label, 16px by 24px; hover fills construction blue.
- **Keyline (Say hi):** 1px graphite border with blue registration corners; hover fills graphite.

### Links
- Mono uppercase label with a 1px construction-blue underline and a drawn arrow; the arrow nudges up-right on hover. Each link has a 44px hit area.

### Chips (Ask panel)
- **Style:** square, 1px light border on the blueprint, 42px tall; hover takes a yellow border and tint. At most four show at a time.

### Inputs / Fields
- **Composer:** square film-coloured bar with a yellow send button; focus draws a 2px yellow ring.

### Navigation
- Mono uppercase labels in muted graphite; hover and the section in view turn construction blue, the current one underlined.

### Title block
- Bordered in soft guide blue: Drawn by, Role, Sheet in the hero, beside the certifications and the materials key.
- Every other sheet carries a slim keylined title box in mono blue capitals, built from that section's own words: the work count and years, Experience with the Full CV link, Recommendations, 3D and digital art, Contact.

### Spec line
- Project metadata sits under the project name between two soft blue rules: discipline swatches, years, then the discipline list.

### Construction overlay (signature)
- A dashed circle, crosshair and leader line track the hero sculpture on screen, labelled "Fig. 1 · Soft sculpture" with its live diameter in pixels. The axes draw on at load and the whole overlay fades as the sculpture leaves on scroll.

## Do's and Don'ts

### Do:
- **Do** draw every result as a dimension (rule with end ticks) above its figure.
- **Do** put project metadata under the heading as a ruled spec line.
- **Do** tag each project with its discipline swatches from the materials key.
- **Do** keep light-sheet lines in construction blue or its soft tint.

### Don't:
- **Don't** place labels or eyebrows above headings.
- **Don't** use material colours on chrome, borders or backgrounds of the light sheet.
- **Don't** add a grid to the blueprint or the sheet; registration corners and zone ticks are the only structure marks.
- **Don't** round corners on anything except depicted product UI and circular items.
- **Don't** set coral ink below large-text size.
