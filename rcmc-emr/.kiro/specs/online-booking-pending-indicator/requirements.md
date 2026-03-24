# Requirements Document

## Introduction

This feature adds a visual pending-count badge to the "Online Bookings" sidebar navigation item. When one or more online booking appointments have a `booking_status` of `'pending'` (awaiting staff approval), the sidebar item displays a numeric badge showing the count. The badge disappears when no pending bookings remain. The count stays current in real-time by reacting to the existing `lastUpdate.online_bookings` signal from `RealtimeContext`.

## Glossary

- **Sidebar**: The `Sidebar.jsx` component that renders the left-side navigation of the RCMC EMR application.
- **Pending_Badge**: The visual indicator (numeric badge) rendered on the "Online Bookings" nav item when pending bookings exist.
- **Pending_Count**: The integer count of online booking records whose `booking_status` equals `'pending'`.
- **RealtimeContext**: The existing React context (`RealtimeContext.jsx`) that exposes `lastUpdate.online_bookings`, a timestamp updated whenever the `online_bookings` Supabase table changes.
- **Online_Bookings_Item**: The sidebar navigation entry with `id: 'online-bookings'` and label "Online Bookings".
- **db.getOnlineBookings**: The existing Supabase helper in `supabase.js` that fetches online booking records, accepting a status filter argument.

---

## Requirements

### Requirement 1: Display Pending Count Badge

**User Story:** As a staff member, I want to see a badge on the "Online Bookings" sidebar item showing how many bookings need my approval, so that I can quickly notice and act on pending requests without navigating to the page first.

#### Acceptance Criteria

1. WHEN the Pending_Count is greater than zero, THE Sidebar SHALL render the Pending_Badge on the Online_Bookings_Item displaying the Pending_Count as a number.
2. WHEN the Pending_Count is zero, THE Sidebar SHALL NOT render the Pending_Badge on the Online_Bookings_Item.
3. THE Pending_Badge SHALL be visually distinct from the nav item label (e.g., a small colored circle with white text).
4. WHEN the Sidebar is in collapsed mode, THE Sidebar SHALL still render the Pending_Badge positioned relative to the icon of the Online_Bookings_Item.
5. WHEN the Pending_Count exceeds 99, THE Pending_Badge SHALL display "99+" instead of the exact number.

---

### Requirement 2: Fetch Pending Count on Mount

**User Story:** As a staff member, I want the pending count to be accurate when I first open the application, so that I immediately see the correct number of pending bookings.

#### Acceptance Criteria

1. WHEN the Sidebar component mounts, THE Sidebar SHALL fetch the Pending_Count from the database using `db.getOnlineBookings` filtered to `'pending'` status.
2. IF the fetch fails, THEN THE Sidebar SHALL set the Pending_Count to zero and SHALL NOT display an error to the user.
3. THE Sidebar SHALL fetch only the data necessary to compute the Pending_Count (status filter applied at query time).

---

### Requirement 3: Real-Time Updates via RealtimeContext

**User Story:** As a staff member, I want the pending count badge to update automatically when bookings are approved or new ones arrive, so that I always see an accurate count without refreshing the page.

#### Acceptance Criteria

1. WHEN `lastUpdate.online_bookings` changes in RealtimeContext, THE Sidebar SHALL re-fetch the Pending_Count from the database.
2. WHEN a pending booking is approved or rejected (causing `lastUpdate.online_bookings` to update), THE Sidebar SHALL update the Pending_Badge within one re-render cycle after the fetch completes.
3. THE Sidebar SHALL use the existing `useRealtime` hook from `RealtimeContext` to subscribe to `lastUpdate.online_bookings` changes.
4. THE Sidebar SHALL NOT create a new Supabase real-time subscription; it SHALL rely solely on `RealtimeContext` for change notifications.

---

### Requirement 4: Badge Visibility Across Sidebar States

**User Story:** As a staff member using the sidebar in either expanded or collapsed mode, I want the pending badge to always be visible, so that I never miss pending bookings regardless of sidebar state.

#### Acceptance Criteria

1. WHILE the Sidebar is in expanded mode, THE Sidebar SHALL render the Pending_Badge to the right of the "Online Bookings" label text.
2. WHILE the Sidebar is in collapsed mode, THE Sidebar SHALL render the Pending_Badge as an overlay on the top-right corner of the Online_Bookings_Item icon.
3. THE Pending_Badge SHALL remain visible and not be clipped or hidden by the sidebar container in either mode.
