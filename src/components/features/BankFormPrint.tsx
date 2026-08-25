import type { Customer, AppSettings } from "@/types";

interface Props {
  customer: Customer;
  settings: AppSettings;
}

// ─── Character Grid Box ────────────────────────────────────────────────────────
function CharGrid({ value = "", cols = 20 }: { value?: string; cols?: number }) {
  const chars = String(value).toUpperCase().split("").slice(0, cols);
  const boxes = Array(cols).fill("").map((_, i) => chars[i] || "");
  return (
    <div style={{ display: "flex", gap: "1px" }}>
      {boxes.map((ch, i) => (
        <div key={i} style={{
          width: "16px", height: "18px", border: "1px solid #000",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "9px", fontFamily: "monospace", flexShrink: 0,
        }}>{ch}</div>
      ))}
    </div>
  );
}

// ─── Field Row with grid boxes ─────────────────────────────────────────────────
function FieldRow({ label, value = "", cols = 28, labelW = 140 }: {
  label: string; value?: string; cols?: number; labelW?: number;
}) {
  return (
    <tr>
      <td style={{ width: `${labelW}px`, fontWeight: 600, fontSize: "8.5px", padding: "3px 5px", verticalAlign: "middle", border: "1px solid #000", whiteSpace: "nowrap" }}>
        {label}
      </td>
      <td style={{ padding: "3px 5px", border: "1px solid #000" }}>
        <CharGrid value={value} cols={cols} />
      </td>
    </tr>
  );
}

// ─── Checkbox Row ──────────────────────────────────────────────────────────────
function CheckBox({ checked }: { checked: boolean }) {
  return (
    <div style={{ width: "11px", height: "11px", border: "1px solid #000", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "8px" }}>
      {checked ? "✓" : ""}
    </div>
  );
}

