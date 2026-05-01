**---
name: Obsidian Flux
colors:
  surface: '#141313'
  surface-dim: '#141313'
  surface-bright: '#3a3939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353434'
  on-surface: '#e5e2e1'
  on-surface-variant: '#c4c7c8'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#8e9192'
  outline-variant: '#444748'
  surface-tint: '#c6c6c7'
  primary: '#ffffff'
  on-primary: '#2f3131'
  primary-container: '#e2e2e2'
  on-primary-container: '#636565'
  inverse-primary: '#5d5f5f'
  secondary: '#c6c6cf'
  on-secondary: '#2f3037'
  secondary-container: '#45464e'
  on-secondary-container: '#b4b4bd'
  tertiary: '#ffffff'
  on-tertiary: '#2f3131'
  tertiary-container: '#e2e2e2'
  on-tertiary-container: '#636565'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e2e2e2'
  primary-fixed-dim: '#c6c6c7'
  on-primary-fixed: '#1a1c1c'
  on-primary-fixed-variant: '#454747'
  secondary-fixed: '#e2e1eb'
  secondary-fixed-dim: '#c6c6cf'
  on-secondary-fixed: '#1a1b22'
  on-secondary-fixed-variant: '#45464e'
  tertiary-fixed: '#e2e2e2'
  tertiary-fixed-dim: '#c6c6c7'
  on-tertiary-fixed: '#1a1c1c'
  on-tertiary-fixed-variant: '#454747'
  background: '#141313'
  on-background: '#e5e2e1'
  surface-variant: '#353434'
typography:
  h1:
    fontFamily: General Sans
    fontSize: 80px
    fontWeight: '600'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  h2:
    fontFamily: General Sans
    fontSize: 48px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.03em
  h3:
    fontFamily: General Sans
    fontSize: 32px
    fontWeight: '500'
    lineHeight: '1.3'
    letterSpacing: -0.02em
  body-lg:
    fontFamily: General Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: 0em
  body-md:
    fontFamily: General Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: 0em
  label-caps:
    fontFamily: General Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.1em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  base: 8px
  container-max: 1280px
  gutter: 24px
  section-padding: 120px
---

## Brand & Style

This design system is engineered for the high-stakes environment of Web3, prioritizing speed, security, and elite performance. The brand personality is "Technological Minimalist"—it is silent, powerful, and devoid of unnecessary decoration. 

The aesthetic blends **Minimalism** with **Glassmorphism**, utilizing extreme contrast between a pure black void and luminous white elements. The emotional response is one of "Atmospheric Precision," where the interface feels like a premium piece of hardware. Motion should be snappy and linear, reflecting the real-time nature of blockchain transactions.

## Colors

The palette is strictly monochromatic to maintain a high-performance, executive feel. 

- **Base:** The primary canvas is absolute `#000000` to maximize OLED contrast and reduce visual noise.
- **Primary Text:** Use pure `#FFFFFF` for maximum legibility and impact.
- **Secondary/Supporting:** Zinc and Grey tones (`#A1A1AA`) are used for metadata, inactive states, and descriptions to create a clear visual hierarchy.
- **Atmospheric Glow:** A specialized "Glow" token is used for interactive states, employing a soft white radial gradient at 20% opacity to simulate light emitting from behind hardware components.

## Typography

This design system utilizes **General Sans** for its geometric clarity and industrial character. 

Headlines use tight tracking and heavy weights to command attention, while body text maintains a generous line height for readability against the dark background. A specific "Label-Caps" style is used for small technical metadata, ensuring a structured, "dashboard" aesthetic. Avoid italics; the system relies on weight and size transitions to communicate importance.

## Layout & Spacing

The layout follows a **Fixed Grid** model for desktop, centered within a 1280px container to ensure a focused, cinematic experience. 

A strict 8px linear scale governs all margins and paddings. Sections are separated by significant vertical whitespace (120px+) to allow the glassmorphism and glow effects "room to breathe" without visual clutter. Use a 12-column grid for content blocks, with asymmetrical layouts preferred (e.g., 5-column text / 7-column visual) to evoke a modern, non-corporate feel.

## Elevation & Depth

Depth is not communicated through traditional drop shadows, but through **Tonal Layers** and **Glassmorphism**:

1.  **Level 0 (Background):** Pure `#000000`.
2.  **Level 1 (Cards/Sections):** Semi-transparent white (2% - 4% opacity) with a 20px backdrop blur and a 1px border at 10% white opacity.
3.  **Level 2 (Interactive/Floating):** Higher transparency (8% white) with 40px backdrop blur and a soft inner-glow effect on the top-left edge.

The goal is to make elements appear like polished obsidian or frosted glass floating in deep space.

## Shapes

The shape language is dominated by the **Pill** shape. While cards and containers use large radii (2rem+), primary action elements and badges use a fully rounded profile. This softness contrasts with the "hard" technical typography, creating a sophisticated balance between organic and industrial design.

## Components

- **Pill Buttons:** Fully rounded corners. Background is either solid white (primary) or transparent with a 1px white border (secondary). On hover, apply a `0px 0px 20px rgba(255,255,255,0.3)` outer glow.
- **Glassmorphism Badges:** Small, pill-shaped indicators for status (e.g., "Live," "Beta"). 10% white fill, 12px backdrop-blur, and a 1px stroke. 
- **Modern Navigation:** A floating "Island" style navbar that shrinks and increases its backdrop-blur as the user scrolls. Use 12px uppercase labels for menu items.
- **Input Fields:** Minimalist underlines or subtle glass containers. Focus state should trigger a subtle white "breathing" glow on the border.
- **Web3 Wallet Cards:** High-gloss surfaces with holographic-style gradients (white-to-grey) used sparingly to denote active wallet connections.
- **Connect Button:** Distinctive treatment with a constant, very faint pulse animation to signify the primary entry point to the dApp.**