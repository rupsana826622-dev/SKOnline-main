import React from "react";
import { FormContainer } from "./FormContainer";
import type { Customer, AppSettings } from "@/types";
import { DEFAULT_BOI_LOGO } from "@/constants";

interface OpeningConsentFormProps {
  customer: Partial<Customer>;
  settings: AppSettings;
}

export const OpeningConsentForm: React.FC<OpeningConsentFormProps> = ({ customer, settings }) => {
  const logo = settings.consentLogo || DEFAULT_BOI_LOGO;

  return (
    <FormContainer id="pdf-form-opening">
      {/* Centered Logo, Branch, and Right Photo Block */}
      <div className="flex justify-between items-center mb-4">
        {/* Left spacing to balance photo on right */}
        <div className="w-[110px]"></div>

        {/* Center Logo & Branch */}
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center justify-center">
            <img src={logo} alt="Bank Logo" className="w-auto h-12 object-contain" />
          </div>
          <div className="font-bold text-xs mt-1 text-slate-800">
            <span className="inline-block border-b border-black px-2 pb-[1px] leading-tight">{settings.cspBranchName || "____________________"}</span> Branch
          </div>
        </div>

        {/* Right Photo Attachment Box (Must remain blank with outlines) */}
        <div className="w-[100px] h-[120px] border border-black flex flex-col items-center justify-center text-slate-400 font-bold text-[10px] bg-slate-50 flex-shrink-0">
          <span>PHOTO</span>
        </div>
      </div>

      {/* Title */}
      <div className="text-center my-3">
        <h1 className="text-sm font-black underline tracking-wide leading-normal">
          Consent-cum-Declaration Form for Opening SB/CD/TD Account
        </h1>
      </div>

      {/* Opening Consent Body */}
      <div className="text-[11.5px] leading-relaxed space-y-2 mb-4 text-justify font-medium text-slate-800">
        <p>
          I hereby give my consent to open my account with 'Bank of India' under the Name{" "}
          <span className="inline-block border-b border-black font-extrabold px-1 pb-[1px] leading-tight">{customer.name || "..........................................................."}</span>{" "}
          (Name of Account Holder) which will be operated through your Bank.
        </p>
        <p>
          I hereby give the details of my Aadhar No., PAN No. and Nominee Details and also give my consent to use the belowmentioned details for account opening purpose.
        </p>
        <p>
          I have been explained the Scheme rules and I hereby give my consent to become a customer of the Bank.
        </p>
      </div>

      {/* Structured 2-Column Table Grid */}
      <table className="w-full border-collapse border-2 border-black text-[11px] mb-4">
        <tbody>
          {/* Row 1 */}
          <tr className="border-b border-black">
            <td className="border-r border-black p-2 w-1/2">
              <div className="text-[10px] text-slate-500 font-bold mb-0.5">Name of the account holder</div>
              <div className="font-extrabold text-xs text-black">{customer.name || ""}</div>
            </td>
            <td className="p-2 w-1/2">
              <div className="text-[10px] text-slate-500 font-bold mb-0.5">Mobile No.</div>
              <div className="font-bold text-black">{customer.mobile || ""}</div>
            </td>
          </tr>

          {/* Row 2 */}
          <tr className="border-b border-black">
            <td className="border-r border-black p-2">
              <div className="text-[10px] text-slate-500 font-bold mb-0.5">PAN No.</div>
              <div className="font-mono font-bold text-black">{customer.panGir || "—"}</div>
            </td>
            <td className="p-2">
              <div className="text-[10px] text-slate-500 font-bold mb-0.5">AADHAAR No.</div>
              <div className="font-mono font-bold text-black">{customer.pmjjbyKycId || ""}</div>
            </td>
          </tr>

          {/* Row 3 */}
          <tr className="border-b border-black">
            <td className="border-r border-black p-2">
              <div className="text-[10px] text-slate-500 font-bold mb-0.5">Date of birth</div>
              <div className="font-bold text-black">{customer.dob || ""}</div>
            </td>
            <td className="p-2">
              <div className="text-[10px] text-slate-500 font-bold mb-0.5">E-mail Id</div>
              <div className="font-medium text-black">{customer.email || "—"}</div>
            </td>
          </tr>

          {/* Row 4 */}
          <tr className="border-b border-black">
            <td className="border-r border-black p-2">
              <div className="text-[10px] text-slate-500 font-bold mb-0.5">Name of nominee</div>
              <div className="font-bold text-black">{customer.nomineeName || ""}</div>
            </td>
            <td className="p-0">
              <div className="border-b border-black p-2">
                <div className="text-[10px] text-slate-500 font-bold mb-0.5">Date of Birth of nominee</div>
                <div className="font-medium text-black">{customer.nomineeDob || "—"}</div>
              </div>
              <div className="p-2">
                <div className="text-[10px] text-slate-500 font-bold mb-0.5">Relationship of nominee with the account holder</div>
                <div className="font-medium text-black">{customer.nomineeRelationship || ""}</div>
              </div>
            </td>
          </tr>

          {/* Row 5 */}
          <tr>
            <td className="border-r border-black p-2">
              <div className="text-[10px] text-slate-500 font-bold mb-0.5">Name and address of Guardian / appointee (if nominee is minor)</div>
              <div className="font-medium text-black">{customer.guardianName || "—"}</div>
            </td>
            <td className="p-2">
              <div className="text-[10px] text-slate-500 font-bold mb-0.5">Relationship of the guardian / appointee with the nominee</div>
              <div className="font-medium text-black">
                {customer.guardianName ? (customer.pmjjbyGuardianRelationship || customer.pmsbyGuardianRelationship || customer.apyGuardianRelationship || "Guardian") : "—"}
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Undertaking paragraphs */}
      <div className="text-[10.5px] leading-relaxed space-y-2 text-justify text-slate-900 border-t border-slate-300 pt-2 mb-8">
        <p>
          I hereby enclose a copy of my{" "}
          <span className="inline-block border-b border-black font-bold px-1 pb-[1px] leading-tight">{customer.pmjjbyKycType || "Aadhaar Card"}</span> as proof of my identity (KYC) and nominate{" "}
          <span className="inline-block border-b border-black font-bold px-1 pb-[1px] leading-tight">{customer.nomineeName || "________________"}</span> as nominee above under this scheme. Nominee being minor, his / her guardian is appointed as above.
        </p>
        <p>
          I hereby declare that the above statements are true in all respects and that I agree and declare that the above information shall form the basis of account opening to the above scheme and that if any information be found untrue, I solely will be responsible.
        </p>
        <p>
          I further give my consent through aadhar OTP/Biometric authentication to open a deposit account with Bank of India and use the signature below as default customer signature.
        </p>
      </div>

      {/* Bottom Date and Signature zone */}
      <div className="flex justify-between items-end mt-12 mb-4">
        <div className="text-xs font-bold text-slate-800 font-sans">
          Date: __________________
        </div>

        {/* Signature Line */}
        <div className="text-right text-xs font-bold space-y-2">
          <p>_______________________________</p>
          <p className="text-[11px] font-bold text-slate-700 mr-8">Signature</p>
        </div>
      </div>
    </FormContainer>
  );
};
