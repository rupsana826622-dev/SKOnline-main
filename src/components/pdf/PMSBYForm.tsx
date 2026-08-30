import React from "react";
import { FormContainer } from "./FormContainer";
import type { Customer, AppSettings } from "@/types";
import { DEFAULT_BOI_LOGO, DEFAULT_PMSBY_LOGO, DEFAULT_NEW_INDIA_LOGO } from "@/constants";

interface PMSBYFormProps {
  customer: Partial<Customer>;
  settings: AppSettings;
}

export const PMSBYForm: React.FC<PMSBYFormProps> = ({ customer, settings }) => {
  const logos = settings.pmsbyLogos || {
    left: DEFAULT_NEW_INDIA_LOGO,
    center: DEFAULT_PMSBY_LOGO,
    right: DEFAULT_BOI_LOGO,
  };

  return (
    <FormContainer id="pdf-form-pmsby">
      {/* Header Multi-Logo Slots (Left, Center, Right) */}
      <div className="flex justify-between items-center mb-2 h-14 border-b border-black pb-1">
        {/* Left Slot */}
        <div className="flex items-center justify-start">
          <img src={logos.left || DEFAULT_NEW_INDIA_LOGO} alt="Insurer Logo" className="w-auto h-12 object-contain" />
        </div>
        {/* Center Slot */}
        <div className="flex items-center justify-center">
          <img src={logos.center || DEFAULT_PMSBY_LOGO} alt="PMSBY Logo" className="w-auto h-12 object-contain" />
        </div>
        {/* Right Slot */}
        <div className="flex items-center justify-end">
          <img src={logos.right || DEFAULT_BOI_LOGO} alt="Bank Logo" className="w-auto h-12 object-contain" />
        </div>
      </div>

      {/* Title */}
      <div className="text-center mb-2">
        <h1 className="text-sm font-black tracking-wide underline">PRADHAN MANTRI SURAKSHA BIMA YOJANA</h1>
        <h2 className="text-xs font-bold tracking-wider">CONSENT-CUM-DECLARATION FORM</h2>
      </div>

      {/* Policy Consent Paragraphs */}
      <div className="text-[9.5px] leading-tight space-y-1 text-justify mb-2">
        <p>
          I hereby give my consent to become a member of <strong>'Pradhan Mantri Suraksha Bima Yojana'</strong> of <span className="inline-block border-b border-black font-semibold px-1 pb-[1px] leading-tight">The New India Assurance Co. Ltd.</span> (Name of Insurer) which will be administered by your Bank under Master Policy No. <span className="inline-block border-b border-black font-semibold px-1 pb-[1px] leading-tight">{settings.cspCode || "BOI/PMSBY/2026"}</span> (To be pre-printed).
        </p>
        <p>
          I hereby authorize you to debit my Account with your Branch with <strong>Rs. 20/- (Rupees twenty only)</strong>, towards premium of accidental insurance cover@ of Rs Two lakhs under PMSBY (claim payable in case of death or permanent disability# due to accident$). I further authorize you to deduct in future after 25th May and not later than on 1st of June every year until further instructions, an amount of <strong>Rs.20/- (Rupees twenty only)</strong>, or any amount as decided from time to time, which may be intimated immediately if and when revised, towards renewal of coverage under the scheme.
        </p>
        <p>
          I have not authorized any other Bank to debit premium in respect of this scheme. I am aware that in case of multiple enrollment for the scheme by me, my insurance cover will be restricted to Rs. Two lakhs only and the premium paid by me for multiple enrollment shall be liable to be forfeited.
        </p>

        {/* Insurance Cover Notes */}
        <div className="border border-black p-1 text-[8.5px] bg-slate-50 mt-1">
          <span className="font-bold">Notes: @Insurance cover:</span><br />
          • Claim of Rs Two lakhs payable in case of total disability or death due to accident<br />
          • Claim of Rs One lakh payable in case of permanent partial disability<br />
          • Permanent Disability means: 1) Permanent total disability-Total loss of both eyes/hands/feet. 2) Permanent partial disability-Total loss of sight of one eye or loss of use of one hand or foot.<br />
          • Risk cover will start from the date of auto-debit of premium from the subscriber's account.
        </div>
      </div>

      {/* 2-Column Key-Value Subscriber & Nominee Table */}
      <table className="w-full border-collapse border-2 border-black text-[10px] my-2">
        <tbody>
          <tr>
            <td className="border border-black p-1 font-bold w-1/4 bg-slate-50">Name of the account holder**</td>
            <td className="border border-black p-1 font-extrabold text-xs w-1/4">{customer.name || ""}</td>
            <td className="border border-black p-1 font-bold w-1/4 bg-slate-50">Father's/husband's name**</td>
            <td className="border border-black p-1 font-bold w-1/4">{customer.fatherName || customer.spouseName || ""}</td>
          </tr>
          <tr>
            <td className="border border-black p-1 font-bold bg-slate-50">Address of the account holder</td>
            <td className="border border-black p-1">{customer.address || ""}</td>
            <td className="border border-black p-1 font-bold bg-slate-50">Name of City/town/village</td>
            <td className="border border-black p-1">{customer.village || customer.district || ""}</td>
          </tr>
          <tr>
            <td className="border border-black p-1 font-bold bg-slate-50">Name of District</td>
            <td className="border border-black p-1">{customer.district || ""}</td>
            <td className="border border-black p-1 font-bold bg-slate-50">Name of State</td>
            <td className="border border-black p-1">{customer.state || ""}</td>
          </tr>
          <tr>
            <td className="border border-black p-1 font-bold bg-slate-50">Pin Code</td>
            <td className="border border-black p-1 font-mono">500001</td>
            <td className="border border-black p-1 font-bold bg-slate-50">Mobile number of account holder</td>
            <td className="border border-black p-1 font-bold">{customer.mobile || ""}</td>
          </tr>
          <tr>
            <td className="border border-black p-1 font-bold bg-slate-50">Bank / Post Office Account No.**</td>
            <td className="border border-black p-1 font-mono font-bold">{customer.accountNumber || ""}</td>
            <td className="border border-black p-1 font-bold bg-slate-50">IFSC Code of Bank Branch**</td>
            <td className="border border-black p-1 font-mono font-bold">{customer.ifscCode || settings.ifscCode}</td>
          </tr>
          <tr>
            <td className="border border-black p-1 font-bold bg-slate-50">Name of the KYC document submitted</td>
            <td className="border border-black p-1">{customer.pmsbyKycType || "Aadhaar Card"}</td>
            <td className="border border-black p-1 font-bold bg-slate-50">KYC*Id number</td>
            <td className="border border-black p-1 font-mono">{customer.pmsbyKycId || customer.aadhaarNumber || "—"}</td>
          </tr>
          <tr>
            <td className="border border-black p-1 font-bold bg-slate-50">PAN Number, if available**</td>
            <td className="border border-black p-1 font-mono">{customer.panGir || "—"}</td>
            <td className="border border-black p-1 font-bold bg-slate-50">AADHAAR Number, if available**</td>
            <td className="border border-black p-1 font-mono">{customer.aadhaarNumber || customer.pmsbyKycId || "—"}</td>
          </tr>
          <tr>
            <td className="border border-black p-1 font-bold bg-slate-50">Date of birth**</td>
            <td className="border border-black p-1 font-bold">{customer.dob || ""}</td>
            <td className="border border-black p-1 font-bold bg-slate-50">E-mail Id**</td>
            <td className="border border-black p-1">{customer.email || ""}</td>
          </tr>
          <tr>
            <td className="border border-black p-1 font-bold bg-slate-50">Whether suffering from any disability</td>
            <td className="border border-black p-1">{customer.pmsbyDisability || "No"}</td>
            <td className="border border-black p-1 font-bold bg-slate-50">If yes, details thereof</td>
            <td className="border border-black p-1">{customer.pmsbyDisabilityDetails || "N/A"}</td>
          </tr>
          <tr>
            <td className="border border-black p-1 font-bold bg-slate-50">Name and address of nominee</td>
            <td className="border border-black p-1 font-bold">{customer.pmsbyNomineeName || customer.nomineeName || ""}</td>
            <td className="border border-black p-1 font-bold bg-slate-50">Date of Birth of nominee</td>
            <td className="border border-black p-1">{customer.pmsbyNomineeDob || customer.nomineeDob || ""}</td>
          </tr>
          <tr>
            <td className="border border-black p-1 font-bold bg-slate-50">Name and address of Guardian / appointee (if minor)</td>
            <td className="border border-black p-1">{customer.pmsbyGuardianName || customer.guardianName || ""}</td>
            <td className="border border-black p-1 font-bold bg-slate-50">Relationship of nominee with account holder</td>
            <td className="border border-black p-1">{customer.pmsbyNomineeRelationship || customer.nomineeRelationship || ""}</td>
          </tr>
          <tr>
            <td className="border border-black p-1 font-bold bg-slate-50">Mobile number of nominee / guardian</td>
            <td className="border border-black p-1 font-mono">{customer.pmsbyGuardianMobile || customer.mobile || ""}</td>
            <td className="border border-black p-1 font-bold bg-slate-50">Email id of nominee / guardian</td>
            <td className="border border-black p-1">{customer.email || ""}</td>
          </tr>
        </tbody>
      </table>

      {/* Customer Declaration & Signature */}
      <div className="text-[9px] leading-tight text-justify my-2">
        I hereby declare that the above statements are true in all respects and that I agree and declare that the above information shall form the basis of admission to the above scheme and that if any information be found untrue, my membership to the scheme shall be treated as canceled.
      </div>

      <div className="flex justify-between items-end my-4 pt-4">
        <div className="text-xs font-bold">
          Date: {customer.accountOpeningDate ? <span className="font-bold">{customer.accountOpeningDate}</span> : "__________________"}
        </div>
        <div className="text-right text-xs font-bold space-y-6">
          <p className="pb-4">________________________________________</p>
          <p>Signature of Customer</p>
        </div>
      </div>

      {/* Bank Verification Section */}
      <div className="border-t border-black pt-2 flex justify-between items-end my-3">
        <div className="text-[9.5px] max-w-[320px] space-y-4">
          <p>**Confirmed that the applicant's details and signature have been verified from the records available with this Bank.</p>
          <p className="font-bold">Date: {customer.accountOpeningDate ? <span className="font-bold">{customer.accountOpeningDate}</span> : "__________________"}</p>
        </div>
        <div className="text-right text-xs font-bold space-y-2">
          <p className="pb-8">________________________________________</p>
          <p>Signature of the Bank officer/Branch Manager</p>
          <p className="text-[9px] text-slate-500 font-normal font-sans">(Rubber Stamp with bank branch name and code)</p>
        </div>
      </div>

      {/* For Office Use Table */}
      <div className="border-t-2 border-black pt-1 mt-2">
        <div className="font-bold text-[10px] mb-1">For Office Use:</div>
        <table className="w-full border-collapse border border-black text-[9.5px]">
          <tbody>
            <tr>
              <td className="border border-black p-1 font-bold w-1/4 bg-slate-50">Name of Agent / BC</td>
              <td className="border border-black p-1 w-1/4 font-semibold">{settings.cspName}</td>
              <td className="border border-black p-1 font-bold w-1/4 bg-slate-50">Agency / BC Code No.</td>
              <td className="border border-black p-1 w-1/4 font-mono font-semibold">{settings.cspCode}</td>
            </tr>
            <tr>
              <td className="border border-black p-1 font-bold bg-slate-50">Bank A/c details of Agent/BC</td>
              <td className="border border-black p-1 font-mono">{settings.accountPrefix}XXXXXX</td>
              <td className="border border-black p-1 font-bold bg-slate-50">Signature of Agent/BC</td>
              <td className="border border-black p-1 text-center font-bold">___________________</td>
            </tr>
          </tbody>
        </table>
      </div>
    </FormContainer>
  );
};
