# Payroll System - New Design Plan

## Design Changes

### Color Palette
- **Primary:** Teal (#14b8a6) - Main brand color
- **Accent:** Blue (#3b82f6) - Secondary actions
- **Neutral:** Gray scale for text and backgrounds
- **Background:** Soft gradient (neutral-50 → primary-50 → accent-50)

### Key Changes
1. ✅ Remove dark/light mode toggle
2. ✅ New teal/blue color scheme
3. ✅ Gradient background
4. ✅ Modern card-based layout
5. ✅ Rounded corners (2xl = 16px)
6. ✅ Subtle shadows
7. ✅ Clean, professional look

### Files to Update
1. ✅ `tailwind.config.js` - New color palette
2. ✅ `src/index.css` - New component styles
3. ⏳ `src/context/ThemeContext.jsx` - DELETE (no longer needed)
4. ⏳ `src/main.jsx` - Remove ThemeProvider
5. ⏳ `src/App.jsx` - Remove useTheme, update styling
6. ⏳ `src/components/Sidebar.jsx` - New design, remove theme toggle
7. ⏳ `src/components/StatCard.jsx` - New card design
8. ⏳ `src/pages/Dashboard.jsx` - Update colors and styling
9. ⏳ `src/pages/Employees.jsx` - Update colors and styling
10. ⏳ `src/pages/Payroll.jsx` - Update colors and styling
11. ⏳ `src/pages/PayslipHistory.jsx` - Update colors and styling
12. ⏳ `src/pages/Reports.jsx` - Update colors and styling
13. ⏳ `src/pages/Settings.jsx` - Remove theme toggle, update styling

### What Stays the Same
- ✅ All functionality and formulas
- ✅ Database structure
- ✅ Component logic
- ✅ Routing
- ✅ Data flow

### Design Inspiration
- Worklytics dashboard style
- Clean, modern SaaS interface
- Card-based layout
- Teal/blue professional color scheme
- Soft gradients and shadows

## Next Steps
1. Remove ThemeContext
2. Update Sidebar with new design
3. Update all pages with new styling
4. Test all functionality
5. Push to GitHub

