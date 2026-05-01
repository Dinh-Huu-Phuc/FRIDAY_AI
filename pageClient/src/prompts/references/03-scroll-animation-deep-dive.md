# 03 — Scroll Animation Deep Dive

The signature feature of this website: scroll-driven canvas animations that play pre-rendered frame sequences as the user scrolls. This document breaks down the exact math and logic.

---

## Architecture Overview

Both the Hero and ProjectsShowcase use the same pattern:

1. **Tall section** (400-500vh) creates scroll distance
2. **Sticky viewport** (100vh) pins to screen while scrolling
3. **Canvas** renders frames based on scroll progress
4. **Annotation cards** appear/disappear at specific scroll thresholds

---

## Hero Section

**File:** `src/components/sections/Hero.tsx`
**Frames:** 106 JPGs in `/public/frames/frame_0001.jpg` to `frame_0106.jpg`

### Section Height
```tsx
<section style={{ height: "400vh" }}>
  <div className="sticky top-0 h-screen">
    <canvas />
  </div>
</section>
```

Responsive heights via CSS:
```css
@media (max-width: 1024px) { .scroll-animation { height: 350vh !important; } }
@media (max-width: 768px)  { .scroll-animation { height: 300vh !important; } }
```

### Frame Preloading

All 106 frames are preloaded before the animation starts:

```tsx
const FRAME_COUNT = 106;

useEffect(() => {
  let loadedCount = 0;
  const imgs: HTMLImageElement[] = [];

  for (let i = 1; i <= FRAME_COUNT; i++) {
    const img = new Image();
    img.src = `/frames/frame_${String(i).padStart(4, "0")}.jpg`;
    img.onload = () => {
      loadedCount++;
      setLoadProgress(loadedCount / FRAME_COUNT);  // drives loading bar
      if (loadedCount === FRAME_COUNT) setLoaded(true);
    };
    imgs.push(img);
  }
  framesRef.current = imgs;
}, []);
```

A loading overlay shows progress until all frames are loaded.

### Scroll Progress Calculation

```tsx
const rect = section.getBoundingClientRect();
const scrollableHeight = section.offsetHeight - window.innerHeight;
const progress = Math.min(1, Math.max(0, -rect.top / scrollableHeight));
```

- `rect.top` — distance from section top to viewport top (negative when scrolled past)
- `scrollableHeight` — total scrollable distance (400vh - 100vh = 300vh)
- `progress` — normalized 0 to 1

### Frame Selection

```tsx
const frameIndex = Math.min(FRAME_COUNT - 1, Math.floor(progress * FRAME_COUNT));
```

- progress `0.0` → frame 0
- progress `0.5` → frame 53
- progress `1.0` → frame 105

### Canvas Drawing (Cover-Fit)

The `drawFrame` function implements cover-fit scaling (like CSS `object-fit: cover`):

```tsx
const drawFrame = (index: number) => {
  const imgRatio = img.naturalWidth / img.naturalHeight;
  const canvasRatio = cw / ch;

  if (window.innerWidth > 768) {
    // Desktop: standard cover-fit
    if (canvasRatio > imgRatio) {
      drawW = cw; drawH = cw / imgRatio;
    } else {
      drawH = ch; drawW = ch * imgRatio;
    }
  } else {
    // Mobile: cover-fit + 1.3x zoom
    // ... same cover-fit logic, then:
    drawW *= 1.3;
    drawH *= 1.3;
  }

  drawX = (cw - drawW) / 2;  // center horizontally
  drawY = (ch - drawH) / 2;  // center vertically
  ctx.drawImage(img, drawX, drawY, drawW, drawH);
};
```

### Canvas DPI Scaling

For crisp rendering on retina displays:

```tsx
const resizeCanvas = () => {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;    // internal resolution
  canvas.height = window.innerHeight * dpr;
  canvas.style.width = window.innerWidth + "px";   // display size
  canvas.style.height = window.innerHeight + "px";
};
```

