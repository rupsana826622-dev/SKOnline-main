import {
  Save, Printer, Lock, Eye, EyeOff, CheckCircle, AlertCircle,
  Hash, Calendar, User, Phone, MapPin, Tag, CreditCard, Sparkles, PlusCircle,
  Upload, FileText, ExternalLink, X
} from "lucide-react";
import type { CitizenServiceRecord } from "@/types/citizen";
import { getCitizenSettings, getNextSerialNo, addCitizenRecord, updateCitizenRecord, uploadCitizenDocument } from "@/lib/citizenStorage";
import { generateId } from "@/lib/utils";
import { toast } from "sonner";
import CitizenReceiptModal from "./CitizenReceiptModal";

interface CitizenServiceFormProps {
  initialRecord?: CitizenServiceRecord | null;
  onSuccess?: (record: CitizenServiceRecord) => void;
  onCancel?: () => void;
}

export default function CitizenServiceForm({ initialRecord, onSuccess, onCancel }: CitizenServiceFormProps) {
  const [settings, setSettings] = useState(getCitizenSettings());
  const todayStr = new Date().toISOString().slice(0, 10);

  const [serialNo, setSerialNo] = useState<number>(initialRecord ? initialRecord.serialNo : getNextSerialNo());
  const [customerName, setCustomerName] = useState(initialRecord?.customerName || "");
  const [contactNo, setContactNo] = useState(initialRecord?.contactNo || "");
  const [address, setAddress] = useState(initialRecord?.address || "");
  const [serviceType, setServiceType] = useState(initialRecord?.serviceType || settings.serviceTypes[0] || "PAN Card");
  const [applicationDate, setApplicationDate] = useState(initialRecord?.applicationDate || todayStr);
  const [appNumber, setAppNumber] = useState(initialRecord?.appNumber || "");
  const [portalPassword, setPortalPassword] = useState(initialRecord?.portalPassword || "");
  const [showPassword, setShowPassword] = useState(false);

  // Dynamic Service / Document Number & Cloud Attachment
  const [finalServiceNo, setFinalServiceNo] = useState(initialRecord?.finalServiceNo || "");
  const [documentFileUrl, setDocumentFileUrl] = useState(initialRecord?.documentFileUrl || "");
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Billing & Accounting
  const [totalAmount, setTotalAmount] = useState<number>(initialRecord?.totalAmount ?? 0);
  const [advancePaid, setAdvancePaid] = useState<number>(initialRecord?.advancePaid ?? 0);
  const [dueAmount, setDueAmount] = useState<number>(initialRecord?.dueAmount ?? 0);
  const [paymentMode, setPaymentMode] = useState<"Cash" | "UPI">(initialRecord?.paymentMode || "Cash");
  const [isFullPaid, setIsFullPaid] = useState<boolean>(initialRecord ? initialRecord.dueAmount === 0 && initialRecord.totalAmount > 0 : false);

  const [notes, setNotes] = useState(initialRecord?.notes || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRecord, setSubmittedRecord] = useState<CitizenServiceRecord | null>(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);

  // Sync settings when updated
  useEffect(() => {
    const handleSettingsUpdate = () => {
      const s = getCitizenSettings();
      setSettings(s);
      if (!serviceType && s.serviceTypes.length > 0) {
        setServiceType(s.serviceTypes[0]);
      }
    };
    window.addEventListener("citizen-settings-updated", handleSettingsUpdate);
    return () => window.removeEventListener("citizen-settings-updated", handleSettingsUpdate);
  }, [serviceType]);

  // Recalculate due whenever total or advance changes (unless full paid toggled)
  const handleTotalChange = (val: number) => {
    const total = Math.max(0, val);
    setTotalAmount(total);
    if (isFullPaid) {
      setAdvancePaid(total);
      setDueAmount(0);
    } else {
      setDueAmount(Math.max(0, total - advancePaid));
    }
  };

  const handleAdvanceChange = (val: number) => {
    const adv = Math.max(0, val);
    setAdvancePaid(adv);
    const due = Math.max(0, totalAmount - adv);
    setDueAmount(due);
    setIsFullPaid(due === 0 && totalAmount > 0);
  };

  const handleDueChange = (val: number) => {
    const due = Math.max(0, val);
    setDueAmount(due);
    setIsFullPaid(due === 0 && totalAmount > 0);
  };

  const handleFullPaidToggle = () => {
    const nextState = !isFullPaid;
    setIsFullPaid(nextState);
    if (nextState) {
      setAdvancePaid(totalAmount);
      setDueAmount(0);
    } else {
      setAdvancePaid(0);
      setDueAmount(totalAmount);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDoc(true);
    const toastId = toast.loading("Uploading document to Supabase Storage...");

    try {
      const { url, error } = await uploadCitizenDocument(file, initialRecord?.id);
      if (error || !url) {
        toast.error(`Document upload failed: ${error?.message || "Storage error"}`, { id: toastId });
        return;
      }

      setDocumentFileUrl(url);
      toast.success("Document uploaded successfully!", { id: toastId });
    } catch (err: any) {
      toast.error(`Upload error: ${err.message || "Failed to upload file"}`, { id: toastId });
    } finally {
      setUploadingDoc(false);
    }
  };

  const resetForm = () => {
    setSerialNo(getNextSerialNo());
    setCustomerName("");
    setContactNo("");
    setAddress("");
    setServiceType(settings.serviceTypes[0] || "PAN Card");
    setApplicationDate(todayStr);
    setAppNumber("");
    setPortalPassword("");
    setFinalServiceNo("");
    setDocumentFileUrl("");
    setTotalAmount(0);
    setAdvancePaid(0);
    setDueAmount(0);
    setPaymentMode("Cash");
    setIsFullPaid(false);
    setNotes("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent double submit

    if (!customerName.trim()) {
      toast.error("Customer Name is required.");
      return;
    }
    if (!contactNo.trim()) {
      toast.error("Contact Number is required.");
      return;
    }
    if (!appNumber.trim()) {
      toast.error("User ID / Application No is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const calculatedDue = Math.max(0, totalAmount - advancePaid);
      const calculatedPaymentStatus = calculatedDue === 0 ? "Full Paid" : advancePaid > 0 ? "Partial" : "Pending";

      const recordPayload: CitizenServiceRecord = {
        id: initialRecord?.id || generateId(),
        serialNo: Number(serialNo) || 1,
        customerName: customerName.trim(),
        contactNo: contactNo.trim(),
        address: address.trim(),
        serviceType: serviceType || "General Service",
        applicationDate: applicationDate || todayStr,
        appNumber: appNumber.trim(),
        portalPassword: portalPassword.trim(),
        finalServiceNo: finalServiceNo.trim(),
        documentFileUrl: documentFileUrl.trim(),
        totalAmount: Number(totalAmount) || 0,
        advancePaid: Number(advancePaid) || 0,
        dueAmount: calculatedDue,
        paymentMode,
        paymentStatus: calculatedPaymentStatus,
        status: initialRecord?.status || "Applied",
        issuedDate: initialRecord?.issuedDate || null,
        deliveredDate: initialRecord?.deliveredDate || null,
        createdAt: initialRecord?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        notes: notes.trim(),
        tenant_code: "new_csp",
      };

      if (initialRecord) {
        const res = await updateCitizenRecord(initialRecord.id, recordPayload);
        if (res.error) {
          toast.error("Warning: Saved locally, but failed to sync to Supabase.");
        } else {
          toast.success(`Service record SL #${recordPayload.serialNo} updated successfully!`);
        }
      } else {
        const res = await addCitizenRecord(recordPayload);
        if (res.error) {
          toast.error("Warning: Saved locally, but failed to sync to Supabase.");
        } else {
          toast.success(`New service application SL #${recordPayload.serialNo} saved!`);
        }
      }

      setSubmittedRecord(recordPayload);
      setReceiptModalOpen(true);
      
      if (!initialRecord) {
        resetForm();
      }

      if (onSuccess) {
        onSuccess(recordPayload);
      }
    } catch (err: any) {
      toast.error(`Error saving application: ${err?.message || "Unknown error"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDocFieldProps = (service: string) => {
    const s = service.toLowerCase();
    if (s.includes("pan")) return { label: "Generated PAN Number", placeholder: "Enter Allotted PAN (e.g. ABCDE1234F)" };
    if (s.includes("passport")) return { label: "Passport Number", placeholder: "Enter Allotted Passport Number" };
    if (s.includes("voter") || s.includes("epic")) return { label: "EPIC / Voter Card Number", placeholder: "Enter Allotted Voter ID / EPIC Number" };
    if (s.includes("ration")) return { label: "Digital Ration Card Number", placeholder: "Enter Allotted Ration Card Number" };
    if (s.includes("trade")) return { label: "Trade License Number", placeholder: "Enter Allotted Trade License Number" };
    if (s.includes("food") || s.includes("fssai")) return { label: "FSSAI / Food License Number", placeholder: "Enter Food License Registration Number" };
    if (s.includes("ticket") || s.includes("train") || s.includes("flight")) return { label: "PNR / Ticket Booking ID", placeholder: "Enter PNR / E-Ticket Number" };
    if (s.includes("aadhaar") || s.includes("aadhar")) return { label: "Aadhaar / Enrolment Number", placeholder: "Enter Updated Aadhaar Number" };
    return { label: "Generated Service / Document No", placeholder: `Enter Allotted ${service} Number / ID` };
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
            <PlusCircle size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {initialRecord ? `Edit Service Application (SL #${initialRecord.serialNo})` : "New Citizen Service Application"}
            </h2>
            <p className="text-xs text-slate-500">Register customer service request with accounting and receipt generation</p>
          </div>
        </div>

        {/* Serial No. badge on top right */}
        <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
          <Hash size={14} className="text-slate-500" />
          <span className="text-xs font-bold text-slate-700">Serial No:</span>
          <input
            type="number"
            value={serialNo}
            onChange={e => setSerialNo(Number(e.target.value))}
            className="w-20 px-2 py-0.5 text-xs font-mono font-bold text-blue-700 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            title="Physical register serial number mapping"
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. Customer Information */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <User size={14} className="text-blue-600" />
            <span>1. Customer & Contact Details</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Customer Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Enter applicant name"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50 focus:bg-white transition-all font-medium"
              />
            </div>
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contact Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                maxLength={12}
                placeholder="10-digit mobile number"
                value={contactNo}
                onChange={e => setContactNo(e.target.value.replace(/\D/g, ""))}
                className="w-full px-3.5 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50 focus:bg-white transition-all"
              />
            </div>
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Address / Village
              </label>
              <input
                type="text"
                placeholder="Village / Town / Landmark"
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50 focus:bg-white transition-all"
              />
            </div>
          </div>
        </div>

        {/* 2. Service & Application Details */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Tag size={14} className="text-blue-600" />
            <span>2. Service, Credentials & Allotted Document</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {/* Service Type Dropdown */}
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Service Type <span className="text-red-500">*</span>
              </label>
              <select
                value={serviceType}
                onChange={e => setServiceType(e.target.value)}
                className="w-full px-3.5 py-2 text-sm font-semibold text-blue-800 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              >
                {settings.serviceTypes.map(s => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Application Date */}
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Application Date
              </label>
              <input
                type="date"
                value={applicationDate}
                onChange={e => setApplicationDate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              />
            </div>

            {/* User ID / Application No */}
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                User ID / Application No <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ack / App / User ID"
                value={appNumber}
                onChange={e => setAppNumber(e.target.value.toUpperCase())}
                className="w-full px-3.5 py-2 text-sm font-mono font-bold text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50 focus:bg-white"
              />
            </div>

            {/* Portal Password (Excluded from Customer Printout) */}
            <div className="sm:col-span-1">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Password / Passkey
                </label>
                <span className="text-[10px] text-amber-600 font-semibold">(No Print)</span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Portal login key"
                  value={portalPassword}
                  onChange={e => setPortalPassword(e.target.value)}
                  className="w-full px-3.5 py-2 pr-9 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Dynamic Final Service / Document Number */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {getDocFieldProps(serviceType).label} <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder={getDocFieldProps(serviceType).placeholder}
                value={finalServiceNo}
                onChange={e => setFinalServiceNo(e.target.value.toUpperCase())}
                className="w-full px-3.5 py-2 text-sm font-mono font-bold text-blue-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50 focus:bg-white"
              />
            </div>

            {/* Cloud PDF File Attachment */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Attach Final Document / PDF <span className="text-slate-400 font-normal">(Cloud Storage)</span>
              </label>
              <div className="flex items-center gap-2">
                {documentFileUrl ? (
                  <div className="flex-1 flex items-center justify-between px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <div className="flex items-center gap-2 truncate">
                      <FileText size={16} className="text-emerald-600 shrink-0" />
                      <a
                        href={documentFileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-emerald-700 hover:underline truncate"
                      >
                        View Attached PDF (Cloud)
                      </a>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDocumentFileUrl("")}
                      className="text-slate-400 hover:text-red-600 p-1"
                      title="Remove attached file"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-dashed border-slate-300 rounded-lg cursor-pointer transition-colors text-xs font-semibold">
                    <Upload size={14} className="text-blue-600" />
                    <span>{uploadingDoc ? "Uploading to Cloud..." : "Upload e-PAN / Certificate PDF"}</span>
                    <input
                      type="file"
                      accept=".pdf,image/*,.doc,.docx"
                      onChange={handleFileUpload}
                      disabled={uploadingDoc}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 3. Billing & Accounting Section */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <CreditCard size={14} className="text-emerald-600" />
              <span>3. Billing & Payment Details</span>
            </h3>

            {/* Full Paid Quick Toggle */}
            <button
              type="button"
              onClick={handleFullPaidToggle}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all shadow-xs ${
                isFullPaid
                  ? "bg-emerald-600 text-white shadow-emerald-500/20"
                  : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-100"
              }`}
            >
              <CheckCircle size={14} />
              {isFullPaid ? "Full Paid Active (✓)" : "Mark as Full Paid"}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
            {/* Total Amount */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Total Amount (₹)
              </label>
              <input
                type="number"
                min={0}
                placeholder="0"
                value={totalAmount || ""}
                onChange={e => handleTotalChange(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-sm font-bold font-mono text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              />
            </div>

            {/* Advance Paid */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Advance Paid (₹)
              </label>
              <input
                type="number"
                min={0}
                max={totalAmount}
                placeholder="0"
                value={advancePaid || ""}
                onChange={e => handleAdvanceChange(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-sm font-bold font-mono text-emerald-700 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              />
            </div>

            {/* Balance Due */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Balance Due (₹)
              </label>
              <input
                type="number"
                min={0}
                value={dueAmount}
                onChange={e => handleDueChange(Number(e.target.value))}
                className={`w-full px-3.5 py-2 text-sm font-bold font-mono border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white ${
                  dueAmount > 0
                    ? "text-amber-600 border-amber-300 bg-amber-50/30"
                    : "text-slate-500 border-slate-300"
                }`}
              />
            </div>

            {/* Payment Mode */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Mode
              </label>
              <div className="flex gap-2">
                {(["Cash", "UPI"] as const).map(mode => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setPaymentMode(mode)}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${
                      paymentMode === mode
                        ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                        : "bg-white text-slate-600 border-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 4. Notes / Remarks */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Optional Notes / Documents Submitted
          </label>
          <input
            type="text"
            placeholder="e.g. Aadhaar copy submitted, urgent processing requested..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
          />
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors shadow-xs"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {isSubmitting ? "Saving Application..." : initialRecord ? "Update Application" : "Save & Generate Receipt"}
          </button>
        </div>
      </form>

      {/* Customer Receipt Modal upon successful submission */}
      {receiptModalOpen && submittedRecord && (
        <CitizenReceiptModal
          record={submittedRecord}
          onClose={() => setReceiptModalOpen(false)}
        />
      )}
    </div>
  );
}
