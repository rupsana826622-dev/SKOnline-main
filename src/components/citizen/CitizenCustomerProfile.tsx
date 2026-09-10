import React, { useState, useMemo } from "react";
import {
  ArrowLeft, User, Phone, MapPin, Calendar, Tag, Lock, Eye, EyeOff,
  Copy, Check, FileText, Download, ExternalLink, Upload,
  CreditCard, CheckCircle, Clock, AlertCircle, Trash2, Edit, Printer, Sparkles, X, PlusCircle, ShieldCheck
} from "lucide-react";
import type { CitizenServiceRecord, CitizenDocumentAttachment } from "@/types/citizen";
import {
  updateCitizenRecord,
  uploadCitizenDocumentAttachment,
  deleteCitizenDocumentAttachment,
  deleteCitizenRecord,
  settleCitizenDue,
  addCitizenRecord,
  getCitizenSettings,
  getNextSerialNo,
  getCitizenRecords
} from "@/lib/citizenStorage";
import { formatDateTime, generateId } from "@/lib/utils";
import { toast } from "sonner";
import SEO from "@/components/common/SEO";
import { DEFAULT_CITIZEN_SERVICES } from "@/types/citizen";

interface CitizenCustomerProfileProps {
  record: CitizenServiceRecord;
  allRecords?: CitizenServiceRecord[];
  onBack: () => void;
  onEdit: (record: CitizenServiceRecord) => void;
  onPrintReceipt: (record: CitizenServiceRecord) => void;
  onRecordUpdated: (record: CitizenServiceRecord) => void;
  onRecordDeleted: (id: string) => void;
  onRefreshData?: () => void;
  onSelectRecord?: (record: CitizenServiceRecord) => void;
}

