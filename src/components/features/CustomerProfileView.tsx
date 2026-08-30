import React, { useState } from "react";
import {
  ArrowLeft, Edit3, Trash2, Printer, Check, User, MapPin,
  Building, ShieldCheck, HeartHandshake, Package, AlertCircle, Save, X, Calendar
} from "lucide-react";
import type { Customer } from "@/types";
import { updateCustomerAsync, deleteCustomerAsync } from "@/lib/storage";
import { calculateAgeFromDob, formatDateTime } from "@/lib/utils";
import {
  CATEGORIES, SEX_OPTIONS, STATES, EDUCATION_LEVELS, OCCUPATION_TYPES,
  ANNUAL_INCOME_TIERS, PMJJBY_PREMIUM_TIERS, APY_PENSION_SLABS, KYC_DOC_TYPES,
  NOMINEE_RELATIONSHIPS
} from "@/constants";
import DatePickerInput from "@/components/common/DatePickerInput";
import PrintModal from "@/components/features/PrintModal";
import { toast } from "sonner";

interface CustomerProfileViewProps {
  customer: Customer;
  onBack: () => void;
  onCustomerUpdated: (updatedCustomer: Customer) => void;
  onCustomerDeleted: (id: string) => void;
}

export default function CustomerProfileView({
  customer,
  onBack,
  onCustomerUpdated,
  onCustomerDeleted,
}: CustomerProfileViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState<Customer>({ ...customer });

  const handleInputChange = (field: keyof Customer, value: any) => {
    let finalVal = value;
    if (field === "dob" || field === "nomineeDob" || field === "apySpouseDob") {
      const digits = String(value).replace(/\D/g, "");
      let formatted = "";
      if (digits.length > 0) formatted += digits.substring(0, 2);
      if (digits.length >= 2) formatted += "/" + digits.substring(2, 4);
      if (digits.length >= 4) formatted += "/" + digits.substring(4, 8);
      finalVal = formatted;
    }

    setEditForm(prev => {
      const updated = { ...prev, [field]: finalVal };

      // Auto-age calculation
      if (field === "dob") {
        const calculatedAge = calculateAgeFromDob(finalVal);
        if (calculatedAge) {
          updated.age = Number(calculatedAge);
        }
      }
      if (field === "nomineeDob") {
        const nAge = calculateAgeFromDob(finalVal);
        if (nAge) {
          updated.nomineeAge = nAge;
        }
      }

      return updated;
    });
  };

  const handleSaveChanges = async () => {
    if (!editForm.name.trim()) {
      toast.error("Customer name is required.");
      return;
    }

    setSaving(true);
    try {
      const { error } = await updateCustomerAsync(editForm.id, editForm);
      if (error) {
        toast.error(`Failed to update customer in Supabase: ${error.message || "Unknown error"}`);
        setSaving(false);
        return;
      }

      toast.success(`Customer "${editForm.name}" updated successfully!`);
      setIsEditing(false);
      onCustomerUpdated(editForm);
    } catch (err: any) {
      toast.error(`Error saving changes: ${err.message || "Network error"}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCustomer = async () => {
    setDeleting(true);
    try {
      const { error } = await deleteCustomerAsync(customer.id);
      if (error) {
        toast.error(`Failed to delete customer from Supabase: ${error.message || "Unknown error"}`);
        setDeleting(false);
        return;
      }

      toast.success(`Customer "${customer.name}" deleted successfully.`);
      setShowDeleteConfirm(false);
      onCustomerDeleted(customer.id);
    } catch (err: any) {
      toast.error(`Error deleting customer: ${err.message || "Network error"}`);
    } finally {
      setDeleting(false);
    }
  };

  const current = isEditing ? editForm : customer;

  return (
    <div className="w-full space-y-6 pb-16 animate-fade-in">
      {/* ─── Top Navigation & Action Header ─── */}
      <div className="bg-gradient-to-r from-[#003366] via-[#004080] to-[#002244] text-white rounded-2xl p-5 md:p-6 shadow-lg border border-blue-900/40">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Customer Identifiers */}
          <div className="flex items-center gap-4 min-w-0">
            <button
              type="button"
              onClick={onBack}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1.5 text-xs font-semibold"
              title="Return to customer list"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Back to List</span>
            </button>

            <div className="w-12 h-12 rounded-2xl bg-white/15 text-white flex items-center justify-center text-xl font-black shadow-inner border border-white/20 flex-shrink-0">
              {current.name ? current.name.charAt(0).toUpperCase() : "C"}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg md:text-2xl font-bold tracking-tight truncate">{current.name || "Customer Profile"}</h1>
                <span className="badge bg-emerald-500 text-white text-[11px] px-2 py-0.5">Active Account</span>
                {current.enrollPMJJBY && <span className="badge bg-blue-500 text-white text-[10px]">PMJJBY</span>}
                {current.enrollPMSBY && <span className="badge bg-violet-500 text-white text-[10px]">PMSBY</span>}
                {current.enrollAPY && <span className="badge bg-emerald-600 text-white text-[10px]">APY</span>}
              </div>
              <div className="flex items-center gap-3 text-xs text-blue-200 mt-1 font-mono flex-wrap">
                <span>A/C: <strong className="text-white">{current.accountNumber}</strong></span>
                <span>•</span>
                <span>CIF: {current.customerId || "N/A"}</span>
                <span>•</span>
                <span>Ref: {current.refNumber}</span>
                {current.accountOpeningDate && (
                  <>
                    <span>•</span>
                    <span>Opening Date: <strong className="text-amber-300">{current.accountOpeningDate}</strong></span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {!isEditing ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition-all shadow-sm"
                >
                  <Edit3 size={14} />
                  Edit Details
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrintModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-sm"
                >
                  <Printer size={14} />
                  Reprint / Download Forms
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-2.5 bg-red-500/20 hover:bg-red-500 text-red-200 hover:text-white rounded-xl transition-all border border-red-500/30"
                  title="Delete Customer"
                >
                  <Trash2 size={16} />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setEditForm({ ...customer });
                    setIsEditing(false);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl border border-white/20 transition-all"
                >
                  <X size={14} />
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveChanges}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm disabled:opacity-50"
                >
                  <Save size={14} />
                  {saving ? "Saving Changes..." : "Save All Changes"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ─── Continuous Single-Scroll Profile View ─── */}
      <div className="space-y-6">

        {/* ═══════ SECTION 1: Personal Identity & Demographics ═══════ */}
        <div className="sk-card p-6 border-l-4 border-l-blue-600 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <User className="text-blue-600 w-5 h-5" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">1. Personal Identity & Demographics</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 text-xs">
            <div>
              <label className="form-label">Full Name</label>
              {isEditing ? (
                <input
                  className="form-input uppercase"
                  value={editForm.name}
                  onChange={e => handleInputChange("name", e.target.value.toUpperCase())}
                />
              ) : (
                <div className="font-bold text-slate-900 text-sm">{customer.name}</div>
              )}
            </div>

            <div>
              <label className="form-label">Father's Name</label>
              {isEditing ? (
                <input
                  className="form-input uppercase"
                  value={editForm.fatherName}
                  onChange={e => handleInputChange("fatherName", e.target.value.toUpperCase())}
                />
              ) : (
                <div className="font-semibold text-slate-800">{customer.fatherName || "—"}</div>
              )}
            </div>

            <div>
              <label className="form-label">Mother's Name</label>
              {isEditing ? (
                <input
                  className="form-input uppercase"
                  value={editForm.motherName}
                  onChange={e => handleInputChange("motherName", e.target.value.toUpperCase())}
                />
              ) : (
                <div className="font-semibold text-slate-800">{customer.motherName || "—"}</div>
              )}
            </div>

            <div>
              <label className="form-label">Spouse Name</label>
              {isEditing ? (
                <input
                  className="form-input uppercase"
                  value={editForm.spouseName}
                  onChange={e => handleInputChange("spouseName", e.target.value.toUpperCase())}
                />
              ) : (
                <div className="font-semibold text-slate-800">{customer.spouseName || "—"}</div>
              )}
            </div>

            <div>
              <label className="form-label">Gender / Sex</label>
              {isEditing ? (
                <select
                  className="form-input"
                  value={editForm.sex}
                  onChange={e => handleInputChange("sex", e.target.value)}
                >
                  {SEX_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              ) : (
                <div className="font-semibold text-slate-800">{customer.sex}</div>
              )}
            </div>

            <div>
              <label className="form-label">Date of Birth</label>
              {isEditing ? (
                <DatePickerInput
                  value={editForm.dob}
                  onChange={val => handleInputChange("dob", val)}
                  placeholder="DD/MM/YYYY"
                />
              ) : (
                <div className="font-semibold text-slate-800 font-mono">{customer.dob || "—"}</div>
              )}
            </div>

            <div>
              <label className="form-label">Age</label>
              {isEditing ? (
                <input
                  type="number"
                  className="form-input"
                  value={editForm.age}
                  onChange={e => handleInputChange("age", Number(e.target.value))}
                />
              ) : (
                <div className="font-semibold text-slate-800">{customer.age ? `${customer.age} Years` : "—"}</div>
              )}
            </div>

            <div>
              <label className="form-label">Social Category</label>
              {isEditing ? (
                <select
                  className="form-input"
                  value={editForm.category}
                  onChange={e => handleInputChange("category", e.target.value)}
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              ) : (
                <div><span className="badge badge-blue">{customer.category}</span></div>
              )}
            </div>

            <div>
              <label className="form-label">Profession / Occupation</label>
              {isEditing ? (
                <input
                  className="form-input"
                  value={editForm.profession}
                  onChange={e => handleInputChange("profession", e.target.value)}
                />
              ) : (
                <div className="font-semibold text-slate-800">{customer.profession || "—"}</div>
              )}
            </div>

            <div>
              <label className="form-label">Annual Income</label>
              {isEditing ? (
                <input
                  className="form-input"
                  value={editForm.annualIncome}
                  onChange={e => handleInputChange("annualIncome", e.target.value)}
                />
              ) : (
                <div className="font-semibold text-slate-800">{customer.annualIncome ? `₹${customer.annualIncome}` : customer.annualIncomeTier || "—"}</div>
              )}
            </div>

            <div>
              <label className="form-label">PAN / GIR Number</label>
              {isEditing ? (
                <input
                  className="form-input uppercase font-mono"
                  value={editForm.panGir}
                  onChange={e => handleInputChange("panGir", e.target.value.toUpperCase())}
                />
              ) : (
                <div className="font-semibold text-slate-800 font-mono">{customer.panGir || "—"}</div>
              )}
            </div>

            <div>
              <label className="form-label">Aadhaar / KYC ID</label>
              {isEditing ? (
                <input
                  className="form-input font-mono"
                  value={editForm.pmjjbyKycId || editForm.pmsbyKycId || ""}
                  onChange={e => {
                    handleInputChange("pmjjbyKycId", e.target.value);
                    handleInputChange("pmsbyKycId", e.target.value);
                  }}
                />
              ) : (
                <div className="font-semibold text-slate-800 font-mono">{customer.pmjjbyKycId || customer.pmsbyKycId || "—"}</div>
              )}
            </div>
          </div>
        </div>

        {/* ═══════ SECTION 2: Address & Communication ═══════ */}
        <div className="sk-card p-6 border-l-4 border-l-indigo-600 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <MapPin className="text-indigo-600 w-5 h-5" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">2. Address & Communication</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 text-xs">
            <div className="sm:col-span-2">
              <label className="form-label">Address Line</label>
              {isEditing ? (
                <input
                  className="form-input"
                  value={editForm.address}
                  onChange={e => handleInputChange("address", e.target.value)}
                />
              ) : (
                <div className="font-semibold text-slate-800">{customer.address || "—"}</div>
              )}
            </div>

            <div>
              <label className="form-label">Village / Town</label>
              {isEditing ? (
                <input
                  className="form-input"
                  value={editForm.village}
                  onChange={e => handleInputChange("village", e.target.value)}
                />
              ) : (
                <div className="font-semibold text-slate-800">{customer.village || "—"}</div>
              )}
            </div>

            <div>
              <label className="form-label">Tehsil / Mandal / Block</label>
              {isEditing ? (
                <input
                  className="form-input"
                  value={editForm.mandal}
                  onChange={e => handleInputChange("mandal", e.target.value)}
                />
              ) : (
                <div className="font-semibold text-slate-800">{customer.mandal || "—"}</div>
              )}
            </div>

            <div>
              <label className="form-label">District</label>
              {isEditing ? (
                <input
                  className="form-input"
                  value={editForm.district}
                  onChange={e => handleInputChange("district", e.target.value)}
                />
              ) : (
                <div className="font-semibold text-slate-800">{customer.district || "—"}</div>
              )}
            </div>

            <div>
              <label className="form-label">State</label>
              {isEditing ? (
                <select
                  className="form-input"
                  value={editForm.state}
                  onChange={e => handleInputChange("state", e.target.value)}
                >
                  {STATES.map(st => <option key={st} value={st}>{st}</option>)}
                </select>
              ) : (
                <div className="font-semibold text-slate-800">{customer.state || "—"}</div>
              )}
            </div>

            <div>
              <label className="form-label">Mobile Number</label>
              {isEditing ? (
                <input
                  className="form-input font-mono"
                  value={editForm.mobile}
                  onChange={e => handleInputChange("mobile", e.target.value)}
                />
              ) : (
                <div className="font-semibold text-slate-800 font-mono">{customer.mobile || "—"}</div>
              )}
            </div>

            <div>
              <label className="form-label">Email ID</label>
              {isEditing ? (
                <input
                  className="form-input"
                  value={editForm.email}
                  onChange={e => handleInputChange("email", e.target.value)}
                />
              ) : (
                <div className="font-semibold text-slate-800">{customer.email || "—"}</div>
              )}
            </div>
          </div>
        </div>

        {/* ═══════ SECTION 3: Banking, CSP & Introducer Details ═══════ */}
        <div className="sk-card p-6 border-l-4 border-l-amber-500 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <Building className="text-amber-600 w-5 h-5" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">3. Banking, CSP & Introducer Details</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 text-xs">
            <div>
              <label className="form-label">Account Number</label>
              {isEditing ? (
                <input
                  className="form-input font-mono font-bold"
                  value={editForm.accountNumber}
                  onChange={e => handleInputChange("accountNumber", e.target.value)}
                />
              ) : (
                <div className="font-mono font-bold text-blue-900 text-sm bg-blue-50 px-2.5 py-1 rounded-lg inline-block border border-blue-100">
                  {customer.accountNumber}
                </div>
              )}
            </div>

            <div>
              <label className="form-label">Customer ID (CIF)</label>
              {isEditing ? (
                <input
                  className="form-input font-mono"
                  value={editForm.customerId}
                  onChange={e => handleInputChange("customerId", e.target.value)}
                />
              ) : (
                <div className="font-semibold text-slate-800 font-mono">{customer.customerId || "—"}</div>
              )}
            </div>

            <div>
              <label className="form-label">Account Opening Date</label>
              {isEditing ? (
                <DatePickerInput
                  value={editForm.accountOpeningDate || ""}
                  onChange={val => handleInputChange("accountOpeningDate", val)}
                  placeholder="DD/MM/YYYY"
                />
              ) : (
                <div className="font-bold text-amber-700 font-mono bg-amber-50 px-2.5 py-1 rounded-lg inline-block border border-amber-200/60">
                  {customer.accountOpeningDate || "—"}
                </div>
              )}
            </div>

            <div>
              <label className="form-label">Reference Number</label>
              {isEditing ? (
                <input
                  className="form-input font-mono"
                  value={editForm.refNumber}
                  onChange={e => handleInputChange("refNumber", e.target.value)}
                />
              ) : (
                <div className="font-semibold text-slate-800 font-mono">{customer.refNumber}</div>
              )}
            </div>

            <div>
              <label className="form-label">Branch Code</label>
              {isEditing ? (
                <input
                  className="form-input font-mono"
                  value={editForm.branchCode}
                  onChange={e => handleInputChange("branchCode", e.target.value)}
                />
              ) : (
                <div className="font-semibold text-slate-800 font-mono">{customer.branchCode || "—"}</div>
              )}
            </div>

            <div>
              <label className="form-label">IFSC Code</label>
              {isEditing ? (
                <input
                  className="form-input font-mono"
                  value={editForm.ifscCode}
                  onChange={e => handleInputChange("ifscCode", e.target.value)}
                />
              ) : (
                <div className="font-semibold text-slate-800 font-mono">{customer.ifscCode || "—"}</div>
              )}
            </div>

            <div>
              <label className="form-label">Sol ID / Zone</label>
              <div className="font-semibold text-slate-800 font-mono">{customer.solId || "SOL001"} / {customer.zone || "South Zone"}</div>
            </div>

            <div>
              <label className="form-label">Introducer Name</label>
              {isEditing ? (
                <input
                  className="form-input uppercase"
                  value={editForm.introducerName}
                  onChange={e => handleInputChange("introducerName", e.target.value.toUpperCase())}
                />
              ) : (
                <div className="font-semibold text-slate-800">{customer.introducerName || "—"}</div>
              )}
            </div>
          </div>
        </div>

        {/* ═══════ SECTION 4: Nomination & Minor Appointee ═══════ */}
        <div className="sk-card p-6 border-l-4 border-l-emerald-600 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <HeartHandshake className="text-emerald-600 w-5 h-5" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">4. Nomination & Minor Appointee</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 text-xs">
            <div>
              <label className="form-label">Nominee Name</label>
              {isEditing ? (
                <input
                  className="form-input uppercase"
                  value={editForm.nomineeName}
                  onChange={e => handleInputChange("nomineeName", e.target.value.toUpperCase())}
                />
              ) : (
                <div className="font-bold text-slate-900">{customer.nomineeName || "—"}</div>
              )}
            </div>

            <div>
              <label className="form-label">Relationship with Applicant</label>
              {isEditing ? (
                <select
                  className="form-input"
                  value={editForm.nomineeRelationship}
                  onChange={e => handleInputChange("nomineeRelationship", e.target.value)}
                >
                  <option value="">— Select Relationship —</option>
                  {NOMINEE_RELATIONSHIPS.map(rel => (
                    <option key={rel} value={rel}>{rel}</option>
                  ))}
                  {editForm.nomineeRelationship && !NOMINEE_RELATIONSHIPS.includes(editForm.nomineeRelationship as any) && (
                    <option value={editForm.nomineeRelationship}>{editForm.nomineeRelationship}</option>
                  )}
                </select>
              ) : (
                <div className="font-semibold text-slate-800">{customer.nomineeRelationship || "—"}</div>
              )}
            </div>

            <div>
              <label className="form-label">Nominee Age</label>
              {isEditing ? (
                <input
                  className="form-input"
                  value={editForm.nomineeAge}
                  onChange={e => handleInputChange("nomineeAge", e.target.value)}
                />
              ) : (
                <div className="font-semibold text-slate-800">{customer.nomineeAge ? `${customer.nomineeAge} Years` : "—"}</div>
              )}
            </div>

            <div>
              <label className="form-label">Nominee DOB (if Minor)</label>
              {isEditing ? (
                <DatePickerInput
                  value={editForm.nomineeDob}
                  onChange={val => handleInputChange("nomineeDob", val)}
                  placeholder="DD/MM/YYYY"
                />
              ) : (
                <div className="font-semibold text-slate-800 font-mono">{customer.nomineeDob || "—"}</div>
              )}
            </div>

            <div>
              <label className="form-label">Guardian Name (for Minor)</label>
              {isEditing ? (
                <input
                  className="form-input uppercase"
                  value={editForm.guardianName}
                  onChange={e => handleInputChange("guardianName", e.target.value.toUpperCase())}
                />
              ) : (
                <div className="font-semibold text-slate-800">{customer.guardianName || "—"}</div>
              )}
            </div>

            <div>
              <label className="form-label">Nominee SB Account No.</label>
              {isEditing ? (
                <input
                  className="form-input font-mono"
                  value={editForm.sbAccountNo}
                  onChange={e => handleInputChange("sbAccountNo", e.target.value)}
                />
              ) : (
                <div className="font-semibold text-slate-800 font-mono">{customer.sbAccountNo || "—"}</div>
              )}
            </div>
          </div>
        </div>

        {/* ═══════ SECTION 5: Social Security Schemes ═══════ */}
        <div className="sk-card p-6 border-l-4 border-l-cyan-600 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShieldCheck className="text-cyan-600 w-5 h-5" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">5. Social Security Schemes</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* PMJJBY Card */}
            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-blue-900">PMJJBY</span>
                <span className={`badge ${current.enrollPMJJBY ? "badge-blue" : "badge-slate"}`}>
                  {current.enrollPMJJBY ? "Enrolled" : "Not Enrolled"}
                </span>
              </div>
              {current.enrollPMJJBY && (
                <div className="text-xs space-y-1 pt-1 text-slate-700">
                  <div><strong>Premium:</strong> {current.pmjjbyPremiumTier || "₹436"}</div>
                  <div><strong>Nominee:</strong> {current.pmjjbyNomineeName || current.nomineeName || "—"}</div>
                  <div><strong>Relation:</strong> {current.pmjjbyNomineeRelationship || current.nomineeRelationship || "—"}</div>
                </div>
              )}
            </div>

            {/* PMSBY Card */}
            <div className="p-4 rounded-xl border border-violet-200 bg-violet-50/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-violet-900">PMSBY</span>
                <span className={`badge ${current.enrollPMSBY ? "badge-blue" : "badge-slate"}`}>
                  {current.enrollPMSBY ? "Enrolled" : "Not Enrolled"}
                </span>
              </div>
              {current.enrollPMSBY && (
                <div className="text-xs space-y-1 pt-1 text-slate-700">
                  <div><strong>Premium:</strong> ₹20 / Year</div>
                  <div><strong>Nominee:</strong> {current.pmsbyNomineeName || current.nomineeName || "—"}</div>
                  <div><strong>Relation:</strong> {current.pmsbyNomineeRelationship || current.nomineeRelationship || "—"}</div>
                </div>
              )}
            </div>

            {/* APY Card */}
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-emerald-900">APY</span>
                <span className={`badge ${current.enrollAPY ? "badge-green" : "badge-slate"}`}>
                  {current.enrollAPY ? "Enrolled" : "Not Enrolled"}
                </span>
              </div>
              {current.enrollAPY && (
                <div className="text-xs space-y-1 pt-1 text-slate-700">
                  <div><strong>Pension Slab:</strong> {current.apyPensionSlab || "₹1,000"}</div>
                  <div><strong>Frequency:</strong> {current.apyContributionFreq || "Monthly"}</div>
                  <div><strong>Nominee:</strong> {current.apyNomineeName || current.nomineeName || "—"}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ═══════ SECTION 6: Passbook & ATM Delivery Status ═══════ */}
        <div className="sk-card p-6 border-l-4 border-l-rose-500 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <Package className="text-rose-600 w-5 h-5" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">6. Passbook & ATM Card Delivery Status</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
            {/* Passbook Delivery */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-900">Passbook Status</h4>
              <div className="flex items-center justify-between">
                <span>Passbook Issued:</span>
                <span className={`badge ${current.passbookIssued ? "badge-green" : "badge-yellow"}`}>
                  {current.passbookIssued ? "Issued" : "Pending"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Customer Received:</span>
                <span className={`badge ${current.passbookReceived ? "badge-green" : "badge-slate"}`}>
                  {current.passbookReceived ? "Received" : "Not Received"}
                </span>
              </div>
              {current.passbookReceivedAt && (
                <div className="text-[11px] text-slate-400">Received at: {formatDateTime(current.passbookReceivedAt)}</div>
              )}
            </div>

            {/* ATM Delivery */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-900">ATM Debit Card Status</h4>
              <div className="flex items-center justify-between">
                <span>ATM Card Issued:</span>
                <span className={`badge ${current.atmIssued ? "badge-green" : "badge-yellow"}`}>
                  {current.atmIssued ? "Issued" : "Pending"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Customer Received:</span>
                <span className={`badge ${current.atmReceived ? "badge-green" : "badge-slate"}`}>
                  {current.atmReceived ? "Received" : "Not Received"}
                </span>
              </div>
              {current.atmReceivedAt && (
                <div className="text-[11px] text-slate-400">Received at: {formatDateTime(current.atmReceivedAt)}</div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* ─── Delete Confirmation Modal ─── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-red-100">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <AlertCircle size={24} />
              <h3 className="text-base font-bold text-slate-900">Confirm Customer Deletion</h3>
            </div>
            <p className="text-xs text-slate-600 mb-5 leading-relaxed">
              Are you sure you want to delete <strong className="text-slate-900">{customer.name}</strong> ({customer.accountNumber})?
              This will permanently delete this record from Supabase Cloud. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteCustomer}
                disabled={deleting}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-sm disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Permanently Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Print / Download Modal ─── */}
      {showPrintModal && (
        <PrintModal
          customer={current}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </div>
  );
}
