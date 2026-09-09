import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles, PlusCircle, Users, CreditCard, Truck, Settings,
  CheckCircle, Clock, AlertCircle, Printer, Download, RefreshCw,
  TrendingUp, DollarSign, FileText, ArrowUpRight
} from "lucide-react";
import type { CitizenServiceRecord } from "@/types/citizen";
import { getCitizenRecords, deleteCitizenRecord, syncCitizenFromSupabase, getCitizenSettings } from "@/lib/citizenStorage";
import { exportToCSV, formatDateTime } from "@/lib/utils";
import CitizenReceiptModal from "./CitizenReceiptModal";
import CitizenSettingsModal from "./CitizenSettingsModal";
import { toast } from "sonner";
import SEO from "@/components/common/SEO";

export default function CitizenDashboard() {
  const [records, setRecords] = useState<CitizenServiceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedReceiptRecord, setSelectedReceiptRecord] = useState<CitizenServiceRecord | null>(null);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const navigate = useNavigate();

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

  // Compute metrics
  const totalApps = records.length;
  const totalBilled = records.reduce((sum, r) => sum + r.totalAmount, 0);
  const totalCollected = records.reduce((sum, r) => sum + r.advancePaid, 0);
  const totalDue = records.reduce((sum, r) => sum + r.dueAmount, 0);
  const dueCount = records.filter(r => r.dueAmount > 0).length;
  const deliveredCount = records.filter(r => r.status === "Delivered" || !!r.deliveredDate).length;
  const pendingDeliveryCount = records.filter(r => !r.deliveredDate && r.status !== "Delivered").length;

  const recentRecords = [...records].slice(0, 8);

  const handleExport = () => {
    exportToCSV(
      records.map(r => ({
        "Serial No": r.serialNo,
        "Customer Name": r.customerName,
        "Contact Number": r.contactNo,
        Address: r.address,
        "Service Type": r.serviceType,
        "Application Date": r.applicationDate,
        "User ID / App No": r.appNumber,
        "Total Amount": r.totalAmount,
        "Advance Paid": r.advancePaid,
        "Due Amount": r.dueAmount,
        "Payment Mode": r.paymentMode,
        "Payment Status": r.paymentStatus,
        Status: r.status,
        "Issued Date": r.issuedDate || "",
        "Delivered Date": r.deliveredDate || "",
        "Created At": formatDateTime(r.createdAt),
      })),
      "citizen-services-register"
    );
    toast.success("Citizen Services CSV exported!");
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete application for ${name}?`)) return;
    setRecords(prev => prev.filter(r => r.id !== id));
    await deleteCitizenRecord(id);
    toast.success(`Application for "${name}" removed.`);
  };

  const stats = [
    {
      label: "Total Applications",
      value: totalApps,
      icon: FileText,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-100",
    },
    {
      label: "Total Collected",
      value: `₹${totalCollected.toLocaleString("en-IN")}`,
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-100",
    },
    {
      label: "Outstanding Dues",
      value: `₹${totalDue.toLocaleString("en-IN")}`,
      badge: dueCount > 0 ? `${dueCount} Pending` : undefined,
      icon: AlertCircle,
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-200",
    },
    {
      label: "Pending Deliveries",
      value: pendingDeliveryCount,
      icon: Clock,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      border: "border-indigo-100",
    },
    {
      label: "Delivered Services",
      value: deliveredCount,
      icon: CheckCircle,
      color: "text-teal-600",
      bg: "bg-teal-50",
      border: "border-teal-100",
    },
  ];

  const now = new Date();

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <SEO title="Digital Citizen Services Hub" />

      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Digital Citizen Services Hub
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-100 text-blue-800 border border-blue-200">
              Active Workspace
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            {now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} · Multi-Service & Accounting Console
          </p>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={loadData}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors shadow-xs"
          >
            <RefreshCw size={13} className={loading ? "animate-spin text-blue-600" : ""} />
            Sync
          </button>
          <button
            onClick={() => setSettingsModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Settings size={14} className="text-slate-500" />
            Services Settings
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Download size={14} />
            Export CSV
          </button>
          <button
            onClick={() => navigate("/add-customer")}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all"
          >
            <PlusCircle size={15} />
            New Service Application
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg, border, badge }) => (
          <div key={label} className={`sk-card p-4 border ${border} rounded-2xl`}>
            <div className="flex items-start justify-between mb-2">
              <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center`}>
                <Icon size={18} className={color} />
              </div>
              {badge && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                  {badge}
                </span>
              )}
            </div>
            <div className={`text-xl font-black ${color}`}>{value}</div>
            <div className="text-xs text-slate-500 font-medium mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Quick Action Navigation Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => navigate("/add-customer")}
          className="p-4 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl shadow-md hover:shadow-lg transition-all text-left flex flex-col justify-between group"
        >
          <div className="flex justify-between items-center mb-3">
            <PlusCircle size={20} />
            <ArrowUpRight size={16} className="opacity-70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
          <div>
            <div className="font-bold text-sm">Add New Service</div>
            <div className="text-[11px] text-blue-100">Register PAN, Passport, Tickets...</div>
          </div>
        </button>

        <button
          onClick={() => navigate("/citizen/delivery")}
          className="p-4 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl shadow-md hover:shadow-lg transition-all text-left flex flex-col justify-between group"
        >
          <div className="flex justify-between items-center mb-3">
            <Truck size={20} className="text-indigo-400" />
            <ArrowUpRight size={16} className="opacity-70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
          <div>
            <div className="font-bold text-sm">Delivery Tracker</div>
            <div className="text-[11px] text-slate-300">Milestone dates & issuance</div>
          </div>
        </button>

        <button
          onClick={() => navigate("/citizen/dues")}
          className="p-4 bg-gradient-to-br from-amber-600 to-amber-700 text-white rounded-2xl shadow-md hover:shadow-lg transition-all text-left flex flex-col justify-between group"
        >
          <div className="flex justify-between items-center mb-3">
            <CreditCard size={20} className="text-amber-200" />
            <ArrowUpRight size={16} className="opacity-70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
          <div>
            <div className="font-bold text-sm">Due Payments Ledger</div>
            <div className="text-[11px] text-amber-100">
              {dueCount > 0 ? `₹${totalDue} remaining balance` : "All dues cleared"}
            </div>
          </div>
        </button>

        <button
          onClick={() => setSettingsModalOpen(true)}
          className="p-4 bg-gradient-to-br from-teal-700 to-teal-800 text-white rounded-2xl shadow-md hover:shadow-lg transition-all text-left flex flex-col justify-between group"
        >
          <div className="flex justify-between items-center mb-3">
            <Settings size={20} className="text-teal-300" />
            <ArrowUpRight size={16} className="opacity-70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
          <div>
            <div className="font-bold text-sm">Services Settings</div>
            <div className="text-[11px] text-teal-100">Stamp, services & branding</div>
          </div>
        </button>
      </div>

      {/* Recent Applications Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-slate-900 text-base">Recent Citizen Applications</h2>
            <p className="text-xs text-slate-500">Live service registry with one-click Half-A4 receipts</p>
          </div>
          <button
            onClick={() => navigate("/customers")}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
          >
            View All ({records.length}) →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Serial</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Service Type</th>
                <th className="py-3 px-4">App / User ID</th>
                <th className="py-3 px-4 text-right">Total (₹)</th>
                <th className="py-3 px-4 text-right">Due (₹)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {recentRecords.map(r => (
                <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    {r.serialNo}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{r.customerName}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{r.contactNo}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                      {r.serviceType}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-700">
                    {r.appNumber}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold">
                    ₹{r.totalAmount.toLocaleString("en-IN")}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold">
                    {r.dueAmount > 0 ? (
                      <span className="text-amber-600">₹{r.dueAmount.toLocaleString("en-IN")}</span>
                    ) : (
                      <span className="text-emerald-600">₹0</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {r.dueAmount === 0 ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                        FULL PAID
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800">
                        DUE ₹{r.dueAmount}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedReceiptRecord(r)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
                        title="Print Half-A4 Receipt"
                      >
                        <Printer size={13} />
                        <span>Receipt</span>
                      </button>
                      <button
                        onClick={() => handleDelete(r.id, r.customerName)}
                        className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                        title="Delete application"
                      >
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {recentRecords.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <FileText size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="font-semibold text-slate-700">No applications registered yet.</p>
                    <button
                      onClick={() => navigate("/add-customer")}
                      className="mt-3 px-4 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Create First Application
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

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
