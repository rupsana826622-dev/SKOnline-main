import React, { useState } from "react";
import {
  X, Edit3, Trash2, Printer, Check, ChevronRight, User, MapPin,
  Building, ShieldCheck, HeartHandshake, Package, AlertCircle, Save
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

interface CustomerProfileModalProps {
  customer: Customer;
  isOpen: boolean;
  onClose: () => void;
  onCustomerUpdated: (updatedCustomer: Customer) => void;
  onCustomerDeleted: (id: string) => void;
}

export default function CustomerProfileModal({
  customer,
  isOpen,
  onClose,
  onCustomerUpdated,
  onCustomerDeleted,
}: CustomerProfileModalProps) {
  const [activeTab, setActiveTab] = useState<"personal" | "address" | "banking" | "nomination" | "schemes" | "delivery">("personal");
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Edit form state initialized from customer
  const [editForm, setEditForm] = useState<Customer>({ ...customer });
  const [districtMode, setDistrictMode] = useState<"preset" | "custom">(
    customer.district === "North 24 Parganas" || customer.district === "South 24 Parganas" ? "preset" : "custom"
  );

  if (!isOpen) return null;

  const handleInputChange = (field: keyof Customer, value: any) => {
    let finalVal = value;
    if (field === "dob" || field === "nomineeDob" || field === "apySpouseDob") {
      // Auto-format digits to DD/MM/YYYY
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

      toast.success(`Customer "${editForm.name}" updated successfully in Supabase!`);
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

      toast.success(`Customer "${customer.name}" deleted from Supabase.`);
      setShowDeleteConfirm(false);
      onClose();
      onCustomerDeleted(customer.id);
    } catch (err: any) {
      toast.error(`Error deleting customer: ${err.message || "Network error"}`);
    } finally {
      setDeleting(false);
    }
  };

  const current = isEditing ? editForm : customer;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto animate-fade-in">
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-[#003366] text-white p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4 flex-shrink-0">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/10 text-white flex items-center justify-center text-lg font-bold shadow-inner border border-white/15">
                {current.name ? current.name.charAt(0).toUpperCase() : "C"}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-bold tracking-tight">{current.name || "Customer Profile"}</h2>
                  <span className="badge bg-emerald-500 text-white text-[11px] px-2 py-0.5">Active</span>
                  {current.enrollPMJJBY && <span className="badge bg-blue-500 text-white text-[10px]">PMJJBY</span>}
                  {current.enrollPMSBY && <span className="badge bg-violet-500 text-white text-[10px]">PMSBY</span>}
                  {current.enrollAPY && <span className="badge bg-emerald-600 text-white text-[10px]">APY</span>}
                </div>
                <div className="flex items-center gap-3 text-xs text-blue-200 mt-1 font-mono flex-wrap">
                  <span>A/C: {current.accountNumber}</span>
                  <span>•</span>
                  <span>CIF: {current.customerId || "N/A"}</span>
                  <span>•</span>
                  <span>Ref: {current.refNumber}</span>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons in Header */}
            <div className="flex items-center gap-2 flex-wrap">
              {!isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl border border-white/20 transition-all shadow-sm"
                  >
                    <Edit3 size={13} />
                    Edit Customer
                  </button>
                  <button
                    onClick={() => setShowPrintModal(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-sm"
                  >
                    <Printer size={13} />
                    Reprint / Download Forms
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="p-2 bg-red-500/20 hover:bg-red-500 text-red-200 hover:text-white rounded-xl transition-all border border-red-500/30"
                    title="Delete Customer"
                  >
                    <Trash2 size={15} />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setEditForm({ ...customer });
                      setIsEditing(false);
                    }}
                    className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl border border-white/20 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveChanges}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm disabled:opacity-50"
                  >
                    <Save size={13} />
                    {saving ? "Saving to Supabase..." : "Save Changes"}
                  </button>
                </>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-blue-200 hover:text-white hover:bg-white/10 transition-colors ml-1"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 bg-slate-50/80 px-6 overflow-x-auto custom-scroll flex-shrink-0">
            {[
              { id: "personal", label: "Personal Details", icon: User },
              { id: "address", label: "Address & Contact", icon: MapPin },
              { id: "banking", label: "Banking & CPS", icon: Building },
              { id: "nomination", label: "Nomination & Introducer", icon: HeartHandshake },
              { id: "schemes", label: "Schemes (PMJJBY / PMSBY / APY)", icon: ShieldCheck },
              { id: "delivery", label: "Passbook & ATM Tracker", icon: Package },
            ].map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-3.5 text-xs font-bold whitespace-nowrap border-b-2 transition-all ${
                    active
                      ? "border-blue-600 text-blue-600 bg-white shadow-sm"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Icon size={14} className={active ? "text-blue-600" : "text-slate-400"} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Body Content */}
          <div className="p-6 overflow-y-auto flex-1 custom-scroll bg-slate-50/30">
            {/* 1. PERSONAL DETAILS TAB */}
            {activeTab === "personal" && (
              <div className="space-y-6 animate-fade-in">
                <div className="sk-card p-5">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Applicant Identity</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="form-label">Full Name</label>
                      {isEditing ? (
                        <input
                          className="form-input"
                          value={editForm.name}
                          onChange={e => handleInputChange("name", e.target.value.toUpperCase())}
                        />
                      ) : (
                        <div className="font-semibold text-slate-900 text-sm">{customer.name || "—"}</div>
                      )}
                    </div>

                    <div>
                      <label className="form-label">Father's Name</label>
                      {isEditing ? (
                        <input
                          className="form-input"
                          value={editForm.fatherName}
                          onChange={e => handleInputChange("fatherName", e.target.value.toUpperCase())}
                        />
                      ) : (
                        <div className="font-semibold text-slate-900">{customer.fatherName || "—"}</div>
                      )}
                    </div>

                    <div>
                      <label className="form-label">Mother's Name</label>
                      {isEditing ? (
                        <input
                          className="form-input"
                          value={editForm.motherName}
                          onChange={e => handleInputChange("motherName", e.target.value.toUpperCase())}
                        />
                      ) : (
                        <div className="font-semibold text-slate-900">{customer.motherName || "—"}</div>
                      )}
                    </div>

                    <div>
                      <label className="form-label">Spouse Name</label>
                      {isEditing ? (
                        <input
                          className="form-input"
                          value={editForm.spouseName}
                          onChange={e => handleInputChange("spouseName", e.target.value.toUpperCase())}
                        />
                      ) : (
                        <div className="font-semibold text-slate-900">{customer.spouseName || "—"}</div>
                      )}
                    </div>

                    <div>
                      <label className="form-label">Gender</label>
                      {isEditing ? (
                        <select
                          className="form-input"
                          value={editForm.sex}
                          onChange={e => handleInputChange("sex", e.target.value)}
                        >
                          {SEX_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      ) : (
                        <div className="font-semibold text-slate-900">{customer.sex || "—"}</div>
                      )}
                    </div>

                    <div>
                      <label className="form-label">Date of Birth (DD/MM/YYYY)</label>
                      {isEditing ? (
                        <input
                          className="form-input font-mono"
                          placeholder="DD/MM/YYYY"
                          value={editForm.dob}
                          onChange={e => handleInputChange("dob", e.target.value)}
                        />
                      ) : (
                        <div className="font-semibold text-slate-900 font-mono">{customer.dob || "—"}</div>
                      )}
                    </div>

                    <div>
                      <label className="form-label">Age (Years)</label>
                      {isEditing ? (
                        <input
                          type="number"
                          className="form-input"
                          value={editForm.age || ""}
                          onChange={e => handleInputChange("age", Number(e.target.value))}
                        />
                      ) : (
                        <div className="font-semibold text-slate-900">{customer.age || "—"}</div>
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
                        <div><span className="badge badge-blue">{customer.category || "—"}</span></div>
                      )}
                    </div>

                    <div>
                      <label className="form-label">PAN / GIR Number</label>
                      {isEditing ? (
                        <input
                          className="form-input font-mono"
                          value={editForm.panGir}
                          onChange={e => handleInputChange("panGir", e.target.value.toUpperCase())}
                        />
                      ) : (
                        <div className="font-semibold text-slate-900 font-mono">{customer.panGir || "—"}</div>
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
                        <div className="font-semibold text-slate-900">{customer.profession || "—"}</div>
                      )}
                    </div>

                    <div>
                      <label className="form-label">Annual Income (₹)</label>
                      {isEditing ? (
                        <input
                          className="form-input"
                          value={editForm.annualIncome}
                          onChange={e => handleInputChange("annualIncome", e.target.value)}
                        />
                      ) : (
                        <div className="font-semibold text-slate-900">{customer.annualIncome ? `₹${customer.annualIncome}` : "—"}</div>
                      )}
                    </div>

                    <div>
                      <label className="form-label">Annual Income Tier</label>
                      {isEditing ? (
                        <select
                          className="form-input"
                          value={editForm.annualIncomeTier}
                          onChange={e => handleInputChange("annualIncomeTier", e.target.value)}
                        >
                          {ANNUAL_INCOME_TIERS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      ) : (
                        <div className="font-semibold text-slate-900">{customer.annualIncomeTier || "—"}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. ADDRESS & CONTACT TAB */}
            {activeTab === "address" && (
              <div className="space-y-6 animate-fade-in">
                <div className="sk-card p-5 space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Residential & Contact Address</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                    <div className="sm:col-span-2">
                      <label className="form-label">Address Line</label>
                      {isEditing ? (
                        <input
                          className="form-input"
                          value={editForm.address}
                          onChange={e => handleInputChange("address", e.target.value.toUpperCase())}
                        />
                      ) : (
                        <div className="font-semibold text-slate-900 text-sm">{customer.address || "—"}</div>
                      )}
                    </div>

                    <div>
                      <label className="form-label">Village / Town</label>
                      {isEditing ? (
                        <input
                          className="form-input"
                          value={editForm.village}
                          onChange={e => handleInputChange("village", e.target.value.toUpperCase())}
                        />
                      ) : (
                        <div className="font-semibold text-slate-900">{customer.village || "—"}</div>
                      )}
                    </div>

                    <div>
                      <label className="form-label">Mandal / Tehsil</label>
                      {isEditing ? (
                        <input
                          className="form-input"
                          value={editForm.mandal}
                          onChange={e => handleInputChange("mandal", e.target.value.toUpperCase())}
                        />
                      ) : (
                        <div className="font-semibold text-slate-900">{customer.mandal || "—"}</div>
                      )}
                    </div>

                    <div>
                      <label className="form-label">District</label>
                      {isEditing ? (
                        <div className="space-y-2">
                          <select
                            className="form-input"
                            value={
                              districtMode === "custom" || (editForm.district !== "North 24 Parganas" && editForm.district !== "South 24 Parganas")
                                ? "Other"
                                : editForm.district
                            }
                            onChange={e => {
                              const val = e.target.value;
                              if (val === "Other") {
                                setDistrictMode("custom");
                                if (editForm.district === "North 24 Parganas" || editForm.district === "South 24 Parganas") {
                                  handleInputChange("district", "");
                                }
                              } else {
                                setDistrictMode("preset");
                                handleInputChange("district", val);
                              }
                            }}
                          >
                            <option value="North 24 Parganas">North 24 Parganas</option>
                            <option value="South 24 Parganas">South 24 Parganas</option>
                            <option value="Other">Other (Custom Entry)</option>
                          </select>
                          {(districtMode === "custom" || (editForm.district !== "North 24 Parganas" && editForm.district !== "South 24 Parganas")) && (
                            <input
                              className="form-input"
                              placeholder="Type custom district..."
                              value={editForm.district}
                              onChange={e => handleInputChange("district", e.target.value.toUpperCase())}
                            />
                          )}
                        </div>
                      ) : (
                        <div className="font-semibold text-slate-900">{customer.district || "—"}</div>
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
                          {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      ) : (
                        <div className="font-semibold text-slate-900">{customer.state || "—"}</div>
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
                        <div className="font-semibold text-slate-900 font-mono">{customer.mobile || "—"}</div>
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
                        <div className="font-semibold text-slate-900">{customer.email || "—"}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. BANKING & CPS TAB */}
            {activeTab === "banking" && (
              <div className="space-y-6 animate-fade-in">
                <div className="sk-card p-5">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Account & CPS Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="form-label">Account Number</label>
                      {isEditing ? (
                        <input
                          className="form-input font-mono"
                          value={editForm.accountNumber}
                          onChange={e => handleInputChange("accountNumber", e.target.value)}
                        />
                      ) : (
                        <div className="font-semibold text-slate-900 font-mono text-sm">{customer.accountNumber || "—"}</div>
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
                        <div className="font-semibold text-slate-900 font-mono">{customer.customerId || "—"}</div>
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
                        <div className="font-semibold text-amber-700 font-mono">{customer.accountOpeningDate || "—"}</div>
                      )}
                    </div>

                    <div>
                      <label className="form-label">Reference Number</label>
                      <div className="font-semibold text-slate-900 font-mono">{customer.refNumber || "—"}</div>
                    </div>

                    <div>
                      <label className="form-label">Sol ID</label>
                      {isEditing ? (
                        <input
                          className="form-input font-mono"
                          value={editForm.solId}
                          onChange={e => handleInputChange("solId", e.target.value)}
                        />
                      ) : (
                        <div className="font-semibold text-slate-900 font-mono">{customer.solId || "—"}</div>
                      )}
                    </div>

                    <div>
                      <label className="form-label">Zone</label>
                      {isEditing ? (
                        <input
                          className="form-input"
                          value={editForm.zone}
                          onChange={e => handleInputChange("zone", e.target.value)}
                        />
                      ) : (
                        <div className="font-semibold text-slate-900">{customer.zone || "—"}</div>
                      )}
                    </div>

                    <div>
                      <label className="form-label">Branch Code</label>
                      <div className="font-semibold text-slate-900 font-mono">{customer.branchCode || "—"}</div>
                    </div>

                    <div>
                      <label className="form-label">Education Level</label>
                      {isEditing ? (
                        <select
                          className="form-input"
                          value={editForm.educationLevel}
                          onChange={e => handleInputChange("educationLevel", e.target.value)}
                        >
                          {EDUCATION_LEVELS.map(ed => <option key={ed} value={ed}>{ed}</option>)}
                        </select>
                      ) : (
                        <div className="font-semibold text-slate-900">{customer.educationLevel || "—"}</div>
                      )}
                    </div>

                    <div>
                      <label className="form-label">Occupation Type</label>
                      {isEditing ? (
                        <select
                          className="form-input"
                          value={editForm.occupationType}
                          onChange={e => handleInputChange("occupationType", e.target.value)}
                        >
                          {OCCUPATION_TYPES.map(oc => <option key={oc} value={oc}>{oc}</option>)}
                        </select>
                      ) : (
                        <div className="font-semibold text-slate-900">{customer.occupationType || "—"}</div>
                      )}
                    </div>

                    <div>
                      <label className="form-label">Risk Category</label>
                      {isEditing ? (
                        <select
                          className="form-input"
                          value={editForm.riskCategory}
                          onChange={e => handleInputChange("riskCategory", e.target.value)}
                        >
                          {["Low", "Medium", "High"].map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      ) : (
                        <div>
                          <span className={`badge ${customer.riskCategory === "High" ? "badge-red" : customer.riskCategory === "Medium" ? "badge-yellow" : "badge-green"}`}>
                            {customer.riskCategory || "Low"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. NOMINATION & INTRODUCER TAB */}
            {activeTab === "nomination" && (
              <div className="space-y-6 animate-fade-in">
                <div className="sk-card p-5">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Primary Account Nominee</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="form-label">Nominee Name</label>
                      {isEditing ? (
                        <input
                          className="form-input"
                          value={editForm.nomineeName}
                          onChange={e => handleInputChange("nomineeName", e.target.value.toUpperCase())}
                        />
                      ) : (
                        <div className="font-semibold text-slate-900">{customer.nomineeName || "—"}</div>
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
                        <div className="font-semibold text-slate-900">{customer.nomineeRelationship || "—"}</div>
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
                        <div className="font-semibold text-slate-900">{customer.nomineeAge || "—"}</div>
                      )}
                    </div>

                    <div>
                      <label className="form-label">Nominee DOB (if minor)</label>
                      {isEditing ? (
                        <input
                          className="form-input font-mono"
                          value={editForm.nomineeDob}
                          onChange={e => handleInputChange("nomineeDob", e.target.value)}
                        />
                      ) : (
                        <div className="font-semibold text-slate-900 font-mono">{customer.nomineeDob || "—"}</div>
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
                        <div className="font-semibold text-slate-900 font-mono">{customer.sbAccountNo || "—"}</div>
                      )}
                    </div>

                    <div>
                      <label className="form-label">Guardian Name (if minor)</label>
                      {isEditing ? (
                        <input
                          className="form-input"
                          value={editForm.guardianName}
                          onChange={e => handleInputChange("guardianName", e.target.value.toUpperCase())}
                        />
                      ) : (
                        <div className="font-semibold text-slate-900">{customer.guardianName || "—"}</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="sk-card p-5">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Introducer Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="form-label">Introducer Name</label>
                      {isEditing ? (
                        <input
                          className="form-input"
                          value={editForm.introducerName}
                          onChange={e => handleInputChange("introducerName", e.target.value.toUpperCase())}
                        />
                      ) : (
                        <div className="font-semibold text-slate-900">{customer.introducerName || "—"}</div>
                      )}
                    </div>

                    <div>
                      <label className="form-label">Introducer Account No.</label>
                      {isEditing ? (
                        <input
                          className="form-input font-mono"
                          value={editForm.introducerAccountNo}
                          onChange={e => handleInputChange("introducerAccountNo", e.target.value)}
                        />
                      ) : (
                        <div className="font-semibold text-slate-900 font-mono">{customer.introducerAccountNo || "—"}</div>
                      )}
                    </div>

                    <div>
                      <label className="form-label">Introducer Branch</label>
                      {isEditing ? (
                        <input
                          className="form-input"
                          value={editForm.introducerBranch}
                          onChange={e => handleInputChange("introducerBranch", e.target.value)}
                        />
                      ) : (
                        <div className="font-semibold text-slate-900">{customer.introducerBranch || "—"}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 5. SOCIAL SECURITY SCHEMES TAB */}
            {activeTab === "schemes" && (
              <div className="space-y-6 animate-fade-in">
                {/* PMJJBY */}
                <div className="sk-card p-5 border-l-4 border-l-blue-600">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-sm text-blue-900">PMJJBY — Pradhan Mantri Jeevan Jyoti Bima Yojana</h4>
                    <span className={`badge ${current.enrollPMJJBY ? "badge-blue" : "badge-slate"}`}>
                      {current.enrollPMJJBY ? "Enrolled" : "Not Enrolled"}
                    </span>
                  </div>
                  {current.enrollPMJJBY && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs mt-3">
                      <div><label className="form-label">Premium Tier</label><div className="font-semibold text-slate-900">{current.pmjjbyPremiumTier || "—"}</div></div>
                      <div><label className="form-label">Nominee Name</label><div className="font-semibold text-slate-900">{current.pmjjbyNomineeName || current.nomineeName || "—"}</div></div>
                      <div><label className="form-label">Nominee Relation</label><div className="font-semibold text-slate-900">{current.pmjjbyNomineeRelationship || current.nomineeRelationship || "—"}</div></div>
                      <div><label className="form-label">KYC Type</label><div className="font-semibold text-slate-900">{current.pmjjbyKycType || "Aadhaar Card"}</div></div>
                      <div><label className="form-label">KYC ID</label><div className="font-semibold text-slate-900 font-mono">{current.pmjjbyKycId || "—"}</div></div>
                    </div>
                  )}
                </div>

                {/* PMSBY */}
                <div className="sk-card p-5 border-l-4 border-l-violet-600">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-sm text-violet-900">PMSBY — Pradhan Mantri Suraksha Bima Yojana</h4>
                    <span className={`badge ${current.enrollPMSBY ? "badge-blue" : "badge-slate"}`}>
                      {current.enrollPMSBY ? "Enrolled" : "Not Enrolled"}
                    </span>
                  </div>
                  {current.enrollPMSBY && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs mt-3">
                      <div><label className="form-label">Annual Premium</label><div className="font-semibold text-slate-900">₹20</div></div>
                      <div><label className="form-label">Nominee Name</label><div className="font-semibold text-slate-900">{current.pmsbyNomineeName || current.nomineeName || "—"}</div></div>
                      <div><label className="form-label">Nominee Relation</label><div className="font-semibold text-slate-900">{current.pmsbyNomineeRelationship || current.nomineeRelationship || "—"}</div></div>
                    </div>
                  )}
                </div>

                {/* APY */}
                <div className="sk-card p-5 border-l-4 border-l-emerald-600">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-sm text-emerald-900">APY — Atal Pension Yojana</h4>
                    <span className={`badge ${current.enrollAPY ? "badge-green" : "badge-slate"}`}>
                      {current.enrollAPY ? "Enrolled" : "Not Enrolled"}
                    </span>
                  </div>
                  {current.enrollAPY && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs mt-3">
                      <div><label className="form-label">Pension Slab</label><div className="font-semibold text-slate-900">{current.apyPensionSlab || "—"}</div></div>
                      <div><label className="form-label">Contribution Frequency</label><div className="font-semibold text-slate-900">{current.apyContributionFreq || "Monthly"}</div></div>
                      <div><label className="form-label">Marital Status</label><div className="font-semibold text-slate-900">{current.apyMaritalStatus || "Single"}</div></div>
                      {current.apySpouseName && <div><label className="form-label">Spouse Name</label><div className="font-semibold text-slate-900">{current.apySpouseName}</div></div>}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 6. PASSBOOK & ATM TRACKER TAB */}
            {activeTab === "delivery" && (
              <div className="space-y-6 animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sk-card p-5">
                    <h4 className="font-bold text-sm text-slate-900 mb-3">Passbook Delivery Status</h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                        <span className="font-semibold text-slate-600">Passbook Issued:</span>
                        <span className={`badge ${current.passbookIssued ? "badge-green" : "badge-yellow"}`}>
                          {current.passbookIssued ? "Issued" : "Pending"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                        <span className="font-semibold text-slate-600">Customer Received:</span>
                        <span className={`badge ${current.passbookReceived ? "badge-green" : "badge-slate"}`}>
                          {current.passbookReceived ? "Received" : "Not Received"}
                        </span>
                      </div>
                      {current.passbookReceivedAt && (
                        <div className="text-[11px] text-slate-400 mt-1">
                          Received at: {formatDateTime(current.passbookReceivedAt)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="sk-card p-5">
                    <h4 className="font-bold text-sm text-slate-900 mb-3">ATM Card Delivery Status</h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                        <span className="font-semibold text-slate-600">ATM Issued:</span>
                        <span className={`badge ${current.atmIssued ? "badge-green" : "badge-yellow"}`}>
                          {current.atmIssued ? "Issued" : "Pending"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                        <span className="font-semibold text-slate-600">Customer Received:</span>
                        <span className={`badge ${current.atmReceived ? "badge-green" : "badge-slate"}`}>
                          {current.atmReceived ? "Received" : "Not Received"}
                        </span>
                      </div>
                      {current.atmReceivedAt && (
                        <div className="text-[11px] text-slate-400 mt-1">
                          Received at: {formatDateTime(current.atmReceivedAt)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-shrink-0 text-xs text-slate-500">
            <div>
              Registered: {formatDateTime(customer.createdAt)}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-all shadow-sm"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
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
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCustomer}
                disabled={deleting}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-sm disabled:opacity-50"
              >
                {deleting ? "Deleting from Supabase..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instant High-DPI 1:1 Print/Download Modal */}
      {showPrintModal && (
        <PrintModal customer={customer} onClose={() => setShowPrintModal(false)} />
      )}
    </>
  );
}
