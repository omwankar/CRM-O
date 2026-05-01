-- =====================================================
-- Migration 006: Add portal links for buyers/vendors
-- =====================================================

ALTER TABLE public.buyers
  ADD COLUMN IF NOT EXISTS buyer_portal_link text;

ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS vendor_portal_link text;
