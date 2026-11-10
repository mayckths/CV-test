# Mayck Cuellar · Portfolio

Static portfolio concept for GitHub Pages. No build step: plain HTML, CSS and JavaScript.

- `index.html`: content and structure
- `styles.css`: design tokens (top of file) and layout, light and dark
- `app.js`: the scripted "Ask this portfolio" panel. Edit the `ANSWERS` array to change questions and answers
- `scene3d.js`: the 3D layer. Three.js renders the ribbon sculptures, GSAP ScrollTrigger drives them on scroll, and case study images tilt on hover. Both libraries load from a CDN at pinned versions
- `assets/`: project images

## Publish

1. Merge this branch into `main`.
2. In the repository, open Settings, then Pages.
3. Under "Build and deployment", choose "Deploy from a branch", select `main` and `/ (root)`.

To use a custom domain such as `mayck.design`, add it in the same Pages settings and point the DNS records at GitHub.
