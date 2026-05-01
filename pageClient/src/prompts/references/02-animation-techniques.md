# 02 — Animation Techniques

This document covers every animation technique used in the project, with code references and explanations.

---

## 1. Framer Motion — Scroll-Triggered Animations

### AnimatedSection + AnimatedItem Pattern
**File:** `src/components/ui/AnimatedSection.tsx`

The foundation of all section animations. A container triggers staggered children animations when scrolled into view.

```tsx
const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 20 },
  },
};

// Usage
<AnimatedSection>
  <AnimatedItem>Content fades up with stagger delay</AnimatedItem>
</AnimatedSection>
```

**Key props:**
- `whileInView="visible"` — triggers when entering viewport
- `viewport={{ once: true, margin: "-100px" }}` — fires once, 100px before visible
- Spring physics: `stiffness: 100, damping: 20` gives a smooth, weighted feel

---

## 2. Framer Motion — Infinite Animations

### Orbiting Badge
**File:** `src/components/sections/BentoFeatures.tsx` (OrbVisual)

```tsx
<motion.div
  animate={{ rotate: 360 }}
  transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
>
  {/* Badge orbits around the center */}
</motion.div>
```

### Clock Hands
**File:** `src/components/ui/NeumorphicAssets.tsx` (NeumorphicClock)

```tsx
// Hour hand — slow rotation
<motion.div
  animate={{ rotate: 330 }}
  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
/>

// Minute hand — faster rotation
<motion.div
  animate={{ rotate: 420 }}
  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
/>
```

### Bar Chart Heights
**File:** `src/components/ui/NeumorphicAssets.tsx` (NeumorphicBarChart)

Each bar cycles through 5 height values, creating a "living data" effect:

```tsx
const bars = [
  { heights: [60, 100, 45, 80, 60], delay: 0 },
  { heights: [90, 55, 110, 70, 90], delay: 0.4 },
  // ...
];

<motion.div
  animate={{ height: bar.heights }}
  transition={{
    height: {
      duration: 16,
      repeat: Infinity,
      repeatType: "loop",
      ease: "easeInOut",
      delay: bar.delay,
    },
  }}
/>
```

---

## 3. CSS 3D Transforms — Rotating Cube

**File:** `src/components/ui/NeumorphicAssets.tsx` (NeumorphicSync)

A full 3D cube built with CSS transforms — no WebGL needed.

```tsx
<div style={{ perspective: 600 }}>
  <motion.div
    style={{ transformStyle: "preserve-3d", width: 120, height: 120 }}
    animate={{ rotateX: [0, 360], rotateY: [0, 360] }}
    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
  >
    {/* Front face */}
    <div style={{ ...faceStyle, transform: "translateZ(60px)" }} />
    {/* Back face */}
    <div style={{ ...faceStyle, transform: "rotateY(180deg) translateZ(60px)" }} />
    {/* Right face */}
    <div style={{ ...faceStyle, transform: "rotateY(90deg) translateZ(60px)" }} />
    {/* Left face */}
    <div style={{ ...faceStyle, transform: "rotateY(-90deg) translateZ(60px)" }} />
    {/* Top face */}
    <div style={{ ...faceStyle, transform: "rotateX(90deg) translateZ(60px)" }} />
    {/* Bottom face */}
    <div style={{ ...faceStyle, transform: "rotateX(-90deg) translateZ(60px)" }} />
  </motion.div>
</div>
```

**Key concepts:**
- `perspective: 600` on the parent creates the 3D space
- `transformStyle: "preserve-3d"` enables child 3D positioning
- `backfaceVisibility: "hidden"` hides the back of each face
- `translateZ(60px)` pushes each face outward (half the cube width)

---

## 4. SVG Path Animations — CPU Architecture

**File:** `src/components/ui/CpuArchitecture.tsx` + `src/app/globals.css`

Animated dots travel along SVG circuit paths using `offset-path`.

### The SVG Structure
```tsx
{/* Circuit paths drawn with SVG */}
<path d="M 10 20 h 79.5 q 5 0 5 5 v 30" />

{/* Animated dot masked to the path */}
<g mask="url(#cpu-mask-1)">
  <circle className="cpu-architecture cpu-line-1" r="8" fill="url(#cpu-indigo-grad)" />
</g>
```

