# DESIGN.md - "NepAI" Electrical Monitoring System

## 1. Visual Theme & Atmosphere
The design should convey **technical reliability** and **control**. It should not feel like a social network or a gaming app. The interface is intended to be viewed on a laptop or tablet in a home or small business environment in Nepal. The environment is similar to a Power BI Dashboard but simplified for the end user.

## 2. Color Palette
- **Primary Background:** `#121212` (Dark Mode for visual efficiency and data highlighting).

- **Card Surface:** `#1E1E1E`.

- **Primary Accent (Data):** `#00E5FF` (Cyan/Neon) for graphs, main KPIs, and action buttons.

- **Alert Accent:** `#FF453A` (Red) for consumption spikes or "vampire" alerts.
- **Secondary Accent:** `#32D74B` (Lime Green) for "Live" status or normal values.

- **Primary Text:** `#FFFFFF` (High Contrast).

- **Secondary Text:** `#98989D` (Gray for labels).

## 3. Component Stylings
- **Cards:** `border-radius: 16px`. Background `#1E1E1E`. Internal padding of `20px`. Subtle border: `1px solid #2C2C2E`.

- **Charts:** Grid lines in `#2C2C2E`. Data in `#00E5FF` with `#30D158` for area gradients. No thick border lines.

- **Tables:** Rows with `border-bottom: 1px solid #2C2C2E`. Hovering over a row changes the background to `#252525`.

- **Alerts:** Box with background `#3A1C1C`, red text `#FF453A`, and a left border of `4px solid #FF453A`.

## 4. Typography
- **Titles:** Inter, Semi Bold, 24px.

- **KPI Metrics (Watts, kWh, Bs):** JetBrains Mono or Fira Code (Monospace font for numbers), Bold, 32px.

- **Body:** Inter Regular, 14px.

## 5. Layout Principles
- **Grid:** 12 columns.

- **Spacing:** Multiples of 8px (8px, 16px, 24px, 32px).

- **Dashboard:** 3-column view (KPI, KPI, KPI) at the top, main chart spanning 8 columns, alert panel spanning 4 columns on the right side.

## 6. Do's and Don'ts
- ✅ **Do:** Use area charts to smooth out consumption spikes.

- ✅ **Do:** Always include the equivalent in Bolivianos (`Bs.`) next to the kWh.

- ❌ **Don't:** Use pastel colors or white backgrounds (they make it difficult to read data for extended periods).

- ❌ **Don't:** Use generic "light bulb" icons. Use "lightning bolt," "plug," or "meter" icons instead.