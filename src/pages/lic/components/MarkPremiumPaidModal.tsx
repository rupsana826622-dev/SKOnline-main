import { useState, useEffect } from "react";
import { X, CheckCircle2, ArrowRight, IndianRupee, Calendar, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { LicActivePolicy, recordPremiumPayment, advanceDueDate } from "@/lib/licStorage";

interface MarkPremiumPaidModalProps {
  policy: LicActivePolicy | null;
  open: boolean;
  onClose: () => void;
  onSuccess: (updatedPolicyId: string, newDueDate: string) => void;
}

export default function MarkPremiumPaidModal({
  policy,
  open,
  onClose,
  onSuccess,
}: MarkPremiumPaidModalProps) {
  const todayStr = new Date().toISOString().split("T")[0];

  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentDate, setPaymentDate] = useState<string>(todayStr);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (policy) {
      setPaymentAmount(policy.premium_amount ? String(policy.premium_amount) : "");
      setPaymentDate(todayStr);
    }
  }, [policy, todayStr]);

  if (!open || !policy) return null;

  // Calculate new projected next premium due date
  const projectedDueDate = advanceDueDate(policy.next_premium_date, policy.mode_of_premium);

  const getIntervalLabel = (mode: string) => {
    switch (mode) {
      case "MONTHLY": return "+1 Month";
      case "QLY": return "+3 Months (Quarterly)";
      case "HLY": return "+6 Months (Half-Yearly)";
      case "YLY":
      default: return "+1 Year (Annual)";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(paymentAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.error("Please enter a valid premium amount.");
      return;
    }

    setLoading(true);
    try {
      const res = await recordPremiumPayment(
        policy.id,
        amt,
        paymentDate,
        policy.next_premium_date,
        policy.mode_of_premium
      );

      if (res.error) {
        toast.error(res.error?.message || "Failed to record payment.");
      } else {
        toast.success(`Premium payment recorded! Next due date updated to ${res.newDueDate}.`);
        onSuccess(policy.id, res.newDueDate);
        onClose();
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-800 to-teal-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <h2 className="text-base font-bold">Record Premium Collection</h2>
              <p className="text-xs text-emerald-200">
                Policy #{policy.policy_number} · {policy.customer_name}
              </p>
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

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-slate-800">
          {/* Due Date Projection Box */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-emerald-800 font-semibold">
              <span>Payment Mode: <strong>{policy.mode_of_premium}</strong></span>
              <span className="bg-emerald-200/60 px-2 py-0.5 rounded text-[11px]">
                {getIntervalLabel(policy.mode_of_premium)}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div>
                <span className="text-[11px] text-slate-500 block">Current Due Date</span>
                <span className="text-sm font-bold text-slate-700">{policy.next_premium_date}</span>
              </div>
              <ArrowRight size={20} className="text-emerald-600 animate-pulse" />
              <div>
                <span className="text-[11px] text-emerald-800 font-semibold block">New Due Date</span>
                <span className="text-base font-black text-emerald-700">{projectedDueDate}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Collected Amount (₹) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <IndianRupee size={15} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="number"
                required
                value={paymentAmount}
                onChange={e => setPaymentAmount(e.target.value)}
                placeholder="Premium amount collected"
                className="w-full pl-8 pr-3 py-2 text-sm font-bold bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Payment Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar size={15} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="date"
                required
                value={paymentDate}
                onChange={e => setPaymentDate(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200">
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
              className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-md shadow-emerald-600/25 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>Advancing Due Date...</>
              ) : (
                <>
                  <ShieldCheck size={16} />
                  Confirm & Advance Due Date
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

