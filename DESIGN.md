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

A cream page built from rounded panels with a small gap between them. The hero follows ricardochance.com: a dark indigo ground with a slow haze of the blue (#22126d) and faint stars, the name and an italic serif headline top left, a short account bottom right (no buttons), and two pyramids drawn in fine soft particles in the middle. On load the whole hero opens as a coarse dithered print of itself that sharpens in steps (see Hero entrance); there is no other entrance motion. The haze leans toward the cursor and a soft light trails it; the pyramids' particles drift gently toward the cursor. The hero stays pinned while two roles (Product design, AI strategy & product growth) appear either side of the pyramids. When the hero leaves, the pyramids' particles travel down, reshape into the headline's own lettering and darken to ink, and the real "I design" takes over. After that, content arrives step by step: a pinned card shows one message per scroll step over a faint construction blueprint of the M, all four case studies, the AI Assistant included, are cards that slide over one another, the chat sits on a blue panel with a soft light that follows the cursor, and the footer sits on the page's beige.

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
- After a drag (or the arrow keys, or a press) nothing pulls the pyramids anywhere and nothing speeds them up. The turn slows on its own until only a small steady drift is left (about 30 degrees a second), and that drift carries them on the same way to the next position that looks like the front, fading over the last few degrees so they settle. The pair looks the same every half turn, so that is never more than half a turn away. Mayck asked for this in November 2026: an earlier version cruised to the front at a set speed, and that still felt like being pulled. The hero and the footer pyramids share this behaviour. The turn applies to the pyramids only, so the landing on the headline needs no turning back.
- In the footer the pyramids gather out of a scatter as they scroll up the screen, and they are only complete at the moment they sit in the middle of the screen (Mayck, November 2026; they used to finish a little past half-way up). If the page ends before they can get that far, they finish where the page ends.
- At rest the pyramids do not close up completely, in the hero and in the footer alike: the later particles stop a little short of their places, so the edges stay soft. Each particle drifts on its own small, slow loop (a few pixels over about twelve seconds).
- About a fifth of the particles are molecules that never join the shape. They float in a cloud around the pyramids, thicker near the shape and thinning outwards (up to about 1.75 times its width and twice its height, never past the panel's edges), each on its own slow current. They do not turn when the pyramids are dragged, they scatter and return with a press, and they only come in to land exactly on the headline's "I design". Mayck asked for them to be more dispersed and to move independently of the pyramids (November 2026).
- The cursor's pull is fluid: each particle follows its own blend of a quick and a slow copy of the cursor, so the pull trails behind the hand, and it fades in and out where the cursor is instead of snapping. The molecules feel it from about twice as far and swirl around it more. Nothing rotates on its own. With reduced motion everything holds still in the loose state.

### Hero prototypes (lab)
- lab/hero-lens.html is a working prototype of a possible new hero, kept apart from the portfolio (not linked, noindex). The hero exists twice, a grey one and a hot pink one (#ff2e7e, white type, navy #1a1466 for the serif word); the pink one only shows inside a lens that follows the cursor. The lens has no hard edge: it breaks up into square cells in Bayer order, with cells in the palette's colours (pink, navy, cyan #2de2e6, white) thick in the edge, scattering outwards and trailing behind it. The coloured cells reshuffle only as the lens travels; when the cursor is still, the edge is still. One system of grains (after knotapi.com/supernova): every grain rides one of four slow bands and looks the same; a core of them holds the two pyramids, and many more settle on the pyramids only while their band carries them past, then peel off and drift on, so the pyramids are where the dust gathers. The grains part around the lens. Inside the lens the loose dust is plainer: some of the grains become even white dots (at most one per 30 px square, so they stay evenly spread), and dots within about 80 px of each other are joined by a thin line, fainter with distance, three lines to a dot at most (Mayck's idea for the dust's "focus state"). Inside the lens the pyramids are not drawn in grains: the lens shows their blueprint on a faint grid, which is what Mayck liked most in the mock-ups. It is drawn in three dimensions (seen from slightly above, in perspective; with the lens in the middle the pyramids face straight ahead, centred, and moving the lens left or right turns them a little that way, as the grain pyramids always did; a version with a resting turn and a tip on vertical movement felt wrong to Mayck): a floor grid, the two pyramids as white wireframes with lightly tinted faces and the edges behind each solid dashed, square anchors, each pyramid's height and base diagonals as dotted construction lines with a right-angle mark, width, depth and height measured along their own axes, and an X, Y, Z marker at the near corner of the floor. An earlier version also drew the M as a bezier curve with handles; Mayck had it removed. The lens stays where the pointer left it and never moves by itself (Mayck's call). The headline is "Lead Product Designer" on one centred line ("Lead Product" in the heavy sans, "Designer" in the italic serif; on phones two lines). The top line reads "Mayck Cuellar" and "Portfolio" and runs at the height of the floating navigation, which sits in the middle of it with the rule left open behind it; below 900 px, where there is no room beside the navigation, the line goes just under it. There is no work list, and the scroll button is solid white. Mayck chose this direction from a long run of mock-ups in November 2026; it is not yet the live hero.

### Hero paragraph
- The short account at the bottom right ("10+ years across fintech and consumer products for Novo, Google, Logitech G and AccuWeather, from discovery to launch.") carries the two facts to take away, so "10+ years" and the four company names are white and semibold, the rest is a shade back, and the whole paragraph is set larger than body text (18 to 23 px). Mayck found the earlier small muted version got lost. A soft dark halo keeps it readable when particles drift behind it.

### Hero entrance
- On load the whole hero (ground, pyramids and text) opens as a very coarse ordered-dither image and is discovered in steps: five prints, each with cells half the size of the last (about 64 px down to 4 px on desktop, 41 px down to 2.5 px on a phone), 0.12 s apart, then a 0.25 s fade to the real hero: 0.85 s in all. It starts the moment the script runs, waiting for nothing (the 3D layer and the web fonts join the print when they arrive), and if the page was slow to load it runs faster, so the whole hero is in view within 2 s of the page starting to load. That limit is Mayck's: earlier versions ran 2.9 s and 1.3 s plus a wait, and were too slow. Mayck chose the dither in November 2026 over a colour mosaic, and it replaced the earlier wireframe entrance.
- It is the same print as the art stamps: a Bayer 4x4 matrix choosing between four opaque tones of one ink, here the hero's own indigo (#0d0730, #22126d, #6f5ce0, #f1eefd). The floating header is not part of it and is sharp from the start.
- The pyramids open turned about 20 degrees (the right one nearer), hold that angle under the print, and come round to face front as it gives way, the short way. This is the only turn that is not a drag; with reduced motion they start facing front.
- The print is live (hero-pix.js): the haze and the pyramids keep moving under it, and the text is drawn from where the page laid it out. It ends at once if the page is scrolled, does not run with reduced motion or when the page opens part-way down, and still runs without WebGL from the still ground and the text.
- A press on the hero's pyramids plays the print again, quicker (five prints 0.08 s apart and a 0.2 s fade, 0.6 s in all), on either screen of the pinned hero, while the pyramids scatter. It waits a frame for a fresh picture of the pyramids so the first print is of that instant. Not with reduced motion, and not on the footer's pyramids.
- The modal transition of the art spotlight is still adapted from transitions.dev; its licence stays in vendor/transitions.

### Particles
- Soft round motes in white, lilac, violet, pink and peach, small with a bright core (Mayck preferred these over larger rimmed blobs). They draw the pyramids in the hero and, in blue on the beige footer, draw them again. The pyramids never turn on their own: no idle sway, no facing the cursor, no turn on scroll. Only a drag turns them, and they ease back to face front. Every mote leans slightly toward the cursor wherever it is on the panel, and within reach they drift a little closer. They sit in the exact middle of the hero panel and are in the same place and state on both screens of the pinned hero, with the two role labels either side on the second. They respond to drags and presses throughout. When the hero lets go, the motes travel straight down, with no rotation, and become the headline's "I design".

### Step scene
- One step visible at a time, cross-fading with a short rise and blur; a rail shows position.

### Blueprint
- The serif M drawn as a real path: every vertex has an anchor, the bracketed serifs are true curves with their control handles, and guides mark the baseline, cap line and stems. It reacts to the scroll: a camera travels around the letter, each step framing another corner (top-left serif, top-right serif, then down to the left foot at the bottom left and across to the right foot at the bottom right), and the node in focus is picked out in the accent colour with its handles, like a selected point. Every anchor and handle can be dragged to reshape the letter (an anchor carries its handles, a handle bends its curve). There is no hint and no reset button. It fades back behind the education and certifications list so the list reads cleanly.

### Stamps
- The stamps stand on the rim of a big wheel whose centre is far below the section, after the case-study cards on hugeinc.com (Mayck's reference, November 2026): the stamp at the front is upright, its neighbours lean away by 24 degrees each and drop, and the ones beyond fade at the section's edges. The four stamps are repeated once so the wheel has no end.
- The front stamp is shown as the full render; the others are dithered prints, and each resolves as it comes to the front. Drag turns the wheel (a flick carries it on a stamp or two, and it always settles on one), so do the two round arrows under it, the arrow keys, and a sideways swipe on a trackpad. A press on a neighbour brings it to the front; a press on the front stamp opens its story. Tabbing to a stamp brings it round. The first time the section comes into view the wheel turns in from one stamp away. Left alone and on screen, it then moves on by one stamp every two seconds (Mayck asked for this, unlike the pyramids, which never turn on their own). It holds still while it is pointed at, dragged, focused from the keyboard or while a story is open, waits three seconds after the visitor stops, and never moves on its own with reduced motion.
- With a mouse, the cursor over the wheel is a dark round badge that follows the pointer: an arrow to the left on the left half, to the right on the right half, and the word "View" over the front stamp (not an arrow, at Mayck's request, since a press there opens the piece instead of turning the wheel). A press does what it shows: the open parts of the wheel step it one stamp that way, a neighbour comes to the front, the front stamp opens. Without scripts the stamps fall back to a plain grid; with reduced motion the wheel jumps instead of gliding.
- The fifth stamp, Sliced Cats (three.js, 2026), is a live piece: two cat sculptures of floating slabs that can be turned and zoomed. It lives in assets/art/sliced-cats as its own page (index.html and main.js, from Mayck's handoff, main.js untouched) and runs in a frame inside the spotlight, in place of its still picture: the finished picture is put away while the piece is live, so the story opens on the wireframe and then the materials fill in. It opens turned about 35 degrees to the right and swings round to its front on a spring (past the front by about 10 degrees, back, and still, in two seconds), which shows that it can be turned; a touch or a press on the piece takes over at once. Mayck asked for this because showing the finished picture first made it look like an image. Rules that keep it from costing the page anything: it is never loaded until its story is opened; it is removed when the story changes or closes, which frees its graphics context; three.js comes from the same CDN address the page already uses, so it is not downloaded twice and is not stored in the repo; touch devices get half the refinement passes; without WebGL 2 the still picture stays; with reduced motion it waits behind a "Play in 3D" button. Escape pressed inside the piece still closes the story. Do not embed it directly on the page: its wheel zoom and one-finger orbit would trap page scrolling.
- 3D pieces shown as perforated stamps. Each prints as an ordered-dither pixel image in one ink (four tones on paper) and resolves into the full render on hover or focus. A click (or Enter) opens a spotlight: the page darkens around a card with the render, tools, year, the piece's story in Mayck's words, with the thumbnails directly under the year and above the story so they are never pushed out of view, and previous/next arrows on the card's left and right edges half way down (half way down the picture on phones). The card is one fixed size for every piece. The picture side is a square and the whole image is always shown, never cropped: a soft blurred copy of it fills the space left around tall or wide pieces. A long story scrolls inside its own side. Projects with more work show thumbnails of the other images; the Illustrations project plays its looping film; only Revista Avenida carries the link to the digital edition. The card opens and closes with the transitions.dev modal transition.
- In the spotlight, the previous and next piece arrows are never over the picture: Mayck found that there they read as "next image", which is what the thumbnails do. On wide screens (1100 px and up) they stand outside the card, either side of the whole modal at mid-height, and the card leaves room for them. Below that, down to phones, they sit either side of the count ("2 / 4") in the card's text, beside the year. The markup holds both pairs and CSS shows one.
- Behind the open spotlight the page is shown as a coarse dark print of itself, in the same ordered dither: four dark tones of the page's ink (#0e0b11 to #685a53), cells of 4, then 8, then 16 px as the card opens (3, 6, 10 px on a phone), and back down as it closes. The browser cannot hand over a picture of the page, so app.js paints the part in view from the page's own boxes (backgrounds, radial glows, pictures, 2D canvases, words) and prints that; the WebGL canvases and SVGs are left out. A soft shade still darkens the edges, and if the painting fails the old plain shade shows. With reduced motion the print is shown at rest with no steps.

### Certifications
- Six entries in the last message of the introduction, newest first with MIT xPRO kept at the top at Mayck's request: MIT xPRO, Claude Academy (AI Fluency for creative work, 2026), Nielsen Norman Group, RARE with Google, UC San Diego, Universidad de los Andes. The type and spacing follow the screen's height as well as its width, so all six fit the pinned card on short laptops and small phones.

### Work
- Selected work is four large stacking cards, in this order: AI Assistant (Novo Platform), Logitech G audio mixer, With Google Built-in Auto (Google, at Huge) and AccuWeather app (AccuWeather, at Huge). Mayck chose this line-up in November 2026 to lead with the best-known names.
- The rest sits in a four-tile row headed "Also designed and shipped" (a working title): Design System Componetizer, First time experience, Wear OS by Google, Google TV. Tiles carry a title, a text of at most two lines and a link where there is one; no company or year. The row is four across down to 1241 px, two across to 561 px, then one, which is what keeps every text to two lines.
- The two cards promoted from tiles (Built-in Auto, AccuWeather) only say what is known: role, scope and that the work is live. No invented numbers.

### Recommendations
- On desktop the first two LinkedIn recommendations sit side by side at full size and the third (Tim Burton's, a longer passage set a little smaller) shows only its edge, fading out: a round arrow on that edge, or a sideways swipe, slides the row to bring it in, and an arrow on the other edge slides back. Mayck asked for the first two to stay as they were, with an arrow to the third. Each is quoted exactly, with name and role written "Role @ Company". On phones, three small bars under the row show which card the scroll has reached. On phones they sit in one row that moves sideways with the page's own scroll: the row holds in the middle of the screen while scrolling slides it from the first card to the last, then the page carries on, with the last card resting at the left edge exactly as the first one starts. No buttons. With reduced motion or without scripts it is a row you swipe.

### How the 3D layers are attached
- The hero background is its own canvas inside the hero panel, and the footer pyramids are drawn in a canvas inside the footer panel, so both scroll with the page exactly. Only the hero's particles use a canvas fixed to the screen, because they have to leave the panel and land on the headline. Do not go back to one fixed canvas for everything: it trails the page by a frame while scrolling.
- The pinned hero cross-fades: the opening text leaves as the two role labels arrive, with no empty stretch between them.

### Spotlight
- The chat panel carries a soft pale-blue light at the cursor.
- In the chat's answers the small marks are white, not the accent: list bullets, link underlines and the link arrow. Every link in an answer carries the small up-right arrow, the same one the page's other links use, so it reads as something to click. The orange stays on the question bubbles and the send button.

### Floating header
- Two pieces, centred together: the island (a dark translucent pill with the logo and the five section links) and, to its right and outside it, the "Say hi" button as a white pill. Mayck tried it on the left in orange first and chose white on the right.
- Link states are deliberately far apart: idle links are dim (62% lilac-white), hover lifts them to white on a faint chip, and the section in view is a solid light chip with dark text. Nothing else in the island is light, which is why "Say hi" stands outside it. A hairline and a soft shadow keep the white pill visible on the cream page; it turns the bright accent on hover.
- On phones the links tighten; at 380 px and below the logo gives way so the links still fit; at 340 px and below "About" goes too.

### Scroll cues
- People testing the page found the scroll confusing where the page holds still while you scroll, so those places carry a cue: a pill button labelled "Scroll" with a bobbing down arrow, which also does the scrolling when pressed.
- Hero: bottom centre, through both screens of the pinned hero. It replaced the "Drag to turn · Press to scatter" line, which is gone (the button's label for assistive tech still says how the pyramids respond). It goes to the roles screen, then on to the introduction.
- Introduction: the foot of the pinned card shows the cue in the centre and the rail on the right (the "3 / 6" count was removed at Mayck's request); the cue which goes to the next message and after the last one to Selected work.
- The arrow does not bob with reduced motion, and the cue's scrolling is then instant.

## Do's and Don'ts

### Do:
- **Do** keep one idea per step and per card.
- **Do** keep text on clear ground.
- **Do** show the company a project was made for as an eyebrow above the project name on the large cards. The small tiles show no company or year.

### Don't:
- **Don't** let particles or gradients run behind body text.
- **Don't** use the accent red for small text on cream; use the darker accent-text.
- **Don't** add ruler frames or tick marks.
