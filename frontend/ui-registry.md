# NepAI Design System — Dark Terminal (DESIGN1.md)

## Palette

| Token | Dark | Light | Usage |
|-------|------|-------|-------|
| `dt-text` | `#E8E8E8` | `#0A0A0A` | Body text |
| `dt-meta` | `#7A7A7A` | `#7A7A7A` | Meta, labels |
| `dt-accent` | `#10B981` | `#10B981` | Emerald accent |
| `dt-accent-bright` | `#00FF88` | `#00FF88` | CTAs, links, gains |
| `dt-bg` | `#0A0A0A` | `#FAFAFA` | Page background |
| `dt-surface` | `#141414` | `#FFFFFF` | Cards, sidebar |
| `dt-border` | `#262626` | `#E0E0E0` | Borders |
| `dt-negative` | `#B91C1C` | `#B91C1C` | Errors, losses |

## Typography
- **Display / Mono:** JetBrains Mono — headings, nav, data, buttons
- **Body:** Inter — prose, form labels

## Components
- **Buttons:** Sharp 4px radius, uppercase, mono, hard-offset hover shadow
- **Cards:** 1px border, no soft shadows (hard offset on hover optional)
- **Tabs/Nav:** Boxed bordered style, active = emerald border + fill

## Charts
- Bullish: `#26A69A` | Bearish: `#EF5350` | Prediction: `#10B981`
- Gridlines on, terminal backgrounds

## Layout
- **Desktop sidebar:** `fixed` left, full viewport height
  - Top: brand (fixed)
  - Middle: nav (scrollable)
  - Bottom: theme toggle + user + logout (pinned to viewport bottom-left)
- **Main content:** `md:ml-60` offset for fixed sidebar
