# Implementation Plan: Payment Manual Item Entry

## Overview

All changes are self-contained in `rcmc-emr/src/pages/Payments.jsx`. A test file is created at `rcmc-emr/src/tests/payment-manual-item-entry.test.jsx`. No database migrations or new files are required.

## Tasks

- [ ] 1. Extend `currentItem` state and `Item_Type_Selector` with "Manual Entry" option
  - In `Payments.jsx`, add `type: 'manual'` support to the `currentItem` initial state (no structural change needed — `id` stays as `''` for manual items)
  - Add `<option value="manual">Manual Entry</option>` to the `Item_Type_Selector` `<select>` element
  - Update the `onChange` handler for the type selector so that switching to `"manual"` resets `currentItem` to `{ type: 'manual', id: '', name: '', price: '', quantity: 1 }` and clears `itemSearchTerm`; switching away from `"manual"` resets to `{ type: newType, id: '', name: '', price: '', quantity: 1 }` and clears `itemSearchTerm`
  - Add two boolean state variables: `manualNameTouched` (default `false`) and `manualPriceTouched` (default `false`); reset both to `false` whenever the item type changes
  - _Requirements: 1.1, 1.4_

- [ ] 2. Implement conditional rendering in the Item_Entry_Form
  - [ ] 2.1 Add the manual entry input branch
    - Wrap the existing autocomplete search input in a `currentItem.type !== 'manual'` condition so it only renders for service/inventory types
    - When `currentItem.type === 'manual'`, render a plain `<input type="text" placeholder="Item / service name..." />` bound to `currentItem.name`; on blur set `manualNameTouched = true`
    - When `currentItem.type === 'manual'`, render the price `<input type="number" min="0.01" step="0.01" />` immediately (not gated on `currentItem.id`); on blur set `manualPriceTouched = true`
    - Render inline validation `<p>` elements: show "Item name is required" when `manualNameTouched && !currentItem.name.trim()`; show "Price must be greater than zero" when `manualPriceTouched && !(parseFloat(currentItem.price) > 0)`
    - _Requirements: 1.2, 1.3, 2.3, 2.4_

  - [ ]* 2.2 Write property test for manual entry UI rendering (Property 1)
    - **Property 1: Manual entry UI renders correctly for any "manual" type selection**
    - **Validates: Requirements 1.2, 1.3**
    - `// Feature: payment-manual-item-entry, Property 1: Manual entry UI renders correctly for any "manual" type selection`

- [ ] 3. Update `addItem()` to support manual items
  - [ ] 3.1 Relax the `id` gate for manual type
    - In `addItem()`, add a branch: if `currentItem.type === 'manual'`, guard on `currentItem.name.trim() !== ''` AND `parseFloat(currentItem.price) > 0` AND `parseInt(currentItem.quantity) >= 1`; return early if invalid
    - Build `newItem` with `{ type: 'manual', name: currentItem.name.trim(), price: parseFloat(currentItem.price), quantity: parseInt(currentItem.quantity), total: price * quantity }` — no `id` field
    - Keep the existing `else` branch (catalog items) unchanged
    - After adding, reset `currentItem` to `{ type: 'manual', id: '', name: '', price: '', quantity: 1 }` and reset `manualNameTouched` / `manualPriceTouched` to `false`
    - _Requirements: 2.1, 2.2, 2.5, 3.1, 3.2_

  - [ ]* 3.2 Write property test for Add button disabled state (Property 3)
    - **Property 3: Add button is disabled for any invalid manual input**
    - **Validates: Requirements 2.1, 2.2, 2.5**
    - `// Feature: payment-manual-item-entry, Property 3: Add button is disabled for any invalid manual input`

  - [ ]* 3.3 Write property test for valid manual item append and total recalculation (Property 4)
    - **Property 4: Valid manual item is appended with correct shape and totals recalculate**
    - **Validates: Requirements 3.1, 3.2, 3.4**
    - `// Feature: payment-manual-item-entry, Property 4: Valid manual item is appended with correct shape and totals recalculate`

