import { useState, useEffect, useMemo } from "react";
import {
  Award, UserPlus, Phone, Calendar, IndianRupee, MessageCircle,
  Search, Filter, CheckCircle2, AlertCircle, Eye, Trash2, Edit, RefreshCw, Copy, Check, Clock, AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import {
  LicActivePolicy,
  fetchLicActivePolicies,
  deleteLicActivePolicy,
} from "@/lib/licStorage";
import DirectAddPolicyModal from "./components/DirectAddPolicyModal";
import PolicyProfileModal from "./components/PolicyProfileModal";
import MarkPremiumPaidModal from "./components/MarkPremiumPaidModal";

export default function LicPoliciesPage() {
  const [policies, setPolicies] = useState<LicActivePolicy[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Sub-tab: "policies" | "dues"
  const [activeSubTab, setActiveSubTab] = useState<"policies" | "dues">("policies");

  // Dues Sub-filter
  const [dueFilter, setDueFilter] = useState<"all" | "this_month" | "quarterly" | "lapsed">("all");

  // Search & Mode Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [modeFilter, setModeFilter] = useState<string>("all");

  // Modals
  const [directAddOpen, setDirectAddOpen] = useState(false);
  const [profilePolicy, setProfilePolicy] = useState<LicActivePolicy | null>(null);
  const [markPaidPolicy, setMarkPaidPolicy] = useState<LicActivePolicy | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchLicActivePolicies();
      setPolicies(data);
    } catch (err) {
      console.error("Failed to load active policies:", err);
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
  const currentMonth = today.getMonth(); // 0-indexed

  // Metrics
  const metrics = useMemo(() => {
    const total = policies.length;
    const totalSumAssured = policies.reduce((acc, p) => acc + (p.sum_assured || 0), 0);
    const totalPremium = policies.reduce((acc, p) => acc + (p.premium_amount || 0), 0);

    const upcomingDues = policies.filter(p => {
      if (!p.next_premium_date) return false;
      const d = new Date(p.next_premium_date);
      // Dues in next 30 days
      const diffDays = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 30;
    }).length;

    const lapsedCount = policies.filter(p => {
      if (!p.next_premium_date) return false;
      return p.next_premium_date < todayStr;
    }).length;

    return {
      total,
      totalSumAssured,
      totalPremium,
      upcomingDues,
      lapsedCount,
    };
  }, [policies, todayStr]);

  // Filtering for Policies or Dues Ledger
  const filteredPolicies = useMemo(() => {
    return policies.filter(p => {
      // Mode filter
      if (modeFilter !== "all" && p.mode_of_premium !== modeFilter) {
        return false;
      }

      // If in Dues Ledger tab, apply dues filter
      if (activeSubTab === "dues") {
        if (!p.next_premium_date) return false;
        const dueDate = new Date(p.next_premium_date);

        if (dueFilter === "this_month") {
          const isThisMonth =
            dueDate.getFullYear() === currentYear && dueDate.getMonth() === currentMonth;
          if (!isThisMonth) return false;
        } else if (dueFilter === "quarterly") {
          const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays < 0 || diffDays > 90) return false;
        } else if (dueFilter === "lapsed") {
          if (p.next_premium_date >= todayStr) return false;
        }
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const numMatch = p.policy_number?.toLowerCase().includes(q);
        const nameMatch = p.customer_name?.toLowerCase().includes(q);
        const mobileMatch = p.mobile?.toLowerCase().includes(q) || p.whatsapp_number?.toLowerCase().includes(q);
        const planMatch = p.plan_and_table_no?.toLowerCase().includes(q);
        return numMatch || nameMatch || mobileMatch || planMatch;
      }

      return true;
    });
  }, [policies, activeSubTab, dueFilter, modeFilter, searchQuery, todayStr, currentYear, currentMonth]);

  const handleDelete = async (id: string, policyNumber: string) => {
    if (!window.confirm(`Are you sure you want to delete policy #${policyNumber}?`)) {
      return;
    }
    const { error } = await deleteLicActivePolicy(id);
    if (error) {
      toast.error("Failed to delete policy.");
    } else {
      toast.success("Policy deleted successfully.");
      setPolicies(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleCopyPolicyNo = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedId(num);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success("Policy number copied to clipboard!");
  };

  const handleWhatsApp = (p: LicActivePolicy) => {
    const mobile = (p.whatsapp_number || p.mobile || "").replace(/\D/g, "");
    if (!mobile) {
      toast.error("No mobile number available.");
      return;
    }
    const msg = encodeURIComponent(
      `Dear ${p.customer_name},\nThis is a friendly reminder regarding your LIC Policy #${p.policy_number} (${p.plan_and_table_no || "LIC Policy"}).\nNext Premium Due Date: ${p.next_premium_date}\nPremium Amount: ₹${p.premium_amount?.toLocaleString("en-IN") || "0"}\nPlease pay before due date to avoid interest/lapse. Thank you!`
    );
    window.open(`https://wa.me/91${mobile}?text=${msg}`, "_blank");
  };

  const getDueStatusBadge = (dueDateStr: string) => {
    if (!dueDateStr) return null;
    const isLapsed = dueDateStr < todayStr;
    const isToday = dueDateStr === todayStr;

    if (isLapsed) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200">
          <AlertTriangle size={11} />
          Overdue
        </span>
      );
    }
    if (isToday) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
          <Clock size={11} />
          Due Today
        </span>
      );
    }

    const d = new Date(dueDateStr);
    const diffDays = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 30) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
          In {diffDays} days
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
        Active
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header & Top Bar Action ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-ping" />
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Real Customer & Active Policy Manager
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Master repository of active LIC policies, premium collection ledger, and customer family profiles.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            className="p-2.5 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs transition-colors"
            title="Refresh Data"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>

          {/* Top Bar Action: + Direct Add Existing Policy Holder */}
          <button
            type="button"
            onClick={() => setDirectAddOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-700/20 transition-all hover:shadow-lg"
          >
            <UserPlus size={16} />
            <span>+ Direct Add Existing Policy Holder</span>
          </button>
        </div>
      </div>

      {/* ── Key Metrics Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Active Policies */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Policies</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Award size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
            {metrics.total}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Live policies in ledger</div>
        </div>

        {/* Total Sum Assured */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Sum Assured</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <IndianRupee size={16} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-700 mt-2">
            ₹{metrics.totalSumAssured.toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Total insurance cover</div>
        </div>

        {/* Premium Volume */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Premium Volume</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <IndianRupee size={16} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-indigo-700 mt-2">
            ₹{metrics.totalPremium.toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Per installment cycle</div>
        </div>

        {/* Upcoming Dues / Lapsed */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Upcoming Dues (30d)</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Calendar size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-600">
              {metrics.upcomingDues}
            </span>
            {metrics.lapsedCount > 0 && (
              <span className="text-xs font-bold text-red-600">
                ({metrics.lapsedCount} overdue)
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Requiring immediate collection</div>
        </div>
      </div>

      {/* ── Sub-tabs Navigation: "All Active Policies" vs "Premium Due Ledger" ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab("policies")}
            className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${
              activeSubTab === "policies"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            1. All Active Policies ({policies.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab("dues")}
            className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center gap-1.5 ${
              activeSubTab === "dues"
                ? "bg-emerald-700 text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <Calendar size={15} />
            <span>2. Premium Due Ledger</span>
            {metrics.upcomingDues > 0 && (
              <span className="text-[10px] bg-amber-400 text-slate-900 px-1.5 py-0.2 rounded-full font-extrabold">
                {metrics.upcomingDues}
              </span>
            )}
          </button>
        </div>

        {/* Due filter tabs (shown only when in Dues Ledger mode) */}
        {activeSubTab === "dues" && (
          <div className="flex items-center gap-1 overflow-x-auto">
            {(
              [
                { id: "all", label: "All Dues" },
                { id: "this_month", label: "Due This Month" },
                { id: "quarterly", label: "Quarterly Dues" },
                { id: "lapsed", label: "Lapsed / Overdue" },
              ] as const
            ).map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setDueFilter(tab.id)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  dueFilter === tab.id
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Search & Mode Filters Bar ── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by customer name, policy number, mobile, plan..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
          />
        </div>

        {/* Mode Filter Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Mode:</span>
          <select
            value={modeFilter}
            onChange={e => setModeFilter(e.target.value)}
            className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
          >
            <option value="all">All Modes</option>
            <option value="YLY">Yearly (YLY)</option>
            <option value="HLY">Half-Yearly (HLY)</option>
            <option value="QLY">Quarterly (QLY)</option>
            <option value="MONTHLY">Monthly</option>
          </select>
        </div>
      </div>

      {/* ── Master Policies Table ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Policy No & Plan</th>
                <th className="py-3 px-4">Policyholder & Mobile</th>
                <th className="py-3 px-4">Sum Assured & Premium</th>
                <th className="py-3 px-4">Mode</th>
                <th className="py-3 px-4">Next Due Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredPolicies.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <Award size={22} />
                      </div>
                      <p className="font-semibold text-slate-600">No active policies found</p>
                      <p className="text-xs text-slate-400 max-w-sm">
                        {searchQuery || modeFilter !== "all" || (activeSubTab === "dues" && dueFilter !== "all")
                          ? "Try clearing filters or search terms."
                          : "Convert prospective leads or use '+ Direct Add Existing Policy Holder'."}
                      </p>
                      <button
                        type="button"
                        onClick={() => setDirectAddOpen(true)}
                        className="mt-2 text-xs font-bold text-emerald-700 hover:underline"
                      >
                        + Direct Add Policy Holder
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPolicies.map(p => {
                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Policy No & Plan */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-slate-900">
                            {p.policy_number}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyPolicyNo(p.policy_number)}
                            title="Copy Policy Number"
                            className="text-slate-400 hover:text-slate-700 transition-colors"
                          >
                            {copiedId === p.policy_number ? (
                              <Check size={13} className="text-emerald-600" />
                            ) : (
                              <Copy size={13} />
                            )}
                          </button>
                        </div>
                        <div className="text-xs text-slate-600 font-semibold mt-0.5">
                          {p.plan_and_table_no || "LIC Plan"}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {p.policy_term ? `Term: ${p.policy_term}Y` : ""} {p.premium_paying_term ? `· PPT: ${p.premium_paying_term}Y` : ""}
                        </div>
                      </td>

                      {/* Policyholder & Contact */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-sm">{p.customer_name}</div>
                        <div className="text-slate-500 mt-0.5">Ph: {p.mobile}</div>
                        {p.spouse_name && (
                          <div className="text-[11px] text-slate-400">Spouse: {p.spouse_name}</div>
                        )}
                        {p.nominee_details?.name && (
                          <div className="text-[11px] text-rose-600/90 font-medium">
                            Nominee: {p.nominee_details.name} ({p.nominee_details.relation || "Nominee"})
                          </div>
                        )}
                      </td>

                      {/* Sum Assured & Premium */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-emerald-800 text-sm">
                          ₹{p.premium_amount?.toLocaleString("en-IN") || "0"}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          SA: ₹{p.sum_assured?.toLocaleString("en-IN") || "—"}
                        </div>
                      </td>

                      {/* Mode of Premium */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-xs border border-slate-200">
                          {p.mode_of_premium}
                        </span>
                      </td>

                      {/* Next Due Date */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{p.next_premium_date}</div>
                        <div className="mt-1">{getDueStatusBadge(p.next_premium_date)}</div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                          {p.premium_status || "Active"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Mark Premium Paid Action */}
                          <button
                            type="button"
                            onClick={() => setMarkPaidPolicy(p)}
                            title="Mark Premium Paid (Advance Due Date)"
                            className="px-2.5 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors flex items-center gap-1"
                          >
                            <CheckCircle2 size={13} />
                            <span>Mark Paid</span>
                          </button>

                          {/* Profile Modal */}
                          <button
                            type="button"
                            onClick={() => setProfilePolicy(p)}
                            title="View Full Profile"
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
                          >
                            <Eye size={15} />
                          </button>

                          {/* WhatsApp */}
                          <button
                            type="button"
                            onClick={() => handleWhatsApp(p)}
                            title="Send WhatsApp Reminder"
                            className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-200"
                          >
                            <MessageCircle size={15} />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleDelete(p.id, p.policy_number)}
                            title="Delete Policy"
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modals ── */}
      <DirectAddPolicyModal
        open={directAddOpen}
        onClose={() => setDirectAddOpen(false)}
        onSuccess={newPol => {
          setPolicies(prev => [newPol, ...prev]);
        }}
      />

      <PolicyProfileModal
        policy={profilePolicy}
        open={!!profilePolicy}
        onClose={() => setProfilePolicy(null)}
        onMarkPaid={pol => setMarkPaidPolicy(pol)}
      />

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
    </div>
  );
}

