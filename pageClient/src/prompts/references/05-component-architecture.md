# 05 — Component Architecture

How the project is organized, and the patterns that make it maintainable.

---

## Project Structure

```
src/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Root layout — fonts, providers, metadata
│   ├── page.tsx                # Home page — composes all sections
│   ├── globals.css             # Design tokens, utility classes
│   ├── robots.ts               # SEO robots config
│   └── sitemap.ts              # SEO sitemap
├── components/
│   ├── sections/               # Full-page sections
│   │   ├── Hero.tsx            # Canvas frame-sequence scroll animation
│   │   ├── CoreServices.tsx    # 3-card service grid
│   │   ├── ProjectsShowcase.tsx# Tunnel animation with project cards
│   │   ├── BentoFeatures.tsx   # Feature grid with neumorphic visuals
│   │   ├── ProcessMethodology.tsx # 3-step process
│   │   ├── TestimonialsStats.tsx  # Social proof
│   │   ├── FAQ.tsx             # Accordion
│   │   ├── FinalCTA.tsx        # CTA with CPU animation
│   │   ├── Footer.tsx          # Footer
│   │   └── FAQSchema.tsx       # JSON-LD structured data
│   ├── ui/                     # Reusable primitives
│   │   ├── AnimatedSection.tsx # Scroll-triggered animation wrapper
│   │   ├── Button.tsx          # Primary/secondary button
│   │   ├── EyebrowBadge.tsx    # Section label badge
│   │   ├── Navbar.tsx          # Fixed header with scroll detection
│   │   ├── CalendlyModal.tsx   # Booking modal with context provider
│   │   ├── CpuArchitecture.tsx # Animated SVG circuit graphic
│   │   └── NeumorphicAssets.tsx # 3 neumorphic animation components
│   └── providers/
│       └── SmoothScrollProvider.tsx # Lenis smooth scroll wrapper
└── lib/
    └── calendly.ts             # Calendly URL constant
```

---

## Page Composition Pattern

The home page is just a composition of section components — no logic:

```tsx
// src/app/page.tsx
export default function Home() {
  return (
    <>
      <FAQSchema />
      <Navbar />
      <Hero />
      <CoreServices />
      <ProjectsShowcase />
      <BentoFeatures />
      <ProcessMethodology />
      <TestimonialsStats />
      <FAQ />
      <FinalCTA />
      <Footer />
    </>
  );
}
```

Each section is self-contained — it manages its own state, animations, and layout.

---

## Reusable UI Components

### AnimatedSection + AnimatedItem

The scroll-reveal building blocks. Wrap any content in these to get automatic fade-up animation on scroll:

```tsx
<AnimatedSection className="grid grid-cols-3 gap-5">
  <AnimatedItem>Card 1</AnimatedItem>
  <AnimatedItem>Card 2</AnimatedItem>
  <AnimatedItem>Card 3</AnimatedItem>
</AnimatedSection>
```

Children animate in sequence with 0.1s stagger delay.

### Button

Two variants, works as `<a>` or `<button>`:

```tsx
// Primary (dark) — navigates
<Button href="/contact" showArrow>Contact Us</Button>

// Secondary (light) — action
<Button variant="secondary" onClick={handleClick}>Learn More</Button>
```

### EyebrowBadge

Glassmorphic label used above every section heading:

```tsx
<EyebrowBadge>Our Services</EyebrowBadge>
```

---

## Provider Pattern

### Root Layout Providers

```tsx
// src/app/layout.tsx
<SmoothScrollProvider>
  <CalendlyProvider>
    {children}
  </CalendlyProvider>
</SmoothScrollProvider>
```

Both providers wrap the entire app, making their features available to every page.

### SmoothScrollProvider

Wraps the app with Lenis for physics-based smooth scroll:

```tsx
<ReactLenis root options={options}>
  {children}
</ReactLenis>
```

Safari-specific configuration avoids known iOS stutter issues.

### CalendlyProvider

React Context that provides a global `open()` method:

```tsx
// Any component can open the modal:
const { open } = useCalendly();
<Button onClick={open}>Book a Call</Button>
```

Features:
- Body scroll lock when modal is open
- Escape key to close
- Click-outside to close
- Iframe embed with customized appearance

---

## SSR Considerations

### "use client" Directive

Components that use browser APIs or React hooks must be marked:

```tsx
"use client";  // Required for:
// - useState, useEffect, useRef, useCallback
// - Framer Motion animations
// - window/document access
// - Event listeners
```

### Phosphor Icons — SSR vs Client

```tsx
// Server component (Footer.tsx — no "use client"):
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";

// Client component (everything else):
import { ArrowUpRight } from "@phosphor-icons/react";
```

The `/dist/ssr` path ensures icons render correctly during server-side rendering.

### Server Component for Metadata

Next.js requires metadata to be exported from server components:

```tsx
// page.tsx (server component — no "use client")
export const metadata: Metadata = {
  title: "...",
  description: "...",
};

// If the page needs client features, render a client component:
export default function Page() {
  return <ClientPageComponent />;
}
```

---

## Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Page sections | PascalCase, descriptive | `CoreServices`, `ProjectsShowcase` |
| UI components | PascalCase, generic | `Button`, `AnimatedSection` |
| Hooks | camelCase, `use` prefix | `useCalendly`, `useTypewriter` |
| CSS classes | kebab-case | `card-surface`, `scroll-animation` |
| Files | PascalCase for components | `Hero.tsx`, `Button.tsx` |
| Constants | UPPER_SNAKE | `FRAME_COUNT`, `HOLD_DURATION` |
