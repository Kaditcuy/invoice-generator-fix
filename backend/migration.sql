-- Migration to fix database schema
-- This script should be run on the Render database

-- Add businesses table if it doesn't exist
CREATE TABLE IF NOT EXISTS businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    address TEXT,
    phone VARCHAR(50),
    website VARCHAR(255),
    logo_url VARCHAR(500),
    tax_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to invoices table
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(100);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'USD';

-- Update existing invoices with a default invoice number
UPDATE invoices 
SET invoice_number = 'INV-' || EXTRACT(EPOCH FROM created_at)::TEXT || '-' || id::TEXT
WHERE invoice_number IS NULL OR invoice_number = '';

-- Now make invoice_number NOT NULL
ALTER TABLE invoices ALTER COLUMN invoice_number SET NOT NULL;

-- Add UNIQUE constraint for invoice_number
ALTER TABLE invoices ADD CONSTRAINT IF NOT EXISTS invoices_invoice_number_unique UNIQUE (invoice_number);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_invoices_business_id ON invoices(business_id);
CREATE INDEX IF NOT EXISTS idx_businesses_user_id ON businesses(user_id);