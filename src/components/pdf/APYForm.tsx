import React from "react";
import { FormContainer } from "./FormContainer";
import { CharacterGrid } from "./CharacterGrid";
import type { Customer, AppSettings } from "@/types";
import { DEFAULT_PFRDA_LOGO } from "@/constants";

interface APYFormProps {
  customer: Partial<Customer>;
  settings: AppSettings;
}

export const APYForm: React.FC<APYFormProps> = ({ customer, settings }) => {
  const logo = settings.apyLogo || DEFAULT_PFRDA_LOGO;

  return (
    <FormContainer id="pdf-form-apy">
      {/* Top Header Logo & Title */}
      <div className="flex justify-between items-start mb-2 border-b-2 border-black pb-1">
        <div className="w-[180px] h-[50px] flex items-center justify-start">
          <img src={logo} alt="PFRDA APY Logo" className="max-h-full max-w-full object-contain" />
        </div>
        <div className="text-center flex-1 pr-12">
          <h1 className="text-base font-black tracking-wide leading-tight">ATAL PENSION YOJANA (APY)</h1>
          <h2 className="text-[10px] font-bold text-slate-700">(Administered by Pension Fund Regulatory and Development Authority)</h2>
          <h3 className="text-xs font-black tracking-widest mt-0.5 bg-black text-white px-2 py-0.5 inline-block">SUBSCRIBER REGISTRATION FORM</h3>
        </div>
      </div>

      {/* Header Branch Details */}
      <div className="text-[10.5px] mb-2 font-medium">
        To The Branch Manager/Officer In Charge, <span className="font-bold underline px-2">{settings.cspBranchName}</span> Branch, <span className="font-bold underline px-2">{settings.bankName}</span> Bank/Dept. of Post
        <div className="italic text-[9.5px] font-semibold mt-0.5 text-slate-600">* Indicates mandatory fields. Please fill the form in English and BLOCK letters</div>
      </div>

      {/* Section 1: BANK DETAILS */}
      <div className="border border-black mb-2">
        <div className="bg-slate-200 px-2 py-0.5 font-bold text-xs border-b border-black">
          1. BANK DETAILS:
        </div>
        <div className="p-1.5 space-y-1 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-32 font-bold flex-shrink-0">Bank A/c Number*</span>
            <CharacterGrid value={customer.accountNumber} length={15} boxWidth="16px" boxHeight="18px" fontSize="11px" />
          </div>
          <div className="flex items-center gap-4 pt-0.5">
            <div className="flex items-center gap-2">
              <span className="font-bold">Bank Name*</span>
              <span className="border border-black px-2 py-0.5 font-semibold text-xs min-w-[150px]">{settings.bankName}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold">Bank Branch*</span>
              <span className="border border-black px-2 py-0.5 font-semibold text-xs min-w-[180px]">{settings.cspBranchName}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: PERSONAL DETAILS */}
      <div className="border border-black mb-2">
        <div className="bg-slate-200 px-2 py-0.5 font-bold text-xs border-b border-black">
          2. PERSONAL DETAILS:
        </div>
        <div className="p-1.5 space-y-1.5 text-[10.5px]">
          {/* Title Checkboxes */}
          <div className="flex items-center gap-4">
            <span className="font-bold">Name of Applicant in full*</span>
            {["Shri", "Smt.", "Kumari"].map(title => (
              <label key={title} className="flex items-center gap-1 font-semibold cursor-pointer">
                <span className={`w-4 h-4 border border-black flex items-center justify-center text-xs font-black ${
                  (customer.sex === "Male" && title === "Shri") || (customer.sex === "Female" && title === "Smt.") ? "bg-black text-white" : ""
                }`}>
                  {(customer.sex === "Male" && title === "Shri") || (customer.sex === "Female" && title === "Smt.") ? "✓" : ""}
                </span>
                <span>{title}</span>
              </label>
            ))}
          </div>

          {/* Full Name Grid */}
          <div className="flex items-center gap-2">
            <span className="w-24 font-bold flex-shrink-0">Full Name*</span>
            <CharacterGrid value={customer.name} length={35} boxWidth="15px" boxHeight="17px" fontSize="10px" />
          </div>

          {/* DOB, Age, Mobile */}
          <div className="flex items-center gap-2">
            <span className="font-bold">Date of Birth*</span>
            <CharacterGrid value={(customer.dob || "").replace(/-/g, "")} length={8} boxWidth="15px" boxHeight="17px" fontSize="10px" />
            <span className="font-bold ml-2">Age</span>
            <span className="border border-black px-2 py-0.5 font-bold text-xs w-12 text-center">{customer.age || ""}</span>
            <span className="font-bold ml-2">Mobile No</span>
            <CharacterGrid value={customer.mobile} length={10} boxWidth="15px" boxHeight="17px" fontSize="10px" />
          </div>

          {/* Email ID & Aadhaar */}
          <div className="flex items-center gap-2">
            <span className="font-bold">Email ID</span>
            <span className="border border-black px-2 py-0.5 font-medium text-xs min-w-[140px]">{customer.email || ""}</span>
            <span className="font-bold ml-2">Aadhaar*</span>
            <CharacterGrid value={customer.pmjjbyKycId || "XXXXXXXXXXXX"} length={12} boxWidth="15px" boxHeight="17px" fontSize="10px" />
          </div>

          {/* Marital Status & Spouse */}
          <div className="flex items-center gap-3 pt-0.5">
            <span className="font-bold">Married</span>
            {["Yes", "No"].map(opt => (
              <label key={opt} className="flex items-center gap-1 font-semibold">
                <span className={`w-3.5 h-3.5 border border-black flex items-center justify-center text-[10px] font-black ${
                  (customer.apyMaritalStatus === "Married" || customer.spouseName) && opt === "Yes" ? "bg-black text-white" : ""
                }`}>
                  {(customer.apyMaritalStatus === "Married" || customer.spouseName) && opt === "Yes" ? "✓" : ""}
                </span>
                <span>{opt}</span>
              </label>
            ))}
            <span className="text-[9.5px] italic text-slate-700">If married, spouse name is mandatory.</span>
          </div>

          {/* Spouse & Nominee details */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="font-bold">Name of Spouse:</span> <span className="font-semibold underline">{customer.apySpouseName || customer.spouseName || "__________________"}</span>
            </div>
            <div>
              <span className="font-bold">Nominee's Name*:</span> <span className="font-semibold underline">{customer.apyNomineeName || customer.nomineeName || "__________________"}</span>
            </div>
          </div>

          {/* Additional Checkboxes */}
          <div className="space-y-0.5 text-[9.5px] pt-1">
            <div className="flex items-center justify-between">
              <span>Whether beneficiary of other statutory social security schemes</span>
              <div className="flex gap-2 font-bold">
                <span>Yes [ {customer.apySocialSecurity === "Yes" ? "✓" : " "} ]</span>
                <span>No [ {customer.apySocialSecurity !== "Yes" ? "✓" : " "} ]</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span>Whether Income Tax Payer</span>
              <div className="flex gap-2 font-bold">
                <span>Yes [ {customer.apyTaxPayer === "Yes" ? "✓" : " "} ]</span>
                <span>No [ {customer.apyTaxPayer !== "Yes" ? "✓" : " "} ]</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: PENSION DETAILS */}
      <div className="border border-black mb-2">
        <div className="bg-slate-200 px-2 py-0.5 font-bold text-xs border-b border-black">
          3. PENSION DETAILS
        </div>
        <div className="p-1.5 space-y-1.5 text-[10.5px]">
          {/* Contribution Frequency */}
          <div className="flex items-center gap-4">
            <span className="font-bold">Frequency of Contribution (Please tick(√))*</span>
            {["Monthly", "Quarterly", "Half Yearly"].map(freq => (
              <label key={freq} className="flex items-center gap-1 font-semibold cursor-pointer">
                <span className={`w-4 h-4 border border-black flex items-center justify-center text-xs font-black ${
                  (customer.apyContributionFreq || "Monthly") === freq ? "bg-black text-white" : ""
                }`}>
                  {(customer.apyContributionFreq || "Monthly") === freq ? "✓" : ""}
                </span>
                <span>{freq}</span>
              </label>
            ))}
          </div>

          {/* Pension Amount Slabs */}
          <div className="flex items-center gap-3">
            <span className="font-bold">Pension Amount (Please tick(√))*</span>
            {["1000", "2000", "3000", "4000", "5000"].map(amt => (
              <label key={amt} className="flex items-center gap-1 font-bold cursor-pointer">
                <span className={`w-4 h-4 border border-black flex items-center justify-center text-xs font-black ${
                  (customer.apyPensionSlab || "₹1,000").includes(amt) ? "bg-black text-white" : ""
                }`}>
                  {(customer.apyPensionSlab || "₹1,000").includes(amt) ? "✓" : ""}
                </span>
                <span>₹{amt}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Declaration & Authorization */}
      <div className="text-[9px] leading-tight text-justify my-1.5 border-t border-b border-black py-1">
        <span className="font-bold">Declaration & Authorization by all subscribers:</span><br />
        I meet the prescribed eligibility criteria for assistance under APY and I have read and understood the terms and conditions of the Scheme. I hereby agree to the same and declare that the information furnished by me is true and correct. I authorize the bank to debit my above mentioned bank account till the age of 60 for making payment under APY as applicable based on my age and the Pension Amount selected by me.
      </div>

      {/* Subscriber Signature Block */}
      <div className="flex justify-between items-end my-2">
        <div className="text-xs space-y-1">
          <div>Date : <span className="font-bold underline">{new Date().toLocaleDateString("en-IN")}</span></div>
          <div>Place : <span className="font-semibold">{customer.village || customer.district || "___________"}</span></div>
        </div>

        {/* Intentionally Blank Signature / Thumb Impression Box */}
        <div className="w-[220px] h-[65px] border border-black flex flex-col justify-end p-1 text-center bg-white">
          <div className="border-t border-black text-[9px] font-bold">
            Signature/Thumb Impression* of Subscriber
          </div>
          <div className="text-[8px] italic text-slate-500">(* LTI in case of male and RTI in case of female)</div>
        </div>
      </div>

      {/* ACKNOWLEDGEMENT - SUBSCRIBER REGISTRATION FOR ATAL PENSION YOJANA (APY) */}
      <div className="border-2 border-black pt-1 px-2 pb-2 mt-2 bg-slate-50">
        <div className="text-center font-black text-xs underline mb-1">
          ACKNOWLEDGEMENT - SUBSCRIBER REGISTRATION FOR ATAL PENSION YOJANA (APY)
        </div>
        <div className="text-center text-[9px] font-bold mb-1">(To be filled by the Bank)</div>

        <div className="grid grid-cols-2 gap-2 text-[10px] mb-2">
          <div>Name of the Subscriber: <span className="font-extrabold underline">{customer.name || "____________________"}</span></div>
          <div className="flex items-center gap-1">
            <span>PRAN Number:</span>
            <CharacterGrid value="PRAN12345678" length={12} boxWidth="14px" boxHeight="16px" fontSize="9px" />
          </div>
          <div>Guaranteed Pension Amount: <span className="font-bold underline">{customer.apyPensionSlab || "₹1,000"}</span></div>
          <div>Periodicity of Contribution: <span className="font-bold underline">{customer.apyContributionFreq || "Monthly"}</span></div>
        </div>

        <div className="flex justify-between items-end border-t border-black pt-1">
          <div className="text-[9.5px] space-y-0.5">
            <div>Name of the Bank: <span className="font-bold">{settings.bankName}</span></div>
            <div>Bank Branch: <span className="font-bold">{settings.cspBranchName}</span></div>
            <div>Receiving Officer's Name: <span className="font-semibold">{settings.operatorName || "CSP Operator"}</span></div>
            <div>Date of Receipt of Application: <span className="font-bold">{new Date().toLocaleDateString("en-IN")}</span></div>
          </div>

          {/* Intentionally Blank Bank Stamp & Signature Box */}
          <div className="w-[180px] h-[60px] border-2 border-dashed border-black flex flex-col items-center justify-center text-[9px] font-bold text-slate-400 text-center p-1 bg-white">
            <div>Stamp and Signature of the Bank</div>
          </div>
        </div>
      </div>
    </FormContainer>
  );
};
