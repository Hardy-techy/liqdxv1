-- Migration: Atomic credit deduction function
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- This prevents race conditions where concurrent requests drain credits below zero.

CREATE OR REPLACE FUNCTION deduct_credits_atomic(p_wallet TEXT, p_cost NUMERIC)
RETURNS NUMERIC AS $$
DECLARE
  new_bal NUMERIC;
BEGIN
  UPDATE credits_balances
  SET balance = balance - p_cost,
      updated_at = NOW()
  WHERE wallet_address = p_wallet
    AND balance >= p_cost
  RETURNING balance INTO new_bal;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  RETURN new_bal;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
