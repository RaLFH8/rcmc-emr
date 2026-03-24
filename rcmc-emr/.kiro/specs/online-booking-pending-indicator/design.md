# Design Document: Online Booking Pending Indicator

## Overview

This feature adds a real-time pending-count badge to the "Online Bookings" item in `Sidebar.jsx`. The badge shows how many online bookings have `booking_status = 'pending'`, updates automatically via `RealtimeContext`, and renders correctly in both expanded and collapsed sidebar states.

All changes are confined to a single file: `rcmc-emr/src/components/Sidebar.jsx`.

---

## Architecture

The feature is a pure UI enhancement to an existing component. No new files, no new Supabase subscriptions, and no new contexts are introduced.

```
RealtimeContext (existing)
  └─ lastUpdate.online_bookings  ──► useEffect dependency in Sidebar
                                         │
                                         ▼
                                  db.getOnlineBookings('pending')
                                         │
                                         ▼
                                  pendingCount (useState)
                                         │
                                         ▼
                                  PendingBadge rendered on
                                  Online_Bookings_Item
```

Data flow is one-directional: context change → fetch → state update → render.

---

## Components and Interfaces

### Sidebar.jsx — Changes Required

**New imports:**
```js
import { useState, useEffect } from 'react'   // useEffect added
import { useRealtime } from '../context/RealtimeContext'
import { db } from '../lib/supabase'
```

**New state:**
```js
const [pendingCount, setPendingCount] = useState(0)
```

**New hook call:**
```js
const { lastUpdate } = useRealtime()
```

**New effect:**
```js
useEffect(() => {
  const fetchPendingCount = async () => {
    try {
      const data = await db.getOnlineBookings('pending')
      setPendingCount(data.length)
    } catch {
      setPendingCount(0)
    }
  }
  fetchPendingCount()
}, [lastUpdate.online_bookings])
```

**Badge helper (inline expression):**
```js
const badgeText = pendingCount > 99 ? '99+' : String(pendingCount)
const showBadge = pendingCount > 0
```

---

## Data Models

No new data models. The feature reads from the existing `appointments` table via `db.getOnlineBookings('pending')`, which filters `booking_source = 'online'` and `booking_status = 'pending'`. The return value is an array; only `.length` is used.

| Value | Type | Source |
|---|---|---|
| `pendingCount` | `number` (integer ≥ 0) | `db.getOnlineBookings('pending').length` |
| `lastUpdate.online_bookings` | `Date \| null` | `RealtimeContext` |

---

## Badge Rendering Logic

### Expanded Mode (`collapsed === false`)

The badge sits inline to the right of the label text inside the existing `<button>` flex row:

```jsx
{!collapsed && (
  <span className="text-sm font-medium">{item.label}</span>
)}
{!collapsed && showBadge && (
  <span className="ml-auto bg-red-500 text-white text-xs font-semibold rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center leading-none">
    {badgeText}
  </span>
)}
```

### Collapsed Mode (`collapsed === true`)

The icon wrapper gets `relative` positioning so the badge can be absolutely placed at the top-right corner:

```jsx
<span className="relative flex-shrink-0">
  <Icon className="w-5 h-5" />
  {collapsed && showBadge && (
    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs font-semibold rounded-full w-4 h-4 flex items-center justify-center leading-none">
      {badgeText}
    </span>
  )}
</span>
```

### Badge Display Rules

| Condition | Badge text |
|---|---|
| `pendingCount === 0` | Hidden (not rendered) |
| `1 ≤ pendingCount ≤ 99` | Exact number as string |
| `pendingCount > 99` | `"99+"` |

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Badge renders with correct count in expanded mode

*For any* integer `n` where `n > 0`, when `pendingCount = n` and `collapsed = false`, the rendered Online Bookings nav item SHALL contain a badge element whose text content equals `n` (when `n ≤ 99`) or `"99+"` (when `n > 99`).

**Validates: Requirements 1.1, 4.1**

---

### Property 2: Badge renders in collapsed mode when count is positive

*For any* integer `n` where `n > 0`, when `pendingCount = n` and `collapsed = true`, the rendered Online Bookings nav item SHALL contain a badge element with `position: absolute` (or equivalent overlay class) on the icon wrapper.

**Validates: Requirements 1.4, 4.2**

---

### Property 3: Count cap at 99+

*For any* integer `n` where `n > 99`, the badge text SHALL be `"99+"` regardless of the exact value of `n`.

**Validates: Requirements 1.5**

---

### Property 4: Re-fetch triggered on any lastUpdate change

*For any* new value of `lastUpdate.online_bookings`, the Sidebar SHALL call `db.getOnlineBookings('pending')` exactly once per change, and the resulting `pendingCount` SHALL equal the length of the returned array.

**Validates: Requirements 3.1**

---

## Error Handling

| Scenario | Behavior |
|---|---|
| `db.getOnlineBookings` throws | `catch` block sets `pendingCount = 0`; badge hidden; no error shown to user |
| `RealtimeContext` not connected | `lastUpdate.online_bookings` stays `null`; initial fetch on mount still runs |
| Empty result array | `data.length === 0` → `pendingCount = 0` → badge hidden |

The `try/catch` in the effect ensures the component never crashes due to a failed fetch.

---

## Testing Strategy

### Unit Tests

- Verify badge is absent when `pendingCount = 0` (example test)
- Verify `db.getOnlineBookings` is called with `'pending'` on mount (example test)
- Verify fetch failure leaves `pendingCount = 0` and no error UI (edge-case test)

### Property-Based Tests

Use [fast-check](https://github.com/dubzzz/fast-check) (already available in the JS ecosystem) with a minimum of 100 iterations per property.

**Property 1 — Badge text in expanded mode**
```
// Feature: online-booking-pending-indicator, Property 1: badge renders with correct count in expanded mode
fc.assert(fc.property(fc.integer({ min: 1, max: 99 }), (n) => {
  render(<Sidebar ... />, { pendingCount: n, collapsed: false })
  expect(screen.getByText(String(n))).toBeInTheDocument()
}), { numRuns: 100 })
```

**Property 2 — Badge present in collapsed mode**
```
// Feature: online-booking-pending-indicator, Property 2: badge renders in collapsed mode when count is positive
fc.assert(fc.property(fc.integer({ min: 1, max: 200 }), (n) => {
  render(<Sidebar ... />, { pendingCount: n, collapsed: true })
  const badge = document.querySelector('.absolute.-top-1\\.5')
  expect(badge).toBeInTheDocument()
}), { numRuns: 100 })
```

**Property 3 — 99+ cap**
```
// Feature: online-booking-pending-indicator, Property 3: count cap at 99+
fc.assert(fc.property(fc.integer({ min: 100, max: 10000 }), (n) => {
  render(<Sidebar ... />, { pendingCount: n, collapsed: false })
  expect(screen.getByText('99+')).toBeInTheDocument()
}), { numRuns: 100 })
```

**Property 4 — Re-fetch on lastUpdate change**
```
// Feature: online-booking-pending-indicator, Property 4: re-fetch triggered on any lastUpdate change
fc.assert(fc.property(fc.date(), (d) => {
  const mockFetch = jest.fn().mockResolvedValue([])
  renderWithContext(<Sidebar ... />, { lastUpdate: { online_bookings: d } })
  expect(mockFetch).toHaveBeenCalledWith('pending')
}), { numRuns: 100 })
```

Unit and property tests together provide complete coverage: unit tests catch concrete edge cases, property tests verify the general correctness rules hold across all inputs.
