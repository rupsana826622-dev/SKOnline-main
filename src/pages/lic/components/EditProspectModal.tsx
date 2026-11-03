import { useState, useEffect } from "react";
import { X, Edit, Phone, Calendar, IndianRupee, MessageCircle, FileText, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { updateLicProspect, LicProspect } from "@/lib/licStorage";

interface EditProspectModalProps {
  prospect: LicProspect | null;
  open: boolean;
  onClose: () => void;
  onSuccess: (updatedProspect: LicProspect) => void;
}

export default function EditProspectModal({
  prospect,
  open,
  onClose,
  onSuccess,
}: EditProspectModalProps) {
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
    conversation_date: "",
    feedback: "yes" as "yes" | "no" | "others",
    appointment_date_time: "",
    notes: "",
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (prospect) {
      setFormData({
        customer_name: prospect.customer_name || "",
        fathers_name: prospect.fathers_name || "",
        address: prospect.address || "",
        mobile: prospect.mobile || "",
        whatsapp_number: prospect.whatsapp_number || "",
        plan_name: prospect.plan_name || "",
        term: prospect.term || "",
        policy_paying_term: prospect.policy_paying_term || "",
        sum_assured: prospect.sum_assured ? String(prospect.sum_assured) : "",
        premium_amount: prospect.premium_amount ? String(prospect.premium_amount) : "",
        conversation_date: prospect.conversation_date || "",
        feedback: (prospect.feedback === "yes" || prospect.feedback === "no" || prospect.feedback === "others")
          ? prospect.feedback
          : "others",
        appointment_date_time: prospect.appointment_date_time ? prospect.appointment_date_time.slice(0, 16) : "",
        notes: prospect.notes || "",
      });
    }
  }, [prospect]);

  if (!open || !prospect) return null;

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
      const { data, error } = await updateLicProspect(prospect.id, {
        customer_name: formData.customer_name.trim(),
        fathers_name: formData.fathers_name.trim() || null,
        address: formData.address.trim() || null,
        mobile: formData.mobile.trim(),
        whatsapp_number: formData.whatsapp_number.trim() || null,
        plan_name: formData.plan_name.trim() || null,
        term: formData.term.trim() || null,
        policy_paying_term: formData.policy_paying_term.trim() || null,
        sum_assured: formData.sum_assured ? Number(formData.sum_assured) : null,
        premium_amount: formData.premium_amount ? Number(formData.premium_amount) : null,
        conversation_date: formData.conversation_date || null,
        feedback: formData.feedback,
        appointment_date_time: formData.appointment_date_time || null,
        notes: formData.notes.trim() || null,
      });

      if (error || !data) {
        toast.error("Failed to update prospect.");
      } else {
        toast.success("Prospect updated successfully!");
        onSuccess(data);
        onClose();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred.";
      toast.error(message);
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
              <Edit size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold">Edit Prospective Lead</h2>
              <p className="text-xs text-blue-200">Lead #{prospect.serial_no || prospect.id.slice(0, 6)}</p>
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
                  value={formData.customer_name}
                  onChange={e => setFormData({ ...formData, customer_name: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Father's Name</label>
                <input
                  type="text"
                  value={formData.fathers_name}
                  onChange={e => setFormData({ ...formData, fathers_name: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Address / Village</label>
              <input
                type="text"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={formData.mobile}
                  onChange={e => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, "") })}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">WhatsApp Number</label>
                <input
                  type="tel"
                  maxLength={10}
                  value={formData.whatsapp_number}
                  onChange={e => setFormData({ ...formData, whatsapp_number: e.target.value.replace(/\D/g, "") })}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Plan Details */}
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
                  value={formData.plan_name}
                  onChange={e => setFormData({ ...formData, plan_name: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Term (Years)</label>
                <input
                  type="text"
                  value={formData.term}
                  onChange={e => setFormData({ ...formData, term: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">PPT (Paying Term)</label>
                <input
                  type="text"
                  value={formData.policy_paying_term}
                  onChange={e => setFormData({ ...formData, policy_paying_term: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Sum Assured (₹)</label>
                <input
                  type="number"
                  value={formData.sum_assured}
                  onChange={e => setFormData({ ...formData, sum_assured: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Est. Premium Amount (₹)</label>
                <input
                  type="number"
                  value={formData.premium_amount}
                  onChange={e => setFormData({ ...formData, premium_amount: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Follow-up Details */}
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
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Feedback</label>
                <select
                  value={formData.feedback}
                  onChange={e => setFormData({ ...formData, feedback: e.target.value as "yes" | "no" | "others" })}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="yes">Yes - Highly Interested</option>
                  <option value="others">Others - Follow-up Needed</option>
                  <option value="no">No - Not Interested</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Next Appointment</label>
                <input
                  type="datetime-local"
                  value={formData.appointment_date_time}
                  onChange={e => setFormData({ ...formData, appointment_date_time: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Discussion Highlights</label>
              <textarea
                rows={2}
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
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
                <>Updating...</>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

