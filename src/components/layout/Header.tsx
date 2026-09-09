import { Bell, Search, Menu, Settings, Sparkles, Building2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { APP_NAME } from "@/constants";
import { getCustomers, getSession } from "@/lib/storage";
import { getCitizenRecords } from "@/lib/citizenStorage";
import { getBobCustomers } from "@/lib/bobStorage";
import { getDaysUntilBirthday } from "@/lib/utils";
import type { Customer } from "@/types";
import type { CitizenServiceRecord } from "@/types/citizen";
import type { BobCustomerRecord } from "@/types/bob";
import logoImg from "@/assets/sk-logo.png";
import CitizenSettingsModal from "@/components/citizen/CitizenSettingsModal";
import CitizenReceiptModal from "@/components/citizen/CitizenReceiptModal";
import BobReceiptModal from "@/components/bob/BobReceiptModal";

interface HeaderProps {
  onMenuToggle: () => void;
  sidebarCollapsed: boolean;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const [search, setSearch] = useState("");
  const [boiResults, setBoiResults] = useState<Customer[]>([]);
  const [citizenResults, setCitizenResults] = useState<CitizenServiceRecord[]>([]);
  const [bobResults, setBobResults] = useState<BobCustomerRecord[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [selectedCitizenReceipt, setSelectedCitizenReceipt] = useState<CitizenServiceRecord | null>(null);
  const [selectedBobReceipt, setSelectedBobReceipt] = useState<BobCustomerRecord | null>(null);
  const navigate = useNavigate();
  const session = getSession();
  const isCitizenTenant = session?.tenantCode === "new_csp" || session?.username === "abul";
  const isBobTenant = session?.tenantCode === "bob_csp" || session?.username === "bob";

  const handleSearch = (val: string) => {
    setSearch(val);
    if (val.trim().length < 2) {
      setBoiResults([]);
      setCitizenResults([]);
      setBobResults([]);
      setShowResults(false);
      return;
    }
    const lower = val.toLowerCase();

    if (isBobTenant) {
      const records = getBobCustomers();
      const found = records.filter(r =>
        r.customerName.toLowerCase().includes(lower) ||
        r.mobile.includes(val) ||
        r.accountNo.toLowerCase().includes(lower) ||
        r.cifNo.toLowerCase().includes(lower) ||
        String(r.slNo).includes(val)
      ).slice(0, 6);
      setBobResults(found);
    } else if (isCitizenTenant) {
      const records = getCitizenRecords();
      const found = records.filter(r =>
        r.customerName.toLowerCase().includes(lower) ||
        r.contactNo.includes(val) ||
        r.serviceType.toLowerCase().includes(lower) ||
        r.appNumber.toLowerCase().includes(lower) ||
        String(r.serialNo).includes(val)
      ).slice(0, 6);
      setCitizenResults(found);
    } else {
      const customers = getCustomers();
      const found = customers.filter(c =>
        c.name.toLowerCase().includes(lower) ||
        c.accountNumber.includes(val) ||
        c.mobile.includes(val) ||
        c.refNumber.toLowerCase().includes(lower)
      ).slice(0, 6);
      setBoiResults(found);
    }

    setShowResults(true);
  };

  const upcomingBirthdays = !isCitizenTenant && !isBobTenant
    ? getCustomers().filter(c => getDaysUntilBirthday(c.dob) <= 3).length
    : 0;

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 h-14 flex items-center px-4 gap-4">
      <button onClick={onMenuToggle} className="text-slate-500 hover:text-slate-800 transition-colors md:hidden">
        <Menu size={20} />
      </button>

      <div className="flex-1 flex items-center gap-2 relative max-w-lg">
        <Search size={16} className="absolute left-3 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder={
            isBobTenant
              ? "Search BOB customer, account, mobile, CIF..."
              : isCitizenTenant
              ? "Search applicant, mobile, ID, serial no..."
              : "Search customer, account, mobile, ref..."
          }
          value={search}
          onChange={e => handleSearch(e.target.value)}
          onBlur={() => setTimeout(() => setShowResults(false), 250)}
          onFocus={() => search.length >= 2 && setShowResults(true)}
          className={`w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 ${
            isBobTenant
              ? "focus:ring-orange-500/30 focus:border-orange-500"
              : "focus:ring-blue-500/30 focus:border-blue-500"
          } transition-all`}
        />

        {/* BOB Search Results Dropdown */}
        {showResults && isBobTenant && bobResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-slate-200 shadow-elevated z-50 overflow-hidden">
            {bobResults.map(r => (
              <button
                key={r.id}
                onClick={() => {
                  setShowResults(false);
                  setSearch("");
                  setSelectedBobReceipt(r);
                }}
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-orange-50/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {r.customerName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-800 truncate">
                      {r.customerName}
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                      SL {r.slNo} · A/C: {r.accountNo || "PENDING"} · {r.mobile}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-800">
                    BOB SLIP
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Citizen Search Results Dropdown */}
        {showResults && isCitizenTenant && citizenResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-slate-200 shadow-elevated z-50 overflow-hidden">
            {citizenResults.map(r => (
              <button
                key={r.id}
                onClick={() => {
                  setShowResults(false);
                  setSearch("");
                  setSelectedCitizenReceipt(r);
                }}
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {r.customerName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-800 truncate">
                      {r.customerName} <span className="text-xs text-blue-600 font-normal">({r.serviceType})</span>
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                      SL {r.serialNo} · {r.appNumber} · {r.contactNo}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${r.dueAmount === 0 ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                    {r.dueAmount === 0 ? "FULL PAID" : `DUE ₹${r.dueAmount}`}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* BOI Search Results Dropdown */}
        {showResults && !isCitizenTenant && !isBobTenant && boiResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-slate-200 shadow-elevated z-50 overflow-hidden">
            {boiResults.map(r => (
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

        {showResults &&
          search.length >= 2 &&
          (isBobTenant
            ? bobResults.length === 0
            : isCitizenTenant
            ? citizenResults.length === 0
            : boiResults.length === 0) && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-slate-200 shadow-elevated z-50 p-4 text-sm text-slate-500 text-center">
              No matching record found
            </div>
          )}
      </div>

      <div className="ml-auto flex items-center gap-3">
        {/* Quick Settings Icon Button for Citizen Hub */}
        {isCitizenTenant && (
          <button
            onClick={() => setSettingsModalOpen(true)}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-blue-600 transition-colors"
            title="Citizen Services Settings (Services, Stamp & Branding)"
          >
            <Settings size={18} />
          </button>
        )}

        {/* Birthday Bell for BOI CSP */}
        {!isCitizenTenant && !isBobTenant && (
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
        )}

        <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
          {isBobTenant ? (
            <div className="w-8 h-8 rounded-lg bg-orange-600 text-white font-black text-xs flex items-center justify-center shadow-sm">
              BOB
            </div>
          ) : (
            <img src={logoImg} alt="SK ONLINE" className="w-8 h-8 rounded-lg object-cover" />
          )}
          <div className="hidden sm:block">
            <div className="text-xs font-semibold text-slate-800">
              {isBobTenant ? "BANK OF BARODA" : APP_NAME}
            </div>
            <div className="text-[10px] text-slate-500">
              {isBobTenant ? "CSP Workspace" : isCitizenTenant ? "Digital Citizen Hub" : (session?.bankName || "Operator")}
            </div>
          </div>
        </div>
      </div>

      {/* Citizen Settings Modal */}
      {settingsModalOpen && (
        <CitizenSettingsModal
          open={settingsModalOpen}
          onClose={() => setSettingsModalOpen(false)}
        />
      )}

      {/* Citizen Receipt Modal */}
      {selectedCitizenReceipt && (
        <CitizenReceiptModal
          record={selectedCitizenReceipt}
          onClose={() => setSelectedCitizenReceipt(null)}
        />
      )}

      {/* BOB Receipt Modal */}
      {selectedBobReceipt && (
        <BobReceiptModal
          record={selectedBobReceipt}
          onClose={() => setSelectedBobReceipt(null)}
        />
      )}
    </header>
  );
}