### The CSS Animation
```css
.cpu-architecture {
  offset-anchor: 10px 0px;
  animation: cpu-path-animation;
  animation-iteration-count: infinite;
  animation-timing-function: cubic-bezier(0.75, -0.01, 0, 0.99);
}

.cpu-line-1 {
  offset-path: path("M 10 20 h 79.5 q 5 0 5 5 v 30");
  animation-duration: 5s;
  animation-delay: 1s;
}

@keyframes cpu-path-animation {
  0%   { offset-distance: 0%; }
  100% { offset-distance: 100%; }
}
```

### Shimmer Text Effect
The CPU chip text uses an animated gradient:
```xml
<linearGradient id="cpu-text-gradient">
  <stop offset="0%" stopColor="#666666">
    <animate attributeName="offset" values="-2; -1; 0" dur="5s" repeatCount="indefinite" />
  </stop>
  <stop offset="25%" stopColor="white">
    <animate attributeName="offset" values="-1; 0; 1" dur="5s" repeatCount="indefinite" />
  </stop>
</linearGradient>
```

---

## 5. Typewriter Effect

**File:** `src/components/sections/BentoFeatures.tsx`

Custom `useTypewriter` hook that cycles through phrases:

```tsx
function useTypewriter(phrases: string[]) {
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [idle, setIdle] = useState(false);

  useEffect(() => {
    const current = phrases[phraseIdx];
    let timeout;

    if (!deleting && displayed.length < current.length) {
      // Typing: 55ms per character
      timeout = setTimeout(() => setDisplayed(current.slice(0, displayed.length + 1)), 55);
    } else if (!deleting && displayed.length === current.length) {
      // Pause at end: 1800ms
      timeout = setTimeout(() => setDeleting(true), 1800);
    } else if (deleting && displayed.length > 0) {
      // Deleting: 30ms per character (faster)
      timeout = setTimeout(() => setDisplayed(current.slice(0, displayed.length - 1)), 30);
    } else {
      // Move to next phrase
      setPhraseIdx((prev) => (prev + 1) % phrases.length);
    }

    return () => clearTimeout(timeout);
  }, [displayed, deleting, phraseIdx, phrases]);

  return { text: displayed, idle };
}
```

The `idle` state drives a blinking cursor animation.

---

## 6. Scroll Hint Animation

**File:** `src/components/sections/Hero.tsx`

A bouncing scroll indicator:

```tsx
<motion.div
  animate={{ y: [0, 8, 0] }}
  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
  className="h-6 w-4 rounded-full border-2 border-zinc-300"
>
  <motion.div
    animate={{ y: [0, 8, 0] }}
    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
    className="h-1.5 w-1.5 rounded-full bg-zinc-400"
  />
</motion.div>
```

---

## 7. FAQ Accordion

**File:** `src/components/sections/FAQ.tsx`

Spring-based expand/collapse with `AnimatePresence`:

```tsx
<AnimatePresence>
  {isOpen && (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 25 }}
    />
  )}
</AnimatePresence>
```

---

## 8. Workflow Dot Animations

**File:** `src/components/sections/BentoFeatures.tsx` (WorkflowVisual)

Dots travel from center to outer nodes using `offsetPath`:

```tsx
<motion.circle
  r="3"
  fill="#09090b"
  style={{ offsetPath: `path('M ${cx} ${cy} L ${node.x} ${node.y}')` }}
  animate={{ offsetDistance: ["0%", "100%"] }}
  transition={{
    duration: 0.6,
    repeat: Infinity,
    repeatDelay: CYCLE * count - 0.6,
    delay: i * CYCLE,  // staggered
  }}
/>
```

Plus a pulsing ring at the center:
```tsx
<motion.circle
  animate={{ r: [20, 52], opacity: [0.35, 0] }}
  transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
/>
```

---

## Spring Configurations Reference

| Component | Stiffness | Damping | Use Case |
|-----------|-----------|---------|----------|
| AnimatedSection | 100 | 20 | Default scroll reveal |
| Hero text | 80 | 20 | Softer hero entrance |
| FAQ accordion | 200 | 25 | Snappy expand/collapse |
| Mobile menu | 300 | 30 | Fast menu toggle |
| MountainCTA | 60 | 18 | Slow, dramatic reveal |
