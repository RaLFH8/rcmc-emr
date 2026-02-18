# Items & Pricing Management Guide

## Overview
The Items & Pricing Management module allows administrators to add, edit, view, and manage all billable items including consultations, laboratory tests, procedures, and medicines directly from the web interface.

## Features

### ✨ Add New Items
- Item name and description
- 4 main categories (Consultation, Laboratory, Procedure, Medicine)
- 13+ unit options (per visit, per test, per tablet, etc.)
- Flexible pricing in Philippine Peso (₱)
- Automatic item ID generation (ITM001, ITM002, etc.)

### ✏️ Edit Item Information
- Update item names and descriptions
- Modify pricing
- Change categories
- Update units
- Activate/deactivate items

### 🗑️ Deactivate Items
- Soft delete (preserves historical data)
- Items hidden from billing
- Can be reactivated anytime
- Historical invoices remain intact

### 📋 Items Directory
- Comprehensive list of all items
- Filter by category
- Show/hide inactive items
- Color-coded category badges
- Quick view and edit actions

## How to Use

### Adding a New Item

1. **Navigate to Items Menu**
   - Click on "💊 Items & Pricing" in the left sidebar

2. **Open Add Item Form**
   - Click the "+ Add New Item" button (top right)

3. **Fill in Item Information**
   - **Item Name**: Enter descriptive name (e.g., "Complete Blood Count", "Amoxicillin 500mg")
   - **Category**: Select from dropdown:
     - Consultation (for doctor visits)
     - Laboratory (for tests)
     - Procedure (for medical procedures)
     - Medicine (for medications)
   - **Unit**: Select appropriate unit:
     - per visit, per test, per session, per procedure
     - per tablet, per capsule, per bottle, per vial
     - per ampule, per piece, per box
     - per ml, per mg
   - **Unit Price**: Enter price in ₱ (e.g., 500.00)
   - **Description**: Add details (optional)

4. **Submit**
   - Click "Add Item" button
   - System generates unique Item ID automatically
   - Success message displays with new Item ID

### Editing Item Information

1. **Locate Item**
   - Go to Items & Pricing menu
   - Use category filter if needed
   - Find item in the directory table

2. **Open Edit Form**
   - Click "Edit" button next to item name
   - OR click "View" then "Edit Item"

3. **Update Information**
   - Modify any fields as needed
   - Update pricing
   - Change status (Active/Inactive) if required

4. **Save Changes**
   - Click "Update Item" button
   - Success message confirms update

### Viewing Item Details

1. **Click "View" Button**
   - In the items directory table
   - Click "View" next to any item

2. **Review Information**
   - See complete item details
   - Check current pricing
   - View status and category

3. **Quick Actions**
   - Click "Edit Item" to modify
   - Click "Deactivate" to remove from billing

### Deactivating an Item

1. **View Item Details**
   - Click "View" button for the item

2. **Deactivate**
   - Click "Deactivate" button
   - Confirm deactivation in popup

3. **Result**
   - Item status changes to "Inactive"
   - Hidden from billing selection
   - Historical records preserved

### Filtering Items

1. **By Category**
   - Use "Filter by Category" dropdown
   - Select: All, Consultation, Laboratory, Procedure, or Medicine
   - Table updates automatically

2. **Show Inactive Items**
   - Check "Show Inactive Items" checkbox
   - View all items including deactivated ones
   - Uncheck to show only active items

## Item Categories

### 1. Consultation
Services provided by doctors during patient visits.

**Examples:**
- General Consultation
- Follow-up Consultation
- Specialist Consultation
- Emergency Consultation

**Typical Units:** per visit, per session

### 2. Laboratory
Diagnostic tests and laboratory procedures.

**Examples:**
- Complete Blood Count (CBC)
- Urinalysis
- Blood Chemistry
- X-Ray
- ECG
- Ultrasound

**Typical Units:** per test, per procedure

### 3. Procedure
Medical procedures performed at the clinic.

**Examples:**
- Blood Pressure Monitoring
- Wound Dressing
- Suturing
- Nebulization
- Injection Administration
- IV Therapy

**Typical Units:** per procedure, per session

### 4. Medicine
Medications dispensed or prescribed.

**Examples:**
- Amoxicillin 500mg
- Paracetamol 500mg
- Ibuprofen 400mg
- Cetirizine 10mg
- Multivitamins

**Typical Units:** per tablet, per capsule, per bottle, per ml

## Available Units

### Service Units
- **per visit** - For consultations
- **per test** - For laboratory tests
- **per session** - For therapy sessions
- **per procedure** - For medical procedures

