import React, { useState } from "react";
import {
  ArrowLeft, User, Phone, MapPin, Calendar, CreditCard, ShieldCheck,
  CheckCircle, Clock, Trash2, Edit, Printer, Copy, Check, Building2, ExternalLink
} from "lucide-react";
import type { BobCustomerRecord } from "@/types/bob";
import { deleteBobCustomer } from "@/lib/bobStorage";
import { formatDateTime } from "@/lib/utils";
import { toast } from "sonner";
import SEO from "@/components/common/SEO";

interface BobCustomerProfileProps {
  record: BobCustomerRecord;
  onBack: () => void;
  onEdit: (record: BobCustomerRecord) => void;
  onPrintReceipt: (record: BobCustomerRecord) => void;
  onRecordDeleted: (id: string) => void;
}

export default function BobCustomerProfile({
  record,
  onBack,
  onEdit,
  onPrintReceipt,
  onRecordDeleted,
}: BobCustomerProfileProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, fieldName: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`${fieldName} copied to clipboard!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete Bank of Baroda account for "${record.customerName}"?`)) return;

    try {
      await deleteBobCustomer(record.id);
      toast.success(`Account for "${record.customerName}" deleted.`);
      onRecordDeleted(record.id);
      onBack();
    } catch (err: any) {
      toast.error(`Error deleting: ${err?.message || "Unknown error"}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-fade-in">
      <SEO title={`${record.customerName} — Bank of Baroda Customer Profile`} />

      {/* Top Bar Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-orange-200 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all shadow-xs"
          >
            <ArrowLeft size={15} />
            <span>Back to Customers List</span>
          </button>

          <div className="h-5 w-px bg-slate-200 hidden sm:block" />

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 font-bold flex items-center justify-center text-sm shadow-xs">
              {record.slNo}
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight">
                {record.customerName}
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">
                Bank of Baroda CSP · Opened on {record.accountOpeningDate}
              </p>
            </div>
          </div>
        </div>

        {/* Scheme Status Summary */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {record.enrollAPY && (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              APY
            </span>
          )}
          {record.enrollPMSBY && (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-violet-100 text-violet-800 border border-violet-200">
              PMSBY
            </span>
          )}
          {record.enrollPMJJBY && (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
              PMJJBY
            </span>
          )}
          {!record.enrollAPY && !record.enrollPMSBY && !record.enrollPMJJBY && (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium text-slate-500 bg-slate-100">
              No Schemes Enrolled
            </span>
          )}
        </div>
      </div>

      {/* Grid Layout for Full-Width Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols on desktop) */}
        <div className="lg:col-span-2 space-y-6">
          {/* SECTION 1: Primary Banking Identifiers */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-orange-400 text-xs font-bold uppercase tracking-wider">
                <CreditCard size={15} />
                <span>BOB Account Identifiers</span>
              </div>
              <span className="text-[11px] text-orange-300 font-semibold bg-orange-950/60 px-2.5 py-0.5 rounded-full border border-orange-800/40">
                Official CSP Record
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Account Number */}
              <div className="bg-slate-800/90 p-4 rounded-xl border border-slate-700/80 sm:col-span-3">
                <div className="text-xs text-slate-400 font-medium">Bank Account Number</div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="font-mono text-xl font-extrabold text-white tracking-wider">
                    {record.accountNo || "PENDING ALLOCATION"}
                  </span>
                  {record.accountNo && (
                    <button
                      onClick={() => handleCopy(record.accountNo, "Account Number")}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                      title="Copy Account Number"
                    >
                      {copiedField === "Account Number" ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                    </button>
                  )}
                </div>
              </div>

              {/* CIF Number */}
              <div className="bg-slate-800/90 p-4 rounded-xl border border-slate-700/80">
                <div className="text-xs text-slate-400 font-medium">CIF Number</div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="font-mono text-sm font-bold text-orange-300 truncate">
                    {record.cifNo || "—"}
                  </span>
                  {record.cifNo && (
                    <button
                      onClick={() => handleCopy(record.cifNo, "CIF Number")}
                      className="p-1 text-slate-400 hover:text-white rounded-md transition-colors"
                      title="Copy CIF"
                    >
                      {copiedField === "CIF Number" ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                  )}
                </div>
              </div>

              {/* Reference Number */}
              <div className="bg-slate-800/90 p-4 rounded-xl border border-slate-700/80">
                <div className="text-xs text-slate-400 font-medium">Reference Number</div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="font-mono text-sm font-bold text-slate-200 truncate">
                    {record.refNo || "—"}
                  </span>
                  {record.refNo && (
                    <button
                      onClick={() => handleCopy(record.refNo, "Reference Number")}
                      className="p-1 text-slate-400 hover:text-white rounded-md transition-colors"
                      title="Copy Ref"
                    >
                      {copiedField === "Reference Number" ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                  )}
                </div>
              </div>

              {/* Register Serial */}
              <div className="bg-slate-800/90 p-4 rounded-xl border border-slate-700/80">
                <div className="text-xs text-slate-400 font-medium">Serial Number</div>
                <div className="font-mono text-sm font-bold text-white mt-1.5">
                  #{record.slNo}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: Customer Personal Details */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <User size={15} className="text-orange-600" />
              <span>Customer Personal Details</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-xl">
                <div className="text-slate-400 font-medium">Customer Full Name</div>
                <div className="font-bold text-slate-900 mt-1 text-sm">{record.customerName}</div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl">
                <div className="text-slate-400 font-medium">Care Of / Guardian</div>
                <div className="font-semibold text-slate-800 mt-1 text-sm">{record.guardianName || "—"}</div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl">
                <div className="text-slate-400 font-medium">Mobile Number</div>
                <div className="font-mono font-bold text-slate-900 mt-1 text-sm flex items-center justify-between">
                  <span>{record.mobile || "—"}</span>
                  {record.mobile && (
                    <button
                      onClick={() => handleCopy(record.mobile, "Mobile Number")}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      {copiedField === "Mobile Number" ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    </button>
                  )}
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl">
                <div className="text-slate-400 font-medium">Date of Birth</div>
                <div className="font-mono font-semibold text-slate-800 mt-1 text-sm">{record.dob || "—"}</div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl">
                <div className="text-slate-400 font-medium">Aadhaar Number</div>
                <div className="font-mono font-bold text-slate-800 mt-1 text-sm">{record.aadhaarNo || "—"}</div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl">
                <div className="text-slate-400 font-medium">Account Opening Date</div>
                <div className="font-semibold text-slate-800 mt-1 text-sm">{record.accountOpeningDate}</div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl sm:col-span-2">
                <div className="text-slate-400 font-medium">Residential Address</div>
                <div className="font-semibold text-slate-800 mt-1 text-sm">{record.address || "—"}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col on desktop) */}
        <div className="space-y-6">
          {/* SECTION 3: Social Security Scheme (SSS) Enrollments */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <ShieldCheck size={15} className="text-orange-600" />
              <span>Social Security Scheme Enrollments</span>
            </h2>

            <div className="grid grid-cols-3 gap-3">
              {/* APY */}
              <div
                className={`p-3.5 rounded-xl border text-center transition-all ${
                  record.enrollAPY
                    ? "bg-emerald-50/70 border-emerald-300 text-emerald-900"
                    : "bg-slate-50 border-slate-200 text-slate-400"
                }`}
              >
                <div className="font-extrabold text-xs">APY</div>
                <div className="text-[11px] mt-1 font-semibold">
                  {record.enrollAPY ? "✓ Enrolled" : "No"}
                </div>
              </div>

              {/* PMSBY */}
              <div
                className={`p-3.5 rounded-xl border text-center transition-all ${
                  record.enrollPMSBY
                    ? "bg-violet-50/70 border-violet-300 text-violet-900"
                    : "bg-slate-50 border-slate-200 text-slate-400"
                }`}
              >
                <div className="font-extrabold text-xs">PMSBY</div>
                <div className="text-[11px] mt-1 font-semibold">
                  {record.enrollPMSBY ? "✓ Enrolled" : "No"}
                </div>
              </div>

              {/* PMJJBY */}
              <div
                className={`p-3.5 rounded-xl border text-center transition-all ${
                  record.enrollPMJJBY
                    ? "bg-blue-50/70 border-blue-300 text-blue-900"
                    : "bg-slate-50 border-slate-200 text-slate-400"
                }`}
              >
                <div className="font-extrabold text-xs">PMJJBY</div>
                <div className="text-[11px] mt-1 font-semibold">
                  {record.enrollPMJJBY ? "✓ Enrolled" : "No"}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: Deliverables Status */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Clock size={15} className="text-indigo-600" />
              <span>Deliverables Status</span>
            </h2>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-xl">
                <div className="text-slate-400 font-medium">Passbook Status</div>
                <div className="font-bold text-slate-800 mt-1">
                  {record.passbookDelivered ? (
                    <span className="text-emerald-700">✓ Delivered ({record.passbookDeliveredAt || "Recorded"})</span>
                  ) : record.passbookIssued ? (
                    <span className="text-blue-700">⌛ Issued ({record.passbookIssuedAt || "Recorded"})</span>
                  ) : (
                    <span className="text-slate-400">Pending</span>
                  )}
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl">
                <div className="text-slate-400 font-medium">ATM Card Status</div>
                <div className="font-bold text-slate-800 mt-1">
                  {record.atmDelivered ? (
                    <span className="text-emerald-700">✓ Delivered ({record.atmDeliveredAt || "Recorded"})</span>
                  ) : record.atmIssued ? (
                    <span className="text-blue-700">⌛ Issued ({record.atmIssuedAt || "Recorded"})</span>
                  ) : (
                    <span className="text-slate-400">Pending</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Actions Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Account Actions
            </h2>

            <button
              onClick={() => onPrintReceipt(record)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
            >
              <Printer size={15} />
              <span>Print Bank of Baroda Slip</span>
            </button>

            <button
              onClick={() => onEdit(record)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 transition-colors"
            >
              <Edit size={15} />
              <span>Edit Account Details</span>
            </button>

            <button
              onClick={handleDelete}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl border border-red-200 transition-colors"
            >
              <Trash2 size={15} />
              <span>Delete Customer Account</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
