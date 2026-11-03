import { X, Printer, Phone, Calendar, IndianRupee, Users, Heart, Home, Shield, Award, MessageCircle } from "lucide-react";
import { LicActivePolicy } from "@/lib/licStorage";

interface PolicyProfileModalProps {
  policy: LicActivePolicy | null;
  open: boolean;
  onClose: () => void;
  onMarkPaid?: (policy: LicActivePolicy) => void;
}

export default function PolicyProfileModal({
  policy,
  open,
  onClose,
  onMarkPaid,
}: PolicyProfileModalProps) {
  if (!open || !policy) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsApp = () => {
    const mobile = policy.whatsapp_number || policy.mobile;
    const cleanMobile = mobile.replace(/\D/g, "");
    const msg = encodeURIComponent(
      `Hello ${policy.customer_name},\nThis is regarding your LIC Policy No: ${policy.policy_number} (${policy.plan_and_table_no || "LIC Plan"}).\nNext Premium Due Date: ${policy.next_premium_date}.\nPremium Amount: ₹${policy.premium_amount?.toLocaleString("en-IN") || "0"}.\nPlease reach out for any assistance.`
    );
    window.open(`https://wa.me/91${cleanMobile}?text=${msg}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-4 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-900 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <Award size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">Policyholder Master Profile</h2>
                <span className="text-[11px] font-mono bg-blue-500/20 text-blue-200 px-2 py-0.5 rounded-full border border-blue-400/30">
                  #{policy.policy_number}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {policy.customer_name} · Plan: {policy.plan_and_table_no || "LIC Policy"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              type="button"
              className="px-3 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Printer size={14} />
              Print
            </button>
            <button
              onClick={handleWhatsApp}
              type="button"
              className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <MessageCircle size={14} />
              WhatsApp
            </button>
            <button
              onClick={onClose}
              type="button"
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-200 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-slate-800 text-sm">
          {/* Top Quick Status Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <div className="text-[11px] text-slate-500 font-semibold uppercase">Premium Amount</div>
              <div className="text-lg font-extrabold text-blue-900">
                ₹{policy.premium_amount?.toLocaleString("en-IN") || "—"}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500 font-semibold uppercase">Payment Mode</div>
              <div className="text-base font-bold text-slate-800">{policy.mode_of_premium}</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500 font-semibold uppercase">Next Premium Due</div>
              <div className="text-base font-bold text-amber-700">{policy.next_premium_date}</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500 font-semibold uppercase">Sum Assured</div>
              <div className="text-lg font-extrabold text-emerald-800">
                ₹{policy.sum_assured?.toLocaleString("en-IN") || "—"}
              </div>
            </div>
          </div>

          {/* Section 1: Policy Details */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5 border-b pb-2">
              <Shield size={14} />
              Policy Specifications
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-4 text-xs">
              <div>
                <span className="text-slate-500 block">Policy Number:</span>
                <span className="font-mono font-bold text-sm text-slate-900">{policy.policy_number}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Plan & Table No:</span>
                <span className="font-semibold text-slate-800">{policy.plan_and_table_no || "—"}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Term / PPT:</span>
                <span className="font-semibold text-slate-800">
                  {policy.policy_term || "—"} Yrs / {policy.premium_paying_term || "—"} Yrs
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Proposal / Commencement Date:</span>
                <span className="font-semibold text-slate-800">{policy.proposal_date || "—"}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Maturity Date:</span>
                <span className="font-semibold text-slate-800">{policy.maturity_date || "—"}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Premium Status:</span>
                <span className="font-semibold capitalize text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block mt-0.5">
                  {policy.premium_status || "Active"}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Policyholder & Family Details */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5 border-b pb-2">
              <Users size={14} />
              Policyholder & Family Details
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-4 text-xs">
              <div>
                <span className="text-slate-500 block">Full Name:</span>
                <span className="font-bold text-slate-900">{policy.customer_name}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Father's Name:</span>
                <span className="font-semibold text-slate-800">{policy.fathers_name || "—"}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Mother's Name:</span>
                <span className="font-semibold text-slate-800">{policy.mothers_name || "—"}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Spouse Name:</span>
                <span className="font-semibold text-slate-800">{policy.spouse_name || "—"}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Date of Birth:</span>
                <span className="font-semibold text-slate-800">{policy.date_of_birth || "—"}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Mobile & WhatsApp:</span>
                <span className="font-semibold text-slate-800">
                  {policy.mobile} {policy.whatsapp_number ? `· WA: ${policy.whatsapp_number}` : ""}
                </span>
              </div>
              <div className="sm:col-span-3">
                <span className="text-slate-500 block">Residential Address:</span>
                <span className="font-semibold text-slate-800">{policy.address || "—"}</span>
              </div>
            </div>

            {/* Children List */}
            {policy.children_details && policy.children_details.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-2">Children</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {policy.children_details.map((child, i) => (
                    <div key={i} className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-xs flex justify-between">
                      <span className="font-semibold text-slate-800">{child.child_name}</span>
                      <span className="text-slate-500">DOB: {child.date_of_birth || "—"}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Nominee & Reference Persons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nominee */}
            <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1.5 border-b pb-2">
                <Heart size={14} className="text-rose-600" />
                Nominee Information
              </h3>
              {policy.nominee_details?.name ? (
                <div className="space-y-1.5 text-xs">
                  <div>
                    <span className="text-slate-500">Nominee Name:</span>{" "}
                    <strong className="text-slate-900">{policy.nominee_details.name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Relationship:</span>{" "}
                    <span className="font-semibold text-slate-800">{policy.nominee_details.relation || "—"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Nominee DOB:</span>{" "}
                    <span className="font-semibold text-slate-800">{policy.nominee_details.dob || "—"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Nominee Father:</span>{" "}
                    <span className="font-semibold text-slate-800">{policy.nominee_details.fathers_name || "—"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Nominee Mother:</span>{" "}
                    <span className="font-semibold text-slate-800">{policy.nominee_details.mothers_name || "—"}</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No nominee details recorded.</p>
              )}
            </div>

            {/* References */}
            <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5 border-b pb-2">
                <Home size={14} className="text-amber-600" />
                Reference Persons
              </h3>
              {policy.reference_persons && policy.reference_persons.length > 0 ? (
                <div className="space-y-2 text-xs">
                  {policy.reference_persons.map((ref, idx) => (
                    <div key={idx} className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <div className="font-bold text-slate-800">{ref.name}</div>
                      <div className="text-slate-600">Mobile: {ref.mobile}</div>
                      {ref.address && <div className="text-slate-500 text-[11px]">{ref.address}</div>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No reference persons recorded.</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Created: {policy.created_at ? new Date(policy.created_at).toLocaleDateString() : "—"}
          </div>
          <div className="flex items-center gap-2">
            {onMarkPaid && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onMarkPaid(policy);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
              >
                Mark Premium Paid
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-200 hover:bg-slate-300 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

