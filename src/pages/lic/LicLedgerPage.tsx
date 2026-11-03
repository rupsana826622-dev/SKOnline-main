import { useState, useEffect, useMemo } from "react";
import {
  Calendar, CheckCircle2, AlertTriangle, Clock, Search, Filter,
  IndianRupee, MessageCircle, RefreshCw, Eye, Award
} from "lucide-react";
import { toast } from "sonner";
import {
  LicActivePolicy,
  fetchLicActivePolicies,
} from "@/lib/licStorage";
import MarkPremiumPaidModal from "./components/MarkPremiumPaidModal";
import PolicyProfileModal from "./components/PolicyProfileModal";

export default function LicLedgerPage() {
  const [policies, setPolicies] = useState<LicActivePolicy[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter tabs: "all" | "this_month" | "quarterly" | "lapsed"
  const [ledgerFilter, setLedgerFilter] = useState<"all" | "this_month" | "quarterly" | "lapsed">("this_month");
  const [searchQuery, setSearchQuery] = useState("");

  const [markPaidPolicy, setMarkPaidPolicy] = useState<LicActivePolicy | null>(null);
  const [profilePolicy, setProfilePolicy] = useState<LicActivePolicy | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchLicActivePolicies();
      setPolicies(data);
    } catch (err) {
      console.error("Failed to load policies for ledger:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  // Metrics for the Ledger
  const ledgerMetrics = useMemo(() => {
    const total = policies.length;
    let dueThisMonthCount = 0;
    let quarterlyDuesCount = 0;
    let lapsedCount = 0;
    let pendingCollectionTotal = 0;

    policies.forEach(p => {
      if (!p.next_premium_date) return;
      const d = new Date(p.next_premium_date);

      if (p.next_premium_date < todayStr) {
        lapsedCount++;
        pendingCollectionTotal += p.premium_amount || 0;
      }

      if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
        dueThisMonthCount++;
      }

      const diffDays = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays <= 90) {
        quarterlyDuesCount++;
      }
    });

    return {
      total,
      dueThisMonthCount,
      quarterlyDuesCount,
      lapsedCount,
      pendingCollectionTotal,
    };
  }, [policies, todayStr, currentYear, currentMonth]);

  // Filtered Ledger List
  const filteredLedger = useMemo(() => {
    return policies.filter(p => {
      if (!p.next_premium_date) return false;
      const dueDate = new Date(p.next_premium_date);

      if (ledgerFilter === "this_month") {
        const isThisMonth =
          dueDate.getFullYear() === currentYear && dueDate.getMonth() === currentMonth;
        if (!isThisMonth) return false;
      } else if (ledgerFilter === "quarterly") {
        const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 0 || diffDays > 90) return false;
      } else if (ledgerFilter === "lapsed") {
        if (p.next_premium_date >= todayStr) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const numMatch = p.policy_number?.toLowerCase().includes(q);
        const nameMatch = p.customer_name?.toLowerCase().includes(q);
        const mobileMatch = p.mobile?.toLowerCase().includes(q);
        const planMatch = p.plan_and_table_no?.toLowerCase().includes(q);
        return numMatch || nameMatch || mobileMatch || planMatch;
      }

      return true;
    });
  }, [policies, ledgerFilter, searchQuery, todayStr, currentYear, currentMonth]);

  const handleWhatsAppReminder = (p: LicActivePolicy) => {
    const mobile = (p.whatsapp_number || p.mobile || "").replace(/\D/g, "");
    if (!mobile) {
      toast.error("No valid contact number.");
      return;
    }
    const msg = encodeURIComponent(
      `Dear ${p.customer_name},\nReminder regarding LIC Policy #${p.policy_number} (${p.plan_and_table_no || "LIC Plan"}).\nPremium Due Date: ${p.next_premium_date}\nAmount Due: ₹${p.premium_amount?.toLocaleString("en-IN") || "0"} (${p.mode_of_premium}).\nPlease remit at your earliest to ensure uninterrupted life cover. Thank you!`
    );
    window.open(`https://wa.me/91${mobile}?text=${msg}`, "_blank");
  };

  const getDueBadge = (dueDateStr: string) => {
    const isLapsed = dueDateStr < todayStr;
    const isToday = dueDateStr === todayStr;

    if (isLapsed) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-800 border border-red-200">
          <AlertTriangle size={12} />
          Lapsed / Overdue
        </span>
      );
    }
    if (isToday) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
          <Clock size={12} />
          Due Today
        </span>
      );
    }

    const d = new Date(dueDateStr);
    const diffDays = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
        In {diffDays} days
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Premium Due Ledger
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time tracking of upcoming installments, lapsed accounts, and automated renewal date advancing.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          className="self-start sm:self-auto p-2.5 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs transition-colors flex items-center gap-2 text-xs font-bold"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          <span>Sync Ledger</span>
        </button>
      </div>

      {/* ── Metrics Summary ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Due This Month</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-blue-700 mt-2">
            {ledgerMetrics.dueThisMonthCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Calendar month collections</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Quarterly Dues</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-indigo-700 mt-2">
            {ledgerMetrics.quarterlyDuesCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Within next 90 days</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Lapsed / Overdue</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-red-600 mt-2">
            {ledgerMetrics.lapsedCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Past due date requiring recovery</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Overdue Volume</span>
          <div className="text-xl sm:text-2xl font-extrabold text-red-700 mt-2">
            ₹{ledgerMetrics.pendingCollectionTotal.toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Accumulated lapsed premiums</div>
        </div>
      </div>

      {/* ── Tabbed Filters & Search Bar ── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {(
            [
              { id: "this_month", label: "Due This Month" },
              { id: "quarterly", label: "Quarterly Dues (90d)" },
              { id: "lapsed", label: "Lapsed / Overdue" },
              { id: "all", label: "All Upcoming Dues" },
            ] as const
          ).map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setLedgerFilter(tab.id)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                ledgerFilter === tab.id
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search ledger..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg outline-none"
          />
        </div>
      </div>

      {/* ── Ledger Table ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Policy No</th>
                <th className="py-3 px-4">Policyholder & Contact</th>
                <th className="py-3 px-4">Plan Name</th>
                <th className="py-3 px-4">Mode</th>
                <th className="py-3 px-4">Premium Due Amount</th>
                <th className="py-3 px-4">Next Due Date</th>
                <th className="py-3 px-4">Urgency</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredLedger.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <Calendar size={22} />
                      </div>
                      <p className="font-semibold text-slate-600">No premium dues in this category</p>
                      <p className="text-xs text-slate-400">
                        All policyholders are up-to-date or match criteria for other filters.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLedger.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Policy No */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-xs">
                      {p.policy_number}
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{p.customer_name}</div>
                      <div className="text-slate-500 text-[11px]">Ph: {p.mobile}</div>
                    </td>

                    {/* Plan */}
                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      {p.plan_and_table_no || "LIC Plan"}
                    </td>

                    {/* Mode */}
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px] border border-slate-200">
                        {p.mode_of_premium}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 font-extrabold text-blue-900 text-sm">
                      ₹{p.premium_amount?.toLocaleString("en-IN") || "0"}
                    </td>

                    {/* Due Date */}
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {p.next_premium_date}
                    </td>

                    {/* Urgency */}
                    <td className="py-3.5 px-4">
                      {getDueBadge(p.next_premium_date)}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setMarkPaidPolicy(p)}
                          className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                        >
                          <CheckCircle2 size={13} />
                          <span>Mark Paid</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleWhatsAppReminder(p)}
                          title="WhatsApp Reminder"
                          className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-200"
                        >
                          <MessageCircle size={15} />
                        </button>

                        <button
                          type="button"
                          onClick={() => setProfilePolicy(p)}
                          title="View Profile"
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                        >
                          <Eye size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <MarkPremiumPaidModal
        policy={markPaidPolicy}
        open={!!markPaidPolicy}
        onClose={() => setMarkPaidPolicy(null)}
        onSuccess={(id, newDueDate) => {
          setPolicies(prev =>
            prev.map(p =>
              p.id === id ? { ...p, next_premium_date: newDueDate, premium_status: "paid" } : p
            )
          );
        }}
      />

      <PolicyProfileModal
        policy={profilePolicy}
        open={!!profilePolicy}
        onClose={() => setProfilePolicy(null)}
        onMarkPaid={p => setMarkPaidPolicy(p)}
      />
    </div>
  );
}

