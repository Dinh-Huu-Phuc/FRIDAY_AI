# 01 — Tech Stack

## Core Framework

### Next.js 16.2.2
- **App Router** (not Pages Router) — all routes under `src/app/`
- Server Components by default; `"use client"` directive for interactive components
- Built-in `next/font/google` for font optimization
- `next/script` with `strategy="lazyOnload"` for third-party scripts

> **Important:** Next.js 16 has breaking changes from earlier versions. Always check `node_modules/next/dist/docs/` for the latest API reference before writing new pages.

### React 19.2.4
- Latest stable React with concurrent features
- Server and Client Component model
- `useCallback`, `useRef`, `useState`, `useEffect` for animation state management

---

## Styling

### Tailwind CSS v4
- Uses `@import "tailwindcss"` syntax (not the v3 `@tailwind` directives)
- Theme configuration via `@theme inline` block in `globals.css`
- CSS variables for design tokens (`--background`, `--foreground`, etc.)

```css
@import "tailwindcss";

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}
```

---

## Animation Libraries

### Framer Motion v12.38.0
The primary animation engine. Used for:
- Scroll-triggered section reveals (`whileInView`)
- Spring physics transitions
- Staggered children animations
- Infinite rotation/movement loops
- `AnimatePresence` for mount/unmount animations

### Lenis v1.3.21
Physics-based smooth scroll library:
- `ReactLenis` component wraps the entire app
- Safari-specific configuration to avoid iOS stutter
- Integrates seamlessly with scroll-based canvas animations

---

## UI Libraries

### Phosphor Icons (`@phosphor-icons/react` v2.1.10)
- SSR-safe imports: `@phosphor-icons/react/dist/ssr` for server components
- Regular imports for client components
- Used for arrow icons, navigation elements

### Geist Font (`geist` v1.7.0)
- `Geist` (sans-serif) — primary body font
- `Geist_Mono` — code/monospace font
- Loaded via `next/font/google` with CSS variable injection

```tsx
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
```

---

## Integrations

### Calendly
- Embedded via iframe in a custom modal (`CalendlyModal.tsx`)
- Widget script loaded with `strategy="lazyOnload"` to avoid blocking initial render
- URL configured in `src/lib/calendly.ts`
- Context provider pattern: any component can call `useCalendly().open()`

---

## Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `typescript` | ^5 | Type safety |
| `eslint` | ^9 | Code linting |
| `eslint-config-next` | 16.2.2 | Next.js ESLint rules |
| `@tailwindcss/postcss` | ^4 | PostCSS integration |
| `@types/react` | ^19 | React type definitions |
| `@types/node` | ^20 | Node.js type definitions |

---

## Package.json Scripts

```json
{
  "dev": "next dev",        // Start dev server
  "build": "next build",    // Production build
  "start": "next start",    // Start production server
  "lint": "eslint"           // Run linter
}
```
