# Design Document: Payment Manual Item Entry

## Overview

This feature adds a "Manual Entry" option to the Item_Type_Selector in the New Payment modal (`Payments.jsx`). When selected, the autocomplete search is replaced with a plain text name input and an immediately-visible price input, allowing billing staff to add one-off charges that don't exist in the services or inventory catalog.

Manual items are stored as `{ type: "manual", name, price, quantity, total }` objects inside the existing `items` JSON array on the billing record — no schema changes required. The feature is entirely frontend-only.

## Architecture

The change is self-contained within `rcmc-emr/src/pages/Payments.jsx`. No new files, services, or database tables are needed.

```
Payments.jsx
├── currentItem state  ← add type: "manual" support
├── addItem()          ← relax the `id` requirement for manual items
├── Item_Entry_Form    ← conditional render based on currentItem.type
│   ├── type === "service"   → existing autocomplete + deferred price
│   ├── type === "inventory" → existing autocomplete + deferred price
│   └── type === "manual"    → plain text name input + immediate price input
└── Items table        ← already renders item.type label; no change needed
```

The `addItem` function currently gates on `currentItem.id`. For manual items there is no catalog ID, so the gate changes to: name is non-empty AND price > 0 AND quantity >= 1.

## Components and Interfaces

### currentItem state shape

```js
// existing
{ type: 'service' | 'inventory', id, name, price, quantity }

// extended
{ type: 'service' | 'inventory' | 'manual', id, name, price, quantity }
// For manual: id is always '' (unused)
```

### Item_Type_Selector

The `<select>` that drives `currentItem.type` gains a third option:

```jsx
<option value="manual">Manual Entry</option>
```

Switching to "manual" resets `currentItem` to `{ type: 'manual', id: '', name: '', price: '', quantity: 1 }` and clears `itemSearchTerm`.

Switching away from "manual" resets to `{ type: newType, id: '', name: '', price: '', quantity: 1 }` and clears `itemSearchTerm`.

### Item_Entry_Form — conditional render

```
currentItem.type === 'manual'
  → <input type="text" placeholder="Item / service name..." />   (name)
  → <input type="number" min="0.01" step="0.01" />               (price, always visible)
  → <input type="number" min="1" />                              (quantity)
  → <button disabled={!isManualValid}>Add</button>

currentItem.type !== 'manual'
  → existing autocomplete search input
  → price input shown only after item is selected (currentItem.id truthy)
  → quantity input
  → <button disabled={!currentItem.id}>Add</button>
```

`isManualValid` = `currentItem.name.trim() !== '' && parseFloat(currentItem.price) > 0 && parseInt(currentItem.quantity) >= 1`

### addItem() — updated logic

```js
const addItem = () => {
  if (currentItem.type === 'manual') {
    if (!currentItem.name.trim() || parseFloat(currentItem.price) <= 0) return
    // build newItem with type: 'manual', no id field needed
  } else {
    if (!currentItem.id || !currentItem.name || !currentItem.price) return
    // existing logic unchanged
  }
  // rest of addItem (append, recalculate totals) is unchanged
}
```

### Inline validation messages

Two small `<p>` elements rendered conditionally below the manual name/price inputs when the user has interacted with the field but left it invalid:

- Name field touched + empty → "Item name is required"
- Price field touched + value ≤ 0 → "Price must be greater than zero"

Tracked via two local boolean flags: `manualNameTouched`, `manualPriceTouched`.

## Data Models

### Manual item object (stored in billing.items JSON array)

```ts
{
  type: "manual",       // discriminator — no id field
  name: string,         // free-text, non-empty
  price: number,        // > 0
  quantity: number,     // integer >= 1
  total: number         // price * quantity
}
```

This is structurally compatible with existing catalog items. The items table in both the New Payment modal and the Payment Details modal already renders `item.type` as a label, so manual items display correctly with zero additional rendering changes.

### No database schema changes

The `items` column on the `billing` table is already a JSON/JSONB array. Storing `type: "manual"` objects there requires no migration.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Manual entry UI renders correctly for any "manual" type selection

*For any* render of the Item_Entry_Form where `currentItem.type === "manual"`, the autocomplete search input should be absent and a plain text name input plus an immediately-visible price input should be present.

**Validates: Requirements 1.2, 1.3**

### Property 2: Switching away from manual entry resets state

