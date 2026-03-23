# Design Document: Skeleton Loading Replacement

## Overview

This design document outlines the implementation of a modern skeleton loading system to replace the current ECG heartbeat animation throughout the RCMC EMR application. Skeleton loaders provide superior user experience by displaying content placeholders that match the actual UI structure, giving users a preview of what's loading and improving perceived performance.

### Goals

- Replace all 12+ HeartbeatLoader instances with contextually appropriate skeleton loaders
- Create a reusable, variant-based SkeletonLoader component
- Implement performant CSS-based shimmer animations
- Maintain accessibility standards (ARIA attributes, screen reader support)
- Clean up legacy CSS animations and component files

### Non-Goals

- Modifying the actual data fetching logic or loading times
- Implementing progressive loading or lazy loading strategies
- Creating animated transitions between skeleton and actual content
- Supporting dark mode variants (can be added later)

## Architecture

### Component Structure

```
src/
├── components/
│   ├── SkeletonLoader.jsx          # Main skeleton loader component
│   └── HeartbeatLoader.jsx         # TO BE DELETED after migration
├── index.css                        # Shimmer animation styles
└── pages/                           # Pages using skeleton loaders
    ├── App.jsx
    ├── Dashboard.jsx
    ├── Appointments.jsx
    └── ... (other pages)
```

### Design Principles

1. **Variant-Based Architecture**: Single component with multiple layout variants
2. **Composition Over Configuration**: Variants compose smaller skeleton primitives
3. **Performance First**: CSS-only animations using GPU acceleration
4. **Accessibility Built-In**: ARIA attributes included by default
5. **Tailwind-Native**: Uses existing design system classes

## Components and Interfaces

### SkeletonLoader Component

**File**: `src/components/SkeletonLoader.jsx`

**Props Interface**:
```typescript
interface SkeletonLoaderProps {
  variant: 'table' | 'card' | 'list' | 'dashboard' | 'form' | 'stats' | 'auth'
  message?: string              // Optional loading message
  rows?: number                 // Number of rows for table/list variants
  columns?: number              // Number of columns for grid layouts
  className?: string            // Additional Tailwind classes
}
```

**Variant Descriptions**:

1. **`table`**: Displays skeleton rows with multiple columns
   - Used in: Appointments, Payments, Inventory, Lab Results
   - Structure: Header row + N data rows with column placeholders

2. **`card`**: Displays skeleton cards in a grid layout
   - Used in: Backup Management, Doctor profiles
   - Structure: Grid of rectangular cards with internal sections

3. **`list`**: Displays vertical list of skeleton items
   - Used in: Prescriptions, Orders, Patient modal sections
   - Structure: Stacked rectangular items with spacing

4. **`dashboard`**: Displays stat cards + chart placeholders
   - Used in: Dashboard page
   - Structure: 4 stat cards in grid + 2 chart areas below

5. **`form`**: Displays form field placeholders
   - Used in: Future form loading states
   - Structure: Label + input field pairs

6. **`stats`**: Displays stat card placeholders only
   - Used in: Stat-heavy sections
   - Structure: Grid of small stat cards

7. **`auth`**: Displays full-page skeleton with sidebar, topbar, and content
   - Used in: App.jsx authentication loading
   - Structure: Sidebar + TopBar + Main content area

### Skeleton Primitives

Internal building blocks used by variants:

```jsx
// Rectangle with shimmer
<SkeletonBox className="h-4 w-32" />

// Circle (for avatars)
<SkeletonCircle className="h-12 w-12" />

// Text line
<SkeletonText className="h-3 w-full" />

// Stat card
<SkeletonStatCard />

// Table row
<SkeletonTableRow columns={5} />
```

## Data Models

### CSS Animation Model

**Shimmer Animation**:
- Uses CSS `@keyframes` with `background-position` animation
- Linear gradient moves from left to right
- Duration: 1.5s for smooth, professional feel
- Timing: `ease-in-out` for natural motion

