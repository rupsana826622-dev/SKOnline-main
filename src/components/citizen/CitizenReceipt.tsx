import React from "react";
import type { CitizenServiceRecord, CitizenSettings } from "@/types/citizen";
import { getCitizenSettings } from "@/lib/citizenStorage";
import { Printer, CheckCircle, Clock, Sparkles, Building2, Phone, MapPin } from "lucide-react";

interface CitizenReceiptProps {
  record: CitizenServiceRecord;
  settings?: CitizenSettings;
  onPrint?: () => void;
  showPrintButton?: boolean;
}

/**
 * Standalone isolated print engine for Digital Citizen Services Acknowledgement Slip.
 * Inlines full typography, layout styling, and eco-friendly white background borders to guarantee flawless print.
 */
export function printCitizenReceipt(record: CitizenServiceRecord, customSettings?: CitizenSettings) {
  const settings = customSettings || getCitizenSettings();
  const receiptDate = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const isFullPaid = (record.dueAmount ?? 0) <= 0;

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Receipt_SL_${record.serialNo}_${record.customerName.replace(/[^a-zA-Z0-9]/g, "_")}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 8mm 10mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      font-size: 12px;
      line-height: 1.4;
    }
    .receipt-container {
      width: 100%;
      max-width: 190mm;
      min-height: 130mm;
      margin: 0 auto;
      padding: 16px 20px;
      background: #ffffff;
      border: 1.5px solid #0f172a;
      border-radius: 10px;
      position: relative;
      page-break-inside: avoid;
      page-break-after: avoid;
    }
    .top-accent {
      height: 4px;
      background: linear-gradient(to right, #1e3a8a, #2563eb, #38bdf8);
      margin: -16px -20px 14px -20px;
      border-radius: 8px 8px 0 0;
    }
    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 10px;
      margin-bottom: 12px;
    }
    .brand-col {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .logo-badge {
      width: 44px;
      height: 44px;
      background: #0f172a;
      color: #ffffff;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      font-weight: 900;
      flex-shrink: 0;
    }
    .center-name {
      font-size: 18px;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: -0.5px;
      margin: 0;
      line-height: 1.1;
    }
    .tagline {
      font-size: 10px;
      font-weight: 700;
      color: #1d4ed8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 2px;
    }
    .center-meta {
      font-size: 10px;
      color: #475569;
      margin-top: 3px;
    }
    .slip-meta {
      text-align: right;
    }
    .serial-badge {
      display: inline-block;
      background: #1e40af;
      color: #ffffff;
      font-size: 11px;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 5px;
      letter-spacing: 0.5px;
    }
    .date-label {
      font-size: 10px;
      color: #64748b;
      margin-top: 4px;
      font-weight: 600;
    }
    .details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px 14px;
      margin-bottom: 12px;
    }
    .detail-col {
      font-size: 11px;
    }
    .detail-col.left {
      border-right: 1px solid #e2e8f0;
      padding-right: 10px;
    }
    .section-title {
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
      margin-bottom: 3px;
    }
    .cust-name {
      font-size: 13px;
      font-weight: 800;
      color: #0f172a;
    }
    .service-name {
      font-size: 13px;
      font-weight: 800;
      color: #1d4ed8;
    }
    .app-number {
      font-family: monospace;
      font-weight: 800;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      padding: 2px 6px;
      border-radius: 4px;
      display: inline-block;
      margin-top: 2px;
    }
    
    /* ─── ECO-FRIENDLY INK-SAVING PAYMENT CARD ─── */
    .payment-card {
      background: #ffffff;
      color: #0f172a;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 10px 14px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .amount-group {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .amount-item .lbl {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
      letter-spacing: 0.5px;
    }
    .amount-item .val {
      font-size: 15px;
      font-weight: 900;
      color: #0f172a;
      font-family: monospace;
    }
    .amount-item .val.adv {
      color: #047857;
    }
    .amount-item .val.due {
      color: #b45309;
      font-weight: 900;
    }
    .divider-v {
      width: 1px;
      height: 24px;
      background: #cbd5e1;
    }
    .badge-pill {
      display: inline-block;
      font-size: 10px;
      font-weight: 800;
      padding: 4px 10px;
      border-radius: 5px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .badge-paid {
      background: #dcfce7;
      color: #15803d;
      border: 1px solid #86efac;
    }
    .badge-due {
      background: #fef3c7;
      color: #b45309;
      border: 1px solid #fde68a;
    }
    .badge-mode {
      background: #f1f5f9;
      color: #334155;
      border: 1px solid #cbd5e1;
      margin-right: 6px;
    }
    .footer-row {
      display: grid;
      grid-template-columns: 1.4fr 1fr 1fr;
      gap: 12px;
      align-items: flex-end;
      border-top: 1px solid #e2e8f0;
      padding-top: 8px;
    }
    .promo-box {
      font-size: 10px;
      color: #475569;
      line-height: 1.35;
    }
    .sig-box {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
    }
    .stamp-placeholder {
      height: 40px;
      width: 100px;
      border: 1px dashed #cbd5e1;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 9px;
      color: #94a3b8;
      margin-bottom: 4px;
    }
    .stamp-img {
      max-height: 45px;
      max-width: 100px;
      object-fit: contain;
      margin-bottom: 4px;
    }
    .sign-line {
      font-size: 9px;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
      border-top: 1px solid #64748b;
      padding-top: 2px;
      width: 110px;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="receipt-container" id="citizen-receipt-area">
    <div class="top-accent"></div>
    
    <!-- 1. Header -->
    <div class="header-row">
      <div class="brand-col">
        <div class="logo-badge">SK</div>
        <div>
          <h1 class="center-name">${settings.centerName || "SK ONLINE & CYBER ZONE"}</h1>
          <div class="tagline">${settings.tagline || "Customer Service Acknowledgement Slip"}</div>
          <div class="center-meta">
            ${settings.centerAddress ? settings.centerAddress + " · " : ""}Ph: <strong>${settings.centerContact || "9876543210"}</strong>
          </div>
        </div>
      </div>
      <div class="slip-meta">
        <div class="serial-badge">SL #${record.serialNo}</div>
        <div class="date-label">Date: ${receiptDate}</div>
      </div>
    </div>

    <!-- 2. Customer & Service Details -->
    <div class="details-grid">
      <div class="detail-col left">
        <div class="section-title">Customer Information</div>
        <div class="cust-name">${record.customerName || "—"}</div>
        <div>Contact: <strong>${record.contactNo || "—"}</strong></div>
        ${record.address ? `<div>Address: <strong>${record.address}</strong></div>` : ""}
      </div>
      <div class="detail-col">
        <div class="section-title">Service Applied For</div>
        <div class="service-name">${record.serviceType || "Digital Citizen Service"}</div>
        <div>App ID: <span class="app-number">${record.appNumber || "PENDING"}</span></div>
        <div>Applied: <strong>${record.applicationDate || receiptDate}</strong></div>
      </div>
    </div>

    <!-- 3. Eco-Friendly Ink-Saving Payment Summary Card -->
    <div class="payment-card">
      <div class="amount-group">
        <div class="amount-item">
          <div class="lbl">Total Fee</div>
          <div class="val">₹${Number(record.totalAmount || 0).toLocaleString("en-IN")}</div>
        </div>
        <div class="divider-v"></div>
        <div class="amount-item">
          <div class="lbl">Advance Paid</div>
          <div class="val adv">₹${Number(record.advancePaid || 0).toLocaleString("en-IN")}</div>
        </div>
        <div class="divider-v"></div>
        <div class="amount-item">
          <div class="lbl">Due Balance</div>
          <div class="val ${record.dueAmount > 0 ? "due" : ""}">₹${Number(record.dueAmount || 0).toLocaleString("en-IN")}</div>
        </div>
      </div>
      <div>
        <span class="badge-pill badge-mode">Mode: ${record.paymentMode || "Cash"}</span>
        <span class="badge-pill ${isFullPaid ? "badge-paid" : "badge-due"}">
          ${isFullPaid ? "✓ FULL PAID" : "DUE ₹" + record.dueAmount}
        </span>
      </div>
    </div>

    <!-- 4. Footer -->
    <div class="footer-row">
      <div class="promo-box">
        <div style="font-weight: 800; color: #0f172a; margin-bottom: 2px;">Notice & Info:</div>
        <div>
          ${
            settings.promotionalText ||
            "All Online Works, Tax/ITR Filing, Trade License, Bank CSP, LIC Advisory done with precision."
          }
        </div>
      </div>

      <div class="sig-box">
        <div class="stamp-placeholder" style="height: 36px; width: 100px; border: 1px dashed #cbd5e1; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 8px; color: #94a3b8; margin-bottom: 4px;">
          Applicant Sign
        </div>
        <div class="sign-line">Customer Signature</div>
      </div>

      <div class="sig-box">
        ${
          settings.stampSignatureUrl
            ? `<img src="${settings.stampSignatureUrl}" alt="Stamp" class="stamp-img" />`
            : `<div class="stamp-placeholder">Official Stamp</div>`
        }
        <div class="sign-line">Authorized Signatory</div>
      </div>
    </div>
  </div>

  <script>
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>
`;

  // Create isolated invisible iframe for printing
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (doc) {
    doc.open();
    doc.write(htmlContent);
    doc.close();

    setTimeout(() => {
      try {
        document.body.removeChild(iframe);
      } catch (e) {
        // Ignored
      }
    }, 60000);
  } else {
    const win = window.open("", "_blank");
    if (win) {
      win.document.open();
      win.document.write(htmlContent);
      win.document.close();
    }
  }
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
      printCitizenReceipt(record, settings);
    }
  };

  const isFullPaid = (record.dueAmount ?? 0) <= 0;

  // Format dates
  const receiptDate = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="citizen-receipt-wrapper w-full flex flex-col items-center">
      {/* Print Trigger Button */}
      {showPrintButton && (
        <div className="no-print mb-4 w-full flex justify-end gap-2 max-w-[210mm]">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg transition-all"
          >
            <Printer size={16} />
            Print Acknowledgement Slip
          </button>
        </div>
      )}

      {/* ─── ECO-FRIENDLY HALF-A4 / A5 LANDSCAPE RECEIPT CANVAS ─── */}
      <div
        id="citizen-receipt-area"
        className="citizen-receipt-container bg-white border border-slate-300 rounded-xl shadow-lg p-6 w-full max-w-[210mm] text-slate-900 select-text relative"
      >
        {/* Top Accent Stripe */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-900 via-blue-600 to-sky-400 rounded-t-lg -mt-6 -mx-6 mb-5 px-6" />

        {/* 1. Header Section */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-4 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xl shadow-md flex-shrink-0">
              SK
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 leading-tight">
                {settings.centerName || "SK ONLINE & CYBER ZONE"}
              </h1>
              <p className="text-[11px] font-bold text-blue-700 tracking-wider uppercase mt-0.5">
                {settings.tagline || "Customer Service Acknowledgement Slip"}
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 mt-1">
                {settings.centerAddress && (
                  <span className="flex items-center gap-1 font-medium">
                    <MapPin size={12} className="text-slate-400" />
                    {settings.centerAddress}
                  </span>
                )}
                <span className="flex items-center gap-1 font-medium">
                  <Phone size={12} className="text-slate-400" />
                  Ph: {settings.centerContact || "9876543210"}
                </span>
              </div>
            </div>
          </div>

          {/* Right Header: Slip Badge & Serial No */}
          <div className="text-right flex-shrink-0">
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-700 text-white text-xs font-bold uppercase tracking-wider mb-1 shadow-sm">
              <span>SL #{record.serialNo}</span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Date: <span className="font-semibold text-slate-800">{receiptDate}</span>
            </div>
          </div>
        </div>

        {/* 2. Customer & Service Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 rounded-xl p-4 border border-slate-200 mb-4">
          {/* Customer Details */}
          <div className="space-y-1.5 border-b sm:border-b-0 sm:border-r border-slate-200 sm:pr-4 pb-3 sm:pb-0">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <span>Customer Information</span>
            </div>
            <div className="text-sm font-extrabold text-slate-900 leading-tight">
              {record.customerName || "—"}
            </div>
            <div className="text-xs text-slate-600">
              Contact: <span className="font-mono font-bold text-slate-900">{record.contactNo || "—"}</span>
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

        {/* 3. Eco-Friendly Ink-Saving Payment & Accounting Summary Card */}
        <div className="bg-white border border-slate-300 rounded-xl p-4 mb-4 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Amount Breakdown */}
            <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Amount</div>
                <div className="text-lg font-black text-slate-900">₹{Number(record.totalAmount || 0).toLocaleString("en-IN")}</div>
              </div>
              <div className="h-8 w-px bg-slate-200 hidden sm:block" />
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Advance Paid</div>
                <div className="text-lg font-bold text-emerald-700">₹{Number(record.advancePaid || 0).toLocaleString("en-IN")}</div>
              </div>
              <div className="h-8 w-px bg-slate-200 hidden sm:block" />
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Balance Due</div>
                <div className={`text-lg font-black ${record.dueAmount > 0 ? "text-rose-600" : "text-emerald-700"}`}>
                  ₹{Number(record.dueAmount || 0).toLocaleString("en-IN")}
                </div>
              </div>
            </div>

            {/* Payment Mode & Status Badges */}
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold tracking-wide">
                Mode: {record.paymentMode || "Cash"}
              </span>
              {isFullPaid ? (
                <span className="flex items-center gap-1 px-3 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-extrabold tracking-wider uppercase">
                  <CheckCircle size={13} className="text-emerald-600" />
                  FULL PAID
                </span>
              ) : (
                <span className="flex items-center gap-1 px-3 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-300 text-xs font-extrabold tracking-wider uppercase">
                  <Clock size={13} className="text-amber-600" />
                  DUE ₹{record.dueAmount}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 4. Promotional Tagline & Signatures */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end pt-3 border-t border-slate-200">
          {/* Left: Promotional & Center Notice */}
          <div className="sm:col-span-1 text-xs text-slate-600 space-y-1">
            <div className="flex items-center gap-1 text-[10px] font-extrabold uppercase text-blue-700 tracking-wider">
              <Sparkles size={11} />
              <span>Available Services</span>
            </div>
            <p className="text-[11px] text-slate-700 font-medium leading-relaxed">
              {settings.promotionalText ||
                "SK ONLINE & CYBER ZONE — All online works, Tax/ITR Filing, Trade License, Bank CSP, LIC Advisory done with precision."}
            </p>
          </div>

          {/* Center: Customer Signature */}
          <div className="sm:col-span-1 flex flex-col items-center justify-end text-center pt-2 sm:pt-0">
            <div className="h-10 w-28 border border-dashed border-slate-300 rounded flex items-center justify-center text-[9px] text-slate-400 mb-1">
              Applicant Sign
            </div>
            <div className="text-[10px] font-extrabold text-slate-800 uppercase tracking-wider border-t border-slate-400 pt-1 w-28 text-center">
              Customer Sign
            </div>
          </div>

          {/* Right: Center Stamp & Signature */}
          <div className="sm:col-span-1 flex flex-col items-center sm:items-end justify-end text-center sm:text-right pt-2 sm:pt-0">
            {settings.stampSignatureUrl ? (
              <img
                src={settings.stampSignatureUrl}
                alt="Authorized Stamp"
                className="max-h-12 max-w-[100px] object-contain mb-1"
              />
            ) : (
              <div className="h-10 w-28 border border-dashed border-slate-300 rounded flex items-center justify-center text-[9px] text-slate-400 mb-1">
                Center Seal
              </div>
            )}
            <div className="text-[10px] font-extrabold text-slate-800 uppercase tracking-wider border-t border-slate-400 pt-1 w-32 text-center">
              Authorized Signatory
            </div>
          </div>
        </div>
      </div>

      {/* Print CSS Fallback */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
          }
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
          }
          .no-print, header, aside, nav, footer, button, .modal-backdrop {
            display: none !important;
          }
          #citizen-receipt-area {
            display: block !important;
            visibility: visible !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            max-width: 210mm !important;
            box-sizing: border-box !important;
            padding: 10mm !important;
            background: #ffffff !important;
            color: #000000 !important;
            border: 1.5px solid #0f172a !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #citizen-receipt-area * {
            visibility: visible !important;
          }
        }
      `}</style>
    </div>
  );
}
