import { useState, useEffect, useMemo } from "react";
import { Search, Truck, Package, CreditCard, CheckCircle, Clock } from "lucide-react";
import { getCustomers, updateCustomer } from "@/lib/storage";
import type { Customer } from "@/types";
import { toast } from "sonner";
import SEO from "@/components/common/SEO";

type DeliveryFilter = "All" | "Passbook Pending" | "ATM Pending" | "Fully Delivered";

export default function DeliveryTrackerPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<DeliveryFilter>("All");

  useEffect(() => {
    setCustomers(getCustomers());

    const handleSync = () => {
      setCustomers(getCustomers());
    };
    window.addEventListener("supabase-sync-complete", handleSync);
    return () => window.removeEventListener("supabase-sync-complete", handleSync);
  }, []);

  const toggle = (id: string, field: keyof Customer) => {
    const now = new Date().toISOString();
    const c = customers.find(c => c.id === id);
    if (!c) return;

    const updates: Partial<Customer> = {};
    if (field === "passbookIssued") {
      updates.passbookIssued = !c.passbookIssued;
      updates.passbookIssuedAt = updates.passbookIssued ? now : "";
      if (!updates.passbookIssued) { updates.passbookReceived = false; updates.passbookReceivedAt = ""; }
    } else if (field === "passbookReceived") {
      updates.passbookReceived = !c.passbookReceived;
      updates.passbookReceivedAt = updates.passbookReceived ? now : "";
    } else if (field === "atmIssued") {
      updates.atmIssued = !c.atmIssued;
      updates.atmIssuedAt = updates.atmIssued ? now : "";
      if (!updates.atmIssued) { updates.atmReceived = false; updates.atmReceivedAt = ""; }
    } else if (field === "atmReceived") {
      updates.atmReceived = !c.atmReceived;
      updates.atmReceivedAt = updates.atmReceived ? now : "";
    }

    updateCustomer(id, updates);
    setCustomers(getCustomers());
    toast.success("Delivery status updated.");
  };

  const filtered = useMemo(() => {
    const lower = search.toLowerCase();
    return customers.filter(c => {
      const match = !search || c.name.toLowerCase().includes(lower) || c.accountNumber.includes(search) || c.mobile.includes(search);
      const filterMatch = filter === "All" ||
        (filter === "Passbook Pending" && !c.passbookReceived) ||
        (filter === "ATM Pending" && !c.atmReceived) ||
        (filter === "Fully Delivered" && c.passbookReceived && c.atmReceived);
      return match && filterMatch;
    });
  }, [customers, search, filter]);

  const stats = {
    pbIssued: customers.filter(c => c.passbookIssued).length,
    pbReceived: customers.filter(c => c.passbookReceived).length,
    atmIssued: customers.filter(c => c.atmIssued).length,
    atmReceived: customers.filter(c => c.atmReceived).length,
    fullyDone: customers.filter(c => c.passbookReceived && c.atmReceived).length,
  };

  const fmtDate = (iso: string) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <SEO title="Delivery Tracker" />
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Truck size={20} className="text-amber-600" />
          Delivery Tracker
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">Track passbook and ATM card delivery status</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Passbook Issued", value: stats.pbIssued, icon: Package, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Passbook Received", value: stats.pbReceived, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "ATM Issued", value: stats.atmIssued, icon: CreditCard, color: "text-violet-600", bg: "bg-violet-50" },
          { label: "ATM Received", value: stats.atmReceived, icon: CheckCircle, color: "text-teal-600", bg: "bg-teal-50" },
          { label: "Fully Delivered", value: stats.fullyDone, icon: Truck, color: "text-amber-600", bg: "bg-amber-50" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="sk-card p-4">
            <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mb-2`}>
              <Icon size={16} className={color} />
            </div>
            <div className={`text-2xl font-extrabold ${color}`}>{value}</div>
            <div className="text-xs text-slate-500 font-medium mt-0.5 leading-tight">{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="sk-card p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search customer, account, mobile..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(["All", "Passbook Pending", "ATM Pending", "Fully Delivered"] as DeliveryFilter[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                filter === f ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="sk-card overflow-hidden">
        <div className="overflow-x-auto custom-scroll">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Account No.</th>
                <th>Mobile</th>
                <th>Passbook Issued</th>
                <th>Passbook Received</th>
                <th>ATM Issued</th>
                <th>ATM Received</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td>
                    <div className="flex items-center gap-2 min-w-[140px]">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-slate-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {c.name.charAt(0)}
                      </div>
                      <span className="font-medium text-slate-800 text-sm">{c.name}</span>
                    </div>
                  </td>
                  <td><span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">{c.accountNumber}</span></td>
                  <td className="text-slate-600">{c.mobile}</td>

                  {/* Passbook Issued */}
                  <td>
                    <DeliveryToggle
                      checked={c.passbookIssued}
                      timestamp={c.passbookIssuedAt}
                      onToggle={() => toggle(c.id, "passbookIssued")}
                      label={c.passbookIssued ? fmtDate(c.passbookIssuedAt) : "Mark Issued"}
                    />
                  </td>

                  {/* Passbook Received */}
                  <td>
                    <DeliveryToggle
                      checked={c.passbookReceived}
                      timestamp={c.passbookReceivedAt}
                      onToggle={() => c.passbookIssued && toggle(c.id, "passbookReceived")}
                      label={c.passbookReceived ? fmtDate(c.passbookReceivedAt) : "Mark Received"}
                      disabled={!c.passbookIssued}
                    />
                  </td>

                  {/* ATM Issued */}
                  <td>
                    <DeliveryToggle
                      checked={c.atmIssued}
                      timestamp={c.atmIssuedAt}
                      onToggle={() => toggle(c.id, "atmIssued")}
                      label={c.atmIssued ? fmtDate(c.atmIssuedAt) : "Mark Issued"}
                    />
                  </td>

                  {/* ATM Received */}
                  <td>
                    <DeliveryToggle
                      checked={c.atmReceived}
                      timestamp={c.atmReceivedAt}
                      onToggle={() => c.atmIssued && toggle(c.id, "atmReceived")}
                      label={c.atmReceived ? fmtDate(c.atmReceivedAt) : "Mark Received"}
                      disabled={!c.atmIssued}
                    />
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-slate-400 py-10">No records match your filter.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function DeliveryToggle({
  checked, onToggle, label, disabled, timestamp,
}: {
  checked: boolean; onToggle: () => void;
  label: string; disabled?: boolean; timestamp?: string;
}) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
        checked
          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
          : disabled
          ? "bg-slate-50 text-slate-300 cursor-not-allowed"
          : "bg-slate-100 text-slate-600 hover:bg-blue-100 hover:text-blue-700"
      }`}
    >
      {checked ? <CheckCircle size={13} /> : <Clock size={13} />}
      <span className="whitespace-nowrap max-w-[90px] truncate">{label}</span>
    </button>
  );
}
