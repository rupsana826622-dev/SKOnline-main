import { X, Printer, FileText, Receipt, FileCheck } from "lucide-react";
import type { Customer } from "@/types";
import { getSettings } from "@/lib/storage";
import BankFormPrint from "./BankFormPrint";
import AckSlipPrint from "./AckSlipPrint";

interface PrintModalProps {
  customer: Customer;
  onClose: () => void;
}

const PAGE_STYLE = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; background: #fff; }
  .char-grid { display: flex; gap: 1px; }
  .char-box { width: 16px; height: 18px; border: 1px solid #000; display: flex; align-items: center; justify-content: center; font-size: 9px; font-family: monospace; flex-shrink: 0; }
  table { border-collapse: collapse; width: 100%; }
  td, th { border: 1px solid #000; padding: 3px 5px; font-size: 9px; vertical-align: top; }
  .print-page-break { page-break-before: always; }
  @page { size: A4; margin: 10mm; }
`;

const ACK_PAGE_STYLE = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; background: #fff; }
  @page { size: A5; margin: 8mm; }
`;

export default function PrintModal({ customer, onClose }: PrintModalProps) {
  const settings = getSettings();

  const schemeCount = [customer.enrollPMJJBY, customer.enrollPMSBY, customer.enrollAPY].filter(Boolean).length;
  const totalPages = 2 + schemeCount;

  const printBankForm = () => {
    const printContent = document.getElementById("bank-form-print");
    if (!printContent) return;
    const win = window.open("", "_blank", "width=900,height=750");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>SK ONLINE — Bank Form</title><style>${PAGE_STYLE}</style></head><body onload="window.print();">${printContent.innerHTML}</body></html>`);
    win.document.close();
  };

  const printAckSlip = () => {
    const printContent = document.getElementById("ack-slip-print");
    if (!printContent) return;
    const win = window.open("", "_blank", "width=600,height=450");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>SK ONLINE — Ack Slip</title><style>${ACK_PAGE_STYLE}</style></head><body onload="window.print();">${printContent.innerHTML}</body></html>`);
    win.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <Printer size={18} className="text-blue-400" />
            <div>
              <div className="font-semibold text-sm">Print Documents</div>
              <div className="text-xs text-slate-400">{customer.name} · {customer.accountNumber}</div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-700 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-sm text-slate-600 mb-5">
            Account registered. Select a document to print:
          </p>

          {/* Scheme info */}
          {schemeCount > 0 && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2">
              <FileCheck size={15} className="text-blue-600 flex-shrink-0" />
              <div className="text-xs text-blue-700">
                <strong>{totalPages} pages</strong> will print — includes {[
                  customer.enrollPMJJBY && "PMJJBY",
                  customer.enrollPMSBY && "PMSBY",
                  customer.enrollAPY && "APY",
                ].filter(Boolean).join(", ")} forms
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Bank Form */}
            <button
              onClick={printBankForm}
              className="group flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200"
            >
              <div className="w-12 h-12 rounded-full bg-blue-100 group-hover:bg-blue-500 flex items-center justify-center transition-colors">
                <FileText size={20} className="text-blue-600 group-hover:text-white" />
              </div>
              <div className="text-center">
                <div className="font-semibold text-sm text-slate-800 group-hover:text-blue-700">Official Bank Form</div>
                <div className="text-xs text-slate-500 mt-0.5">A4 · {totalPages} pages</div>
                <div className="text-xs text-blue-600 font-medium mt-1">
                  P1: AOF · P2: CPS
                  {customer.enrollPMJJBY && " · P3: PMJJBY"}
                  {customer.enrollPMSBY && " · P4: PMSBY"}
                  {customer.enrollAPY && ` · P${2 + schemeCount}: APY`}
                </div>
              </div>
            </button>

            {/* Ack Slip */}
            <button
              onClick={printAckSlip}
              className="group flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all duration-200"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-100 group-hover:bg-emerald-500 flex items-center justify-center transition-colors">
                <Receipt size={20} className="text-emerald-600 group-hover:text-white" />
              </div>
              <div className="text-center">
                <div className="font-semibold text-sm text-slate-800 group-hover:text-emerald-700">Acknowledgement Slip</div>
                <div className="text-xs text-slate-500 mt-0.5">A5 · Half-Page Receipt</div>
                <div className="text-xs text-emerald-600 font-medium mt-1">Customer Copy</div>
              </div>
            </button>
          </div>

          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
            <strong>Tip:</strong> Set print destination to <strong>A4</strong> for Bank Form, <strong>A5</strong> for Ack Slip. Disable headers/footers in browser print settings for clean output.
          </div>
        </div>

        <div className="px-6 pb-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>

      {/* Hidden print targets — always in DOM */}
      <div style={{ position: "absolute", left: "-9999px", top: 0, width: "210mm" }}>
        <BankFormPrint customer={customer} settings={settings} />
      </div>
      <div style={{ position: "absolute", left: "-9999px", top: 0, width: "148mm" }}>
        <AckSlipPrint customer={customer} settings={settings} />
      </div>
    </div>
  );
}
