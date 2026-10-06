---
name: Serene Context
colors:
  surface: '#f9f9ff'
  surface-dim: '#cfdaf1'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eeff'
  surface-container-high: '#dee8ff'
  surface-container-highest: '#d8e3fa'
  on-surface: '#111c2c'
  on-surface-variant: '#42474d'
  inverse-surface: '#263142'
  inverse-on-surface: '#ebf1ff'
  outline: '#73787d'
  outline-variant: '#c2c7cd'
  surface-tint: '#42627b'
  primary: '#001828'
  on-primary: '#ffffff'
  primary-container: '#062d44'
  on-primary-container: '#7595b0'
  inverse-primary: '#aacae7'
  secondary: '#735b27'
  on-secondary: '#ffffff'
  secondary-container: '#fddb9b'
  on-secondary-container: '#775f2b'
  tertiary: '#141718'
  on-tertiary: '#ffffff'
  tertiary-container: '#282b2c'
  on-tertiary-container: '#909293'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#cbe6ff'
  primary-fixed-dim: '#aacae7'
  on-primary-fixed: '#001e30'
  on-primary-fixed-variant: '#294a62'
  secondary-fixed: '#ffdea1'
  secondary-fixed-dim: '#e2c284'
  on-secondary-fixed: '#261900'
  on-secondary-fixed-variant: '#594311'
  tertiary-fixed: '#e1e3e4'
  tertiary-fixed-dim: '#c5c7c8'
  on-tertiary-fixed: '#191c1d'
  on-tertiary-fixed-variant: '#454748'
  background: '#f9f9ff'
  on-background: '#111c2c'
  surface-variant: '#d8e3fa'
typography:
  display-lg:
    fontFamily: Montserrat
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Montserrat
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Montserrat
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
  headline-md:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
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
  margin-desktop: 48px
---

## Brand & Style

This design system is built for a premium psychology clinic, emphasizing the intersection of clinical excellence and human empathy. The aesthetic follows a **Minimalist Corporate** approach, utilizing generous whitespace to provide a sense of mental "room to breathe" for the user. 

The brand personality is authoritative yet accessible. It avoids the coldness of traditional medical interfaces by incorporating warm gold accents and soft transitions. The goal is to evoke a feeling of safety, clarity, and progression. High-quality imagery focusing on nature and soft-focus human connection should be used to complement the clean UI.

## Colors

The palette is anchored by a deep **Primary Dark Blue (#062D44)**, which communicates stability and depth. The **Accent Gold (#B5985E)** is used sparingly for call-to-actions and key highlights to represent the "light" or insight gained through therapy.

- **Backgrounds:** Pure White (#FFFFFF) is the standard surface. A very light grey/blue Tertiary tint is used for subtle section differentiation.
- **Typography:** Primary Dark Blue is used for headings to maintain brand cohesion. Neutral grey-blue is used for body text to reduce eye strain and improve readability.
- **Semantic Colors:** Success, Error, and Warning states should be muted versions of standard signals (e.g., sage green, dusty rose) to stay within the calming aesthetic.

## Typography

The typography pairing balances the geometric authority of **Montserrat** for headlines with the modern, humanist warmth of **Manrope** for body text. 

- **Headlines:** Use Montserrat in semi-bold or bold weights. For the most premium sections (like hero titles), use tighter letter spacing to create a more "editorial" look.
- **Body:** Manrope is chosen for its exceptional legibility and friendly character. Line heights are kept generous (1.5x - 1.6x) to ensure the text feels inviting and easy to scan.
- **Labels:** Use Manrope with increased letter spacing and uppercase styling for small UI elements like category tags or overlines.

## Layout & Spacing

The design system employs a **Fluid Grid** with a strict 8px base unit. 

- **Desktop:** 12-column grid with a 1200px max-width container. Centralizing the content helps maintain focus.
- **Tablet:** 8-column grid with 32px side margins.
- **Mobile:** 4-column grid with 16px side margins.

Vertical rhythm is crucial; use larger spacing (80px - 120px) between major sections to prevent the UI from feeling cluttered, reinforcing the "minimalist" brand value.

## Elevation & Depth

To maintain a clean and professional appearance, this design system avoids heavy shadows. 

- **Surface Tiers:** Depth is primarily created through tonal layers. Use the Tertiary background color (#F8F9FA) to set apart secondary content modules from the main white background.
- **Soft Shadows:** Only used for interactive elements like floating cards or dropdown menus. These should be "Ambient Shadows": very light (5-10% opacity), wide blur radius (20px+), and slightly tinted with the Primary Blue to feel integrated into the environment.
- **Outlines:** Use 1px borders in a very light grey for input fields and non-elevated cards to maintain a structured, clinical feel without adding visual "weight."

## Shapes

The shape language is defined as **Rounded (Level 2)**. This strikes a balance between the precision of a professional institution and the approachability of a care provider.

- **Standard Elements:** Buttons and input fields use a 0.5rem (8px) corner radius.
- **Cards & Containers:** Use 1rem (16px) for larger surface areas.
- **Full Rounding:** Pill-shaped rounding is reserved exclusively for small "Status" chips or "New" badges to make them stand out from structural elements.

## Components

### Buttons
- **Primary:** Solid Primary Blue background with white text. High contrast for clear direction.
- **Secondary:** Accent Gold background with white text. Used for secondary goals or "soft" conversions.
- **Ghost:** Primary Blue border and text with a transparent background. Used for less urgent actions.

### Input Fields
- Inputs should have a 1px border in a light neutral shade. Upon focus, the border transitions to Accent Gold to provide a warm, encouraging feedback loop during data entry.

### Cards
- Use white backgrounds with a subtle 1px border or an extremely soft ambient shadow. Cards should have generous internal padding (min 24px) to avoid a cramped feeling.

### Specialized Components
- **Testimonial Blocks:** Use a larger font size for quotes with the Accent Gold used for the quotation mark icons.
- **Resource Chips:** Use low-saturation background tints (e.g., a very light version of the blue) for categorizing blog posts or therapy types.
- **Progress Steppers:** Use soft, rounded lines to indicate progress in booking flows, ensuring the user feels supported through the process.