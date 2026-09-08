import React from "react";
import type { CitizenServiceRecord, CitizenSettings } from "@/types/citizen";
import { getCitizenSettings } from "@/lib/citizenStorage";
import { Printer, CheckCircle, Clock, ShieldCheck, Sparkles, Building2, Phone, MapPin } from "lucide-react";

interface CitizenReceiptProps {
  record: CitizenServiceRecord;
  settings?: CitizenSettings;
  onPrint?: () => void;
  showPrintButton?: boolean;
}

export default function CitizenReceipt({
  record,
  settings: propSettings,
  onPrint,
  showPrintButton = true,
}: CitizenReceiptProps) {
  const settings = propSettings || getCitizenSettings();

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  const isFullPaid = record.dueAmount <= 0;

  // Format dates
  const receiptDate = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="citizen-receipt-wrapper w-full flex flex-col items-center">
      {/* Print Trigger Button (Hidden in Print) */}
      {showPrintButton && (
        <div className="no-print mb-4 w-full flex justify-end gap-2 max-w-[210mm]">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg transition-all"
          >
            <Printer size={16} />
            Print Receipt (Half-A4)
          </button>
        </div>
      )}

      {/* ─── HALF-A4 / A5 LANDSCAPE RECEIPT CANVAS ─── */}
      <div
        id="citizen-receipt-print"
        className="citizen-receipt-container bg-white border border-slate-300 rounded-xl shadow-lg p-6 w-full max-w-[210mm] text-slate-900 select-text relative"
      >
        {/* Top Accent Stripe */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-amber-500 rounded-t-lg -mt-6 -mx-6 mb-5 px-6" />

        {/* 1. Header Section */}
        <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4 mb-4 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-700 text-white flex items-center justify-center font-black text-xl shadow-md flex-shrink-0">
              SK
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 leading-tight">
                  {settings.centerName || "SK ONLINE & CYBER ZONE"}
                </h1>
              </div>
              <p className="text-[11px] font-semibold text-blue-700 tracking-wider uppercase mt-0.5">
                {settings.tagline || "Customer Service Acknowledgement Slip"}
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 mt-1">
                <span className="flex items-center gap-1 font-medium">
                  <MapPin size={12} className="text-slate-400" />
                  {settings.centerAddress || "Main Market Road"}
                </span>
                <span className="flex items-center gap-1 font-medium">
                  <Phone size={12} className="text-slate-400" />
                  Ph: {settings.centerContact || "9876543210"}
                </span>
              </div>
            </div>
          </div>

          {/* Right Header: Slip Badge & Serial No */}
          <div className="text-right flex-shrink-0">
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-900 text-white text-xs font-bold uppercase tracking-wider mb-1">
              <span>SL #{record.serialNo}</span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Date: <span className="font-semibold text-slate-800">{receiptDate}</span>
            </div>
          </div>
        </div>

        {/* 2. Customer & Service Details (2-Column Grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/80 rounded-xl p-4 border border-slate-200 mb-4">
          {/* Customer Details */}
          <div className="space-y-1.5 border-b sm:border-b-0 sm:border-r border-slate-200 sm:pr-4 pb-3 sm:pb-0">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <span>Customer Details</span>
            </div>
            <div className="text-sm font-bold text-slate-900 leading-tight">
              {record.customerName || "—"}
            </div>
            <div className="text-xs text-slate-600 font-medium">
              Mobile: <span className="font-mono text-slate-900">{record.contactNo || "—"}</span>
            </div>
            {record.address && (
              <div className="text-xs text-slate-600 leading-snug">
                Address: <span className="text-slate-800">{record.address}</span>
              </div>
            )}
          </div>

          {/* Service & Tracking Details */}
          <div className="space-y-1.5 sm:pl-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <span>Service Applied For</span>
            </div>
            <div className="text-sm font-extrabold text-blue-700 leading-tight">
              {record.serviceType || "Digital Citizen Service"}
            </div>
            <div className="text-xs text-slate-600">
              App / User ID:{" "}
              <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-300 inline-block">
                {record.appNumber || "PENDING"}
              </span>
            </div>
            <div className="text-xs text-slate-500">
              Applied On:{" "}
              <span className="font-medium text-slate-700">{record.applicationDate || receiptDate}</span>
            </div>
          </div>
        </div>

        {/* 3. Payment & Accounting Summary Card */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl p-4 mb-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Amount Breakdown */}
            <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Amount</div>
                <div className="text-lg font-black text-white">₹{Number(record.totalAmount || 0).toLocaleString("en-IN")}</div>
              </div>
              <div className="h-8 w-px bg-slate-700 hidden sm:block" />
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Advance Paid</div>
                <div className="text-lg font-bold text-emerald-400">₹{Number(record.advancePaid || 0).toLocaleString("en-IN")}</div>
              </div>
              <div className="h-8 w-px bg-slate-700 hidden sm:block" />
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Balance Due</div>
                <div className={`text-lg font-black ${record.dueAmount > 0 ? "text-amber-400" : "text-slate-300"}`}>
                  ₹{Number(record.dueAmount || 0).toLocaleString("en-IN")}
                </div>
              </div>
            </div>

            {/* Payment Mode & Status Badges */}
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded bg-slate-700 text-slate-200 text-xs font-bold tracking-wide">
                Mode: {record.paymentMode || "Cash"}
              </span>
              {isFullPaid ? (
                <span className="flex items-center gap-1 px-3 py-1 rounded-md bg-emerald-600 text-white text-xs font-extrabold tracking-wider uppercase shadow">
                  <CheckCircle size={13} />
                  FULL PAID
                </span>
              ) : (
                <span className="flex items-center gap-1 px-3 py-1 rounded-md bg-amber-500 text-slate-950 text-xs font-extrabold tracking-wider uppercase shadow">
                  <Clock size={13} />
                  PAYMENT DUE
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 4. Footer Section: Stamp & Promotional Branding */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end pt-2 border-t border-slate-200">
          {/* Promotional Text Box */}
          <div className="sm:col-span-2 bg-blue-50/70 border border-blue-200/80 rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-900 uppercase tracking-wide mb-1">
              <Sparkles size={12} className="text-amber-500" />
              <span>Services Offered</span>
            </div>
            <p className="text-[11px] text-slate-700 font-medium leading-relaxed">
              {settings.promotionalText ||
                "SK ONLINE & CYBER ZONE: All online services, ITR/GST Tax Filing, Trade License, Bank CSP, and LIC Insurance done here."}
            </p>
          </div>

          {/* Authorized Signature & Stamp */}
          <div className="sm:col-span-1 flex flex-col items-center sm:items-end justify-end text-center sm:text-right pt-2 sm:pt-0">
            {settings.stampSignatureUrl ? (
              <img
                src={settings.stampSignatureUrl}
                alt="Authorized Stamp"
                className="max-h-16 max-w-[120px] object-contain mb-1"
              />
            ) : (
              <div className="h-12 w-28 border border-dashed border-slate-300 rounded flex items-center justify-center text-[10px] text-slate-400 mb-1">
                Official Stamp
              </div>
            )}
            <div className="text-[10px] font-extrabold text-slate-800 uppercase tracking-wider border-t border-slate-400 pt-1 w-32 text-center">
              Authorized Signatory
            </div>
          </div>
        </div>
      </div>

      {/* Print CSS Injection */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 6mm 8mm;
          }
          body * {
            visibility: hidden !important;
          }
          #citizen-receipt-print, #citizen-receipt-print * {
            visibility: visible !important;
          }
          #citizen-receipt-print {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 210mm !important;
            margin: 0 !important;
            padding: 8mm 10mm !important;
            box-shadow: none !important;
            border: 1.5px solid #0f172a !important;
            background: #ffffff !important;
            color: #000000 !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print, .fixed, .backdrop, .modal-backdrop, header, aside, nav, footer, button {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