**Color Palette**:
- Base: `bg-slate-200` (#e2e8f0)
- Shimmer highlight: `bg-slate-50` (#f8fafc)
- Gradient: Creates subtle light sweep effect

### Variant Layout Models

**Table Variant**:
```
┌─────────────────────────────────────┐
│ [Header Row - 5 columns]            │
├─────────────────────────────────────┤
│ [Data Row 1 - 5 columns]            │
│ [Data Row 2 - 5 columns]            │
│ [Data Row 3 - 5 columns]            │
│ [Data Row 4 - 5 columns]            │
│ [Data Row 5 - 5 columns]            │
└─────────────────────────────────────┘
```

**Dashboard Variant**:
```
┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
│ Stat │ │ Stat │ │ Stat │ │ Stat │
│ Card │ │ Card │ │ Card │ │ Card │
└──────┘ └──────┘ └──────┘ └──────┘

┌─────────────────┐ ┌─────────────────┐
│                 │ │                 │
│  Chart Area 1   │ │  Chart Area 2   │
│                 │ │                 │
└─────────────────┘ └─────────────────┘
```

**Auth Variant** (Full Page):
```
┌────┬──────────────────────────────┐
│    │ [TopBar]                     │
│ S  ├──────────────────────────────┤
│ i  │                              │
│ d  │                              │
│ e  │     [Main Content Area]      │
│ b  │                              │
│ a  │                              │
│ r  │                              │
│    │                              │
└────┴──────────────────────────────┘
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

After analyzing all acceptance criteria, I've identified the following testable properties and examples. Many of the requirements are integration tests (testing specific pages) or code cleanup verification (file deletion, import removal), which are better suited as examples rather than universal properties.

**Key Properties** (universal rules):
- Variant prop determines layout rendering
- All skeleton elements have shimmer animation
- Accessibility attributes are always present
- Visual styling is consistent

**Examples** (specific scenarios):
- Each page integration (Dashboard, Appointments, etc.)
- Code cleanup verification (CSS removal, file deletion)
- Specific variant structure tests

**Redundancy Analysis**:
- Requirements 2.2, 3.5, 4.5, 5.5, 6.6, 7.4, 8.4, 9.4, 10.4, 11.3, 12.4 all test "HeartbeatLoader replacement" - these can be combined into a single verification
- Requirements about variant structure (3.2, 3.3, 4.2, 4.3, etc.) are specific examples, not universal properties
- Multiple requirements test "SHALL display X variant" - these are integration examples, not properties

### Property 1: Variant Prop Determines Layout

*For any* supported variant value ("table", "card", "list", "dashboard", "form", "stats", "auth"), the SkeletonLoader component should render successfully and produce distinct output for each variant.

**Validates: Requirements 1.1, 1.4**

### Property 2: Shimmer Animation Applied to All Elements

*For any* variant rendered by SkeletonLoader, all placeholder elements should include the shimmer animation CSS class.

**Validates: Requirements 1.3**

### Property 3: Consistent Visual Styling

*For any* variant rendered by SkeletonLoader, all placeholder rectangles should have gray background color (bg-slate-200) and rounded corners styling.

**Validates: Requirements 1.2**

### Property 4: Accessibility Attributes Present

*For any* SkeletonLoader instance, the root element should include all required accessibility attributes: aria-label, role="status", aria-live="polite", and aria-busy="true".

**Validates: Requirements 14.1, 14.2, 14.3, 14.4**

### Property 5: CSS-Only Animation Implementation

*For any* shimmer animation in the SkeletonLoader, the animation should be implemented using CSS (background-position or transform) without JavaScript-based animation code.

**Validates: Requirements 15.1, 15.2**

## Error Handling

### Component Error Boundaries

The SkeletonLoader component should handle invalid props gracefully:

1. **Invalid Variant**: If an unsupported variant is provided, default to "list" variant and log a warning
2. **Invalid Rows/Columns**: If negative or non-numeric values are provided, use sensible defaults (rows: 5, columns: 4)
3. **Rendering Errors**: Component should never throw errors that break the page; fallback to simple loading text

### Migration Error Prevention

During the migration from HeartbeatLoader to SkeletonLoader:

1. **Import Errors**: Ensure all HeartbeatLoader imports are removed to prevent unused import warnings
2. **CSS Conflicts**: Remove old heartbeat animations before adding shimmer animations to prevent style conflicts
3. **Prop Mismatches**: Verify all pages pass correct variant props to SkeletonLoader

### Accessibility Error Prevention

1. **Missing ARIA Labels**: Component should always include aria-label, even if message prop is not provided
2. **Screen Reader Announcements**: Ensure aria-live="polite" doesn't cause excessive announcements during rapid state changes

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests for comprehensive coverage:

**Unit Tests** focus on:
- Specific variant rendering (dashboard, table, card, etc.)
- Integration with specific pages (App.jsx, Dashboard.jsx, etc.)
- Code cleanup verification (CSS removal, file deletion)
- Edge cases (invalid props, missing props)

**Property Tests** focus on:
- Universal properties that hold for all variants
- Accessibility attributes across all instances
- Animation implementation consistency
- Visual styling consistency

### Unit Testing

**Framework**: Vitest + React Testing Library

**Test Files**:
- `src/tests/SkeletonLoader.test.jsx` - Component unit tests
- `src/tests/skeleton-migration.test.jsx` - Migration verification tests

**Unit Test Cases**:

1. **Variant Rendering Tests** (Examples)
   - Renders table variant with correct structure
   - Renders card variant with grid layout
   - Renders list variant with stacked items
   - Renders dashboard variant with stat cards and charts
   - Renders auth variant with sidebar, topbar, and content
   - Defaults to list variant for invalid variant prop

2. **Prop Handling Tests** (Examples)
   - Accepts custom message prop
   - Accepts custom rows prop for table variant
   - Accepts custom columns prop for grid layouts
   - Handles missing optional props with defaults

3. **Accessibility Tests** (Examples)
   - Includes aria-label attribute
   - Includes role="status" attribute
   - Includes aria-live="polite" attribute
   - Includes aria-busy="true" attribute
   - Message prop updates aria-label

4. **Integration Tests** (Examples)
   - App.jsx uses auth variant during initialization
   - Dashboard.jsx uses dashboard variant
   - Appointments.jsx uses table variant
   - Doctors.jsx uses card variant for main loading
   - Doctors.jsx uses list variant for feedback loading
   - Patients.jsx uses table variant for main loading
   - Patients.jsx uses list variant for modal sections

5. **Migration Verification Tests** (Examples)
   - HeartbeatLoader component file is deleted
   - HeartbeatLoader not imported in any page
   - @keyframes heartbeat-line removed from index.css
   - .heartbeat-line class removed from index.css
   - Other CSS animations preserved in index.css

6. **Visual Styling Tests** (Examples)
   - Skeleton elements have bg-slate-200 class
   - Skeleton elements have rounded corners
   - Shimmer animation class is applied

### Property-Based Testing

**Framework**: fast-check (JavaScript property-based testing library)

**Configuration**: Minimum 100 iterations per property test

**Property Test File**: `src/tests/SkeletonLoader.properties.test.jsx`

**Property Test Cases**:

1. **Property 1: Variant Prop Determines Layout**
   ```javascript
   // Feature: skeleton-loading-replacement, Property 1: For any supported variant value, 
   // the SkeletonLoader component should render successfully and produce distinct output
   fc.assert(
     fc.property(
       fc.constantFrom('table', 'card', 'list', 'dashboard', 'form', 'stats', 'auth'),
       (variant) => {
         const { container } = render(<SkeletonLoader variant={variant} />)
         // Should render without errors
         expect(container.firstChild).toBeTruthy()
         // Should have variant-specific structure
         return container.innerHTML.length > 0
       }
     ),
     { numRuns: 100 }
   )
   ```

2. **Property 2: Shimmer Animation Applied to All Elements**
   ```javascript
   // Feature: skeleton-loading-replacement, Property 2: For any variant rendered, 
   // all placeholder elements should include the shimmer animation CSS class
   fc.assert(
     fc.property(
       fc.constantFrom('table', 'card', 'list', 'dashboard', 'form', 'stats', 'auth'),
       (variant) => {
         const { container } = render(<SkeletonLoader variant={variant} />)
         const skeletonElements = container.querySelectorAll('[class*="animate-shimmer"]')
         // All skeleton elements should have shimmer animation
         return skeletonElements.length > 0
       }
     ),
     { numRuns: 100 }
   )
   ```

3. **Property 3: Consistent Visual Styling**
   ```javascript
   // Feature: skeleton-loading-replacement, Property 3: For any variant rendered, 
   // all placeholder rectangles should have gray background and rounded corners
   fc.assert(
     fc.property(
       fc.constantFrom('table', 'card', 'list', 'dashboard', 'form', 'stats', 'auth'),
       (variant) => {
         const { container } = render(<SkeletonLoader variant={variant} />)
         const skeletonElements = container.querySelectorAll('[class*="bg-slate-200"]')
         const roundedElements = container.querySelectorAll('[class*="rounded"]')
         // Should have styled elements
         return skeletonElements.length > 0 && roundedElements.length > 0
       }
     ),
     { numRuns: 100 }
   )
   ```

4. **Property 4: Accessibility Attributes Present**
   ```javascript
   // Feature: skeleton-loading-replacement, Property 4: For any SkeletonLoader instance, 
   // the root element should include all required accessibility attributes
   fc.assert(
     fc.property(
       fc.constantFrom('table', 'card', 'list', 'dashboard', 'form', 'stats', 'auth'),
       fc.string(),
       (variant, message) => {
         const { container } = render(<SkeletonLoader variant={variant} message={message} />)
         const root = container.firstChild
         // Should have all accessibility attributes
         return (
           root.hasAttribute('aria-label') &&
           root.getAttribute('role') === 'status' &&
           root.getAttribute('aria-live') === 'polite' &&
           root.getAttribute('aria-busy') === 'true'
         )
       }
     ),
     { numRuns: 100 }
   )
   ```

5. **Property 5: CSS-Only Animation Implementation**
   ```javascript
   // Feature: skeleton-loading-replacement, Property 5: For any shimmer animation, 
   // the animation should be implemented using CSS without JavaScript
   fc.assert(
     fc.property(
       fc.constantFrom('table', 'card', 'list', 'dashboard', 'form', 'stats', 'auth'),
       (variant) => {
         const { container } = render(<SkeletonLoader variant={variant} />)
         // Component should not use JavaScript animations (no inline styles with animation)
         const elementsWithInlineAnimation = Array.from(container.querySelectorAll('*'))
           .filter(el => el.style.animation !== '')
         return elementsWithInlineAnimation.length === 0
       }
     ),
     { numRuns: 100 }
   )
   ```

### Test Execution Strategy

1. **Development Phase**: Run unit tests on every file save
2. **Pre-Commit**: Run all unit tests and property tests
3. **CI/CD Pipeline**: Run full test suite including 100 iterations of property tests
4. **Manual Testing**: Visual verification of skeleton loaders in all pages

### Performance Testing

While not part of automated tests, manual performance verification should include:

1. **Render Time**: Use React DevTools Profiler to verify SkeletonLoader renders in < 16ms
2. **Animation Smoothness**: Visual verification that shimmer animation runs at 60fps
3. **Memory Usage**: Verify no memory leaks when skeleton loaders mount/unmount repeatedly

## Implementation Details

### Shimmer Animation CSS

```css
/* Shimmer animation for skeleton loaders */
@keyframes shimmer {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}

.animate-shimmer {
  animation: shimmer 1.5s ease-in-out infinite;
  background: linear-gradient(
    90deg,
    #e2e8f0 0%,
    #f8fafc 50%,
    #e2e8f0 100%
  );
  background-size: 1000px 100%;
  will-change: background-position;
}
```

### Component Implementation Approach

**Base Structure**:
```jsx
export default function SkeletonLoader({ 
  variant = 'list', 
  message = 'Loading...', 
  rows = 5,
  columns = 4,
  className = ''
}) {
  // Render appropriate variant
  const renderVariant = () => {
    switch (variant) {
      case 'table': return <TableSkeleton rows={rows} />
      case 'card': return <CardSkeleton columns={columns} />
      case 'list': return <ListSkeleton rows={rows} />
      case 'dashboard': return <DashboardSkeleton />
      case 'form': return <FormSkeleton rows={rows} />
      case 'stats': return <StatsSkeleton columns={columns} />
      case 'auth': return <AuthSkeleton />
      default: 
        console.warn(`Unknown variant: ${variant}, defaulting to list`)
        return <ListSkeleton rows={rows} />
    }
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={message}
      className={className}
    >
      {renderVariant()}
    </div>
  )
}
```

### Migration Strategy

**Phase 1: Create SkeletonLoader Component**
1. Create `src/components/SkeletonLoader.jsx`
2. Add shimmer animation to `src/index.css`
3. Write unit tests and property tests
4. Verify component works in isolation

**Phase 2: Replace HeartbeatLoader Instances**
1. Start with App.jsx (auth variant)
2. Replace Dashboard.jsx (dashboard variant)
3. Replace table-based pages (Appointments, Payments, Inventory, Lab Results)
4. Replace card/list-based pages (Doctors, Prescriptions, Orders)
5. Replace Patients.jsx (multiple variants)
6. Replace BackupManagement.jsx (card variant)

**Phase 3: Cleanup**
1. Delete `src/components/HeartbeatLoader.jsx`
2. Remove heartbeat animation CSS from `src/index.css`
3. Verify no broken imports
4. Run full test suite

### Performance Optimization

1. **GPU Acceleration**: Use `background-position` animation which is GPU-accelerated
2. **Will-Change**: Apply `will-change: background-position` only to animating elements
3. **Avoid Layout Thrashing**: Use fixed heights where possible to prevent layout recalculation
4. **Memoization**: Consider memoizing variant components if re-renders are frequent

### Accessibility Implementation

1. **ARIA Labels**: Provide descriptive labels like "Loading appointments data"
2. **Screen Reader Announcements**: Use `aria-live="polite"` to avoid interrupting users
3. **Busy State**: Include `aria-busy="true"` to indicate loading state
4. **Focus Management**: Ensure focus is not trapped in skeleton loader

## Deployment Considerations

### Browser Compatibility

- **CSS Animations**: Supported in all modern browsers (Chrome, Firefox, Safari, Edge)
- **CSS Grid**: Used for layout, supported in all modern browsers
- **Tailwind Classes**: No compatibility issues

### Performance Impact

- **Bundle Size**: SkeletonLoader adds ~2KB to bundle (smaller than HeartbeatLoader with SVG)
- **Runtime Performance**: CSS animations are more performant than SVG animations
- **Initial Load**: No impact, component is code-split with pages

### Rollback Plan

If issues arise after deployment:

1. **Quick Rollback**: Revert to HeartbeatLoader by restoring deleted files
2. **Partial Rollback**: Keep SkeletonLoader but revert specific pages
3. **CSS Fallback**: If shimmer animation causes issues, remove animation and keep static skeletons

## Future Enhancements

1. **Dark Mode Support**: Add dark mode variants with different color palette
2. **Custom Themes**: Allow theme customization via props or context
3. **Progressive Loading**: Implement staggered animation for skeleton elements
4. **Skeleton Matching**: Auto-generate skeleton structure from actual component structure
5. **Animation Variants**: Support different animation styles (pulse, wave, fade)

