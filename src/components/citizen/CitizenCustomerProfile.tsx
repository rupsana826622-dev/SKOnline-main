import React, { useState } from "react";
import {
  ArrowLeft, User, Phone, MapPin, Calendar, Tag, Lock, Eye, EyeOff,
  Copy, Check, FileText, Download, ExternalLink, Upload,
  CreditCard, CheckCircle, Clock, AlertCircle, Trash2, Edit, Printer, Sparkles, X
} from "lucide-react";
import type { CitizenServiceRecord } from "@/types/citizen";
import { updateCitizenRecord, uploadCitizenDocument, deleteCitizenRecord, settleCitizenDue } from "@/lib/citizenStorage";
import { formatDateTime } from "@/lib/utils";
import { toast } from "sonner";
import SEO from "@/components/common/SEO";

interface CitizenCustomerProfileProps {
  record: CitizenServiceRecord;
  onBack: () => void;
  onEdit: (record: CitizenServiceRecord) => void;
  onPrintReceipt: (record: CitizenServiceRecord) => void;
  onRecordUpdated: (record: CitizenServiceRecord) => void;
  onRecordDeleted: (id: string) => void;
}

export default function CitizenCustomerProfile({
  record,
  onBack,
  onEdit,
  onPrintReceipt,
  onRecordUpdated,
  onRecordDeleted,
}: CitizenCustomerProfileProps) {
  const [showPassword, setShowPassword] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<CitizenServiceRecord>(record);
  const [settlingPayment, setSettlingPayment] = useState(false);

  React.useEffect(() => {
    setCurrentRecord(record);
  }, [record]);

  const handleCopy = (text: string, fieldName: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`${fieldName} copied to clipboard!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDoc(true);
    const toastId = toast.loading("Uploading document to Supabase Cloud...");

    try {
      const { url, error } = await uploadCitizenDocument(file, currentRecord.id);
      if (error || !url) {
        toast.error(`Document upload failed: ${error?.message || "Storage error"}`, { id: toastId });
        return;
      }

      const updated: CitizenServiceRecord = {
        ...currentRecord,
        documentFileUrl: url,
        updatedAt: new Date().toISOString(),
      };

      await updateCitizenRecord(currentRecord.id, { documentFileUrl: url });
      setCurrentRecord(updated);
      onRecordUpdated(updated);

      toast.success("Document attached successfully to customer record!", { id: toastId });
    } catch (err: any) {
      toast.error(`Upload error: ${err.message || "Failed to upload file"}`, { id: toastId });
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleQuickSettle = async (mode: "Cash" | "UPI") => {
    if (currentRecord.dueAmount <= 0) return;
    setSettlingPayment(true);

    try {
      const res = await settleCitizenDue(currentRecord.id, mode);
      if (res.error) {
        toast.error("Failed to update settlement.");
        return;
      }

      const updated: CitizenServiceRecord = {
        ...currentRecord,
        advancePaid: currentRecord.totalAmount,
        dueAmount: 0,
        paymentMode: mode,
        paymentStatus: "Full Paid",
        updatedAt: new Date().toISOString(),
      };

      setCurrentRecord(updated);
      onRecordUpdated(updated);
      toast.success(`Due amount settled via ${mode}! Payment marked as Full Paid.`);
    } catch (err: any) {
      toast.error(`Error settling payment: ${err.message || "Unknown error"}`);
    } finally {
      setSettlingPayment(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Permanently delete application for "${currentRecord.customerName}"? This action cannot be undone.`)) return;

    try {
      await deleteCitizenRecord(currentRecord.id);
      toast.success(`Application for "${currentRecord.customerName}" deleted.`);
      onRecordDeleted(currentRecord.id);
      onBack();
    } catch (err: any) {
      toast.error(`Error deleting record: ${err?.message || "Unknown error"}`);
    }
  };

  const getDynamicServiceDocTitle = (service: string) => {
    const s = service.toLowerCase();
    if (s.includes("pan")) return "Allotted PAN Card Number";
    if (s.includes("passport")) return "Passport Number";
    if (s.includes("voter") || s.includes("epic")) return "EPIC / Voter Card Number";
    if (s.includes("ration")) return "Digital Ration Card Number";
    if (s.includes("trade")) return "Trade License Number";
    if (s.includes("food") || s.includes("fssai")) return "FSSAI License Number";
    if (s.includes("ticket") || s.includes("train") || s.includes("flight")) return "PNR / Ticket Booking ID";
    return "Allotted Document / Service Number";
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-fade-in">
      <SEO title={`${currentRecord.customerName} — Citizen Profile & Documentation Hub`} />

      {/* Top Bar Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all shadow-xs"
          >
            <ArrowLeft size={15} />
            <span>Back to Customer List</span>
          </button>

          <div className="h-5 w-px bg-slate-200 hidden sm:block" />

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm shadow-xs">
              {currentRecord.serialNo}
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight">
                {currentRecord.customerName}
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">
                {currentRecord.serviceType} · Applied on {currentRecord.applicationDate}
              </p>
            </div>
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex items-center gap-2">
          {currentRecord.dueAmount === 0 ? (
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
              PAID ({currentRecord.paymentMode})
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
              DUE ₹{currentRecord.dueAmount}
            </span>
          )}

          {currentRecord.status === "Delivered" || !!currentRecord.deliveredDate ? (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-800 border border-teal-200">
              ✓ Delivered
            </span>
          ) : currentRecord.status === "Issued" || !!currentRecord.issuedDate ? (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
              ⌛ Issued
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
              Applied
            </span>
          )}
        </div>
      </div>

      {/* Grid Layout for Full-Width Dashboard Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols wide on desktop) */}
        <div className="lg:col-span-2 space-y-6">
          {/* SECTION 1: Portal Login Credentials Card */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider">
                <Lock size={15} />
                <span>Portal Login Credentials</span>
              </div>
              <span className="text-[11px] text-amber-300 font-semibold bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-800/40">
                Operator Confidential (No Print)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Application / User ID */}
              <div className="bg-slate-800/90 p-4 rounded-xl border border-slate-700/80">
                <div className="text-xs text-slate-400 font-medium">Application / User ID</div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="font-mono text-lg font-bold text-white tracking-wide truncate">
                    {currentRecord.appNumber || "—"}
                  </span>
                  {currentRecord.appNumber && (
                    <button
                      onClick={() => handleCopy(currentRecord.appNumber, "Application ID")}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors shrink-0"
                      title="Copy Application ID"
                    >
                      {copiedField === "Application ID" ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                    </button>
                  )}
                </div>
              </div>

              {/* Portal Password / DOB */}
              <div className="bg-slate-800/90 p-4 rounded-xl border border-slate-700/80">
                <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                  <span>Portal Password / DOB</span>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="font-mono text-lg font-bold text-amber-300 tracking-wider truncate">
                    {currentRecord.portalPassword
                      ? showPassword
                        ? currentRecord.portalPassword
                        : "••••••••"
                      : "—"}
                  </span>
                  {currentRecord.portalPassword && (
                    <button
                      onClick={() => handleCopy(currentRecord.portalPassword || "", "Password")}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors shrink-0"
                      title="Copy Password"
                    >
                      {copiedField === "Password" ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: Final Document / Service Number & Supabase Cloud PDF Attachment */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Tag size={15} className="text-blue-600" />
              <span>Final Document & Cloud PDF Attachment</span>
            </h2>

            {/* Final Service / Document No */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-500 font-medium">
                  {getDynamicServiceDocTitle(currentRecord.serviceType)}
                </div>
                <div className="text-base font-mono font-bold text-slate-900 mt-1">
                  {currentRecord.finalServiceNo || <span className="text-slate-400 font-normal italic">Pending / Not yet allotted</span>}
                </div>
              </div>
              {currentRecord.finalServiceNo && (
                <button
                  onClick={() => handleCopy(currentRecord.finalServiceNo || "", "Document Number")}
                  className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Copy Document Number"
                >
                  {copiedField === "Document Number" ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                </button>
              )}
            </div>

            {/* Cloud PDF File Section */}
            <div className="p-5 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <FileText size={22} className={currentRecord.documentFileUrl ? "text-emerald-600" : "text-slate-400"} />
                  <div>
                    <div className="text-sm font-bold text-slate-900">
                      {currentRecord.documentFileUrl ? "Attached Cloud Document (PDF / File)" : "No Document File Attached"}
                    </div>
                    <div className="text-xs text-slate-500">
                      {currentRecord.documentFileUrl ? "Stored securely on Supabase Storage" : "Attach e-PAN, Ticket, or Acknowledgement PDF"}
                    </div>
                  </div>
                </div>

                {currentRecord.documentFileUrl && (
                  <a
                    href={currentRecord.documentFileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow-md transition-all"
                  >
                    <ExternalLink size={14} />
                    <span>View / Download PDF</span>
                  </a>
                )}
              </div>

              {/* Upload or Replace button */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between flex-wrap gap-2">
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 cursor-pointer shadow-xs transition-colors">
                  <Upload size={14} className="text-blue-600" />
                  <span>{currentRecord.documentFileUrl ? "Upload New / Replace Document" : "Attach PDF File"}</span>
                  <input
                    type="file"
                    accept=".pdf,image/*,.doc,.docx"
                    onChange={handleFileUpload}
                    disabled={uploadingDoc}
                    className="hidden"
                  />
                </label>
                {uploadingDoc && (
                  <span className="text-xs text-blue-600 font-semibold animate-pulse">
                    Uploading file to Supabase Cloud...
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 4: Customer Contact & Details */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <User size={15} className="text-blue-600" />
              <span>Customer Details & Address</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-xl">
                <div className="text-slate-400 font-medium">Customer Full Name</div>
                <div className="font-bold text-slate-900 mt-1 text-sm">{currentRecord.customerName}</div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl">
                <div className="text-slate-400 font-medium">Contact Number</div>
                <div className="font-mono font-bold text-slate-900 mt-1 text-sm flex items-center justify-between">
                  <span>{currentRecord.contactNo}</span>
                  <button
                    onClick={() => handleCopy(currentRecord.contactNo, "Contact Number")}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    {copiedField === "Contact Number" ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl sm:col-span-2">
                <div className="text-slate-400 font-medium">Address / Village / Landmark</div>
                <div className="font-semibold text-slate-800 mt-1 text-sm">{currentRecord.address || "—"}</div>
              </div>

              {currentRecord.notes && (
                <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl sm:col-span-2">
                  <div className="text-amber-900 font-bold text-xs">Notes / Special Instructions</div>
                  <div className="text-slate-800 mt-1 text-xs">{currentRecord.notes}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (1 Col on desktop) */}
        <div className="space-y-6">
          {/* SECTION 3: Billing Breakdown Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <CreditCard size={15} className="text-emerald-600" />
                <span>Billing & Payments</span>
              </h2>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <span className="text-xs text-slate-600 font-medium">Total Charge</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  ₹{currentRecord.totalAmount.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                <span className="text-xs text-emerald-800 font-medium">Advance Paid</span>
                <span className="font-mono font-bold text-emerald-700 text-sm">
                  ₹{currentRecord.advancePaid.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-amber-50/60 rounded-xl border border-amber-100">
                <span className="text-xs text-amber-800 font-medium">Balance Due</span>
                <span className="font-mono font-bold text-amber-700 text-sm">
                  ₹{currentRecord.dueAmount.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <span className="text-xs text-slate-600 font-medium">Payment Mode</span>
                <span className="font-bold text-slate-800 text-xs uppercase">
                  {currentRecord.paymentMode}
                </span>
              </div>
            </div>

            {/* Quick Settle Action if due is greater than 0 */}
            {currentRecord.dueAmount > 0 && (
              <div className="pt-2 space-y-2">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Quick Settle Due:
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    disabled={settlingPayment}
                    onClick={() => handleQuickSettle("Cash")}
                    className="py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors"
                  >
                    Settle Cash
                  </button>
                  <button
                    disabled={settlingPayment}
                    onClick={() => handleQuickSettle("UPI")}
                    className="py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-colors"
                  >
                    Settle UPI
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 5: Service Delivery Lifecycle */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Clock size={15} className="text-indigo-600" />
              <span>Service Delivery Timeline</span>
            </h2>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-slate-400 font-medium">Application Date</div>
                <div className="font-semibold text-slate-800 mt-0.5">{currentRecord.applicationDate}</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-slate-400 font-medium">Document Issued Date</div>
                <div className="font-semibold text-slate-800 mt-0.5">
                  {currentRecord.issuedDate || <span className="text-slate-400 font-normal">Pending Issue</span>}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-slate-400 font-medium">Delivered to Customer</div>
                <div className="font-semibold text-slate-800 mt-0.5">
                  {currentRecord.deliveredDate || <span className="text-slate-400 font-normal">Pending Delivery</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Actions Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Application Actions
            </h2>

            <button
              onClick={() => onPrintReceipt(currentRecord)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
            >
              <Printer size={15} />
              <span>Print Customer Receipt (Half-A4)</span>
            </button>

            <button
              onClick={() => onEdit(currentRecord)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 transition-colors"
            >
              <Edit size={15} />
              <span>Edit Application Details</span>
            </button>

            <button
              onClick={handleDelete}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl border border-red-200 transition-colors"
            >
              <Trash2 size={15} />
              <span>Delete Application Record</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
