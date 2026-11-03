import { useState, useEffect, useMemo } from "react";
import {
  Users, UserPlus, Phone, Calendar, IndianRupee, MessageCircle,
  Search, Filter, CheckCircle2, AlertCircle, ArrowRightCircle, Trash2, Edit, RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import {
  LicProspect,
  LicActivePolicy,
  fetchLicProspects,
  deleteLicProspect,
} from "@/lib/licStorage";
import AddProspectModal from "./components/AddProspectModal";
import EditProspectModal from "./components/EditProspectModal";
import ConvertProspectModal from "./components/ConvertProspectModal";

export default function LicProspectsPage() {
  const [prospects, setProspects] = useState<LicProspect[]>([]);
  const [convertedCount, setConvertedCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [feedbackFilter, setFeedbackFilter] = useState<"all" | "yes" | "no" | "others">("all");

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingProspect, setEditingProspect] = useState<LicProspect | null>(null);
  const [convertingProspect, setConvertingProspect] = useState<LicProspect | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const activeList = await fetchLicProspects("active");
      setProspects(activeList);

      // Get count of converted prospects
      const allList = await fetchLicProspects("all");
      const converted = allList.filter(p => p.status === "converted").length;
      setConvertedCount(converted);
    } catch (err) {
      console.error("Failed to load prospects:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Metrics Calculation
  const todayDateStr = new Date().toISOString().split("T")[0];

  const metrics = useMemo(() => {
    const total = prospects.length;
    const todayAppointments = prospects.filter(p => {
      if (!p.appointment_date_time) return false;
      return p.appointment_date_time.startsWith(todayDateStr);
    }).length;
    const positiveLeads = prospects.filter(p => p.feedback === "yes").length;
    return {
      total,
      todayAppointments,
      positiveLeads,
      converted: convertedCount,
    };
  }, [prospects, todayDateStr, convertedCount]);

  // Filtered List
  const filteredProspects = useMemo(() => {
    return prospects.filter(p => {
      // Feedback filter
      if (feedbackFilter !== "all" && p.feedback !== feedbackFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = p.customer_name?.toLowerCase().includes(q);
        const mobileMatch = p.mobile?.toLowerCase().includes(q) || p.whatsapp_number?.toLowerCase().includes(q);
        const planMatch = p.plan_name?.toLowerCase().includes(q);
        const fatherMatch = p.fathers_name?.toLowerCase().includes(q);
        return nameMatch || mobileMatch || planMatch || fatherMatch;
      }
      return true;
    });
  }, [prospects, searchQuery, feedbackFilter]);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete prospect "${name}"?`)) {
      return;
    }
    const { error } = await deleteLicProspect(id);
    if (error) {
      toast.error("Failed to delete prospect.");
    } else {
      toast.success("Prospect deleted.");
      setProspects(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleWhatsApp = (p: LicProspect) => {
    const mobile = (p.whatsapp_number || p.mobile || "").replace(/\D/g, "");
    if (!mobile) {
      toast.error("No valid mobile number available.");
      return;
    }
    const msg = encodeURIComponent(
      `Hello ${p.customer_name},\nThank you for speaking with us regarding LIC life insurance plans (${p.plan_name || "LIC Savings / Protection"}).\nFeel free to ask any questions or schedule your convenient appointment time.`
    );
    window.open(`https://wa.me/91${mobile}?text=${msg}`, "_blank");
  };

  const formatDateTime = (dtStr?: string | null) => {
    if (!dtStr) return "—";
    try {
      const d = new Date(dtStr);
      if (isNaN(d.getTime())) return dtStr;
      return d.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return dtStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header & Top Actions ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping" />
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Target Prospect Hub
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage prospective life insurance inquiries, schedule follow-ups, and convert leads into active policies.
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

          <button
            type="button"
            onClick={() => setAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-blue-700/20 transition-all hover:shadow-lg"
          >
            <UserPlus size={16} />
            <span>+ Add New Prospect</span>
          </button>
        </div>
      </div>

      {/* ── Key Metrics Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Prospects */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Prospects</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
            {metrics.total}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Active prospective pipeline</div>
        </div>

        {/* Today's Follow-ups */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Today's Appointments</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Calendar size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-2">
            {metrics.todayAppointments}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Scheduled for today ({todayDateStr})</div>
        </div>

        {/* Positive Leads */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Positive Leads</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-2">
            {metrics.positiveLeads}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Feedback = 'Yes' (High intent)</div>
        </div>

        {/* Converted Customers */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Converted Clients</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <ArrowRightCircle size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-purple-700 mt-2">
            {metrics.converted}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Transferred to Active Ledger</div>
        </div>
      </div>

      {/* ── Filters & Search ── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by customer name, mobile, father, plan..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          />
        </div>

        {/* Feedback Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-semibold text-slate-400 mr-1 hidden sm:inline">Feedback:</span>
          {(
            [
              { id: "all", label: "All Leads" },
              { id: "yes", label: "Positive (Yes)" },
              { id: "others", label: "Follow-up" },
              { id: "no", label: "Negative (No)" },
            ] as const
          ).map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFeedbackFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                feedbackFilter === tab.id
                  ? "bg-blue-700 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Prospects Data Table ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 w-12 text-center">SL No</th>
                <th className="py-3 px-4">Customer Name & Contact</th>
                <th className="py-3 px-4">Plan & Sum Assured</th>
                <th className="py-3 px-4">Conversation Date</th>
                <th className="py-3 px-4">Feedback</th>
                <th className="py-3 px-4">Next Appointment</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredProspects.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <Users size={22} />
                      </div>
                      <p className="font-semibold text-slate-600">No prospective leads found</p>
                      <p className="text-xs text-slate-400 max-w-sm">
                        {searchQuery || feedbackFilter !== "all"
                          ? "Try adjusting your search criteria or feedback filters."
                          : "Get started by adding your first prospective client inquiry."}
                      </p>
                      <button
                        type="button"
                        onClick={() => setAddModalOpen(true)}
                        className="mt-2 text-xs font-bold text-blue-700 hover:underline"
                      >
                        + Add Prospect Now
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProspects.map((p, idx) => {
                  const isPositive = p.feedback === "yes";
                  const isNegative = p.feedback === "no";

                  const isAppointmentToday =
                    p.appointment_date_time && p.appointment_date_time.startsWith(todayDateStr);

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-blue-50/40 transition-colors group"
                    >
                      {/* SL No */}
                      <td className="py-3.5 px-4 text-center font-mono text-slate-400 text-xs">
                        {p.serial_no || idx + 1}
                      </td>

                      {/* Customer Name & Mobile */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-sm">{p.customer_name}</div>
                        <div className="flex items-center gap-2 text-slate-500 mt-0.5">
                          <span>Ph: {p.mobile}</span>
                          {p.whatsapp_number && p.whatsapp_number !== p.mobile && (
                            <span className="text-emerald-600 text-[11px]">WA: {p.whatsapp_number}</span>
                          )}
                        </div>
                        {p.fathers_name && (
                          <div className="text-[11px] text-slate-400">S/O {p.fathers_name}</div>
                        )}
                        {p.address && (
                          <div className="text-[11px] text-slate-400 truncate max-w-xs">{p.address}</div>
                        )}
                      </td>

                      {/* Plan / Sum Assured */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800">{p.plan_name || "—"}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {p.term ? `Term: ${p.term}Y` : ""} {p.policy_paying_term ? `· PPT: ${p.policy_paying_term}Y` : ""}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {p.sum_assured && (
                            <span className="font-semibold text-emerald-700">
                              SA: ₹{p.sum_assured.toLocaleString("en-IN")}
                            </span>
                          )}
                          {p.premium_amount && (
                            <span className="font-semibold text-blue-700">
                              Prem: ₹{p.premium_amount.toLocaleString("en-IN")}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Conversation Date */}
                      <td className="py-3.5 px-4 font-medium text-slate-600">
                        {p.conversation_date || "—"}
                      </td>

                      {/* Feedback Badge */}
                      <td className="py-3.5 px-4">
                        {isPositive ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            Yes (Positive)
                          </span>
                        ) : isNegative ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-800 border border-red-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                            No (Negative)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                            Follow-up
                          </span>
                        )}
                      </td>

                      {/* Next Appointment */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">
                          {formatDateTime(p.appointment_date_time)}
                        </div>
                        {isAppointmentToday && (
                          <span className="inline-block mt-0.5 text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500 text-white uppercase animate-pulse">
                            Today
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* WhatsApp Quick Action */}
                          <button
                            type="button"
                            onClick={() => handleWhatsApp(p)}
                            title="Chat on WhatsApp"
                            className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-200"
                          >
                            <MessageCircle size={15} />
                          </button>

                          {/* Edit Lead */}
                          <button
                            type="button"
                            onClick={() => setEditingProspect(p)}
                            title="Edit Lead"
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                          >
                            <Edit size={15} />
                          </button>

                          {/* Delete Lead */}
                          <button
                            type="button"
                            onClick={() => handleDelete(p.id, p.customer_name)}
                            title="Delete Lead"
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
                          >
                            <Trash2 size={15} />
                          </button>

                          {/* Prominent Action Button: Convert to Real Customer */}
                          <button
                            type="button"
                            onClick={() => setConvertingProspect(p)}
                            className="ml-1 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 rounded-lg shadow-sm shadow-emerald-700/20 transition-all hover:shadow-md"
                            title="Convert to Active LIC Policy"
                          >
                            <ArrowRightCircle size={14} />
                            <span>Convert to Real Customer</span>
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
      <AddProspectModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={newP => {
          setProspects(prev => [newP, ...prev]);
        }}
      />

      <EditProspectModal
        prospect={editingProspect}
        open={!!editingProspect}
        onClose={() => setEditingProspect(null)}
        onSuccess={updatedP => {
          setProspects(prev => prev.map(p => (p.id === updatedP.id ? updatedP : p)));
        }}
      />

      <ConvertProspectModal
        prospect={convertingProspect}
        open={!!convertingProspect}
        onClose={() => setConvertingProspect(null)}
        onSuccess={() => {
          // Remove from prospects list since it has been converted
          if (convertingProspect) {
            setProspects(prev => prev.filter(p => p.id !== convertingProspect.id));
            setConvertedCount(prev => prev + 1);
          }
        }}
      />
    </div>
  );
}

