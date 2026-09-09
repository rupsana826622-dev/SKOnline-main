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
 * Standalone isolated print engine for Bank of Baroda Customer Acknowledgment Slip.
 * Inlines full typography, ink-saving light layout with thin borders, clean metadata binding, and stamp.
 */
export function printBobReceipt(record: BobCustomerRecord, customSettings?: BobSettings) {
  const settings = customSettings || getBobSettings();
  const printDate = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const fmt = (iso?: string | null) => {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const passbookStatus = record.passbookDelivered
    ? `Delivered (${fmt(record.passbookDeliveredAt) || "Recorded"})`
    : record.passbookIssued
    ? `Issued (${fmt(record.passbookIssuedAt) || "Recorded"})`
    : "Under Processing";

  const atmStatus = record.atmDelivered
    ? `Delivered (${fmt(record.atmDeliveredAt) || "Recorded"})`
    : record.atmIssued
    ? `Issued (${fmt(record.atmIssuedAt) || "Recorded"})`
    : "Under Processing";

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>BOB_Slip_SL_${record.slNo}_${record.customerName.replace(/[^a-zA-Z0-9]/g, "_")}</title>
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
      font-size: 11.5px;
      line-height: 1.4;
    }
    .receipt-container {
      width: 100%;
      max-width: 190mm;
      min-height: 132mm;
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
      height: 4px;
      background: linear-gradient(to right, #ea580c, #f97316, #fb923c);
      margin: -16px -20px 12px -20px;
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
      font-size: 18px;
      font-weight: 900;
      flex-shrink: 0;
      box-shadow: 0 2px 4px rgba(234, 88, 12, 0.2);
    }
    .bank-name {
      font-size: 17px;
      font-weight: 900;
      color: #ea580c;
      letter-spacing: -0.5px;
      margin: 0;
      line-height: 1.1;
    }
    .slip-tagline {
      font-size: 11.5px;
      font-weight: 700;
      color: #1e293b;
      margin-top: 1px;
    }
    .center-meta {
      font-size: 10.5px;
      color: #475569;
      margin-top: 2px;
      font-weight: 500;
    }
    .center-meta strong {
      color: #0f172a;
    }
    .slip-meta {
      text-align: right;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 3px;
    }
    .serial-circle {
      width: 28px;
      height: 28px;
      background: #ffedd5;
      color: #c2410c;
      border: 1.5px solid #ea580c;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 900;
      font-family: monospace;
    }
    .date-label {
      font-size: 10px;
      color: #64748b;
      font-weight: 600;
    }

    /* Branch & CSP Config Box */
    .branch-bar {
      display: flex;
      justify-content: space-between;
      background: #fff7ed;
      border: 1px solid #fed7aa;
      border-radius: 6px;
      padding: 6px 12px;
      font-size: 11px;
      margin-bottom: 12px;
      font-weight: 600;
      color: #9a3412;
    }
    .branch-bar span {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    /* Customer Details Grid */
    .details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 12px;
    }
    .detail-col {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 8px 12px;
      font-size: 11px;
      line-height: 1.6;
    }
    .section-title {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      color: #ea580c;
      border-bottom: 1px dashed #e2e8f0;
      padding-bottom: 3px;
      margin-bottom: 5px;
      letter-spacing: 0.5px;
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

    /* Financial & Account Box (White ink-saving layout) */
    .financial-card {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 10px;
      background: #ffffff;
      border: 1.5px solid #ea580c;
      border-radius: 8px;
      padding: 8px 12px;
      margin-bottom: 12px;
      text-align: center;
    }
    .amount-item .lbl {
      font-size: 9.5px;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
      margin-bottom: 2px;
    }
    .amount-item .val {
      font-size: 13.5px;
      font-family: monospace;
      font-weight: 900;
      color: #0f172a;
    }

    /* Schemes Status */
    .schemes-card {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 6px 12px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .scheme-badge {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 800;
    }
    .scheme-active {
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
    }
    .scheme-inactive {
      background: #f1f5f9;
      color: #94a3b8;
      border: 1px solid #e2e8f0;
    }

    /* Footer & Signatures */
    .footer-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      border-top: 1px solid #e2e8f0;
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
      max-width: 110px;
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
      width: 120px;
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
          <div class="slip-tagline">Customer Service Point (CSP) — Customer Acknowledgment Slip</div>
          <div class="center-meta">
            ${settings.cspName || "SK FINANCIAL & CSP SERVICES"} · CSP Code: <strong>${settings.cspCode || "BOB-CSP-1082"}</strong>
          </div>
        </div>
      </div>
      <div class="slip-meta">
        <div class="serial-circle" title="Serial Number">${record.slNo}</div>
        <div class="date-label">Slip Date: ${printDate}</div>
      </div>
    </div>

    <!-- 2. Dynamic Bound Branch & CSP Details -->
    <div class="branch-bar">
      <span><strong>CSP Address:</strong> ${settings.cspAddress || "Rampur"}</span>
      <span><strong>Link Branch:</strong> ${settings.linkBranch || settings.branchName || "Rajbari"}</span>
      <span><strong>IFSC Code:</strong> ${settings.ifscCode || "BARB0DBRAMP"}</span>
    </div>

    <!-- 3. Customer & Personal Details -->
    <div class="details-grid">
      <div class="detail-col">
        <div class="section-title">Customer Information</div>
        <div class="cust-name">${record.customerName || "—"}</div>
        <div>C/O (Guardian): <strong>${record.guardianName || "—"}</strong></div>
        <div>Mobile: <span class="data-val">${record.mobile || "—"}</span></div>
        ${record.dob ? `<div>DOB: <span class="data-val">${record.dob}</span></div>` : ""}
      </div>
      <div class="detail-col">
        <div class="section-title">Address & Registration</div>
        <div>Address: <strong>${record.address || "—"}</strong></div>
        <div>Aadhaar: <span class="data-val">${record.aadhaarNo ? "XXXX-XXXX-" + record.aadhaarNo.slice(-4) : "—"}</span></div>
        <div>Opening Date: <span class="data-val">${record.accountOpeningDate || printDate}</span></div>
      </div>
    </div>

    <!-- 4. Banking Identifiers (Clean White Ink-Saving Card) -->
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

    <!-- 5. Social Security Schemes (SSS) -->
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

    <!-- 6. Footer, Deliverables & Signatures -->
    <div class="footer-row">
      <div class="delivery-box">
        <div style="font-size: 9px; font-weight: 800; text-transform: uppercase; color: #ea580c; margin-bottom: 2px;">
          Deliverables Status
        </div>
        <div>Passbook: <strong>${passbookStatus}</strong></div>
        <div>ATM Card: <strong>${atmStatus}</strong></div>
      </div>

      <div class="sig-box">
        <div class="stamp-placeholder">
          Applicant Sign
        </div>
        <div class="sign-line">Customer Signature</div>
      </div>

      <div class="sig-box">
        ${
          settings.stampSignatureUrl
            ? `<img src="${settings.stampSignatureUrl}" alt="Stamp" class="stamp-img" />`
            : `<div class="stamp-placeholder">Official Seal</div>`
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
    <div className="bg-white rounded-2xl border-2 border-orange-500 p-6 shadow-md max-w-2xl w-full mx-auto space-y-4 text-xs">
      {/* Top Header */}
      <div className="flex items-start justify-between border-b-2 border-orange-500 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-600 text-white flex items-center justify-center font-black text-sm shadow-sm">
            BOB
          </div>
          <div>
            <h1 className="text-base font-black text-orange-600 tracking-tight leading-none">
              BANK OF BARODA
            </h1>
            <div className="text-[11px] font-bold text-slate-800 mt-0.5">
              Customer Service Point (CSP) — Customer Acknowledgment Slip
            </div>
            <div className="text-[10px] text-slate-500">
              {settings.cspName || "SK FINANCIAL & CSP SERVICES"} · CSP Code:{" "}
              <strong>{settings.cspCode || "BOB-CSP-1082"}</strong>
            </div>
          </div>
        </div>

        <div className="text-right flex flex-col items-end gap-1">
          <div className="w-7 h-7 rounded-full bg-orange-100 text-orange-700 border border-orange-500 font-mono font-bold flex items-center justify-center text-xs shadow-2xs">
            {record.slNo}
          </div>
          <div className="text-[10px] text-slate-400 font-semibold">{printDate}</div>
        </div>
      </div>

      {/* Dynamic Bound Branch & CSP Details Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-orange-50/70 border border-orange-200 rounded-lg text-[11px] font-semibold text-orange-950">
        <span><strong>CSP Address:</strong> {settings.cspAddress || "Rampur"}</span>
        <span><strong>Link Branch:</strong> {settings.linkBranch || settings.branchName || "Rajbari"}</span>
        <span><strong>IFSC Code:</strong> {settings.ifscCode || "BARB0DBRAMP"}</span>
      </div>

      {/* Customer Info Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1 text-[11px]">
          <div className="text-[10px] font-bold text-orange-600 uppercase border-b border-slate-100 pb-1">
            Customer Details
          </div>
          <div className="font-bold text-slate-900 text-xs">{record.customerName}</div>
          <div>C/O: <strong>{record.guardianName || "—"}</strong></div>
          <div>Mobile: <span className="font-mono font-semibold">{record.mobile}</span></div>
          {record.dob && <div>DOB: <span className="font-mono">{record.dob}</span></div>}
        </div>

        <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1 text-[11px]">
          <div className="text-[10px] font-bold text-orange-600 uppercase border-b border-slate-100 pb-1">
            Address & Identity
          </div>
          <div>Address: <strong>{record.address || "—"}</strong></div>
          <div>Aadhaar: <span className="font-mono">{record.aadhaarNo ? "XXXX-XXXX-" + record.aadhaarNo.slice(-4) : "—"}</span></div>
          <div>Opening Date: <span className="font-mono">{record.accountOpeningDate}</span></div>
        </div>
      </div>

      {/* Account Number Box (Ink-Saving White) */}
      <div className="grid grid-cols-3 gap-2 p-3 bg-white border-2 border-orange-500 rounded-xl text-center">
        <div>
          <div className="text-[9px] font-bold text-slate-500 uppercase">Account Number</div>
          <div className="font-mono font-black text-slate-900 text-sm">{record.accountNo || "PENDING"}</div>
        </div>
        <div>
          <div className="text-[9px] font-bold text-slate-500 uppercase">CIF Number</div>
          <div className="font-mono font-bold text-slate-900 text-xs">{record.cifNo || "PENDING"}</div>
        </div>
        <div>
          <div className="text-[9px] font-bold text-slate-500 uppercase">Reference Number</div>
          <div className="font-mono font-bold text-slate-900 text-xs">{record.refNo || "—"}</div>
        </div>
      </div>

      {/* Schemes Card */}
      <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px]">
        <span className="font-bold text-slate-600 uppercase">Social Security Schemes:</span>
        <div className="flex gap-2">
          <span className={`px-2 py-0.5 rounded font-bold ${record.enrollAPY ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-400"}`}>
            {record.enrollAPY ? "✓ APY" : "— APY"}
          </span>
          <span className={`px-2 py-0.5 rounded font-bold ${record.enrollPMSBY ? "bg-violet-100 text-violet-800" : "bg-slate-200 text-slate-400"}`}>
            {record.enrollPMSBY ? "✓ PMSBY" : "— PMSBY"}
          </span>
          <span className={`px-2 py-0.5 rounded font-bold ${record.enrollPMJJBY ? "bg-blue-100 text-blue-800" : "bg-slate-200 text-slate-400"}`}>
            {record.enrollPMJJBY ? "✓ PMJJBY" : "— PMJJBY"}
          </span>
        </div>
      </div>

      {/* Footer Signatures */}
      <div className="flex items-end justify-between pt-2 border-t border-slate-200 text-[10px]">
        <div className="text-slate-500 leading-tight">
          <div className="font-bold text-orange-600 uppercase text-[9px]">Deliverables:</div>
          <div>PB: {record.passbookDelivered ? "Delivered" : record.passbookIssued ? "Issued" : "Pending"}</div>
          <div>ATM: {record.atmDelivered ? "Delivered" : record.atmIssued ? "Issued" : "Pending"}</div>
        </div>

        <div className="text-center">
          <div className="h-8 flex items-center justify-center text-[9px] text-slate-300">
            Sign Here
          </div>
          <div className="border-t border-slate-600 pt-0.5 font-bold uppercase text-[9px] w-24">
            Customer Sign
          </div>
        </div>

        <div className="text-center">
          <div className="h-8 flex items-center justify-center">
            {settings.stampSignatureUrl ? (
              <img src={settings.stampSignatureUrl} alt="Stamp" className="max-h-8 max-w-20 object-contain" />
            ) : (
              <span className="text-[9px] text-slate-300">Official Seal</span>
            )}
          </div>
          <div className="border-t border-slate-600 pt-0.5 font-bold uppercase text-[9px] w-24">
            Authorized Sign
          </div>
        </div>
      </div>

      {showPrintButton && (
        <div className="pt-2 flex justify-end">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow transition-colors"
          >
            <Printer size={14} />
            <span>Print Customer Slip (Half-A4)</span>
          </button>
        </div>
      )}
    </div>
  );
}
