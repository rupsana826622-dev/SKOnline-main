import React from "react";
import type { Customer, AppSettings } from "@/types";
import { DEFAULT_BOI_LOGO } from "@/constants";

interface AckSlipPrintProps {
  customer: Customer;
  settings: AppSettings;
}

function KeyValueRow({
  label,
  value,
  mono,
  isBold,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  isBold?: boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", marginBottom: "3.5px", fontSize: "9px" }}>
      <span
        style={{
          width: "95px",
          minWidth: "95px",
          maxWidth: "95px",
          fontWeight: "700",
          color: "#475569",
          flexShrink: 0,
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
      <span
        style={{
          flex: 1,
          fontWeight: isBold ? "800" : "600",
          color: "#000000",
          fontFamily: mono ? "monospace" : "inherit",
          wordBreak: "break-word",
          lineHeight: "1.2",
        }}
      >
        {value || "—"}
      </span>
    </div>
  );
}

export default function AckSlipPrint({ customer, settings }: AckSlipPrintProps) {
  const logo = settings.fiLogo || DEFAULT_BOI_LOGO;
  const now = new Date().toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const c_o = customer.fatherName
    ? `S/O: ${customer.fatherName}`
    : customer.spouseName
    ? `W/O / H/O: ${customer.spouseName}`
    : customer.motherName
    ? `D/O / S/O: ${customer.motherName}`
    : customer.guardianName
    ? `C/O: ${customer.guardianName}`
    : "—";

  const fullAddress = [
    customer.address,
    customer.village,
    customer.mandal,
    customer.district,
    customer.state,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div
      id="ack-slip-print"
      data-print-id="ack-slip-print"
      className="ack-slip-print customer-receipt-container bg-white text-black font-sans"
      style={{
        width: "210mm",
        minHeight: "144mm",
        maxHeight: "148mm",
        boxSizing: "border-box",
        padding: "6mm 8mm",
        margin: "0 auto",
        backgroundColor: "#ffffff",
        color: "#000000",
        fontSize: "9px",
        lineHeight: "1.25",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        pageBreakInside: "avoid",
        breakInside: "avoid",
      }}
    >
      {/* ═════════ 1. HEADER SECTION ═════════ */}
      <div style={{ borderBottom: "2px solid #000000", paddingBottom: "4px", marginBottom: "5px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {/* Top-Left: Logo & Bank Titles */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <img
              src={logo}
              alt="Bank Logo"
              style={{ height: "34px", width: "auto", objectFit: "contain" }}
            />
            <div>
              <div style={{ fontSize: "14px", fontWeight: "900", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                {settings.bankName || "BANK OF INDIA"}
              </div>
              <div style={{ fontSize: "9px", fontWeight: "800", color: "#1e3a8a", letterSpacing: "0.3px", textTransform: "uppercase" }}>
                CUSTOMER ACCOUNT ACKNOWLEDGEMENT SLIP (CSP HUB)
              </div>
            </div>
          </div>

          {/* Top-Right: Reference & Timing */}
          <div style={{ textAlign: "right", fontSize: "8.5px" }}>
            <div style={{ display: "inline-block", border: "1px solid #000", padding: "1px 6px", fontWeight: "800", fontFamily: "monospace", fontSize: "10px", backgroundColor: "#f8fafc" }}>
              REF: {customer.refNumber || "—"}
            </div>
            <div style={{ marginTop: "2px", color: "#475569" }}>
              <strong>Date:</strong> {customer.accountOpeningDate || now}
            </div>
          </div>
        </div>
      </div>

      {/* ═════════ 2. MAIN 2-COLUMN DETAILS ═════════ */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "4px" }}>
        {/* Left Column: Personal & Contact */}
        <div style={{ border: "1px solid #cbd5e1", borderRadius: "4px", padding: "5px 8px", backgroundColor: "#ffffff" }}>
          <div style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "2px", marginBottom: "4px", fontWeight: "800", fontSize: "9px", color: "#1e293b", textTransform: "uppercase", letterSpacing: "0.3px" }}>
            Customer Identification
          </div>

          <KeyValueRow label="Customer Name:" value={customer.name} isBold />
          <KeyValueRow label="Care of (C/O):" value={c_o} />
          <KeyValueRow label="Address:" value={fullAddress || "—"} />
          <KeyValueRow label="Contact No:" value={customer.mobile} mono isBold />
          <KeyValueRow
            label="DOB / Age:"
            value={`${customer.dob || "—"} ${customer.age ? `(${customer.age} Yrs)` : ""} · ${customer.sex || ""} · ${customer.category || ""}`}
          />
          {customer.panGir && <KeyValueRow label="PAN / GIR No:" value={customer.panGir} mono />}
          {customer.aadhaarNumber && (
            <KeyValueRow
              label="Aadhaar No:"
              value={customer.aadhaarNumber.replace(/(\d{4})/g, "$1 ").trim()}
              mono
            />
          )}
        </div>

        {/* Right Column: Banking & CSP Profile */}
        <div style={{ border: "1px solid #cbd5e1", borderRadius: "4px", padding: "5px 8px", backgroundColor: "#ffffff" }}>
          <div style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "2px", marginBottom: "4px", fontWeight: "800", fontSize: "9px", color: "#1e293b", textTransform: "uppercase", letterSpacing: "0.3px" }}>
            Account &amp; Branch Details
          </div>

          {/* Account Number Badge */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "5px", border: "1.5px solid #0f172a", borderRadius: "4px", padding: "3px 6px", backgroundColor: "#f8fafc" }}>
            <span style={{ fontSize: "8.5px", fontWeight: "800", textTransform: "uppercase" }}>Account No:</span>
            <span style={{ fontSize: "12px", fontWeight: "900", fontFamily: "monospace", letterSpacing: "0.5px", color: "#000" }}>
              {customer.accountNumber || "—"}
            </span>
          </div>

          {customer.customerId && <KeyValueRow label="Customer CIF:" value={customer.customerId} mono isBold />}
          <KeyValueRow label="IFSC Code:" value={customer.ifscCode || settings.ifscCode || "—"} mono isBold />
          <KeyValueRow label="Branch Name:" value={customer.branchCode || settings.cspBranchName || "—"} />
          <KeyValueRow label="CSP Center:" value={`${settings.cspName || "—"} (${settings.cspCode || "—"})`} />
          <KeyValueRow label="Opening Date:" value={customer.accountOpeningDate || now} />
        </div>
      </div>

      {/* ═════════ 3. NOMINEE & SOCIAL SECURITY SCHEMES ═════════ */}
      <div style={{ border: "1px solid #0f172a", borderRadius: "4px", padding: "4px 8px", marginBottom: "4px", backgroundColor: "#fcfdfe" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "nowrap" }}>
          <div>
            <strong style={{ color: "#334155" }}>Nomination:</strong>{" "}
            <span style={{ fontWeight: "700", color: "#000" }}>
              {customer.nomineeName ? `${customer.nomineeName} (${customer.nomineeRelationship || "Nominee"})` : "Registered in Core Banking System"}
            </span>
            {customer.nomineeDob ? ` · DOB: ${customer.nomineeDob}` : (customer.nomineeAge ? ` · Age: ${customer.nomineeAge} Yrs` : "")}
          </div>
          <div style={{ display: "flex", gap: "10px", fontWeight: "700", fontSize: "8.5px" }}>
            <span>PMJJBY: <strong style={{ color: customer.enrollPMJJBY ? "#15803d" : "#64748b" }}>{customer.enrollPMJJBY ? "✓ Enrolled" : "—"}</strong></span>
            <span>PMSBY: <strong style={{ color: customer.enrollPMSBY ? "#15803d" : "#64748b" }}>{customer.enrollPMSBY ? "✓ Enrolled" : "—"}</strong></span>
            <span>APY: <strong style={{ color: customer.enrollAPY ? "#15803d" : "#64748b" }}>{customer.enrollAPY ? `✓ (${customer.apyPensionSlab || "Active"})` : "—"}</strong></span>
          </div>
        </div>
      </div>

      {/* ═════════ 4. FOOTER & SEAL ═════════ */}
      <div style={{ borderTop: "1px solid #000000", paddingTop: "4px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div style={{ fontSize: "8px", color: "#334155", maxWidth: "60%" }}>
          <div style={{ fontWeight: "800", color: "#000" }}>
            Operator: {settings.operatorName || "Authorized BC / CSP Agent"}
          </div>
          <div>{settings.cspName} · Contact: {settings.operatorContact || "—"}</div>
          <div style={{ fontSize: "7px", color: "#64748b", marginTop: "1px" }}>
            * This acknowledgement slip serves as official proof of customer registration and account processing.
          </div>
        </div>

        {/* Dedicated Bordered Seal & Signature Box */}
        <div
          style={{
            border: "1.5px solid #000000",
            width: "135px",
            height: "40px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-end",
            padding: "2px",
            backgroundColor: "#ffffff",
            textAlign: "center",
          }}
        >
          <div style={{ borderTop: "0.5px solid #64748b", width: "90%", paddingTop: "1px", fontSize: "7.5px", fontWeight: "800", textTransform: "uppercase" }}>
            Authorised Signatory &amp; Seal
          </div>
        </div>
      </div>
    </div>
  );
}


