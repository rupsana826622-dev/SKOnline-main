import React, { useState, useMemo } from "react";
import {
  X, User, Phone, MapPin, Calendar, Tag, Lock, Eye, EyeOff,
  Copy, Check, FileText, Download, ExternalLink, Upload,
  CreditCard, CheckCircle, Clock, AlertCircle, Trash2, Edit, Printer, Sparkles, PlusCircle
} from "lucide-react";
import type { CitizenServiceRecord, CitizenDocumentAttachment } from "@/types/citizen";
import {
  updateCitizenRecord,
  uploadCitizenDocumentAttachment,
  deleteCitizenDocumentAttachment,
  deleteCitizenRecord
} from "@/lib/citizenStorage";
import { formatDateTime } from "@/lib/utils";
import { toast } from "sonner";

interface CitizenProfileDrawerProps {
  record: CitizenServiceRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (record: CitizenServiceRecord) => void;
  onPrintReceipt: (record: CitizenServiceRecord) => void;
  onRecordUpdated?: (record: CitizenServiceRecord) => void;
  onRecordDeleted?: (id: string) => void;
}

export default function CitizenProfileDrawer({
  record,
  isOpen,
  onClose,
  onEdit,
  onPrintReceipt,
  onRecordUpdated,
  onRecordDeleted,
}: CitizenProfileDrawerProps) {
  const [showPassword, setShowPassword] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<CitizenServiceRecord | null>(record);

  // Keep internal state updated when record changes
  React.useEffect(() => {
    setCurrentRecord(record);
  }, [record]);

  // Normalise attached documents list
  const attachedDocuments: CitizenDocumentAttachment[] = useMemo(() => {
    if (!currentRecord) return [];
    if (Array.isArray(currentRecord.documentFiles) && currentRecord.documentFiles.length > 0) {
      return currentRecord.documentFiles;
    }
    if (currentRecord.documentFileUrl) {
      return [{
        name: "Attached Document",
        url: currentRecord.documentFileUrl,
        size_kb: 0,
        uploaded_at: currentRecord.applicationDate || new Date().toISOString(),
      }];
    }
    return [];
  }, [currentRecord]);

  if (!isOpen || !currentRecord) return null;

  const handleCopy = (text: string, fieldName: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`${fieldName} copied to clipboard!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentRecord) return;

    setUploadingDoc(true);
    const toastId = toast.loading("Optimizing & Compressing Document... Please wait");

    try {
      const { doc, updatedList, error } = await uploadCitizenDocumentAttachment(
        file,
        currentRecord.id,
        attachedDocuments
      );

      if (error || !doc) {
        toast.error(`Document upload failed: ${error?.message || "Storage error"}`, { id: toastId });
        return;
      }

      const updated: CitizenServiceRecord = {
        ...currentRecord,
        documentFiles: updatedList,
        documentFileUrl: doc.url,
        updatedAt: new Date().toISOString(),
      };

      setCurrentRecord(updated);
      if (onRecordUpdated) onRecordUpdated(updated);

      toast.success(`Document "${file.name}" compressed and attached successfully!`, { id: toastId });
    } catch (err: any) {
      toast.error(`Upload error: ${err.message || "Failed to upload file"}`, { id: toastId });
    } finally {
      setUploadingDoc(false);
      e.target.value = "";
    }
  };

  const handleDeleteDoc = async (doc: CitizenDocumentAttachment) => {
    if (!currentRecord) return;
    if (!confirm(`Delete attached document "${doc.name}"?`)) return;

    const toastId = toast.loading("Removing document...");
    try {
      const { updatedList, error } = await deleteCitizenDocumentAttachment(
        currentRecord.id,
        doc,
        attachedDocuments
      );

      if (error) {
        toast.error(`Failed to delete document: ${error.message || "Error"}`, { id: toastId });
        return;
      }

      const updated: CitizenServiceRecord = {
        ...currentRecord,
        documentFiles: updatedList,
        documentFileUrl: updatedList.length > 0 ? updatedList[updatedList.length - 1].url : undefined,
        updatedAt: new Date().toISOString(),
      };

      setCurrentRecord(updated);
      if (onRecordUpdated) onRecordUpdated(updated);

      toast.success("Document removed successfully.", { id: toastId });
    } catch (err: any) {
      toast.error(`Error deleting document: ${err.message || "Unknown error"}`, { id: toastId });
    }
  };

  const handleDelete = async () => {
    if (!currentRecord) return;
    if (!confirm(`Are you sure you want to permanently delete application for "${currentRecord.customerName}"?`)) return;

    try {
      await deleteCitizenRecord(currentRecord.id);
      toast.success(`Application for "${currentRecord.customerName}" deleted.`);
      if (onRecordDeleted) onRecordDeleted(currentRecord.id);
      onClose();
    } catch (err: any) {
      toast.error(`Error deleting: ${err.message || "Unknown error"}`);
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
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fade-in">
      {/* Compression & Uploading Spinner Overlay */}
      {uploadingDoc && (
        <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex flex-col items-center justify-center text-white">
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-700 shadow-2xl flex flex-col items-center gap-3 max-w-sm text-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <div>
              <h3 className="font-bold text-base text-white">Optimizing & Compressing Document...</h3>
              <p className="text-xs text-slate-300 mt-1">Please wait</p>
            </div>
          </div>
        </div>
      )}

      <div
        className="w-full max-w-2xl h-full bg-slate-50 shadow-2xl flex flex-col overflow-hidden border-l border-slate-200 animate-slide-left"
        onClick={e => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="px-6 py-5 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20">
              <User size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">{currentRecord.customerName}</h2>
                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-blue-100 text-blue-800">
                  SL {currentRecord.serialNo}
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                <span className="font-semibold text-blue-600">{currentRecord.serviceType}</span>
                <span>•</span>
                <span>Applied on {currentRecord.applicationDate}</span>
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
          {/* 1. Portal Credentials Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-5 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
              <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider">
                <Lock size={14} />
                <span>Portal Login Credentials</span>
              </div>
              <span className="text-[10px] text-amber-300 font-semibold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">
                Operator Confidential (No Print)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* App / User ID */}
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/70">
                <div className="text-[11px] text-slate-400 font-medium">Application / User ID</div>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-mono text-base font-bold text-white tracking-wide truncate">
                    {currentRecord.appNumber || "—"}
                  </span>
                  {currentRecord.appNumber && (
                    <button
                      onClick={() => handleCopy(currentRecord.appNumber, "Application ID")}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md transition-colors shrink-0"
                      title="Copy ID"
                    >
                      {copiedField === "Application ID" ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                  )}
                </div>
              </div>

              {/* Password / Passkey */}
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/70">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                  <span>Portal Password / DOB</span>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-mono text-base font-bold text-amber-300 tracking-wider truncate">
                    {currentRecord.portalPassword
                      ? showPassword
                        ? currentRecord.portalPassword
                        : "••••••••"
                      : "—"}
                  </span>
                  {currentRecord.portalPassword && (
                    <button
                      onClick={() => handleCopy(currentRecord.portalPassword || "", "Password")}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md transition-colors shrink-0"
                      title="Copy Password"
                    >
                      {copiedField === "Password" ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 2. Document & Final Service Number Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Tag size={14} className="text-blue-600" />
              <span>Final Document & Attached Cloud Documents</span>
            </h3>

            {/* Final Service / Document No */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-slate-500 font-medium">
                  {getDynamicServiceDocTitle(currentRecord.serviceType)}
                </div>
                <div className="text-sm font-mono font-bold text-slate-900 mt-0.5">
                  {currentRecord.finalServiceNo || <span className="text-slate-400 font-normal italic">Not allotted / pending</span>}
                </div>
              </div>
              {currentRecord.finalServiceNo && (
                <button
                  onClick={() => handleCopy(currentRecord.finalServiceNo || "", "Document Number")}
                  className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                  title="Copy Document Number"
                >
                  {copiedField === "Document Number" ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
                </button>
              )}
            </div>

            {/* Multi-Document Attachments Section */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-blue-600" />
                  <span className="text-xs font-bold text-slate-800">
                    Attached Documents ({attachedDocuments.length})
                  </span>
                </div>

                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg cursor-pointer shadow-2xs transition-colors">
                  <Upload size={13} />
                  <span>+ Attach Document</span>
                  <input
                    type="file"
                    accept=".pdf,image/*,.doc,.docx"
                    onChange={handleFileUpload}
                    disabled={uploadingDoc}
                    className="hidden"
                  />
                </label>
              </div>

              {attachedDocuments.length > 0 ? (
                <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg bg-white overflow-hidden shadow-2xs">
                  {attachedDocuments.map((doc, idx) => (
                    <div key={idx} className="p-2.5 flex items-center justify-between gap-2 hover:bg-slate-50 transition-colors text-xs">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-800 truncate">{doc.name || `File #${idx + 1}`}</p>
                        <p className="text-[10px] text-slate-500">{doc.size_kb ? `${doc.size_kb} KB` : "Optimized"}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 rounded font-semibold transition-colors inline-flex items-center gap-1"
                        >
                          <ExternalLink size={12} />
                          <span>View</span>
                        </a>
                        <button
                          onClick={() => handleDeleteDoc(doc)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-xs text-slate-400">
                  No documents attached yet.
                </div>
              )}
            </div>
          </div>

          {/* 3. Customer Information & Contact */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <User size={14} className="text-blue-600" />
              <span>Customer Information</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-slate-400 font-medium">Customer Name</div>
                <div className="font-bold text-slate-900 mt-0.5 text-sm">{currentRecord.customerName}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-slate-400 font-medium">Mobile Number</div>
                <div className="font-mono font-bold text-slate-900 mt-0.5 text-sm flex items-center justify-between">
                  <span>{currentRecord.contactNo}</span>
                  <button
                    onClick={() => handleCopy(currentRecord.contactNo, "Mobile Number")}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    {copiedField === "Mobile Number" ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                  </button>
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl sm:col-span-2">
                <div className="text-slate-400 font-medium">Address / Village</div>
                <div className="font-semibold text-slate-800 mt-0.5">{currentRecord.address || "—"}</div>
              </div>
              {currentRecord.notes && (
                <div className="p-3 bg-amber-50/60 border border-amber-100 rounded-xl sm:col-span-2">
                  <div className="text-amber-800 font-bold text-[11px]">Notes / Remarks</div>
                  <div className="text-slate-700 mt-0.5">{currentRecord.notes}</div>
                </div>
              )}
            </div>
          </div>

          {/* 4. Payment Breakdown & Financials */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <CreditCard size={14} className="text-emerald-600" />
                <span>Payment & Billing Breakdown</span>
              </h3>
              {currentRecord.dueAmount === 0 ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800">
                  Full Paid ({currentRecord.paymentMode})
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800">
                  Due Balance: ₹{currentRecord.dueAmount}
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-[11px] text-slate-500 font-medium">Total Charge</div>
                <div className="text-sm font-mono font-bold text-slate-900 mt-0.5">
                  ₹{currentRecord.totalAmount.toLocaleString("en-IN")}
                </div>
              </div>
              <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200">
                <div className="text-[11px] text-emerald-700 font-medium">Advance Paid</div>
                <div className="text-sm font-mono font-bold text-emerald-700 mt-0.5">
                  ₹{currentRecord.advancePaid.toLocaleString("en-IN")}
                </div>
              </div>
              <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200">
                <div className="text-[11px] text-amber-700 font-medium">Balance Due</div>
                <div className="text-sm font-mono font-bold text-amber-700 mt-0.5">
                  ₹{currentRecord.dueAmount.toLocaleString("en-IN")}
                </div>
              </div>
            </div>
          </div>

          {/* 5. Status & Delivery Timeline */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Clock size={14} className="text-indigo-600" />
              <span>Service Delivery Lifecycle</span>
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-slate-400 font-medium">Current Status</div>
                <div className="font-bold text-slate-800 mt-0.5 capitalize">
                  {currentRecord.status || "Applied"}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-slate-400 font-medium">Application Date</div>
                <div className="font-semibold text-slate-800 mt-0.5">
                  {currentRecord.applicationDate}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-slate-400 font-medium">Document Issued Date</div>
                <div className="font-semibold text-slate-800 mt-0.5">
                  {currentRecord.issuedDate || "—"}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-slate-400 font-medium">Delivered to Customer</div>
                <div className="font-semibold text-slate-800 mt-0.5">
                  {currentRecord.deliveredDate || "—"}
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
              onClick={() => onPrintReceipt(currentRecord)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors border border-blue-200"
            >
              <Printer size={14} />
              <span>Print Receipt</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onEdit(currentRecord);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow transition-colors"
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
