import React, { useState } from "react";
import {
  X, User, Phone, MapPin, Calendar, CreditCard, ShieldCheck,
  CheckCircle, Clock, Trash2, Edit, Printer, Copy, Check, Building2
} from "lucide-react";
import type { BobCustomerRecord } from "@/types/bob";
import { deleteBobCustomer } from "@/lib/bobStorage";
import { formatDateTime } from "@/lib/utils";
import { toast } from "sonner";

interface BobProfileDrawerProps {
  record: BobCustomerRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (record: BobCustomerRecord) => void;
  onPrintReceipt: (record: BobCustomerRecord) => void;
  onRecordDeleted?: (id: string) => void;
}

export default function BobProfileDrawer({
  record,
  isOpen,
  onClose,
  onEdit,
  onPrintReceipt,
  onRecordDeleted,
}: BobProfileDrawerProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isOpen || !record) return null;

  const handleCopy = (text: string, fieldName: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`${fieldName} copied to clipboard!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDelete = async () => {
    if (!record) return;
    if (!confirm(`Are you sure you want to delete Bank of Baroda account for "${record.customerName}"?`)) return;

    try {
      await deleteBobCustomer(record.id);
      toast.success(`Account for "${record.customerName}" deleted.`);
      if (onRecordDeleted) onRecordDeleted(record.id);
      onClose();
    } catch (err: any) {
      toast.error(`Error deleting: ${err?.message || "Unknown error"}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fade-in">
      <div
        className="w-full max-w-2xl h-full bg-slate-50 shadow-2xl flex flex-col overflow-hidden border-l border-slate-200 animate-slide-left"
        onClick={e => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="px-6 py-5 bg-white border-b border-orange-100 flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-orange-600 text-white flex items-center justify-center font-bold shadow-md shadow-orange-500/20">
              <Building2 size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">{record.customerName}</h2>
                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-orange-100 text-orange-900">
                  SL {record.slNo}
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                <span className="font-semibold text-orange-700">Bank of Baroda CSP</span>
                <span>•</span>
                <span>A/c Opened on {record.accountOpeningDate}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            title="Close Drawer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scroll p-6 space-y-5">
          {/* 1. Primary Banking Numbers Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-5 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
              <div className="flex items-center gap-2 text-orange-400 text-xs font-bold uppercase tracking-wider">
                <CreditCard size={14} />
                <span>BOB Account Identifiers</span>
              </div>
              <span className="text-[10px] text-orange-300 font-semibold bg-orange-950/60 px-2 py-0.5 rounded border border-orange-800/40">
                Official CSP Record
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Account Number */}
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/70 sm:col-span-3">
                <div className="text-[11px] text-slate-400 font-medium">Account Number</div>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-mono text-lg font-extrabold text-white tracking-wider">
                    {record.accountNo || "PENDING ALLOCATION"}
                  </span>
                  {record.accountNo && (
                    <button
                      onClick={() => handleCopy(record.accountNo, "Account Number")}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md transition-colors"
                      title="Copy Account Number"
                    >
                      {copiedField === "Account Number" ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
                    </button>
                  )}
                </div>
              </div>

              {/* CIF Number */}
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/70">
                <div className="text-[11px] text-slate-400 font-medium">CIF Number</div>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-mono text-sm font-bold text-orange-300 truncate">
                    {record.cifNo || "—"}
                  </span>
                  {record.cifNo && (
                    <button
                      onClick={() => handleCopy(record.cifNo, "CIF Number")}
                      className="p-1 text-slate-400 hover:text-white rounded transition-colors"
                      title="Copy CIF"
                    >
                      {copiedField === "CIF Number" ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    </button>
                  )}
                </div>
              </div>

              {/* Reference Number */}
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/70">
                <div className="text-[11px] text-slate-400 font-medium">Reference Number</div>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-mono text-sm font-bold text-slate-200 truncate">
                    {record.refNo || "—"}
                  </span>
                  {record.refNo && (
                    <button
                      onClick={() => handleCopy(record.refNo, "Reference Number")}
                      className="p-1 text-slate-400 hover:text-white rounded transition-colors"
                      title="Copy Ref"
                    >
                      {copiedField === "Reference Number" ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    </button>
                  )}
                </div>
              </div>

              {/* SL NO */}
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/70">
                <div className="text-[11px] text-slate-400 font-medium">Register Serial</div>
                <div className="font-mono text-sm font-bold text-white mt-1">
                  #{record.slNo}
                </div>
              </div>
            </div>
          </div>

          {/* 2. Customer Personal Details */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <User size={14} className="text-orange-600" />
              <span>Customer Personal Details</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-slate-400 font-medium">Customer Full Name</div>
                <div className="font-bold text-slate-900 mt-0.5 text-sm">{record.customerName}</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-slate-400 font-medium">Care Of / Guardian</div>
                <div className="font-semibold text-slate-800 mt-0.5">{record.guardianName || "—"}</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-slate-400 font-medium">Mobile Number</div>
                <div className="font-mono font-bold text-slate-900 mt-0.5 text-sm flex items-center justify-between">
                  <span>{record.mobile || "—"}</span>
                  {record.mobile && (
                    <button
                      onClick={() => handleCopy(record.mobile, "Mobile Number")}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      {copiedField === "Mobile Number" ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                    </button>
                  )}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-slate-400 font-medium">Date of Birth</div>
                <div className="font-mono font-semibold text-slate-800 mt-0.5">{record.dob || "—"}</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-slate-400 font-medium">Aadhaar Number</div>
                <div className="font-mono font-bold text-slate-800 mt-0.5">{record.aadhaarNo || "—"}</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-slate-400 font-medium">Account Opening Date</div>
                <div className="font-semibold text-slate-800 mt-0.5">{record.accountOpeningDate}</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl sm:col-span-2">
                <div className="text-slate-400 font-medium">Address</div>
                <div className="font-semibold text-slate-800 mt-0.5">{record.address || "—"}</div>
              </div>
            </div>
          </div>

          {/* 3. Social Security Scheme (SSS) Enrollments */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-orange-600" />
              <span>Social Security Scheme (SSS) Enrollments</span>
            </h3>

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
                  {record.enrollAPY ? "✓ Enrolled" : "Not Enrolled"}
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
                  {record.enrollPMSBY ? "✓ Enrolled" : "Not Enrolled"}
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
                  {record.enrollPMJJBY ? "✓ Enrolled" : "Not Enrolled"}
                </div>
              </div>
            </div>
          </div>

          {/* 4. Passbook & ATM Deliverables Lifecycle */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Clock size={14} className="text-indigo-600" />
              <span>Deliverables Status</span>
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-slate-400 font-medium">Passbook Status</div>
                <div className="font-bold text-slate-800 mt-0.5 flex items-center gap-1.5">
                  {record.passbookDelivered ? (
                    <span className="text-emerald-700">✓ Delivered ({record.passbookDeliveredAt || "Recorded"})</span>
                  ) : record.passbookIssued ? (
                    <span className="text-blue-700">⌛ Issued ({record.passbookIssuedAt || "Recorded"})</span>
                  ) : (
                    <span className="text-slate-400">Pending</span>
                  )}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-slate-400 font-medium">ATM Card Status</div>
                <div className="font-bold text-slate-800 mt-0.5 flex items-center gap-1.5">
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
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between gap-3 shrink-0 shadow-sm">
          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors border border-red-200"
          >
            <Trash2 size={14} />
            <span>Delete</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPrintReceipt(record)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-xl transition-colors border border-orange-200"
            >
              <Printer size={14} />
              <span>Print Receipt</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onEdit(record);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow transition-colors"
            >
              <Edit size={14} />
              <span>Edit Details</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
