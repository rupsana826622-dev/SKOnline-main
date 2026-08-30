import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, UserPlus, Download, Filter, Printer,
  Trash2, Eye, ChevronDown, RefreshCw, AlertCircle
} from "lucide-react";
import { getCustomers, fetchCustomersFromSupabase, deleteCustomerAsync } from "@/lib/storage";
import { exportToCSV, formatDateTime, getDaysUntilBirthday } from "@/lib/utils";
import PrintModal from "@/components/features/PrintModal";
import CustomerProfileView from "@/components/features/CustomerProfileView";
import type { Customer } from "@/types";
import { CATEGORIES } from "@/constants";
import { toast } from "sonner";
import SEO from "@/components/common/SEO";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [selectedCustomerForPrint, setSelectedCustomerForPrint] = useState<Customer | null>(null);
  const [activeProfileCustomer, setActiveProfileCustomer] = useState<Customer | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

  const loadData = useCallback(async () => {
    setLoading(true);
    // Instant cache read
    setCustomers(getCustomers());
    // Live Supabase fetch
    try {
      const live = await fetchCustomersFromSupabase();
      if (live && live.length >= 0) {
        setCustomers(live);
      }
    } catch (err) {
      console.error("Error loading live customers:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    const handleSync = () => {
      setCustomers(getCustomers());
    };
    window.addEventListener("supabase-sync-complete", handleSync);
    return () => window.removeEventListener("supabase-sync-complete", handleSync);
  }, [loadData]);

  const filtered = useMemo(() => {
    const lower = search.toLowerCase().trim();
    return customers.filter(c => {
      const matchSearch =
        !lower ||
        c.name.toLowerCase().includes(lower) ||
        c.accountNumber.includes(lower) ||
        c.mobile.includes(lower) ||
        c.refNumber.toLowerCase().includes(lower) ||
        (c.village || "").toLowerCase().includes(lower) ||
        (c.district || "").toLowerCase().includes(lower) ||
        (c.customerId || "").toLowerCase().includes(lower);
      const matchCat = categoryFilter === "All" || c.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [customers, search, categoryFilter]);

  const handleDelete = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Permanently delete customer "${name}" from Supabase Cloud? This cannot be undone.`)) return;
    
    try {
      const { error } = await deleteCustomerAsync(id);
      if (error) {
        toast.error(`Delete failed: ${error.message || "Database error"}`);
        return;
      }
      setCustomers(prev => prev.filter(c => c.id !== id));
      toast.success(`Customer "${name}" deleted successfully.`);
    } catch (err: any) {
      toast.error(`Error deleting customer: ${err.message || "Network error"}`);
    }
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

  if (activeProfileCustomer) {
    return (
      <div className="max-w-7xl mx-auto space-y-5">
        <SEO title={`${activeProfileCustomer.name} — Customer Profile`} description="Customer Profile and Social Security enrollment details" />
        <CustomerProfileView
          customer={activeProfileCustomer}
          onBack={() => setActiveProfileCustomer(null)}
          onCustomerUpdated={updated => {
            setCustomers(prev => prev.map(item => item.id === updated.id ? updated : item));
            setActiveProfileCustomer(updated);
          }}
          onCustomerDeleted={id => {
            setCustomers(prev => prev.filter(item => item.id !== id));
            setActiveProfileCustomer(null);
          }}
        />
        {selectedCustomerForPrint && (
          <PrintModal
            customer={selectedCustomerForPrint}
            onClose={() => setSelectedCustomerForPrint(null)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <SEO title="Manage Customers — SK Online" description="Customer Management and Social Security Scheme Enrollment records" />
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Customers</h1>
            {loading && <RefreshCw size={14} className="animate-spin text-blue-600" />}
          </div>
          <p className="text-sm text-slate-500 mt-0.5">{customers.length} total · {filtered.length} shown</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={loadData}
            title="Sync with Supabase"
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
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
            className="flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
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
            placeholder="Search by name, account no, mobile, CIF, reference ID, district, village..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
          />
        </div>
        {showFilters && (
          <div className="flex flex-wrap gap-2 pt-1 animate-fade-in">
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
                <th>DOB / Age</th>
                <th>Category</th>
                <th>Address & District</th>
                <th>Delivery</th>
                <th className="text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const bdays = getDaysUntilBirthday(c.dob);
                return (
                  <tr
                    key={c.id}
                    onClick={() => setActiveProfileCustomer(c)}
                    className="cursor-pointer hover:bg-blue-50/40 transition-colors"
                  >
                    <td>
                      <div className="flex items-center gap-2.5 min-w-[170px]">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-slate-700 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-sm">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 text-sm truncate max-w-[140px]">{c.name}</div>
                          <div className="text-[10px] text-slate-500 truncate font-mono">{c.refNumber}</div>
                          {bdays <= 3 && (
                            <div className="text-[10px] text-amber-600 font-semibold">
                              {bdays === 0 ? "Birthday Today! 🎉" : `Birthday in ${bdays}d`}
                            </div>
                          )}
                          {(c.enrollPMJJBY || c.enrollPMSBY || c.enrollAPY) && (
                            <div className="flex gap-1 mt-1 flex-wrap">
                              {c.enrollPMJJBY && <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded font-semibold">PMJJBY</span>}
                              {c.enrollPMSBY && <span className="text-[9px] bg-violet-100 text-violet-700 px-1.5 py-0.2 rounded font-semibold">PMSBY</span>}
                              {c.enrollAPY && <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.2 rounded font-semibold">APY</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded-md font-semibold whitespace-nowrap text-slate-800 border border-slate-200">
                        {c.accountNumber}
                      </span>
                    </td>
                    <td className="text-slate-700 font-mono text-xs whitespace-nowrap">{c.mobile}</td>
                    <td className="text-slate-600 text-xs whitespace-nowrap">
                      <div>{c.dob || "—"}</div>
                      {c.age ? <div className="text-[10px] text-slate-400">({c.age} yrs)</div> : null}
                    </td>
                    <td><span className="badge badge-blue">{c.category}</span></td>
                    <td className="text-slate-500 text-xs max-w-[160px]">
                      <div className="truncate font-medium text-slate-700">{c.village || c.address}</div>
                      <div className="text-[10px] text-slate-400 truncate">{c.district}, {c.state}</div>
                    </td>
                    <td>
                      <div className="flex flex-col gap-1">
                        <span className={`badge text-[10px] ${c.passbookReceived ? "badge-green" : c.passbookIssued ? "badge-yellow" : "badge-slate"}`}>
                          PB: {c.passbookReceived ? "Received" : c.passbookIssued ? "Issued" : "Pending"}
                        </span>
                        <span className={`badge text-[10px] ${c.atmReceived ? "badge-green" : c.atmIssued ? "badge-yellow" : "badge-slate"}`}>
                          ATM: {c.atmReceived ? "Received" : c.atmIssued ? "Issued" : "Pending"}
                        </span>
                      </div>
                    </td>
                    <td className="text-right pr-6" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setActiveProfileCustomer(c)}
                          className="p-2 rounded-lg text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                          title="View & Edit Customer Profile"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => setSelectedCustomerForPrint(c)}
                          className="p-2 rounded-lg text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                          title="Print / Download 1:1 Bank Forms Bundle"
                        >
                          <Printer size={15} />
                        </button>
                        <button
                          onClick={e => handleDelete(c.id, c.name, e)}
                          className="p-2 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                          title="Delete from Supabase"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center text-slate-400 py-16">
                    <AlertCircle size={28} className="mx-auto mb-2 text-slate-300" />
                    {search || categoryFilter !== "All"
                      ? "No customers match your search filters."
                      : "No customers found. Click 'Add Customer' to register a new account!"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 1:1 Print / Download Bundle Modal */}
      {selectedCustomerForPrint && (
        <PrintModal
          customer={selectedCustomerForPrint}
          onClose={() => setSelectedCustomerForPrint(null)}
        />
      )}
    </div>
  );
}
