import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, UserPlus, Truck, TrendingUp, MessageSquare,
  Download, RefreshCw, CheckCircle, Clock, AlertCircle,
} from "lucide-react";
import { getCustomers } from "@/lib/storage";
import { getDaysUntilBirthday, exportToCSV, formatDateTime } from "@/lib/utils";
import BirthdayReminder from "@/components/features/BirthdayReminder";
import type { Customer } from "@/types";

export default function DashboardPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    setCustomers(getCustomers());
  }, []);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const totalAccounts = customers.length;
  const activeAccounts = customers.filter(c => c.passbookIssued).length;
  const pendingPassbooks = customers.filter(c => !c.passbookReceived).length;
  const pendingAtm = customers.filter(c => !c.atmReceived).length;
  const monthlyReg = customers.filter(c => {
    const d = new Date(c.createdAt);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).length;

  const recentCustomers = [...customers]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const handleExport = () => {
    exportToCSV(customers.map(c => ({
      Name: c.name, Father: c.fatherName, Mobile: c.mobile,
      Account: c.accountNumber, Ref: c.refNumber, DOB: c.dob,
      Village: c.village, District: c.district, State: c.state,
      Category: c.category, Created: formatDateTime(c.createdAt),
    })), "sk-online-customers");
  };

  const stats = [
    { label: "Total Accounts", value: totalAccounts, icon: Users, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
    { label: "Active Accounts", value: activeAccounts, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
    { label: "Pending Passbooks", value: pendingPassbooks, icon: Clock, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
    { label: "Pending ATM Cards", value: pendingAtm, icon: AlertCircle, color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-100" },
    { label: "Monthly Registrations", value: monthlyReg, icon: TrendingUp, color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-100" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCustomers(getCustomers())}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
          >
            <Download size={14} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Birthday Reminder */}
      <BirthdayReminder customers={customers} />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg, border }) => (
          <div key={label} className={`sk-card p-4 border ${border}`}>
            <div className="flex items-start justify-between mb-3">
              <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon size={18} className={color} />
              </div>
            </div>
            <div className={`text-2xl font-extrabold ${color}`}>{value}</div>
            <div className="text-xs text-slate-500 font-medium mt-1 leading-tight">{label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="sk-card p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wider">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <QuickAction
            icon={UserPlus} label="Add New Customer" color="bg-blue-600 hover:bg-blue-700"
            onClick={() => navigate("/add-customer")}
          />
          <QuickAction
            icon={MessageSquare} label="WhatsApp / WB-SMS" color="bg-emerald-600 hover:bg-emerald-700"
            onClick={() => navigate("/whatsapp")}
          />
          <QuickAction
            icon={Truck} label="Delivery Tracker" color="bg-amber-600 hover:bg-amber-700"
            onClick={() => navigate("/delivery")}
          />
          <QuickAction
            icon={Download} label="Export Data" color="bg-violet-600 hover:bg-violet-700"
            onClick={handleExport}
          />
        </div>
      </div>

      {/* Recent Customers */}
      <div className="sk-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Recent Customers</h2>
          <button
            onClick={() => navigate("/customers")}
            className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            View All →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Account No.</th>
                <th>Mobile</th>
                <th>Category</th>
                <th>Status</th>
                <th>Registered</th>
              </tr>
            </thead>
            <tbody>
              {recentCustomers.map(c => {
                const bDays = getDaysUntilBirthday(c.dob);
                return (
                  <tr key={c.id} className="cursor-pointer" onClick={() => navigate("/customers")}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-slate-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {c.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-slate-800 text-sm">{c.name}</div>
                          {bDays <= 3 && (
                            <div className="text-[10px] text-amber-600 font-semibold">🎂 {bDays === 0 ? "Birthday today!" : `Birthday in ${bDays}d`}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td><span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">{c.accountNumber}</span></td>
                    <td className="text-slate-600">{c.mobile}</td>
                    <td><span className="badge badge-blue">{c.category}</span></td>
                    <td>
                      <div className="flex gap-1">
                        <span className={`badge ${c.passbookIssued ? "badge-green" : "badge-yellow"}`}>
                          PB {c.passbookIssued ? "✓" : "⌛"}
                        </span>
                        <span className={`badge ${c.atmIssued ? "badge-green" : "badge-yellow"}`}>
                          ATM {c.atmIssued ? "✓" : "⌛"}
                        </span>
                      </div>
                    </td>
                    <td className="text-slate-500 text-xs">{formatDateTime(c.createdAt)}</td>
                  </tr>
                );
              })}
              {recentCustomers.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-slate-400 py-8">No customers yet. Add your first customer!</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function QuickAction({ icon: Icon, label, color, onClick }: {
  icon: React.ElementType; label: string; color: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`${color} text-white rounded-xl px-4 py-3 flex items-center gap-3 transition-all duration-150 hover:shadow-md hover:-translate-y-0.5 font-medium text-sm`}
    >
      <Icon size={16} className="flex-shrink-0" />
      <span className="text-left leading-tight">{label}</span>
    </button>
  );
}
