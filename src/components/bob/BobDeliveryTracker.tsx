import React, { useState, useEffect, useMemo, useRef } from "react";
import ReactDOM from "react-dom";
import { Search, Truck, Package, CreditCard, CheckCircle, Clock, Calendar, RefreshCw } from "lucide-react";
import { getBobCustomers, updateBobCustomer, fetchBobCustomersFromSupabase } from "@/lib/bobStorage";
import type { BobCustomerRecord } from "@/types/bob";
import { toast } from "sonner";
import SEO from "@/components/common/SEO";

type DeliveryFilter = "All" | "Passbook Pending" | "ATM Pending" | "Fully Delivered";

type PickerTarget = {
  customerId: string;
  field: "passbookIssued" | "passbookDelivered" | "atmIssued" | "atmDelivered";
  anchorRect: DOMRect;
} | null;

function DatePickerPopover({
  anchorRect,
  onConfirm,
  onCancel,
}: {
  anchorRect: DOMRect;
  onConfirm: (isoDate: string) => void;
  onCancel: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(today);
  const ref = useRef<HTMLDivElement>(null);

  const style: React.CSSProperties = {
    position: "fixed",
    top: anchorRect.bottom + 6,
    left: Math.min(anchorRect.left, window.innerWidth - 250),
    zIndex: 9999,
    minWidth: 230,
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
    const [y, m, d] = selectedDate.split("-").map(Number);
    const dt = new Date(y, m - 1, d, 12, 0, 0);
    onConfirm(dt.toISOString());
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
          onClick={handleConfirm}
          disabled={!selectedDate}
          className="flex-1 py-1.5 text-xs font-bold bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
        >
          Confirm
        </button>
        <button
          onClick={onCancel}
          className="flex-1 py-1.5 text-xs font-semibold bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  return ReactDOM.createPortal(popover, document.body);
}

function DeliveryToggle({
  checked,
  onToggle,
  onRequestDate,
  label,
  disabled,
}: {
  checked: boolean;
  onToggle: () => void;
  onRequestDate: (rect: DOMRect) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <div className="inline-block">
      <button
        onClick={(e) => {
          if (checked) {
            onToggle();
          } else if (!disabled) {
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            onRequestDate(rect);
          }
        }}
        disabled={disabled && !checked}
        className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-semibold transition-all ${
          checked
            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300"
            : disabled
            ? "bg-slate-50 text-slate-300 border border-slate-200 cursor-not-allowed"
            : "bg-slate-100 text-slate-600 hover:bg-orange-100 hover:text-orange-700 border border-slate-200"
        }`}
      >
        {checked ? <CheckCircle size={13} className="flex-shrink-0" /> : <Clock size={13} className="flex-shrink-0" />}
        <span className="whitespace-nowrap max-w-[85px] truncate">{label}</span>
      </button>
    </div>
  );
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

  const uncheck = async (id: string, field: "passbookIssued" | "passbookDelivered" | "atmIssued" | "atmDelivered") => {
    const c = customers.find(item => item.id === id);
    if (!c) return;

    const updates: Partial<BobCustomerRecord> = {};
    if (field === "passbookIssued") {
      updates.passbookIssued = false;
      updates.passbookIssuedAt = null;
    } else if (field === "passbookDelivered") {
      updates.passbookDelivered = false;
      updates.passbookDeliveredAt = null;
    } else if (field === "atmIssued") {
      updates.atmIssued = false;
      updates.atmIssuedAt = null;
    } else if (field === "atmDelivered") {
      updates.atmDelivered = false;
      updates.atmDeliveredAt = null;
    }

    const res = await updateBobCustomer(id, updates);
    if (res.error) {
      toast.error("Failed to update status in Supabase.");
    } else {
      setCustomers(getBobCustomers());
      toast.success("Delivery status reset.");
    }
  };

  const confirmDate = async (isoDate: string) => {
    if (!picker) return;
    const { customerId, field } = picker;
    const c = customers.find(item => item.id === customerId);
    if (!c) {
      setPicker(null);
      return;
    }

    const updates: Partial<BobCustomerRecord> = {};
    if (field === "passbookIssued") {
      updates.passbookIssued = true;
      updates.passbookIssuedAt = isoDate;
    } else if (field === "passbookDelivered") {
      updates.passbookDelivered = true;
      updates.passbookDeliveredAt = isoDate;
      // Auto mark issued if not already marked
      if (!c.passbookIssued) {
        updates.passbookIssued = true;
        updates.passbookIssuedAt = isoDate;
      }
    } else if (field === "atmIssued") {
      updates.atmIssued = true;
      updates.atmIssuedAt = isoDate;
    } else if (field === "atmDelivered") {
      updates.atmDelivered = true;
      updates.atmDeliveredAt = isoDate;
      // Auto mark issued if not already marked
      if (!c.atmIssued) {
        updates.atmIssued = true;
        updates.atmIssuedAt = isoDate;
      }
    }

    const res = await updateBobCustomer(customerId, updates);
    setPicker(null);

    if (res.error) {
      toast.error("Failed to save delivery date to Supabase.");
    } else {
      setCustomers(getBobCustomers());
      toast.success("Delivery date updated and saved to Supabase.");
    }
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

      const filterMatch =
        filter === "All" ||
        (filter === "Passbook Pending" && !c.passbookDelivered) ||
        (filter === "ATM Pending" && !c.atmDelivered) ||
        (filter === "Fully Delivered" && c.passbookDelivered && c.atmDelivered);

      return match && filterMatch;
    });
  }, [customers, search, filter]);

  const stats = {
    total: customers.length,
    pbIssued: customers.filter(c => c.passbookIssued).length,
    pbDelivered: customers.filter(c => c.passbookDelivered).length,
    atmIssued: customers.filter(c => c.atmIssued).length,
    atmDelivered: customers.filter(c => c.atmDelivered).length,
    fullyDelivered: customers.filter(c => c.passbookDelivered && c.atmDelivered).length,
  };

  const fmtDate = (iso?: string | null) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
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
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Stats Cards: 4 Milestones + Fully Delivered */}
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
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
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
                    <DeliveryToggle
                      checked={c.passbookIssued}
                      onToggle={() => uncheck(c.id, "passbookIssued")}
                      onRequestDate={(rect) => setPicker({ customerId: c.id, field: "passbookIssued", anchorRect: rect })}
                      label={c.passbookIssued ? `✓ ${fmtDate(c.passbookIssuedAt)}` : "Set Date"}
                    />
                  </td>

                  {/* 2. Passbook Delivered */}
                  <td className="py-3 px-2 text-center">
                    <DeliveryToggle
                      checked={c.passbookDelivered}
                      onToggle={() => uncheck(c.id, "passbookDelivered")}
                      onRequestDate={(rect) => setPicker({ customerId: c.id, field: "passbookDelivered", anchorRect: rect })}
                      label={c.passbookDelivered ? `✓ ${fmtDate(c.passbookDeliveredAt)}` : "Set Date"}
                    />
                  </td>

                  {/* 3. ATM Issued */}
                  <td className="py-3 px-2 text-center">
                    <DeliveryToggle
                      checked={c.atmIssued}
                      onToggle={() => uncheck(c.id, "atmIssued")}
                      onRequestDate={(rect) => setPicker({ customerId: c.id, field: "atmIssued", anchorRect: rect })}
                      label={c.atmIssued ? `✓ ${fmtDate(c.atmIssuedAt)}` : "Set Date"}
                    />
                  </td>

                  {/* 4. ATM Delivered */}
                  <td className="py-3 px-2 text-center">
                    <DeliveryToggle
                      checked={c.atmDelivered}
                      onToggle={() => uncheck(c.id, "atmDelivered")}
                      onRequestDate={(rect) => setPicker({ customerId: c.id, field: "atmDelivered", anchorRect: rect })}
                      label={c.atmDelivered ? `✓ ${fmtDate(c.atmDeliveredAt)}` : "Set Date"}
                    />
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

      {/* Portal-rendered date picker — renders at document.body to escape overflow clipping */}
      {picker && (
        <DatePickerPopover
          anchorRect={picker.anchorRect}
          onConfirm={confirmDate}
          onCancel={() => setPicker(null)}
        />
      )}
    </div>
  );
}
