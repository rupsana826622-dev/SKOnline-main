import React from "react";
import type { BobCustomerRecord, BobSettings } from "@/types/bob";
import { getBobSettings } from "@/lib/bobStorage";
import { Printer, CheckCircle, Clock, ShieldCheck, Sparkles, Building2, Phone, MapPin } from "lucide-react";

interface BobReceiptProps {
  record: BobCustomerRecord;
  settings?: BobSettings;
  onPrint?: () => void;
  showPrintButton?: boolean;
}

/**
 * Standalone print engine for Bank of Baroda Customer Acknowledgment Slip.
 * Inlines full typography, orange (#F26522) palette, borders, and stamp to guarantee no blank page rendering.
 */
export function printBobReceipt(record: BobCustomerRecord, customSettings?: BobSettings) {
  const settings = customSettings || getBobSettings();
  const printDate = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>BOB_Receipt_SL_${record.slNo}_${record.customerName.replace(/[^a-zA-Z0-9]/g, "_")}</title>
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
      border: 1.5px solid #ea580c;
      border-radius: 10px;
      position: relative;
      page-break-inside: avoid;
      page-break-after: avoid;
    }
    .top-accent {
      height: 5px;
      background: linear-gradient(to right, #ea580c, #f97316, #fb923c);
      margin: -16px -20px 14px -20px;
      border-radius: 8px 8px 0 0;
    }
    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #ea580c;
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
      background: #ea580c;
      color: #ffffff;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      font-weight: 900;
      flex-shrink: 0;
      box-shadow: 0 2px 4px rgba(234, 88, 12, 0.25);
    }
    .bank-name {
      font-size: 18px;
      font-weight: 900;
      color: #ea580c;
      letter-spacing: -0.5px;
      margin: 0;
      line-height: 1.1;
    }
    .slip-tagline {
      font-size: 10px;
      font-weight: 800;
      color: #0f172a;
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
      background: #ea580c;
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
      background: #fff7ed;
      border: 1px solid #fed7aa;
      border-radius: 8px;
      padding: 10px 14px;
      margin-bottom: 12px;
    }
    .detail-col {
      font-size: 11px;
    }
    .detail-col.left {
      border-right: 1px solid #fed7aa;
      padding-right: 10px;
    }
    .section-title {
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #ea580c;
      margin-bottom: 3px;
    }
    .cust-name {
      font-size: 13px;
      font-weight: 800;
      color: #0f172a;
    }
    .data-val {
      font-family: monospace;
      font-weight: 700;
      color: #0f172a;
    }
    .financial-card {
      background: #0f172a;
      color: #ffffff;
      border-radius: 8px;
      padding: 10px 14px;
      margin-bottom: 12px;
      display: grid;
      grid-template-columns: 1.2fr 1fr 1fr;
      gap: 12px;
      align-items: center;
    }
    .amount-item .lbl {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      color: #fdba74;
      letter-spacing: 0.5px;
    }
    .amount-item .val {
      font-size: 13px;
      font-weight: 900;
      color: #ffffff;
      font-family: monospace;
    }
    .schemes-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 8px 12px;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 8px;
    }
    .scheme-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 10px;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 5px;
    }
    .scheme-active {
      background: #dcfce7;
      color: #15803d;
      border: 1px solid #86efac;
    }
    .scheme-inactive {
      background: #f1f5f9;
      color: #94a3b8;
      border: 1px solid #e2e8f0;
    }
    .footer-row {
      display: grid;
      grid-template-columns: 1.2fr 1fr 1fr;
      gap: 12px;
      align-items: flex-end;
      border-top: 1px solid #fed7aa;
      padding-top: 8px;
    }
    .delivery-box {
      font-size: 10px;
      color: #475569;
      line-height: 1.4;
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
  <div class="receipt-container" id="bob-receipt-area">
    <div class="top-accent"></div>
    
    <!-- 1. Header -->
    <div class="header-row">
      <div class="brand-col">
        <div class="logo-badge">BOB</div>
        <div>
          <h1 class="bank-name">BANK OF BARODA</h1>
          <div class="slip-tagline">Customer Service Point (CSP) — Acknowledgement Slip</div>
          <div class="center-meta">
            ${settings.branchName || "BOB CSP Center"} · CSP Code: <strong>${settings.cspCode || "BOB-CSP-1082"}</strong>
          </div>
        </div>
      </div>
      <div class="slip-meta">
        <div class="serial-badge">SL #${record.slNo}</div>
        <div class="date-label">Slip Date: ${printDate}</div>
      </div>
    </div>

    <!-- 2. Customer & Personal Details -->
    <div class="details-grid">
      <div class="detail-col left">
        <div class="section-title">Customer Information</div>
        <div class="cust-name">${record.customerName || "—"}</div>
        <div>C/O (Guardian): <strong>${record.guardianName || "—"}</strong></div>
        <div>Mobile: <span class="data-val">${record.mobile || "—"}</span></div>
        ${record.dob ? `<div>DOB: <span class="data-val">${record.dob}</span></div>` : ""}
      </div>
      <div class="detail-col">
        <div class="section-title">Address & Identification</div>
        <div>Address: <strong>${record.address || "—"}</strong></div>
        <div>Aadhaar: <span class="data-val">${record.aadhaarNo ? "XXXX-XXXX-" + record.aadhaarNo.slice(-4) : "—"}</span></div>
        <div>Opening Date: <span class="data-val">${record.accountOpeningDate || printDate}</span></div>
      </div>
    </div>

    <!-- 3. Banking & Financial Details -->
    <div class="financial-card">
      <div class="amount-item">
        <div class="lbl">Account Number</div>
        <div class="val">${record.accountNo || "PENDING"}</div>
      </div>
      <div class="amount-item">
        <div class="lbl">CIF Number</div>
        <div class="val">${record.cifNo || "PENDING"}</div>
      </div>
      <div class="amount-item">
        <div class="lbl">Reference Number</div>
        <div class="val">${record.refNo || "—"}</div>
      </div>
    </div>

    <!-- 4. Social Security Schemes (SSS) -->
    <div class="schemes-card">
      <div style="font-size: 10px; font-weight: 800; color: #475569; text-transform: uppercase;">
        Social Security Schemes (SSS):
      </div>
      <div style="display: flex; gap: 8px;">
        <span class="scheme-badge ${record.enrollAPY ? "scheme-active" : "scheme-inactive"}">
          ${record.enrollAPY ? "✓ APY Enrolled" : "— APY"}
        </span>
        <span class="scheme-badge ${record.enrollPMSBY ? "scheme-active" : "scheme-inactive"}">
          ${record.enrollPMSBY ? "✓ PMSBY Enrolled" : "— PMSBY"}
        </span>
        <span class="scheme-badge ${record.enrollPMJJBY ? "scheme-active" : "scheme-inactive"}">
          ${record.enrollPMJJBY ? "✓ PMJJBY Enrolled" : "— PMJJBY"}
        </span>
      </div>
    </div>

    <!-- 5. Footer & Delivery Tracker -->
    <div class="footer-row">
      <div class="delivery-box">
        <div style="font-size: 9px; font-weight: 800; text-transform: uppercase; color: #ea580c; margin-bottom: 2px;">
          Deliverables Status
        </div>
        <div>Passbook: <strong>${record.passbookIssued ? "Issued (" + (record.passbookIssuedAt ? new Date(record.passbookIssuedAt).toLocaleDateString("en-IN") : "Done") + ")" : "Under Processing"}</strong></div>
        <div>ATM Card: <strong>${record.atmIssued ? "Issued (" + (record.atmIssuedAt ? new Date(record.atmIssuedAt).toLocaleDateString("en-IN") : "Done") + ")" : "Under Processing"}</strong></div>
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
            : `<div class="stamp-placeholder" style="height: 36px; width: 100px; border: 1px dashed #cbd5e1; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 8px; color: #94a3b8; margin-bottom: 4px;">Official Seal</div>`
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

export default function BobReceipt({
  record,
  settings: propSettings,
  onPrint,
  showPrintButton = true,
}: BobReceiptProps) {
  const settings = propSettings || getBobSettings();

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      printBobReceipt(record, settings);
    }
  };

  const printDate = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="bob-receipt-wrapper w-full flex flex-col items-center">
      {/* Print Trigger Button */}
      {showPrintButton && (
        <div className="no-print mb-4 w-full flex justify-end gap-2 max-w-[210mm]">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg transition-all"
          >
            <Printer size={16} />
            Print Slip (Bank of Baroda)
          </button>
        </div>
      )}

      {/* ─── BOB RECEIPT CANVAS ─── */}
      <div
        id="bob-receipt-area"
        className="bob-receipt-container bg-white border-2 border-orange-500 rounded-xl shadow-lg p-6 w-full max-w-[210mm] text-slate-900 select-text relative"
      >
        {/* Top Accent Stripe */}
        <div className="h-1.5 w-full bg-gradient-to-r from-orange-600 via-amber-500 to-orange-400 rounded-t-lg -mt-6 -mx-6 mb-5 px-6" />

        {/* 1. Header Section */}
        <div className="flex justify-between items-start border-b-2 border-orange-500 pb-4 mb-4 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-orange-600 text-white flex items-center justify-center font-black text-xl shadow-md flex-shrink-0">
              BOB
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-orange-600 leading-tight">
                BANK OF BARODA
              </h1>
              <p className="text-[11px] font-bold text-slate-800 tracking-wider uppercase mt-0.5">
                Customer Service Point (CSP) — Acknowledgement Slip
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 mt-1">
                <span className="flex items-center gap-1 font-medium">
                  <Building2 size={12} className="text-orange-500" />
                  {settings.branchName || "BOB CSP Center"}
                </span>
                <span className="flex items-center gap-1 font-medium">
                  <Phone size={12} className="text-orange-500" />
                  CSP Code: {settings.cspCode || "BOB-CSP-1082"}
                </span>
              </div>
            </div>
          </div>

          {/* Right Header: Slip Badge & Serial No */}
          <div className="text-right flex-shrink-0">
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-orange-600 text-white text-xs font-bold uppercase tracking-wider mb-1 shadow-sm">
              <span>SL #{record.slNo}</span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Slip Date: <span className="font-semibold text-slate-800">{printDate}</span>
            </div>
          </div>
        </div>

        {/* 2. Customer & Personal Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-orange-50/70 rounded-xl p-4 border border-orange-200 mb-4">
          {/* Left Column: Customer & Guardian */}
          <div className="space-y-1.5 border-b sm:border-b-0 sm:border-r border-orange-200 sm:pr-4 pb-3 sm:pb-0">
            <div className="text-[10px] font-bold uppercase tracking-wider text-orange-700 flex items-center gap-1">
              <span>Customer Information</span>
            </div>
            <div className="text-sm font-extrabold text-slate-900 leading-tight">
              {record.customerName || "—"}
            </div>
            <div className="text-xs text-slate-700">
              C/O (Guardian): <span className="font-semibold text-slate-900">{record.guardianName || "—"}</span>
            </div>
            <div className="text-xs text-slate-700">
              Mobile: <span className="font-mono font-bold text-slate-900">{record.mobile || "—"}</span>
            </div>
            {record.dob && (
              <div className="text-xs text-slate-600">
                DOB: <span className="font-mono font-medium text-slate-800">{record.dob}</span>
              </div>
            )}
          </div>

          {/* Right Column: Address & Opening */}
          <div className="space-y-1.5 sm:pl-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-orange-700 flex items-center gap-1">
              <span>Address & Identification</span>
            </div>
            <div className="text-xs text-slate-800 leading-snug">
              Address: <span className="font-medium text-slate-900">{record.address || "—"}</span>
            </div>
            <div className="text-xs text-slate-700">
              Aadhaar:{" "}
              <span className="font-mono font-bold text-slate-900">
                {record.aadhaarNo ? "XXXX-XXXX-" + record.aadhaarNo.slice(-4) : "—"}
              </span>
            </div>
            <div className="text-xs text-slate-600">
              Opening Date:{" "}
              <span className="font-mono font-semibold text-slate-900">{record.accountOpeningDate || printDate}</span>
            </div>
          </div>
        </div>

        {/* 3. Financial Card */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl p-4 mb-4 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
            <div>
              <div className="text-[10px] uppercase font-bold text-orange-400 tracking-wider">Account Number</div>
              <div className="text-base font-mono font-black text-white">{record.accountNo || "PENDING"}</div>
            </div>
            <div className="border-t sm:border-t-0 sm:border-l border-slate-700 pt-2 sm:pt-0 sm:pl-4">
              <div className="text-[10px] uppercase font-bold text-orange-400 tracking-wider">CIF Number</div>
              <div className="text-sm font-mono font-bold text-emerald-400">{record.cifNo || "PENDING"}</div>
            </div>
            <div className="border-t sm:border-t-0 sm:border-l border-slate-700 pt-2 sm:pt-0 sm:pl-4">
              <div className="text-[10px] uppercase font-bold text-orange-400 tracking-wider">Reference NO</div>
              <div className="text-sm font-mono font-bold text-slate-200">{record.refNo || "—"}</div>
            </div>
          </div>
        </div>

        {/* 4. Social Security Schemes (SSS) */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
            Social Security Schemes (SSS):
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                record.enrollAPY ? "bg-emerald-100 text-emerald-800 border border-emerald-300" : "bg-slate-200 text-slate-500"
              }`}
            >
              {record.enrollAPY ? "✓ APY (Enrolled)" : "— APY"}
            </span>
            <span
              className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                record.enrollPMSBY ? "bg-violet-100 text-violet-800 border border-violet-300" : "bg-slate-200 text-slate-500"
              }`}
            >
              {record.enrollPMSBY ? "✓ PMSBY (Enrolled)" : "— PMSBY"}
            </span>
            <span
              className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                record.enrollPMJJBY ? "bg-blue-100 text-blue-800 border border-blue-300" : "bg-slate-200 text-slate-500"
              }`}
            >
              {record.enrollPMJJBY ? "✓ PMJJBY (Enrolled)" : "— PMJJBY"}
            </span>
          </div>
        </div>

        {/* 5. Footer & Deliverables */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end pt-3 border-t border-orange-200">
          {/* Deliverables summary */}
          <div className="sm:col-span-1 text-xs text-slate-600 space-y-1">
            <div className="text-[10px] font-extrabold uppercase text-orange-700 tracking-wider">
              Deliverables Status
            </div>
            <div>
              Passbook:{" "}
              <span className="font-bold text-slate-800">
                {record.passbookIssued ? "Issued" : "Under Processing"}
              </span>
            </div>
            <div>
              ATM Card:{" "}
              <span className="font-bold text-slate-800">
                {record.atmIssued ? "Issued" : "Under Processing"}
              </span>
            </div>
          </div>

          {/* Customer Signature Box */}
          <div className="sm:col-span-1 flex flex-col items-center justify-end text-center pt-2 sm:pt-0">
            <div className="h-10 w-28 border border-dashed border-slate-300 rounded flex items-center justify-center text-[9px] text-slate-400 mb-1">
              Applicant Sign
            </div>
            <div className="text-[10px] font-extrabold text-slate-800 uppercase tracking-wider border-t border-slate-400 pt-1 w-28 text-center">
              Customer Sign
            </div>
          </div>

          {/* Authorized Seal */}
          <div className="sm:col-span-1 flex flex-col items-center sm:items-end justify-end text-center sm:text-right pt-2 sm:pt-0">
            {settings.stampSignatureUrl ? (
              <img
                src={settings.stampSignatureUrl}
                alt="Authorized Stamp"
                className="max-h-12 max-w-[100px] object-contain mb-1"
              />
            ) : (
              <div className="h-10 w-28 border border-dashed border-slate-300 rounded flex items-center justify-center text-[9px] text-slate-400 mb-1">
                Official Seal
              </div>
            )}
            <div className="text-[10px] font-extrabold text-slate-800 uppercase tracking-wider border-t border-slate-400 pt-1 w-32 text-center">
              Authorized Signatory
            </div>
          </div>
        </div>
      </div>

      {/* Direct print styles */}
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
          #bob-receipt-area {
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
            border: 2px solid #ea580c !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #bob-receipt-area * {
            visibility: visible !important;
          }
        }
      `}</style>
    </div>
  );
}
