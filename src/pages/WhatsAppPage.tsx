import { useState, useEffect, useMemo } from "react";
import { MessageSquare, Send, CheckCircle, XCircle, Clock, Eye, Search, Users } from "lucide-react";
import { getCustomers, getWaMessages, addWaMessage, getSettings } from "@/lib/storage";
import { replaceTemplateVars, generateId, formatDateTime } from "@/lib/utils";
import { WA_TEMPLATES } from "@/constants";
import type { Customer, WhatsAppMessage } from "@/types";
import { toast } from "sonner";
import SEO from "@/components/common/SEO";

export default function WhatsAppPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [templateId, setTemplateId] = useState(WA_TEMPLATES[0].id);
  const [customMsg, setCustomMsg] = useState("");
  const [search, setSearch] = useState("");
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState<"compose" | "logs">("compose");
  const settings = getSettings();

  useEffect(() => {
    setCustomers(getCustomers());
    setMessages(getWaMessages());
  }, []);

  const selectedTemplate = WA_TEMPLATES.find(t => t.id === templateId)!;

  const filteredCustomers = useMemo(() => {
    const lower = search.toLowerCase();
    return customers.filter(c =>
      !search ||
      c.name.toLowerCase().includes(lower) ||
      c.mobile.includes(search) ||
      c.accountNumber.includes(search)
    );
  }, [customers, search]);

  const previewMessage = (customer: Customer) => {
    const template = customMsg || selectedTemplate.body;
    return replaceTemplateVars(template, {
      name: customer.name,
      bank_name: settings.bankName,
      account_no: customer.accountNumber,
      ref_no: customer.refNumber,
      csp_name: settings.cspName,
    });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const n = new Set(prev);
      if (n.has(id)) {
        n.delete(id);
      } else {
        n.add(id);
      }
      return n;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === filteredCustomers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredCustomers.map(c => c.id)));
    }
  };

  const sendMessages = async () => {
    if (selectedIds.size === 0) {
      toast.error("Please select at least one customer.");
      return;
    }
    setSending(true);
    const selected = customers.filter(c => selectedIds.has(c.id));

    for (const customer of selected) {
      await new Promise(r => setTimeout(r, 200));
      const msg: WhatsAppMessage = {
        id: generateId(),
        customerId: customer.id,
        customerName: customer.name,
        mobile: customer.mobile,
        message: previewMessage(customer),
        status: Math.random() > 0.15 ? "Sent" : "Failed",
        sentAt: new Date().toISOString(),
        template: selectedTemplate.name,
      };
      addWaMessage(msg);
    }

    setMessages(getWaMessages());
    setSelectedIds(new Set());
    setSending(false);
    toast.success(`Messages sent to ${selected.length} customer(s) (simulated).`);
    setActiveTab("logs");
  };

  const statusIcon = (s: string) => {
    if (s === "Sent" || s === "Delivered") return <CheckCircle size={14} className="text-emerald-500" />;
    if (s === "Failed") return <XCircle size={14} className="text-red-500" />;
    return <Clock size={14} className="text-amber-500" />;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <SEO title="Bulk SMS & WhatsApp Engine" />
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <MessageSquare size={20} className="text-emerald-600" />
          WB-SMS / WhatsApp Engine
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">Send bulk WhatsApp messages with dynamic templates</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        {(["compose", "logs"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 text-sm font-semibold rounded-lg capitalize transition-all ${
              activeTab === tab ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab === "compose" ? "Compose & Send" : `Message Logs (${messages.length})`}
          </button>
        ))}
      </div>

      {activeTab === "compose" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left: Customer Selection */}
          <div className="lg:col-span-2 sk-card overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
              <div className="font-semibold text-slate-800 flex items-center gap-2">
                <Users size={16} className="text-blue-500" />
                Select Recipients ({selectedIds.size} selected)
              </div>
              <div className="flex items-center gap-2">
                <button onClick={toggleAll} className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors">
                  {selectedIds.size === filteredCustomers.length ? "Deselect All" : "Select All"}
                </button>
              </div>
            </div>
            <div className="p-4 border-b border-slate-100">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search customers..."
                  className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="overflow-y-auto max-h-[400px] custom-scroll">
              {filteredCustomers.map(c => (
                <label
                  key={c.id}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-slate-50 hover:bg-slate-50 transition-colors ${
                    selectedIds.has(c.id) ? "bg-blue-50" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(c.id)}
                    onChange={() => toggleSelect(c.id)}
                    className="w-4 h-4 accent-blue-600 rounded"
                  />
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-slate-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {c.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-800 text-sm truncate">{c.name}</div>
                    <div className="text-xs text-slate-500">{c.mobile} · {c.accountNumber}</div>
                  </div>
                  {selectedIds.has(c.id) && (
                    <div className="flex-shrink-0">
                      <Eye size={13} className="text-blue-500" />
                    </div>
                  )}
                </label>
              ))}
              {filteredCustomers.length === 0 && (
                <div className="text-center text-slate-400 py-8 text-sm">No customers found.</div>
              )}
            </div>
          </div>

          {/* Right: Template & Preview */}
          <div className="space-y-4">
            {/* Template Picker */}
            <div className="sk-card p-4 space-y-3">
              <div className="font-semibold text-slate-800 text-sm">Message Template</div>
              <div className="space-y-2">
                {WA_TEMPLATES.map(t => (
                  <label key={t.id} className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${
                    templateId === t.id ? "border-emerald-400 bg-emerald-50" : "border-slate-200 hover:border-emerald-200"
                  }`}>
                    <input
                      type="radio"
                      name="template"
                      value={t.id}
                      checked={templateId === t.id}
                      onChange={() => { setTemplateId(t.id); setCustomMsg(""); }}
                      className="mt-0.5 accent-emerald-600"
                    />
                    <div>
                      <div className="text-xs font-semibold text-slate-800">{t.name}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{t.category}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Custom Message */}
            <div className="sk-card p-4 space-y-2">
              <div className="font-semibold text-slate-800 text-sm">Custom Message Override</div>
              <textarea
                value={customMsg}
                onChange={e => setCustomMsg(e.target.value)}
                rows={3}
                placeholder="Leave blank to use selected template. Use {name}, {bank_name}, {account_no}, {ref_no}, {csp_name}"
                className="form-input resize-none text-xs leading-relaxed"
              />
              <div className="text-[10px] text-slate-400">Variables: {"{name}"} {"{bank_name}"} {"{account_no}"} {"{ref_no}"} {"{csp_name}"}</div>
            </div>

            {/* Live Preview */}
            {selectedIds.size > 0 && (() => {
              const first = customers.find(c => selectedIds.has(c.id));
              return first ? (
                <div className="sk-card p-4 space-y-2">
                  <div className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                    <Eye size={14} className="text-emerald-500" />
                    Live Preview
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-3 text-xs text-slate-700 leading-relaxed border border-emerald-100">
                    {previewMessage(first)}
                  </div>
                  <div className="text-[10px] text-slate-400">Preview for: {first.name}</div>
                </div>
              ) : null;
            })()}

            {/* Send Button */}
            <button
              onClick={sendMessages}
              disabled={sending || selectedIds.size === 0}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 font-semibold text-sm text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl transition-all shadow-md hover:shadow-emerald-500/25"
            >
              {sending ? (
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <Send size={15} />
              )}
              {sending ? "Sending..." : `Send to ${selectedIds.size} Customer${selectedIds.size !== 1 ? "s" : ""}`}
            </button>
          </div>
        </div>
      )}

      {activeTab === "logs" && (
        <div className="sk-card overflow-hidden">
          <div className="overflow-x-auto custom-scroll">
            <table className="w-full data-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Mobile</th>
                  <th>Template</th>
                  <th>Message</th>
                  <th>Status</th>
                  <th>Sent At</th>
                </tr>
              </thead>
              <tbody>
                {messages.map(m => (
                  <tr key={m.id}>
                    <td className="font-medium text-slate-800">{m.customerName}</td>
                    <td className="text-slate-600">{m.mobile}</td>
                    <td><span className="badge badge-blue">{m.template}</span></td>
                    <td>
                      <div className="max-w-[200px] truncate text-xs text-slate-600" title={m.message}>{m.message}</div>
                    </td>
                    <td>
                      <div className={`badge ${m.status === "Sent" || m.status === "Delivered" ? "badge-green" : m.status === "Failed" ? "badge-red" : "badge-yellow"}`}>
                        {statusIcon(m.status)}
                        {m.status}
                      </div>
                    </td>
                    <td className="text-xs text-slate-500">{formatDateTime(m.sentAt)}</td>
                  </tr>
                ))}
                {messages.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-slate-400 py-10">No messages sent yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
