# 04 — Design Patterns

The visual language of this website: neumorphic design, glassmorphism, and a carefully controlled color palette.

---

## 1. Neumorphic Design System

### The Shadow

The signature neumorphic shadow uses 6 outer layers + 1 inset highlight:

```css
--card-shadow:
  0px 0.7px 0.7px -0.67px rgba(0, 0, 0, 0.08),     /* tight */
  0px 1.8px 1.8px -1.33px rgba(0, 0, 0, 0.08),     /* small */
  0px 3.6px 3.6px -2px    rgba(0, 0, 0, 0.07),     /* medium */
  0px 6.9px 6.9px -2.67px rgba(0, 0, 0, 0.07),     /* large */
  0px 13.6px 13.6px -3.33px rgba(0, 0, 0, 0.05),   /* extra-large */
  0px 30px 30px -4px       rgba(0, 0, 0, 0.02),     /* ambient */
  inset 0px 3px 1px 0px    rgba(255, 255, 255, 1);  /* top edge highlight */
```

**Why this works:** Multiple subtle shadows at different distances create depth without harsh edges. The inset white highlight simulates light hitting the top edge.

### Card Surface Class

```css
.card-surface {
  background: var(--card-bg);       /* #ffffff */
  border-radius: 20px;
  box-shadow: var(--card-shadow);
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.card-surface-nested {
  background: var(--background);    /* #f5f5f5 */
  border-radius: 20px;
  box-shadow: var(--card-shadow);
}
```

### Pill Shadow (Lighter variant)

For floating labels and badges:

```tsx
const pillShadow =
  "0px 0.7px 0.7px -0.67px rgba(0,0,0,0.08), " +
  "0px 1.8px 1.8px -1.33px rgba(0,0,0,0.08), " +
  "0px 3.6px 3.6px -2px rgba(0,0,0,0.07), " +
  "0px 6.9px 6.9px -2.67px rgba(0,0,0,0.07), " +
  "inset 0px 2px 1px 0px rgba(255,255,255,1)";
```

### Inset Shadows (Clock inner ring)

For sunken/pressed elements:

```tsx
boxShadow: "inset 2px 2px 5px rgba(0,0,0,0.06), inset -2px -2px 5px rgba(255,255,255,0.8)"
```

---

## 2. Glassmorphism

### EyebrowBadge
**File:** `src/components/ui/EyebrowBadge.tsx`

```tsx
<span className="
  inline-flex items-center gap-2
  rounded-full
  border border-white/60
  bg-white/40
  px-3 py-1.5
  text-[10px] font-medium tracking-wider text-zinc-500 uppercase
  shadow-sm
  backdrop-blur-md
">
```

### Navbar — Light Mode

```tsx
bg-white/40 backdrop-blur-2xl backdrop-saturate-150 border-white/30
```

### Navbar — Dark Mode (over dark sections)

```tsx
bg-black/70 backdrop-blur-xl border-white/15
```

### Project Cards (Dark glass)

```tsx
bg-black/50 backdrop-blur-2xl border border-white/10
```

---

## 3. Color Palette

### Core Colors (CSS Variables)

| Variable | Value | Usage |
|----------|-------|-------|
| `--background` | `#f5f5f5` | Page background |
| `--foreground` | `#09090b` | Primary text |
| `--muted` | `#71717a` | Secondary text |
| `--card-bg` | `#ffffff` | Card backgrounds |

### Zinc Scale (Primary Neutral)

| Class | Usage |
|-------|-------|
| `zinc-950` (#09090b) | Headings, primary buttons |
| `zinc-900` | Dark backgrounds |
| `zinc-800` | Button hover |
| `zinc-700` | Secondary elements |
| `zinc-600` | Body text |
| `zinc-500` | Muted text |
| `zinc-400` | Placeholder text, labels |
| `zinc-300` | Borders |
| `zinc-200` | Light borders |
| `zinc-100` | Subtle backgrounds |
| `zinc-50` | Lightest backgrounds |

### Accent Colors

| Color | Usage |
|-------|-------|
| `indigo-500` (#6366f1) | Primary accent, stats, badges |
| `violet-500` (#8b5cf6) | Gradient endpoints |
| `amber-400` | Star ratings |

### Gradient Pattern

```tsx
bg-gradient-to-r from-indigo-500 to-violet-500
```

Used in: scroll progress bar, loading bar

---

## 4. Typography

### Font Stack

```css
font-family: var(--font-geist-sans), system-ui, sans-serif;
-webkit-font-smoothing: antialiased;
-moz-osx-font-smoothing: grayscale;
```

### Heading Scale

| Element | Classes |
|---------|---------|
| H1 (Hero) | `text-4xl md:text-6xl lg:text-7xl font-semibold leading-[1.05] tracking-tighter` |
| H2 (Sections) | `text-3xl md:text-5xl font-semibold tracking-tighter` |
| H3 (Cards) | `text-lg font-semibold tracking-tight` |
| Body | `text-lg leading-relaxed` |
| Small | `text-sm leading-relaxed` |
| Eyebrow | `text-[10px] font-medium tracking-wider uppercase` |
| Mono | `font-mono text-xs font-semibold` |

### Max-Width Constraints

- Headings: `max-w-[18ch]` to `max-w-[22ch]`
- Body text: `max-w-[48ch]` to `max-w-[55ch]`
- Containers: `max-w-[1400px]`

---

## 5. Spacing & Layout

### Section Spacing

```tsx
className="px-6 py-24 md:px-8 md:py-32"
```

### Container

```tsx
className="mx-auto max-w-[1400px]"
```

### Card Padding

```tsx
className="p-7"          // standard
className="p-6"          // compact
className="max-md:p-4"   // mobile override
```

### Grid Patterns

```tsx
// Equal columns
grid-cols-1 md:grid-cols-3 gap-5

// Asymmetric (used in BentoFeatures)
grid-cols-1 md:grid-cols-[2fr_3fr] gap-5   // narrow | wide
grid-cols-1 md:grid-cols-[3fr_2fr] gap-5   // wide | narrow
```

### Border Radius

| Element | Radius |
|---------|--------|
| Cards | `rounded-[20px]` or `rounded-2xl` |
| Buttons | `rounded-2xl` |
| Badges/Pills | `rounded-full` |
| Inner containers | `rounded-xl` or `rounded-lg` |

---

## 6. Responsive Strategy

- **Mobile-first:** Base styles target mobile
- **Breakpoints:** `md:` (768px), `lg:` (1024px) for overrides
- **Max-width prefixes:** `max-md:` for mobile-only styles
- **Key mobile adjustments:**
  - Canvas zoom: 1.3x on mobile
  - Scroll section height: 400vh → 350vh → 300vh
  - Card padding: p-7 → p-4
  - Typography scale: text-4xl → text-6xl/7xl on desktop
