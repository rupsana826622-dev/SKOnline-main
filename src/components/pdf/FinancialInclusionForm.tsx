import React from "react";
import { FormContainer } from "./FormContainer";
import { CharacterGrid } from "./CharacterGrid";
import type { Customer, AppSettings } from "@/types";
import { DEFAULT_BOI_LOGO } from "@/constants";

interface FinancialInclusionFormProps {
  customer: Partial<Customer>;
  settings: AppSettings;
}

export const FinancialInclusionForm: React.FC<FinancialInclusionFormProps> = ({ customer, settings }) => {
  const logo = settings.fiLogo || DEFAULT_BOI_LOGO;

  return (
    <FormContainer id="pdf-form-fi">
      {/* Top Header */}
      <div className="flex justify-between items-center mb-2">
        {/* Top-Left Single Logo Slot */}
        <div className="flex items-center justify-start">
          <img src={logo} alt="Bank Logo" className="w-auto h-12 object-contain" />
        </div>

        {/* Top-Right Bank Use Only Box */}
        <div className="text-xs space-y-1">
          <div className="font-semibold text-right mb-1">For Bank use only</div>
          <div className="flex items-center justify-end gap-2">
            <span className="font-semibold text-[10px]">BRANCH CODE</span>
            <CharacterGrid value={customer.branchCode || settings.branchCode} length={6} boxWidth="15px" boxHeight="17px" fontSize="10px" />
          </div>
          <div className="flex items-center justify-end gap-2">
            <span className="font-semibold text-[10px]">Customer ID</span>
            <CharacterGrid value={customer.customerId} length={10} boxWidth="15px" boxHeight="17px" fontSize="10px" />
          </div>
          <div className="flex items-center justify-end gap-2">
            <span className="font-semibold text-[10px]">Account No.</span>
            <CharacterGrid value={customer.accountNumber} length={15} boxWidth="15px" boxHeight="17px" fontSize="10px" />
          </div>
        </div>
      </div>

      {/* Main Title */}
      <div className="text-center my-2 border-b border-t border-black py-1">
        <h1 className="text-base font-extrabold tracking-wider leading-tight">FINANCIAL INCLUSION</h1>
        <h2 className="text-xs font-bold tracking-wide">APPLICATION FOR BASIC SB NO FRILL ACCOUNT</h2>
      </div>

      {/* Applicant Form Grid Fields */}
      <div className="space-y-1 text-[11px] mb-2">
        <div className="flex items-center">
          <span className="w-36 font-semibold flex-shrink-0">Name in Full</span>
          <CharacterGrid value={customer.name} length={35} boxWidth="16px" boxHeight="18px" fontSize="11px" />
        </div>
        <div className="flex items-center">
          <span className="w-36 font-semibold flex-shrink-0">Father's Name</span>
          <CharacterGrid value={customer.fatherName} length={35} boxWidth="16px" boxHeight="18px" fontSize="11px" />
        </div>
        <div className="flex items-center">
          <span className="w-36 font-semibold flex-shrink-0">Mother's Name</span>
          <CharacterGrid value={customer.motherName} length={35} boxWidth="16px" boxHeight="18px" fontSize="11px" />
        </div>
        <div className="flex items-center">
          <span className="w-36 font-semibold flex-shrink-0">Name of the Spouse</span>
          <CharacterGrid value={customer.spouseName} length={35} boxWidth="16px" boxHeight="18px" fontSize="11px" />
        </div>
        <div className="flex items-center">
          <span className="w-36 font-semibold flex-shrink-0">Address</span>
          <CharacterGrid value={customer.address} length={35} boxWidth="16px" boxHeight="18px" fontSize="11px" />
        </div>
        <div className="flex items-center">
          <span className="w-36 font-semibold flex-shrink-0">Village</span>
          <CharacterGrid value={customer.village} length={35} boxWidth="16px" boxHeight="18px" fontSize="11px" />
        </div>
        <div className="flex items-center">
          <span className="w-36 font-semibold flex-shrink-0">Mandal / Tehsil</span>
          <CharacterGrid value={customer.mandal} length={35} boxWidth="16px" boxHeight="18px" fontSize="11px" />
        </div>
        <div className="flex items-center">
          <span className="w-36 font-semibold flex-shrink-0">District</span>
          <CharacterGrid value={customer.district} length={35} boxWidth="16px" boxHeight="18px" fontSize="11px" />
        </div>
        <div className="flex items-center">
          <span className="w-36 font-semibold flex-shrink-0">State</span>
          <CharacterGrid value={customer.state} length={35} boxWidth="16px" boxHeight="18px" fontSize="11px" />
        </div>

        {/* Sex, Age, DOB Row */}
        <div className="flex items-center gap-2 pt-0.5">
          <span className="font-semibold w-12">Sex</span>
          <div className="border border-black px-2 py-0.5 min-w-[70px] text-center font-bold">{customer.sex || ""}</div>
          <span className="font-semibold ml-2">Age</span>
          <div className="border border-black px-2 py-0.5 min-w-[50px] text-center font-bold">{customer.age || ""}</div>
          <span className="font-semibold ml-2">Date of Birth</span>
          <div className="flex items-center gap-1">
            <span className="text-[9px] text-slate-500">D D M M Y Y Y Y</span>
            <CharacterGrid value={(customer.dob || "").replace(/[-/]/g, "")} length={8} boxWidth="16px" boxHeight="18px" fontSize="10px" />
          </div>
        </div>

        {/* Profession & Category */}
        <div className="flex items-center gap-2 pt-0.5">
          <span className="font-semibold w-24">Profession</span>
          <div className="border border-black px-2 py-0.5 flex-1 font-bold">{customer.profession || ""}</div>
          <span className="font-semibold ml-2">Belongs to</span>
          <div className="flex border border-black text-[10px]">
            {["OBC", "BC", "SC", "ST", "Gen"].map(cat => (
              <div
                key={cat}
                className={`px-2 py-0.5 border-r last:border-r-0 border-black font-semibold ${
                  customer.category === cat ? "bg-black text-white" : ""
                }`}
              >
                {cat}
              </div>
            ))}
          </div>
        </div>

        {/* Annual Income & GIR/PAN */}
        <div className="flex items-center gap-2 border border-black p-1 mt-1">
          <span className="font-semibold">Annual Income</span>
          <span className="font-bold">Rs. {customer.annualIncome || "________________"}</span>
          <span className="font-semibold ml-auto">GIR/PAN No.</span>
          <span className="font-mono font-bold">{customer.panGir || "____________________"}</span>
        </div>
      </div>

      {/* Nomination Table */}
      <div className="my-2">
        <div className="font-bold text-xs italic mb-1">Details of Nomination :</div>
        <table className="w-full border-collapse border border-black text-[10px]">
          <thead>
            <tr className="bg-slate-100 text-center font-bold border-b border-black">
              <th className="border border-black p-1 w-24">SB A/c No.</th>
              <th className="border border-black p-1">Name of the Nominee</th>
              <th className="border border-black p-1 w-24">Relationship</th>
              <th className="border border-black p-1 w-12">Age</th>
              <th className="border border-black p-1 w-28">Date of Birth<br/>(in case of Minor)</th>
              <th className="border border-black p-1 text-[9px]">Person authorised to receive the amount in the event of my minor's death</th>
            </tr>
          </thead>
          <tbody>
            <tr className="text-center font-medium h-10">
              <td className="border border-black p-1">{customer.sbAccountNo || customer.accountNumber || ""}</td>
              <td className="border border-black p-1">{customer.nomineeName || ""}</td>
              <td className="border border-black p-1">{customer.nomineeRelationship || ""}</td>
              <td className="border border-black p-1">{customer.nomineeAge || ""}</td>
              <td className="border border-black p-1">{customer.nomineeDob || ""}</td>
              <td className="border border-black p-1">{customer.guardianName || ""}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Declaration Paragraph */}
      <div className="text-[9.5px] leading-tight text-justify my-2 border-t border-b border-slate-300 py-1">
        <span className="font-bold">Declaration</span><br />
        I hereby apply for opening of a {settings.bankName} Financial Inclusion Scheme No Frill Account / ATM Card or (Business Correspondent) Smart Card Account. I have read the terms and conditions applicable to this account and {settings.bankName} SB No Frill Account and also I agree to the terms and conditions as may be in force form time to time. I/We declare that the balances in all our accounts put together will not/is not likely to exceed Rs. 50,000/- (Rs. Fifty thousand only at any point of time) and the turn over in the account will not/is not likely to exceed Rs. 1 lac (Rs. One lac only) in year. I/We am/are aware that and assure the bank that whenever my/our account exceeds the above mentioned financial limit we wil comply and abide by the KYC norms of the Bank. I accept that {settings.bankName} is entitled at its discretion to accept or reject this application without assigning any reason whatsoever. I declare that the information provided by me in this application form is true and correct.
      </div>

      {/* Bottom Photo & Signature Blocks */}
      <div className="flex justify-between items-end my-3">
        <div className="text-[11px] space-y-2">
          <div>Telephone No: <span className="font-bold">{customer.mobile || "_________________"}</span></div>
          <div>Place : <span className="font-semibold">{customer.village || customer.district || "_________________"}</span></div>
          <div>Date : _________________________</div>
        </div>

        {/* Intentionally Blank Photo Attachment Box */}
        <div className="w-[110px] h-[135px] border-2 border-dashed border-black flex flex-col items-center justify-center text-slate-400 font-bold text-xs bg-slate-50">
          <span>PHOTO</span>
        </div>

        {/* Intentionally Blank Signature Box */}
        <div className="w-[200px] h-[85px] border border-black flex flex-col justify-end p-1 text-center bg-white">
          <div className="border-t border-black text-[10px] font-bold pt-1">
            Signature / LHTI of applicant
          </div>
        </div>
      </div>

      {/* Details of Introduction Section */}
      <div className="border-t-2 border-black pt-2 space-y-1 text-[10.5px]">
        <div className="font-bold text-xs italic">Details of introduction</div>
        <div className="flex items-center">
          <span className="w-44 font-semibold flex-shrink-0">Name of the person introduced</span>
          <CharacterGrid value={customer.introducerName} length={35} boxWidth="15px" boxHeight="17px" fontSize="10px" />
        </div>
        <div className="flex items-center">
          <span className="w-44 font-semibold flex-shrink-0">A/c No.</span>
          <CharacterGrid value={customer.introducerAccountNo} length={15} boxWidth="15px" boxHeight="17px" fontSize="10px" />
        </div>
        <div className="flex items-center">
          <span className="w-44 font-semibold flex-shrink-0">Branch</span>
          <CharacterGrid value={customer.introducerBranch || settings.cspBranchName} length={35} boxWidth="15px" boxHeight="17px" fontSize="10px" />
        </div>

        <div className="flex justify-between items-end pt-1">
          <div>I know the above person for the past <span className="inline-block border-b border-black pb-0.5 px-2 font-bold leading-none">{customer.introducerYears || "_____"}</span> years</div>
          <div className="text-right font-bold text-[10px]">Signature of the introducer</div>
        </div>
      </div>

      {/* Verification Footer Notes */}
      <div className="mt-2 pt-1 border-t border-slate-300 text-[9px] space-y-0.5">
        <div className="font-bold">If introducer is not available :</div>
        <div>1. Then any one of the following identity proof is to be obtained such as Election ID Card / Govt. ID Card / Driving License / Employer's ID Card/ ID Card issue by School/College along with document for address proof such as Electricity Bill / Ration Card.</div>
        <div>2. Introduction by tow neighbors who have proper documents for identification.</div>
        <div>3. Any other evidence for the satisfaction of the Bank.</div>
        <div className="text-right font-bold text-[10.5px] pt-2">Signature of Verifying Official</div>
      </div>
    </FormContainer>
  );
};
