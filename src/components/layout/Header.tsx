import { Bell, Search, Menu } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { APP_NAME } from "@/constants";
import { getCustomers } from "@/lib/storage";
import { getDaysUntilBirthday } from "@/lib/utils";
import type { Customer } from "@/types";
import logoImg from "@/assets/sk-logo.png";

interface HeaderProps {
  onMenuToggle: () => void;
  sidebarCollapsed: boolean;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Customer[]>([]);
  const [showResults, setShowResults] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (val: string) => {
    setSearch(val);
    if (val.trim().length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }
    const lower = val.toLowerCase();
    const customers = getCustomers();
    const found = customers.filter(c =>
      c.name.toLowerCase().includes(lower) ||
      c.accountNumber.includes(val) ||
      c.mobile.includes(val) ||
      c.refNumber.toLowerCase().includes(lower)
    ).slice(0, 6);
    setResults(found);
    setShowResults(true);
  };

  const upcomingBirthdays = getCustomers().filter(c => {
    const d = getDaysUntilBirthday(c.dob);
    return d <= 3;
  }).length;

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 h-14 flex items-center px-4 gap-4">
      <button onClick={onMenuToggle} className="text-slate-500 hover:text-slate-800 transition-colors md:hidden">
        <Menu size={20} />
      </button>

      <div className="flex-1 flex items-center gap-2 relative max-w-lg">
        <Search size={16} className="absolute left-3 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search customer, account, mobile, ref..."
          value={search}
          onChange={e => handleSearch(e.target.value)}
          onBlur={() => setTimeout(() => setShowResults(false), 200)}
          onFocus={() => search.length >= 2 && setShowResults(true)}
          className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
        />
        {showResults && results.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-slate-200 shadow-elevated z-50 overflow-hidden">
            {results.map(r => (
              <button
                key={r.id}
                onClick={() => {
                  setShowResults(false);
                  setSearch("");
                  navigate("/customers");
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {r.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-800 truncate">{r.name}</div>
                  <div className="text-xs text-slate-500 truncate">{r.accountNumber} · {r.mobile}</div>
                </div>
              </button>
            ))}
          </div>
        )}
        {showResults && search.length >= 2 && results.length === 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-slate-200 shadow-elevated z-50 p-4 text-sm text-slate-500 text-center">
            No customer found
          </div>
        )}
      </div>

      <div className="ml-auto flex items-center gap-3">
        <button
          onClick={() => navigate("/dashboard")}
          className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
          title="Birthday Reminders"
        >
          <Bell size={18} />
          {upcomingBirthdays > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full animate-pulse2" />
          )}
        </button>

        <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
          <img src={logoImg} alt="SK ONLINE" className="w-8 h-8 rounded-lg object-cover" />
          <div className="hidden sm:block">
            <div className="text-xs font-semibold text-slate-800">{APP_NAME}</div>
            <div className="text-[10px] text-slate-500">Operator</div>
          </div>
        </div>
      </div>
    </header>
  );
}
