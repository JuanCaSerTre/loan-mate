import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Get today's date and tomorrow's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);

    // Find all loans with payments due tomorrow (from active loans)
    const { data: loans, error: loansError } = await supabase
      .from('loans')
      .select('*')
      .eq('status', 'active')
      .gte('due_date', today.toISOString())
      .lte('due_date', tomorrow.toISOString());

    if (loansError) {
      throw loansError;
    }

    if (!loans || loans.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No reminders to send' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // For each loan, check if a notification already exists for today
    const notifications = [];
    for (const loan of loans) {
      const { data: existingNotif, error: checkError } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', loan.borrower_id)
        .eq('type', 'upcoming_payment_reminder')
        .eq('loan_id', loan.id)
        .gte('created_at', today.toISOString());

      if (checkError) {
        console.error('Error checking existing notification:', checkError);
        continue;
      }

      // Only send if no reminder exists today
      if (!existingNotif || existingNotif.length === 0) {
        notifications.push({
          user_id: loan.borrower_id,
          type: 'upcoming_payment_reminder',
          title: 'Payment Due Tomorrow',
          description: `You have a payment of $${loan.loan_amount} due tomorrow for ${loan.lender_name}`,
          loan_id: loan.id,
          is_read: false,
          created_at: new Date().toISOString(),
        });
      }
    }

    if (notifications.length === 0) {
      return new Response(
        JSON.stringify({ message: 'All reminders already sent today' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Insert all notifications
    const { error: insertError } = await supabase
      .from('notifications')
      .insert(notifications);

    if (insertError) {
      throw insertError;
    }

    return new Response(
      JSON.stringify({ message: `Sent ${notifications.length} payment reminders` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error in send-payment-reminders:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
