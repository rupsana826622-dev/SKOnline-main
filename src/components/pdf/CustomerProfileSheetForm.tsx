import React from "react";
import { FormContainer } from "./FormContainer";
import { CharacterGrid } from "./CharacterGrid";
import type { Customer, AppSettings } from "@/types";
import { DEFAULT_BOI_LOGO } from "@/constants";

interface CustomerProfileSheetFormProps {
  customer: Partial<Customer>;
  settings: AppSettings;
}

export const CustomerProfileSheetForm: React.FC<CustomerProfileSheetFormProps> = ({ customer, settings }) => {
  const logo = settings.cpsLogo || DEFAULT_BOI_LOGO;

  return (
    <FormContainer id="pdf-form-cps">
      {/* Header Banner */}
      <div className="border-b-2 border-black pb-1 mb-2">
        <div className="text-xs font-bold tracking-wide text-black">
          ANNEXURE 1 to Branch Circular 110/229 dated 20.02.2017
        </div>
      </div>

      {/* Top Header Box with Logo & ID Grids */}
      <div className="border-2 border-black flex justify-between items-stretch p-2 mb-3">
        <div className="w-[180px] h-[55px] flex items-center justify-start">
          <img src={logo} alt="Bank Logo" className="max-h-full max-w-full object-contain" />
        </div>

        <div className="flex flex-col justify-center gap-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs">Cust Id</span>
            <CharacterGrid value={customer.customerId} length={10} boxWidth="16px" boxHeight="18px" fontSize="11px" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs">Account No:</span>
            <CharacterGrid value={customer.accountNumber} length={15} boxWidth="16px" boxHeight="18px" fontSize="11px" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs">Account Type:</span>
            <span className="border border-black px-2 py-0.5 font-bold text-xs">SB NO FRILL / GENERAL</span>
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="text-center my-3">
        <h1 className="text-sm font-black underline tracking-wider">CUSTOMER PROFILE SHEET (for Individuals)</h1>
        <h2 className="text-xs font-bold tracking-wide mt-1">(TO BE FILLED IN BY THE BANK)</h2>
      </div>

      {/* Sol ID & Zone */}
      <div className="flex gap-8 text-xs font-bold mb-3 border-b border-black pb-1">
        <div>Sol Id: <span className="underline font-mono px-2">{customer.solId || settings.solId || "_______"}</span></div>
        <div>Zone: <span className="underline px-2">{customer.zone || settings.zone || "_______"}</span></div>
        <div>Branch: <span className="underline px-2">{settings.cspBranchName || "_______"}</span></div>
      </div>

      {/* Customer Fields List */}
      <div className="space-y-3 text-xs">
        <div>
          <span className="font-bold">I) Customer Name:</span> Shri/Smt/Ms./Dr. <span className="font-extrabold underline text-sm px-2">{customer.name || "__________________________________________________"}</span>
        </div>

        <div>
          <span className="font-bold">II) Address:</span> <span className="font-semibold underline px-2">{customer.address ? `${customer.address}, ${customer.village || ""}, ${customer.mandal || ""}, ${customer.district || ""}, ${customer.state || ""}` : "__________________________________________________________________________________"}</span>
        </div>

        <div>
          <span className="font-bold">III) Education:</span> <span className="font-semibold">{customer.educationLevel || "School/Graduate/Post-Graduate/Professional/Doctorate"}</span>
        </div>

        <div>
          <span className="font-bold">IV) Occupation:</span> Service (Govt.) / Service (Pvt.) / Business / Self Employed / Retired / Housewife / Student / Others
          {customer.occupationType && (
            <div className="mt-0.5 text-blue-900 font-bold">Selected: {customer.occupationType}</div>
          )}
        </div>

        <div>
          <span className="font-bold">V) Date of Birth:</span> <span className="font-bold underline px-2">{customer.dob || "____ / ____ / ________"}</span>
        </div>

        <div>
          <span className="font-bold">VI) Name of Organization/Department:</span> <span className="underline px-2">{customer.profession || "__________________________________________________"}</span>
        </div>

        <div>
          <span className="font-bold">VII) Designation/Job Profile:</span> <span className="underline px-2">__________________________________________________</span>
        </div>

        <div>
          <span className="font-bold">VIII) Nature of business/activity:</span> <span className="underline px-2">__________________________________________________</span>
        </div>

        <div>
          <span className="font-bold">IX) Politically Prominent Person: Y/N</span> (In case "Y", a/c will be "HIGH" Risk & its opening is to be authorised by Br. Head)
          <span className="font-extrabold border border-black px-3 py-0.5 ml-2 bg-slate-100">{customer.politicallyProminent || "N"}</span>
        </div>

        {/* Income Level Checkbox Grid */}
        <div>
          <div className="font-bold mb-1">X) Income level (Annual) In Rupees : (√ tick one)</div>
          <table className="w-full border-collapse border-2 border-black text-[11px] text-center">
            <thead>
              <tr className="bg-slate-100 font-bold border-b-2 border-black">
                <th className="border border-black p-1.5">Below 25,000</th>
                <th className="border border-black p-1.5">25,000 to 50,000</th>
                <th className="border border-black p-1.5">50,000 to 100000</th>
                <th className="border border-black p-1.5">1Lac to 2Lac</th>
                <th className="border border-black p-1.5">2Lac to 5Lac</th>
                <th className="border border-black p-1.5">Above 5Lac</th>
              </tr>
            </thead>
            <tbody>
              <tr className="h-9 font-extrabold text-sm">
                {["Below 25,000", "25,000 to 50,000", "50,000 to 100000", "1Lac to 2Lac", "2Lac to 5Lac", "Above 5Lac"].map(tier => (
                  <td key={tier} className="border border-black p-1">
                    {(customer.annualIncomeTier || customer.annualIncome)?.includes(tier.slice(0, 5)) ? "✓" : ""}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Annual Turnover Table */}
        <div>
          <div className="font-bold mb-1">XI) Annual Turnover in the account: (Amt in Lakh)</div>
          <table className="w-3/4 border-collapse border-2 border-black text-[11px] text-center ml-auto mr-auto">
            <thead>
              <tr className="bg-slate-100 font-bold border-b border-black">
                <th className="border border-black p-1 text-left px-3">Year</th>
                <th className="border border-black p-1 w-32">Actual</th>
                <th className="border border-black p-1 w-32">Estimated</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black p-1.5 text-left px-3 font-semibold">Previous year</td>
                <td className="border border-black p-1.5">{customer.turnoverType === "Actual" ? customer.turnoverAmount || "0.50" : ""}</td>
                <td className="border border-black p-1.5">{customer.turnoverType === "Estimated" ? customer.turnoverAmount || "0.50" : ""}</td>
              </tr>
              <tr>
                <td className="border border-black p-1.5 text-left px-3 font-semibold">Current year</td>
                <td className="border border-black p-1.5">1.00</td>
                <td className="border border-black p-1.5">1.00</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Risk Category Selector */}
        <div className="flex items-center gap-6 pt-2 text-sm">
          <span className="font-extrabold underline">Risk Category: (tick one)</span>
          {["LOW", "MEDIUM", "HIGH"].map(risk => (
            <label key={risk} className="flex items-center gap-1.5 font-bold cursor-pointer">
              <span className={`w-5 h-5 border-2 border-black flex items-center justify-center font-black ${
                (customer.riskCategory || "LOW").toUpperCase() === risk ? "bg-black text-white" : ""
              }`}>
                {(customer.riskCategory || "LOW").toUpperCase() === risk ? "✓" : ""}
              </span>
              <span>{risk}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Footer Official Signatures & Rubber Stamp Area */}
      <div className="mt-8 pt-4 border-t-2 border-black flex justify-between items-end">
        <div className="space-y-4 text-xs font-bold">
          <div>Sign. of A/C opening official: ______________________</div>
          <div>Name: <span className="font-semibold">{settings.operatorName || "_______________________"}</span></div>
          <div>P.F. No. _______________________</div>
        </div>

        {/* Intentionally Blank Rubber Stamp Box */}
        <div className="w-[120px] h-[100px] border-2 border-dashed border-black flex items-center justify-center text-[10px] font-bold text-slate-400 text-center p-1 bg-slate-50">
          BANK RUBBER STAMP
        </div>

        <div className="space-y-4 text-xs font-bold text-right">
          <div>Sign. of A/C Approving Official: ______________________</div>
          <div>Name: _______________________</div>
          <div>P.F. No. _______________________</div>
        </div>
      </div>
    </FormContainer>
  );
};
