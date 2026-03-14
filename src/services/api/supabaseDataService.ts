/**
 * LoanMate — Supabase Data Service
 * All reads/writes for users, loans, payments, notifications.
 */
import { supabase } from "@/lib/supabase";
import { User, Loan, Payment, Notification } from "@/types/loan";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Map a DB user row → app User */
function dbUserToUser(row: {
  id: string;
  name: string;
  phone_number: string;
  avatar_url: string | null;
  created_at: string;
  is_premium?: boolean | null;
  stripe_customer_id?: string | null;
  subscription_status?: string | null;
  subscription_id?: string | null;
  subscription_expiry?: string | null;
  subscription_plan?: string | null;
}): User {
  return {
    id: row.id,
    name: row.name,
    phone_number: row.phone_number,
    avatar: row.avatar_url ?? undefined,
    created_at: row.created_at,
    is_premium: row.is_premium ?? false,
    stripe_customer_id: row.stripe_customer_id ?? undefined,
    subscription_status: (row.subscription_status as User["subscription_status"]) ?? "free",
    subscription_id: row.subscription_id ?? undefined,
    subscription_expiry: row.subscription_expiry ?? undefined,
    subscription_plan: (row.subscription_plan as User["subscription_plan"]) ?? undefined,
  };
}

/** Map a DB loan row → app Loan (requires lender+borrower names/avatars joined separately) */
function dbLoanToLoan(
  row: {
    id: string;
    lender_id: string;
    borrower_id: string | null;
    borrower_phone: string;
    loan_amount: number;
    interest_rate: number;
    total_amount: number;
    number_of_payments: number;
    payment_frequency: "weekly" | "biweekly" | "monthly";
    start_date: string;
    due_date: string;
    status: "pending" | "active" | "completed" | "declined";
    created_at: string;
  },
  lenderName: string,
  borrowerName: string,
  lenderAvatar?: string,
  borrowerAvatar?: string
): Loan {
  return {
    loan_id: row.id,
    lender_id: row.lender_id,
    borrower_id: row.borrower_id ?? "",
    borrower_phone: row.borrower_phone,
    lender_name: lenderName,
    borrower_name: borrowerName,
    lender_avatar: lenderAvatar,
    borrower_avatar: borrowerAvatar,
    loan_amount: Number(row.loan_amount),
    interest_rate: Number(row.interest_rate),
    total_amount: Number(row.total_amount),
    number_of_payments: row.number_of_payments,
    payment_frequency: row.payment_frequency,
    start_date: row.start_date,
    due_date: row.due_date,
    status: row.status,
    created_at: row.created_at,
  };
}

/** Map a DB payment row → app Payment */
function dbPaymentToPayment(row: {
  id: string;
  loan_id: string;
  amount: number;
  created_by_user_id: string;
  status: "pending_confirmation" | "confirmed" | "rejected";
  note: string | null;
  created_at: string;
  payment_date: string;
}): Payment {
  return {
    payment_id: row.id,
    loan_id: row.loan_id,
    amount: Number(row.amount),
    created_by_user: row.created_by_user_id,
    status: row.status,
    note: row.note ?? undefined,
    created_at: row.created_at,
    payment_date: row.payment_date,
  };
}

/** Map a DB notification row → app Notification */
function dbNotifToNotif(row: {
  id: string;
  type: string;
  title: string;
  description: string | null;
  loan_id: string | null;
  payment_id: string | null;
  is_read: boolean;
  created_at: string;
}): Notification {
  // Map DB notification types to app notification types
  const typeMap: Record<string, Notification["type"]> = {
    loan_request_received: "loan_request",
    loan_accepted: "loan_accepted",
    loan_declined: "loan_declined",
    payment_registered: "payment_registered",
    payment_confirmed: "payment_confirmed",
    payment_rejected: "payment_rejected",
    upcoming_payment_reminder: "payment_reminder",
  };

  return {
    id: row.id,
    type: typeMap[row.type] ?? "loan_request",
    title: row.title,
    message: row.description ?? "",
    loan_id: row.loan_id ?? undefined,
    payment_id: row.payment_id ?? undefined,
    read: row.is_read,
    created_at: row.created_at,
  };
}

// ─── User Operations ──────────────────────────────────────────────────────────

/** Find user by phone number. Returns null if not found. */
export async function getUserByPhone(phone: string): Promise<User | null> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("phone_number", phone)
    .single();

  if (error || !data) return null;
  return dbUserToUser(data);
}

/** Find user by id. Returns null if not found. */
export async function getUserById(id: string): Promise<User | null> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return dbUserToUser(data);
}

/** Create a new user profile in Supabase. */
export async function createUser(user: {
  name: string;
  phone_number: string;
  avatar?: string;
}): Promise<User | null> {
  const { data, error } = await supabase
    .from("users")
    .insert({
      name: user.name,
      phone_number: user.phone_number,
      avatar_url: user.avatar ?? null,
    })
    .select()
    .single();

  if (error || !data) {
    console.error("[createUser] error:", error);
    return null;
  }
  return dbUserToUser(data);
}

/** Get all users (for contact lookup). */
export async function getAllUsers(): Promise<User[]> {
  const { data, error } = await supabase.from("users").select("*");
  if (error || !data) return [];
  return data.map(dbUserToUser);
}

// ─── Loan Operations ──────────────────────────────────────────────────────────

