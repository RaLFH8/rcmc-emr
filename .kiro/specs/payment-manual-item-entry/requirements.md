# Requirements Document

## Introduction

The RCMC EMR "New Payment" screen currently allows staff to add items and services to a payment by searching the existing services list or inventory. However, there are cases where a service or item is not yet in the system — for example, a one-off procedure, a miscellaneous charge, or a newly introduced service that hasn't been added to the Services catalog yet.

This feature adds a "Manual Entry" option in the New Payment modal that lets billing staff type in a custom item name and price directly, without requiring the item to exist in the services or inventory database. Manual items are saved as part of the payment record's `items` JSON array, just like regular items, so they appear on receipts and in payment details.

## Glossary

- **Payment_Modal**: The "New Payment" modal dialog in `Payments.jsx` where billing staff create a payment record.
- **Item_Entry_Form**: The sub-form inside the Payment_Modal used to add individual line items to a payment.
- **Manual_Item**: A line item entered by the billing staff with a custom name and price, not linked to any record in the `services` or `inventory` tables.
- **Catalog_Item**: A line item selected from the existing `services` or `inventory` database records.
- **Item_Type_Selector**: The dropdown in the Item_Entry_Form that currently allows choosing between "Service" and "Medicine/Supply".
- **Billing_Staff**: A clinic user (receptionist or admin) who creates payment records.

## Requirements

### Requirement 1: Manual Item Type Option

**User Story:** As a billing staff member, I want to select a "Manual Entry" item type in the New Payment form, so that I can add a custom item or service that is not in the existing catalog.

#### Acceptance Criteria

1. THE Item_Type_Selector SHALL include a "Manual Entry" option in addition to the existing "Service" and "Medicine/Supply" options.
2. WHEN the Billing_Staff selects "Manual Entry" in the Item_Type_Selector, THE Item_Entry_Form SHALL replace the autocomplete search input with a plain text input for the item name.
3. WHEN the Billing_Staff selects "Manual Entry" in the Item_Type_Selector, THE Item_Entry_Form SHALL display an editable price input field immediately (not deferred until after item selection).
4. WHEN the Billing_Staff switches away from "Manual Entry" to another item type, THE Item_Entry_Form SHALL clear the manual name and price fields and restore the autocomplete search input.

### Requirement 2: Manual Item Input Validation

**User Story:** As a billing staff member, I want the system to validate my manual item entry before adding it to the payment, so that incomplete or invalid items are not added.

#### Acceptance Criteria

1. WHEN the Billing_Staff attempts to add a Manual_Item, THE Payment_Modal SHALL require a non-empty item name before enabling the Add button.
2. WHEN the Billing_Staff attempts to add a Manual_Item, THE Payment_Modal SHALL require a price greater than zero before enabling the Add button.
3. IF the Billing_Staff submits a Manual_Item with an empty name, THEN THE Payment_Modal SHALL display an inline validation message indicating the name is required.
4. IF the Billing_Staff submits a Manual_Item with a price of zero or less, THEN THE Payment_Modal SHALL display an inline validation message indicating a valid price is required.
5. THE Payment_Modal SHALL accept a quantity of 1 or more for Manual_Items, defaulting to 1.

### Requirement 3: Manual Item Added to Payment Line Items

**User Story:** As a billing staff member, I want manual items to appear in the payment's item list alongside catalog items, so that the receipt accurately reflects all charges.

#### Acceptance Criteria

1. WHEN a valid Manual_Item is added, THE Payment_Modal SHALL append it to the items list with `type: "manual"`, the entered name, price, quantity, and computed total.
2. WHEN a Manual_Item is added to the items list, THE Payment_Modal SHALL recalculate the payment subtotal, applicable discounts, and total amount.
3. THE Payment_Modal SHALL display Manual_Items in the items table with a visible "manual" type label, consistent with how "service" and "inventory" type labels are shown.
4. WHEN the Billing_Staff removes a Manual_Item from the items list, THE Payment_Modal SHALL recalculate the subtotal, discounts, and total amount.

### Requirement 4: Manual Items Persisted in Payment Record

**User Story:** As a billing staff member, I want manual items to be saved with the payment record, so that they appear on receipts and in payment history.

#### Acceptance Criteria

1. WHEN a payment containing Manual_Items is submitted, THE Payment_Modal SHALL include all Manual_Items in the `items` JSON array stored in the billing record.
2. WHEN a payment record containing Manual_Items is viewed in the Payment Details modal, THE Payment_Modal SHALL display the Manual_Items in the items breakdown table.
3. WHEN a receipt PDF is generated for a payment containing Manual_Items, THE Payment_Modal SHALL include the Manual_Items in the receipt's line items section.
4. WHEN a receipt is printed for a payment containing Manual_Items, THE Payment_Modal SHALL include the Manual_Items in the printed receipt's line items section.

### Requirement 5: Manual Item Entry Does Not Affect Services Catalog

**User Story:** As a clinic administrator, I want manual payment items to remain isolated to the payment record, so that the Services catalog is not polluted with one-off entries.

#### Acceptance Criteria

1. WHEN a Manual_Item is added to a payment, THE Payment_Modal SHALL NOT create any record in the `services` or `inventory` database tables.
2. THE Payment_Modal SHALL NOT offer to save a Manual_Item to the services catalog during the payment creation flow.
