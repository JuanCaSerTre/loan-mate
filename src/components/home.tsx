import LoanMateApp from "@/components/LoanMateApp";

function Home() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#060D14]">
      {/* Mobile frame */}
      <div
        className="relative overflow-hidden bg-[#0D1B2A] shadow-2xl"
        style={{
          width: "430px",
          height: "932px",
          borderRadius: "44px",
          boxShadow: "0 0 80px rgba(0,201,167,0.08), 0 40px 100px rgba(0,0,0,0.8)",
        }}
      >
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-b-2xl z-50" />
        {/* App */}
        <div className="absolute inset-0 overflow-hidden">
          <LoanMateApp />
        </div>
      </div>
    </div>
  );
}

export default Home;
