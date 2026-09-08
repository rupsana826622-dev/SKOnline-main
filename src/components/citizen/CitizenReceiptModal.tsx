import React from "react";
import { X, Printer } from "lucide-react";
import CitizenReceipt from "./CitizenReceipt";
import type { CitizenServiceRecord } from "@/types/citizen";

interface CitizenReceiptModalProps {
  record: CitizenServiceRecord | null;
  onClose: () => void;
}

export default function CitizenReceiptModal({ record, onClose }: CitizenReceiptModalProps) {
  if (!record) return null;

  return (
    <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="bg-slate-100 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Modal Top Bar */}
        <div className="no-print flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Customer Acknowledgement Slip — SL #{record.serialNo}
            </h2>
            <p className="text-xs text-slate-500">Half-A4 printable format for {record.customerName}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow transition-colors"
            >
              <Printer size={14} />
              Print
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
          <CitizenReceipt record={record} showPrintButton={false} />
        </div>
      </div>
    </div>
  );
}
