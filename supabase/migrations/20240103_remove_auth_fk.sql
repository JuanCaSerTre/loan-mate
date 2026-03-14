-- Drop the existing users table (FK to auth.users is incompatible with Twilio OTP auth)
-- and recreate it as a standalone table with a plain UUID primary key.

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;

-- Drop the trigger that tried to auto-create users from auth.users insertions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Make id a plain uuid with default gen_random_uuid() so inserts without id still work
ALTER TABLE public.users ALTER COLUMN id SET DEFAULT gen_random_uuid();
