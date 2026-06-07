---
name: Luminous Editorial
colors:
  surface: '#faf9f6'
  surface-dim: '#dbdad7'
  surface-bright: '#faf9f6'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f3f0'
  surface-container: '#efeeeb'
  surface-container-high: '#e9e8e5'
  surface-container-highest: '#e3e2df'
  on-surface: '#1a1c1a'
  on-surface-variant: '#4e4639'
  inverse-surface: '#2f312f'
  inverse-on-surface: '#f2f1ee'
  outline: '#7f7667'
  outline-variant: '#d1c5b4'
  surface-tint: '#775a19'
  primary: '#775a19'
  on-primary: '#ffffff'
  primary-container: '#e9c176'
  on-primary-container: '#6a4e0c'
  inverse-primary: '#e9c176'
  secondary: '#5f5e5e'
  on-secondary: '#ffffff'
  secondary-container: '#e2dfde'
  on-secondary-container: '#636262'
  tertiary: '#5e5f5c'
  on-tertiary: '#ffffff'
  tertiary-container: '#c7c7c3'
  on-tertiary-container: '#525350'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdea5'
  primary-fixed-dim: '#e9c176'
  on-primary-fixed: '#261900'
  on-primary-fixed-variant: '#5d4200'
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1c1b1b'
  on-secondary-fixed-variant: '#474746'
  tertiary-fixed: '#e3e2df'
  tertiary-fixed-dim: '#c7c6c3'
  on-tertiary-fixed: '#1b1c1a'
  on-tertiary-fixed-variant: '#464744'
  background: '#faf9f6'
  on-background: '#1a1c1a'
  surface-variant: '#e3e2df'
typography:
  display-lg:
    fontFamily: Playfair Display
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-sm:
    fontFamily: Playfair Display
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: -0.01em
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.1em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1200px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 64px
---

## Brand & Style
This design system embodies the "Silent Luxury" aesthetic through a premium light-mode lens. The brand personality is sophisticated, restrained, and confident, targeting a high-net-worth audience that values clarity and intentionality. 

The visual style is **Minimalist-Luxury**, characterized by generous white space, high-contrast serif typography, and a "Paper-first" philosophy. The UI should feel like a high-end physical publication: tactile, breathable, and timeless. Depth is achieved not through heavy shadows, but through subtle tonal shifts and hairline strokes, ensuring an airy and expensive atmosphere.

## Colors
The palette is rooted in organic, warm neutrals to avoid the clinical feel of pure digital white. 

- **Foundation:** The base background is Pure White (#FFFFFF) to maximize brightness, while the primary surface for cards and containers is "Paper" (#F8F7F4).
- **Contrast:** Deep Charcoal (#1A1A1A) is used for all primary text and iconography. This provides high legibility while appearing softer and more "ink-like" than pure black.
- **Accents:** Muted Gold (#E9C176) serves as the singular "pop" color, reserved strictly for primary actions, success states, or premium highlights.
- **Divisions:** Hairline borders in #E5E4E0 replace shadows, creating structure without adding visual weight.

## Typography
The typographic hierarchy relies on the tension between the classic elegance of **Playfair Display** and the functional precision of **Inter**.

- **Headlines:** Use Playfair Display for all expressive headers. Tighten letter-spacing on larger sizes to maintain a "locked-in" editorial look.
- **Body:** Inter provides a neutral, highly readable counterpoint. Standard body text uses a generous 1.6x line-height to reinforce the airy brand feel.
- **Labels:** Use Inter in All-Caps with increased tracking (0.1em) for metadata, small labels, and overlines to create a sense of architectural structure.

## Layout & Spacing
The layout follows a **Fixed Grid** philosophy on desktop to mimic the margins of a luxury magazine, transitioning to a fluid model on mobile.

- **Rhythm:** An 8px base unit governs all spatial relationships.
- **Margins:** Large outer margins (64px+) on desktop focus the user's attention on the center-aligned content "stage."
- **Negative Space:** Whitespace is treated as an active design element. Do not crowd elements; if in doubt, double the padding between sections.

## Elevation & Depth
In this light-themed system, depth is achieved through **Tonal Layering** rather than shadows.

- **Level 0 (Background):** Pure White (#FFFFFF).
- **Level 1 (Containers/Cards):** Paper Gray (#F8F7F4).
- **Level 2 (In-set/Active):** Light Gray (#F3F2EE).
- **Details:** Use 1px hairline borders (#E5E4E0) to define edges. If a shadow is absolutely necessary for a floating menu, use an extremely diffused #1A1A1A shadow at 3% opacity with a 20px blur.

## Shapes
The shape language is "Tailored." A consistent **8px (0.5rem)** corner radius is applied to all primary UI elements (buttons, inputs, cards). This provides a soft, approachable feel that remains structured and professional. Smaller components like chips or badges may use a full-pill radius to distinguish them from structural elements.

## Components
- **Buttons:** Primary buttons use a solid Muted Gold (#E9C176) background with Deep Charcoal text. Secondary buttons use a Charcoal outline (1px) or a text-only style with All-Caps labels.
- **Inputs:** Text fields feature a #F8F7F4 background and a subtle bottom border or 1px hairline perimeter. Focus states are indicated by a gold-tinted border.
- **Cards:** Cards should have no shadow; instead, use the #F8F7F4 surface color against the #FFFFFF background.
- **Chips:** Small, pill-shaped elements with #F3F2EE backgrounds and 12px Inter medium text.
- **Lists:** Separated by horizontal hairlines (#E5E4E0). Avoid icons where typography alone can carry the weight.