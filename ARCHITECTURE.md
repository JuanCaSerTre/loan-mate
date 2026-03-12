# LoanMate — Architecture Guide

## 📐 Project Structure

```
src/
├── config/                    # App-wide configuration
│   ├── constants.ts           # Design tokens, auth rules, limits, enums
│   └── index.ts               # Environment-aware config (Supabase, API, features)
│
├── models/                    # Data models & validation
│   ├── schemas.ts             # Zod schemas for all entities + inferred types
│   └── index.ts               # Re-exports
│
├── types/                     # TypeScript interfaces (legacy, compatible)
│   ├── loan.ts                # User, Loan, Payment, Notification interfaces
│   └── supabase.ts            # Auto-generated Supabase types (when connected)
│
├── services/                  # API / business logic layer
│   ├── api/
│   │   ├── client.ts          # HTTP/Supabase client with retries & error handling
│   │   ├── authService.ts     # Phone auth, OTP, session management
│   │   ├── loanService.ts     # Loan CRUD operations
│   │   ├── paymentService.ts  # Payment CRUD operations
│   │   ├── notificationService.ts  # In-app + push notifications
│   │   └── userService.ts     # User lookup & profile management
│   └── index.ts               # Barrel export for all services
│
├── hooks/                     # Custom React hooks
│   ├── useAuth.ts             # Auth state & actions
│   ├── useLoans.ts            # Loan data & mutations
│   ├── usePayments.ts         # Payment data & mutations
│   ├── useNotifications.ts    # Notification feed management
│   ├── useCountdown.ts        # Reusable countdown timer (OTP resend)
│   ├── use-mobile.ts          # Responsive detection
│   └── index.ts               # Barrel export
│
├── context/                   # React Context (global state)
│   └── AppContext.tsx          # Centralized app state & navigation
│
├── data/                      # Mock data (development only)
│   └── mockData.ts            # Seed data for users, loans, payments, notifications
│
├── lib/                       # Utility functions
│   ├── utils.ts               # cn() – Tailwind class merging
│   ├── formatters.ts          # Currency, date, phone, percentage formatting
│   ├── calculations.ts        # Loan math: interest, progress, balances, due dates
│   └── validators.ts          # Phone, OTP, amount validation helpers
│
├── components/
│   ├── screens/               # Full-screen views (one per app screen)
│   │   ├── SplashScreen.tsx
│   │   ├── LoginScreen.tsx
│   │   ├── OnboardingScreen.tsx
│   │   ├── DashboardScreen.tsx
│   │   ├── LoansScreen.tsx
│   │   ├── CreateLoanScreen.tsx
│   │   ├── LoanRequestScreen.tsx
│   │   ├── LoanDetailsScreen.tsx
│   │   ├── RegisterPaymentScreen.tsx
│   │   ├── NotificationsScreen.tsx
│   │   └── ProfileScreen.tsx
│   │
│   ├── shared/                # Reusable app-specific components
│   │   ├── AvatarBadge.tsx
│   │   ├── BottomNav.tsx
│   │   └── LoanCard.tsx
│   │
│   ├── ui/                    # ShadCN/Radix primitives (generic)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── progress.tsx
│   │   └── ... (40+ components)
│   │
│   ├── LoanMateApp.tsx        # Root app shell (navigation + transitions)
│   └── home.tsx               # Mobile frame wrapper
│
├── App.tsx                    # Route definitions
├── main.tsx                   # React DOM entry point
└── index.css                  # Global styles + Tailwind directives
```

---

## 🏗 Architecture Layers

### 1. Config Layer (`config/`)
Centralizes all magic numbers, design tokens, and environment settings.
- **constants.ts**: Colors, fonts, auth rules, loan limits, nav screens
- **index.ts**: Supabase URL/key, API base URL, feature flags — reads from env vars