// ─── Section Header ────────────────────────────────────────────────────────────
function SectionBar({ title }: { title: string }) {
  return (
    <div style={{ fontWeight: "bold", fontSize: "9px", padding: "2px 5px", border: "1px solid #000", background: "#e8e8e8", marginBottom: "2px", marginTop: "6px" }}>
      {title}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// PAGE 1 — BOI No-Frill Account Application Form
// ════════════════════════════════════════════════════════════════════════════════
function Page1({ customer, settings }: Props) {
  return (
    <div style={{ fontFamily: "Arial, sans-serif", fontSize: "10px", color: "#000", background: "#fff", padding: "16px 20px", width: "100%", boxSizing: "border-box" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px", borderBottom: "2px solid #000", paddingBottom: "4px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "44px", height: "44px", border: "2px solid #000", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "7px", fontWeight: "bold", textAlign: "center" }}>
            BANK<br />LOGO
          </div>
          <div>
            <div style={{ fontWeight: "bold", fontSize: "13px" }}>{settings.bankName}</div>
            <div style={{ fontSize: "8px", color: "#555" }}>Financial Inclusion Scheme</div>
          </div>
        </div>
        <div style={{ border: "1px solid #000", padding: "4px 7px", fontSize: "8px" }}>
          <div style={{ fontWeight: "bold", textAlign: "center", marginBottom: "3px" }}>FOR BANK USE ONLY</div>
          <table style={{ borderCollapse: "collapse", fontSize: "7.5px" }}>
            <tbody>
              {[
                ["BRANCH CODE", settings.branchCode, 8],
                ["Customer ID", customer.customerId, 10],
                ["Account No.", customer.accountNumber, 14],
              ].map(([lbl, val, c]) => (
                <tr key={String(lbl)}>
                  <td style={{ border: "1px solid #000", padding: "2px 4px", fontWeight: 600 }}>{lbl}</td>
                  <td style={{ border: "1px solid #000", padding: "2px" }}>
                    <CharGrid value={String(val)} cols={Number(c)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Title */}
      <div style={{ fontWeight: "bold", fontSize: "11px", textAlign: "center", border: "2px solid #000", padding: "4px 8px", margin: "4px 0 6px" }}>
        FINANCIAL INCLUSION APPLICATION FOR BASIC SB NO FRILL ACCOUNT
      </div>

      {/* Name/Address grid fields */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "4px" }}>
        <tbody>
          <FieldRow label="Name in Full" value={customer.name} cols={32} />
          <FieldRow label="Father's Name" value={customer.fatherName} cols={32} />
          <FieldRow label="Mother's Name" value={customer.motherName} cols={32} />
          <FieldRow label="Name of the Spouse" value={customer.spouseName} cols={30} />
          <FieldRow label="Address" value={customer.address} cols={34} />
          <FieldRow label="Village" value={customer.village} cols={22} />
          <FieldRow label="Mandal / Tehsil" value={customer.mandal} cols={22} />
          <FieldRow label="District" value={customer.district} cols={22} />
          <FieldRow label="State" value={customer.state} cols={22} />
        </tbody>
      </table>

      {/* Sex / Age / DOB Row */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "4px" }}>
        <tbody>
          <tr>
            <td style={{ border: "1px solid #000", padding: "3px 5px", fontWeight: 600, fontSize: "8.5px", width: "35px" }}>Sex</td>
            <td style={{ border: "1px solid #000", padding: "3px 5px" }}>
              <div style={{ display: "flex", gap: "10px" }}>
                {["Male", "Female", "Other"].map(s => (
                  <label key={s} style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: "8.5px" }}>
                    <CheckBox checked={customer.sex === s} /> {s}
                  </label>
                ))}
              </div>
            </td>
            <td style={{ border: "1px solid #000", padding: "3px 5px", fontWeight: 600, fontSize: "8.5px", width: "28px" }}>Age</td>
            <td style={{ border: "1px solid #000", padding: "3px 5px", width: "60px" }}>
              <CharGrid value={String(customer.age)} cols={3} />
            </td>
            <td style={{ border: "1px solid #000", padding: "3px 5px", fontWeight: 600, fontSize: "8.5px", width: "75px" }}>Date of Birth</td>
            <td style={{ border: "1px solid #000", padding: "3px 5px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "2px", fontSize: "8px" }}>
                <span>D</span><CharGrid value={customer.dob.slice(0, 2)} cols={2} />
                <span>M</span><CharGrid value={customer.dob.slice(3, 5)} cols={2} />
                <span>Y</span><CharGrid value={customer.dob.slice(6, 10)} cols={4} />
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Category */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "4px" }}>
        <tbody>
          <tr>
            <td style={{ border: "1px solid #000", padding: "3px 5px", fontWeight: 600, fontSize: "8.5px", width: "75px" }}>Belongs to</td>
            <td style={{ border: "1px solid #000", padding: "3px 5px" }}>
              <div style={{ display: "flex", gap: "14px" }}>
                {["OBC", "BC", "SC", "ST", "Gen"].map(cat => (
                  <label key={cat} style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: "8.5px" }}>
                    <CheckBox checked={customer.category === cat} /> {cat}
                  </label>
                ))}
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Income / PAN / Mobile */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "4px" }}>
        <tbody>
          <tr>
            <td style={{ border: "1px solid #000", padding: "3px 5px", fontWeight: 600, fontSize: "8.5px", width: "100px" }}>Annual Income ₹</td>
            <td style={{ border: "1px solid #000", padding: "3px 5px" }}><CharGrid value={customer.annualIncome} cols={12} /></td>
            <td style={{ border: "1px solid #000", padding: "3px 5px", fontWeight: 600, fontSize: "8.5px", width: "75px" }}>GIR/PAN No.</td>
            <td style={{ border: "1px solid #000", padding: "3px 5px" }}><CharGrid value={customer.panGir} cols={12} /></td>
          </tr>
          <tr>
            <td style={{ border: "1px solid #000", padding: "3px 5px", fontWeight: 600, fontSize: "8.5px" }}>Mobile Number</td>
            <td style={{ border: "1px solid #000", padding: "3px 5px" }}><CharGrid value={customer.mobile} cols={12} /></td>
            <td style={{ border: "1px solid #000", padding: "3px 5px", fontWeight: 600, fontSize: "8.5px" }}>Email (Optional)</td>
            <td style={{ border: "1px solid #000", padding: "3px 5px" }}><CharGrid value={customer.email} cols={20} /></td>
          </tr>
        </tbody>
      </table>

      {/* Nomination */}
      <SectionBar title="DETAILS OF NOMINATION" />
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "4px", fontSize: "8px" }}>
        <thead>
          <tr>
            {["SB A/c No.", "Name of the Nominee", "Relationship", "Age", "DOB (if Minor)", "Person authorised to receive amount"].map(h => (
              <th key={h} style={{ border: "1px solid #000", padding: "2px 4px", fontWeight: 600, fontSize: "7.5px", background: "#f0f0f0" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ border: "1px solid #000", padding: "3px 4px" }}>{customer.sbAccountNo}</td>
            <td style={{ border: "1px solid #000", padding: "3px 4px" }}>{customer.nomineeName}</td>
            <td style={{ border: "1px solid #000", padding: "3px 4px" }}>{customer.nomineeRelationship}</td>
            <td style={{ border: "1px solid #000", padding: "3px 4px" }}>{customer.nomineeAge}</td>
            <td style={{ border: "1px solid #000", padding: "3px 4px" }}>{customer.nomineeDob}</td>
            <td style={{ border: "1px solid #000", padding: "3px 4px" }}>{customer.guardianName}</td>
          </tr>
          <tr><td colSpan={6} style={{ border: "1px solid #000", height: "14px" }}></td></tr>
        </tbody>
      </table>

      {/* Declaration */}
      <div style={{ border: "1px solid #000", padding: "4px 7px", fontSize: "7.5px", marginBottom: "5px", lineHeight: 1.5 }}>
        <strong>DECLARATION:</strong> I/We hereby declare that the particulars given above are correct and complete. I agree to be bound by the terms and conditions applicable to this account as amended from time to time and I/We are aware about the features of the No-Frill Account / Financial Inclusion Scheme. I/We shall inform the bank in writing in the event of any change in the above information. I authorise {settings.bankName} to debit my/our account for applicable charges, if any.
      </div>

      {/* Photo & Signature */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "5px" }}>
        <div style={{ border: "1px solid #000", width: "80px", height: "90px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "7.5px", textAlign: "center", padding: "4px", flexShrink: 0 }}>
          Affix Passport Size Photograph here
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ fontSize: "8.5px" }}>
            <div style={{ marginBottom: "4px" }}>Place : _________________________</div>
            <div>Date  : _________________________</div>
          </div>
          <div style={{ border: "1px solid #000", height: "48px", display: "flex", alignItems: "flex-end", padding: "4px", fontSize: "8px" }}>
            Signature / LHTI of Applicant
          </div>
        </div>
      </div>

      {/* Introducer */}
      <SectionBar title="DETAILS OF INTRODUCTION" />
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          <FieldRow label="Name of person Introduced" value={customer.introducerName} cols={28} />
          <FieldRow label="A/c No." value={customer.introducerAccountNo} cols={16} />
          <FieldRow label="Branch" value={customer.introducerBranch} cols={20} />
          <tr>
            <td colSpan={2} style={{ border: "1px solid #000", padding: "3px 5px", fontSize: "8.5px" }}>
              I know the above person for the past <strong>{customer.introducerYears || "__"}</strong> Year(s)
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Signature of Introducer : _____________________________
            </td>
          </tr>
        </tbody>
      </table>

      <div style={{ marginTop: "6px", fontSize: "7.5px", color: "#555", textAlign: "center" }}>
        Generated by SK ONLINE CSP Portal — Powered by Digital Solutions
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// PAGE 2 — Customer Profile Sheet (CPS / Annexure 1)
// ════════════════════════════════════════════════════════════════════════════════
function Page2({ customer, settings }: Props) {
  return (
    <div style={{ fontFamily: "Arial, sans-serif", fontSize: "10px", color: "#000", background: "#fff", padding: "16px 20px", width: "100%", boxSizing: "border-box" }}>
      <div style={{ fontWeight: "bold", fontSize: "12px", textAlign: "center", border: "2px solid #000", padding: "4px", marginBottom: "6px" }}>
        CUSTOMER PROFILE SHEET — ANNEXURE I (KYC CPS)
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "5px" }}>
        <tbody>
          {[
            ["Bank Name", settings.bankName],
            ["Sol ID", customer.solId || settings.solId],
            ["Zone", customer.zone || settings.zone],
            ["Branch Code", settings.branchCode],
            ["Customer Name", customer.name],
            ["Account Number", customer.accountNumber],
            ["Mobile", customer.mobile],
            ["DOB", customer.dob],
          ].map(([lbl, val]) => (
            <tr key={lbl}>
              <td style={{ border: "1px solid #000", padding: "3px 6px", fontWeight: 600, fontSize: "8.5px", width: "150px", background: "#f5f5f5" }}>{lbl}</td>
              <td style={{ border: "1px solid #000", padding: "3px 6px", fontSize: "9px" }}>{val}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <SectionBar title="DEMOGRAPHIC PROFILE" />
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "5px" }}>
        <tbody>
          <tr>
            <td style={{ border: "1px solid #000", padding: "3px 6px", fontWeight: 600, fontSize: "8.5px", width: "150px", background: "#f5f5f5" }}>Education Level</td>
            <td style={{ border: "1px solid #000", padding: "3px 6px", fontSize: "9px" }}>{customer.educationLevel || "—"}</td>
            <td style={{ border: "1px solid #000", padding: "3px 6px", fontWeight: 600, fontSize: "8.5px", width: "150px", background: "#f5f5f5" }}>Occupation Type</td>
            <td style={{ border: "1px solid #000", padding: "3px 6px", fontSize: "9px" }}>{customer.occupationType || "—"}</td>
          </tr>
          <tr>
            <td style={{ border: "1px solid #000", padding: "3px 6px", fontWeight: 600, fontSize: "8.5px", background: "#f5f5f5" }}>Annual Income Tier</td>
            <td style={{ border: "1px solid #000", padding: "3px 6px", fontSize: "9px" }}>{customer.annualIncomeTier || "—"}</td>
            <td style={{ border: "1px solid #000", padding: "3px 6px", fontWeight: 600, fontSize: "8.5px", background: "#f5f5f5" }}>Category</td>
            <td style={{ border: "1px solid #000", padding: "3px 6px", fontSize: "9px" }}>{customer.category}</td>
          </tr>
          <tr>
            <td style={{ border: "1px solid #000", padding: "3px 6px", fontWeight: 600, fontSize: "8.5px", background: "#f5f5f5" }}>Annual Income (₹)</td>
            <td style={{ border: "1px solid #000", padding: "3px 6px", fontSize: "9px" }}>{customer.annualIncome ? `₹${customer.annualIncome}` : "—"}</td>
            <td style={{ border: "1px solid #000", padding: "3px 6px", fontWeight: 600, fontSize: "8.5px", background: "#f5f5f5" }}>Profession</td>
            <td style={{ border: "1px solid #000", padding: "3px 6px", fontSize: "9px" }}>{customer.profession || "—"}</td>
          </tr>
          <tr>
            <td style={{ border: "1px solid #000", padding: "3px 6px", fontWeight: 600, fontSize: "8.5px", background: "#f5f5f5" }}>Turnover ({customer.turnoverType})</td>
            <td style={{ border: "1px solid #000", padding: "3px 6px", fontSize: "9px" }}>{customer.turnoverAmount ? `₹${customer.turnoverAmount}` : "—"}</td>
            <td style={{ border: "1px solid #000", padding: "3px 6px", fontWeight: 600, fontSize: "8.5px", background: "#f5f5f5" }}>Politically Prominent</td>
            <td style={{ border: "1px solid #000", padding: "3px 6px", fontSize: "9px" }}>{customer.politicallyProminent}</td>
          </tr>
        </tbody>
      </table>

      <SectionBar title="RISK CLASSIFICATION" />
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "5px" }}>
        <tbody>
          <tr>
            <td style={{ border: "1px solid #000", padding: "4px 6px", width: "200px", fontWeight: 600, fontSize: "8.5px", background: "#f5f5f5" }}>Risk Category</td>
            <td style={{ border: "1px solid #000", padding: "4px 6px" }}>
              <div style={{ display: "flex", gap: "20px" }}>
                {["Low", "Medium", "High"].map(r => (
                  <label key={r} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "9px" }}>
                    <CheckBox checked={customer.riskCategory === r} /> {r}
                  </label>
                ))}
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <SectionBar title="SCHEME ENROLLMENT STATUS" />
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "5px" }}>
        <tbody>
          {[
            ["PMJJBY (Life Insurance)", customer.enrollPMJJBY ? `Enrolled — Premium: ${customer.pmjjbyPremiumTier}` : "Not Enrolled"],
            ["PMSBY (Accident Insurance)", customer.enrollPMSBY ? "Enrolled — Premium: ₹20" : "Not Enrolled"],
            ["APY (Atal Pension Yojana)", customer.enrollAPY ? `Enrolled — Pension Slab: ${customer.apyPensionSlab}` : "Not Enrolled"],
          ].map(([lbl, val]) => (
            <tr key={String(lbl)}>
              <td style={{ border: "1px solid #000", padding: "3px 6px", fontWeight: 600, fontSize: "8.5px", width: "200px", background: "#f5f5f5" }}>{lbl}</td>
              <td style={{ border: "1px solid #000", padding: "3px 6px", fontSize: "9px", color: String(val).includes("Not") ? "#555" : "#000", fontWeight: String(val).includes("Enrolled —") ? 600 : 400 }}>{val}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <SectionBar title="DECLARATION & CERTIFICATION" />
      <div style={{ border: "1px solid #000", padding: "5px 7px", fontSize: "7.5px", marginBottom: "10px", lineHeight: 1.6 }}>
        I/We declare that the information given above is true and correct to the best of my/our knowledge. I/We understand that providing false information is punishable under the law. I authorise {settings.bankName} to use this information for KYC/AML compliance purposes.
      </div>

      {/* Signature Zone */}
      <div style={{ display: "flex", gap: "20px", marginTop: "10px" }}>
        <div style={{ flex: 1 }}>
          <div style={{ borderTop: "1px solid #000", paddingTop: "3px", fontSize: "8px", textAlign: "center" }}>
            Signature of Customer
          </div>
          <div style={{ fontSize: "8px", color: "#555", textAlign: "center" }}>Date: ________________</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ borderTop: "1px solid #000", paddingTop: "3px", fontSize: "8px", textAlign: "center" }}>
            Signature of CSP Operator
          </div>
          <div style={{ fontSize: "8px", color: "#555", textAlign: "center" }}>{settings.operatorName} | {settings.cspCode}</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ borderTop: "1px solid #000", paddingTop: "3px", fontSize: "8px", textAlign: "center" }}>
            For Bank Use (Verified By)
          </div>
          <div style={{ fontSize: "8px", color: "#555", textAlign: "center" }}>Date: ________________</div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// PAGE 3 — PMJJBY Consent-cum-Declaration Form
