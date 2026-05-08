---
name: Palayan Health Identity
colors:
  surface: '#f9f9ff'
  surface-dim: '#d9d9e2'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3fc'
  surface-container: '#ededf6'
  surface-container-high: '#e7e8f0'
  surface-container-highest: '#e1e2ea'
  on-surface: '#191c21'
  on-surface-variant: '#424752'
  inverse-surface: '#2e3037'
  inverse-on-surface: '#f0f0f9'
  outline: '#727784'
  outline-variant: '#c2c6d4'
  surface-tint: '#115cb9'
  primary: '#003f87'
  on-primary: '#ffffff'
  primary-container: '#0056b3'
  on-primary-container: '#bbd0ff'
  inverse-primary: '#acc7ff'
  secondary: '#54615a'
  on-secondary: '#ffffff'
  secondary-container: '#d8e6dc'
  on-secondary-container: '#5a6760'
  tertiary: '#722b00'
  on-tertiary: '#ffffff'
  tertiary-container: '#983c00'
  on-tertiary-container: '#ffc2a7'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d7e2ff'
  primary-fixed-dim: '#acc7ff'
  on-primary-fixed: '#001a40'
  on-primary-fixed-variant: '#004491'
  secondary-fixed: '#d8e6dc'
  secondary-fixed-dim: '#bccac0'
  on-secondary-fixed: '#121e18'
  on-secondary-fixed-variant: '#3d4a43'
  tertiary-fixed: '#ffdbcc'
  tertiary-fixed-dim: '#ffb694'
  on-tertiary-fixed: '#351000'
  on-tertiary-fixed-variant: '#7b2f00'
  background: '#f9f9ff'
  on-background: '#191c21'
  surface-variant: '#e1e2ea'
typography:
  h1:
    fontFamily: Public Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  h2:
    fontFamily: Public Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Public Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Public Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: Public Sans
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: 0.05em
  button:
    fontFamily: Public Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: '1'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 16px
  md: 24px
  lg: 32px
  xl: 48px
  gutter: 16px
  margin_mobile: 16px
  margin_desktop: 40px
---

## Brand & Style

The brand personality of the design system is anchored in **Official Trust** and **Universal Accessibility**. As a civic healthcare platform, the UI must feel authoritative yet welcoming to a diverse population, including non-technical users and the elderly. 

The aesthetic follows a **Modern Corporate** style influenced by the Ionic framework, prioritizing clarity and ease of navigation. It utilizes a spacious layout, high-contrast text for legibility, and a soft, rounded visual language to reduce the "clinical coldness" often associated with medical software. The emotional response should be one of reliability, efficiency, and care.

## Colors

The palette is designed for high legibility and institutional credibility. 
- **Primary Blue (#0056b3):** Used for primary actions, branding, and active navigation states. It provides the "Official" weight.
- **Secondary Mint (#e6f4ea):** Used for success states, backgrounds for highlighted health information, and subtle accents. It conveys a sense of wellness and health.
- **Slate Gray (#334155):** Chosen for text to provide high contrast against the white background while being softer on the eyes than pure black.
- **Clean White (#ffffff):** The primary surface color, maximizing whitespace to prevent cognitive overload.

## Typography

This design system utilizes **Public Sans**, a typeface specifically designed for government and institutional use. Its neutral, clean, and highly legible characteristics make it ideal for health records and administrative forms. 

Hierarchy is established through weight and size rather than color. Headlines are bold to guide the eye through document-heavy pages, while body text uses a generous line height (1.6) to ensure that medical instructions and data remain accessible to users with varying levels of literacy and visual acuity.

## Layout & Spacing

The design system employs a **Fluid Grid** system that adapts across device types:
- **Desktop:** A 12-column layout with a persistent **Left Sidebar** for navigation. This provides a clear overview of health card categories and settings.
- **Mobile:** A single-column layout with a **Bottom Navigation Bar**, placing essential actions within thumb's reach, following Ionic's mobile-first philosophy.

Spacing follows an 8px rhythmic scale. Cards and containers use 24px (md) internal padding to ensure content does not feel cramped, promoting a sense of "cleanliness" and organization.

## Elevation & Depth

The design system conveys hierarchy using **Ambient Shadows** and **Tonal Layers**. Instead of harsh borders, surfaces are differentiated by subtle depth:
- **Level 0 (Background):** Pure White (#ffffff).
- **Level 1 (Cards):** Soft, diffused shadows (0px 4px 12px rgba(0,0,0,0.05)) to lift content above the background.
- **Level 2 (Modals/Dropdowns):** Deeper shadows (0px 8px 24px rgba(0,0,0,0.1)) to indicate high-priority interaction.

Shadows are never pure black; they are tinted with the Primary Blue or Slate Gray to maintain a professional, cohesive appearance.

## Shapes

The shape language is defined by **Soft Roundedness**. Following the user's requirement, all primary cards must have a **12px border-radius**. 
- Buttons and input fields use a slightly smaller radius (8px) to maintain a crisp feel while remaining approachable. 
- Selection indicators and chips use "Pill" shapes (full rounding) to differentiate them from functional containers. 
This consistent use of rounded corners reduces visual tension, making the system feel more user-friendly and modern.

## Components

### Navigation
- **Sidebar (Desktop):** Icons and labels are stacked vertically. The active state is indicated by a primary blue vertical bar and a light blue background tint.
- **Bottom Nav (Mobile):** Four to five high-priority icons (Home, Health Card, Appointments, Profile).

### Cards & Data
- **Health Cards:** Use the 12px radius. Top-weighted with the Palayan City logo and user identification. Data points are presented in a 2-column grid.
- **Data Tables:** Clean, no-border design. Uses light gray dividers (#f1f5f9) and the Mint Green (#e6f4ea) for row highlights or "Active" status badges.

### Multi-Step Wizard
- A horizontal progress stepper at the top of forms. Completed steps use a checkmark icon in Mint Green; the current step is highlighted in Primary Blue. This breaks down complex health card applications into manageable chunks for non-technical users.

### Buttons & Inputs
- **Primary Button:** Solid #0056b3 with white text.
- **Secondary Button:** Outline #0056b3 or Mint background.
- **Inputs:** 8px radius with 1px slate-gray borders that thicken and turn blue on focus.

### Icons
- Use high-quality, thin-to-medium stroke healthcare icons (e.g., medical cross, heart, document, user-circle) to maintain a modern, professional look.