import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, UserPlus, Download, Filter, Printer,
  Trash2, Eye, ChevronDown,
} from "lucide-react";
import { getCustomers, deleteCustomer as deleteCustomerStorage } from "@/lib/storage";
import { exportToCSV, formatDateTime, getDaysUntilBirthday } from "@/lib/utils";
import PrintModal from "@/components/features/PrintModal";
import type { Customer } from "@/types";
import { CATEGORIES } from "@/constants";
import { toast } from "sonner";
import SEO from "@/components/common/SEO";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [viewCustomer, setViewCustomer] = useState<Customer | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setCustomers(getCustomers());
  }, []);

  const filtered = useMemo(() => {
    const lower = search.toLowerCase();
    return customers.filter(c => {
      const matchSearch =
        !search ||
        c.name.toLowerCase().includes(lower) ||
        c.accountNumber.includes(search) ||
        c.mobile.includes(search) ||
        c.refNumber.toLowerCase().includes(lower) ||
        (c.village || "").toLowerCase().includes(lower) ||
        (c.customerId || "").toLowerCase().includes(lower);
      const matchCat = categoryFilter === "All" || c.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [customers, search, categoryFilter]);

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Delete customer "${name}"? This cannot be undone.`)) return;
    deleteCustomerStorage(id);
    setCustomers(getCustomers());
    toast.success("Customer deleted.");
  };

  const handleExport = () => {
    exportToCSV(filtered.map(c => ({
      Name: c.name, "Father Name": c.fatherName, Mobile: c.mobile,
      "Account Number": c.accountNumber, "CIF": c.customerId || "",
      "Ref Number": c.refNumber,
      DOB: c.dob, Age: c.age, Category: c.category, Sex: c.sex,
      Profession: c.profession || "",
      Address: c.address, Village: c.village || "", Mandal: c.mandal || "",
      District: c.district, State: c.state,
      "Annual Income": c.annualIncome, "Income Tier": c.annualIncomeTier || "",
      "PAN/GIR": c.panGir,
      "Sol ID": c.solId || "", "Zone": c.zone || "",
      "Education": c.educationLevel || "", "Occupation": c.occupationType || "",
      "Risk Category": c.riskCategory || "",
      "Nominee Name": c.nomineeName,
      "PMJJBY": c.enrollPMJJBY ? "Yes" : "No",
      "PMSBY": c.enrollPMSBY ? "Yes" : "No",
      "APY": c.enrollAPY ? "Yes" : "No",
      "APY Pension Slab": c.apyPensionSlab || "",
      "Passbook Issued": c.passbookIssued ? "Yes" : "No",
      "ATM Issued": c.atmIssued ? "Yes" : "No",
      "Created At": formatDateTime(c.createdAt),
    })), "sk-customers");
    toast.success("CSV exported successfully!");
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <SEO title="Manage Customers" />
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Customers</h1>
          <p className="text-sm text-slate-500 mt-0.5">{customers.length} total · {filtered.length} shown</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Filter size={14} />
            Filters
            <ChevronDown size={12} className={`transition-transform ${showFilters ? "rotate-180" : ""}`} />
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Download size={14} />
            Export
          </button>
          <button
            onClick={() => navigate("/add-customer")}
            className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
          >
            <UserPlus size={14} />
            Add Customer
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="sk-card p-4 space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, account no, mobile, CIF, reference ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
          />
        </div>
        {showFilters && (
          <div className="flex flex-wrap gap-2 pt-1">
            {["All", ...CATEGORIES].map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all ${
                  categoryFilter === cat
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="sk-card overflow-hidden">
        <div className="overflow-x-auto custom-scroll">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Account No.</th>
                <th>Mobile</th>
                <th>DOB</th>
                <th>Category</th>
                <th>Address</th>
                <th>Delivery</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const bdays = getDaysUntilBirthday(c.dob);
                return (
                  <tr key={c.id}>
                    <td>
                      <div className="flex items-center gap-2 min-w-[160px]">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-slate-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {c.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-800 text-sm truncate max-w-[130px]">{c.name}</div>
                          <div className="text-[10px] text-slate-500 truncate font-mono">{c.refNumber}</div>
                          {bdays <= 3 && (
                            <div className="text-[10px] text-amber-600 font-semibold">
                              {bdays === 0 ? "Birthday Today!" : `Birthday in ${bdays}d`}
                            </div>
                          )}
                          {(c.enrollPMJJBY || c.enrollPMSBY || c.enrollAPY) && (
                            <div className="flex gap-0.5 mt-0.5 flex-wrap">
                              {c.enrollPMJJBY && <span className="text-[9px] bg-blue-100 text-blue-700 px-1 rounded font-semibold">PMJJBY</span>}
                              {c.enrollPMSBY && <span className="text-[9px] bg-violet-100 text-violet-700 px-1 rounded font-semibold">PMSBY</span>}
                              {c.enrollAPY && <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1 rounded font-semibold">APY</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded whitespace-nowrap">{c.accountNumber}</span>
                    </td>
                    <td className="text-slate-600 whitespace-nowrap">{c.mobile}</td>
                    <td className="text-slate-600 text-xs whitespace-nowrap">{c.dob}</td>
                    <td><span className="badge badge-blue">{c.category}</span></td>
                    <td className="text-slate-500 text-xs max-w-[150px]">
                      <div className="truncate">{c.village}</div>
                      <div className="text-[10px] text-slate-400 truncate">{c.district}, {c.state}</div>
                    </td>
                    <td>
                      <div className="flex flex-col gap-0.5">
                        <span className={`badge text-[10px] ${c.passbookReceived ? "badge-green" : c.passbookIssued ? "badge-yellow" : "badge-slate"}`}>
                          PB: {c.passbookReceived ? "Received" : c.passbookIssued ? "Issued" : "Pending"}
                        </span>
                        <span className={`badge text-[10px] ${c.atmReceived ? "badge-green" : c.atmIssued ? "badge-yellow" : "badge-slate"}`}>
                          ATM: {c.atmReceived ? "Received" : c.atmIssued ? "Issued" : "Pending"}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setViewCustomer(c)}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => setSelectedCustomer(c)}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                          title="Print & Download Documents"
                        >
                          <Printer size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id, c.name)}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center text-slate-400 py-12">
                    {search || categoryFilter !== "All" ? "No customers match your search." : "No customers yet. Add your first customer to get started!"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Detail Modal */}
      {viewCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setViewCustomer(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[85vh] overflow-y-auto custom-scroll" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 flex items-center justify-between px-6 py-4 bg-slate-900 text-white rounded-t-2xl">
              <div>
                <div className="font-semibold">{viewCustomer.name}</div>
                <div className="text-xs text-slate-400 font-mono">{viewCustomer.accountNumber}</div>
              </div>
              <button onClick={() => setViewCustomer(null)} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300">✕</button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {[
                ["Father", viewCustomer.fatherName], ["Mother", viewCustomer.motherName],
                ["Spouse", viewCustomer.spouseName], ["Sex", viewCustomer.sex],
                ["Age", String(viewCustomer.age)], ["DOB", viewCustomer.dob],
                ["Profession", viewCustomer.profession || "—"],
                ["Category", viewCustomer.category], ["Mobile", viewCustomer.mobile],
                ["Email", viewCustomer.email || "—"], ["PAN/GIR", viewCustomer.panGir],
                ["Annual Income", viewCustomer.annualIncome ? `₹${viewCustomer.annualIncome}` : "—"],
                ["Income Tier", viewCustomer.annualIncomeTier || "—"],
                ["Education", viewCustomer.educationLevel || "—"],
                ["Occupation", viewCustomer.occupationType || "—"],
                ["Risk Category", viewCustomer.riskCategory || "—"],
                ["Sol ID", viewCustomer.solId || "—"], ["Zone", viewCustomer.zone || "—"],
                ["Address", viewCustomer.address], ["Village", viewCustomer.village || "—"],
                ["Mandal", viewCustomer.mandal || "—"], ["District", viewCustomer.district],
                ["State", viewCustomer.state], ["Nominee", viewCustomer.nomineeName],
                ["Nominee Rel.", viewCustomer.nomineeRelationship],
                ["Introducer", viewCustomer.introducerName], ["Ref No.", viewCustomer.refNumber],
                ["PMJJBY", viewCustomer.enrollPMJJBY ? `Yes — ${viewCustomer.pmjjbyPremiumTier}` : "Not Enrolled"],
                ["PMSBY", viewCustomer.enrollPMSBY ? "Yes — ₹20" : "Not Enrolled"],
                ["APY", viewCustomer.enrollAPY ? `Yes — ${viewCustomer.apyPensionSlab}/mo` : "Not Enrolled"],
              ].map(([label, val]) => (
                <div key={label}>
                  <div className="text-xs text-slate-500 font-semibold uppercase tracking-wide">{label}</div>
                  <div className="text-slate-800 font-medium">{val || "—"}</div>
                </div>
              ))}
            </div>
            <div className="px-6 pb-4 flex justify-end gap-2">
              <button
                onClick={() => { setViewCustomer(null); setSelectedCustomer(viewCustomer); }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
              >
                <Printer size={14} /> Print
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedCustomer && (
        <PrintModal customer={selectedCustomer} onClose={() => setSelectedCustomer(null)} />
      )}
    </div>
  );
}
