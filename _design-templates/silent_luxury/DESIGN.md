---
name: Silent Luxury
colors:
  surface: '#141313'
  surface-dim: '#141313'
  surface-bright: '#3a3939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2b2a2a'
  surface-container-highest: '#353434'
  on-surface: '#e5e2e1'
  on-surface-variant: '#c4c7c7'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#8e9192'
  outline-variant: '#444748'
  surface-tint: '#c9c6c5'
  primary: '#c9c6c5'
  on-primary: '#313030'
  primary-container: '#0a0a0a'
  on-primary-container: '#7b7979'
  inverse-primary: '#5f5e5e'
  secondary: '#e9c176'
  on-secondary: '#412d00'
  secondary-container: '#604403'
  on-secondary-container: '#dab36a'
  tertiary: '#c8c6c6'
  on-tertiary: '#303030'
  tertiary-container: '#0a0a0a'
  on-tertiary-container: '#7a7979'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e5e2e1'
  primary-fixed-dim: '#c9c6c5'
  on-primary-fixed: '#1c1b1b'
  on-primary-fixed-variant: '#474646'
  secondary-fixed: '#ffdea5'
  secondary-fixed-dim: '#e9c176'
  on-secondary-fixed: '#261900'
  on-secondary-fixed-variant: '#5d4201'
  tertiary-fixed: '#e4e2e1'
  tertiary-fixed-dim: '#c8c6c6'
  on-tertiary-fixed: '#1b1c1c'
  on-tertiary-fixed-variant: '#474747'
  background: '#141313'
  on-background: '#e5e2e1'
  surface-variant: '#353434'
typography:
  display-lg:
    fontFamily: Playfair Display
    fontSize: 48px
    fontWeight: '600'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '500'
    lineHeight: '1.2'
  headline-sm:
    fontFamily: Playfair Display
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.03em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1280px
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 20px
  section-gap: 120px
---

## Brand & Style
The design system is built upon the concept of "Silent Luxury"—an aesthetic that prioritizes quiet confidence over loud branding. It caters to a discerning clientele who value punctuality, discretion, and effortless elegance. 

The visual direction is **Minimalist with Tactile accents**. It leverages generous whitespace to create a sense of breathing room and exclusivity, reminiscent of a high-end editorial layout. The interface avoids unnecessary ornamentation, allowing high-quality photography of leather interiors and cityscapes to provide the primary visual texture. The emotional response should be one of immediate calm, safety, and uncompromising quality.

## Colors
The palette is rooted in a **Deep Dark** mode to evoke the feeling of a limousine’s tinted windows and premium leather. 

- **Primary (Midnight Black):** Used for the deepest backgrounds and foundation layers.
- **Accent (Champagne Gold):** Reserved for critical interactions, luxury indicators, and subtle highlights. Use sparingly to maintain its value.
- **Secondary (Slate Gray):** Used for secondary surfaces, borders, and inactive states to provide depth without breaking the dark aesthetic.
- **Status Colors:** These are intentionally desaturated and deep (Emerald and Ruby) to ensure they do not clash with the sophisticated gold and black tones.

## Typography
The typographic scale establishes a high-contrast hierarchy. **Playfair Display** provides the "Editorial" voice, used for titles and high-level headings to convey heritage and sophistication. **Inter** handles all functional data, ensuring that travel details, prices, and logistical information are legible at a glance.

For labels and small headers, use uppercase Inter with increased letter spacing to create a sense of modern architectural precision. Body text should maintain a generous line height to enhance readability on dark backgrounds.

## Layout & Spacing
This design system utilizes a **Fixed Grid** for desktop to maintain a controlled, gallery-like experience. The layout is built on an 8px base unit.

- **Desktop:** 12-column grid with wide 64px margins to "frame" the content.
- **Mobile:** 4-column grid with 20px margins. 
- **Rhythm:** Use large vertical gaps (`section-gap`) between content blocks to signal a change in topic without the need for heavy dividers. Padding within cards and containers should be generous (minimum 32px) to reinforce the premium feel of "space."

## Elevation & Depth
Depth is communicated through **Tonal Layering** and soft, ambient shadows. 

1. **Base:** Midnight Black (#0A0A0A).
2. **Cards/Surfaces:** Slate Gray (#1A1A1A) with a very subtle 1px border in #2D2D2D.
3. **Shadows:** Use large, diffused shadows with a slight color tint (0, 0, 0, 0.4) to lift active elements.
4. **Interactions:** Use subtle Champagne Gold inner-glows or outer-glows for focused states, mimicking the way light catches on metallic hardware. Avoid harsh blurs; keep gradients extremely smooth and linear.

## Shapes
The shape language is **Refined and Soft**. Elements use a 12px (`rounded-lg`) standard to balance the sharpness of the serif typography. 

- **Primary Buttons:** High-roundedness (Pill) for a friendly yet premium touch.
- **Containers/Cards:** 12px or 16px radius to suggest comfort.
- **Images:** Always slightly rounded to prevent the layout from feeling too aggressive or "brutalist."

## Components
- **Buttons:** The primary action button is a Champagne Gold fill with Midnight Black text. Use a subtle linear gradient (top-to-bottom) to give it a slight metallic sheen. Secondary buttons should be outlined in Slate Gray.
- **Inputs:** Fields should have a dark background (#1A1A1A) with a 1px Slate Gray border that turns Gold on focus. Use a serif font for the input value to maintain the luxury feel.
- **Cards:** Use cards for vehicle selection and trip summaries. Include a subtle glassmorphism effect (backdrop-blur) on mobile navigation bars to suggest depth.
- **Chips/Badges:** Small, uppercase labels for vehicle classes (e.g., "FIRST CLASS", "BUSINESS"). Use a light gold border with low-opacity gold fill.
- **Lists:** Vehicle lists should feature high-quality side-profile imagery with ample spacing between rows. No harsh dividers; use tonal shifts to separate items.
- **Interactive Map:** On booking screens, the map should use a custom dark-themed style (monochrome) with Champagne Gold markers.