import { AnimatePresence, motion } from "framer-motion";
import { AppProvider, useApp } from "@/context/AppContext";
import BottomNav from "@/components/shared/BottomNav";
import SplashScreen from "@/components/screens/SplashScreen";
import LoginScreen from "@/components/screens/LoginScreen";
import OnboardingScreen from "@/components/screens/OnboardingScreen";
import DashboardScreen from "@/components/screens/DashboardScreen";
import LoansScreen from "@/components/screens/LoansScreen";
import CreateLoanScreen from "@/components/screens/CreateLoanScreen";
import LoanRequestScreen from "@/components/screens/LoanRequestScreen";
import LoanDetailsScreen from "@/components/screens/LoanDetailsScreen";
import RegisterPaymentScreen from "@/components/screens/RegisterPaymentScreen";
import NotificationsScreen from "@/components/screens/NotificationsScreen";
import ProfileScreen from "@/components/screens/ProfileScreen";
import { Toaster } from "sonner";

const NAV_SCREENS = ["dashboard", "loans", "notifications", "profile"];

function AppContent() {
  const { currentScreen } = useApp();
  const showNav = NAV_SCREENS.includes(currentScreen);

  const renderScreen = () => {
    switch (currentScreen) {
      case "splash": return <SplashScreen />;
      case "login": return <LoginScreen />;
      case "onboarding": return <OnboardingScreen />;
      case "dashboard": return <DashboardScreen />;
      case "loans": return <LoansScreen />;
      case "create-loan": return <CreateLoanScreen />;
      case "loan-request": return <LoanRequestScreen />;
      case "loan-details": return <LoanDetailsScreen />;
      case "register-payment": return <RegisterPaymentScreen />;
      case "notifications": return <NotificationsScreen />;
      case "profile": return <ProfileScreen />;
      default: return <DashboardScreen />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0D1B2A] overflow-hidden relative">
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentScreen}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0"
          >
            {renderScreen()}
          </motion.div>
        </AnimatePresence>
      </div>
      {showNav && <BottomNav />}
    </div>
  );
}

export default function LoanMateApp() {
  return (
    <AppProvider>
      <AppContent />
      <Toaster position="top-center" />
    </AppProvider>
  );
}