/** Fetch all loans where user is lender or borrower. Also fetches participant names. */
export async function getLoansForUser(userId: string): Promise<Loan[]> {
  const { data, error } = await supabase
    .from("loans")
    .select("*")
    .or(`lender_id.eq.${userId},borrower_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("[getLoansForUser] error:", error);
    return [];
  }

  // Collect all unique user IDs to batch-fetch names
  const userIds = new Set<string>();
  data.forEach((l) => {
    userIds.add(l.lender_id);
    if (l.borrower_id) userIds.add(l.borrower_id);
  });

  const { data: users } = await supabase
    .from("users")
    .select("id, name, avatar_url")
    .in("id", Array.from(userIds));

  const userMap = new Map<string, { name: string; avatar_url: string | null }>();
  (users ?? []).forEach((u) => userMap.set(u.id, u));

  return data.map((row) => {
    const lender = userMap.get(row.lender_id);
    const borrower = row.borrower_id ? userMap.get(row.borrower_id) : null;
    return dbLoanToLoan(
      row,
      lender?.name ?? "Unknown",
      borrower?.name ?? "Unknown",
      lender?.avatar_url ?? undefined,
      borrower?.avatar_url ?? undefined
    );
  });
}

/** Create a loan in Supabase. Returns the created Loan or null. */
export async function createLoan(params: {
  lender_id: string;
  borrower_id: string;
  borrower_phone: string;
  loan_amount: number;
  interest_rate: number;
  total_amount: number;
  number_of_payments: number;
  payment_frequency: "weekly" | "biweekly" | "monthly";
  start_date: string;
  due_date: string;
  lender_name: string;
  borrower_name: string;
  lender_avatar?: string;
  borrower_avatar?: string;
}): Promise<Loan | null> {
  const { data, error } = await supabase
    .from("loans")
    .insert({
      lender_id: params.lender_id,
      borrower_id: params.borrower_id,
      borrower_phone: params.borrower_phone,
      loan_amount: params.loan_amount,
      interest_rate: params.interest_rate,
      total_amount: params.total_amount,
      number_of_payments: params.number_of_payments,
      payment_frequency: params.payment_frequency,
      start_date: params.start_date,
      due_date: params.due_date,
      status: "pending",
    })
    .select()
    .single();

  if (error || !data) {
    console.error("[createLoan] error:", error);
    return null;
  }

  return dbLoanToLoan(
    data,
    params.lender_name,
    params.borrower_name,
    params.lender_avatar,
    params.borrower_avatar
  );
}

/** Update loan status in Supabase. */
export async function updateLoanStatus(
  loanId: string,
  status: "pending" | "active" | "completed" | "declined"
): Promise<boolean> {
  const { error } = await supabase
    .from("loans")
    .update({ status })
    .eq("id", loanId);

  if (error) {
    console.error("[updateLoanStatus] error:", error);
    return false;
  }
  return true;
}

// ─── Payment Operations ───────────────────────────────────────────────────────

/** Fetch all payments for loans where the user is a participant. */
export async function getPaymentsForUser(userId: string): Promise<Payment[]> {
  // Get loan IDs where user participates
  const { data: loans } = await supabase
    .from("loans")
    .select("id")
    .or(`lender_id.eq.${userId},borrower_id.eq.${userId}`);

  if (!loans || loans.length === 0) return [];

  const loanIds = loans.map((l) => l.id);

  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .in("loan_id", loanIds)
    .order("created_at", { ascending: true });

  if (error || !data) {
    console.error("[getPaymentsForUser] error:", error);
    return [];
  }

  return data.map(dbPaymentToPayment);
}

/** Create a payment record in Supabase. */
export async function createPayment(params: {
  loan_id: string;
  amount: number;
  created_by_user_id: string;
  payment_date: string;
  note?: string;
}): Promise<Payment | null> {
  const { data, error } = await supabase
    .from("payments")
    .insert({
      loan_id: params.loan_id,
      amount: params.amount,
      created_by_user_id: params.created_by_user_id,
      payment_date: params.payment_date,
      note: params.note ?? null,
      status: "pending_confirmation",
    })
    .select()
    .single();

  if (error || !data) {
    console.error("[createPayment] error:", error);
    return null;
  }

  return dbPaymentToPayment(data);
}

/** Update payment status in Supabase. */
export async function updatePaymentStatus(
  paymentId: string,
  status: "pending_confirmation" | "confirmed" | "rejected"
): Promise<boolean> {
  const { error } = await supabase
    .from("payments")
    .update({ status })
    .eq("id", paymentId);

  if (error) {
    console.error("[updatePaymentStatus] error:", error);
    return false;
  }
  return true;
}

// ─── Notification Operations ──────────────────────────────────────────────────

/** Fetch all notifications for a user. */
export async function getNotificationsForUser(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("[getNotificationsForUser] error:", error);
    return [];
  }

  return data.map(dbNotifToNotif);
}

/** Insert a notification for a user. */
export async function createNotification(params: {
  user_id: string;
  type:
    | "loan_request_received"
    | "loan_accepted"
    | "loan_declined"
    | "payment_registered"
    | "payment_confirmed"
    | "payment_rejected"
    | "upcoming_payment_reminder";
  title: string;
  description: string;
  loan_id?: string;
  payment_id?: string;
}): Promise<void> {
  const { error } = await supabase.from("notifications").insert({
    user_id: params.user_id,
    type: params.type,
    title: params.title,
    description: params.description,
    loan_id: params.loan_id ?? null,
    payment_id: params.payment_id ?? null,
    is_read: false,
  });

  if (error) {
    console.error("[createNotification] error:", error);
  }
}

/** Mark a notification as read. */
export async function markNotificationRead(notifId: string): Promise<void> {
  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notifId);
}

/** Mark all notifications for a user as read. */
export async function markAllNotificationsRead(userId: string): Promise<void> {
  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId);
}
