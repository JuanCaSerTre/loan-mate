/**
 * LoanMate — Application Configuration
 * Environment-aware settings for API endpoints, feature flags, etc.
 */

interface AppConfig {
  supabase: {
    url: string;
    anonKey: string;
  };
  api: {
    baseUrl: string;
    timeout: number;
  };
  features: {
    pushNotifications: boolean;
    avatarUpload: boolean;
    interestRate: boolean;
  };
  environment: "development" | "staging" | "production";
}

const config: AppConfig = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || "",
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || "",
  },
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || "",
    timeout: 15000,
  },
  features: {
    pushNotifications: import.meta.env.VITE_ENABLE_PUSH !== "false", // Enabled by default
    avatarUpload: true,
    interestRate: true,
  },
  environment: (import.meta.env.MODE as AppConfig["environment"]) || "development",
};

export default config;
