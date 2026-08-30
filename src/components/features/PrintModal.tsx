import { useState } from "react";
import { X, Printer, FileText, Receipt, FileCheck, Download, RefreshCw } from "lucide-react";
import type { Customer } from "@/types";
import { getSettings } from "@/lib/storage";
import AckSlipPrint from "./AckSlipPrint";

// Import pixel-perfect 1:1 templates for high-DPI PDF generation & printing
import { FinancialInclusionForm } from "@/components/pdf/FinancialInclusionForm";
import { CustomerProfileSheetForm } from "@/components/pdf/CustomerProfileSheetForm";
import { CKYCDownloadConsentForm } from "@/components/pdf/CKYCDownloadConsentForm";
import { OpeningConsentForm } from "@/components/pdf/OpeningConsentForm";
import { PMJJBYForm } from "@/components/pdf/PMJJBYForm";
import { PMSBYForm } from "@/components/pdf/PMSBYForm";
import { APYForm } from "@/components/pdf/APYForm";

// Import separated PDF generator & print stream functions
import { printElement1to1, downloadCombinedFormsPdf, downloadSingleFormPdf } from "@/lib/pdfGenerator";
import { toast } from "sonner";

interface PrintModalProps {
  customer: Customer;
  onClose: () => void;
}

export default function PrintModal({ customer, onClose }: PrintModalProps) {
  const settings = getSettings();
  const [generatingAOf, setGeneratingAOf] = useState(false);
  const [generatingReceipt, setGeneratingReceipt] = useState(false);

  const schemeCount = [customer.enrollPMJJBY, customer.enrollPMSBY, customer.enrollAPY].filter(Boolean).length;
  const totalPages = 4 + schemeCount;

  // Clean customer file names
  const safeCustomerName = (customer.name || "Customer").trim().replace(/[^a-zA-Z0-9_-]/g, "_");
  const safeAccountNo = (customer.accountNumber || "Account").trim().replace(/[^a-zA-Z0-9_-]/g, "_");
  const bundleFileName = `${safeCustomerName}_${safeAccountNo}_Bank_Forms.pdf`;
  const receiptFileName = `${safeCustomerName}_${safeAccountNo}_Receipt.pdf`;

  // 1. Direct PDF File Download for Multi-page A4 Bundle (No Browser Print Dialog)
  const handleDownloadA4Bundle = async () => {
    setGeneratingAOf(true);
    toast.info("Generating Official Bank A4 forms bundle PDF...");
    try {
      await downloadCombinedFormsPdf(["bank-forms-bundle"], bundleFileName);
      toast.success("A4 Forms Bundle PDF downloaded successfully!");
    } catch (err: any) {
      console.error("PDF generation error:", err);
      toast.error(`Failed to generate A4 PDF bundle: ${err?.message || "Render error"}`);
    } finally {
      setGeneratingAOf(false);
    }
  };

  // 2. Direct PDF File Download for Customer A5 Receipt (No Browser Print Dialog)
  const handleDownloadReceipt = async () => {
    setGeneratingReceipt(true);
    toast.info("Generating Customer Receipt PDF...");
    try {
      await downloadSingleFormPdf("ack-slip-print", receiptFileName);
      toast.success("Customer receipt PDF downloaded successfully!");
    } catch (err: any) {
      console.error("Receipt PDF error:", err);
      toast.error(`Failed to generate receipt PDF: ${err?.message || "Render error"}`);
    } finally {
      setGeneratingReceipt(false);
    }
  };

  // 3. Native Browser Print Window for Bank A4 Forms
  const printBankForm = async () => {
    try {
      await printElement1to1("bank-forms-bundle", {
        pageSize: "A4",
        orientation: "portrait",
        margins: "6mm",
        title: bundleFileName.replace(/\.pdf$/i, ""),
      });
    } catch (err: any) {
      console.error("Print stream error:", err);
      toast.error("Could not launch print stream.");
    }
  };

  // 4. Native Browser Print Window for Customer Receipt
  const printAckSlip = async () => {
    try {
      await printElement1to1("ack-slip-print", {
        pageSize: "A5",
        orientation: "portrait",
        margins: "8mm",
        title: receiptFileName.replace(/\.pdf$/i, ""),
      });
    } catch (err: any) {
      console.error("Print stream error:", err);
      toast.error("Could not launch print stream.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden border border-slate-100"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#003366] text-white">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-amber-400" />
            <div>
              <div className="font-extrabold text-sm tracking-wide">Customer Document Center</div>
              <div className="text-[11px] text-blue-200 mt-0.5">{customer.name} · A/C: {customer.accountNumber}</div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Download Official Bank PDF Files</h3>
            <p className="text-xs text-slate-500 mt-1">
              Directly download offline PDF files to your device or use native print below.
            </p>
          </div>

          {/* Scheme status info banner */}
          <div className="p-3.5 bg-blue-50/50 border border-blue-100 rounded-xl flex items-start gap-2.5">
            <FileCheck size={16} className="text-[#0056B3] flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-[#003366]">
                A4 Bundle Target: {totalPages} Pages
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Includes Account Application, Customer Profile Sheet (CPS), CKYC Consent, Opening Consent{[
                  customer.enrollPMJJBY && "PMJJBY",
                  customer.enrollPMSBY && "PMSBY",
                  customer.enrollAPY && "APY"
                ].filter(Boolean).length > 0 && " and conditional social security forms (" + [
                  customer.enrollPMJJBY && "PMJJBY",
                  customer.enrollPMSBY && "PMSBY",
                  customer.enrollAPY && "APY"
                ].filter(Boolean).join(", ") + ")"}.
              </p>
            </div>
          </div>

          {/* Primary Download Buttons (Direct Offline PDF Generation) */}
          <div className="space-y-3">
            {/* Button 1: Download Official Bank A4 Forms (Bundle) */}
            <button
              type="button"
              onClick={handleDownloadA4Bundle}
              disabled={generatingAOf}
              className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 border border-slate-200 hover:border-[#0056B3]/40 rounded-xl shadow-sm hover:shadow transition-all group disabled:opacity-50 cursor-pointer"
            >
              <div className="flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-lg bg-blue-50 group-hover:bg-[#003366]/10 flex items-center justify-center text-[#003366] transition-colors">
                  {generatingAOf ? <RefreshCw className="w-5 h-5 animate-spin text-blue-600" /> : <FileText className="w-5 h-5" />}
                </div>
                <div>
                  <div className="text-xs font-bold text-[#0F172A]">📄 Download Official Bank A4 Forms (Bundle)</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {generatingAOf ? "Rendering 1:1 Vector PDF..." : `Direct .pdf file · 1:1 Layout · ${totalPages} Pages`}
                  </div>
                </div>
              </div>
              <Download className="w-4 h-4 text-slate-400 group-hover:text-[#0056B3] transition-colors" />
            </button>

            {/* Button 2: Download Customer Receipt */}
            <button
              type="button"
              onClick={handleDownloadReceipt}
              disabled={generatingReceipt}
              className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 border border-slate-200 hover:border-emerald-500/40 rounded-xl shadow-sm hover:shadow transition-all group disabled:opacity-50 cursor-pointer"
            >
              <div className="flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 group-hover:bg-emerald-500/10 flex items-center justify-center text-emerald-700 transition-colors">
                  {generatingReceipt ? <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" /> : <Receipt className="w-5 h-5" />}
                </div>
                <div>
                  <div className="text-xs font-bold text-[#0F172A]">🧾 Download Customer Receipt</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {generatingReceipt ? "Rendering Receipt PDF..." : "Direct .pdf file · A5 format acknowledgment slip"}
                  </div>
                </div>
              </div>
              <Download className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
            </button>
          </div>

          {/* Direct Print Options (Native Browser Print Window) */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Direct Print Stream</span>
            <div className="flex items-center gap-2">
              <button 
                type="button"
                onClick={printBankForm}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 hover:text-slate-800 text-[11px] font-semibold transition-colors shadow-sm"
              >
                <Printer size={12} />
                Print A4 Forms
              </button>
              <button 
                type="button"
                onClick={printAckSlip}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 hover:text-slate-800 text-[11px] font-semibold transition-colors shadow-sm"
              >
                <Printer size={12} />
                Print Receipt
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-slate-800 hover:bg-slate-200/50 rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>

      {/* Hidden high-fidelity templates for A4 PDF generator and standard printing */}
      <div
        id="bank-forms-bundle"
        data-print-id="bank-forms-bundle"
        style={{
          position: "fixed",
          left: "-99999px",
          top: "0",
          width: "210mm",
          zIndex: -1,
          opacity: 0,
          pointerEvents: "none",
        }}
      >
        <FinancialInclusionForm customer={customer} settings={settings} />
        <CustomerProfileSheetForm customer={customer} settings={settings} />
        <CKYCDownloadConsentForm customer={customer} settings={settings} />
        <OpeningConsentForm customer={customer} settings={settings} />
        {customer.enrollPMJJBY && <PMJJBYForm customer={customer} settings={settings} />}
        {customer.enrollPMSBY && <PMSBYForm customer={customer} settings={settings} />}
        {customer.enrollAPY && <APYForm customer={customer} settings={settings} />}
      </div>

      {/* Hidden print targets — always in DOM for window.print() & direct PDF download */}
      <div
        style={{
          position: "fixed",
          left: "-99999px",
          top: "0",
          width: "148mm",
          zIndex: -1,
          opacity: 0,
          pointerEvents: "none",
        }}
      >
        <AckSlipPrint customer={customer} settings={settings} />
      </div>
    </div>
  );
}