- [ ] 4. Disable Add button for invalid manual state and wire `isManualValid`
  - Compute `isManualValid = currentItem.name.trim() !== '' && parseFloat(currentItem.price) > 0 && parseInt(currentItem.quantity) >= 1` inline where the Add button is rendered
  - When `currentItem.type === 'manual'`, set the Add button's `disabled` prop to `!isManualValid`
  - When `currentItem.type !== 'manual'`, keep the existing `disabled={!currentItem.id}` logic
  - _Requirements: 2.1, 2.2, 2.5_

- [ ] 5. Checkpoint — verify manual item add flow end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Verify manual items render correctly in the items table and persist through save/view
  - [ ] 6.1 Confirm items table label rendering
    - Inspect the existing items table render in the New Payment modal; confirm it already renders `item.type` as a label (per design, no change needed)
    - If the label cell does not yet exist, add a `<span>` or `<td>` that displays `item.type` for each row
    - _Requirements: 3.3_

  - [ ]* 6.2 Write property test for manual item label in items table (Property 5)
    - **Property 5: Manual items are labeled "manual" in the items table**
    - **Validates: Requirements 3.3**
    - `// Feature: payment-manual-item-entry, Property 5: Manual items are labeled "manual" in the items table`

  - [ ] 6.3 Confirm Payment Details modal renders manual items
    - Inspect the Payment Details view modal in `Payments.jsx`; confirm it iterates `payment.items` and renders each item's `name`, `price`, `quantity`, and `total` — manual items will display correctly since they share the same shape
    - If the details modal filters by `item.type`, ensure `"manual"` is included
    - _Requirements: 4.2_

  - [ ]* 6.4 Write property test for save/load round trip (Property 6)
    - **Property 6: Manual items survive the save/load round trip**
    - **Validates: Requirements 4.1, 4.2**
    - `// Feature: payment-manual-item-entry, Property 6: Manual items survive the save/load round trip`

- [ ] 7. Write unit tests in `rcmc-emr/src/tests/payment-manual-item-entry.test.jsx`
  - [ ] 7.1 Set up test file with fast-check and React Testing Library
    - Create `rcmc-emr/src/tests/payment-manual-item-entry.test.jsx`
    - Import `fc` from `fast-check`, `render`, `screen`, `fireEvent` from `@testing-library/react`
    - Add necessary mocks for `../lib/supabase`, `../context/AuthContext`, `../context/BillingQueueContext`
    - _Requirements: all_

  - [ ]* 7.2 Write unit tests for Item_Type_Selector and conditional rendering
    - Test: `Item_Type_Selector` contains "Manual Entry" option
    - Test: Selecting "manual" shows plain text input and hides autocomplete
    - Test: Switching away from "manual" clears fields and restores autocomplete
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [ ]* 7.3 Write unit tests for inline validation messages
    - Test: Empty name after blur → "Item name is required" shown
    - Test: Price = 0 after blur → "Price must be greater than zero" shown
    - Test: Price = -5 → Add button disabled
    - _Requirements: 2.3, 2.4_

  - [ ]* 7.4 Write unit tests for isolation (no catalog writes)
    - Test: `addItem` for manual type does not call `db.addService` or `db.addInventory`
    - _Requirements: 5.1, 5.2_

  - [ ]* 7.5 Write property test for type-switch state reset (Property 2)
    - **Property 2: Switching away from manual entry resets state**
    - **Validates: Requirements 1.4**
    - `// Feature: payment-manual-item-entry, Property 2: Switching away from manual entry resets state`

- [ ] 8. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- All changes are in `rcmc-emr/src/pages/Payments.jsx` only — no new components, no DB migrations
- `manualNameTouched` and `manualPriceTouched` must be reset on every type switch and after a successful `addItem` call
- Property tests use fast-check with a minimum of 100 iterations per property
- Each property test comment must include the tag `// Feature: payment-manual-item-entry, Property N: ...`
