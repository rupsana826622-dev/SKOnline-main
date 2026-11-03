import { useState } from "react";
import { X, UserPlus, Phone, Calendar, IndianRupee, MessageCircle, FileText, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { addLicProspect, LicProspect } from "@/lib/licStorage";

interface AddProspectModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (newProspect: LicProspect) => void;
}

export default function AddProspectModal({ open, onClose, onSuccess }: AddProspectModalProps) {
  const todayStr = new Date().toISOString().split("T")[0];

  const [formData, setFormData] = useState({
    customer_name: "",
    fathers_name: "",
    address: "",
    mobile: "",
    whatsapp_number: "",
    plan_name: "",
    term: "",
    policy_paying_term: "",
    sum_assured: "",
    premium_amount: "",
    conversation_date: todayStr,
    feedback: "yes" as "yes" | "no" | "others",
    appointment_date_time: "",
    notes: "",
  });

  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleCopyMobile = () => {
    setFormData(prev => ({ ...prev, whatsapp_number: prev.mobile }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer_name.trim()) {
      toast.error("Customer Name is required.");
      return;
    }
    if (!formData.mobile.trim()) {
      toast.error("Mobile Number is required.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await addLicProspect({
        customer_name: formData.customer_name.trim(),
        fathers_name: formData.fathers_name.trim() || null,
        address: formData.address.trim() || null,
        mobile: formData.mobile.trim(),
        whatsapp_number: (formData.whatsapp_number.trim() || formData.mobile.trim()) || null,
        plan_name: formData.plan_name.trim() || null,
        term: formData.term.trim() || null,
        policy_paying_term: formData.policy_paying_term.trim() || null,
        sum_assured: formData.sum_assured ? Number(formData.sum_assured) : null,
        premium_amount: formData.premium_amount ? Number(formData.premium_amount) : null,
        conversation_date: formData.conversation_date || todayStr,
        feedback: formData.feedback,
        appointment_date_time: formData.appointment_date_time || null,
        notes: formData.notes.trim() || null,
        status: "active",
      });

      if (error || !data) {
        toast.error("Failed to add prospect. Please try again.");
      } else {
        toast.success("Prospect added successfully!");
        onSuccess(data);
        onClose();
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <UserPlus size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold">Add Prospective LIC Lead</h2>
              <p className="text-xs text-blue-200">Register potential policyholder & track follow-up</p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-200 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Customer Personal Details */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <FileText size={14} className="text-blue-600" />
              Customer Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Chandra"
                  value={formData.customer_name}
                  onChange={e => setFormData({ ...formData, customer_name: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Father's Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Suresh Chandra"
                  value={formData.fathers_name}
                  onChange={e => setFormData({ ...formData, fathers_name: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Address / Village
              </label>
              <input
                type="text"
                placeholder="Village, PO, Block, District"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="tel"
                    required
                    placeholder="10-digit mobile"
                    maxLength={10}
                    value={formData.mobile}
                    onChange={e => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, "") })}
                    className="w-full pl-8 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">WhatsApp Number</label>
                  <button
                    type="button"
                    onClick={handleCopyMobile}
                    className="text-[11px] text-blue-600 hover:text-blue-700 font-medium hover:underline"
                  >
                    Same as Mobile
                  </button>
                </div>
                <div className="relative">
                  <MessageCircle size={14} className="absolute left-3 top-2.5 text-emerald-500" />
                  <input
                    type="tel"
                    placeholder="WhatsApp number"
                    maxLength={10}
                    value={formData.whatsapp_number}
                    onChange={e => setFormData({ ...formData, whatsapp_number: e.target.value.replace(/\D/g, "") })}
                    className="w-full pl-8 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Plan & Quote Details */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <IndianRupee size={14} className="text-amber-600" />
              Proposed Plan & Premium
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Plan Name</label>
                <input
                  type="text"
                  placeholder="e.g. Jeevan Labh (936)"
                  value={formData.plan_name}
                  onChange={e => setFormData({ ...formData, plan_name: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Term (Years)</label>
                <input
                  type="text"
                  placeholder="e.g. 21"
                  value={formData.term}
                  onChange={e => setFormData({ ...formData, term: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">PPT (Paying Term)</label>
                <input
                  type="text"
                  placeholder="e.g. 15"
                  value={formData.policy_paying_term}
                  onChange={e => setFormData({ ...formData, policy_paying_term: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Sum Assured (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 500000"
                  value={formData.sum_assured}
                  onChange={e => setFormData({ ...formData, sum_assured: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Est. Premium Amount (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 24500"
                  value={formData.premium_amount}
                  onChange={e => setFormData({ ...formData, premium_amount: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Conversation & Follow-up Details */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Calendar size={14} className="text-indigo-600" />
              Follow-up & Conversation
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Conversation Date</label>
                <input
                  type="date"
                  value={formData.conversation_date}
                  onChange={e => setFormData({ ...formData, conversation_date: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Feedback</label>
                <select
                  value={formData.feedback}
                  onChange={e => setFormData({ ...formData, feedback: e.target.value as any })}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="yes">Yes - Highly Interested</option>
                  <option value="others">Others - Follow-up Needed</option>
                  <option value="no">No - Not Interested</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Next Appointment / Follow-up</label>
                <input
                  type="datetime-local"
                  value={formData.appointment_date_time}
                  onChange={e => setFormData({ ...formData, appointment_date_time: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Discussion Highlights</label>
              <textarea
                rows={2}
                placeholder="Mention customer requirements, preferred meeting time, objections, or next steps..."
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-md shadow-blue-700/20 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>Saving Lead...</>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  Save Prospect Lead
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

