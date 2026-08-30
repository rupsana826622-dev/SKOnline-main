/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserPlus, Save, AlertCircle, ChevronDown, ChevronUp,
  CheckSquare, Square, Info,
} from "lucide-react";
import { addCustomerAsync, getSettings } from "@/lib/storage";
import { generateId, generateRefNumber, calculateAgeFromDob } from "@/lib/utils";
import {
  CATEGORIES, SEX_OPTIONS, STATES, EDUCATION_LEVELS, OCCUPATION_TYPES,
  ANNUAL_INCOME_TIERS, PMJJBY_PREMIUM_TIERS, APY_PENSION_SLABS, KYC_DOC_TYPES,
  NOMINEE_RELATIONSHIPS,
} from "@/constants";
import DatePickerInput from "@/components/common/DatePickerInput";
import PrintModal from "@/components/features/PrintModal";
import type { Customer } from "@/types";
import { toast } from "sonner";
import SEO from "@/components/common/SEO";

// ─── Reusable primitives ──────────────────────────────────────────────────────

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="border-b border-slate-200 pb-3 mb-4">
      <h2 className="text-base font-bold text-slate-900">{title}</h2>
      {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
  );
}

function Field({
  label, error, required, hint, children,
}: {
  label: string; error?: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="form-label">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-[11px] text-slate-400">{hint}</p>}
      {error && (
        <div className="flex items-center gap-1 mt-1 text-xs text-red-600">
          <AlertCircle size={11} /><span>{error}</span>
        </div>
      )}
    </div>
  );
}

function Grid({ cols = 2, children }: { cols?: number; children: React.ReactNode }) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-${cols} gap-4`}>{children}</div>
  );
}

function Inp({
  k, form, set, type = "text", placeholder, maxLength, mono, uppercase, readOnly,
}: {
  k: string; form: any; set: (k: string, v: string) => void;
  type?: string; placeholder?: string; maxLength?: number;
  mono?: boolean; uppercase?: boolean; readOnly?: boolean;
}) {
  return (
    <input
      type={type}
      readOnly={readOnly}
      className={`form-input ${mono ? "font-mono" : ""} ${readOnly ? "bg-slate-50 cursor-default" : ""}`}
      placeholder={placeholder}
      maxLength={maxLength}
      value={form[k] ?? ""}
      onChange={e => {
        const v = uppercase ? e.target.value.toUpperCase() : e.target.value;
        set(k, v);
      }}
    />
  );
}

function Sel({
  k, form, set, options,
}: {
  k: string; form: any; set: (k: string, v: string) => void; options: readonly string[] | string[];
}) {
  return (
    <select className="form-input" value={form[k] ?? ""} onChange={e => set(k, e.target.value)}>
      <option value="">— Select —</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function SchemeToggle({
  checked, onChange, label, color,
}: {
  checked: boolean; onChange: (v: boolean) => void; label: string; color: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
        checked
          ? `${color} text-white border-transparent shadow-md`
          : "border-slate-200 text-slate-600 hover:border-slate-300 bg-white"
      }`}
    >
      {checked ? <CheckSquare size={16} /> : <Square size={16} />}
      {label}
      {checked ? <ChevronUp size={14} className="ml-auto" /> : <ChevronDown size={14} className="ml-auto" />}
    </button>
  );
}