### 2. Models Layer (`models/`)
Zod schemas provide runtime validation + TypeScript types from a single source.
- **schemas.ts**: `UserSchema`, `LoanSchema`, `PaymentSchema`, `NotificationSchema`
- Exports inferred types: `UserModel`, `LoanModel`, etc.
- Form-specific schemas: `CreateLoanSchema`, `CreatePaymentSchema`, `PhoneLoginSchema`

### 3. Services Layer (`services/api/`)
All data operations live here. **Screens never call APIs directly.**
- Each service is a class with async methods returning `ApiResponse<T>`
- Currently wraps mock data; **swap internals to Supabase when connected**
- `client.ts`: Generic HTTP client with timeouts, retries, auth headers
- Service classes: `AuthService`, `LoanService`, `PaymentService`, `NotificationService`, `UserService`

### 4. Hooks Layer (`hooks/`)
Bridges services → React components.
- Each hook manages `isLoading`, `error`, and `data` state
- Components call hooks, hooks call services
- `useCountdown`: Reusable timer for OTP resend

### 5. Context Layer (`context/`)
Global state management via React Context.
- `AppContext.tsx`: Navigation state, current user, loans/payments/notifications
- Used by screens for screen switching and shared data
- Will evolve: service hooks will handle data fetching, context handles navigation

### 6. Components Layer (`components/`)
Three tiers:
- **screens/**: Full views, one per app screen. Consume context + hooks.
- **shared/**: App-specific reusable components (LoanCard, AvatarBadge, BottomNav)
- **ui/**: Generic ShadCN primitives — no business logic

---

## 🔄 Data Flow

```
User Action → Screen Component → Hook (useLoans, etc.) → Service (loanService)
     ↑              ↓                    ↓                      ↓
     └── UI update ← State update ← ApiResponse<T> ← Mock Data / Supabase
```

1. User taps a button in a **Screen**
2. Screen calls a **Hook** method (e.g., `createLoan()`)
3. Hook calls the **Service** (e.g., `loanService.createLoan()`)
4. Service returns typed `ApiResponse<T>`
5. Hook updates its state → React re-renders the screen

---

## 🔌 Backend Integration Plan (Supabase)

When Supabase is connected:

1. **Generate types**: `npm run types:supabase` → populates `src/types/supabase.ts`
2. **Create Supabase client**: Add to `services/api/client.ts`
3. **Swap service internals**: Replace mock data with Supabase queries in each service
4. **Auth**: Replace mock OTP with `supabase.auth.signInWithOtp()` + `verifyOtp()`
5. **RLS Policies**: Enable row-level security on all tables
6. **Edge Functions**: Push notifications via Firebase Cloud Messaging
7. **Realtime**: Subscribe to loan/payment status changes

**No screen or hook code needs to change** — only service internals.

---

## 📱 Screen Navigation

Navigation is state-driven via `AppContext.navigate(screen)`:

```
Splash → Login → Onboarding → Dashboard
                                  ├── Loans → LoanDetails → RegisterPayment
                                  ├── CreateLoan → LoanRequest (borrower)
                                  ├── Notifications
                                  └── Profile
```

---

## 🎨 Design System

| Token | Value | Usage |
|-------|-------|-------|
| Background | `#0D1B2A` | Deep navy, all screens |
| Surface | `#1A2B3C` | Card backgrounds |
| Primary | `#00C9A7` | CTAs, progress, active |
| Warning | `#FFB347` | Pending states |
| Danger | `#FF6B6B` | Errors, rejections |
| Display Font | Syne 800 | Amounts, headings |
| Body Font | Manrope 400/600 | UI text |
| Mono Font | JetBrains Mono | Numbers, OTP |

---

## 🧪 Testing Strategy

- **Models**: Unit test Zod schemas with valid/invalid data
- **Services**: Unit test with mocked responses
- **Hooks**: Test with React Testing Library
- **Screens**: Integration tests for user flows
- **E2E**: Cypress/Playwright for critical paths (auth, create loan, payment)
