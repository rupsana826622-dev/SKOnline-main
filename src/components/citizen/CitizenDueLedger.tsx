import React, { useState, useEffect, useMemo } from "react";
import {
  CreditCard, CheckCircle, Clock, AlertCircle, Search,
  DollarSign, Printer, ArrowRight, X, Phone, User
} from "lucide-react";
import type { CitizenServiceRecord } from "@/types/citizen";
import { getCitizenRecords, settleCitizenDue } from "@/lib/citizenStorage";
import { toast } from "sonner";
import CitizenReceiptModal from "./CitizenReceiptModal";

export default function CitizenDueLedger() {
  const [records, setRecords] = useState<CitizenServiceRecord[]>([]);
  const [search, setSearch] = useState("");
  const [settlingTarget, setSettlingTarget] = useState<CitizenServiceRecord | null>(null);
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<"Cash" | "UPI">("Cash");
  const [selectedReceiptRecord, setSelectedReceiptRecord] = useState<CitizenServiceRecord | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setRecords(getCitizenRecords());

    const handleUpdate = () => {
      setRecords(getCitizenRecords());
    };
    window.addEventListener("citizen-data-updated", handleUpdate);
    return () => window.removeEventListener("citizen-data-updated", handleUpdate);
  }, []);

  // Filter only records where dueAmount > 0
  const dueRecords = useMemo(() => {
    const q = search.toLowerCase().trim();
    return records
      .filter(r => r.dueAmount > 0)
      .filter(r => {
        if (!q) return true;
        return (
          r.customerName.toLowerCase().includes(q) ||
          r.contactNo.includes(q) ||
          r.serviceType.toLowerCase().includes(q) ||
          r.appNumber.toLowerCase().includes(q) ||
          String(r.serialNo).includes(q)
        );
      });
  }, [records, search]);

  const totalOutstandingDue = dueRecords.reduce((sum, r) => sum + r.dueAmount, 0);

  const handleSettle = async () => {
    if (!settlingTarget) return;
    setLoading(true);

    await settleCitizenDue(settlingTarget.id, selectedPaymentMode);
    toast.success(`Due payment of ₹${settlingTarget.dueAmount} for SL #${settlingTarget.serialNo} settled via ${selectedPaymentMode}!`);

    // Fetch updated record for receipt
    const updated = {
      ...settlingTarget,
      advancePaid: settlingTarget.totalAmount,
      dueAmount: 0,
      paymentMode: selectedPaymentMode,
      paymentStatus: "Full Paid" as const,
    };

    setSettlingTarget(null);
    setLoading(false);
    setSelectedReceiptRecord(updated);
  };

  return (
    <div className="space-y-5">
      {/* Header & Metric Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
              <CreditCard size={18} />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Due Payments Ledger</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Manage outstanding customer balances and quick-settle dues</p>
        </div>

        {/* Total Outstanding Card */}
        <div className="flex items-center gap-3 bg-gradient-to-r from-amber-500/10 to-amber-500/5 border border-amber-300 rounded-xl px-4 py-2.5">
          <div className="w-9 h-9 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold">
            ₹
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-amber-800 tracking-wider">Total Outstanding Due</div>
            <div className="text-lg font-black text-amber-700">₹{totalOutstandingDue.toLocaleString("en-IN")}</div>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search customer by name, contact, serial no..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
        />
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Serial</th>
                <th className="py-3 px-4">Customer Details</th>
                <th className="py-3 px-4">Service</th>
                <th className="py-3 px-4 text-right">Total Amount</th>
                <th className="py-3 px-4 text-right">Advance Paid</th>
                <th className="py-3 px-4 text-right font-black text-amber-700">Balance Due</th>
                <th className="py-3 px-4 text-center">Current Mode</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {dueRecords.map(r => (
                <tr key={r.id} className="hover:bg-amber-50/30 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    {r.serialNo}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{r.customerName}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{r.contactNo}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                      {r.serviceType}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-slate-700">
                    ₹{r.totalAmount.toLocaleString("en-IN")}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-emerald-600 font-semibold">
                    ₹{r.advancePaid.toLocaleString("en-IN")}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-black text-amber-600 text-sm">
                    ₹{r.dueAmount.toLocaleString("en-IN")}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded">
                      {r.paymentMode}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedReceiptRecord(r)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Current Receipt"
                      >
                        <Printer size={15} />
                      </button>
                      <button
                        onClick={() => {
                          setSettlingTarget(r);
                          setSelectedPaymentMode("Cash");
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg transition-all shadow-xs"
                      >
                        <CheckCircle size={13} />
                        Settle Dues
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {dueRecords.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <CheckCircle size={28} className="mx-auto mb-2 text-emerald-500 opacity-60" />
                    <p className="font-semibold text-slate-600 text-sm">No Pending Dues!</p>
                    <p className="text-xs text-slate-400 mt-0.5">All customer services are fully paid.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Settle Due Modal Dialog */}
      {settlingTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                <CreditCard size={18} className="text-amber-500" />
                <span>Settle Due Payment</span>
              </div>
              <button
                onClick={() => setSettlingTarget(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            {/* Details Box */}
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600 font-medium">Customer:</span>
                <span className="font-bold text-slate-900">{settlingTarget.customerName}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600 font-medium">Service:</span>
                <span className="font-semibold text-blue-700">{settlingTarget.serviceType}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600 font-medium">Total Amount:</span>
                <span className="font-mono font-semibold">₹{settlingTarget.totalAmount}</span>
              </div>
              <div className="flex justify-between items-center text-xs border-t border-amber-200 pt-2">
                <span className="text-amber-900 font-bold">Outstanding Balance:</span>
                <span className="font-mono font-black text-amber-700 text-base">₹{settlingTarget.dueAmount}</span>
              </div>
            </div>

            {/* Payment Mode Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Settlement Payment Mode
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(["Cash", "UPI"] as const).map(mode => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setSelectedPaymentMode(mode)}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                      selectedPaymentMode === mode
                        ? "bg-slate-900 text-white border-slate-900 shadow-md"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSettlingTarget(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleSettle}
                className="flex items-center gap-2 px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-md transition-all"
              >
                <CheckCircle size={14} />
                {loading ? "Settling..." : "Confirm & Clear Due (₹0)"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {selectedReceiptRecord && (
        <CitizenReceiptModal
          record={selectedReceiptRecord}
          onClose={() => setSelectedReceiptRecord(null)}
        />
      )}
    </div>
  );
}
