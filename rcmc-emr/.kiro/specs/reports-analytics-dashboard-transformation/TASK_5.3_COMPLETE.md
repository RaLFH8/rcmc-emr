# Task 5.3 Complete: Add Menu to ExpenseBreakdownChart

## Summary

Successfully added a three-dot menu to the ExpenseBreakdownChart component with export and monthly filter functionality, following the same pattern as Tasks 5.1 (PatientDistributionChart) and 5.2 (RevenueTrendChart).

## Changes Made

### File Modified
- `rcmc-emr/src/components/analytics/ExpenseBreakdownChart.jsx`

### Features Implemented

1. **Three-Dot Menu Button**
   - Positioned in top-right corner of chart header
   - Uses `MoreVertical` icon from lucide-react
   - Includes proper ARIA labels for accessibility
   - Keyboard accessible (Tab, Enter, Space, Escape keys)

2. **Export Functionality**
   - Exports chart data to CSV format
   - Includes headers: Category, Amount, Percentage
   - Includes all expense categories sorted by amount
   - Adds total row at the bottom
   - Includes month filter information if active
   - Filename format: `Expense_Breakdown_YYYY-MM-DD.csv`
   - Downloads automatically via browser

3. **Monthly Filter Dropdown**
   - Shows last 12 months as filter options
   - "All Months" option to clear filter
   - Visual indication of currently selected month (teal background)
   - Scrollable list for better UX
   - Proper ARIA attributes (`role="menuitemradio"`, `aria-checked`)
   - Callback to parent component when month changes

4. **Accessibility Features**
   - ARIA labels: `aria-label`, `aria-expanded`, `aria-haspopup`
   - Menu role attributes: `role="menu"`, `role="menuitem"`, `role="menuitemradio"`
   - Keyboard navigation support (Enter, Space, Escape)
   - Focus management (returns focus to button on Escape)
   - Screen reader friendly

5. **User Experience**
   - Click outside menu to close
   - Smooth hover transitions
   - Focus ring indicators
   - Consistent styling with other chart menus
   - Menu closes automatically after action

## Implementation Details

### New Props Added
```javascript
selectedMonth: string | null  // Currently selected month (e.g., "2024-01")
onMonthChange: Function       // Callback when month filter changes
```

### State Management
```javascript
const [isMenuOpen, setIsMenuOpen] = useState(false)
const menuRef = useRef(null)
const buttonRef = useRef(null)
```

### Event Handlers
- `handleClickOutside`: Closes menu when clicking outside
- `handleKeyDown`: Handles Escape, Enter, and Space keys
- `handleExport`: Generates and downloads CSV file with expense data
- `generateMonthOptions`: Creates list of last 12 months for filter

### Menu Structure
```
Three-Dot Button
└── Dropdown Menu
    ├── Export Data (with Download icon)
    ├── Divider
    └── Filter by Month (with Calendar icon)
        ├── All Months
        ├── December 2024
        ├── November 2024
        └── ... (last 12 months)
```

### CSV Export Format
```csv
Category,Amount,Percentage
Staff Salaries & Benefits,500000.00,45.5%
Medical Supplies,300000.00,27.3%
Operational Costs,200000.00,18.2%
Pharmaceuticals,80000.00,7.3%
Miscellaneous,20000.00,1.8%
Total,1100000.00,100%
```

If month filter is active:
```csv
Month Filter,2024-12,

Category,Amount,Percentage
...
```

## Requirements Validated

✅ **Requirement 4.6**: Chart component includes three-dot menu for export and filter options
✅ **Requirement 4.6**: Monthly dropdown filter implemented
✅ Menu positioned in top-right corner of chart container
✅ Export functionality implemented for chart data
✅ Keyboard accessible with proper ARIA labels
✅ Follows same pattern as PatientDistributionChart and RevenueTrendChart

## Testing Recommendations

1. **Manual Testing**
   - Click three-dot menu button to open/close
   - Click "Export Data" to download CSV
   - Verify CSV contains correct data and formatting
   - Select different month filters
   - Verify chart updates when month changes (requires parent component integration)
   - Test "All Months" option to clear filter
   - Test keyboard navigation (Tab, Enter, Escape)
   - Test clicking outside menu to close

2. **Accessibility Testing**
   - Test with screen reader (NVDA, JAWS, VoiceOver)
   - Verify ARIA labels are announced correctly
   - Test keyboard-only navigation
   - Verify focus indicators are visible
   - Verify selected month is announced as "checked"

3. **Integration Testing**
   - Verify menu doesn't interfere with chart interactions
   - Test with different expense data sets
   - Verify export works with various category counts
   - Test month filter integration with parent component
   - Verify chart re-renders when month filter changes

4. **Edge Cases**
   - Test with empty data array
   - Test with single expense category
   - Test with very large expense values
   - Test menu positioning at screen edges
   - Test scrolling behavior with many months

## Next Steps

Task 5.3 is complete. The next tasks in the sequence are:
- Task 5.4: Add menu to PerformanceComparisonChart
- Task 5.5: Write unit tests for chart menus

## Notes

- The implementation maintains consistency with the PatientDistributionChart and RevenueTrendChart menu patterns
- The monthly filter requires parent component integration to actually filter the data
- The `onMonthChange` callback is optional - if not provided, the filter section won't be displayed
- Export functionality includes the month filter information in the CSV for context
- All accessibility requirements are met with proper ARIA attributes and keyboard navigation
- The month options are dynamically generated for the last 12 months from the current date

## Parent Component Integration Example

To use the monthly filter, the parent component should:

```javascript
const [selectedMonth, setSelectedMonth] = useState(null)

const handleMonthChange = (month) => {
  setSelectedMonth(month)
  // Fetch filtered expense data for the selected month
  // or filter existing data client-side
}

<ExpenseBreakdownChart
  data={expenseData}
  totalExpenses={total}
  previousPeriodTotal={previousTotal}
  selectedMonth={selectedMonth}
  onMonthChange={handleMonthChange}
/>
```
