import React from "react";
import type { CitizenServiceRecord, CitizenSettings } from "@/types/citizen";
import { getCitizenSettings } from "@/lib/citizenStorage";
import { Printer, CheckCircle, Clock, Sparkles, MapPin, Phone } from "lucide-react";

interface CitizenReceiptProps {
  record: CitizenServiceRecord;
  settings?: CitizenSettings;
  onPrint?: () => void;
  showPrintButton?: boolean;
}

/**
 * Robust print helper for Citizen Service Acknowledgement Slip (Half-A4).
 * Creates an isolated printable iframe/window with all styles inlined to avoid browser blank white preview bugs.
 */
export function printCitizenReceipt(record: CitizenServiceRecord, customSettings?: CitizenSettings) {
  const settings = customSettings || getCitizenSettings();
  const receiptDate = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const isFullPaid = (record.dueAmount ?? 0) <= 0;
  const promoText =
    settings.promotionalText ||
    "SK ONLINE & CYBER ZONE — All online works, Tax/ITR Filing, Trade License, Bank CSP, LIC Advisory done with precision.";

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
      min-height: 125mm;
      max-height: 140mm;
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
      background: linear-gradient(to right, #2563eb, #4f46e5, #f59e0b);
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
      background: #1d4ed8;
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
    .center-tagline {
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
      background: #0f172a;
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
    .payment-card {
      background: #0f172a;
      color: #ffffff;
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
      color: #94a3b8;
      letter-spacing: 0.5px;
    }
    .amount-item .val {
      font-size: 15px;
      font-weight: 900;
      color: #ffffff;
    }
    .amount-item .val.adv {
      color: #34d399;
    }
    .amount-item .val.due {
      color: #fbbf24;
    }
    .divider-v {
      width: 1px;
      height: 24px;
      background: #334155;
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
      background: #059669;
      color: #ffffff;
    }
    .badge-due {
      background: #d97706;
      color: #ffffff;
    }
    .badge-mode {
      background: #334155;
      color: #cbd5e1;
      margin-right: 6px;
    }
    .footer-row {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 12px;
      align-items: flex-end;
      border-top: 1px solid #e2e8f0;
      padding-top: 8px;
    }
    .promo-box {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 6px;
      padding: 6px 10px;
      font-size: 10px;
      color: #1e3a8a;
      font-weight: 500;
      line-height: 1.35;
    }
    .promo-title {
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      color: #1e40af;
      margin-bottom: 2px;
    }
    .stamp-col {
      text-align: right;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      justify-content: flex-end;
    }
    .stamp-img {
      max-height: 48px;
      max-width: 100px;
      object-contain: fit;
      margin-bottom: 3px;
    }
    .stamp-placeholder {
      height: 38px;
      width: 90px;
      border: 1px dashed #cbd5e1;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 9px;
      color: #94a3b8;
      margin-bottom: 3px;
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
          <div class="center-tagline">${settings.tagline || "Customer Service Acknowledgement Slip"}</div>
          <div class="center-meta">
            ${settings.centerAddress ? settings.centerAddress + " · " : ""}Ph: ${settings.centerContact || "9876543210"}
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
        <div class="section-title">Customer Details</div>
        <div class="cust-name">${record.customerName || "—"}</div>
        <div>Mobile: <strong style="font-family: monospace;">${record.contactNo || "—"}</strong></div>
        ${record.address ? `<div style="color: #475569; font-size: 10px; margin-top: 2px;">Address: ${record.address}</div>` : ""}
      </div>
      <div class="detail-col">
        <div class="section-title">Service Applied For</div>
        <div class="service-name">${record.serviceType || "Digital Citizen Service"}</div>
        <div style="margin-top: 2px;">
          App / User ID: <span class="app-number">${record.appNumber || "PENDING"}</span>
        </div>
        <div style="font-size: 10px; color: #64748b; margin-top: 2px;">
          Applied On: ${record.applicationDate || receiptDate}
        </div>
      </div>
    </div>

    <!-- 3. Payment & Accounting -->
    <div class="payment-card">
      <div class="amount-group">
        <div class="amount-item">
          <div class="lbl">Total Amount</div>
          <div class="val">₹${Number(record.totalAmount || 0).toLocaleString("en-IN")}</div>
        </div>
        <div class="divider-v"></div>
        <div class="amount-item">
          <div class="lbl">Advance Paid</div>
          <div class="val adv">₹${Number(record.advancePaid || 0).toLocaleString("en-IN")}</div>
        </div>
        <div class="divider-v"></div>
        <div class="amount-item">
          <div class="lbl">Balance Due</div>
          <div class="val due">₹${Number(record.dueAmount || 0).toLocaleString("en-IN")}</div>
        </div>
      </div>
      <div>
        <span class="badge-pill badge-mode">Mode: ${record.paymentMode || "Cash"}</span>
        ${
          isFullPaid
            ? `<span class="badge-pill badge-paid">✓ Full Paid</span>`
            : `<span class="badge-pill badge-due">⏳ Payment Due</span>`
        }
      </div>
    </div>

    <!-- 4. Footer Section -->
    <div class="footer-row">
      <div class="promo-box">
        <div class="promo-title">Services Offered</div>
        ${promoText}
      </div>
      <div class="stamp-col">
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

  // Create isolated invisible iframe for flawless printing
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

    // Clean up iframe after print dialog closes
    setTimeout(() => {
      try {
        document.body.removeChild(iframe);
      } catch (e) {
        // Ignored
      }
    }, 60000);
  } else {
    // Fallback if iframe blocked
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
        id="citizen-receipt-area"
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
                "SK ONLINE & CYBER ZONE — All online works, Tax/ITR Filing, Trade License, Bank CSP, LIC Advisory done with precision."}
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
