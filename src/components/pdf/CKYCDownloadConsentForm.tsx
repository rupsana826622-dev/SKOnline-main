import React from "react";
import { FormContainer } from "./FormContainer";
import type { Customer, AppSettings } from "@/types";
import { DEFAULT_BOI_LOGO } from "@/constants";

interface CKYCDownloadConsentFormProps {
  customer: Partial<Customer>;
  settings: AppSettings;
}

export const CKYCDownloadConsentForm: React.FC<CKYCDownloadConsentFormProps> = ({ customer, settings }) => {
  const logo = settings.ckycLogo || DEFAULT_BOI_LOGO;

  return (
    <FormContainer id="pdf-form-ckyc">
      <div className="border border-black p-6 h-[96%] flex flex-col justify-between box-border">
        {/* Top Header */}
        <div>
          <div className="flex flex-col items-end mb-4">
            <div className="flex items-center justify-end">
              <img src={logo} alt="Bank Logo" className="w-auto h-12 object-contain" />
            </div>
            <div className="text-right text-xs font-bold font-mono tracking-wider pt-1 underline">
              ANNEXURE I
            </div>
          </div>

          {/* Centered Title */}
          <div className="text-center my-6">
            <h1 className="text-xs font-black underline tracking-wide leading-normal uppercase">
              CKYC DOWNLOAD CONSENT TO BE OBTAINED FROM CUSTOMERS FOR OPENING OF SAVINGS AND CURRENT ACCOUNTS
            </h1>
          </div>

          {/* Dotted Divider */}
          <div className="border-b border-dotted border-black my-4 w-full"></div>

          {/* Date Row */}
          <div className="text-right text-xs font-bold mb-6">
            Date: {customer.accountOpeningDate ? <span className="font-bold">{customer.accountOpeningDate}</span> : "__________________"}
          </div>

          {/* Address Block */}
          <div className="text-xs space-y-1 mb-6 leading-relaxed font-semibold text-slate-800">
            <p>To,</p>
            <p>The Branch Manager,</p>
            <p>{settings.bankName || "Bank of India"},</p>
            <p>
              <span className="inline-block border-b border-black font-bold px-2 pb-[1px] leading-tight">{settings.cspBranchName || "______________________"}</span> Branch/Office
            </p>
          </div>

          {/* Salutation */}
          <div className="text-xs font-bold mb-4">
            Dear Sir/Madam,
          </div>

          {/* 2-Paragraph Legal Body */}
          <div className="text-xs text-justify space-y-4 leading-relaxed text-slate-900">
            <p>
              I/We understand that my/our KYC details and documents may have been uploaded to Central KYC Registry maintained by CERSAI by other banking/regulatory entities and my/our CKYC/KIN number may have been generated in the same process, and the details may be searched and downloaded by {settings.bankName || "Bank of India"}.
            </p>
            <p>
              Hence, with reference to my/our application dated {customer.accountOpeningDate ? <span className="font-bold">{customer.accountOpeningDate}</span> : "__________________"} for opening of savings / current account in your bank, I/We authorize {settings.bankName || "Bank of India"} to search for my/our KYC records in Central KYC Registry, and if my/our record is found, then download and store the KYC details and documents for the sole purpose of opening account and keeping in record for auditory/regulatory purpose.
            </p>
          </div>
        </div>

        {/* Bottom Part */}
        <div>
          {/* Customer Signature Block */}
          <div className="flex flex-col items-end mt-12 mb-4">
            <div className="text-xs font-bold text-right space-y-8">
              <p>Yours Faithfully,</p>
              <p className="pt-8">________________________________________</p>
              <p className="font-bold text-[11px] text-slate-700">(Name and Signature)</p>
            </div>
          </div>

          {/* Footnote instruction */}
          <div className="text-[10px] text-slate-500 italic mb-6">
            (To be signed by all customers / related parties./ authorised signatories of the account being opened)
          </div>

          {/* Horizontal Line Divider */}
          <div className="border-b border-black my-2 w-full"></div>

          {/* Internal Classification Footer */}
          <div className="flex justify-between items-center text-[9px] font-semibold text-slate-500 mt-2">
            <div>Classification: Internal</div>
          </div>
        </div>
      </div>
    </FormContainer>
  );
};