export default function CitizenCustomerProfile({
  record,
  allRecords = [],
  onBack,
  onEdit,
  onPrintReceipt,
  onRecordUpdated,
  onRecordDeleted,
  onRefreshData,
  onSelectRecord,
}: CitizenCustomerProfileProps) {
  const [showPassword, setShowPassword] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<CitizenServiceRecord>(record);
  const [settlingPayment, setSettlingPayment] = useState(false);

  // Modal for "+ Add New Service to This Customer"
  const [addServiceModalOpen, setAddServiceModalOpen] = useState(false);
  const [isAddingService, setIsAddingService] = useState(false);
  const settings = getCitizenSettings();
  const availableServices = settings.serviceTypes && settings.serviceTypes.length > 0
    ? settings.serviceTypes
    : DEFAULT_CITIZEN_SERVICES;

  const todayStr = new Date().toISOString().slice(0, 10);
  const [newServiceType, setNewServiceType] = useState(availableServices[0] || "PAN Card");
  const [newApplicationDate, setNewApplicationDate] = useState(todayStr);
  const [newAppNumber, setNewAppNumber] = useState("");
  const [newPortalPassword, setNewPortalPassword] = useState("");
  const [newTotalAmount, setNewTotalAmount] = useState<number>(150);
  const [newAdvancePaid, setNewAdvancePaid] = useState<number>(150);
  const [newPaymentMode, setNewPaymentMode] = useState<"Cash" | "UPI">("Cash");
  const [newNotes, setNewNotes] = useState("");

  React.useEffect(() => {
    setCurrentRecord(record);
  }, [record]);

  // Compute all services taken by this customer
  const customerServices = useMemo(() => {
    const mobile = (currentRecord.contactNo || "").trim();
    const name = (currentRecord.customerName || "").trim().toLowerCase();
    const list = allRecords && allRecords.length > 0 ? allRecords : getCitizenRecords();

    return list.filter(r => {
      if (mobile && r.contactNo && r.contactNo.trim() === mobile) return true;
      if (!mobile && r.customerName && r.customerName.trim().toLowerCase() === name) return true;
      return r.id === currentRecord.id;
    });
  }, [allRecords, currentRecord]);

  // Normalise attached documents list
  const attachedDocuments: CitizenDocumentAttachment[] = useMemo(() => {
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
      onRecordUpdated(updated);
      if (onRefreshData) onRefreshData();

      toast.success(`Document "${file.name}" compressed and attached successfully!`, { id: toastId });
    } catch (err: any) {
      toast.error(`Upload error: ${err.message || "Failed to upload file"}`, { id: toastId });
    } finally {
      setUploadingDoc(false);
      e.target.value = "";
    }
  };

  const handleDeleteDoc = async (doc: CitizenDocumentAttachment) => {
    if (!confirm(`Delete attached document "${doc.name}"? This will remove it from cloud storage.`)) return;

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
      onRecordUpdated(updated);
      if (onRefreshData) onRefreshData();

      toast.success("Document removed successfully.", { id: toastId });
    } catch (err: any) {
      toast.error(`Error deleting document: ${err.message || "Unknown error"}`, { id: toastId });
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
      if (onRefreshData) onRefreshData();
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

  const handleOpenAddServiceModal = () => {
    setNewServiceType(availableServices[0] || "PAN Card");
    setNewApplicationDate(todayStr);
    setNewAppNumber("");
    setNewPortalPassword("");
    setNewTotalAmount(150);
    setNewAdvancePaid(150);
    setNewPaymentMode("Cash");
    setNewNotes("");
    setAddServiceModalOpen(true);
  };

  const handleAddServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceType) {
      toast.error("Please select a service type.");
      return;
    }
    if (!newAppNumber.trim()) {
      toast.error("Application / User ID is required.");
      return;
    }

    setIsAddingService(true);
    const toastId = toast.loading("Adding new service to customer profile...");

    try {
      const nextSl = getNextSerialNo();
      const total = Number(newTotalAmount) || 0;
      const adv = Number(newAdvancePaid) || 0;
      const due = Math.max(0, total - adv);
      const pStatus = due === 0 ? "Full Paid" : adv > 0 ? "Partial" : "Pending";

      const newRecord: CitizenServiceRecord = {
        id: generateId(),
        serialNo: nextSl,
        customerName: currentRecord.customerName.trim(),
        contactNo: currentRecord.contactNo.trim(),
        address: currentRecord.address?.trim() || "",
        serviceType: newServiceType,
        applicationDate: newApplicationDate || todayStr,
        appNumber: newAppNumber.trim(),
        portalPassword: newPortalPassword.trim(),
        finalServiceNo: "",
        totalAmount: total,
        advancePaid: adv,
        dueAmount: due,
        paymentMode: newPaymentMode,
        paymentStatus: pStatus,
        status: "Applied",
        notes: newNotes.trim() || undefined,
        documentFiles: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tenant_code: currentRecord.tenant_code || "new_csp",
        tenant_id: currentRecord.tenant_id || "new_csp",
      };

      const { error } = await addCitizenRecord(newRecord);
      if (error) {
        toast.error(`Failed to add service: ${error.message || "Database error"}`, { id: toastId });
        return;
      }

      toast.success(`Service "${newServiceType}" added successfully (SL #${nextSl})!`, { id: toastId });
      setAddServiceModalOpen(false);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      toast.error(`Error adding service: ${err.message || "Unknown error"}`, { id: toastId });
    } finally {
      setIsAddingService(false);
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
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-fade-in relative">
      <SEO title={`${currentRecord.customerName} — Citizen Profile & Documentation Hub`} />

      {/* Compression & Uploading Spinner Overlay */}
      {uploadingDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex flex-col items-center justify-center text-white">
          <div className="bg-slate-900 p-8 rounded-2xl border border-slate-700 shadow-2xl flex flex-col items-center gap-4 max-w-md text-center animate-scale-in">
            <div className="w-14 h-14 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <div>
              <h3 className="font-bold text-lg text-white">Optimizing & Compressing Document...</h3>
              <p className="text-sm text-slate-300 mt-1">Please wait while our browser engine minimizes size for high quality.</p>
            </div>
          </div>
        </div>
      )}

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

        {/* Action Buttons & Status Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleOpenAddServiceModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm hover:shadow-md"
          >
            <PlusCircle size={15} />
            <span>+ Add New Service to This Customer</span>
          </button>

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

          {/* SECTION 2: Final Document Number & Multi-File Cloud Attachments */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Tag size={15} className="text-blue-600" />
              <span>Final Document & Attached Cloud Documents</span>
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

            {/* Multi-Document Attachments Section */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-blue-600" />
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                    Attached Cloud Documents ({attachedDocuments.length})
                  </span>
                </div>

                {/* + Add Another Document Button */}
                <label className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs transition-all">
                  <Upload size={14} />
                  <span>+ Add Another Document</span>
                  <input
                    type="file"
                    accept=".pdf,image/*,.doc,.docx"
                    onChange={handleFileUpload}
                    disabled={uploadingDoc}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Itemized List of Uploaded Documents */}
              {attachedDocuments.length > 0 ? (
                <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl bg-white overflow-hidden shadow-2xs">
                  {attachedDocuments.map((doc, idx) => (
                    <div key={idx} className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                          <FileText size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
                            {doc.name || `Attachment #${idx + 1}`}
                          </p>
                          <p className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                            <span className="font-semibold text-emerald-600">{doc.size_kb ? `${doc.size_kb} KB` : "Optimized"}</span>
                            <span>•</span>
                            <span>{doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString("en-IN") : "Recent"}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 transition-colors"
                          title="Open Document in New Tab"
                        >
                          <ExternalLink size={13} />
                          <span>View / Download</span>
                        </a>

                        <button
                          onClick={() => handleDeleteDoc(doc)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
                          title="Delete this document"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 border border-dashed border-slate-300 rounded-xl bg-white text-slate-400 text-xs">
                  No cloud documents attached yet. Click "+ Add Another Document" to attach scans, PDFs, or photos.
                </div>
              )}
            </div>
          </div>

          {/* SECTION 3: Service History & Independent Receipts */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Clock size={15} className="text-blue-600" />
                <span>Service History & Independent Receipts ({customerServices.length})</span>
              </h2>

              <button
                onClick={handleOpenAddServiceModal}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
              >
                <PlusCircle size={13} />
                <span>+ New Service</span>
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-3.5 py-2.5">SL & Service</th>
                    <th className="px-3.5 py-2.5">Applied Date</th>
                    <th className="px-3.5 py-2.5">User ID / App No</th>
                    <th className="px-3.5 py-2.5">Billing</th>
                    <th className="px-3.5 py-2.5">Status</th>
                    <th className="px-3.5 py-2.5 text-right">Receipt Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {customerServices.map((srv) => (
                    <tr
                      key={srv.id}
                      className={`hover:bg-slate-50 transition-colors ${srv.id === currentRecord.id ? "bg-blue-50/40" : ""}`}
                    >
                      <td className="px-3.5 py-3 font-semibold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-slate-400">#{srv.serialNo}</span>
                          <span className="font-bold text-blue-900">{srv.serviceType}</span>
                          {srv.id === currentRecord.id && (
                            <span className="text-[9px] px-1.5 py-0.5 bg-blue-100 text-blue-700 font-extrabold rounded">
                              Current
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3.5 py-3 text-slate-600">{srv.applicationDate}</td>
                      <td className="px-3.5 py-3 font-mono font-medium text-slate-800">{srv.appNumber || "—"}</td>
                      <td className="px-3.5 py-3">
                        <div className="font-medium">
                          <span>₹{srv.totalAmount}</span>
                          {srv.dueAmount > 0 ? (
                            <span className="text-[10px] ml-1 text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-bold border border-amber-200">
                              Due ₹{srv.dueAmount}
                            </span>
                          ) : (
                            <span className="text-[10px] ml-1 text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold border border-emerald-200">
                              Paid
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3.5 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          srv.status === "Delivered" ? "bg-teal-50 text-teal-700 border border-teal-200" :
                          srv.status === "Issued" ? "bg-indigo-50 text-indigo-700 border border-indigo-200" :
                          "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}>
                          {srv.status || "Applied"}
                        </span>
                      </td>
                      <td className="px-3.5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {srv.id !== currentRecord.id && onSelectRecord && (
                            <button
                              onClick={() => {
                                setCurrentRecord(srv);
                                onSelectRecord(srv);
                              }}
                              className="px-2 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                              title="View this service"
                            >
                              Switch
                            </button>
                          )}
                          <button
                            onClick={() => onPrintReceipt(srv)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors shadow-2xs"
                            title={`Download Receipt for ${srv.serviceType}`}
                          >
                            <Printer size={12} />
                            <span>Download Receipt</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
          {/* SECTION 5: Billing Breakdown Card */}
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

          {/* SECTION 6: Service Delivery Lifecycle */}
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

      {/* MODAL: + Add Additional Service to This Customer */}
      {addServiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-scale-in my-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <PlusCircle size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Add New Service to Customer</h3>
                  <p className="text-xs text-slate-500">Demographics locked from current customer profile</p>
                </div>
              </div>
              <button
                onClick={() => setAddServiceModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddServiceSubmit} className="space-y-4">
              {/* Pre-populated & Locked Demographics */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  <span>Locked Customer Identity</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-800">
                  <div>
                    <span className="text-slate-400">Name: </span>
                    <strong className="text-slate-900">{currentRecord.customerName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Mobile: </span>
                    <strong className="text-slate-900">{currentRecord.contactNo}</strong>
                  </div>
                  {currentRecord.address && (
                    <div className="sm:col-span-2">
                      <span className="text-slate-400">Address: </span>
                      <span className="text-slate-800 font-medium">{currentRecord.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Service Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Service Type *</label>
                  <select
                    value={newServiceType}
                    onChange={(e) => setNewServiceType(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
                  >
                    {availableServices.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Application Date</label>
                  <input
                    type="date"
                    value={newApplicationDate}
                    onChange={(e) => setNewApplicationDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Application / User ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ACK12345678"
                    value={newAppNumber}
                    onChange={(e) => setNewAppNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Portal Password / DOB</label>
                  <input
                    type="text"
                    placeholder="e.g. DDMMYYYY or Password"
                    value={newPortalPassword}
                    onChange={(e) => setNewPortalPassword(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Billing Info */}
              <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-3">
                <div className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                  Service Billing Breakdown
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Total (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={newTotalAmount}
                      onChange={(e) => {
                        const t = Math.max(0, Number(e.target.value));
                        setNewTotalAmount(t);
                      }}
                      className="w-full px-2.5 py-1.5 text-xs font-mono font-bold border border-slate-300 rounded-lg focus:outline-none bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Advance (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={newAdvancePaid}
                      onChange={(e) => {
                        const adv = Math.max(0, Number(e.target.value));
                        setNewAdvancePaid(adv);
                      }}
                      className="w-full px-2.5 py-1.5 text-xs font-mono font-bold border border-slate-300 rounded-lg focus:outline-none bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Due (₹)</label>
                    <div className="w-full px-2.5 py-1.5 text-xs font-mono font-bold bg-slate-100 rounded-lg border border-slate-200 text-slate-700">
                      ₹{Math.max(0, newTotalAmount - newAdvancePaid)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Payment Mode</label>
                    <select
                      value={newPaymentMode}
                      onChange={(e) => setNewPaymentMode(e.target.value as "Cash" | "UPI")}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none bg-white"
                    >
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Notes / Service ID</label>
                    <input
                      type="text"
                      placeholder="Optional notes"
                      value={newNotes}
                      onChange={(e) => setNewNotes(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Submit / Cancel buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setAddServiceModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingService}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm disabled:opacity-50"
                >
                  {isAddingService ? "Saving..." : "Create & Add Service"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
