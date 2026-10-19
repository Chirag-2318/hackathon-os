# Sign-In Hero Panel Imagery & Manifest Guide

This directory stores the high-resolution hero imagery and frame configuration for the bracket. sign-in experience.

## Manifest Format (`manifest.json`)

The hero panel loads frame metadata from `manifest.json`. If this manifest is missing or files cannot be retrieved, the frontend gracefully renders an inline SVG fallback scene without disruption.

```json
[
  {
    "id": "signin-01-first-light",
    "caption": "First light",
    "figure": "FIG. 01",
    "alt": "Two tall black stone brackets facing each other in a quiet hall, with warm light spilling through the gap between them.",
    "dominant": "#0C0B0A",
    "focalX": 50,
    "focalY": 55,
    "sources": {
      "avif": {
        "960": "/signin/signin-01-first-light-960.avif",
        "1440": "/signin/signin-01-first-light-1440.avif",
        "2000": "/signin/signin-01-first-light-2000.avif"
      },
      "webp": {
        "960": "/signin/signin-01-first-light-960.webp",
        "1440": "/signin/signin-01-first-light-1440.webp",
        "2000": "/signin/signin-01-first-light-2000.webp"
      },
      "jpg": {
        "960": "/signin/signin-01-first-light-960.jpg",
        "1440": "/signin/signin-01-first-light-1440.jpg",
        "2000": "/signin/signin-01-first-light-2000.jpg"
      }
    }
  }
]
```

## Naming Conventions
Files for each frame should be produced in 3 formats (AVIF, WebP, JPG) across 3 responsive breakpoints (960px, 1440px, 2000px):

1. **Frame 1 — First Light** (05:00 – 16:59)
   - `signin-01-first-light-960.{avif,webp,jpg}`
   - `signin-01-first-light-1440.{avif,webp,jpg}`
   - `signin-01-first-light-2000.{avif,webp,jpg}`

2. **Frame 2 — The Long Middle** (21:00 – 04:59)
   - `signin-02-long-middle-960.{avif,webp,jpg}`
   - `signin-02-long-middle-1440.{avif,webp,jpg}`
   - `signin-02-long-middle-2000.{avif,webp,jpg}`

3. **Frame 3 — The Last Hour** (17:00 – 20:59)
   - `signin-03-last-hour-960.{avif,webp,jpg}`
   - `signin-03-last-hour-1440.{avif,webp,jpg}`
   - `signin-03-last-hour-2000.{avif,webp,jpg}`

## Composition & Lighting Rules
When rendering or generating candidate photographs:
- **Central Gap Anchor**: Place the vertical void between the monolithic brackets at precisely `50% x` and `55% y`. Light spills outward from this gap.
- **Bottom-Left Quiet Zone**: Keep the lower-left 30% of the canvas low-contrast and dark to ensure the editorial caption (`FIG. 0X` and title) meets WCAG AA contrast standards.
- **Tone**: Sparse, architectural, monolithic, serene. No floating UI mockups, no stock 3D icons, no gradients except natural lighting.
