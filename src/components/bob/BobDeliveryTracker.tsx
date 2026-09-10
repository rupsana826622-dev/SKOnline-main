import React, { useState, useEffect, useMemo, useRef } from "react";
import ReactDOM from "react-dom";
import { Search, Truck, Package, CreditCard, CheckCircle, Clock, Calendar, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getBobCustomers, saveBobCustomers, fetchBobCustomersFromSupabase } from "@/lib/bobStorage";
import type { BobCustomerRecord } from "@/types/bob";
import { toast } from "sonner";
import SEO from "@/components/common/SEO";

type DeliveryFilter = "All" | "Passbook Pending" | "ATM Pending" | "Fully Delivered";

type MilestoneKey = "passbook_issued" | "passbook_delivered" | "atm_issued" | "atm_delivered";

type PickerTarget = {
  customerId: string;
  milestoneKey: MilestoneKey;
  anchorRect: DOMRect;
  currentDate?: string | null;
} | null;

const fmtDate = (val?: string | null) => {
  if (!val || typeof val === "boolean") return "";
  try {
    const clean = String(val).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(clean)) {
      const [y, m, d] = clean.slice(0, 10).split("-").map(Number);
      const dt = new Date(y, m - 1, d);
      return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    }
    const dt = new Date(clean);
    if (isNaN(dt.getTime())) return clean;
    return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return String(val);
  }
};

function DatePickerPopover({
  anchorRect,
  currentDate,
  onConfirm,
  onClear,
  onCancel,
}: {
  anchorRect: DOMRect;
  currentDate?: string | null;
  onConfirm: (isoDate: string) => void;
  onClear?: () => void;
  onCancel: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const initialDate = currentDate && /^\d{4}-\d{2}-\d{2}/.test(currentDate)
    ? currentDate.slice(0, 10)
    : today;
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const ref = useRef<HTMLDivElement>(null);

  const style: React.CSSProperties = {
    position: "fixed",
    top: anchorRect.bottom + 6,
    left: Math.min(anchorRect.left, window.innerWidth - 250),
    zIndex: 9999,
    minWidth: 240,
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onCancel();
      }
    };
    const tid = setTimeout(() => document.addEventListener("mousedown", handler), 10);
    return () => {
      clearTimeout(tid);
      document.removeEventListener("mousedown", handler);
    };
  }, [onCancel]);

  const handleConfirm = () => {
    if (!selectedDate) return;
    onConfirm(selectedDate);
  };

  const popover = (
    <div
      ref={ref}
      style={style}
      className="bg-white border border-slate-200 rounded-xl shadow-xl p-4 animate-fade-in"
      onClick={e => e.stopPropagation()}
    >
      <div className="flex items-center gap-2 mb-3">
        <Calendar size={14} className="text-orange-600" />
        <span className="text-xs font-bold text-slate-700">Select Date</span>
      </div>
      <input
        type="date"
        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 font-mono bg-slate-50"
        value={selectedDate}
        max={today}
        onChange={e => setSelectedDate(e.target.value)}
        autoFocus
      />
      <div className="flex gap-2 mt-3">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!selectedDate}
          className="flex-1 py-1.5 text-xs font-bold bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors shadow-xs"
        >
          Confirm
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-1.5 text-xs font-semibold bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
        >
          Cancel
        </button>
      </div>
      {currentDate && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="w-full mt-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors text-center"
        >
          Reset / Clear Milestone
        </button>
      )}
    </div>
  );

  return ReactDOM.createPortal(popover, document.body);
}

