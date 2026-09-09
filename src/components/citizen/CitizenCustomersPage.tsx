import React, { useState, useEffect, useMemo } from "react";
import {
  Search, PlusCircle, Filter, Download, Printer,
  Trash2, Edit, CheckCircle, Clock, AlertCircle, RefreshCw,
  Tag, CreditCard, ArrowLeft, UserPlus, FileText, ExternalLink, Lock
} from "lucide-react";
import type { CitizenServiceRecord } from "@/types/citizen";
import { getCitizenRecords, deleteCitizenRecord, syncCitizenFromSupabase, getCitizenSettings } from "@/lib/citizenStorage";
import { exportToCSV, formatDateTime } from "@/lib/utils";
import CitizenReceiptModal from "./CitizenReceiptModal";
import CitizenServiceForm from "./CitizenServiceForm";
import CitizenSettingsModal from "./CitizenSettingsModal";
import CitizenProfileDrawer from "./CitizenProfileDrawer";
import { toast } from "sonner";
import SEO from "@/components/common/SEO";

export default function CitizenCustomersPage() {
  const [records, setRecords] = useState<CitizenServiceRecord[]>([]);
  const [search, setSearch] = useState("");
  const [selectedService, setSelectedService] = useState("All");
  const [selectedStatusTab, setSelectedStatusTab] = useState<"All" | "Due" | "Paid" | "Delivered">("All");
  const [isAdding, setIsAdding] = useState(false);
  const [editingRecord, setEditingRecord] = useState<CitizenServiceRecord | null>(null);
  const [activeProfileRecord, setActiveProfileRecord] = useState<CitizenServiceRecord | null>(null);
  const [selectedReceiptRecord, setSelectedReceiptRecord] = useState<CitizenServiceRecord | null>(null);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const settings = getCitizenSettings();

  const loadData = async () => {
    setLoading(true);
    setRecords(getCitizenRecords());
    try {
      await syncCitizenFromSupabase();
      setRecords(getCitizenRecords());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => {
      setRecords(getCitizenRecords());
    };
    window.addEventListener("citizen-data-updated", handleUpdate);
    return () => window.removeEventListener("citizen-data-updated", handleUpdate);
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return records.filter(r => {
      const matchSearch =
        !q ||
        r.customerName.toLowerCase().includes(q) ||
        r.contactNo.includes(q) ||
        r.serviceType.toLowerCase().includes(q) ||
        r.appNumber.toLowerCase().includes(q) ||
        (r.finalServiceNo || "").toLowerCase().includes(q) ||
        (r.portalPassword || "").toLowerCase().includes(q) ||
        (r.address || "").toLowerCase().includes(q) ||
        String(r.serialNo).includes(q);

      const matchService = selectedService === "All" || r.serviceType === selectedService;

      const matchTab =
        selectedStatusTab === "All"
          ? true
          : selectedStatusTab === "Due"
          ? r.dueAmount > 0
          : selectedStatusTab === "Paid"
          ? r.dueAmount === 0
          : r.status === "Delivered" || !!r.deliveredDate;

      return matchSearch && matchService && matchTab;
    });
  }, [records, search, selectedService, selectedStatusTab]);

  const handleExport = () => {
    exportToCSV(
      filtered.map(r => ({
        "Serial No": r.serialNo,
        "Customer Name": r.customerName,
        "Contact Number": r.contactNo,
        Address: r.address,
        "Service Type": r.serviceType,
        "Application Date": r.applicationDate,
        "User ID / App No": r.appNumber,
        "Generated Service / Doc No": r.finalServiceNo || "",
        "Total Amount": r.totalAmount,
        "Advance Paid": r.advancePaid,
        "Due Amount": r.dueAmount,
        "Payment Mode": r.paymentMode,
        "Payment Status": r.paymentStatus,
        Status: r.status,
        "Cloud Document URL": r.documentFileUrl || "",
        "Issued Date": r.issuedDate || "",
        "Delivered Date": r.deliveredDate || "",
        "Created At": formatDateTime(r.createdAt),
      })),
      "citizen-services-records"
    );
    toast.success("CSV exported successfully!");
  };

  const handleDelete = async (id: string, name: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm(`Are you sure you want to permanently delete application for "${name}"?`)) return;

    setRecords(prev => prev.filter(r => r.id !== id));
    if (activeProfileRecord?.id === id) setActiveProfileRecord(null);

    try {
      await deleteCitizenRecord(id);
      toast.success(`Application for "${name}" deleted successfully.`);
    } catch (err: any) {
      toast.error(`Error deleting record: ${err?.message || "Unknown error"}`);
    }
  };

  // In-Page Customer Addition View
  if (isAdding) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <SEO title="Add Customer — Digital Citizen Services" />
        <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <button
            onClick={() => setIsAdding(false)}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            <ArrowLeft size={14} />
            Back to Application Directory
          </button>
          <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
            Creating New Application
          </span>
        </div>
        <CitizenServiceForm
          onSuccess={() => {
            setIsAdding(false);
            loadData();
          }}
          onCancel={() => setIsAdding(false)}
        />
      </div>
    );
  }

  // In-Page Customer Edit View
  if (editingRecord) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <SEO title={`Edit Application — Serial ${editingRecord.serialNo}`} />
        <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <button
            onClick={() => setEditingRecord(null)}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            <ArrowLeft size={14} />
            Back to Application Directory
          </button>
          <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
            Editing Serial {editingRecord.serialNo}
          </span>
        </div>
        <CitizenServiceForm
          initialRecord={editingRecord}
          onSuccess={() => {
            setEditingRecord(null);
            loadData();
          }}
          onCancel={() => setEditingRecord(null)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <SEO title="Service Applications Directory — Digital Citizen Services" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Citizen Applications & Register</h1>
            {loading && <RefreshCw size={14} className="animate-spin text-blue-600" />}
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            {records.length} total applications · {filtered.length} shown · Click any row to view profile
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
          {/* Primary Top-Right Customer Addition Button */}
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm hover:shadow-md transition-all"
          >
            <PlusCircle size={14} />
            <span>+ Add Customer</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search Input */}
          <div className="sm:col-span-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, mobile, ID, passkey, doc no..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white"
            />
          </div>

          {/* Service Dropdown Filter */}
          <div className="sm:col-span-1">
            <select
              value={selectedService}
              onChange={e => setSelectedService(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="All">All Services ({records.length})</option>
              {settings.serviceTypes.map(s => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Status Tabs */}
          <div className="sm:col-span-1 flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            {(["All", "Due", "Paid", "Delivered"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setSelectedStatusTab(tab)}
                className={`flex-1 py-1 text-xs font-bold rounded-md transition-all ${
                  selectedStatusTab === tab
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Applications Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Serial</th>
                <th className="py-3 px-4">Customer Details</th>
                <th className="py-3 px-4">Service Type</th>
                <th className="py-3 px-4">App ID & Password</th>
                <th className="py-3 px-4">Doc No / File</th>
                <th className="py-3 px-4 text-right">Total (₹)</th>
                <th className="py-3 px-4 text-right">Due (₹)</th>
                <th className="py-3 px-4 text-center">Payment</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {filtered.map(r => (
                <tr
                  key={r.id}
                  onClick={() => setActiveProfileRecord(r)}
                  className="hover:bg-blue-50/40 cursor-pointer transition-colors group"
                >
                  {/* Clean Numeric Serial directly without emoji or avatar */}
                  <td className="py-3 px-4 font-mono font-bold text-slate-900 text-sm">
                    {r.serialNo}
                  </td>

                  {/* Customer Details */}
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                      {r.customerName}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">{r.contactNo}</div>
                    {r.address && <div className="text-[10px] text-slate-400 truncate max-w-[140px]">{r.address}</div>}
                  </td>

                  {/* Service Type */}
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                      {r.serviceType}
                    </span>
                  </td>

                  {/* In-Table Portal Credentials (User ID on top, Password underneath) */}
                  <td className="py-3 px-4">
                    <div className="font-mono font-bold text-slate-900 text-xs">
                      ID: {r.appNumber || "—"}
                    </div>
                    <div className="font-mono text-[11px] text-slate-600 font-medium mt-0.5">
                      Pass: {r.portalPassword ? r.portalPassword : <span className="text-slate-400 font-normal italic">—</span>}
                    </div>
                  </td>

                  {/* Dynamic Doc No / Cloud PDF Attachment link */}
                  <td className="py-3 px-4">
                    {r.finalServiceNo ? (
                      <div className="font-mono font-bold text-blue-900 text-[11px]">
                        {r.finalServiceNo}
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-400 italic">No Doc No</div>
                    )}

                    {r.documentFileUrl && (
                      <div className="mt-1">
                        <a
                          href={r.documentFileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-colors"
                        >
                          <FileText size={10} />
                          <span>PDF</span>
                          <ExternalLink size={9} />
                        </a>
                      </div>
                    )}
                  </td>

                  {/* Total Amount */}
                  <td className="py-3 px-4 text-right font-mono font-semibold">
                    ₹{r.totalAmount.toLocaleString("en-IN")}
                  </td>

                  {/* Due Amount */}
                  <td className="py-3 px-4 text-right font-mono font-bold">
                    {r.dueAmount > 0 ? (
                      <span className="text-amber-600">₹{r.dueAmount.toLocaleString("en-IN")}</span>
                    ) : (
                      <span className="text-emerald-600">₹0</span>
                    )}
                  </td>

                  {/* Payment Status Badge */}
                  <td className="py-3 px-4 text-center">
                    {r.dueAmount === 0 ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                        PAID ({r.paymentMode})
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800">
                        DUE ₹{r.dueAmount}
                      </span>
                    )}
                  </td>

                  {/* Delivery Status */}
                  <td className="py-3 px-4 text-center">
                    {r.status === "Delivered" || !!r.deliveredDate ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">
                        ✓ Delivered
                      </span>
                    ) : r.status === "Issued" || !!r.issuedDate ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                        ⌛ Issued
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                        Applied
                      </span>
                    )}
                  </td>

                  {/* Action Buttons (e.stopPropagation to prevent row trigger) */}
                  <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1.5 flex-wrap">
                      {/* Receipt Print */}
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setSelectedReceiptRecord(r);
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200 shadow-2xs"
                        title="Print Half-A4 Receipt"
                      >
                        <Printer size={13} />
                        <span>Receipt</span>
                      </button>

                      {/* Direct Edit */}
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setEditingRecord(r);
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-300 shadow-2xs"
                        title="Directly Edit Application Details"
                      >
                        <Edit size={13} />
                        <span>Edit</span>
                      </button>

                      {/* Direct Delete */}
                      <button
                        onClick={e => handleDelete(r.id, r.customerName, e)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200 shadow-2xs"
                        title="Delete application record"
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
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    No matching applications found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Row-Click Customer Profile Drawer */}
      <CitizenProfileDrawer
        record={activeProfileRecord}
        isOpen={!!activeProfileRecord}
        onClose={() => setActiveProfileRecord(null)}
        onEdit={recordToEdit => setEditingRecord(recordToEdit)}
        onPrintReceipt={recordToPrint => setSelectedReceiptRecord(recordToPrint)}
        onRecordUpdated={updated => {
          setRecords(prev => prev.map(item => (item.id === updated.id ? updated : item)));
          setActiveProfileRecord(updated);
        }}
        onRecordDeleted={deletedId => {
          setRecords(prev => prev.filter(item => item.id !== deletedId));
          setActiveProfileRecord(null);
        }}
      />

      {/* Receipt Modal */}
      {selectedReceiptRecord && (
        <CitizenReceiptModal
          record={selectedReceiptRecord}
          onClose={() => setSelectedReceiptRecord(null)}
        />
      )}

      {/* Settings Modal */}
      <CitizenSettingsModal
        open={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
      />
    </div>
  );
}
