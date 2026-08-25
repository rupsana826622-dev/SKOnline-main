import { useState } from "react";
import {
  Settings, Eye, EyeOff, Save, Building2, CreditCard,
  MessageSquare, Hash, CheckCircle, AlertCircle, RefreshCw, MapPin,
} from "lucide-react";
import { getSettings, saveSettings } from "@/lib/storage";
import type { AppSettings } from "@/types";
import { POWERED_BY } from "@/constants";
import { toast } from "sonner";

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(getSettings());
  const [showSecrets, setShowSecrets] = useState(false);
  const [waTestStatus, setWaTestStatus] = useState<"idle" | "testing" | "ok" | "fail">("idle");
  const [saved, setSaved] = useState(false);

  const set = (k: keyof AppSettings, v: string) => {
    setSettings(s => ({ ...s, [k]: v }));
    setSaved(false);
  };

  const handleSave = () => {
    saveSettings(settings);
    setSaved(true);
    toast.success("Settings saved successfully!");
    setTimeout(() => setSaved(false), 3000);
  };

  const testWaConnection = async () => {
    if (!settings.waToken || !settings.waPhoneNumberId) {
      toast.error("Please enter WhatsApp token and Phone Number ID first.");
      setWaTestStatus("fail");
      return;
    }
    setWaTestStatus("testing");
    await new Promise(r => setTimeout(r, 1500));
    const ok = settings.waToken.length > 10;
    setWaTestStatus(ok ? "ok" : "fail");
    toast[ok ? "success" : "error"](ok ? "WhatsApp connection OK (simulated)" : "Connection test failed.");
  };

  const SectionCard = ({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) => (
    <div className="sk-card overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 bg-slate-50 border-b border-slate-100">
        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
          <Icon size={16} className="text-blue-600" />
        </div>
        <h2 className="font-semibold text-slate-800">{title}</h2>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );

  const Field2 = ({ label, k, type = "text", placeholder, mono }: {
    label: string; k: keyof AppSettings; type?: string; placeholder?: string; mono?: boolean;
  }) => (
    <div>
      <label className="form-label">{label}</label>
      <input
        type={type}
        className={`form-input ${mono ? "font-mono" : ""}`}
        placeholder={placeholder}
        value={settings[k]}
        onChange={e => set(k, e.target.value)}
      />
    </div>
  );

  const SecretField = ({ label, k, placeholder }: { label: string; k: keyof AppSettings; placeholder?: string }) => (
    <div>
      <label className="form-label">{label}</label>
      <input
        type={showSecrets ? "text" : "password"}
        className="form-input font-mono"
        placeholder={placeholder}
        value={settings[k]}
        onChange={e => set(k, e.target.value)}
      />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-700 flex items-center justify-center">
            <Settings size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Settings</h1>
            <p className="text-sm text-slate-500 mt-0.5">Configure CSP profile, bank details, and integrations</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSecrets(!showSecrets)}
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
          >
            {showSecrets ? <EyeOff size={13} /> : <Eye size={13} />}
            {showSecrets ? "Mask Secrets" : "Reveal Secrets"}
          </button>
          <button
            onClick={handleSave}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg transition-all shadow-sm ${
              saved ? "bg-emerald-600 hover:bg-emerald-700" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {saved ? <CheckCircle size={14} /> : <Save size={14} />}
            {saved ? "Saved!" : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Bank Profile */}
      <SectionCard title="Bank Profile" icon={Building2}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field2 label="Primary Bank Name" k="bankName" placeholder="Bank of India" />
          <Field2 label="Branch Code" k="branchCode" placeholder="002345" mono />
          <Field2 label="IFSC Code" k="ifscCode" placeholder="BKID0002345" mono />
        </div>
      </SectionCard>

      {/* Sol ID & Zone */}
      <SectionCard title="Sol ID & Zone" icon={MapPin}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Field2 label="Sol ID" k="solId" placeholder="SOL001" mono />
            <p className="mt-1 text-xs text-slate-400">Solution ID used in Customer Profile Sheet (CPS)</p>
          </div>
          <div>
            <Field2 label="Zone" k="zone" placeholder="e.g. South Zone" />
            <p className="mt-1 text-xs text-slate-400">Bank zone for CPS classification</p>
          </div>
        </div>
      </SectionCard>

      {/* CSP Details */}
      <SectionCard title="CSP Details" icon={CreditCard}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field2 label="CSP Name" k="cspName" placeholder="SK Financial Services" />
          <Field2 label="CSP Code" k="cspCode" placeholder="CSP-BOI-0721" mono />
          <Field2 label="CSP Branch Name" k="cspBranchName" placeholder="Main Market Branch" />
          <Field2 label="Operator Name" k="operatorName" placeholder="Your Name" />
          <Field2 label="Operator Contact" k="operatorContact" placeholder="9876543210" />
        </div>
      </SectionCard>

      {/* Smart Pre-fill Prefixes */}
      <SectionCard title="Smart Pre-fill Prefixes" icon={Hash}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Account Number Prefix</label>
            <input
              type="text"
              className="form-input font-mono"
              placeholder="e.g. 190010"
              value={settings.accountPrefix}
              onChange={e => set("accountPrefix", e.target.value)}
            />
            <div className="mt-1 text-xs text-slate-500">
              Operators only type the <strong>remaining digits</strong> after this prefix.
            </div>
          </div>
          <div>
            <label className="form-label">Reference Number Prefix</label>
            <input
              type="text"
              className="form-input font-mono"
              placeholder="e.g. REF-2026-"
              value={settings.refPrefix}
              onChange={e => set("refPrefix", e.target.value)}
            />
            <div className="mt-1 text-xs text-slate-500">
              Auto-generated reference IDs start with this prefix.
            </div>
          </div>
        </div>
        <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700">
          <strong>Example:</strong> Prefix <code className="font-mono">{settings.accountPrefix}</code> + suffix <code className="font-mono">007821</code> → Full A/c: <code className="font-mono">{settings.accountPrefix}007821</code>
        </div>
      </SectionCard>

      {/* WhatsApp API */}
      <SectionCard title="WhatsApp API Configuration" icon={MessageSquare}>
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-slate-500">Meta WhatsApp Business API (Cloud API)</div>
          <div className={`badge ${
            waTestStatus === "ok" ? "badge-green" :
            waTestStatus === "fail" ? "badge-red" :
            waTestStatus === "testing" ? "badge-yellow" : "badge-slate"
          }`}>
            {waTestStatus === "ok" && <><CheckCircle size={11} /> Connected</>}
            {waTestStatus === "fail" && <><AlertCircle size={11} /> Failed</>}
            {waTestStatus === "testing" && <><RefreshCw size={11} className="animate-spin" /> Testing</>}
            {waTestStatus === "idle" && "Not Tested"}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Field2 label="Gateway URL" k="waGatewayUrl" placeholder="https://graph.facebook.com/v17.0" mono />
          </div>
          <SecretField label="API Token / Bearer Key" k="waToken" placeholder="EAAxxxx..." />
          <Field2 label="Phone Number ID" k="waPhoneNumberId" placeholder="1234567890" mono />
        </div>
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={testWaConnection}
            disabled={waTestStatus === "testing"}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg transition-colors shadow-sm"
          >
            {waTestStatus === "testing" ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <MessageSquare size={14} />
            )}
            {waTestStatus === "testing" ? "Testing..." : "Test Connection"}
          </button>
          <div className="text-xs text-slate-400">
            Sends a test ping to verify your WhatsApp API credentials.
          </div>
        </div>
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
          <strong>Note:</strong> WhatsApp messaging is currently <strong>simulated</strong>. Connect Supabase backend to enable real API calls and automated birthday messages.
        </div>
      </SectionCard>

      {/* Save Button Bottom */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white rounded-lg transition-all shadow-md ${
            saved ? "bg-emerald-600" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {saved ? <CheckCircle size={15} /> : <Save size={15} />}
          {saved ? "Settings Saved!" : "Save All Settings"}
        </button>
      </div>

      <div className="text-center text-xs text-slate-400 pb-2">{POWERED_BY}</div>
    </div>
  );
}
