import { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { getSession, getCustomers } from "@/lib/storage";
import { getDaysUntilBirthday } from "@/lib/utils";

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!getSession()) navigate("/login", { replace: true });
  }, [navigate]);

  const birthdayCount = getCustomers().filter(c => getDaysUntilBirthday(c.dob) <= 3).length;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} birthdayCount={birthdayCount} />
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${collapsed ? "ml-16" : "ml-64"}`}>
        <Header onMenuToggle={() => setCollapsed(!collapsed)} sidebarCollapsed={collapsed} />
        <main className="flex-1 p-4 md:p-6 animate-fade-in overflow-auto custom-scroll">
          <Outlet />
        </main>
        <footer className="py-2.5 px-6 text-center text-xs text-slate-400 border-t border-slate-200 bg-white/60">
          Powered by Digital Solutions — SK ONLINE CSP Portal
        </footer>
      </div>
    </div>
  );
}
