/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserPlus, Save, AlertCircle, ChevronDown, ChevronUp,
  CheckSquare, Square, Info,
} from "lucide-react";
import { addCustomer, getSettings } from "@/lib/storage";
import { generateId, generateRefNumber } from "@/lib/utils";
import {
  CATEGORIES, SEX_OPTIONS, STATES, EDUCATION_LEVELS, OCCUPATION_TYPES,
  ANNUAL_INCOME_TIERS, PMJJBY_PREMIUM_TIERS, APY_PENSION_SLABS, KYC_DOC_TYPES,
} from "@/constants";
import PrintModal from "@/components/features/PrintModal";
import type { Customer } from "@/types";
import { toast } from "sonner";

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
  return {
    // Account Identification
    branchCode: settings.branchCode,
    customerId: "",
    accountSuffix: "",
    refNumber: generateRefNumber(settings.refPrefix),
    // Personal
    name: "", fatherName: "", motherName: "", spouseName: "",
    sex: "Male", age: "", dob: "", profession: "", category: "OBC",
    // Address
    address: "", village: "", mandal: "", district: "", state: "Telangana",
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
    // PMSBY
    pmsbyDisability: "No",
    pmsbyDisabilityDetails: "",
    pmsbyKycType: "",
    pmsbyKycId: "",
    // APY
    apyMaritalStatus: "Single",
    apySpouseName: "",
    apySpouseDob: "",
    apyPensionSlab: "₹1,000",
    apyContributionFreq: "Monthly",
    apyTaxPayer: "No",
    apySocialSecurity: "No",
  };
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AddCustomerPage() {
  const navigate = useNavigate();
  const settings = getSettings();
  const [form, setFormState] = useState<Record<string, string>>(defaultForm(settings));
  const [enrollPMJJBY, setEnrollPMJJBY] = useState(false);
  const [enrollPMSBY, setEnrollPMSBY] = useState(false);
  const [enrollAPY, setEnrollAPY] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [printCustomer, setPrintCustomer] = useState<Customer | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const set = (k: string, v: string) => {
    setFormState(f => ({ ...f, [k]: v }));
    setErrors(e => { const n = { ...e }; delete n[k]; return n; });
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
    if (enrollAPY && form.apyMaritalStatus === "Married" && !form.apySpouseName.trim()) {
      errs.apySpouseName = "Spouse name required for married APY subscriber";
    }
    // Guard for APY nominee minor
    if (enrollAPY && form.nomineeDob) {
      const [day, month, year] = form.nomineeDob.split('-').map(Number);
      const dob = new Date(year, month - 1, day);
      const ageDiffMs = Date.now() - dob.getTime();
      const ageDate = new Date(ageDiffMs);
      const age = Math.abs(ageDate.getUTCFullYear() - 1970);
      if (age < 18 && !form.guardianName.trim()) {
        errs.guardianName = "Guardian name required for minor nominee";
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
    await new Promise(r => setTimeout(r, 300));

    const customer: Customer = {
      id: generateId(),
      branchCode: form.branchCode,
      customerId: form.customerId,
      accountNumber: settings.accountPrefix + form.accountSuffix,
      refNumber: form.refNumber,
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
      // PMSBY
      enrollPMSBY,
      pmsbyDisability: enrollPMSBY ? form.pmsbyDisability as "Yes" | "No" : "No",
      pmsbyDisabilityDetails: enrollPMSBY ? form.pmsbyDisabilityDetails : "",
      pmsbyKycType: enrollPMSBY ? form.pmsbyKycType : "",
      pmsbyKycId: enrollPMSBY ? form.pmsbyKycId : "",
      // APY
      enrollAPY,
      apyMaritalStatus: enrollAPY ? form.apyMaritalStatus as Customer["apyMaritalStatus"] : "Single",
      apySpouseName: enrollAPY ? form.apySpouseName : "",
      apySpouseDob: enrollAPY ? form.apySpouseDob : "",
      apyPensionSlab: enrollAPY ? form.apyPensionSlab : "",
      apyContributionFreq: enrollAPY ? form.apyContributionFreq as Customer["apyContributionFreq"] : "Monthly",
      apyTaxPayer: enrollAPY ? form.apyTaxPayer as "Yes" | "No" : "No",
      apySocialSecurity: enrollAPY ? form.apySocialSecurity as "Yes" | "No" : "No",
      // Delivery
      passbookIssued: false, passbookIssuedAt: "",
      passbookReceived: false, passbookReceivedAt: "",
      atmIssued: false, atmIssuedAt: "", atmReceived: false, atmReceivedAt: "",
      createdAt: new Date().toISOString(),
    };

    addCustomer(customer);
    toast.success(`Customer "${customer.name}" registered successfully!`);
    setPrintCustomer(customer);
    setSubmitting(false);
  };

  const fullAccountNo = settings.accountPrefix + (form.accountSuffix || "______");

  return (
    <div className="max-w-4xl mx-auto pb-16">
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
          <div className="mt-4" id="field-accountSuffix">
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
                <Field label="Date of Birth (DD-MM-YYYY)" required error={errors.dob}>
                  <Inp k="dob" form={form} set={set} placeholder="15-08-1990" maxLength={10} mono />
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
                  <Inp k="district" form={form} set={set} placeholder="District name" uppercase />
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
              <Inp k="nomineeRelationship" form={form} set={set} placeholder="e.g. Wife, Son, Father" />
            </Field>
            <Field label="Nominee Age">
              <Inp k="nomineeAge" form={form} set={set} type="number" placeholder="Age" />
            </Field>
            <Field label="Nominee DOB (if Minor)" hint="Required if nominee is under 18">
              <Inp k="nomineeDob" form={form} set={set} placeholder="DD-MM-YYYY" mono />
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
                <div className="mt-3 ml-0 p-4 border border-blue-200 rounded-xl bg-blue-50 space-y-4 animate-fade-in">
                  <div className="flex items-center gap-2 text-blue-800 text-xs font-semibold">
                    <Info size={13} /> Life Insurance — ₹2 Lakh cover (Death)
                  </div>
                  <Grid cols={2}>
                    <Field label="Premium Tier">
                      <Sel k="pmjjbyPremiumTier" form={form} set={set} options={PMJJBY_PREMIUM_TIERS} />
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
                <div className="mt-3 p-4 border border-violet-200 rounded-xl bg-violet-50 space-y-4 animate-fade-in">
                  <div className="flex items-center gap-2 text-violet-800 text-xs font-semibold">
                    <Info size={13} /> Accident Insurance — ₹2 Lakh cover · Annual Premium: ₹20 (auto-selected)
                  </div>
                  <div className="px-3 py-2 bg-violet-100 rounded-lg text-xs text-violet-700 font-mono font-semibold">
                    Annual Premium: ₹20.00 (Fixed)
                  </div>
                  <Grid cols={2}>
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
                <div className="mt-3 p-4 border border-emerald-200 rounded-xl bg-emerald-50 space-y-4 animate-fade-in">
                  <div className="flex items-center gap-2 text-emerald-800 text-xs font-semibold">
                    <Info size={13} /> National Pension Scheme — Guaranteed pension post retirement
                  </div>
                  <Grid cols={2}>
                    <Field label="Marital Status">
                      <Sel k="apyMaritalStatus" form={form} set={set} options={["Single", "Married", "Widowed", "Divorced"]} />
                    </Field>
                    {form.apyMaritalStatus === "Married" && (
                      <>
                        <div id="field-apySpouseName">
                          <Field label="Spouse Name" required error={errors.apySpouseName}>
                            <Inp k="apySpouseName" form={form} set={set} placeholder="Spouse's full name" uppercase />
                          </Field>
                        </div>
                        <Field label="Spouse Date of Birth">
                          <Inp k="apySpouseDob" form={form} set={set} placeholder="DD-MM-YYYY" mono />
                        </Field>
                      </>
                    )}
                    <Field label="Nominee Name">
                      <Inp k="nomineeName" form={form} set={set} placeholder="Nominee's full name" uppercase />
                    </Field>
                    <Field label="Nominee Relationship">
                      <Inp k="nomineeRelationship" form={form} set={set} placeholder="e.g. Wife, Son, Father" />
                    </Field>
                    <Field label="Nominee DOB / Age">
                      <Inp k="nomineeDob" form={form} set={set} placeholder="DD-MM-YYYY" mono />
                    </Field>
                    {/* Guardian for minor nominee */}
                    {form.nomineeDob && (() => {
                      const [day, month, year] = form.nomineeDob.split('-').map(Number);
                      const dob = new Date(year, month - 1, day);
                      const ageDiffMs = Date.now() - dob.getTime();
                      const ageDate = new Date(ageDiffMs);
                      const age = Math.abs(ageDate.getUTCFullYear() - 1970);
                      return age < 18 ? (
                        <Field label="Guardian Name (if Nominee is Minor)" error={errors.guardianName} required>
                          <Inp k="guardianName" form={form} set={set} placeholder="Guardian's full name" uppercase />
                        </Field>
                      ) : null;
                    })()}
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
