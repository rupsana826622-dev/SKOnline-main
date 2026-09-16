import React, { useState, useEffect } from "react";
import {
  Save, Printer, User, Phone, MapPin, Hash, Calendar,
  ShieldCheck, CreditCard, CheckSquare, Square, PlusCircle, ArrowLeft
} from "lucide-react";
import type { BobCustomerRecord } from "@/types/bob";
import { getBobSettings, getNextBobSerialNo, addBobCustomer, updateBobCustomer } from "@/lib/bobStorage";
import { generateId, sanitizeDob } from "@/lib/utils";
import { toast } from "sonner";
import BobReceiptModal from "./BobReceiptModal";

interface BobCustomerFormProps {
  initialRecord?: BobCustomerRecord | null;
  onSuccess?: (record: BobCustomerRecord) => void;
  onCancel?: () => void;
}

export default function BobCustomerForm({ initialRecord, onSuccess, onCancel }: BobCustomerFormProps) {
  const settings = getBobSettings();
  const todayStr = new Date().toISOString().slice(0, 10);

  const [slNo, setSlNo] = useState<number>(initialRecord ? initialRecord.slNo : getNextBobSerialNo());
  const [accountOpeningDate, setAccountOpeningDate] = useState<string>(
    initialRecord?.accountOpeningDate || todayStr
  );
  const [customerName, setCustomerName] = useState(initialRecord?.customerName || "");
  const [guardianName, setGuardianName] = useState(initialRecord?.guardianName || "");

  // Convert ISO YYYY-MM-DD → DD/MM/YYYY for display in the masked input
  const isoToDisplayDob = (iso?: string): string => {
    if (!iso) return "";
    const parts = iso.split("-");
    if (parts.length === 3 && parts[0].length === 4) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return iso; // already DD/MM/YYYY or unknown — return as-is
  };

  const [dob, setDob] = useState(isoToDisplayDob(initialRecord?.dob));
  const [mobile, setMobile] = useState(initialRecord?.mobile || "");
  const [address, setAddress] = useState(initialRecord?.address || "");
  const [aadhaarNo, setAadhaarNo] = useState(initialRecord?.aadhaarNo || "");
  const [refNo, setRefNo] = useState(initialRecord?.refNo || initialRecord?.reference_no || settings.refPrefix || settings.default_ref_prefix || "BOB-2026-");
  const [cifNo, setCifNo] = useState(initialRecord?.cifNo || initialRecord?.cif_no || settings.cifPrefix || settings.default_cif_prefix || "");
  const [accountNo, setAccountNo] = useState(initialRecord?.accountNo || initialRecord?.account_no || settings.accountPrefix || settings.default_account_prefix || "");
  const [sbNo, setSbNo] = useState(initialRecord?.sbNo || initialRecord?.sb_no || initialRecord?.sb_number || settings.sbPrefix || settings.default_sb_prefix || "");

  // Social Security Schemes (SSS)
  const [enrollAPY, setEnrollAPY] = useState<boolean>(initialRecord?.enrollAPY ?? false);
  const [enrollPMSBY, setEnrollPMSBY] = useState<boolean>(initialRecord?.enrollPMSBY ?? false);
  const [enrollPMJJBY, setEnrollPMJJBY] = useState<boolean>(initialRecord?.enrollPMJJBY ?? false);

  const [notes, setNotes] = useState(initialRecord?.notes || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRecord, setSubmittedRecord] = useState<BobCustomerRecord | null>(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);

  useEffect(() => {
    if (!initialRecord) {
      const freshSettings = getBobSettings();
      const defRef = freshSettings.refPrefix || freshSettings.default_ref_prefix || "";
      const defCif = freshSettings.cifPrefix || freshSettings.default_cif_prefix || "";
      const defAcc = freshSettings.accountPrefix || freshSettings.default_account_prefix || "";
      const defSb = freshSettings.sbPrefix || freshSettings.default_sb_prefix || "";

      if (!refNo && defRef) setRefNo(defRef);
      if (!cifNo && defCif) setCifNo(defCif);
      if (!accountNo && defAcc) setAccountNo(defAcc);
      if (!sbNo && defSb) setSbNo(defSb);
    }
  }, [initialRecord]);

  const formatAadhaar = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 12);
    const parts = [];
    for (let i = 0; i < digits.length; i += 4) {
      parts.push(digits.slice(i, i + 4));
    }
    return parts.join(" ");
  };

  /**
   * Auto-inserts slashes as operator types: 12102000 → 12/10/2000
   * Accepts DD/MM/YYYY or raw digits up to 8 chars.
   */
  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, "");
    if (raw.length > 8) raw = raw.slice(0, 8);
    let formatted = raw;
    if (raw.length > 4) {
      formatted = `${raw.slice(0, 2)}/${raw.slice(2, 4)}/${raw.slice(4)}`;
    } else if (raw.length > 2) {
      formatted = `${raw.slice(0, 2)}/${raw.slice(2)}`;
    }
    setDob(formatted);
  };

  /**
   * Convert DD/MM/YYYY or YYYY-MM-DD → YYYY-MM-DD for Supabase storage.
   * Uses sanitizeDob to validate actual calendar validity and year range.
   */
  const toIsoDob = (val: string): string | null => {
    return sanitizeDob(val);
  };

  const resetForm = () => {
    const freshSettings = getBobSettings();
    setSlNo(getNextBobSerialNo());
    setAccountOpeningDate(todayStr);
    setCustomerName("");
    setGuardianName("");
    setDob("");
    setMobile("");
    setAddress("");
    setAadhaarNo("");
    setRefNo(freshSettings.refPrefix || freshSettings.default_ref_prefix || "BOB-2026-");
    setCifNo(freshSettings.cifPrefix || freshSettings.default_cif_prefix || "");
    setAccountNo(freshSettings.accountPrefix || freshSettings.default_account_prefix || "");
    setSbNo(freshSettings.sbPrefix || freshSettings.default_sb_prefix || "");
    setEnrollAPY(false);
    setEnrollPMSBY(false);
    setEnrollPMJJBY(false);
    setNotes("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!customerName.trim()) {
      toast.error("Customer Name is required.");
      return;
    }
    if (!mobile.trim() || mobile.length < 10) {
      toast.error("Valid 10-digit mobile number is required.");
      return;
    }

    if (aadhaarNo && aadhaarNo.replace(/\D/g, "").length !== 12) {
      toast.error("Aadhaar Number must be exactly 12 digits.");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = {
        account_opening_date: sanitizeDob(accountOpeningDate) || todayStr,
        sl_no: slNo ? parseInt(String(slNo), 10) : null,
        customer_name: customerName.trim(),
        care_of: guardianName.trim() || null,
        dob: sanitizeDob(dob.trim()),
        mobile: mobile.trim() || null,
        address: address.trim() || null,
        aadhaar_no: aadhaarNo.trim() || null,
        reference_no: refNo.trim() || null,
        reference_number: refNo.trim() || null,
        cif_no: cifNo.trim() || null,
        cif_number: cifNo.trim() || null,
        account_no: accountNo.trim() || null,
        account_number: accountNo.trim() || null,
        sb_number: sbNo.trim() || null,
        sb_no: sbNo.trim() || null,
        sbNo: sbNo.trim() || null,
        has_apy: Boolean(enrollAPY),
        has_pmsby: Boolean(enrollPMSBY),
        has_pmjjby: Boolean(enrollPMJJBY),
      };

      let savedRecord: BobCustomerRecord;

      if (initialRecord) {
        await updateBobCustomer(initialRecord.id, {
          accountOpeningDate: sanitizeDob(accountOpeningDate) || todayStr,
          slNo: Number(slNo) || 1,
          customerName: customerName.trim(),
          guardianName: guardianName.trim(),
          dob: sanitizeDob(dob.trim()) ?? "",
          mobile: mobile.trim(),
          address: address.trim(),
          aadhaarNo: aadhaarNo.trim(),
          refNo: refNo.trim(),
          reference_no: refNo.trim(),
          reference_number: refNo.trim(),
          cifNo: cifNo.trim(),
          cif_no: cifNo.trim(),
          cif_number: cifNo.trim(),
          accountNo: accountNo.trim(),
          account_no: accountNo.trim(),
          account_number: accountNo.trim(),
          sbNo: sbNo.trim(),
          sb_no: sbNo.trim(),
          sb_number: sbNo.trim(),
          enrollAPY,
          enrollPMSBY,
          enrollPMJJBY,
        });
        savedRecord = {
          ...initialRecord,
          accountOpeningDate: accountOpeningDate || todayStr,
          slNo: Number(slNo) || 1,
          customerName: customerName.trim(),
          guardianName: guardianName.trim(),
          dob: dob.trim(),
          mobile: mobile.trim(),
          address: address.trim(),
          aadhaarNo: aadhaarNo.trim(),
          refNo: refNo.trim(),
          reference_no: refNo.trim(),
          reference_number: refNo.trim(),
          cifNo: cifNo.trim(),
          cif_no: cifNo.trim(),
          cif_number: cifNo.trim(),
          accountNo: accountNo.trim(),
          account_no: accountNo.trim(),
          account_number: accountNo.trim(),
          sbNo: sbNo.trim(),
          sb_no: sbNo.trim(),
          sb_number: sbNo.trim(),
          enrollAPY,
          enrollPMSBY,
          enrollPMJJBY,
        };
        toast.success(`Bank of Baroda account SL #${slNo} updated successfully!`);
      } else {
        const res = await addBobCustomer(formData);
        savedRecord = res.data!;
        toast.success(`New Bank of Baroda account SL #${savedRecord.slNo} registered and saved to Supabase!`);
      }

      setSubmittedRecord(savedRecord);
      setReceiptModalOpen(true);

      if (onSuccess) {
        onSuccess(savedRecord);
      } else {
        if (!initialRecord) {
          resetForm();
        }
      }
    } catch (err: any) {
      console.error("Submit Error:", err);
      toast.error(`Submission failed: ${err.message || "Unknown error"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {initialRecord
                ? `Edit Bank of Baroda Account (SL #${initialRecord.slNo})`
                : "New Bank of Baroda Customer Registration"}
            </h2>
            <p className="text-xs text-slate-500">Bank of Baroda CSP account enrollment and scheme management</p>
          </div>
        </div>

        {/* Serial No. Badge */}
        <div className="flex items-center gap-2 bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-200">
          <Hash size={14} className="text-orange-600" />
          <span className="text-xs font-bold text-orange-950">SL NO:</span>
          <input
            type="number"
            value={slNo}
            onChange={e => setSlNo(Number(e.target.value))}
            className="w-20 px-2 py-0.5 text-xs font-mono font-bold text-orange-700 bg-white border border-orange-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
            title="Manual Sequence Serial Number"
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. Account Opening Date & Personal Details */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-orange-700 flex items-center gap-1.5">
            <User size={14} className="text-orange-600" />
            <span>1. Customer & Personal Information</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Account Opening Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Account Opening Date <span className="text-orange-600">*</span>
              </label>
              <input
                type="date"
                required
                value={accountOpeningDate}
                onChange={e => setAccountOpeningDate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white"
              />
            </div>

            {/* Customer Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Customer Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Full Customer Name"
                value={customerName}
                onChange={e => setCustomerName(e.target.value.toUpperCase())}
                className="w-full px-3.5 py-2 text-sm uppercase font-semibold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-slate-50/50 focus:bg-white transition-all"
              />
            </div>

            {/* C/O (Father / Husband / Guardian) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                C/O (Father / Husband / Guardian)
              </label>
              <input
                type="text"
                placeholder="Father/Husband/Guardian Name"
                value={guardianName}
                onChange={e => setGuardianName(e.target.value.toUpperCase())}
                className="w-full px-3.5 py-2 text-sm uppercase border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-slate-50/50 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Date of Birth */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Date of Birth (DOB)
              </label>
              <input
                type="text"
                placeholder="DD/MM/YYYY (e.g. 12/10/2000)"
                value={dob}
                onChange={handleDobChange}
                maxLength={10}
                className="w-full px-3.5 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-slate-50/50 focus:bg-white"
              />
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                maxLength={10}
                placeholder="10-digit mobile number"
                value={mobile}
                onChange={e => setMobile(e.target.value.replace(/\D/g, ""))}
                className="w-full px-3.5 py-2 text-sm font-mono font-bold text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-slate-50/50 focus:bg-white"
              />
            </div>

            {/* Aadhaar Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Aadhaar Number (12 Digits)
              </label>
              <input
                type="text"
                maxLength={14}
                placeholder="XXXX XXXX XXXX"
                value={aadhaarNo}
                onChange={e => setAadhaarNo(formatAadhaar(e.target.value))}
                className="w-full px-3.5 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-slate-50/50 focus:bg-white"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Full Address
            </label>
            <input
              type="text"
              placeholder="Village / Post / District / State"
              value={address}
              onChange={e => setAddress(e.target.value.toUpperCase())}
              className="w-full px-3.5 py-2 text-sm uppercase border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-slate-50/50 focus:bg-white"
            />
          </div>
        </div>

        {/* 2. Banking Identification & Numbers (4 Prefills: Account, CIF, Ref, SB) */}
        <div className="bg-orange-50/50 rounded-xl p-4 border border-orange-200 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-orange-800 flex items-center gap-1.5">
            <CreditCard size={14} className="text-orange-600" />
            <span>2. Banking Identification & Account Numbers (Dynamic Pre-fills)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Account Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Account Number
              </label>
              <input
                type="text"
                placeholder="Bank Account Number"
                value={accountNo}
                onChange={e => setAccountNo(e.target.value.trim())}
                className="w-full px-3.5 py-2 text-sm font-mono font-black text-orange-700 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white"
              />
            </div>

            {/* 2. CIF Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                CIF Number
              </label>
              <input
                type="text"
                placeholder="e.g. 987654"
                value={cifNo}
                onChange={e => setCifNo(e.target.value.toUpperCase())}
                className="w-full px-3.5 py-2 text-sm font-mono font-bold text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white"
              />
            </div>

            {/* 3. Reference Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reference Number (Ref No)
              </label>
              <input
                type="text"
                placeholder="BOB-2026-XXXX"
                value={refNo}
                onChange={e => setRefNo(e.target.value.toUpperCase())}
                className="w-full px-3.5 py-2 text-sm font-mono uppercase border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white"
              />
            </div>

            {/* 4. SB Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                SB Number
              </label>
              <input
                type="text"
                placeholder="e.g. SB-1001"
                value={sbNo}
                onChange={e => setSbNo(e.target.value.toUpperCase())}
                className="w-full px-3.5 py-2 text-sm font-mono font-bold text-slate-800 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white"
              />
            </div>
          </div>
        </div>

        {/* 3. Social Security Schemes (SSS) Interactive Toggles */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-600" />
              <span>3. Social Security Schemes (SSS) Enrollment</span>
            </h3>
            <span className="text-[11px] text-slate-500 font-medium">Select applicable government schemes</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* APY Checkbox Card */}
            <button
              type="button"
              onClick={() => setEnrollAPY(!enrollAPY)}
              className={`flex items-center justify-between p-3.5 rounded-xl border-2 text-left transition-all ${
                enrollAPY
                  ? "bg-emerald-50 border-emerald-500 text-emerald-900 shadow-sm"
                  : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              <div>
                <div className="font-extrabold text-sm">APY</div>
                <div className="text-[11px] text-slate-500">Atal Pension Yojana</div>
              </div>
              {enrollAPY ? (
                <CheckSquare size={20} className="text-emerald-600 flex-shrink-0" />
              ) : (
                <Square size={20} className="text-slate-300 flex-shrink-0" />
              )}
            </button>

            {/* PMSBY Checkbox Card */}
            <button
              type="button"
              onClick={() => setEnrollPMSBY(!enrollPMSBY)}
              className={`flex items-center justify-between p-3.5 rounded-xl border-2 text-left transition-all ${
                enrollPMSBY
                  ? "bg-violet-50 border-violet-500 text-violet-900 shadow-sm"
                  : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              <div>
                <div className="font-extrabold text-sm">PMSBY</div>
                <div className="text-[11px] text-slate-500">Suraksha Bima (Accidental)</div>
              </div>
              {enrollPMSBY ? (
                <CheckSquare size={20} className="text-violet-600 flex-shrink-0" />
              ) : (
                <Square size={20} className="text-slate-300 flex-shrink-0" />
              )}
            </button>

            {/* PMJJBY Checkbox Card */}
            <button
              type="button"
              onClick={() => setEnrollPMJJBY(!enrollPMJJBY)}
              className={`flex items-center justify-between p-3.5 rounded-xl border-2 text-left transition-all ${
                enrollPMJJBY
                  ? "bg-blue-50 border-blue-500 text-blue-900 shadow-sm"
                  : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              <div>
                <div className="font-extrabold text-sm">PMJJBY</div>
                <div className="text-[11px] text-slate-500">Jeevan Jyoti (Life Cover)</div>
              </div>
              {enrollPMJJBY ? (
                <CheckSquare size={20} className="text-blue-600 flex-shrink-0" />
              ) : (
                <Square size={20} className="text-slate-300 flex-shrink-0" />
              )}
            </button>
          </div>
        </div>

        {/* 4. Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Optional Operator Notes / Remarks
          </label>
          <input
            type="text"
            placeholder="e.g. KYC documents collected, passbook pending branch confirmation..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white"
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
            className="flex items-center gap-2 px-6 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {isSubmitting ? "Saving..." : initialRecord ? "Update BOB Customer" : "Save & Generate Slip"}
          </button>
        </div>
      </form>

      {/* Slip Modal upon submission */}
      {receiptModalOpen && submittedRecord && (
        <BobReceiptModal
          record={submittedRecord}
          onClose={() => setReceiptModalOpen(false)}
        />
      )}
    </div>
  );
}