*For any* sequence where the user selects "manual", enters a name and price, then switches to a non-manual type, the name and price fields should be cleared and the autocomplete search input should be restored.

**Validates: Requirements 1.4**

### Property 3: Add button is disabled for any invalid manual input

*For any* combination of manual item inputs where the name is empty/whitespace-only OR the price is ≤ 0 OR the quantity is < 1, the Add button should be disabled.

**Validates: Requirements 2.1, 2.2, 2.5**

### Property 4: Valid manual item is appended with correct shape and totals recalculate

*For any* valid manual item (non-empty name, price > 0, quantity ≥ 1), after calling addItem the items list should contain an entry with `type: "manual"`, the exact name/price/quantity entered, and `total === price * quantity`. The displayed payment total should equal the sum of all item totals minus any applicable discount.

**Validates: Requirements 3.1, 3.2, 3.4**

### Property 5: Manual items are labeled "manual" in the items table

*For any* manual item present in `formData.items`, the rendered items table row should contain the text "manual" as a type label.

**Validates: Requirements 3.3**

### Property 6: Manual items survive the save/load round trip

*For any* payment record saved with one or more manual items, loading that record and viewing it in the Payment Details modal should display each manual item with its original name, price, quantity, and total.

**Validates: Requirements 4.1, 4.2**

## Error Handling

- If `addItem` is called for a manual item with an empty name or price ≤ 0, the function returns early without mutating state. The Add button is disabled to prevent this path in normal use.
- Inline validation messages appear only after the user has touched (blurred) the respective field, avoiding premature error display.
- Switching item types clears all manual fields, preventing stale data from a previous manual entry from being submitted under a catalog item type.
- The existing `handleSubmit` / `handleCompleteBilling` paths are unchanged; manual items in `formData.items` are serialized into the `items` JSON array exactly like catalog items.

## Testing Strategy

### Unit tests

Focus on specific examples and edge cases:

- Rendering: Item_Type_Selector contains "Manual Entry" option.
- Rendering: Selecting "manual" shows plain text input, hides autocomplete.
- Rendering: Manual item row in items table shows "(manual)" label.
- Edge case: Empty name → Add button disabled + error message shown after blur.
- Edge case: Price = 0 → Add button disabled + error message shown after blur.
- Edge case: Price = -5 → Add button disabled.
- Isolation: `addItem` for manual type does not call `db.addService` or `db.addInventory`.
- Output: `handleDownload` and `handlePrint` include manual item names in generated output.

### Property-based tests

Use [fast-check](https://github.com/dubzzz/fast-check) (already available in the JS ecosystem). Configure each test to run a minimum of 100 iterations.

Each property test is tagged with a comment in the format:
`// Feature: payment-manual-item-entry, Property N: <property text>`

**Property 1 test** — `fc.boolean()` to drive type selection; assert autocomplete absent and text/price inputs present when type is "manual".
`// Feature: payment-manual-item-entry, Property 1: Manual entry UI renders correctly for any "manual" type selection`

**Property 2 test** — `fc.string()` for name, `fc.float()` for price, then switch type; assert fields cleared and autocomplete restored.
`// Feature: payment-manual-item-entry, Property 2: Switching away from manual entry resets state`

**Property 3 test** — `fc.oneof(fc.constant(''), fc.string().filter(s => !s.trim()))` for name, `fc.float({ max: 0 })` for price; assert Add button disabled.
`// Feature: payment-manual-item-entry, Property 3: Add button is disabled for any invalid manual input`

**Property 4 test** — `fc.string({ minLength: 1 }).filter(s => s.trim())` for name, `fc.float({ min: 0.01 })` for price, `fc.integer({ min: 1 })` for qty; call addItem, assert item shape and total recalculation.
`// Feature: payment-manual-item-entry, Property 4: Valid manual item is appended with correct shape and totals recalculate`

**Property 5 test** — `fc.array(manualItemArbitrary, { minLength: 1 })` for items; render items table, assert each row contains "manual" label.
`// Feature: payment-manual-item-entry, Property 5: Manual items are labeled "manual" in the items table`

**Property 6 test** — `fc.array(manualItemArbitrary, { minLength: 1 })` for items; simulate save then load, assert Payment Details modal renders all items with correct data.
`// Feature: payment-manual-item-entry, Property 6: Manual items survive the save/load round trip`
