import React, { useState, useEffect, useMemo, useRef } from "react";
import ReactDOM from "react-dom";
import {
  Truck, CheckCircle, Clock, Calendar, Search, Filter,
  Phone, User, Package, AlertCircle, Printer, Eye
} from "lucide-react";
import type { CitizenServiceRecord } from "@/types/citizen";
import { getCitizenRecords, updateCitizenRecord, syncCitizenFromSupabase } from "@/lib/citizenStorage";
import { toast } from "sonner";
import CitizenReceiptModal from "./CitizenReceiptModal";

// ─── Date Picker Popover (Portal-rendered, escapes overflow clipping) ─────────

function DeliveryDatePickerPopover({
  anchorRect,
  initialDate,
  onConfirm,
  onCancel,
}: {
  anchorRect: DOMRect;
  initialDate?: string;
  onConfirm: (dateStr: string) => void;
  onCancel: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(initialDate || today);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Position the popover below the anchor button using fixed coordinates
  const style: React.CSSProperties = {
    position: "fixed",
    top: anchorRect.bottom + 6,
    left: Math.min(anchorRect.left, window.innerWidth - 250),
    zIndex: 9999,
    minWidth: 230,
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onCancel();
      }
    };
    // slight delay so the click that opened the popover doesn't immediately close it
    const tid = setTimeout(() => document.addEventListener("mousedown", handleClickOutside), 10);
    return () => {
      clearTimeout(tid);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onCancel]);

  const popover = (
    <div
      ref={popoverRef}
      style={style}
      className="bg-white border border-slate-300 rounded-xl shadow-2xl p-3 animate-fade-in text-slate-900"
      onClick={e => e.stopPropagation()}
    >
      <div className="flex items-center gap-1.5 mb-2 text-xs font-bold text-slate-700">
        <Calendar size={13} className="text-blue-600" />
        <span>Select Milestone Date</span>
      </div>
      <input
        type="date"
        value={selectedDate}
        onChange={e => setSelectedDate(e.target.value)}
        className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50 mb-3"
        autoFocus
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onConfirm(selectedDate)}
          className="flex-1 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Confirm
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  return ReactDOM.createPortal(popover, document.body);
}

export default function CitizenDeliveryTracker() {
  const [records, setRecords] = useState<CitizenServiceRecord[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Applied" | "Issued" | "Delivered">("All");

  // Popover state — stores target info + the anchor button's bounding rect
  const [pickerTarget, setPickerTarget] = useState<{
    recordId: string;
    action: "issue" | "deliver";
    anchorRect: DOMRect;
  } | null>(null);

  const [selectedReceiptRecord, setSelectedReceiptRecord] = useState<CitizenServiceRecord | null>(null);

  useEffect(() => {
    setRecords(getCitizenRecords());
    syncCitizenFromSupabase().then(() => {
      setRecords(getCitizenRecords());
    });

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
        String(r.serialNo).includes(q);

      const matchStatus =
        statusFilter === "All"
          ? true
          : statusFilter === "Delivered"
          ? r.status === "Delivered" || !!r.deliveredDate
          : statusFilter === "Issued"
          ? (r.status === "Issued" || !!r.issuedDate) && !r.deliveredDate
          : !r.issuedDate && !r.deliveredDate;

      return matchSearch && matchStatus;
    });
  }, [records, search, statusFilter]);

  const handleConfirmDate = async (dateStr: string) => {
    if (!pickerTarget) return;
    const { recordId, action } = pickerTarget;
    const target = records.find(r => r.id === recordId);
    if (!target) return;

    setPickerTarget(null);

    try {
      if (action === "issue") {
        await updateCitizenRecord(recordId, {
          issuedDate: dateStr,
          status: target.status === "Delivered" ? "Delivered" : "Issued",
        });
        toast.success(`SL #${target.serialNo} marked as Issued on ${dateStr}`);
      } else if (action === "deliver") {
        await updateCitizenRecord(recordId, {
          deliveredDate: dateStr,
          status: "Delivered",
        });
        toast.success(`SL #${target.serialNo} marked as Delivered on ${dateStr}`);
      }
      await syncCitizenFromSupabase();
      setRecords(getCitizenRecords());
    } catch (err: any) {
      toast.error(`Failed to update status: ${err?.message || "Database error"}`);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header & Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
              <Truck size={18} />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Service Delivery Tracker</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Track and update application milestones from submission to customer delivery</p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative min-w-[220px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search serial, customer, ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            {(["All", "Applied", "Issued", "Delivered"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  statusFilter === tab
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

      {/* Tracker Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Serial No</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Service Type</th>
                <th className="py-3 px-4">App / User ID</th>
                <th className="py-3 px-4">Applied Date</th>
                <th className="py-3 px-4 text-center">Issued Milestone</th>
                <th className="py-3 px-4 text-center">Delivered Milestone</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {filtered.map(r => {
                const isIssued = !!r.issuedDate;
                const isDelivered = !!r.deliveredDate || r.status === "Delivered";

                return (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Serial */}
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {r.serialNo}
                    </td>

                    {/* Customer */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{r.customerName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{r.contactNo}</div>
                    </td>

                    {/* Service */}
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                        {r.serviceType}
                      </span>
                    </td>

                    {/* App / Ack ID */}
                    <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                      {r.appNumber}
                    </td>

                    {/* Applied Date */}
                    <td className="py-3 px-4 text-slate-600 font-mono">
                      {r.applicationDate}
                    </td>

                    {/* Issued Milestone Button with Portal Popover */}
                    <td className="py-3 px-4 text-center">
                      <div className="inline-block">
                        <button
                          type="button"
                          onClick={(e) => {
                            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                            setPickerTarget({ recordId: r.id, action: "issue", anchorRect: rect });
                          }}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all border ${
                            isIssued
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                              : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          <CheckCircle size={13} className={isIssued ? "text-emerald-600" : "text-slate-400"} />
                          <span>{isIssued ? r.issuedDate : "Mark Issued"}</span>
                        </button>
                      </div>
                    </td>

                    {/* Delivered Milestone Button with Portal Popover */}
                    <td className="py-3 px-4 text-center">
                      <div className="inline-block">
                        <button
                          type="button"
                          onClick={(e) => {
                            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                            setPickerTarget({ recordId: r.id, action: "deliver", anchorRect: rect });
                          }}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all border ${
                            isDelivered
                              ? "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
                              : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          <Package size={13} className={isDelivered ? "text-indigo-600" : "text-slate-400"} />
                          <span>{isDelivered ? r.deliveredDate : "Mark Delivered"}</span>
                        </button>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedReceiptRecord(r)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-slate-200"
                        title="Print Receipt"
                      >
                        <Printer size={13} />
                        <span>Receipt</span>
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    No matching service applications found.
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

      {/* Portal-rendered date picker \u2014 rendered at document.body to escape overflow clipping */}
      {pickerTarget && (
        <DeliveryDatePickerPopover
          anchorRect={pickerTarget.anchorRect}
          initialDate={
            pickerTarget.action === "issue"
              ? records.find(r => r.id === pickerTarget.recordId)?.issuedDate || undefined
              : records.find(r => r.id === pickerTarget.recordId)?.deliveredDate || undefined
          }
          onConfirm={handleConfirmDate}
          onCancel={() => setPickerTarget(null)}
        />
      )}
    </div>
  );
}