### Medicine Units
- **per tablet** - For tablet medications
- **per capsule** - For capsule medications
- **per bottle** - For liquid medicines
- **per vial** - For injectable medicines
- **per ampule** - For single-dose injectables
- **per piece** - For individual items
- **per box** - For boxed items
- **per ml** - For liquid volume
- **per mg** - For dosage measurement

## Item Status

### Active
- Item appears in billing system
- Available for invoice creation
- Included in item selection
- Shows in reports

### Inactive
- Item hidden from billing
- Not available for new invoices
- Still visible in directory (with filter)
- Historical invoices preserved
- Can be reactivated

## Integration with Other Modules

### Billing
- Active items appear in invoice creation
- Prices auto-populated from item database
- Quantity and totals calculated automatically
- Category-based filtering available

### Reports
- Revenue tracked by item category
- Most common services identified
- Pricing analysis available
- Historical data maintained

### Dashboard
- Revenue by service category displayed
- Most common services tracked
- Financial metrics calculated

## Data Storage

All item information is stored in the "Items" sheet of the Google Spreadsheet database:

- **Item ID**: Unique identifier (auto-generated)
- **Item Name**: Descriptive name
- **Category**: Service category
- **Unit Price**: Price in Philippine Peso
- **Unit**: Measurement unit
- **Description**: Additional details
- **Status**: Active or Inactive
- **Created Date**: Registration timestamp

## Best Practices

### When Adding Items
- ✅ Use clear, descriptive names
- ✅ Select appropriate category
- ✅ Choose correct unit type
- ✅ Set competitive pricing
- ✅ Add helpful descriptions
- ✅ Double-check prices before saving

### When Editing Items
- ✅ Update prices regularly
- ✅ Keep descriptions current
- ✅ Use Inactive status instead of deleting
- ✅ Verify changes before saving
- ✅ Notify staff of price changes

### Pricing Strategy
- ✅ Research market rates
- ✅ Consider operational costs
- ✅ Review prices quarterly
- ✅ Document price changes
- ✅ Maintain competitive rates

### Managing Inventory
- ✅ Deactivate discontinued items
- ✅ Keep active items current
- ✅ Regular inventory review
- ✅ Update based on availability
- ✅ Maintain accurate descriptions

## Common Use Cases

### Adding a New Laboratory Test
1. Navigate to Items & Pricing
2. Click "+ Add New Item"
3. Name: "Lipid Profile"
4. Category: Laboratory
5. Unit: per test
6. Price: 800.00
7. Description: "Complete cholesterol panel"
8. Click "Add Item"

### Updating Medicine Price
1. Find medicine in directory
2. Click "Edit"
3. Update Unit Price field
4. Click "Update Item"
5. Price immediately reflects in billing

### Discontinuing a Service
1. Locate service in directory
2. Click "View"
3. Click "Deactivate"
4. Confirm deactivation
5. Service removed from billing options

### Reactivating an Item
1. Check "Show Inactive Items"
2. Find deactivated item
3. Click "Edit"
4. Change Status to "Active"
5. Click "Update Item"

## Troubleshooting

### Item Not Appearing in Billing
- Check if item status is "Active"
- Verify item was saved successfully
- Refresh the billing page
- Check category filter settings

### Cannot Edit Item
- Ensure you're logged in as Admin
- Check internet connection
- Try refreshing the page
- Verify item exists in database

### Price Not Updating
- Make sure to click "Update Item"
- Check if changes were saved
- Verify in the database spreadsheet
- Clear browser cache if needed

### Duplicate Items
- Search before adding new items
- Use descriptive unique names
- Check all categories
- Deactivate duplicates instead of deleting

## Security & Access

### Who Can Manage Items?
- **Admin**: Full access (add, edit, view, deactivate)
- **Doctor**: View only (for reference)
- **Reception**: View only (for billing)

### Data Protection
- All changes logged with timestamps
- Historical data preserved
- No permanent deletion
- Audit trail in spreadsheet version history
- Price history maintained

## Tips for Efficient Management

1. **Regular Reviews**: Update pricing and availability monthly
2. **Category Organization**: Keep items properly categorized
3. **Clear Naming**: Use consistent naming conventions
4. **Description Details**: Add helpful information for staff
5. **Status Management**: Use Inactive for temporary unavailability
6. **Price Monitoring**: Track competitor pricing
7. **Inventory Sync**: Align with actual stock availability
8. **Staff Training**: Ensure team knows current offerings

## Reporting & Analytics

### Track Item Performance
- View revenue by category in Reports
- Identify most common services
- Analyze pricing effectiveness
- Monitor item usage patterns

### Financial Analysis
- Compare category revenues
- Track pricing trends
- Identify high-value items
- Optimize service offerings

---

**Need Help?**
Refer to the main README.md for complete system documentation or check the Settings menu for system information.
