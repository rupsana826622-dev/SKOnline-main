import { useState } from "react";
import { X, Printer, FileText, Receipt, FileCheck, Download, RefreshCw } from "lucide-react";
import type { Customer } from "@/types";
import { getSettings } from "@/lib/storage";
import BankFormPrint from "./BankFormPrint";
import AckSlipPrint from "./AckSlipPrint";

// Import pixel-perfect 1:1 templates for high-DPI PDF generation
import { FinancialInclusionForm } from "@/components/pdf/FinancialInclusionForm";
import { CustomerProfileSheetForm } from "@/components/pdf/CustomerProfileSheetForm";
import { PMJJBYForm } from "@/components/pdf/PMJJBYForm";
import { PMSBYForm } from "@/components/pdf/PMSBYForm";
import { APYForm } from "@/components/pdf/APYForm";

// Import PDF bundle generator functions
import { downloadCombinedFormsPdf, downloadSingleFormPdf } from "@/lib/pdfGenerator";
import { toast } from "sonner";

interface PrintModalProps {
  customer: Customer;
  onClose: () => void;
}

const PRINT_PAGE_STYLE = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; background: #fff; }
  .char-grid { display: flex; gap: 1px; }
  .char-box { width: 16px; height: 18px; border: 1px solid #000; display: flex; align-items: center; justify-content: center; font-size: 9px; font-family: monospace; flex-shrink: 0; }
  table { border-collapse: collapse; width: 100%; }
  td, th { border: 1px solid #000; padding: 3px 5px; font-size: 9px; vertical-align: top; }
  .print-page-break { page-break-before: always; }
  @page { size: A4; margin: 10mm; }
`;

const PRINT_ACK_PAGE_STYLE = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; background: #fff; }
  @page { size: A5; margin: 8mm; }
`;

export default function PrintModal({ customer, onClose }: PrintModalProps) {
  const settings = getSettings();
  const [generatingAOf, setGeneratingAOf] = useState(false);
  const [generatingReceipt, setGeneratingReceipt] = useState(false);

  const schemeCount = [customer.enrollPMJJBY, customer.enrollPMSBY, customer.enrollAPY].filter(Boolean).length;
  const totalPages = 2 + schemeCount;

  // Compile active form element IDs for PDF bundle
  const getActiveElementIds = () => {
    const ids = ["pdf-form-fi", "pdf-form-cps"];
    if (customer.enrollPMJJBY) ids.push("pdf-form-pmjjby");
    if (customer.enrollPMSBY) ids.push("pdf-form-pmsby");
    if (customer.enrollAPY) ids.push("pdf-form-apy");
    return ids;
  };

  // High-DPI PDF generation for the A4 bundle
  const handleDownloadA4Bundle = async () => {
    setGeneratingAOf(true);
    toast.info("Generating high-resolution official A4 bank forms...");
    try {
      const ids = getActiveElementIds();
      const filename = `${customer.name.replace(/\s+/g, "_")}_Official_A4_Forms_Bundle.pdf`;
      await downloadCombinedFormsPdf(ids, filename);
      toast.success("Official Bank A4 forms bundle downloaded successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate combined A4 forms PDF.");
    } finally {
      setGeneratingAOf(false);
    }
  };

  // High-DPI PDF generation for the customer A5 receipt
  const handleDownloadReceipt = async () => {
    setGeneratingReceipt(true);
    toast.info("Generating high-resolution customer receipt...");
    try {
      const filename = `${customer.name.replace(/\s+/g, "_")}_Acknowledgement_Receipt.pdf`;
      await downloadSingleFormPdf("ack-slip-print", filename);
      toast.success("Receipt PDF downloaded successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate receipt PDF.");
    } finally {
      setGeneratingReceipt(false);
    }
  };

  // Print triggers (Fallback / Direct Print options)
  const printBankForm = () => {
    const printContent = document.getElementById("bank-form-print");
    if (!printContent) return;
    const win = window.open("", "_blank", "width=900,height=750");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>SK ONLINE — Bank Form</title><style>${PRINT_PAGE_STYLE}</style></head><body onload="window.print();">${printContent.innerHTML}</body></html>`);
    win.document.close();
  };

  const printAckSlip = () => {
    const printContent = document.getElementById("ack-slip-print");
    if (!printContent) return;
    const win = window.open("", "_blank", "width=600,height=450");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>SK ONLINE — Ack Slip</title><style>${PRINT_ACK_PAGE_STYLE}</style></head><body onload="window.print();">${printContent.innerHTML}</body></html>`);
    win.document.close();
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
              <div className="font-extrabold text-sm tracking-wide">Customer Saved Successfully</div>
              <div className="text-[11px] text-blue-200 mt-0.5">{customer.name} · A/C Suffix: {customer.accountNumber.slice(-6)}</div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Download Account Opening Documents</h3>
            <p className="text-xs text-slate-500 mt-1">
              Select an option below to generate and download official bank forms or customer receipt.
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
                Includes Account Application, Customer Profile Sheet (CPS){[
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

          {/* Primary Download Buttons */}
          <div className="space-y-3">
            {/* Button 1: Download Official Bank A4 Forms (Bundle) */}
            <button
              onClick={handleDownloadA4Bundle}
              disabled={generatingAOf}
              className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 border border-slate-200 hover:border-[#0056B3]/35 rounded-xl shadow-sm hover:shadow transition-all group disabled:opacity-50"
            >
              <div className="flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-lg bg-blue-50 group-hover:bg-[#003366]/10 flex items-center justify-center text-[#003366] transition-colors">
                  {generatingAOf ? <RefreshCw className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
                </div>
                <div>
                  <div className="text-xs font-bold text-[#0F172A]">📄 Download Official Bank A4 Forms (Bundle)</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Official A4 formats · 1:1 Layout · {totalPages} Pages</div>
                </div>
              </div>
              <Download className="w-4 h-4 text-slate-400 group-hover:text-[#0056B3] transition-colors" />
            </button>

            {/* Button 2: Download Customer Receipt */}
            <button
              onClick={handleDownloadReceipt}
              disabled={generatingReceipt}
              className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 border border-slate-200 hover:border-emerald-500/35 rounded-xl shadow-sm hover:shadow transition-all group disabled:opacity-50"
            >
              <div className="flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 group-hover:bg-emerald-500/10 flex items-center justify-center text-emerald-700 transition-colors">
                  {generatingReceipt ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Receipt className="w-5 h-5" />}
                </div>
                <div>
                  <div className="text-xs font-bold text-[#0F172A]">🧾 Download Customer Receipt</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">A5 format · Acknowledgment slip receipt</div>
                </div>
              </div>
              <Download className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
            </button>
          </div>

          {/* Quick Direct Print Fallbacks (Settings preserved) */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Direct Print Options</span>
            <div className="flex items-center gap-2">
              <button 
                onClick={printBankForm}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 hover:text-slate-800 text-[11px] font-semibold transition-colors shadow-sm"
              >
                <Printer size={12} />
                Print A4 Forms
              </button>
              <button 
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
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-slate-800 hover:bg-slate-200/50 rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>

      {/* Hidden high-fidelity templates for A4 PDF generator */}
      <div style={{ position: "absolute", left: "-9999px", top: 0, width: "210mm" }}>
        <FinancialInclusionForm customer={customer} settings={settings} />
        <CustomerProfileSheetForm customer={customer} settings={settings} />
        {customer.enrollPMJJBY && <PMJJBYForm customer={customer} settings={settings} />}
        {customer.enrollPMSBY && <PMSBYForm customer={customer} settings={settings} />}
        {customer.enrollAPY && <APYForm customer={customer} settings={settings} />}
      </div>

      {/* Hidden print targets — always in DOM for window.print() */}
      <div style={{ position: "absolute", left: "-9999px", top: 0, width: "210mm" }}>
        <BankFormPrint customer={customer} settings={settings} />
      </div>
      <div style={{ position: "absolute", left: "-9999px", top: 0, width: "148mm" }}>
        <AckSlipPrint customer={customer} settings={settings} />
      </div>
    </div>
  );
}