### Hero Text Fade

The hero text fades out in the first 8% of scroll:

```tsx
if (heroTextRef.current) {
  const opacity = Math.max(0, 1 - progress / 0.08);
  heroTextRef.current.style.opacity = String(opacity);
}
```

- progress `0.00` → opacity `1.0` (fully visible)
- progress `0.04` → opacity `0.5`
- progress `0.08` → opacity `0.0` (fully hidden)

### Annotation Cards — Visibility Zones

Each card has a `show` and `hide` threshold:

```tsx
const annotations = [
  { id: "card-1", show: 0.10, hide: 0.30 },  // visible 10%-30% scroll
  { id: "card-2", show: 0.35, hide: 0.55 },  // visible 35%-55% scroll
  { id: "card-3", show: 0.60, hide: 0.80 },  // visible 60%-80% scroll
];
```

Cards use CSS transitions (not Framer Motion) for performance:
```tsx
className={`transition-all duration-400 ${
  visible ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"
}`}
```

---

## ProjectsShowcase — Tunnel Animation

**File:** `src/components/sections/ProjectsShowcase.tsx`
**Frames:** 97 JPGs in `/public/tunnel-frames/frame_0001.jpg` to `frame_0097.jpg`

### Differences from Hero

| Aspect | Hero | ProjectsShowcase |
|--------|------|-----------------|
| Section height | 400vh | 500vh |
| Frame count | 106 | 97 |
| Mobile zoom | 1.3x | 1.3x |
| Cards | 3 annotation cards | 5 project cards |
| Background | Light (#f5f5f5) | Dark (zinc-950) |
| CTA overlay | None | Appears at 82% |

### Intro Text Fade

Fades in the first 6% of scroll (faster than hero):

```tsx
const newIntroOpacity = Math.max(0, 1 - progress / 0.06);
```

### Project Card Zones

5 project cards with tighter spacing:

```tsx
const projects = [
  { show: 0.04, hide: 0.17 },  // Project 1
  { show: 0.20, hide: 0.33 },  // Project 2
  { show: 0.36, hide: 0.49 },  // Project 3
  { show: 0.52, hide: 0.64 },  // Project 4
  { show: 0.67, hide: 0.78 },  // Project 5
];
```

### CTA Overlay

A "Book a Free Call" overlay appears at the end:

```tsx
const shouldShowCta = progress >= 0.82;
```

### Optimized State Updates

Only triggers React re-render when the visible card set actually changes:

```tsx
const newIds = [...newVisible].sort().join(",");
if (newIds !== prevVisibleIdsRef.current) {
  prevVisibleIdsRef.current = newIds;
  setVisibleCards(newVisible);  // only re-renders when set changes
}
```

---

## Scroll Handler Pattern (Both Sections)

The scroll handler follows this optimized pattern:

```
User scrolls
  → scroll event fires
  → check tickingRef (already processing?)
  → if not ticking, set ticking = true
  → requestAnimationFrame(() => {
      calculate progress
      update canvas frame (direct DOM)
      update text opacity (direct DOM via ref)
      update visible cards (React state, only if changed)
      set ticking = false
    })
```

This ensures:
- Only one RAF callback queued at a time
- Canvas and opacity updates bypass React
- React state only updates when visibility actually changes
- Scroll events don't stack up and cause jank

---

## Creating Your Own Frame Sequences

To create frame sequences for scroll animations:

1. **Design the animation** in After Effects, Blender, or any 3D tool
2. **Export as image sequence** — JPG for photos, PNG for transparency
3. **Naming convention:** `frame_0001.jpg`, `frame_0002.jpg`, etc.
4. **Recommended:** 60-120 frames for smooth scroll playback
5. **Resolution:** Match your target viewport (1920x1080 for desktop)
6. **Compression:** JPG quality 80-85% balances size vs. quality
7. **Place in** `/public/frames/` or similar directory
