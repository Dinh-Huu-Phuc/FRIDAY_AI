---
name: 3d-scroll-website
description: Build premium 3D scroll-animated websites from scratch — the full pipeline from Next.js setup through canvas frame-sequence animations, smooth scroll, neumorphic design, and deploy. Use this whenever the user mentions building a 3D website, a scroll-animated landing page, a canvas frame sequence (like Apple's AirPods page), scroll-driven hero animations, smooth-scroll sites, premium/agency-quality landing pages, neumorphic or glassmorphic UI, or any site inspired by Igloo, Igloo Inc, Lusion, Active Theory, or Igloo-style scroll sites. Use it EVEN if the user doesn't say the word "3D" — phrases like "scroll animation", "frame sequence", "sticky canvas", "hero animation that plays on scroll", or "premium landing page with scroll effects" are all signals to use this skill. This is the whole pipeline in one place: stack selection, project scaffolding, frame-sequence engine, scroll math, Framer Motion patterns, design system, performance hardening, and deploy — don't stitch partial answers together when this skill covers it end-to-end.
---

# Build Premium 3D Scroll-Animated Websites

This skill captures the complete, proven pipeline for building the kind of premium scroll-animated site you see on high-end agency homepages — sticky canvas with frame-sequence playback as the user scrolls, buttery smooth scroll, neumorphic cards, staggered reveals, and careful performance hardening so it holds up on mobile Safari.

You are the builder. The user brings the idea; you ship the whole site.

## Mental model

The "3D feel" on these sites is almost never runtime WebGL. It's a **pre-rendered image sequence** (100–120 frames exported from Blender / After Effects / Cinema 4D) that a `<canvas>` scrubs through based on scroll position. The viewport is pinned sticky while a tall parent section drives the scroll. That's the trick. Everything else is polish: Lenis for physics-based smooth scroll, Framer Motion for section reveals, CSS 3D transforms for small cubes/orbs, SVG path animations for circuit-style details, and a neumorphic design system that makes the whole thing feel premium.

Keep this model front-of-mind. If the user says "I want a 3D hero that animates as I scroll" — they're describing a sticky canvas with a frame sequence. Start there; don't reach for Three.js unless they explicitly want interactive 3D.

## When to reach for real 3D (Three.js / R3F) instead

- User needs the scene to respond to mouse movement, drag, or gestures
- User needs real-time lighting, physics, or procedural geometry
- Scene has too many states to pre-render cleanly

For anything else — frame sequence wins every time. It's faster on mobile, never janks, and you can art-direct the animation in a real 3D tool.

## The stack (pinned versions, battle-tested)

| Layer | Package | Version | Why |
|-------|---------|---------|-----|
| Framework | `next` | 16.2.2 | App Router, RSC, image optimization |
| UI | `react` | 19.2.4 | Latest concurrent features |
| Styling | `tailwindcss` | v4 | `@import "tailwindcss"`, `@theme inline` |
| Animation | `framer-motion` | 12.38.0 | Scroll reveals, AnimatePresence, springs |
| Smooth scroll | `lenis` | 1.3.21 | Physics-based, Safari-safe |
| Icons | `@phosphor-icons/react` | 2.1.10 | SSR-safe via `/dist/ssr` path |
| Fonts | `geist` | 1.7.0 | Clean sans + mono |

Pin these versions. Next.js 16 has breaking changes from 14/15 — older training data will lead you wrong. If you need the latest API reference, read `node_modules/next/dist/docs/` before writing a route.

Detailed stack notes: **references/01-tech-stack.md**

## Build order (do not deviate)

Build sections one at a time, top to bottom, and check each in the browser before moving on. The user's confidence compounds with each working section. Skipping ahead to "finish faster" always backfires — scroll math bugs are hard to debug against a half-built page.

1. **Scaffold** — `create-next-app` with `--typescript --tailwind --app --src-dir`, install deps, set up `layout.tsx` with Geist fonts and the SmoothScrollProvider wrapper.
2. **Design tokens** — Put the neumorphic shadow stack, color palette, and font variables in `globals.css`. Everything else pulls from these tokens.
3. **Primitives** — Build `AnimatedSection`, `AnimatedItem`, `Button`, `EyebrowBadge` first. Every section reuses them.
4. **Hero (frame-sequence canvas)** — The signature section. Get this working before anything else; it's the hardest part and it anchors the page.
5. **ProjectsShowcase / Tunnel** — Same pattern as Hero with a different frame set. Usually the second canvas animation.
6. **Supporting sections** — Bento features, core services, process, testimonials, FAQ. These are Framer Motion + neumorphic cards.
7. **Final CTA** — Often an SVG path animation (CPU-architecture style) or a dramatic mountain/horizon reveal.
8. **Polish** — Navbar scroll detection, mobile hamburger, Calendly/contact integration, responsive review on real devices.

## Frame-sequence engine (the core technique)

This is the part that makes or breaks the site. Get it right and everything feels premium; get it wrong and it stutters on every scroll.

### Structure

```tsx
<section style={{ height: "400vh" }} className="scroll-animation">
  <div className="sticky top-0 h-screen">
    <canvas ref={canvasRef} className="h-full w-full" />
    {/* Annotation cards positioned absolutely over the canvas */}
  </div>
</section>
```

- Outer section is `400vh` (or 500vh for longer animations) — this creates the scroll distance.
- Inner wrapper is `sticky top-0 h-screen` — it pins to the viewport while the parent scrolls.
- Canvas fills the pinned wrapper.

### The four things the scroll handler does

1. **Compute progress** — `-rect.top / (section.offsetHeight - window.innerHeight)`, clamped 0–1.
2. **Pick a frame** — `Math.floor(progress * FRAME_COUNT)`, clamped to `FRAME_COUNT - 1`.
3. **Draw with cover-fit** — Like CSS `object-fit: cover`, centered. On mobile, multiply width/height by 1.3 to zoom in (the animation reads better when the subject is larger on small screens).
4. **Toggle annotation cards** — Each card has a `show` and `hide` threshold; only call `setState` when the visible-set actually changes (diff by sorted-id string), otherwise you re-render every tick and kill performance.

### Non-negotiable performance rules

These are the rules that separate a smooth site from a janky one. Never compromise.

- **requestAnimationFrame + ticking ref.** Never update canvas or DOM synchronously in the scroll handler. Queue one RAF at a time with a `tickingRef.current` guard.
- **Direct DOM for hot updates.** Canvas `drawImage`, text opacity (`ref.current.style.opacity`), transforms — all via refs, never React state. React state is only for the visible-card set, and only when it actually changes.
- **Preload all frames before starting.** Show a loading bar. A frame that hasn't loaded = a blank canvas = a broken-looking site.
- **DPR-aware canvas sizing.** `canvas.width = innerWidth * devicePixelRatio`, then CSS sizes to `innerWidth + "px"`. Without this, retina displays render blurry.
- **Passive scroll listeners.** `addEventListener("scroll", handler, { passive: true })` — tells the browser you won't call `preventDefault`, lets it optimize.

Full math, code, and mobile handling: **references/03-scroll-animation-deep-dive.md**

## Smooth scroll (Lenis)

Wrap the app in a `SmoothScrollProvider` client component. Lenis integrates naturally with RAF-based scroll handlers — no special bridge needed. Safari wants different settings (higher `lerp`, no `syncTouch`) or it stutters on iOS. Get this wrapper in place before building the hero; the scroll math feels different with Lenis vs. native.

## Framer Motion patterns (non-canvas animations)

The non-canvas sections use a small, consistent vocabulary:

- **AnimatedSection + AnimatedItem** — staggered scroll reveals with `whileInView`, `viewport={{ once: true, margin: "-100px" }}`, spring `{ stiffness: 100, damping: 20 }`.
- **Infinite rotations** — orbit badges, clock hands, background animations (`animate={{ rotate: 360 }}`, `repeat: Infinity`, `ease: "linear"`).
- **AnimatePresence** — FAQ accordions, modals, cards that mount/unmount.
- **CSS 3D cubes** — small decorative elements use `perspective` + `transformStyle: "preserve-3d"` instead of WebGL. Framer Motion animates `rotateX` / `rotateY` cleanly.
- **SVG path animations** — CPU-architecture feel: dots travel along paths via `offset-path` + `offset-distance`.

Full catalog of Framer Motion patterns with code: **references/02-animation-techniques.md**

## Design system

Premium feel comes from consistency. Use the same shadow stack, palette, typography scale, and spacing in every section.

- **Neumorphic shadow** — 6 layered outer shadows + 1 inset white highlight. Do not replace this with a single shadow; the stack is what makes it feel 3D.
- **Glassmorphism** — `backdrop-blur-xl`, `bg-white/40` light / `bg-black/70` dark. Use for navbar and floating pills.
- **Palette** — Zinc scale for neutrals (50–950), indigo-500 + violet-500 as accent gradient, amber for star ratings. Don't add extra colors.
- **Typography** — Geist sans, tight `tracking-tighter` on big headings, `leading-[1.05]`, max-width `18–22ch` for headings / `48–55ch` for body.
- **Spacing** — `px-6 py-24 md:px-8 md:py-32` for sections, `max-w-[1400px]` containers, `p-7` cards, `rounded-[20px]` on surfaces.

Full design tokens: **references/04-design-patterns.md**

## Component architecture

```
src/
├── app/
│   ├── layout.tsx          ← fonts, providers, global scripts
│   ├── page.tsx            ← composes sections in order
│   └── globals.css         ← tokens, utility classes
├── components/
│   ├── sections/           ← Hero, ProjectsShowcase, BentoFeatures, FAQ, FinalCTA, etc.
│   ├── ui/                 ← AnimatedSection, Button, EyebrowBadge, NeumorphicAssets
│   └── providers/          ← SmoothScrollProvider, CalendlyProvider
└── lib/
    └── calendly.ts
public/
├── frames/                 ← 100+ hero frames
└── tunnel-frames/          ← 90+ tunnel frames
```

- Every hook-using or Framer-using component needs `"use client"`. Forgetting this is the #1 hydration bug.
- Phosphor icons import from `@phosphor-icons/react/dist/ssr` in server components, regular path in client components.
- Keep section files focused. If a section grows past ~300 lines, split out visuals to `ui/NeumorphicAssets.tsx`.

Full architecture notes: **references/05-component-architecture.md**

## Asset pipeline — creating frame sequences

This is the part a lot of builders trip on. You can't do this from code alone; you need a 3D tool.

1. Model / animate in **Blender** or **Cinema 4D** (or After Effects for 2.5D). Aim for a 4-second animation at 24–30 fps = 96–120 frames.
2. Export as an **image sequence** — JPG at 80–85% quality for opaque, PNG if you need alpha. Resolution 1920×1080 for desktop; downscale on mobile if needed.
3. Name with a consistent pad: `frame_0001.jpg`, `frame_0002.jpg`, …
4. Place in `public/frames/` (or `public/tunnel-frames/` for a second animation).
5. Update `FRAME_COUNT` and path in the Hero component.

If the user doesn't have frames yet, they have three options: (a) render their own in Blender, (b) commission an artist, (c) use a pre-built sequence from a stock site. Be direct about this — don't pretend the frames come from nowhere.

## Performance hardening checklist

Before claiming the site is done, verify each of these:

- [ ] All frames preload with a visible loading bar that reflects real progress
- [ ] Scroll handler uses RAF + ticking ref (check devtools performance panel for dropped frames)
- [ ] Canvas scaled for `devicePixelRatio` (check on retina — no blur)
- [ ] Canvas updates go direct to DOM, not React state
- [ ] Visible-card set only calls `setState` when the set actually changes (not every tick)
- [ ] Passive scroll listeners everywhere
- [ ] Lenis configured with Safari-safe defaults; test on iOS Safari
- [ ] Mobile canvas uses 1.3× zoom + shorter section height (`350vh` / `300vh`)
- [ ] Production build (`next build && next start`) tested — some animation bugs only show up after build
- [ ] Lighthouse performance score — aim for 85+ on desktop, 70+ on mobile

Full performance deep-dive: **references/06-performance-optimization.md**

## Prompting tips for the user

If the user is driving you through Claude Code and asks vague things like "make it look nice," push back gently and ask for specifics — then teach them the vocabulary. Good prompts mention: the spring config (`stiffness: 100, damping: 20`), specific design tokens (`--card-shadow`, `--background`), the performance pattern (`RAF + ticking ref`, `direct DOM via ref`), and existing components to reuse (`<AnimatedSection>`, `<Button variant="primary">`).

Full prompting + workflow guide: **references/07-claude-code-guide.md**

## Common pitfalls (check these first when things break)

1. **Missing `"use client"`** — any component using `useEffect`, `useRef`, `useState`, or Framer Motion needs it. Symptom: hydration mismatch or "useState is not a function."
2. **Phosphor icons in server components** — use `@phosphor-icons/react/dist/ssr`. Symptom: build fails with a React-server-component error.
3. **Frames not preloading** — blank/flashing canvas on first scroll. Fix: await all `img.onload` before setting `loaded = true`.
4. **React state on scroll value** — jank, high CPU. Fix: use refs and update DOM directly; reserve state for visibility booleans.
5. **Canvas blurry on retina** — missed DPR scaling. Fix: multiply internal `canvas.width`/`height` by `devicePixelRatio`.
6. **Safari smooth-scroll stutter** — Lenis defaults don't suit iOS. Fix: bump `lerp` to 0.1, disable `syncTouch`.
7. **Next.js 16 API drift** — your training data may be Next 13/14. Read the current docs in `node_modules/next/dist/docs/` before writing routes, metadata, or image configs.
8. **Skipping the loading bar** — the site feels broken for the first 2 seconds. Always show real preload progress.

## References index

Everything above is the top layer. Go deep when the task demands it:

- `references/01-tech-stack.md` — Exact versions, install commands, font setup, dev deps
- `references/02-animation-techniques.md` — Every non-canvas animation pattern with code
- `references/03-scroll-animation-deep-dive.md` — Full math, frame logic, mobile handling, optimized scroll handler
- `references/04-design-patterns.md` — Neumorphic shadow stack, palette, typography, spacing
- `references/05-component-architecture.md` — File layout, reusable components, SSR rules
- `references/06-performance-optimization.md` — RAF, direct DOM, preloading, hardware acceleration
- `references/07-claude-code-guide.md` — Effective prompting, CLAUDE.md / AGENTS.md usage, skills

Read the relevant reference file when the section you're working on touches its topic. Do not read all of them up-front — that wastes context. Pull them in on demand.

## One more thing

Ship in the order given. Check each section in the browser (real browser, real scroll) before moving to the next. When a section feels off, diagnose it against the rules in this doc before reaching for clever workarounds — nine times out of ten the fix is already listed above.

You've got this. Build something that makes people stop scrolling.
