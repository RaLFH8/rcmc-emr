# Implementation Plan: Online Booking Pending Indicator

## Overview

Single-file change to `Sidebar.jsx` that adds a real-time pending-count badge to the "Online Bookings" nav item. The badge fetches from `db.getOnlineBookings('pending')` on mount and re-fetches whenever `lastUpdate.online_bookings` changes via `RealtimeContext`.

## Tasks

- [ ] 1. Update Sidebar.jsx with pending count state and data fetching
  - Add `useEffect` to the existing `useState` import
  - Import `useRealtime` from `../context/RealtimeContext`
  - Import `db` from `../lib/supabase`
  - Add `const [pendingCount, setPendingCount] = useState(0)` inside the component
  - Call `const { lastUpdate } = useRealtime()` inside the component
  - Add `useEffect` that calls `db.getOnlineBookings('pending')`, sets `pendingCount` to `data.length`, and silently catches errors by setting `pendingCount` to `0`; dependency array is `[lastUpdate.online_bookings]`
  - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.3, 3.4_

  - [ ]* 1.1 Write property test: re-fetch triggered on any lastUpdate change (Property 4)
    - **Property 4: Re-fetch triggered on any lastUpdate change**
    - Mock `db.getOnlineBookings` and assert it is called with `'pending'` for any `Date` value of `lastUpdate.online_bookings`
    - **Validates: Requirements 3.1**

- [ ] 2. Add badge rendering in the nav item loop
  - Compute `const badgeText = pendingCount > 99 ? '99+' : String(pendingCount)` and `const showBadge = pendingCount > 0` before the `menuItems.map` loop (or inline)
  - For `item.id === 'online-bookings'` in expanded mode (`!collapsed`): render badge `<span>` with `ml-auto bg-red-500 text-white text-xs font-semibold rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center leading-none` after the label, only when `showBadge`
  - For `item.id === 'online-bookings'` in collapsed mode: wrap `<Icon>` in a `<span className="relative flex-shrink-0">` and render badge as `<span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs font-semibold rounded-full w-4 h-4 flex items-center justify-center leading-none">` only when `showBadge`
  - Badge is hidden (`showBadge === false`) when `pendingCount === 0`
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 4.1, 4.2, 4.3_

  - [ ]* 2.1 Write property test: badge text in expanded mode (Property 1)
    - **Property 1: Badge renders with correct count in expanded mode**
    - For any integer `n` in `[1, 99]`: render with `pendingCount = n`, `collapsed = false`, assert badge text equals `String(n)`
    - **Validates: Requirements 1.1, 4.1**

  - [ ]* 2.2 Write property test: badge present in collapsed mode (Property 2)
    - **Property 2: Badge renders in collapsed mode when count is positive**
    - For any integer `n` in `[1, 200]`: render with `pendingCount = n`, `collapsed = true`, assert badge element with absolute positioning is in the document
    - **Validates: Requirements 1.4, 4.2**

  - [ ]* 2.3 Write property test: count cap at 99+ (Property 3)
    - **Property 3: Count cap at 99+**
    - For any integer `n` in `[100, 10000]`: render with `pendingCount = n`, `collapsed = false`, assert badge text equals `"99+"`
    - **Validates: Requirements 1.5**

- [ ] 3. Create property-based test file
  - Create `rcmc-emr/src/tests/online-booking-pending-indicator.test.jsx`
  - Use `fast-check` (already configured in `setup.js`) and `@testing-library/react`
  - Mock `../context/RealtimeContext` and `../lib/supabase` (db)
  - Mock `../context/AuthContext` (useAuth)
  - Implement all 4 property tests from the design document with `numRuns: 100`
  - _Requirements: 1.1, 1.4, 1.5, 3.1_

- [ ] 4. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- All changes are confined to `Sidebar.jsx` and the new test file
- The badge uses Tailwind classes already present in the project (red-500, white, rounded-full)
- No new Supabase subscriptions are created; `RealtimeContext` handles all real-time signaling
