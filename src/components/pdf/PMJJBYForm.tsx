import React from "react";
import { FormContainer } from "./FormContainer";
import type { Customer, AppSettings } from "@/types";
import { DEFAULT_BOI_LOGO, DEFAULT_PMJJBY_LOGO, DEFAULT_STAR_UNION_LOGO } from "@/constants";

interface PMJJBYFormProps {
  customer: Partial<Customer>;
  settings: AppSettings;
}

export const PMJJBYForm: React.FC<PMJJBYFormProps> = ({ customer, settings }) => {
  const logos = settings.pmjjbyLogos || {
    left: DEFAULT_STAR_UNION_LOGO,
    center: DEFAULT_PMJJBY_LOGO,
    right: DEFAULT_BOI_LOGO,
  };

  return (
    <FormContainer id="pdf-form-pmjjby">
      {/* Header Multi-Logo Slots (Left, Center, Right) */}
      <div className="flex justify-between items-center mb-2 h-14 border-b border-black pb-1">
        {/* Left Slot */}
        <div className="flex items-center justify-start">
          <img src={logos.left || DEFAULT_STAR_UNION_LOGO} alt="Insurer Logo" className="w-auto h-12 object-contain" />
        </div>
        {/* Center Slot */}
        <div className="flex items-center justify-center">
          <img src={logos.center || DEFAULT_PMJJBY_LOGO} alt="PMJJBY Logo" className="w-auto h-12 object-contain" />
        </div>
        {/* Right Slot */}
        <div className="flex items-center justify-end">
          <img src={logos.right || DEFAULT_BOI_LOGO} alt="Bank Logo" className="w-auto h-12 object-contain" />
        </div>
      </div>

      {/* Title */}
      <div className="text-center mb-2">
        <h1 className="text-sm font-black tracking-wide underline">PRADHAN MANTRI JEEVAN JYOTI BIMA YOJANA</h1>
        <h2 className="text-xs font-bold tracking-wider">CONSENT-CUM-DECLARATION FORM</h2>
      </div>

      {/* Policy Consent Paragraphs */}
      <div className="text-[9.5px] leading-tight space-y-1 text-justify mb-2">
        <p>
          I hereby give my consent to become a member of <strong>'Pradhan Mantri Jeevan Jyoti Bima Yojana'</strong> of <span className="inline-block border-b border-black font-semibold px-1 pb-[1px] leading-tight">Star Union Dai-ichi Life Insurance</span> (Name of Insurer) which will be administered by your Bank under Master Policy No. <span className="inline-block border-b border-black font-semibold px-1 pb-[1px] leading-tight">{settings.cspCode || "BOI/PMJJBY/2026"}</span> (To be pre-printed).
        </p>
        <p>
          I hereby authorize you to debit my account with your Branch with <strong>Rs. 436/-</strong> (applicable premium #) towards premium of life insurance cover of Rs. Two lakhs under PMJJBY. I further authorize you to deduct in future after 25th May and not later than on 1st of June every year until further instructions, an amount of <strong>Rs.436/-(Rupees four hundred thirty-six only)</strong>, or any amount as decided from time to time, which may be intimated immediately if and when revised, towards renewal of coverage under the scheme.
        </p>
        <p>
          I have not authorized any other Bank to debit premium in respect of this scheme. I am aware that in case of multiple enrolment for the scheme by me, my insurance cover will be restricted to Rs. Two lakhs only and the premium paid by me for multiple enrolment shall be liable to be forfeited.
        </p>
        <div className="text-[9.5px] font-semibold mt-1">
          <div className="mb-1 font-bold"># If the enrolment takes place on any day during the months of –</div>
          <table className="w-full border-collapse border border-black text-[9px]">
            <thead>
              <tr className="bg-slate-50 font-bold border-b border-black">
                <th className="border border-black p-1 text-left">Enrolment Period</th>
                <th className="border border-black p-1 text-left">Premium Breakdown</th>
                <th className="border border-black p-1 text-right">Total Premium Payable</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-black">
                <td className="border border-black p-1">June, July & August</td>
                <td className="border border-black p-1">Annual premium of Rs. 436/- is payable</td>
                <td className="border border-black p-1 text-right font-bold">Rs. 436/-</td>
              </tr>
              <tr className="border-b border-black">
                <td className="border border-black p-1">September, October & November</td>
                <td className="border border-black p-1">3 quarters of premium @ Rs. 114.00</td>
                <td className="border border-black p-1 text-right font-bold">Rs. 342/-</td>
              </tr>
              <tr className="border-b border-black">
                <td className="border border-black p-1">December, January & February</td>
                <td className="border border-black p-1">2 quarters of premium @ Rs. 114.00</td>
                <td className="border border-black p-1 text-right font-bold">Rs. 228/-</td>
              </tr>
              <tr>
                <td className="border border-black p-1">March, April & May</td>
                <td className="border border-black p-1">1 Quarterly premium @ Rs. 114.00</td>
                <td className="border border-black p-1 text-right font-bold">Rs. 114/-</td>
              </tr>
            </tbody>
          </table>
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
            <td className="border border-black p-1">{customer.pmjjbyKycType || "Aadhaar Card"}</td>
            <td className="border border-black p-1 font-bold bg-slate-50">KYC*Id number</td>
            <td className="border border-black p-1 font-mono">{customer.pmjjbyKycId || "XXXXXXXXXXXX"}</td>
          </tr>
          <tr>
            <td className="border border-black p-1 font-bold bg-slate-50">PAN Number, if available**</td>
            <td className="border border-black p-1 font-mono">{customer.panGir || ""}</td>
            <td className="border border-black p-1 font-bold bg-slate-50">AADHAAR Number, if available**</td>
            <td className="border border-black p-1 font-mono">{customer.pmjjbyKycId || ""}</td>
          </tr>
          <tr>
            <td className="border border-black p-1 font-bold bg-slate-50">Date of birth**</td>
            <td className="border border-black p-1 font-bold">{customer.dob || ""}</td>
            <td className="border border-black p-1 font-bold bg-slate-50">E-mail Id**</td>
            <td className="border border-black p-1">{customer.email || ""}</td>
          </tr>
          <tr>
            <td className="border border-black p-1 font-bold bg-slate-50">Whether suffering from any disability</td>
            <td className="border border-black p-1">{customer.pmjjbyDisability || "No"}</td>
            <td className="border border-black p-1 font-bold bg-slate-50">If yes, details thereof</td>
            <td className="border border-black p-1">{customer.pmjjbyDisabilityDetails || "N/A"}</td>
          </tr>
          <tr>
            <td className="border border-black p-1 font-bold bg-slate-50">Name and address of nominee</td>
            <td className="border border-black p-1 font-bold">{customer.pmjjbyNomineeName || customer.nomineeName || ""}</td>
            <td className="border border-black p-1 font-bold bg-slate-50">Date of Birth of nominee</td>
            <td className="border border-black p-1">{customer.pmjjbyNomineeDob || customer.nomineeDob || ""}</td>
          </tr>
          <tr>
            <td className="border border-black p-1 font-bold bg-slate-50">Name and address of Guardian / appointee (if minor)</td>
            <td className="border border-black p-1">{customer.pmjjbyGuardianName || customer.guardianName || ""}</td>
            <td className="border border-black p-1 font-bold bg-slate-50">Relationship of nominee with account holder</td>
            <td className="border border-black p-1">{customer.pmjjbyNomineeRelationship || customer.nomineeRelationship || ""}</td>
          </tr>
          <tr>
            <td className="border border-black p-1 font-bold bg-slate-50">Mobile number of nominee / guardian</td>
            <td className="border border-black p-1 font-mono">{customer.pmjjbyGuardianMobile || customer.mobile || ""}</td>
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
          Date: __________________
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
          <p className="font-bold">Date: __________________</p>
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
