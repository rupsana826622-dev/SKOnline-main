import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Printer, Download, Settings as SettingsIcon, CheckSquare, Square,
  UserCheck, ShieldCheck, FileText, Sparkles, RefreshCw, Eye, Edit3, ZoomIn, ZoomOut,
} from "lucide-react";
import { getCustomers, getSettings } from "@/lib/storage";
import type { Customer } from "@/types";
import { FinancialInclusionForm } from "@/components/pdf/FinancialInclusionForm";
import { CustomerProfileSheetForm } from "@/components/pdf/CustomerProfileSheetForm";
import { PMJJBYForm } from "@/components/pdf/PMJJBYForm";
import { PMSBYForm } from "@/components/pdf/PMSBYForm";
import { APYForm } from "@/components/pdf/APYForm";
import { downloadCombinedFormsPdf, printForms } from "@/lib/pdfGenerator";
import { toast } from "sonner";
import SEO from "@/components/common/SEO";

export default function PdfGeneratorPage() {
  const [searchParams] = useSearchParams();
  const initialCustomerId = searchParams.get("customerId");
  const customers = getCustomers();
  const settings = getSettings();

  const selectedInitialCustomer = customers.find(c => c.id === initialCustomerId) || customers[0] || {};

  // Active Customer State
  const [customer, setCustomer] = useState<Partial<Customer>>({
    name: "Rupsana Begum",
    fatherName: "Sk Abdul",
    motherName: "Fatima Bibi",
    spouseName: "Sk Rahman",
    sex: "Female",
    age: 28,
    dob: "12-05-1998",
    profession: "Tailoring / Self-Employed",
    category: "OBC",
    address: "House No 42, Main Road",
    village: "Rampur",
    mandal: "Gudur",
    district: "Nellore",
    state: "Andhra Pradesh",
    annualIncome: "45,000",
    annualIncomeTier: "25,000 to 50,000",
    panGir: "ABCDE1234F",
    mobile: "9876543210",
    email: "rupsana@gmail.com",
    accountNumber: `${settings.accountPrefix}984210`,
    branchCode: settings.branchCode,
    customerId: "CIF00984210",
    sbAccountNo: `${settings.accountPrefix}984210`,
    nomineeName: "Sk Rahman",
    nomineeRelationship: "Husband",
    nomineeAge: "32",
    nomineeDob: "10-08-1994",
    guardianName: "",
    introducerName: "Sk Mehmood",
    introducerAccountNo: `${settings.accountPrefix}110293`,
    introducerBranch: settings.cspBranchName,
    introducerYears: "5",
    solId: settings.solId,
    zone: settings.zone,
    educationLevel: "Secondary (9–10)",
    occupationType: "Self-Employed / Professional",
    politicallyProminent: "No",
    turnoverType: "Estimated",
    turnoverAmount: "0.80",
    riskCategory: "Low",
    pmjjbyDisability: "No",
    pmjjbyKycType: "Aadhaar Card",
    pmjjbyKycId: "987654321098",
    pmjjbyNomineeName: "Sk Rahman",
    pmjjbyNomineeRelationship: "Husband",
    pmsbyDisability: "No",
    pmsbyKycType: "Aadhaar Card",
    pmsbyKycId: "987654321098",
    pmsbyNomineeName: "Sk Rahman",
    pmsbyNomineeRelationship: "Husband",
    apyMaritalStatus: "Married",
    apySpouseName: "Sk Rahman",
    apyPensionSlab: "₹2,000",
    apyContributionFreq: "Monthly",
    apyNomineeName: "Sk Rahman",
    ...selectedInitialCustomer,
  });

  // Optional Form Selection Toggles
  const [enrollPMJJBY, setEnrollPMJJBY] = useState(customer.enrollPMJJBY ?? true);
  const [enrollPMSBY, setEnrollPMSBY] = useState(customer.enrollPMSBY ?? true);
  const [enrollAPY, setEnrollAPY] = useState(customer.enrollAPY ?? true);

  // UI States
  const [generating, setGenerating] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(85);
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("preview");

  const handleSelectCustomerChange = (id: string) => {
    const found = customers.find(c => c.id === id);
    if (found) {
      setCustomer(found);
      setEnrollPMJJBY(found.enrollPMJJBY ?? true);
      setEnrollPMSBY(found.enrollPMSBY ?? true);
      setEnrollAPY(found.enrollAPY ?? true);
      toast.success(`Loaded customer: ${found.name}`);
    }
  };

  const handleFieldChange = (field: keyof Customer, value: unknown) => {
    setCustomer(prev => ({ ...prev, [field]: value }));
  };

  // Compile active form element IDs
  const getActiveElementIds = () => {
    const ids = ["pdf-form-fi", "pdf-form-cps"];
    if (enrollPMJJBY) ids.push("pdf-form-pmjjby");
    if (enrollPMSBY) ids.push("pdf-form-pmsby");
    if (enrollAPY) ids.push("pdf-form-apy");
    return ids;
  };

  const handleDownloadPdf = async () => {
    setGenerating(true);
    toast.info("Rendering high-resolution A4 PDF forms...");
    try {
      const ids = getActiveElementIds();
      const filename = `${(customer.name || "Customer").replace(/\s+/g, "_")}_A4_Account_Opening_Forms.pdf`;
      await downloadCombinedFormsPdf(ids, filename);
      toast.success("A4 PDF generated & downloaded successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF document.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <SEO title="Dynamic A4 PDF Form Generator" />

      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
            <FileText size={22} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              Dynamic A4 PDF Form Generator
              <span className="badge badge-blue">Official Bank 1:1</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Generates pixel-perfect A4 account opening forms with dynamic logo injection & preserved signature areas
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab(activeTab === "edit" ? "preview" : "edit")}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            {activeTab === "edit" ? <Eye size={14} /> : <Edit3 size={14} />}
            {activeTab === "edit" ? "Switch to Preview Mode" : "Edit Customer Form"}
          </button>
          <button
            onClick={printForms}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-lg transition-colors shadow-sm"
          >
            <Printer size={15} />
            Print A4 Forms
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={generating}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-all shadow-md"
          >
            {generating ? <RefreshCw size={16} className="animate-spin" /> : <Download size={16} />}
            {generating ? "Generating A4 PDF..." : "Download Combined A4 PDF"}
          </button>
        </div>
      </div>

      {/* Select Existing Customer / Pre-fill Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Customer Select */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <UserCheck size={18} className="text-blue-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Pre-fill From Customer</label>
            <select
              className="w-full text-xs font-medium text-slate-800 bg-slate-50 border border-slate-300 rounded-md p-1.5 mt-0.5 focus:ring-1 focus:ring-blue-500"
              value={customer.id || ""}
              onChange={e => handleSelectCustomerChange(e.target.value)}
            >
              <option value="">-- Manual Form Entry --</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.accountNumber || "No A/c"})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Global Settings Status */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <ShieldCheck size={18} className="text-emerald-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Global Pre-fill Status</label>
            <div className="text-xs font-bold text-slate-800 truncate">
              {settings.bankName} ({settings.branchCode})
            </div>
            <div className="text-[11px] text-slate-500 truncate">
              IFSC: {settings.ifscCode} | SOL: {settings.solId}
            </div>
          </div>
        </div>

        {/* Form Selection Counter */}
        <div className="bg-gradient-to-r from-blue-900 to-slate-900 text-white p-3.5 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-blue-200">PDF Output Target</div>
            <div className="text-base font-extrabold flex items-center gap-1.5 mt-0.5">
              <span>{getActiveElementIds().length} A4 Pages</span>
              <span className="text-xs font-normal text-slate-300">Bundle</span>
            </div>
          </div>
          <div className="text-right text-[11px] text-slate-300">
            <div>2 Mandatory</div>
            <div>{getActiveElementIds().length - 2} Optional</div>
          </div>
        </div>
      </div>

      {/* Form Categorization & Trigger Logic Panel */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <h2 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <Sparkles size={14} className="text-amber-500" />
          1. Form Categorization & Trigger Logic (Select Included Forms)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Mandatory Forms */}
          <div className="border border-blue-200 bg-blue-50/50 p-3 rounded-lg space-y-2">
            <div className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
              <CheckSquare size={15} className="text-blue-600" />
              Mandatory Forms (Always Included):
            </div>
            <ul className="text-xs space-y-1 font-semibold text-slate-700 pl-6 list-disc">
              <li>Financial Inclusion (Application for Basic SB No Frill Account)</li>
              <li>Customer Profile Sheet (CPS for Individuals)</li>
            </ul>
          </div>

          {/* Optional Forms Checkboxes */}
          <div className="border border-amber-200 bg-amber-50/30 p-3 rounded-lg space-y-2">
            <div className="text-xs font-bold text-amber-900">
              Optional Insurance & Pension Schemes (Check to Include):
            </div>
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enrollPMJJBY}
                  onChange={e => setEnrollPMJJBY(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span>Pradhan Mantri Jeevan Jyoti Bima Yojana (PMJJBY - Rs. 436/yr)</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enrollPMSBY}
                  onChange={e => setEnrollPMSBY(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span>Pradhan Mantri Suraksha Bima Yojana (PMSBY - Rs. 20/yr)</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enrollAPY}
                  onChange={e => setEnrollAPY(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span>Atal Pension Yojana (APY Subscriber Form)</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Main Form Fields Editor (Conditional based on active tab) */}
      {activeTab === "edit" && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2">
            Customer Information Form Data (Pre-filling PDF Engine)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="form-label">Customer Name</label>
              <input
                type="text"
                className="form-input font-bold"
                value={customer.name || ""}
                onChange={e => handleFieldChange("name", e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Father's Name</label>
              <input
                type="text"
                className="form-input"
                value={customer.fatherName || ""}
                onChange={e => handleFieldChange("fatherName", e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Mother's Name</label>
              <input
                type="text"
                className="form-input"
                value={customer.motherName || ""}
                onChange={e => handleFieldChange("motherName", e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Account Number</label>
              <input
                type="text"
                className="form-input font-mono font-bold"
                value={customer.accountNumber || ""}
                onChange={e => handleFieldChange("accountNumber", e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Customer ID (CIF)</label>
              <input
                type="text"
                className="form-input font-mono"
                value={customer.customerId || ""}
                onChange={e => handleFieldChange("customerId", e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Mobile Number</label>
              <input
                type="text"
                className="form-input font-mono"
                value={customer.mobile || ""}
                onChange={e => handleFieldChange("mobile", e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Address</label>
              <input
                type="text"
                className="form-input"
                value={customer.address || ""}
                onChange={e => handleFieldChange("address", e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Village / Town</label>
              <input
                type="text"
                className="form-input"
                value={customer.village || ""}
                onChange={e => handleFieldChange("village", e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">District & State</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="form-input"
                  placeholder="District"
                  value={customer.district || ""}
                  onChange={e => handleFieldChange("district", e.target.value)}
                />
                <input
                  type="text"
                  className="form-input"
                  placeholder="State"
                  value={customer.state || ""}
                  onChange={e => handleFieldChange("state", e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Side-by-Side Zoom & Printable Canvas Area */}
      <div className="bg-slate-800 p-4 rounded-xl shadow-lg border border-slate-700 space-y-4">
        {/* Zoom & View Controls */}
        <div className="flex items-center justify-between text-white flex-wrap gap-2">
          <div className="text-xs font-bold flex items-center gap-2">
            <Printer size={15} className="text-amber-400" />
            <span>Live A4 Printable Document Preview</span>
            <span className="text-slate-400">({getActiveElementIds().length} Pages Rendered)</span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setZoomLevel(z => Math.max(z - 10, 50))}
              className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded transition-colors"
              title="Zoom Out"
            >
              <ZoomOut size={14} />
            </button>
            <span className="font-mono w-12 text-center font-bold">{zoomLevel}%</span>
            <button
              onClick={() => setZoomLevel(z => Math.min(z + 10, 150))}
              className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded transition-colors"
              title="Zoom In"
            >
              <ZoomIn size={14} />
            </button>
          </div>
        </div>

        {/* Scaled Printable Pages */}
        <div className="overflow-auto max-h-[850px] p-6 bg-slate-900/80 rounded-lg custom-scroll flex flex-col items-center gap-8">
          <div
            style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: "top center" }}
            className="transition-transform duration-200 space-y-8"
          >
            {/* 1. Mandatory Form 1: Financial Inclusion */}
            <FinancialInclusionForm customer={customer} settings={settings} />

            {/* 2. Mandatory Form 2: Customer Profile Sheet */}
            <CustomerProfileSheetForm customer={customer} settings={settings} />

            {/* 3. Optional Form 3: PMJJBY */}
            {enrollPMJJBY && <PMJJBYForm customer={customer} settings={settings} />}

            {/* 4. Optional Form 4: PMSBY */}
            {enrollPMSBY && <PMSBYForm customer={customer} settings={settings} />}

            {/* 5. Optional Form 5: APY */}
            {enrollAPY && <APYForm customer={customer} settings={settings} />}
          </div>
        </div>
      </div>
    </div>
  );
}
