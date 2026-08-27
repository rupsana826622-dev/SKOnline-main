import { useState, useEffect, useMemo } from "react";
import { 
  Search, Trash2, Phone, MessageSquare, Clock, User, 
  CheckCircle2, Mail, ExternalLink, HelpCircle 
} from "lucide-react";
import { toast } from "sonner";
import SEO from "@/components/common/SEO";

interface Inquiry {
  id: string;
  name: string;
  mobile: string;
  service: string;
  message: string;
  timestamp: string;
  resolved: boolean;
}

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [search, setSearch] = useState("");
  const [serviceFilter, setServiceFilter] = useState("All");

  // Load inquiries from localStorage
  const loadInquiries = () => {
    try {
      const raw = localStorage.getItem("customerInquiries");
      setInquiries(raw ? JSON.parse(raw) : []);
    } catch (err) {
      toast.error("Failed to load customer inquiries.");
    }
  };

  useEffect(() => {
    loadInquiries();
  }, []);

  // Filter and Search calculations
  const filteredInquiries = useMemo(() => {
    const query = search.toLowerCase().trim();
    return inquiries.filter(inq => {
      const matchesSearch = 
        !query ||
        inq.name.toLowerCase().includes(query) ||
        inq.mobile.includes(query) ||
        inq.message.toLowerCase().includes(query);
      
      const matchesService = serviceFilter === "All" || inq.service === serviceFilter;
      return matchesSearch && matchesService;
    });
  }, [inquiries, search, serviceFilter]);

  // Resolve (delete) an inquiry
  const handleResolve = (id: string, clientName: string) => {
    if (!confirm(`Mark inquiry from "${clientName}" as resolved and remove it from lists?`)) return;
    
    try {
      const updated = inquiries.filter(inq => inq.id !== id);
      localStorage.setItem("customerInquiries", JSON.stringify(updated));
      setInquiries(updated);
      toast.success(`Inquiry from ${clientName} resolved.`);
    } catch (err) {
      toast.error("Failed to resolve inquiry.");
    }
  };

  // Clear all inquiries helper
  const handleClearAll = () => {
    if (inquiries.length === 0) return;
    if (!confirm("Are you sure you want to clear all inquiries? This action cannot be undone.")) return;

    try {
      localStorage.setItem("customerInquiries", JSON.stringify([]));
      setInquiries([]);
      toast.success("All inquiries cleared.");
    } catch (err) {
      toast.error("Failed to clear inquiries.");
    }
  };

  // Format date helper
  const formatDate = (isoStr: string) => {
    try {
      const date = new Date(isoStr);
      return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });
    } catch {
      return "Unknown";
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <SEO title="Customer Inquiries" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">📋 Customer Inquiries</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {inquiries.length} total lead submissions · {filteredInquiries.length} shown
          </p>
        </div>
        
        {inquiries.length > 0 && (
          <button 
            onClick={handleClearAll}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-red-650 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors shadow-sm"
          >
            <Trash2 size={13} />
            Clear All
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3">
        {/* Search bar */}
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input 
            type="text"
            placeholder="Search inquiries by client name, mobile, message..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all text-slate-800 placeholder-slate-400"
          />
        </div>

        {/* Service filter */}
        <div className="w-full md:w-56">
          <select
            value={serviceFilter}
            onChange={e => setServiceFilter(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all text-slate-700"
          >
            <option value="All">All Categories</option>
            <option value="LIC Advisory">LIC Life Insurance Advisory</option>
            <option value="Banking CSP">Banking CSP BOB/BOI</option>
            <option value="GST & ITR">Taxation Desk (GST/ITR)</option>
            <option value="CSC Services">CSC & Tathya Mitra</option>
            <option value="Travel & Tickets">Travel & Tickets</option>
          </select>
        </div>
      </div>

      {/* Main Content Table / Empty State */}
      {filteredInquiries.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-4 text-slate-400">
            <Mail size={20} />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Inquiries Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {inquiries.length === 0 
              ? "Customer lead submissions through the public landing page will propagate automatically to this space."
              : "No submissions match your active filter criteria."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left data-table">
              <thead>
                <tr>
                  <th>Submission Date</th>
                  <th>Client Profile</th>
                  <th>Mobile Number</th>
                  <th>Service Category</th>
                  <th>Inquiry Message</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInquiries.map((inq) => (
                  <tr key={inq.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Timestamp */}
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">
                      <div className="flex items-center gap-1.5">
                        <Clock size={12} />
                        {formatDate(inq.timestamp)}
                      </div>
                    </td>

                    {/* Client Name */}
                    <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-50 border border-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                          {inq.name.charAt(0).toUpperCase()}
                        </div>
                        {inq.name}
                      </div>
                    </td>

                    {/* Mobile Number */}
                    <td className="px-4 py-3 font-mono text-slate-700 whitespace-nowrap text-xs">
                      {inq.mobile}
                    </td>

                    {/* Service Category */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        inq.service === "LIC Advisory" 
                          ? "bg-amber-55 text-amber-700 border border-amber-200" 
                          : inq.service === "Banking CSP"
                          ? "bg-blue-50 text-blue-700 border border-blue-100"
                          : inq.service === "GST & ITR"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                          : "bg-slate-100 text-slate-700 border border-slate-200"
                      }`}>
                        {inq.service}
                      </span>
                    </td>

                    {/* Message Details */}
                    <td className="px-4 py-3 text-slate-600 max-w-xs md:max-w-md truncate text-xs" title={inq.message}>
                      {inq.message}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Call trigger */}
                        <a 
                          href={`tel:+91${inq.mobile}`}
                          title="Call Client"
                          className="p-1.5 text-blue-600 hover:bg-blue-55 rounded-lg border border-transparent hover:border-blue-200 transition-all"
                        >
                          <Phone size={14} />
                        </a>

                        {/* WhatsApp trigger */}
                        <a 
                          href={`https://wa.me/91${inq.mobile}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="WhatsApp Chat"
                          className="p-1.5 text-emerald-600 hover:bg-emerald-55 rounded-lg border border-transparent hover:border-emerald-200 transition-all"
                        >
                          <MessageSquare size={14} />
                        </a>

                        {/* Resolve trigger */}
                        <button 
                          onClick={() => handleResolve(inq.id, inq.name)}
                          title="Resolve Inquiry"
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg border border-transparent hover:border-emerald-250 transition-all ml-1"
                        >
                          <CheckCircle2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
