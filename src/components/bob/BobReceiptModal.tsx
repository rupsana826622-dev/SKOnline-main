import React from "react";
import { X, Printer } from "lucide-react";
import BobReceipt, { printBobReceipt } from "./BobReceipt";
import type { BobCustomerRecord } from "@/types/bob";

interface BobReceiptModalProps {
  record: BobCustomerRecord | null;
  onClose: () => void;
}

export default function BobReceiptModal({ record, onClose }: BobReceiptModalProps) {
  if (!record) return null;

  const handlePrint = () => {
    printBobReceipt(record);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="bg-slate-100 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Bank of Baroda CSP Acknowledgement Slip — SL #{record.slNo}
            </h2>
            <p className="text-xs text-slate-500">Official printable format for {record.customerName}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-lg shadow transition-colors"
            >
              <Printer size={14} />
              Print Slip
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto custom-scroll flex justify-center">
          <BobReceipt record={record} onPrint={handlePrint} showPrintButton={false} />
        </div>
      </div>
    </div>
  );
}