export default function BobDeliveryTracker() {
  const [customers, setCustomers] = useState<BobCustomerRecord[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<DeliveryFilter>("All");
  const [picker, setPicker] = useState<PickerTarget>(null);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setCustomers(getBobCustomers());
    try {
      const live = await fetchBobCustomersFromSupabase();
      if (live && live.length >= 0) {
        setCustomers(live);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => {
      setCustomers(getBobCustomers());
    };
    window.addEventListener("bob-data-updated", handleUpdate);
    return () => window.removeEventListener("bob-data-updated", handleUpdate);
  }, []);

  const handleUpdateMilestone = async (
    customerId: string,
    milestoneType: MilestoneKey,
    selectedDate: string | null
  ) => {
    const isCompleted = Boolean(selectedDate);
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (milestoneType === "passbook_issued") {
      updatePayload.passbook_issued = isCompleted;
      updatePayload.passbook_issued_date = selectedDate;
    } else if (milestoneType === "passbook_delivered") {
      updatePayload.passbook_delivered = isCompleted;
      updatePayload.passbook_delivered_date = selectedDate;
    } else if (milestoneType === "atm_issued") {
      updatePayload.atm_issued = isCompleted;
      updatePayload.atm_issued_date = selectedDate;
    } else if (milestoneType === "atm_delivered") {
      updatePayload.atm_delivered = isCompleted;
      updatePayload.atm_delivered_date = selectedDate;
    }

    let { data, error } = await (supabase as any)
      .from("bob_customers")
      .update(updatePayload)
      .eq("id", customerId)
      .select();

    if (error && error.code === "PGRST204") {
      const fallbackPayload: Record<string, any> = {
        [`${milestoneType}_date`]: selectedDate,
        updated_at: new Date().toISOString(),
      };
      const fallbackRes = await (supabase as any)
        .from("bob_customers")
        .update(fallbackPayload)
        .eq("id", customerId)
        .select();
      data = fallbackRes.data;
      error = fallbackRes.error;
    }

    if (error) {
      console.error("BOB Tracker Update Error:", error);
      alert("Database Update Failed: " + error.message);
      return;
    }

    if (!data || data.length === 0) {
      console.warn("No customer row matched for id:", customerId);
      alert("Error: Customer record not found in database.");
      return;
    }

    // Immediate Optimistic UI State Update
    setCustomers(prev => {
      const camelMap: Record<MilestoneKey, { boolKey: keyof BobCustomerRecord; atKey: keyof BobCustomerRecord }> = {
        passbook_issued: { boolKey: "passbookIssued", atKey: "passbookIssuedAt" },
        passbook_delivered: { boolKey: "passbookDelivered", atKey: "passbookDeliveredAt" },
        atm_issued: { boolKey: "atmIssued", atKey: "atmIssuedAt" },
        atm_delivered: { boolKey: "atmDelivered", atKey: "atmDeliveredAt" },
      };
      const keys = camelMap[milestoneType];

      const updated = prev.map(c => {
        if (c.id === customerId) {
          return {
            ...c,
            ...updatePayload,
            [keys.boolKey]: isCompleted,
            [keys.atKey]: selectedDate,
          };
        }
        return c;
      });
      saveBobCustomers(updated);
      return updated;
    });

    toast.success(isCompleted ? "Milestone updated successfully!" : "Delivery status reset.");
  };

  const getMilestoneDate = (c: BobCustomerRecord, key: MilestoneKey): string | null => {
    const directDate = c[`${key}_date` as keyof BobCustomerRecord];
    if (directDate && typeof directDate === "string" && directDate.trim() !== "" && directDate !== "null") {
      return directDate;
    }
    if (key === "passbook_issued" && c.passbookIssuedAt) return c.passbookIssuedAt;
    if (key === "passbook_delivered" && c.passbookDeliveredAt) return c.passbookDeliveredAt;
    if (key === "atm_issued" && c.atmIssuedAt) return c.atmIssuedAt;
    if (key === "atm_delivered" && c.atmDeliveredAt) return c.atmDeliveredAt;
    if (typeof c[key] === "string" && c[key] !== "null" && c[key] !== "true" && c[key] !== "false") {
      return c[key] as string;
    }
    return null;
  };

  const isMilestoneDone = (c: BobCustomerRecord, key: MilestoneKey): boolean => {
    if (key === "passbook_issued") {
      return c.passbook_issued === true || Boolean(c.passbook_issued_date) || c.passbookIssued === true || Boolean(c.passbookIssuedAt);
    }
    if (key === "passbook_delivered") {
      return c.passbook_delivered === true || Boolean(c.passbook_delivered_date) || c.passbookDelivered === true || Boolean(c.passbookDeliveredAt);
    }
    if (key === "atm_issued") {
      return c.atm_issued === true || Boolean(c.atm_issued_date) || c.atmIssued === true || Boolean(c.atmIssuedAt);
    }
    if (key === "atm_delivered") {
      return c.atm_delivered === true || Boolean(c.atm_delivered_date) || c.atmDelivered === true || Boolean(c.atmDeliveredAt);
    }
    return false;
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return customers.filter(c => {
      const match =
        !q ||
        c.customerName.toLowerCase().includes(q) ||
        c.accountNo.toLowerCase().includes(q) ||
        c.mobile.includes(q) ||
        String(c.slNo).includes(q);

      const pbDone = isMilestoneDone(c, "passbook_delivered");
      const atmDone = isMilestoneDone(c, "atm_delivered");

      const filterMatch =
        filter === "All" ||
        (filter === "Passbook Pending" && !pbDone) ||
        (filter === "ATM Pending" && !atmDone) ||
        (filter === "Fully Delivered" && pbDone && atmDone);

      return match && filterMatch;
    });
  }, [customers, search, filter]);

  const stats = {
    total: customers.length,
    pbIssued: customers.filter(c => c.passbook_issued === true || Boolean(c.passbook_issued_date) || c.passbookIssued === true || Boolean(c.passbookIssuedAt)).length,
    pbDelivered: customers.filter(c => c.passbook_delivered === true || Boolean(c.passbook_delivered_date) || c.passbookDelivered === true || Boolean(c.passbookDeliveredAt)).length,
    atmIssued: customers.filter(c => c.atm_issued === true || Boolean(c.atm_issued_date) || c.atmIssued === true || Boolean(c.atmIssuedAt)).length,
    atmDelivered: customers.filter(c => c.atm_delivered === true || Boolean(c.atm_delivered_date) || c.atmDelivered === true || Boolean(c.atmDeliveredAt)).length,
  };

  const renderMilestoneCell = (
    c: BobCustomerRecord,
    key: MilestoneKey,
    colorScheme: "blue" | "emerald" | "violet" | "orange"
  ) => {
    const isDone = isMilestoneDone(c, key);
    const dateVal = getMilestoneDate(c, key);

    if (isDone || dateVal) {
      const colorClasses = {
        blue: "bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200",
        emerald: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200",
        violet: "bg-violet-50 text-violet-700 hover:bg-violet-100 border-violet-200",
        orange: "bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-200",
      }[colorScheme];

      const displayText = dateVal ? `✓ ${fmtDate(dateVal)}` : "✓ Done";

      return (
        <button
          onClick={(e) => {
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            setPicker({
              customerId: c.id,
              milestoneKey: key,
              anchorRect: rect,
              currentDate: dateVal,
            });
          }}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all shadow-xs cursor-pointer ${colorClasses}`}
          title="Click to update or reset date"
        >
          <CheckCircle size={13} className="flex-shrink-0" />
          <span className="whitespace-nowrap">{displayText}</span>
        </button>
      );
    }

    return (
      <button
        onClick={(e) => {
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
          setPicker({
            customerId: c.id,
            milestoneKey: key,
            anchorRect: rect,
            currentDate: null,
          });
        }}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 text-slate-600 hover:bg-orange-50 hover:text-orange-700 border border-slate-200 hover:border-orange-300 transition-all shadow-xs cursor-pointer"
        title="Set date"
      >
        <Clock size={13} className="text-slate-400 flex-shrink-0" />
        <span className="whitespace-nowrap">⏱ Set Date</span>
      </button>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <SEO title="Bank of Baroda 4-Stage Delivery Tracker" />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Truck size={20} className="text-orange-600" />
            Bank of Baroda Delivery Tracker
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            4-Stage lifecycle management for Passbooks and ATM cards with instant calendar date logging
          </p>
        </div>

        <button
          onClick={loadData}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Stats Cards: 4 Milestones */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Passbook Issued", value: stats.pbIssued, icon: Package, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Passbook Delivered", value: stats.pbDelivered, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "ATM Issued", value: stats.atmIssued, icon: CreditCard, color: "text-violet-600", bg: "bg-violet-50" },
          { label: "ATM Delivered / Complete", value: stats.atmDelivered, icon: CheckCircle, color: "text-orange-600", bg: "bg-orange-50" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mb-2`}>
              <Icon size={16} className={color} />
            </div>
            <div className={`text-2xl font-black ${color}`}>{value}</div>
            <div className="text-xs text-slate-600 font-semibold mt-0.5 leading-tight">{label}</div>
          </div>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap gap-3 items-center shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search customer, account, mobile, SL NO..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(["All", "Passbook Pending", "ATM Pending", "Fully Delivered"] as DeliveryFilter[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                filter === f
                  ? "bg-orange-600 text-white border-orange-600 shadow-xs"
                  : "bg-white text-slate-600 border-slate-200 hover:border-orange-300"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* 4-Stage Delivery Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3">SL NO</th>
                <th className="py-3 px-3">Customer Details</th>
                <th className="py-3 px-3">Account Number</th>
                <th className="py-3 px-3">Mobile</th>
                <th className="py-3 px-2 text-center text-blue-800">Passbook Issued</th>
                <th className="py-3 px-2 text-center text-emerald-800">Passbook Delivered</th>
                <th className="py-3 px-2 text-center text-violet-800">ATM Issued</th>
                <th className="py-3 px-2 text-center text-orange-800">ATM Delivered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-orange-50/30 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-slate-900">
                    {c.slNo}
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900">{c.customerName}</div>
                    {c.guardianName && <div className="text-[11px] text-slate-500">C/O: {c.guardianName}</div>}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-800">
                    {c.accountNo || "—"}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-600">
                    {c.mobile}
                  </td>

                  {/* 1. Passbook Issued */}
                  <td className="py-3 px-2 text-center">
                    {renderMilestoneCell(c, "passbook_issued", "blue")}
                  </td>

                  {/* 2. Passbook Delivered */}
                  <td className="py-3 px-2 text-center">
                    {renderMilestoneCell(c, "passbook_delivered", "emerald")}
                  </td>

                  {/* 3. ATM Issued */}
                  <td className="py-3 px-2 text-center">
                    {renderMilestoneCell(c, "atm_issued", "violet")}
                  </td>

                  {/* 4. ATM Delivered */}
                  <td className="py-3 px-2 text-center">
                    {renderMilestoneCell(c, "atm_delivered", "orange")}
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No matching delivery records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Portal-rendered date picker */}
      {picker && (
        <DatePickerPopover
          anchorRect={picker.anchorRect}
          currentDate={picker.currentDate}
          onConfirm={(dateStr) => {
            const { customerId, milestoneKey } = picker;
            setPicker(null);
            handleUpdateMilestone(customerId, milestoneKey, dateStr);
          }}
          onClear={() => {
            const { customerId, milestoneKey } = picker;
            setPicker(null);
            handleUpdateMilestone(customerId, milestoneKey, null);
          }}
          onCancel={() => setPicker(null)}
        />
      )}
    </div>
  );
}
