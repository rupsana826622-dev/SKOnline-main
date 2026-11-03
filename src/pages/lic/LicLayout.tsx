import { useState, useEffect, createContext, useContext } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import {
  Users, Award, Calendar, LogOut, RefreshCw, ChevronLeft, ChevronRight,
  ShieldCheck, ArrowRightLeft, Landmark, Menu, X, Sparkles
} from "lucide-react";
import { getSession, clearSession } from "@/lib/storage";
import { getLicMode, setLicMode } from "@/lib/licStorage";
import { cn } from "@/lib/utils";
import logoImg from "@/assets/sk-logo.png";

export interface LicContextValue {
  mode: "prospect" | "active";
  toggleMode: () => void;
  setMode: (m: "prospect" | "active") => void;
}

export const LicContext = createContext<LicContextValue>({
  mode: "prospect",
  toggleMode: () => {},
  setMode: () => {},
});

export function useLic() {
  return useContext(LicContext);
}

export default function LicLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mode, setModeState] = useState<"prospect" | "active">(getLicMode());

  // Auth Guard
  useEffect(() => {
    const sess = getSession();
    if (!sess) {
      navigate("/login", { replace: true });
      return;
    }
    if (sess.tenantCode !== "lic_workspace" && sess.role !== "lic") {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  // Keep mode in sync with route if on direct routes
  useEffect(() => {
    if (location.pathname.startsWith("/lic/prospects")) {
      setModeState("prospect");
      setLicMode("prospect");
    } else if (location.pathname.startsWith("/lic/policies") || location.pathname.startsWith("/lic/ledger")) {
      setModeState("active");
      setLicMode("active");
    }
  }, [location.pathname]);

  const setMode = (newMode: "prospect" | "active") => {
    setModeState(newMode);
    setLicMode(newMode);
  };

  const handleToggleMode = () => {
    const nextMode = mode === "prospect" ? "active" : "prospect";
    setMode(nextMode);

    if (location.pathname.includes("/dashboard")) {
      // Stay on dashboard, but mode switches cleanly
      navigate(`/lic/dashboard?mode=${nextMode}`, { replace: true });
    } else if (nextMode === "active") {
      navigate("/lic/policies");
    } else {
      navigate("/lic/prospects");
    }
  };

  const handleLogout = () => {
    clearSession();
    navigate("/login", { replace: true });
  };

  const navItems = [
    {
      label: "Target Prospect Hub",
      path: "/lic/prospects",
      icon: Users,
      modeTarget: "prospect" as const,
      badge: mode === "prospect" ? "Active Mode" : undefined,
    },
    {
      label: "Active Policy Manager",
      path: "/lic/policies",
      icon: Award,
      modeTarget: "active" as const,
      badge: mode === "active" ? "Active Mode" : undefined,
    },
    {
      label: "Premium Due Ledger",
      path: "/lic/ledger",
      icon: Calendar,
      modeTarget: "active" as const,
    },
  ];

  return (
    <LicContext.Provider value={{ mode, toggleMode: handleToggleMode, setMode }}>
      <div className="min-h-screen bg-slate-50 flex flex-col antialiased">
        {/* ── Top Global Header ── */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
            {/* Left: Branding & Portal Name */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#002b49] to-[#004e82] p-1.5 flex items-center justify-center shadow-md">
                  <img src={logoImg} alt="LIC" className="w-full h-full object-contain" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight leading-none">
                      LIC Insurance Portal
                    </span>
                    <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                      <Sparkles size={11} className="text-amber-600" />
                      Dual-Mode
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium leading-none mt-1">
                    SK ONLINE Financial Services
                  </p>
                </div>
              </div>
            </div>

            {/* Center / Right: Mode Indicator & Global Header Switcher */}
            <div className="flex items-center gap-3">
              {/* Prominent Global Mode Switcher Button */}
              <button
                type="button"
                onClick={handleToggleMode}
                className={cn(
                  "relative group flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 shadow-md",
                  mode === "prospect"
                    ? "bg-gradient-to-r from-emerald-600 to-teal-700 text-white hover:from-emerald-700 hover:to-teal-800 shadow-emerald-700/25 ring-2 ring-emerald-500/20"
                    : "bg-gradient-to-r from-blue-700 to-indigo-800 text-white hover:from-blue-800 hover:to-indigo-900 shadow-blue-700/25 ring-2 ring-blue-500/20"
                )}
                title="Switch between Prospect Hub and Active Policy Manager"
              >
                <ArrowRightLeft size={16} className="transition-transform group-hover:rotate-180 duration-300" />
                <span className="hidden xs:inline">
                  {mode === "prospect" ? "🔄 Switch to Active Policy Manager" : "🔄 Switch to Target Customer Hub"}
                </span>
                <span className="xs:hidden">
                  {mode === "prospect" ? "🔄 Active Policies" : "🔄 Target Leads"}
                </span>
              </button>

              {/* Current Mode Badge */}
              <div className="hidden lg:flex flex-col items-end">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Current Mode</span>
                <span
                  className={cn(
                    "text-xs font-extrabold px-2 py-0.5 rounded-md",
                    mode === "prospect"
                      ? "text-blue-700 bg-blue-50 border border-blue-200"
                      : "text-emerald-700 bg-emerald-50 border border-emerald-200"
                  )}
                >
                  {mode === "prospect" ? "Target Prospect Hub" : "Active Policy Ledger"}
                </span>
              </div>

              {/* Logout Button */}
              <button
                type="button"
                onClick={handleLogout}
                className="p-2 sm:px-3 sm:py-2 text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg border border-slate-200 flex items-center gap-1.5 transition-colors"
                title="Sign out of LIC Workspace"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>

          {/* Sub Navigation Bar */}
          <div className="bg-slate-100/90 border-t border-slate-200 px-4 sm:px-8">
            <div className="max-w-7xl mx-auto flex items-center gap-1 sm:gap-2 overflow-x-auto py-1.5 scrollbar-none">
              {navItems.map(item => {
                const isActive =
                  location.pathname === item.path ||
                  (item.path === "/lic/prospects" && location.pathname === "/lic/dashboard" && mode === "prospect") ||
                  (item.path === "/lic/policies" && location.pathname === "/lic/dashboard" && mode === "active");

                const Icon = item.icon;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMode(item.modeTarget)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all",
                      isActive
                        ? "bg-white text-blue-900 shadow-xs border border-slate-200/80"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                    )}
                  >
                    <Icon size={14} className={isActive ? "text-blue-700" : "text-slate-500"} />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </header>

        {/* ── Mobile Menu Slide-over ── */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex">
            <div className="w-64 bg-white h-full p-4 flex flex-col shadow-xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
                <span className="font-bold text-sm text-slate-800">Menu</span>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-md text-slate-500 hover:bg-slate-100"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-1 flex-1">
                {navItems.map(item => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => {
                        setMode(item.modeTarget);
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      <Icon size={16} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50 mt-auto border border-red-200"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
            <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
          </div>
        )}

        {/* ── Main Content Outlet ── */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-150">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="py-3 px-6 text-center text-xs text-slate-400 border-t border-slate-200 bg-white">
          LIC Insurance Management System · Powered by SK ONLINE
        </footer>
      </div>
    </LicContext.Provider>
  );
}