// ─── Default form state ───────────────────────────────────────────────────────
function defaultForm(settings: ReturnType<typeof getSettings>) {
  const today = new Date();
  const d = String(today.getDate()).padStart(2, "0");
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const y = today.getFullYear();
  const todayFormatted = `${d}/${m}/${y}`;

  return {
    // Account Identification
    branchCode: settings.branchCode,
    customerId: "",
    accountSuffix: "",
    refNumber: generateRefNumber(settings.refPrefix),
    accountOpeningDate: todayFormatted,
    // Personal
    name: "", fatherName: "", motherName: "", spouseName: "",
    sex: "Male", age: "", dob: "", profession: "", category: "OBC",
    // Address
    address: "", village: "", mandal: "", district: "North 24 Parganas", state: "West Bengal",
    // Financial & KYC
    annualIncome: "", annualIncomeTier: "< ₹25,000", panGir: "", mobile: "", email: "",
    // Nomination
    sbAccountNo: "", nomineeName: "", nomineeRelationship: "", nomineeAge: "", nomineeDob: "", guardianName: "",
    // Introducer
    introducerName: "", introducerAccountNo: "", introducerBranch: "", introducerYears: "",
    // CPS
    solId: settings.solId,
    zone: settings.zone,
    educationLevel: "",
    occupationType: "",
    politicallyProminent: "No",
    turnoverType: "Actual",
    turnoverAmount: "",
    riskCategory: "Low",
    // PMJJBY
    pmjjbyPremiumTier: PMJJBY_PREMIUM_TIERS[0],
    pmjjbyDisability: "No",
    pmjjbyDisabilityDetails: "",
    pmjjbyKycType: "",
    pmjjbyKycId: "",
    pmjjbyNomineeName: "",
    pmjjbyNomineeRelationship: "",
    pmjjbyNomineeDob: "",
    pmjjbyNomineeAge: "",
    pmjjbyGuardianName: "",
    pmjjbyGuardianAddress: "",
    pmjjbyGuardianRelationship: "",
    pmjjbyGuardianMobile: "",
    pmjjbyAadharConsent: "Yes",
    // PMSBY
    pmsbyDisability: "No",
    pmsbyDisabilityDetails: "",
    pmsbyKycType: "",
    pmsbyKycId: "",
    pmsbyNomineeName: "",
    pmsbyNomineeRelationship: "",
    pmsbyNomineeDob: "",
    pmsbyNomineeAge: "",
    pmsbyGuardianName: "",
    pmsbyGuardianAddress: "",
    pmsbyGuardianRelationship: "",
    pmsbyGuardianMobile: "",
    pmsbyAadharConsent: "Yes",
    // APY
    apyMaritalStatus: "Single",
    apySpouseName: "",
    apySpouseDob: "",
    apySpouseAadhar: "",
    apyPensionSlab: "₹1,000",
    apyContributionFreq: "Monthly",
    apyTaxPayer: "No",
    apySocialSecurity: "No",
    apyNomineeName: "",
    apyNomineeRelationship: "",
    apyNomineeDob: "",
    apyNomineeAge: "",
    apyNomineeAadhar: "",
    apyGuardianName: "",
    apyGuardianMobile: "",
    apyGuardianRelationship: "",
    apyAutodebitConsent: "Yes",
  };
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AddCustomerPage() {
  const navigate = useNavigate();
  const settings = getSettings();
  const [form, setFormState] = useState<Record<string, string>>(defaultForm(settings));
  const [districtMode, setDistrictMode] = useState<"preset" | "custom">("preset");
  const [enrollPMJJBY, setEnrollPMJJBY] = useState(false);
  const [enrollPMSBY, setEnrollPMSBY] = useState(false);
  const [enrollAPY, setEnrollAPY] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [printCustomer, setPrintCustomer] = useState<Customer | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const formatDob = (val: string, prevVal: string = "") => {
    if (val.length < prevVal.length) {
      return val;
    }
    const digits = val.replace(/\D/g, "");
    let formatted = "";
    if (digits.length > 0) {
      formatted += digits.substring(0, 2);
      if (digits.length === 2) {
        formatted += "/";
      }
    }
    if (digits.length > 2) {
      formatted += "/" + digits.substring(2, 4);
      if (digits.length === 4) {
        formatted += "/";
      }
    }
    if (digits.length > 4) {
      formatted += "/" + digits.substring(4, 8);
    }
    return formatted;
  };

  const set = (k: string, v: string) => {
    let finalValue = v;
    if (k.toLowerCase().includes("dob") || k === "apySpouseDob") {
      const prevVal = form[k] ?? "";
      finalValue = formatDob(v.slice(0, 10), prevVal);
    }

    setFormState(f => {
      const updated = { ...f, [k]: finalValue };

      // Auto-Age Calculation for Applicant DOB
      if (k === "dob") {
        const calculatedAge = calculateAgeFromDob(finalValue);
        if (calculatedAge) {
          updated.age = calculatedAge;
        }
      }

      // Auto-Age Calculation for Nominee DOB
      if (k === "nomineeDob") {
        const calculatedNomineeAge = calculateAgeFromDob(finalValue);
        if (calculatedNomineeAge) {
          updated.nomineeAge = calculatedNomineeAge;
        }
      }

      return updated;
    });

    setErrors(e => { const n = { ...e }; delete n[k]; return n; });
  };

  const checkIsMinor = (val: string): boolean => {
    if (!val) return false;
    if (/^\d+$/.test(val)) {
      return Number(val) < 18;
    }
    const parts = val.split(/[-/]/);
    if (parts.length === 3) {
      const day = Number(parts[0]);
      const month = Number(parts[1]);
      const year = Number(parts[2]);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        const dob = new Date(year, month - 1, day);
        const diff = Date.now() - dob.getTime();
        const ageDate = new Date(diff);
        const age = Math.abs(ageDate.getUTCFullYear() - 1970);
        return age < 18;
      }
    }
    return false;
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.fatherName.trim()) errs.fatherName = "Father's name is required";
    if (!form.dob.trim()) errs.dob = "Date of birth is required";
    if (!form.age || isNaN(Number(form.age))) errs.age = "Valid age is required";
    if (!form.mobile.trim() || form.mobile.length < 10) errs.mobile = "Valid 10-digit mobile is required";
    if (!form.address.trim()) errs.address = "Address is required";
    if (!form.village.trim()) errs.village = "Village is required";
    if (!form.district.trim()) errs.district = "District is required";
    if (!form.accountSuffix.trim()) errs.accountSuffix = "Account suffix is required";
    
    // PMJJBY validation
    if (enrollPMJJBY) {
      if (!form.pmjjbyNomineeName.trim()) errs.pmjjbyNomineeName = "Nominee name is required for PMJJBY";
      if (!form.pmjjbyNomineeRelationship.trim()) errs.pmjjbyNomineeRelationship = "Nominee relationship is required for PMJJBY";
      if (checkIsMinor(form.pmjjbyNomineeDob || form.pmjjbyNomineeAge)) {
        if (!form.pmjjbyGuardianName.trim()) errs.pmjjbyGuardianName = "Guardian name is required for minor PMJJBY nominee";
      }
    }

    // PMSBY validation
    if (enrollPMSBY) {
      if (!form.pmsbyNomineeName.trim()) errs.pmsbyNomineeName = "Nominee name is required for PMSBY";
      if (!form.pmsbyNomineeRelationship.trim()) errs.pmsbyNomineeRelationship = "Nominee relationship is required for PMSBY";
      if (checkIsMinor(form.pmsbyNomineeDob || form.pmsbyNomineeAge)) {
        if (!form.pmsbyGuardianName.trim()) errs.pmsbyGuardianName = "Guardian name is required for minor PMSBY nominee";
      }
    }

    // APY validation
    if (enrollAPY) {
      if (!form.apyNomineeName.trim()) errs.apyNomineeName = "Nominee name is required for APY";
      if (!form.apyNomineeRelationship.trim()) errs.apyNomineeRelationship = "Nominee relationship is required for APY";
      if (checkIsMinor(form.apyNomineeDob || form.apyNomineeAge)) {
        if (!form.apyGuardianName.trim()) errs.apyGuardianName = "Guardian name is required for minor APY nominee";
      }
      if (form.apyMaritalStatus === "Married") {
        if (!form.apySpouseName.trim()) errs.apySpouseName = "Spouse name required for married APY subscriber";
        if (!form.apySpouseDob.trim()) errs.apySpouseDob = "Spouse Date of Birth is required";
      }
    }

    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      const firstKey = Object.keys(errs)[0];
      document.getElementById(`field-${firstKey}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please fix the errors highlighted below.");
      return;
    }
    setSubmitting(true);

    const customer: Customer = {
      id: generateId(),
      branchCode: form.branchCode,
      customerId: form.customerId,
      accountNumber: settings.accountPrefix + form.accountSuffix,
      refNumber: form.refNumber,
      accountOpeningDate: form.accountOpeningDate || "",
      name: form.name, fatherName: form.fatherName, motherName: form.motherName,
      spouseName: form.spouseName, sex: form.sex as Customer["sex"],
      age: Number(form.age), dob: form.dob, profession: form.profession,
      category: form.category as Customer["category"],
      address: form.address, village: form.village, mandal: form.mandal,
      district: form.district, state: form.state,
      annualIncome: form.annualIncome, annualIncomeTier: form.annualIncomeTier,
      panGir: form.panGir, mobile: form.mobile, email: form.email,
      sbAccountNo: form.sbAccountNo, nomineeName: form.nomineeName,
      nomineeRelationship: form.nomineeRelationship, nomineeAge: form.nomineeAge,
      nomineeDob: form.nomineeDob, guardianName: form.guardianName,
      introducerName: form.introducerName, introducerAccountNo: form.introducerAccountNo,
      introducerBranch: form.introducerBranch, introducerYears: form.introducerYears,
      solId: form.solId, zone: form.zone,
      educationLevel: form.educationLevel, occupationType: form.occupationType,
      politicallyProminent: form.politicallyProminent as "Yes" | "No",
      turnoverType: form.turnoverType as "Actual" | "Estimated",
      turnoverAmount: form.turnoverAmount,
      riskCategory: form.riskCategory as "Low" | "Medium" | "High",
      // PMJJBY
      enrollPMJJBY,
      pmjjbyPremiumTier: enrollPMJJBY ? form.pmjjbyPremiumTier : "",
      pmjjbyDisability: enrollPMJJBY ? form.pmjjbyDisability as "Yes" | "No" : "No",
      pmjjbyDisabilityDetails: enrollPMJJBY ? form.pmjjbyDisabilityDetails : "",
      pmjjbyKycType: enrollPMJJBY ? form.pmjjbyKycType : "",
      pmjjbyKycId: enrollPMJJBY ? form.pmjjbyKycId : "",
      pmjjbyNomineeName: enrollPMJJBY ? form.pmjjbyNomineeName : "",
      pmjjbyNomineeRelationship: enrollPMJJBY ? form.pmjjbyNomineeRelationship : "",
      pmjjbyNomineeDob: enrollPMJJBY ? form.pmjjbyNomineeDob : "",
      pmjjbyNomineeAge: enrollPMJJBY ? form.pmjjbyNomineeAge : "",
      pmjjbyGuardianName: enrollPMJJBY ? form.pmjjbyGuardianName : "",
      pmjjbyGuardianAddress: enrollPMJJBY ? form.pmjjbyGuardianAddress : "",
      pmjjbyGuardianRelationship: enrollPMJJBY ? form.pmjjbyGuardianRelationship : "",
      pmjjbyGuardianMobile: enrollPMJJBY ? form.pmjjbyGuardianMobile : "",
      pmjjbyAadharConsent: enrollPMJJBY ? form.pmjjbyAadharConsent === "Yes" : false,
      // PMSBY
      enrollPMSBY,
      pmsbyDisability: enrollPMSBY ? form.pmsbyDisability as "Yes" | "No" : "No",
      pmsbyDisabilityDetails: enrollPMSBY ? form.pmsbyDisabilityDetails : "",
      pmsbyKycType: enrollPMSBY ? form.pmsbyKycType : "",
      pmsbyKycId: enrollPMSBY ? form.pmsbyKycId : "",
      pmsbyNomineeName: enrollPMSBY ? form.pmsbyNomineeName : "",
      pmsbyNomineeRelationship: enrollPMSBY ? form.pmsbyNomineeRelationship : "",
      pmsbyNomineeDob: enrollPMSBY ? form.pmsbyNomineeDob : "",
      pmsbyNomineeAge: enrollPMSBY ? form.pmsbyNomineeAge : "",
      pmsbyGuardianName: enrollPMSBY ? form.pmsbyGuardianName : "",
      pmsbyGuardianAddress: enrollPMSBY ? form.pmsbyGuardianAddress : "",
      pmsbyGuardianRelationship: enrollPMSBY ? form.pmsbyGuardianRelationship : "",
      pmsbyGuardianMobile: enrollPMSBY ? form.pmsbyGuardianMobile : "",
      pmsbyAadharConsent: enrollPMSBY ? form.pmsbyAadharConsent === "Yes" : false,
      // APY
      enrollAPY,
      apyMaritalStatus: enrollAPY ? form.apyMaritalStatus as Customer["apyMaritalStatus"] : "Single",
      apySpouseName: enrollAPY ? form.apySpouseName : "",
      apySpouseDob: enrollAPY ? form.apySpouseDob : "",
      apySpouseAadhar: enrollAPY ? form.apySpouseAadhar : "",
      apyPensionSlab: enrollAPY ? form.apyPensionSlab : "",
      apyContributionFreq: enrollAPY ? form.apyContributionFreq as Customer["apyContributionFreq"] : "Monthly",
      apyTaxPayer: enrollAPY ? form.apyTaxPayer as "Yes" | "No" : "No",
      apySocialSecurity: enrollAPY ? form.apySocialSecurity as "Yes" | "No" : "No",
      apyNomineeName: enrollAPY ? form.apyNomineeName : "",
      apyNomineeRelationship: enrollAPY ? form.apyNomineeRelationship : "",
      apyNomineeDob: enrollAPY ? form.apyNomineeDob : "",
      apyNomineeAge: enrollAPY ? form.apyNomineeAge : "",
      apyNomineeAadhar: enrollAPY ? form.apyNomineeAadhar : "",
      apyGuardianName: enrollAPY ? form.apyGuardianName : "",
      apyGuardianMobile: enrollAPY ? form.apyGuardianMobile : "",
      apyGuardianRelationship: enrollAPY ? form.apyGuardianRelationship : "",
      apyAutodebitConsent: enrollAPY ? form.apyAutodebitConsent === "Yes" : false,
      // Delivery
      passbookIssued: false, passbookIssuedAt: "",
      passbookReceived: false, passbookReceivedAt: "",
      atmIssued: false, atmIssuedAt: "", atmReceived: false, atmReceivedAt: "",
      createdAt: new Date().toISOString(),
    };

    try {
      const { error } = await addCustomerAsync(customer);
      if (error) {
        toast.error(`Supabase cloud save failed: ${error.message || "Please check connection"}`);
        setSubmitting(false);
        return;
      }
      toast.success(`Customer "${customer.name}" registered and saved directly to Supabase!`);
      setPrintCustomer(customer);
    } catch (err: any) {
      toast.error(`Failed to register customer: ${err.message || "Unknown error"}`);
    } finally {
      setSubmitting(false);
    }
  };

  const fullAccountNo = settings.accountPrefix + (form.accountSuffix || "______");

  return (
    <div className="max-w-4xl mx-auto pb-16">
      <SEO
        title="Add Customer & Enroll Schemes"
        description="Register new customer accounts and configure PMJJBY, PMSBY, and APY social security scheme enrollments."
      />
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
          <UserPlus size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">New Customer Registration</h1>
          <p className="text-sm text-slate-500 mt-0.5">Complete Account Opening Form (AOF) — All sections on one page</p>
        </div>
      </div>

      {/* Scheme enroll badges */}
      <div className="flex flex-wrap gap-2 mb-5">
        {[
          enrollPMJJBY && <span key="pmjjby" className="badge bg-blue-600 text-white">PMJJBY Enrolled</span>,
          enrollPMSBY && <span key="pmsby" className="badge bg-violet-600 text-white">PMSBY Enrolled</span>,
          enrollAPY && <span key="apy" className="badge bg-emerald-600 text-white">APY Enrolled</span>,
        ].filter(Boolean)}
        {!enrollPMJJBY && !enrollPMSBY && !enrollAPY && (
          <span className="text-xs text-slate-400">No scheme enrollments yet — scroll down to enroll.</span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ═══════ SECTION 1: Account Identification ═══════ */}
        <div className="sk-card p-5">
          <SectionHeader title="1. Account Identification" subtitle="Branch and account reference details" />
          <Grid cols={3}>
            <Field label="Branch Code">
              <Inp k="branchCode" form={form} set={set} placeholder="002345" mono />
            </Field>
            <Field label="Customer ID (CIF)">
              <Inp k="customerId" form={form} set={set} placeholder="CIF12345678" mono />
            </Field>
            <Field label="Reference Number" hint="Auto-generated — editable">
              <Inp k="refNumber" form={form} set={set} mono />
            </Field>
          </Grid>
          <div className="mt-4">
            <Grid cols={2}>
              <div id="field-accountSuffix">
                <Field label="Account Number" required error={errors.accountSuffix}
                  hint={`Full account = ${settings.accountPrefix} + suffix you type`}>
                  <div className="flex items-center gap-0">
                    <div className="px-3 py-2 bg-slate-100 border border-r-0 border-slate-200 rounded-l-lg text-sm font-mono text-slate-600 flex-shrink-0 h-10 flex items-center">
                      {settings.accountPrefix}
                    </div>
                    <input
                      className="form-input rounded-l-none font-mono flex-1"
                      placeholder="remaining digits"
                      value={form.accountSuffix}
                      onChange={e => set("accountSuffix", e.target.value)}
                    />
                  </div>
                  {form.accountSuffix && (
                    <p className="mt-1 text-xs text-blue-600 font-mono font-semibold">
                      Full A/c: {fullAccountNo}
                    </p>
                  )}
                </Field>
              </div>
              <Field label="Account Opening Date" hint="Select current or backdate (DD/MM/YYYY)">
                <DatePickerInput
                  value={form.accountOpeningDate}
                  onChange={val => set("accountOpeningDate", val)}
                  placeholder="DD/MM/YYYY"
                />
              </Field>
            </Grid>
          </div>
        </div>

        {/* ═══════ SECTION 2: Personal Information ═══════ */}
        <div className="sk-card p-5">
          <SectionHeader title="2. Personal Information" subtitle="Applicant details as per KYC documents" />
          <div className="space-y-4">
            <Grid cols={2}>
              <div id="field-name">
                <Field label="Name in Full" required error={errors.name}>
                  <Inp k="name" form={form} set={set} placeholder="Full legal name" uppercase />
                </Field>
              </div>
              <div id="field-fatherName">
                <Field label="Father's Name" required error={errors.fatherName}>
                  <Inp k="fatherName" form={form} set={set} placeholder="Father's full name" uppercase />
                </Field>
              </div>
              <Field label="Mother's Name">
                <Inp k="motherName" form={form} set={set} placeholder="Mother's full name" uppercase />
              </Field>
              <Field label="Spouse Name">
                <Inp k="spouseName" form={form} set={set} placeholder="Spouse's full name (if married)" uppercase />
              </Field>
            </Grid>
            <Grid cols={4}>
              <Field label="Sex">
                <Sel k="sex" form={form} set={set} options={SEX_OPTIONS} />
              </Field>
              <div id="field-age">
                <Field label="Age" required error={errors.age}>
                  <Inp k="age" form={form} set={set} type="number" placeholder="Years" />
                </Field>
              </div>
              <div id="field-dob">
                <Field label="Date of Birth (DD/MM/YYYY)" required error={errors.dob}>
                  <Inp k="dob" form={form} set={set} placeholder="15/08/1990" maxLength={10} mono />
                </Field>
              </div>
              <Field label="Category">
                <Sel k="category" form={form} set={set} options={CATEGORIES} />
              </Field>
            </Grid>
            <Grid cols={2}>
              <Field label="Profession / Occupation">
                <Inp k="profession" form={form} set={set} placeholder="e.g. Farmer, Teacher, Labour" />
              </Field>
              <Field label="Annual Income (₹)">
                <Inp k="annualIncome" form={form} set={set} type="number" placeholder="e.g. 120000" />
              </Field>
              <Field label="GIR / PAN Number">
                <Inp k="panGir" form={form} set={set} placeholder="ABCDE1234F" maxLength={12} uppercase mono />
              </Field>
              <div id="field-mobile">
                <Field label="Mobile Number" required error={errors.mobile}>
                  <Inp k="mobile" form={form} set={set} type="tel" placeholder="10-digit mobile" maxLength={10} mono />
                </Field>
              </div>
            </Grid>
            <Field label="Email (Optional)">
              <Inp k="email" form={form} set={set} type="email" placeholder="email@example.com" />
            </Field>
          </div>
        </div>

        {/* ═══════ SECTION 3: Address ═══════ */}
        <div className="sk-card p-5">
          <SectionHeader title="3. Address Information" />
          <div className="space-y-4">
            <div id="field-address">
              <Field label="Address Line" required error={errors.address}>
                <Inp k="address" form={form} set={set} placeholder="House No., Street, Area" uppercase />
              </Field>
            </div>
            <Grid cols={2}>
              <div id="field-village">
                <Field label="Village" required error={errors.village}>
                  <Inp k="village" form={form} set={set} placeholder="Village name" uppercase />
                </Field>
              </div>
              <Field label="Mandal / Tehsil">
                <Inp k="mandal" form={form} set={set} placeholder="Mandal or Tehsil" uppercase />
              </Field>
              <div id="field-district">
                <Field label="District" required error={errors.district}>
                  <div className="space-y-2">
                    <select
                      className="form-input"
                      value={
                        districtMode === "custom" || (form.district && form.district !== "North 24 Parganas" && form.district !== "South 24 Parganas")
                          ? "Other"
                          : (form.district || "North 24 Parganas")
                      }
                      onChange={e => {
                        const val = e.target.value;
                        if (val === "Other") {
                          setDistrictMode("custom");
                          if (form.district === "North 24 Parganas" || form.district === "South 24 Parganas") {
                            set("district", "");
                          }
                        } else {
                          setDistrictMode("preset");
                          set("district", val);
                        }
                      }}
                    >
                      <option value="North 24 Parganas">North 24 Parganas</option>
                      <option value="South 24 Parganas">South 24 Parganas</option>
                      <option value="Other">Other (Custom Entry)</option>
                    </select>

                    {(districtMode === "custom" || (form.district && form.district !== "North 24 Parganas" && form.district !== "South 24 Parganas")) && (
                      <input
                        type="text"
                        className="form-input bg-blue-50/40 border-blue-200 animate-fade-in"
                        placeholder="Type district name here..."
                        value={form.district}
                        onChange={e => set("district", e.target.value.toUpperCase())}
                        autoFocus
                      />
                    )}
                  </div>
                </Field>
              </div>
              <Field label="State">
                <Sel k="state" form={form} set={set} options={STATES} />
              </Field>
            </Grid>
          </div>
        </div>

        {/* ═══════ SECTION 4: Nomination ═══════ */}
        <div className="sk-card p-5">
          <SectionHeader title="4. Nomination Details" />
          <Grid cols={2}>
            <Field label="SB Account No. (Nominee's)">
              <Inp k="sbAccountNo" form={form} set={set} placeholder="Savings account number" mono />
            </Field>
            <Field label="Name of Nominee">
              <Inp k="nomineeName" form={form} set={set} placeholder="Nominee's full name" uppercase />
            </Field>
            <Field label="Relationship with Nominee">
              <Sel k="nomineeRelationship" form={form} set={set} options={NOMINEE_RELATIONSHIPS} />
            </Field>
            <Field label="Nominee Age">
              <Inp k="nomineeAge" form={form} set={set} type="number" placeholder="Age" />
            </Field>
            <Field label="Nominee DOB (if Minor)" hint="Required if nominee is under 18">
              <Inp k="nomineeDob" form={form} set={set} placeholder="DD/MM/YYYY" mono />
            </Field>
            <Field label="Guardian Name (if Nominee is Minor)">
              <Inp k="guardianName" form={form} set={set} placeholder="Guardian's full name" uppercase />
            </Field>
          </Grid>
        </div>

        {/* ═══════ SECTION 5: Introducer ═══════ */}
        <div className="sk-card p-5">
          <SectionHeader title="5. Introducer Details" />
          <Grid cols={2}>
            <Field label="Name of Introducing Person">
              <Inp k="introducerName" form={form} set={set} placeholder="Introducer's full name" uppercase />
            </Field>
            <Field label="Introducer Account No.">
              <Inp k="introducerAccountNo" form={form} set={set} placeholder="Account number" mono />
            </Field>
            <Field label="Introducer Branch">
              <Inp k="introducerBranch" form={form} set={set} placeholder="Branch name" />
            </Field>
            <Field label="Known for (Years)">
              <Inp k="introducerYears" form={form} set={set} type="number" placeholder="No. of years" />
            </Field>
          </Grid>
        </div>

        {/* ═══════ SECTION 6: Customer Profile Sheet (CPS) ═══════ */}
        <div className="sk-card p-5 border-l-4 border-l-blue-500">
          <SectionHeader
            title="6. Customer Profile Sheet (CPS)"
            subtitle="Annexure 1 — Required for KYC & Risk Classification"
          />
          <Grid cols={2}>
            <Field label="Sol ID">
              <Inp k="solId" form={form} set={set} placeholder="SOL001" mono />
            </Field>
            <Field label="Zone">
              <Inp k="zone" form={form} set={set} placeholder="e.g. South Zone" />
            </Field>
            <Field label="Education Level">
              <Sel k="educationLevel" form={form} set={set} options={EDUCATION_LEVELS} />
            </Field>
            <Field label="Occupation Type">
              <Sel k="occupationType" form={form} set={set} options={OCCUPATION_TYPES} />
            </Field>
            <Field label="Annual Income Tier">
              <Sel k="annualIncomeTier" form={form} set={set} options={ANNUAL_INCOME_TIERS} />
            </Field>
            <Field label="Risk Category">
              <Sel k="riskCategory" form={form} set={set} options={["Low", "Medium", "High"]} />
            </Field>
            <Field label="Turnover Type">
              <Sel k="turnoverType" form={form} set={set} options={["Actual", "Estimated"]} />
            </Field>
            <Field label="Turnover Amount (₹)">
              <Inp k="turnoverAmount" form={form} set={set} type="number" placeholder="e.g. 50000" />
            </Field>
            <Field label="Politically Prominent Person?">
              <Sel k="politicallyProminent" form={form} set={set} options={["No", "Yes"]} />
            </Field>
          </Grid>
        </div>

        {/* ═══════ SECTION 7: Scheme Enrollments ═══════ */}
        <div className="sk-card p-5">
          <SectionHeader
            title="7. Social Security Scheme Enrollments"
            subtitle="Check the boxes below to enroll the customer in government schemes"
          />

          <div className="space-y-4">

            {/* PMJJBY */}
            <div>
              <SchemeToggle
                checked={enrollPMJJBY} onChange={setEnrollPMJJBY}
                label="Enroll for PMJJBY — Pradhan Mantri Jeevan Jyoti Bima Yojana"
                color="bg-blue-600"
              />
              {enrollPMJJBY && (
                <div className="mt-3 ml-0 p-4 border border-blue-200 rounded-xl bg-blue-50/50 space-y-4 animate-fade-in text-slate-800">
                  <div className="flex items-center gap-2 text-blue-800 text-xs font-bold bg-blue-100/60 p-2 rounded-lg">
                    <Info size={13} /> Life Insurance — ₹2 Lakh cover (Death) · Renewed annually on 31st May
                  </div>

                  {/* Auto-inherited read-only fields */}
                  <div className="bg-white p-3 rounded-lg border border-blue-100 text-xs space-y-1.5 shadow-sm">
                    <div className="font-semibold text-blue-800 border-b border-blue-50 pb-1 mb-1.5 uppercase tracking-wider text-[10px]">Inherited Applicant Details</div>
                    <div className="grid grid-cols-2 gap-2 text-slate-600">
                      <div><strong>Subscriber Name:</strong> {form.name || "—"}</div>
                      <div><strong>Account Number:</strong> {fullAccountNo}</div>
                      <div><strong>Date of Birth:</strong> {form.dob || "—"}</div>
                      <div><strong>Mobile Number:</strong> {form.mobile || "—"}</div>
                      <div className="col-span-2"><strong>Address:</strong> {form.address || "—"} {form.village ? `(Village: ${form.village})` : ""}</div>
                    </div>
                  </div>

                  <Grid cols={2}>
                    <Field label="Premium Tier">
                      <Sel k="pmjjbyPremiumTier" form={form} set={set} options={PMJJBY_PREMIUM_TIERS} />
                    </Field>
                    <Field label="Aadhar Auto-Debit Consent">
                      <Sel k="pmjjbyAadharConsent" form={form} set={set} options={["Yes", "No"]} />
                    </Field>
                    <Field label="Disability (Y/N)">
                      <Sel k="pmjjbyDisability" form={form} set={set} options={["No", "Yes"]} />
                    </Field>
                    {form.pmjjbyDisability === "Yes" && (
                      <Field label="Disability Details">
                        <Inp k="pmjjbyDisabilityDetails" form={form} set={set} placeholder="Nature of disability" />
                      </Field>
                    )}
                    <Field label="KYC Document Type">
                      <Sel k="pmjjbyKycType" form={form} set={set} options={KYC_DOC_TYPES} />
                    </Field>
                    <Field label="KYC Document ID No.">
                      <Inp k="pmjjbyKycId" form={form} set={set} placeholder="Document ID number" mono />
                    </Field>
                  </Grid>

                  {/* Nominee Details Section */}
                  <div className="border-t border-blue-100 pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wide">PMJJBY Nominee Details</h4>
                      <button
                        type="button"
                        onClick={() => {
                          set("pmjjbyNomineeName", form.nomineeName);
                          set("pmjjbyNomineeRelationship", form.nomineeRelationship);
                          set("pmjjbyNomineeDob", form.nomineeDob);
                          set("pmjjbyNomineeAge", form.nomineeAge);
                          set("pmjjbyGuardianName", form.guardianName);
                        }}
                        className="text-[10px] text-blue-600 hover:text-blue-800 font-bold bg-blue-100 hover:bg-blue-200/80 px-2 py-0.5 rounded transition-all"
                      >
                        Autofill from Primary Nominee
                      </button>
                    </div>

                    <Grid cols={3}>
                      <Field label="Nominee Name" error={errors.pmjjbyNomineeName} required>
                        <Inp k="pmjjbyNomineeName" form={form} set={set} placeholder="Nominee full name" uppercase />
                      </Field>
                      <Field label="Nominee Relationship" error={errors.pmjjbyNomineeRelationship} required>
                        <Sel k="pmjjbyNomineeRelationship" form={form} set={set} options={NOMINEE_RELATIONSHIPS} />
                      </Field>
                      <Field label="Nominee DOB / Age">
                        <Inp k="pmjjbyNomineeDob" form={form} set={set} placeholder="DD/MM/YYYY or Age" mono />
                      </Field>
                    </Grid>

                    {/* Guardian for minor nominee */}
                    {checkIsMinor(form.pmjjbyNomineeDob || form.pmjjbyNomineeAge) && (
                      <div className="mt-3 p-3 bg-white rounded-lg border border-blue-100 space-y-3">
                        <h5 className="text-[11px] font-bold text-blue-800 uppercase">Guardian Details (Nominee is Minor)</h5>
                        <Grid cols={2}>
                          <Field label="Guardian Name" error={errors.pmjjbyGuardianName} required>
                            <Inp k="pmjjbyGuardianName" form={form} set={set} placeholder="Guardian full name" uppercase />
                          </Field>
                          <Field label="Guardian Relationship" required>
                            <Inp k="pmjjbyGuardianRelationship" form={form} set={set} placeholder="e.g. Father, Uncle" />
                          </Field>
                          <Field label="Guardian Address">
                            <Inp k="pmjjbyGuardianAddress" form={form} set={set} placeholder="Guardian full address" />
                          </Field>
                          <Field label="Guardian Mobile">
                            <Inp k="pmjjbyGuardianMobile" form={form} set={set} placeholder="10-digit mobile" mono />
                          </Field>
                        </Grid>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* PMSBY */}
            <div>
              <SchemeToggle
                checked={enrollPMSBY} onChange={setEnrollPMSBY}
                label="Enroll for PMSBY — Pradhan Mantri Suraksha Bima Yojana"
                color="bg-violet-600"
              />
              {enrollPMSBY && (
                <div className="mt-3 p-4 border border-violet-200 rounded-xl bg-violet-50/50 space-y-4 animate-fade-in text-slate-800">
                  <div className="flex items-center gap-2 text-violet-800 text-xs font-bold bg-violet-100/60 p-2 rounded-lg">
                    <Info size={13} /> Accident Insurance — ₹2 Lakh cover · Annual Premium: ₹20 (auto-selected)
                  </div>

                  {/* Auto-inherited read-only fields */}
                  <div className="bg-white p-3 rounded-lg border border-violet-100 text-xs space-y-1.5 shadow-sm">
                    <div className="font-semibold text-violet-800 border-b border-violet-50 pb-1 mb-1.5 uppercase tracking-wider text-[10px]">Inherited Applicant Details</div>
                    <div className="grid grid-cols-2 gap-2 text-slate-600">
                      <div><strong>Subscriber Name:</strong> {form.name || "—"}</div>
                      <div><strong>Account Number:</strong> {fullAccountNo}</div>
                      <div><strong>Date of Birth:</strong> {form.dob || "—"}</div>
                      <div><strong>Mobile Number:</strong> {form.mobile || "—"}</div>
                      <div className="col-span-2"><strong>Address:</strong> {form.address || "—"} {form.village ? `(Village: ${form.village})` : ""}</div>
                    </div>
                  </div>

                  <Grid cols={2}>
                    <Field label="Aadhar Auto-Debit Consent">
                      <Sel k="pmsbyAadharConsent" form={form} set={set} options={["Yes", "No"]} />
                    </Field>
                    <Field label="Disability (Y/N)">
                      <Sel k="pmsbyDisability" form={form} set={set} options={["No", "Yes"]} />
                    </Field>
                    {form.pmsbyDisability === "Yes" && (
                      <Field label="Disability Details">
                        <Inp k="pmsbyDisabilityDetails" form={form} set={set} placeholder="Nature of disability" />
                      </Field>
                    )}
                    <Field label="KYC Document Type">
                      <Sel k="pmsbyKycType" form={form} set={set} options={KYC_DOC_TYPES} />
                    </Field>
                    <Field label="KYC Document ID No.">
                      <Inp k="pmsbyKycId" form={form} set={set} placeholder="Document ID number" mono />
                    </Field>
                  </Grid>

                  {/* Nominee Details Section */}
                  <div className="border-t border-violet-100 pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold text-violet-900 uppercase tracking-wide">PMSBY Nominee Details</h4>
                      <button
                        type="button"
                        onClick={() => {
                          set("pmsbyNomineeName", form.nomineeName);
                          set("pmsbyNomineeRelationship", form.nomineeRelationship);
                          set("pmsbyNomineeDob", form.nomineeDob);
                          set("pmsbyNomineeAge", form.nomineeAge);
                          set("pmsbyGuardianName", form.guardianName);
                        }}
                        className="text-[10px] text-violet-600 hover:text-violet-800 font-bold bg-violet-100 hover:bg-violet-200/80 px-2 py-0.5 rounded transition-all"
                      >
                        Autofill from Primary Nominee
                      </button>
                    </div>

                    <Grid cols={3}>
                      <Field label="Nominee Name" error={errors.pmsbyNomineeName} required>
                        <Inp k="pmsbyNomineeName" form={form} set={set} placeholder="Nominee full name" uppercase />
                      </Field>
                      <Field label="Nominee Relationship" error={errors.pmsbyNomineeRelationship} required>
                        <Sel k="pmsbyNomineeRelationship" form={form} set={set} options={NOMINEE_RELATIONSHIPS} />
                      </Field>
                      <Field label="Nominee DOB / Age">
                        <Inp k="pmsbyNomineeDob" form={form} set={set} placeholder="DD/MM/YYYY or Age" mono />
                      </Field>
                    </Grid>

                    {/* Guardian for minor nominee */}
                    {checkIsMinor(form.pmsbyNomineeDob || form.pmsbyNomineeAge) && (
                      <div className="mt-3 p-3 bg-white rounded-lg border border-violet-100 space-y-3">
                        <h5 className="text-[11px] font-bold text-violet-800 uppercase">Guardian Details (Nominee is Minor)</h5>
                        <Grid cols={2}>
                          <Field label="Guardian Name" error={errors.pmsbyGuardianName} required>
                            <Inp k="pmsbyGuardianName" form={form} set={set} placeholder="Guardian full name" uppercase />
                          </Field>
                          <Field label="Guardian Relationship" required>
                            <Inp k="pmsbyGuardianRelationship" form={form} set={set} placeholder="e.g. Father, Uncle" />
                          </Field>
                          <Field label="Guardian Address">
                            <Inp k="pmsbyGuardianAddress" form={form} set={set} placeholder="Guardian full address" />
                          </Field>
                          <Field label="Guardian Mobile">
                            <Inp k="pmsbyGuardianMobile" form={form} set={set} placeholder="10-digit mobile" mono />
                          </Field>
                        </Grid>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* APY */}
            <div>
              <SchemeToggle
                checked={enrollAPY} onChange={setEnrollAPY}
                label="Enroll for APY — Atal Pension Yojana"
                color="bg-emerald-600"
              />
              {enrollAPY && (
                <div className="mt-3 p-4 border border-emerald-200 rounded-xl bg-emerald-50/50 space-y-4 animate-fade-in text-slate-800">
                  <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold bg-emerald-100/60 p-2 rounded-lg">
                    <Info size={13} /> National Pension Scheme — Guaranteed pension post retirement (18–40 years age group)
                  </div>

                  {/* Auto-inherited read-only fields */}
                  <div className="bg-white p-3 rounded-lg border border-emerald-100 text-xs space-y-1.5 shadow-sm">
                    <div className="font-semibold text-emerald-800 border-b border-emerald-50 pb-1 mb-1.5 uppercase tracking-wider text-[10px]">Inherited Applicant Details</div>
                    <div className="grid grid-cols-2 gap-2 text-slate-600">
                      <div><strong>Subscriber Name:</strong> {form.name || "—"}</div>
                      <div><strong>Account Number:</strong> {fullAccountNo}</div>
                      <div><strong>Date of Birth:</strong> {form.dob || "—"}</div>
                      <div><strong>Mobile Number:</strong> {form.mobile || "—"}</div>
                      <div className="col-span-2"><strong>Address:</strong> {form.address || "—"} {form.village ? `(Village: ${form.village})` : ""}</div>
                    </div>
                  </div>

                  <Grid cols={2}>
                    <Field label="Marital Status">
                      <Sel k="apyMaritalStatus" form={form} set={set} options={["Single", "Married", "Widowed", "Divorced"]} />
                    </Field>
                    <Field label="Auto-Debit Contribution Consent">
                      <Sel k="apyAutodebitConsent" form={form} set={set} options={["Yes", "No"]} />
                    </Field>
                  </Grid>

                  {form.apyMaritalStatus === "Married" && (
                    <div className="p-3 bg-white rounded-lg border border-emerald-100 space-y-3">
                      <h4 className="text-xs font-bold text-emerald-900 uppercase">Spouse Details (Mandatory)</h4>
                      <Grid cols={3}>
                        <Field label="Spouse Name" error={errors.apySpouseName} required>
                          <Inp k="apySpouseName" form={form} set={set} placeholder="Spouse's full name" uppercase />
                        </Field>
                        <Field label="Spouse Date of Birth" error={errors.apySpouseDob} required>
                          <Inp k="apySpouseDob" form={form} set={set} placeholder="DD/MM/YYYY" mono />
                        </Field>
                        <Field label="Spouse Aadhar Number">
                          <Inp k="apySpouseAadhar" form={form} set={set} placeholder="12-digit Aadhar" mono maxLength={12} />
                        </Field>
                      </Grid>
                    </div>
                  )}

                  {/* Nominee Details Section */}
                  <div className="border-t border-emerald-100 pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wide">APY Nominee Details</h4>
                      <button
                        type="button"
                        onClick={() => {
                          set("apyNomineeName", form.nomineeName);
                          set("apyNomineeRelationship", form.nomineeRelationship);
                          set("apyNomineeDob", form.nomineeDob);
                          set("apyNomineeAge", form.nomineeAge);
                          set("apyGuardianName", form.guardianName);
                        }}
                        className="text-[10px] text-emerald-600 hover:text-emerald-800 font-bold bg-emerald-100 hover:bg-emerald-200/80 px-2 py-0.5 rounded transition-all"
                      >
                        Autofill from Primary Nominee
                      </button>
                    </div>

                    <Grid cols={3}>
                      <Field label="Nominee Name" error={errors.apyNomineeName} required>
                        <Inp k="apyNomineeName" form={form} set={set} placeholder="Nominee full name" uppercase />
                      </Field>
                      <Field label="Nominee Relationship" error={errors.apyNomineeRelationship} required>
                        <Sel k="apyNomineeRelationship" form={form} set={set} options={NOMINEE_RELATIONSHIPS} />
                      </Field>
                      <Field label="Nominee DOB / Age">
                        <Inp k="apyNomineeDob" form={form} set={set} placeholder="DD/MM/YYYY or Age" mono />
                      </Field>
                    </Grid>
                    
                    <div className="mt-3">
                      <Grid cols={2}>
                        <Field label="Nominee Aadhar Number">
                          <Inp k="apyNomineeAadhar" form={form} set={set} placeholder="12-digit Aadhar" mono maxLength={12} />
                        </Field>
                      </Grid>
                    </div>

                    {/* Guardian for minor nominee */}
                    {checkIsMinor(form.apyNomineeDob || form.apyNomineeAge) && (
                      <div className="mt-3 p-3 bg-white rounded-lg border border-emerald-100 space-y-3">
                        <h5 className="text-[11px] font-bold text-emerald-800 uppercase">Guardian Details (Nominee is Minor)</h5>
                        <Grid cols={3}>
                          <Field label="Guardian Name" error={errors.apyGuardianName} required>
                            <Inp k="apyGuardianName" form={form} set={set} placeholder="Guardian full name" uppercase />
                          </Field>
                          <Field label="Guardian Relationship" required>
                            <Inp k="apyGuardianRelationship" form={form} set={set} placeholder="e.g. Father, Mother" />
                          </Field>
                          <Field label="Guardian Mobile">
                            <Inp k="apyGuardianMobile" form={form} set={set} placeholder="10-digit mobile" mono />
                          </Field>
                        </Grid>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-emerald-100 pt-3">
                    <h4 className="text-xs font-bold text-emerald-900 uppercase mb-2">Pension Details</h4>
                    <Grid cols={4}>
                      <Field label="Pension Amount Slab">
                        <Sel k="apyPensionSlab" form={form} set={set} options={APY_PENSION_SLABS} />
                      </Field>
                      <Field label="Contribution Frequency">
                        <Sel k="apyContributionFreq" form={form} set={set} options={["Monthly", "Quarterly", "Half-Yearly"]} />
                      </Field>
                      <Field label="Tax Payer?">
                        <Sel k="apyTaxPayer" form={form} set={set} options={["No", "Yes"]} />
                      </Field>
                      <Field label="Social Security Beneficiary?">
                        <Sel k="apySocialSecurity" form={form} set={set} options={["No", "Yes"]} />
                      </Field>
                    </Grid>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ═══════ Summary & Submit ═══════ */}
        <div className="sk-card p-5 border-2 border-emerald-200 bg-emerald-50/30">
          <SectionHeader title="8. Review & Submit" subtitle="Verify details before saving" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 text-sm mb-5">
            {[
              ["Name", form.name || "—"],
              ["Father", form.fatherName || "—"],
              ["Mobile", form.mobile || "—"],
              ["DOB", form.dob || "—"],
              ["Category", form.category],
              ["Account", fullAccountNo],
              ["Village", form.village || "—"],
              ["District", form.district || "—"],
              ["PMJJBY", enrollPMJJBY ? "Enrolled ✓" : "No"],
              ["PMSBY", enrollPMSBY ? "Enrolled ✓" : "No"],
              ["APY", enrollAPY ? "Enrolled ✓" : "No"],
              ["Ref No.", form.refNumber],
            ].map(([label, value]) => (
              <div key={label}>
                <span className="text-xs text-slate-500 font-semibold uppercase">{label}: </span>
                <span className="text-slate-800 font-medium text-xs">{value}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => navigate("/customers")}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 rounded-xl transition-all shadow-md hover:shadow-emerald-500/25"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <Save size={16} />
              )}
              {submitting ? "Saving..." : "Save & Print Documents"}
            </button>
          </div>
        </div>
      </form>

      {printCustomer && (
        <PrintModal
          customer={printCustomer}
          onClose={() => { setPrintCustomer(null); navigate("/customers"); }}
        />
      )}
    </div>
  );
}
