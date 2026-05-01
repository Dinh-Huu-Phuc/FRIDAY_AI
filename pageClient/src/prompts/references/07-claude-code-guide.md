# 07 — Claude Code Guide

How Claude Code was used to build this website, and how you can use it effectively for your own projects.

---

## What is Claude Code?

Claude Code is Anthropic's official CLI and IDE extension for Claude. It gives Claude direct access to your codebase — it can read files, write code, run commands, search the codebase, and iterate based on build errors or visual feedback.

---

## How This Website Was Built

### Iterative Section-by-Section Approach

The website was built one section at a time:

1. **Hero** — Started with the canvas frame-sequence animation, then layered in text, cards, and loading states
2. **ProjectsShowcase** — Built the tunnel animation following the same canvas pattern
3. **BentoFeatures** — Each visual (orb, typewriter, chat, workflow) was built individually
4. **Supporting sections** — CoreServices, ProcessMethodology, TestimonialsStats, FAQ
5. **FinalCTA** — The CPU architecture SVG animation
6. **Polish** — Navbar scroll detection, Calendly integration, mobile responsiveness

### CLAUDE.md and AGENTS.md

The project uses instruction files to guide Claude Code:

- **CLAUDE.md** — Project-level instructions that persist across conversations
- **AGENTS.md** — Agent-specific instructions (e.g., "Read Next.js 16 docs before writing code")

These files ensure Claude Code follows project conventions and avoids common pitfalls.

---

## Effective Prompting Tips

### 1. Be Specific About Design Language

Instead of:
> "Make it look nice"

Say:
> "Use neumorphic card surfaces with the existing --card-shadow variable. Background should be #f5f5f5 with white cards. Use the EyebrowBadge component for section labels."

### 2. Reference Existing Components

Instead of:
> "Add a new button"

Say:
> "Use the existing Button component from src/components/ui/Button.tsx with variant='primary' and showArrow"

### 3. Request Performance Patterns Explicitly

Instead of:
> "Add a scroll animation"

Say:
> "Add a scroll-driven animation using requestAnimationFrame with a ticking ref to throttle updates. Update opacity via refs, not React state. Use passive scroll listeners."

### 4. Describe Animation Feel

Instead of:
> "Animate the cards"

Say:
> "Use Framer Motion spring animation with stiffness: 100, damping: 20. Trigger whileInView with once: true and -100px margin. Stagger children by 0.1s."

### 5. Provide Context About What Exists

Instead of:
> "Add smooth scrolling"

Say:
> "The project already uses Lenis via SmoothScrollProvider in the root layout. Any new page inherits smooth scrolling automatically."

---

## Skills Used

Claude Code supports "skills" — specialized capabilities that guide implementation:

### frontend-design
Premium UI design skill that enforces high design quality, proper spacing, typography, and modern patterns like glassmorphism and neumorphism.

### leonxinx-taste-skill
Design taste skill that overrides generic AI patterns and enforces premium visual quality — proper font sizes, spacing ratios, shadow systems, and color harmony.

### 12k-site-builder
Scroll-animated website building skill that provides guidelines for creating premium, agency-quality landing pages with advanced scroll effects.

---

## Project Setup from Scratch

### Step 1: Create the Next.js project

```bash
npx create-next-app@latest my-3d-site --typescript --tailwind --app --src-dir
cd my-3d-site
```

### Step 2: Install animation dependencies

```bash
npm install framer-motion lenis @phosphor-icons/react geist
```

### Step 3: Set up fonts (layout.tsx)

```tsx
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
```

### Step 4: Configure design tokens (globals.css)

```css
@import "tailwindcss";

:root {
  --background: #f5f5f5;
  --foreground: #09090b;
  --card-bg: #ffffff;
  --card-shadow: /* neumorphic shadow stack */;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}
```

### Step 5: Set up SmoothScrollProvider

Create `src/components/providers/SmoothScrollProvider.tsx` and wrap `{children}` in the root layout.

### Step 6: Create reusable components

Build `AnimatedSection`, `Button`, and `EyebrowBadge` first — they're used in every section.

### Step 7: Prepare frame assets

Place pre-rendered frame sequences in `/public/frames/` and `/public/tunnel-frames/`.

### Step 8: Build sections one at a time

Start with the Hero, then add sections progressively. Test each section in the browser before moving on.

---

## Common Pitfalls

1. **Forgetting `"use client"`** — Any component using hooks or Framer Motion needs it
2. **Importing Phosphor Icons wrong** — Use `/dist/ssr` path in server components
3. **Not preloading frames** — Scroll animation will show blank frames
4. **Using React state for scroll values** — Causes re-renders on every tick; use refs
5. **Safari smooth scroll issues** — Lenis needs different config for Safari (higher lerp, no syncTouch)
6. **Canvas blur on retina** — Must scale for `devicePixelRatio`
7. **Next.js 16 breaking changes** — Always check the docs in `node_modules/next/dist/docs/`
