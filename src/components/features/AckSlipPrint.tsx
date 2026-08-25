import type { Customer } from "@/types";
import type { AppSettings } from "@/types";
import { POWERED_BY } from "@/constants";

interface AckSlipPrintProps {
  customer: Customer;
  settings: AppSettings;
}

export default function AckSlipPrint({ customer, settings }: AckSlipPrintProps) {
  const now = new Date().toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className="ack-slip-print print-area" id="ack-slip-print">
      {/* Top Bar */}
      <div style={{ borderBottom: "2px solid #000", paddingBottom: "6px", marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: "9px", fontWeight: "bold", color: "#555", letterSpacing: "0.5px" }}>REFERENCE NO.</div>
          <div style={{ fontFamily: "monospace", fontSize: "13px", fontWeight: "bold", color: "#000" }}>{customer.refNumber}</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "13px", fontWeight: "bold" }}>{settings.bankName.toUpperCase()}</div>
          <div style={{ fontSize: "8px", color: "#555", fontWeight: "600", letterSpacing: "0.3px" }}>CUSTOMER ACCOUNT ACKNOWLEDGEMENT SLIP</div>
        </div>
        <div style={{ fontSize: "8px", color: "#666", textAlign: "right" }}>
          <div>{now}</div>
        </div>
      </div>

      {/* 2-Column Details Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px", marginBottom: "10px" }}>
        {/* Left Column */}
        <div>
          <DetailRow label="Customer Name" value={customer.name} />
          <DetailRow label="C/O" value={customer.fatherName ? `S/O D/O ${customer.fatherName}` : customer.guardianName} />
          <DetailRow label="Address" value={`${customer.address}, ${customer.village}, ${customer.mandal}, ${customer.district}, ${customer.state}`} />
          <DetailRow label="Contact No." value={customer.mobile} />
          {customer.email && <DetailRow label="Email" value={customer.email} />}
        </div>
        {/* Right Column */}
        <div>
          <DetailRow label="Account Number" value={customer.accountNumber} mono />
          <DetailRow label="IFSC Code" value={settings.ifscCode} mono />
          <DetailRow label="Bank Branch" value={settings.cspBranchName} />
          <DetailRow label="CSP Center Name" value={settings.cspName} />
          <DetailRow label="CSP Code" value={settings.cspCode} mono />
          <DetailRow label="CSP Branch" value={settings.cspBranchName} />
        </div>
      </div>

      {/* Nomination Summary */}
      <div style={{ border: "1px solid #ccc", borderRadius: "4px", padding: "5px 8px", marginBottom: "8px", fontSize: "8px" }}>
        <strong>Nominee:</strong> {customer.nomineeName} ({customer.nomineeRelationship}) &nbsp;|&nbsp;
        <strong>Category:</strong> {customer.category} &nbsp;|&nbsp;
        <strong>DOB:</strong> {customer.dob}
      </div>

      {/* Footer */}
      <div style={{ borderTop: "1px solid #000", paddingTop: "6px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div style={{ fontSize: "8px", color: "#555" }}>
          <div style={{ fontWeight: "600" }}>Operator: {settings.operatorName}</div>
          <div>{settings.cspName} | {settings.cspCode}</div>
          <div style={{ marginTop: "2px", color: "#888" }}>{POWERED_BY}</div>
        </div>
        <div style={{ border: "1px solid #000", width: "110px", height: "44px", display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "3px", fontSize: "7px" }}>
          Authorised Signature &amp; Seal
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ marginBottom: "4px" }}>
      <div style={{ fontSize: "7.5px", fontWeight: "700", color: "#666", textTransform: "uppercase", letterSpacing: "0.3px" }}>{label}</div>
      <div style={{ fontSize: "9px", fontWeight: "500", color: "#000", fontFamily: mono ? "monospace" : "Arial", wordBreak: "break-word" }}>
        {value || "—"}
      </div>
    </div>
  );
}