// ════════════════════════════════════════════════════════════════════════════════
function Page3PMJJBY({ customer, settings }: Props) {
  return (
    <div style={{ fontFamily: "Arial, sans-serif", fontSize: "10px", color: "#000", background: "#fff", padding: "16px 20px", width: "100%", boxSizing: "border-box" }}>
      <div style={{ fontWeight: "bold", fontSize: "11px", textAlign: "center", border: "2px solid #000", padding: "5px", marginBottom: "6px" }}>
        PRADHAN MANTRI JEEVAN JYOTI BIMA YOJANA (PMJJBY)<br />
        <span style={{ fontSize: "9px", fontWeight: "normal" }}>Consent-cum-Declaration Form</span>
      </div>

      <div style={{ border: "1px solid #000", padding: "5px 7px", fontSize: "7.5px", marginBottom: "5px", lineHeight: 1.6 }}>
        <strong>Scheme Benefits:</strong> PMJJBY offers a renewable one-year life cover of <strong>₹2,00,000/-</strong> to all savings bank account holders in the age group of <strong>18 to 50 years</strong>. The premium is auto-debited from the savings account annually on 31st May.
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "5px" }}>
        <tbody>
          {[
            ["Subscriber Name", customer.name],
            ["Account Number", customer.accountNumber],
            ["Date of Birth", customer.dob],
            ["Mobile", customer.mobile],
            ["Nominee Name", customer.nomineeName],
            ["Nominee Relationship", customer.nomineeRelationship],
            ["Nominee Age", customer.nomineeAge],
            ["Premium Tier Selected", customer.pmjjbyPremiumTier],
            ["KYC Document Type", customer.pmjjbyKycType],
            ["KYC Document ID", customer.pmjjbyKycId],
            ["Disability Status", customer.pmjjbyDisability],
            ["Disability Details", customer.pmjjbyDisabilityDetails || "N/A"],
          ].map(([lbl, val]) => (
            <tr key={String(lbl)}>
              <td style={{ border: "1px solid #000", padding: "3px 6px", fontWeight: 600, fontSize: "8.5px", width: "170px", background: "#f5f5f5" }}>{lbl}</td>
              <td style={{ border: "1px solid #000", padding: "3px 6px", fontSize: "9px" }}>{val || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ border: "1px solid #000", padding: "5px 7px", fontSize: "7.5px", marginBottom: "8px", lineHeight: 1.6 }}>
        <strong>DECLARATION:</strong> I hereby apply for enrollment under the Pradhan Mantri Jeevan Jyoti Bima Yojana (PMJJBY) and give my consent to auto-debit the premium from my above savings account. I understand that the scheme provides life insurance cover of ₹2,00,000/- in case of my death due to any cause. I declare that:
        <ul style={{ paddingLeft: "12px", marginTop: "4px" }}>
          <li>I am in the age group 18–50 years.</li>
          <li>I have a savings bank account with {settings.bankName}.</li>
          <li>The above nominee details are correct.</li>
          <li>I agree to the terms and conditions of the PMJJBY scheme.</li>
        </ul>
      </div>

      <div style={{ display: "flex", gap: "20px" }}>
        <div style={{ flex: 1 }}>
          <div style={{ borderTop: "1px solid #000", paddingTop: "3px", fontSize: "8px", textAlign: "center" }}>Subscriber Signature / LTI</div>
          <div style={{ fontSize: "8px", color: "#555", textAlign: "center" }}>Date: _______________</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ borderTop: "1px solid #000", paddingTop: "3px", fontSize: "8px", textAlign: "center" }}>CSP / Bank Authorisation</div>
          <div style={{ fontSize: "8px", color: "#555", textAlign: "center" }}>{settings.cspName}</div>
        </div>
      </div>
      <div style={{ marginTop: "8px", fontSize: "7.5px", color: "#555", textAlign: "center" }}>
        CSP: {settings.cspName} | Code: {settings.cspCode} | IFSC: {settings.ifscCode} — SK ONLINE Portal
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// PAGE 4 — PMSBY Consent-cum-Declaration Form
// ════════════════════════════════════════════════════════════════════════════════
function Page4PMSBY({ customer, settings }: Props) {
  return (
    <div style={{ fontFamily: "Arial, sans-serif", fontSize: "10px", color: "#000", background: "#fff", padding: "16px 20px", width: "100%", boxSizing: "border-box" }}>
      <div style={{ fontWeight: "bold", fontSize: "11px", textAlign: "center", border: "2px solid #000", padding: "5px", marginBottom: "6px" }}>
        PRADHAN MANTRI SURAKSHA BIMA YOJANA (PMSBY)<br />
        <span style={{ fontSize: "9px", fontWeight: "normal" }}>Consent-cum-Declaration Form</span>
      </div>

      <div style={{ border: "1px solid #000", padding: "5px 7px", fontSize: "7.5px", marginBottom: "5px", lineHeight: 1.6 }}>
        <strong>Scheme Benefits:</strong> PMSBY offers a renewable one-year accidental death and disability cover of <strong>₹2,00,000/-</strong> (death/permanent disability) and <strong>₹1,00,000/-</strong> (partial disability) at an annual premium of just <strong>₹20/-</strong> for savings bank account holders aged 18–70 years.
      </div>

      <div style={{ border: "1px solid #444", padding: "3px 7px", fontSize: "8.5px", marginBottom: "5px", background: "#f9f9f9", fontWeight: 600 }}>
        Annual Premium: ₹20.00 (Auto-debited from savings account)
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "5px" }}>
        <tbody>
          {[
            ["Subscriber Name", customer.name],
            ["Account Number", customer.accountNumber],
            ["Date of Birth", customer.dob],
            ["Mobile", customer.mobile],
            ["Nominee Name", customer.nomineeName],
            ["Nominee Relationship", customer.nomineeRelationship],
            ["KYC Document Type", customer.pmsbyKycType],
            ["KYC Document ID", customer.pmsbyKycId],
            ["Disability Status", customer.pmsbyDisability],
            ["Disability Details", customer.pmsbyDisabilityDetails || "N/A"],
          ].map(([lbl, val]) => (
            <tr key={String(lbl)}>
              <td style={{ border: "1px solid #000", padding: "3px 6px", fontWeight: 600, fontSize: "8.5px", width: "170px", background: "#f5f5f5" }}>{lbl}</td>
              <td style={{ border: "1px solid #000", padding: "3px 6px", fontSize: "9px" }}>{val || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ border: "1px solid #000", padding: "5px 7px", fontSize: "7.5px", marginBottom: "8px", lineHeight: 1.6 }}>
        <strong>DECLARATION:</strong> I hereby apply for enrollment under the Pradhan Mantri Suraksha Bima Yojana (PMSBY) and give my consent to auto-debit ₹20/- annually from my savings account. I declare that I am in the age group of 18–70 years and have a savings account with {settings.bankName}. I agree to the terms and conditions of the PMSBY scheme. I nominate the above person to receive the benefits in my absence.
      </div>

      <div style={{ display: "flex", gap: "20px" }}>
        <div style={{ flex: 1 }}>
          <div style={{ borderTop: "1px solid #000", paddingTop: "3px", fontSize: "8px", textAlign: "center" }}>Subscriber Signature / LTI</div>
          <div style={{ fontSize: "8px", color: "#555", textAlign: "center" }}>Date: _______________</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ borderTop: "1px solid #000", paddingTop: "3px", fontSize: "8px", textAlign: "center" }}>CSP / Bank Authorisation</div>
          <div style={{ fontSize: "8px", color: "#555", textAlign: "center" }}>{settings.cspName}</div>
        </div>
      </div>
      <div style={{ marginTop: "8px", fontSize: "7.5px", color: "#555", textAlign: "center" }}>
        CSP: {settings.cspName} | Code: {settings.cspCode} | IFSC: {settings.ifscCode} — SK ONLINE Portal
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// PAGE 5 — APY Subscriber Registration Form
// ════════════════════════════════════════════════════════════════════════════════
function Page5APY({ customer, settings }: Props) {
  return (
    <div style={{ fontFamily: "Arial, sans-serif", fontSize: "10px", color: "#000", background: "#fff", padding: "16px 20px", width: "100%", boxSizing: "border-box" }}>
      <div style={{ fontWeight: "bold", fontSize: "11px", textAlign: "center", border: "2px solid #000", padding: "5px", marginBottom: "6px" }}>
        ATAL PENSION YOJANA (APY)<br />
        <span style={{ fontSize: "9px", fontWeight: "normal" }}>Subscriber Registration Form &amp; Acknowledgement</span>
      </div>

      <div style={{ border: "1px solid #000", padding: "5px 7px", fontSize: "7.5px", marginBottom: "5px", lineHeight: 1.6 }}>
        <strong>About APY:</strong> Atal Pension Yojana (APY) is a guaranteed pension scheme for citizens of India aged 18–40. Subscribers receive a fixed monthly pension of ₹1,000/-, ₹2,000/-, ₹3,000/-, ₹4,000/- or ₹5,000/- on reaching age 60. The contributions vary based on age at entry and pension amount.
      </div>

      <SectionBar title="SUBSCRIBER DETAILS" />
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "5px" }}>
        <tbody>
          {[
            ["Subscriber Name", customer.name],
            ["Date of Birth", customer.dob],
            ["Account Number", customer.accountNumber],
            ["Mobile Number", customer.mobile],
            ["Marital Status", customer.apyMaritalStatus],
            ...(customer.apyMaritalStatus === "Married" ? [
              ["Spouse Name", customer.apySpouseName],
              ["Spouse Date of Birth", customer.apySpouseDob],
            ] : []),
            ["Nominee Name", customer.nomineeName],
            ["Nominee Relationship", customer.nomineeRelationship],
            ["Nominee Age", customer.nomineeAge],
          ].map(([lbl, val]) => (
            <tr key={String(lbl)}>
              <td style={{ border: "1px solid #000", padding: "3px 6px", fontWeight: 600, fontSize: "8.5px", width: "170px", background: "#f5f5f5" }}>{lbl}</td>
              <td style={{ border: "1px solid #000", padding: "3px 6px", fontSize: "9px" }}>{val || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <SectionBar title="PENSION PLAN SELECTION" />
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "5px" }}>
        <tbody>
          <tr>
            <td style={{ border: "1px solid #000", padding: "4px 6px", fontWeight: 600, fontSize: "8.5px", background: "#f5f5f5", width: "170px" }}>Pension Amount Slab</td>
            <td style={{ border: "1px solid #000", padding: "4px 6px" }}>
              <div style={{ display: "flex", gap: "14px" }}>
                {["₹1,000", "₹2,000", "₹3,000", "₹4,000", "₹5,000"].map(s => (
                  <label key={s} style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: "8.5px" }}>
                    <CheckBox checked={customer.apyPensionSlab === s} /> {s}
                  </label>
                ))}
              </div>
            </td>
          </tr>
          <tr>
            <td style={{ border: "1px solid #000", padding: "4px 6px", fontWeight: 600, fontSize: "8.5px", background: "#f5f5f5" }}>Contribution Frequency</td>
            <td style={{ border: "1px solid #000", padding: "4px 6px" }}>
              <div style={{ display: "flex", gap: "14px" }}>
                {["Monthly", "Quarterly", "Half-Yearly"].map(f => (
                  <label key={f} style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: "8.5px" }}>
                    <CheckBox checked={customer.apyContributionFreq === f} /> {f}
                  </label>
                ))}
              </div>
            </td>
          </tr>
          <tr>
            <td style={{ border: "1px solid #000", padding: "4px 6px", fontWeight: 600, fontSize: "8.5px", background: "#f5f5f5" }}>Income Tax Payer</td>
            <td style={{ border: "1px solid #000", padding: "4px 6px" }}>
              <div style={{ display: "flex", gap: "14px" }}>
                {["No", "Yes"].map(opt => (
                  <label key={opt} style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: "8.5px" }}>
                    <CheckBox checked={customer.apyTaxPayer === opt} /> {opt}
                  </label>
                ))}
              </div>
            </td>
          </tr>
          <tr>
            <td style={{ border: "1px solid #000", padding: "4px 6px", fontWeight: 600, fontSize: "8.5px", background: "#f5f5f5" }}>Social Security Beneficiary</td>
            <td style={{ border: "1px solid #000", padding: "4px 6px" }}>
              <div style={{ display: "flex", gap: "14px" }}>
                {["No", "Yes"].map(opt => (
                  <label key={opt} style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: "8.5px" }}>
                    <CheckBox checked={customer.apySocialSecurity === opt} /> {opt}
                  </label>
                ))}
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div style={{ border: "1px solid #000", padding: "5px 7px", fontSize: "7.5px", marginBottom: "8px", lineHeight: 1.6 }}>
        <strong>DECLARATION:</strong> I hereby voluntarily opt for the Atal Pension Yojana (APY) and authorize {settings.bankName} to auto-debit the applicable contribution amount from my above savings account. I declare that I am an Indian citizen aged between 18–40 years. I understand that the pension will commence from age 60. I am not a member of any other statutory social security scheme. The above-mentioned nominee will receive the accumulated pension wealth in case of my death before age 60.
      </div>

      {/* Acknowledgement stub */}
      <div style={{ border: "2px solid #000", padding: "5px 7px", marginBottom: "5px" }}>
        <div style={{ fontWeight: "bold", fontSize: "9px", marginBottom: "3px", textAlign: "center" }}>— ACKNOWLEDGEMENT STUB (Bank Copy) —</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "8px" }}>
          <tbody>
            <tr>
              <td style={{ padding: "2px 5px" }}>Name: <strong>{customer.name}</strong></td>
              <td style={{ padding: "2px 5px" }}>A/c: <strong>{customer.accountNumber}</strong></td>
              <td style={{ padding: "2px 5px" }}>Pension: <strong>{customer.apyPensionSlab}/month</strong></td>
              <td style={{ padding: "2px 5px" }}>Ref: <strong>{customer.refNumber}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", gap: "20px" }}>
        <div style={{ flex: 1 }}>
          <div style={{ borderTop: "1px solid #000", paddingTop: "3px", fontSize: "8px", textAlign: "center" }}>Subscriber Signature / LTI</div>
          <div style={{ fontSize: "8px", color: "#555", textAlign: "center" }}>Date: _______________</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ borderTop: "1px solid #000", paddingTop: "3px", fontSize: "8px", textAlign: "center" }}>CSP / Bank Officer</div>
          <div style={{ fontSize: "8px", color: "#555", textAlign: "center" }}>{settings.operatorName} | {settings.cspCode}</div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// Main Export — BankFormPrint (wrapper with page breaks)
// ════════════════════════════════════════════════════════════════════════════════
export default function BankFormPrint({ customer, settings }: Props) {
  return (
    <div id="bank-form-print">
      {/* Page 1 — Always shown */}
      <div className="print-page">
        <Page1 customer={customer} settings={settings} />
      </div>

      {/* Page 2 — CPS — Always shown */}
      <div className="print-page print-page-break">
        <Page2 customer={customer} settings={settings} />
      </div>

      {/* Page 3 — PMJJBY — Conditional */}
      {customer.enrollPMJJBY && (
        <div className="print-page print-page-break">
          <Page3PMJJBY customer={customer} settings={settings} />
        </div>
      )}

      {/* Page 4 — PMSBY — Conditional */}
      {customer.enrollPMSBY && (
        <div className="print-page print-page-break">
          <Page4PMSBY customer={customer} settings={settings} />
        </div>
      )}

      {/* Page 5 — APY — Conditional */}
      {customer.enrollAPY && (
        <div className="print-page print-page-break">
          <Page5APY customer={customer} settings={settings} />
        </div>
      )}
    </div>
  );
}
