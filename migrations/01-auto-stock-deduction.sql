-- =====================================================
-- AUTO STOCK DEDUCTION MIGRATION
-- =====================================================
-- This migration automatically deducts inventory stock
-- when a payment is created with inventory items.
-- =====================================================

-- Step 1: Create inventory_transactions table for audit trail
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inventory_id UUID REFERENCES inventory(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('deduction', 'addition', 'adjustment', 'return')),
  quantity INTEGER NOT NULL,
  reference_type TEXT, -- 'billing', 'manual', 'return', 'adjustment'
  reference_id UUID,
  performed_by UUID REFERENCES user_profiles(id),
  notes TEXT,
  previous_stock INTEGER,
  new_stock INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_inventory_id 
  ON inventory_transactions(inventory_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_created_at 
  ON inventory_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_reference 
  ON inventory_transactions(reference_type, reference_id);

-- Step 2: Create function to automatically deduct stock
CREATE OR REPLACE FUNCTION auto_deduct_inventory_stock()
RETURNS TRIGGER AS $$
DECLARE
  item JSONB;
  inventory_item RECORD;
  new_stock INTEGER;
  new_status TEXT;
  quantity_to_deduct INTEGER;
BEGIN
  -- Only process if payment status is 'paid' or 'partial'
  IF NEW.payment_status IN ('paid', 'partial') THEN
    
    -- Loop through all items in the billing record
    FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
    LOOP
      -- Check if item is from inventory (type = 'inventory')
      IF (item->>'type')::TEXT = 'inventory' THEN
        
        -- Get current inventory item
        SELECT * INTO inventory_item 
        FROM inventory 
        WHERE id = (item->>'id')::UUID;
        
        IF FOUND THEN
          -- Get quantity to deduct
          quantity_to_deduct := (item->>'quantity')::INTEGER;
          
          -- Calculate new stock (prevent negative)
          new_stock := GREATEST(0, inventory_item.stock - quantity_to_deduct);
          
          -- Determine new status based on stock level
          IF new_stock = 0 THEN
            new_status := 'Out of Stock';
          ELSIF new_stock <= (inventory_item.reorder_level * 0.3) THEN
            new_status := 'Critical';
          ELSIF new_stock <= inventory_item.reorder_level THEN
            new_status := 'Low Stock';
          ELSE
            new_status := 'In Stock';
          END IF;
          
          -- Update inventory
          UPDATE inventory
          SET 
            stock = new_stock,
            status = new_status,
            updated_at = NOW()
          WHERE id = inventory_item.id;
          
          -- Log the transaction for audit trail
          INSERT INTO inventory_transactions (
            inventory_id,
            transaction_type,
            quantity,
            reference_type,
            reference_id,
            performed_by,
            previous_stock,
            new_stock,
            notes,
            created_at
          ) VALUES (
            inventory_item.id,
            'deduction',
            quantity_to_deduct,
            'billing',
            NEW.id,
            NEW.billed_by,
            inventory_item.stock,
            new_stock,
            'Auto-deducted from billing #' || NEW.receipt_number,
            NOW()
          );
          
          -- Raise notice for logging (optional)
          RAISE NOTICE 'Stock deducted: % (%) - Previous: %, New: %', 
            inventory_item.name, 
            inventory_item.id, 
            inventory_item.stock, 
            new_stock;
        END IF;
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create trigger
DROP TRIGGER IF EXISTS trigger_auto_deduct_stock ON billing;
CREATE TRIGGER trigger_auto_deduct_stock
  AFTER INSERT ON billing
  FOR EACH ROW
  EXECUTE FUNCTION auto_deduct_inventory_stock();

-- Step 4: Enable RLS on inventory_transactions
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view transactions
CREATE POLICY "Allow authenticated users to view inventory transactions"
  ON inventory_transactions
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert transactions
CREATE POLICY "Allow authenticated users to insert inventory transactions"
  ON inventory_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to verify the migration worked:

-- 1. Check if table exists
-- SELECT * FROM inventory_transactions LIMIT 5;

-- 2. Check if trigger exists
-- SELECT tgname FROM pg_trigger WHERE tgname = 'trigger_auto_deduct_stock';

-- 3. Test with a sample billing entry (don't run in production)
-- INSERT INTO billing (patient_id, total_amount, amount_paid, payment_status, items, billed_by)
-- VALUES (
--   (SELECT id FROM patients LIMIT 1),
--   100,
--   100,
--   'paid',
--   '[{"id": "<inventory-item-id>", "type": "inventory", "quantity": 2, "name": "Test Item", "price": 50}]'::jsonb,
--   (SELECT id FROM user_profiles LIMIT 1)
-- );

-- =====================================================
-- ROLLBACK (if needed)
-- =====================================================
-- DROP TRIGGER IF EXISTS trigger_auto_deduct_stock ON billing;
-- DROP FUNCTION IF EXISTS auto_deduct_inventory_stock();
-- DROP TABLE IF EXISTS inventory_transactions;
