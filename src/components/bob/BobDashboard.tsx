import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, UserPlus, Truck, ShieldCheck, Download,
  RefreshCw, CheckCircle, Clock, AlertCircle, Printer
} from "lucide-react";
import { getBobCustomers, syncBobFromSupabase } from "@/lib/bobStorage";
import type { BobCustomerRecord } from "@/types/bob";
import { exportToCSV, formatDateTime } from "@/lib/utils";
import BobReceiptModal from "./BobReceiptModal";
import { toast } from "sonner";
import SEO from "@/components/common/SEO";

export default function BobDashboard() {
  const [records, setRecords] = useState<BobCustomerRecord[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<BobCustomerRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const loadData = async () => {
    setLoading(true);
    setRecords(getBobCustomers());
    try {
      await syncBobFromSupabase();
      setRecords(getBobCustomers());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => {
      setRecords(getBobCustomers());
    };
    window.addEventListener("bob-data-updated", handleUpdate);
    return () => window.removeEventListener("bob-data-updated", handleUpdate);
  }, []);

  const totalAccounts = records.length;
  const pendingPassbooks = records.filter(r => !r.passbookIssued).length;
  const pendingAtm = records.filter(r => !r.atmIssued).length;
  const apyEnrolled = records.filter(r => r.enrollAPY).length;
  const pmsbyEnrolled = records.filter(r => r.enrollPMSBY).length;
  const pmjjbyEnrolled = records.filter(r => r.enrollPMJJBY).length;

  const recentCustomers = [...records]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const handleExport = () => {
    exportToCSV(
      records.map(r => ({
        "SL NO": r.slNo,
        "Customer Name": r.customerName,
        "C/O": r.guardianName,
        "Account Opening Date": r.accountOpeningDate,
        "Account Number": r.accountNo,
        "CIF Number": r.cifNo,
        "Reference Number": r.refNo,
        Mobile: r.mobile,
        Address: r.address,
        "Aadhaar Number": r.aadhaarNo,
        APY: r.enrollAPY ? "Yes" : "No",
        PMSBY: r.enrollPMSBY ? "Yes" : "No",
        PMJJBY: r.enrollPMJJBY ? "Yes" : "No",
        "Passbook Issued": r.passbookIssued ? "Yes" : "No",
        "ATM Issued": r.atmIssued ? "Yes" : "No",
        "Created At": formatDateTime(r.createdAt),
      })),
      "bank-of-baroda-records"
    );
    toast.success("CSV exported successfully!");
  };

  const stats = [
    { label: "Total BOB Accounts", value: totalAccounts, icon: Users, color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200" },
    { label: "Pending Passbooks", value: pendingPassbooks, icon: Clock, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
    { label: "Pending ATM Cards", value: pendingAtm, icon: AlertCircle, color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200" },
    { label: "APY Enrolled", value: apyEnrolled, icon: ShieldCheck, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
    { label: "PMSBY / PMJJBY", value: pmsbyEnrolled + pmjjbyEnrolled, icon: CheckCircle, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <SEO title="Bank of Baroda CSP Dashboard" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center font-black text-lg shadow-md">
            BOB
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Bank of Baroda CSP Console</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Customer Service Point account register, deliverables & social security schemes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors shadow-xs"
          >
            <Download size={13} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {stats.map(({ label, value, icon: Icon, color, bg, border }) => (
          <div key={label} className={`bg-white rounded-2xl border ${border} p-4 shadow-sm`}>
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon size={18} className={color} />
            </div>
            <div className={`text-2xl font-black ${color}`}>{value}</div>
            <div className="text-xs text-slate-600 font-semibold mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Quick Action Buttons */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => navigate("/add-customer")}
            className="flex items-center gap-3 p-3.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-xs shadow-sm hover:shadow transition-all"
          >
            <UserPlus size={18} />
            <span>Add BOB Customer</span>
          </button>
          <button
            onClick={() => navigate("/delivery")}
            className="flex items-center gap-3 p-3.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs shadow-sm hover:shadow transition-all"
          >
            <Truck size={18} />
            <span>Delivery Tracker</span>
          </button>
          <button
            onClick={() => navigate("/customers")}
            className="flex items-center gap-3 p-3.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs shadow-sm hover:shadow transition-all"
          >
            <Users size={18} />
            <span>Customer Directory</span>
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-3 p-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-sm hover:shadow transition-all"
          >
            <Download size={18} />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Recent Accounts Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-900 text-sm">Recent Bank of Baroda Accounts</h2>
          <button
            onClick={() => navigate("/customers")}
            className="text-xs font-bold text-orange-600 hover:text-orange-700 transition-colors"
          >
            View All Customers →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                <th className="py-3 px-4">SL NO</th>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Account Number</th>
                <th className="py-3 px-4">Mobile</th>
                <th className="py-3 px-4 text-center">Schemes</th>
                <th className="py-3 px-4 text-center">Deliverables</th>
                <th className="py-3 px-4 text-right">Slip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {recentCustomers.map(r => (
                <tr key={r.id} className="hover:bg-orange-50/20 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-orange-700">
                    SL #{r.slNo}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{r.customerName}</div>
                    {r.guardianName && <div className="text-[10px] text-slate-400">C/O: {r.guardianName}</div>}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-800">
                    {r.accountNo || "—"}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">
                    {r.mobile}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {r.enrollAPY && <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">APY</span>}
                      {r.enrollPMSBY && <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-violet-100 text-violet-800">PMSBY</span>}
                      {r.enrollPMJJBY && <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-100 text-blue-800">PMJJBY</span>}
                      {!r.enrollAPY && !r.enrollPMSBY && !r.enrollPMJJBY && <span className="text-slate-400">—</span>}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.passbookIssued ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"}`}>
                      PB: {r.passbookIssued ? "✓" : "Pending"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setSelectedReceipt(r)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors border border-orange-200"
                    >
                      <Printer size={12} />
                      <span>Slip</span>
                    </button>
                  </td>
                </tr>
              ))}

              {recentCustomers.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    No accounts registered yet. Click &apos;Add BOB Customer&apos; to register!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slip Modal */}
      {selectedReceipt && (
        <BobReceiptModal
          record={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}
    </div>
  );
}
