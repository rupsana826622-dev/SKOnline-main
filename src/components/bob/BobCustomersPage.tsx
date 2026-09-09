import React, { useState, useEffect, useMemo } from "react";
import {
  Search, PlusCircle, Download, Printer,
  Trash2, Edit, RefreshCw, ArrowLeft, ShieldCheck, CheckCircle
} from "lucide-react";
import type { BobCustomerRecord } from "@/types/bob";
import { getBobCustomers, deleteBobCustomer, fetchBobCustomersFromSupabase } from "@/lib/bobStorage";
import { exportToCSV, formatDateTime } from "@/lib/utils";
import BobReceiptModal from "./BobReceiptModal";
import BobCustomerForm from "./BobCustomerForm";
import BobCustomerProfile from "./BobCustomerProfile";
import { toast } from "sonner";
import SEO from "@/components/common/SEO";

type ViewMode = "list" | "add" | "profile" | "edit";

export default function BobCustomersPage() {
  const [records, setRecords] = useState<BobCustomerRecord[]>([]);
  const [search, setSearch] = useState("");
  const [schemeFilter, setSchemeFilter] = useState<"All" | "APY" | "PMSBY" | "PMJJBY">("All");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedRecord, setSelectedRecord] = useState<BobCustomerRecord | null>(null);
  const [selectedReceiptRecord, setSelectedReceiptRecord] = useState<BobCustomerRecord | null>(null);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setRecords(getBobCustomers());
    try {
      const live = await fetchBobCustomersFromSupabase();
      if (live && live.length >= 0) {
        setRecords(live);
      }
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

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return records.filter(r => {
      const matchSearch =
        !q ||
        r.customerName.toLowerCase().includes(q) ||
        r.mobile.includes(q) ||
        r.accountNo.toLowerCase().includes(q) ||
        r.cifNo.toLowerCase().includes(q) ||
        r.refNo.toLowerCase().includes(q) ||
        (r.guardianName || "").toLowerCase().includes(q) ||
        String(r.slNo).includes(q);

      const matchScheme =
        schemeFilter === "All"
          ? true
          : schemeFilter === "APY"
          ? r.enrollAPY
          : schemeFilter === "PMSBY"
          ? r.enrollPMSBY
          : r.enrollPMJJBY;

      return matchSearch && matchScheme;
    });
  }, [records, search, schemeFilter]);

  const handleExport = () => {
    exportToCSV(
      filtered.map(r => ({
        "SL NO": r.slNo,
        "Customer Name": r.customerName,
        "C/O (Guardian)": r.guardianName,
        "Account Opening Date": r.accountOpeningDate,
        "Account Number": r.accountNo,
        "CIF Number": r.cifNo,
        "Reference Number": r.refNo,
        Mobile: r.mobile,
        DOB: r.dob,
        Address: r.address,
        "Aadhaar Number": r.aadhaarNo,
        APY: r.enrollAPY ? "Yes" : "No",
        PMSBY: r.enrollPMSBY ? "Yes" : "No",
        PMJJBY: r.enrollPMJJBY ? "Yes" : "No",
        "Passbook Issued": r.passbookIssued ? "Yes" : "No",
        "Passbook Issued Date": r.passbookIssuedAt || "",
        "Passbook Delivered": r.passbookDelivered ? "Yes" : "No",
        "Passbook Delivered Date": r.passbookDeliveredAt || "",
        "ATM Issued": r.atmIssued ? "Yes" : "No",
        "ATM Issued Date": r.atmIssuedAt || "",
        "ATM Delivered": r.atmDelivered ? "Yes" : "No",
        "ATM Delivered Date": r.atmDeliveredAt || "",
        "Created At": formatDateTime(r.createdAt),
      })),
      "bank-of-baroda-customers"
    );
    toast.success("BOB Customers CSV exported successfully!");
  };

  const handleDelete = async (id: string, name: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`Are you sure you want to permanently delete Bank of Baroda account for "${name}"?`)) return;

    setRecords(prev => prev.filter(r => r.id !== id));
    if (selectedRecord?.id === id) {
      setSelectedRecord(null);
      setViewMode("list");
    }

    try {
      const { error } = await deleteBobCustomer(id);
      if (error) {
        alert('Delete Failed: ' + (error.message || 'Unknown error'));
        await loadData();
        return;
      }
      toast.success(`Account for "${name}" deleted.`);
      await loadData();
    } catch (err: any) {
      alert('Delete Failed: ' + (err?.message || 'Unknown error'));
      toast.error(`Error deleting: ${err?.message || "Unknown error"}`);
      await loadData();
    }
  };

  // 1. In-Page Customer Addition View
  if (viewMode === "add") {
    return (
      <div className="max-w-4xl mx-auto space-y-4 pb-12 animate-fade-in">
        <SEO title="Add Bank of Baroda Customer" />
        <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-orange-200 shadow-xs">
          <button
            onClick={() => setViewMode("list")}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            <ArrowLeft size={15} />
            <span>Back to Customers List</span>
          </button>
          <span className="text-xs font-bold text-orange-700 bg-orange-50 px-2.5 py-1 rounded-md border border-orange-200">
            Registering New BOB Customer
          </span>
        </div>
        <BobCustomerForm
          onSuccess={() => {
            setViewMode("list");
            loadData();
          }}
          onCancel={() => setViewMode("list")}
        />
      </div>
    );
  }

  // 2. In-Page Customer Edit View
  if (viewMode === "edit" && selectedRecord) {
    return (
      <div className="max-w-4xl mx-auto space-y-4 pb-12 animate-fade-in">
        <SEO title={`Edit BOB Customer — Serial ${selectedRecord.slNo}`} />
        <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-orange-200 shadow-xs">
          <button
            onClick={() => setViewMode("profile")}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            <ArrowLeft size={15} />
            <span>Back to Profile</span>
          </button>
          <span className="text-xs font-mono font-bold text-orange-700 bg-orange-50 px-2.5 py-1 rounded-md border border-orange-200">
            Editing Serial {selectedRecord.slNo}
          </span>
        </div>
        <BobCustomerForm
          initialRecord={selectedRecord}
          onSuccess={updated => {
            setSelectedRecord(updated);
            setViewMode("profile");
            loadData();
          }}
          onCancel={() => setViewMode("profile")}
        />
      </div>
    );
  }

  // 3. Dedicated Full-Width Customer Profile View
  if (viewMode === "profile" && selectedRecord) {
    return (
      <div className="space-y-4 animate-fade-in">
        <BobCustomerProfile
          record={selectedRecord}
          onBack={() => setViewMode("list")}
          onEdit={rec => {
            setSelectedRecord(rec);
            setViewMode("edit");
          }}
          onPrintReceipt={rec => setSelectedReceiptRecord(rec)}
          onRecordDeleted={deletedId => {
            setRecords(prev => prev.filter(item => item.id !== deletedId));
            setSelectedRecord(null);
            setViewMode("list");
          }}
        />

        {/* Slip Modal */}
        {selectedReceiptRecord && (
          <BobReceiptModal
            record={selectedReceiptRecord}
            onClose={() => setSelectedReceiptRecord(null)}
          />
        )}
      </div>
    );
  }

  // 4. Main Customers Table View
  return (
    <div className="max-w-7xl mx-auto space-y-5 animate-fade-in">
      <SEO title="Bank of Baroda Customer Directory" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Bank of Baroda Customers</h1>
            {loading && <RefreshCw size={14} className="animate-spin text-orange-600" />}
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            {records.length} total BOB accounts · {filtered.length} shown · Click any row to view full profile
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={loadData}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Download size={13} />
            Export CSV
          </button>
          {/* Primary In-Page Add Customer Button */}
          <button
            onClick={() => setViewMode("add")}
            className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-lg shadow-sm hover:shadow-md transition-all"
          >
            <PlusCircle size={14} />
            <span>+ Add Customer</span>
          </button>
        </div>
      </div>

      {/* Search & Scheme Filters Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search Input */}
          <div className="sm:col-span-2 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, account no, mobile, CIF, SL NO, guardian..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:bg-white"
            />
          </div>

          {/* Quick Scheme Filter Tabs */}
          <div className="sm:col-span-1 flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            {(["All", "APY", "PMSBY", "PMJJBY"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setSchemeFilter(tab)}
                className={`flex-1 py-1 text-xs font-bold rounded-md transition-all ${
                  schemeFilter === tab
                    ? "bg-white text-orange-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3 text-center w-14">Serial</th>
                <th className="py-3 px-4">Customer Details</th>
                <th className="py-3 px-4">Account NO</th>
                <th className="py-3 px-4">CIF / Reference</th>
                <th className="py-3 px-4">Opening Date</th>
                <th className="py-3 px-4 text-center">Schemes (SSS)</th>
                <th className="py-3 px-4 text-center">Deliverables</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {filtered.map((r, index) => (
                <tr
                  key={r.id}
                  onClick={() => {
                    setSelectedRecord(r);
                    setViewMode("profile");
                  }}
                  className="hover:bg-orange-50/50 cursor-pointer transition-colors group"
                >
                  {/* Circular Badge Serial Number (Strict 1, 2, 3 Counting) */}
                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 font-bold flex items-center justify-center text-sm shadow-2xs group-hover:bg-orange-600 group-hover:text-white transition-colors">
                        {r.slNo || index + 1}
                      </div>
                    </div>
                  </td>

                  {/* Customer Details */}
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900 group-hover:text-orange-700 transition-colors">
                      {r.customerName}
                    </div>
                    {r.guardianName && <div className="text-[11px] text-slate-500">C/O: {r.guardianName}</div>}
                    <div className="text-[11px] text-slate-500 font-mono">{r.mobile}</div>
                  </td>

                  {/* Account Number */}
                  <td className="py-3 px-4 font-mono font-extrabold text-slate-900">
                    {r.accountNo || "—"}
                  </td>

                  {/* CIF & Reference */}
                  <td className="py-3 px-4">
                    <div className="font-mono text-slate-700 text-[11px] font-semibold">CIF: {r.cifNo || "—"}</div>
                    <div className="font-mono text-slate-500 text-[10px]">REF: {r.refNo || "—"}</div>
                  </td>

                  {/* Account Opening Date */}
                  <td className="py-3 px-4 font-mono text-slate-600 text-[11px]">
                    {r.accountOpeningDate || "—"}
                  </td>

                  {/* Schemes Badges */}
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1 flex-wrap">
                      {r.enrollAPY && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-emerald-100 text-emerald-800">
                          APY
                        </span>
                      )}
                      {r.enrollPMSBY && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-violet-100 text-violet-800">
                          PMSBY
                        </span>
                      )}
                      {r.enrollPMJJBY && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-blue-100 text-blue-800">
                          PMJJBY
                        </span>
                      )}
                      {!r.enrollAPY && !r.enrollPMSBY && !r.enrollPMJJBY && (
                        <span className="text-[10px] text-slate-400">—</span>
                      )}
                    </div>
                  </td>

                  {/* Deliverables */}
                  <td className="py-3 px-4 text-center">
                    <div className="flex flex-col gap-0.5 items-center">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${r.passbookDelivered ? "bg-emerald-100 text-emerald-800" : r.passbookIssued ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-500"}`}>
                        PB: {r.passbookDelivered ? "Delivered" : r.passbookIssued ? "Issued" : "Pending"}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${r.atmDelivered ? "bg-emerald-100 text-emerald-800" : r.atmIssued ? "bg-violet-100 text-violet-800" : "bg-slate-100 text-slate-500"}`}>
                        ATM: {r.atmDelivered ? "Delivered" : r.atmIssued ? "Issued" : "Pending"}
                      </span>
                    </div>
                  </td>

                  {/* Actions (stop propagation) */}
                  <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1.5">
                      {/* Slip Print */}
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setSelectedReceiptRecord(r);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors border border-orange-200 shadow-2xs"
                        title="Print Bank of Baroda Slip"
                      >
                        <Printer size={13} />
                        <span>Slip</span>
                      </button>

                      {/* Direct Edit */}
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setSelectedRecord(r);
                          setViewMode("edit");
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-300 shadow-2xs"
                        title="Edit Account Details"
                      >
                        <Edit size={13} />
                        <span>Edit</span>
                      </button>

                      {/* Direct Delete */}
                      <button
                        onClick={e => handleDelete(r.id, r.customerName, e)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200 shadow-2xs"
                        title="Delete Record"
                      >
                        <Trash2 size={13} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No matching Bank of Baroda accounts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slip Modal */}
      {selectedReceiptRecord && (
        <BobReceiptModal
          record={selectedReceiptRecord}
          onClose={() => setSelectedReceiptRecord(null)}
        />
      )}
    </div>
  );
}
