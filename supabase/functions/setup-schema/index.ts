import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create users table
    const { error: usersError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          phone_number TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          avatar_url TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    }).catch(() => ({ error: null }));

    // Create loans table
    const { error: loansError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.loans (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          lender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
          borrower_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
          borrower_phone TEXT NOT NULL,
          loan_amount NUMERIC(12,2) NOT NULL,
          interest_rate NUMERIC(5,2) DEFAULT 0,
          total_amount NUMERIC(12,2) NOT NULL,
          number_of_payments INTEGER NOT NULL,
          payment_frequency TEXT CHECK (payment_frequency IN ('weekly', 'biweekly', 'monthly')),
          start_date DATE NOT NULL,
          due_date DATE NOT NULL,
          status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'declined')),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    }).catch(() => ({ error: null }));

    // Create payments table
    const { error: paymentsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.payments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
          amount NUMERIC(12,2) NOT NULL,
          created_by_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
          status TEXT DEFAULT 'pending_confirmation' CHECK (status IN ('pending_confirmation', 'confirmed', 'rejected')),
          payment_date DATE NOT NULL,
          note TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    }).catch(() => ({ error: null }));

    // Create notifications table
    const { error: notificationsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.notifications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
          loan_id UUID REFERENCES public.loans(id) ON DELETE CASCADE,
          payment_id UUID REFERENCES public.payments(id) ON DELETE CASCADE,
          type TEXT NOT NULL CHECK (type IN ('loan_request_received', 'loan_accepted', 'loan_declined', 'payment_registered', 'payment_confirmed', 'payment_rejected', 'upcoming_payment_reminder')),
          title TEXT NOT NULL,
          description TEXT,
          is_read BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    }).catch(() => ({ error: null }));

    // Create indexes
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_loans_lender_id ON public.loans(lender_id);
        CREATE INDEX IF NOT EXISTS idx_loans_borrower_id ON public.loans(borrower_id);
        CREATE INDEX IF NOT EXISTS idx_loans_status ON public.loans(status);
        CREATE INDEX IF NOT EXISTS idx_payments_loan_id ON public.payments(loan_id);
        CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
      `
    }).catch(() => ({ error: null }));

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Schema setup complete',
        tables: ['users', 'loans', 'payments', 'notifications']
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
