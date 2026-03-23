# Worklytics Design Specification

## Exact Color Palette (from image)

### Background
- Main gradient: `linear-gradient(135deg, #5B8A8F 0%, #7FA5A8 100%)`
- Sidebar: `#4A7378`
- Sidebar hover: `#3E6166`

### Cards & UI
- Card background: `#FFFFFF`
- Card border radius: `20px`
- Card shadow: `0 4px 12px rgba(0, 0, 0, 0.08)`

### Colors
- Primary (Coral): `#FF9B8A`
- Secondary (Light Blue): `#A8D5E2`
- Success (Green): `#7BC9A6`
- Warning (Yellow): `#FFD88A`
- Danger (Red): `#FF8A8A`

### Text
- Primary text: `#2D3748`
- Secondary text: `#718096`
- Muted text: `#A0AEC0`
- White text: `#FFFFFF`

### Stat Card Colors
- Card 1 (Avg Hours): Light purple background `#E9D5FF`
- Card 2 (Remote): Light coral `#FFE5E0`
- Card 3 (Leave): Light blue `#D5E9FF`
- Card 4 (Celebrations): Light green `#D5FFE9`

## Typography
- Font: Inter
- Headings: 600-700 weight
- Body: 400-500 weight
- Small text: 12-14px
- Regular: 14-16px
- Large: 18-24px

## Spacing
- Card padding: 24px
- Section gap: 24px
- Element gap: 16px
- Tight gap: 8px

## Components

### Sidebar
- Width: 280px
- Background: #4A7378
- Logo area: 80px height
- Menu items: 48px height
- Active state: Lighter background + left border
- Icons: 20px size

### Stat Cards
- Height: 140px
- Icon size: 40px in colored circle
- Number: 32px, bold
- Label: 14px, medium
- Trend indicator: Small badge with arrow

### Tables
- Header: Light gray background
- Row height: 56px
- Hover: Very light gray
- Border: 1px solid #E2E8F0

### Buttons
- Primary: Coral gradient
- Secondary: White with border
- Height: 40px
- Padding: 12px 24px
- Border radius: 12px

## Layout Structure

```
┌─────────────────────────────────────────────────┐
│  Sidebar (280px)  │  Main Content              │
│                   │                             │
│  Logo             │  Top Bar (Search, Profile) │
│                   │                             │
│  Dashboard        │  Stat Cards (4 columns)    │
│  Analytic         │                             │
│  Payroll          │  Charts & Tables           │
│  Attendance       │                             │
│                   │                             │
│  User Guide       │                             │
│  FAQ              │                             │
│  Help Center      │                             │
│                   │                             │
│  Profile Card     │                             │
└─────────────────────────────────────────────────┘
```

## Key Features to Replicate
1. Gradient background
2. Rounded sidebar with menu
3. 4 stat cards with colored backgrounds
4. Heatmap-style work rhythm chart
5. Horizontal bar chart for departments
6. Employee list table
7. Today's schedule list
8. Profile card at bottom of sidebar

