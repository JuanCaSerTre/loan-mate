-- Enable Realtime for loans, payments, and notifications tables
-- This allows clients to subscribe to changes via Supabase Realtime

-- Enable realtime on loans table
ALTER PUBLICATION supabase_realtime ADD TABLE loans;

-- Enable realtime on payments table
ALTER PUBLICATION supabase_realtime ADD TABLE payments;

-- Enable realtime on notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
