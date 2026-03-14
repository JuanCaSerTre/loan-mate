ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free' CHECK (subscription_status IN ('free', 'active', 'past_due', 'canceled', 'trialing')),
  ADD COLUMN IF NOT EXISTS subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS subscription_expiry TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS subscription_plan TEXT CHECK (subscription_plan IN ('monthly', 'yearly', NULL));
