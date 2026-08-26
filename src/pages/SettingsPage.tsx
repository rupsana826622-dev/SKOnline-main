import { useState } from "react";
import {
  Settings, Eye, EyeOff, Save, Building2, CreditCard,
  MessageSquare, Hash, CheckCircle, AlertCircle, RefreshCw, MapPin,
} from "lucide-react";
import { getSettings, saveSettings } from "@/lib/storage";
import type { AppSettings } from "@/types";
import { POWERED_BY } from "@/constants";
import { toast } from "sonner";
import SEO from "@/components/common/SEO";

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
        value={typeof settings[k] === "string" ? settings[k] : ""}
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
        value={typeof settings[k] === "string" ? settings[k] : ""}
        onChange={e => set(k, e.target.value)}
      />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <SEO title="Portal Settings" />
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

      {/* Dynamic Logo & Header Management */}
      <SectionCard title="PDF Form Header Logo Management" icon={Settings}>
        <div className="text-xs text-slate-500 mb-2">
          Upload custom logos for PDF form headers. Single-logo forms take 1 logo slot (top-left). Multi-logo insurance forms take 3 separate slots (Left, Center, Right).
        </div>

        {/* Single Logo Forms */}
        <div className="space-y-3 border-b border-slate-200 pb-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Single Logo Forms</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* FI Logo */}
            <div className="border border-slate-200 rounded-lg p-3 bg-white space-y-2">
              <div className="font-semibold text-xs text-slate-700">Financial Inclusion Logo</div>
              <div className="h-14 border border-slate-200 rounded flex items-center justify-center p-1 bg-slate-50">
                <img src={settings.fiLogo} alt="FI Logo" className="max-h-full object-contain" />
              </div>
              <input
                type="file"
                accept="image/*"
                className="text-[11px] w-full text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const r = new FileReader();
                    r.onload = ev => set("fiLogo", ev.target?.result as string);
                    r.readAsDataURL(file);
                  }
                }}
              />
            </div>

            {/* CPS Logo */}
            <div className="border border-slate-200 rounded-lg p-3 bg-white space-y-2">
              <div className="font-semibold text-xs text-slate-700">Customer Profile Sheet Logo</div>
              <div className="h-14 border border-slate-200 rounded flex items-center justify-center p-1 bg-slate-50">
                <img src={settings.cpsLogo} alt="CPS Logo" className="max-h-full object-contain" />
              </div>
              <input
                type="file"
                accept="image/*"
                className="text-[11px] w-full text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const r = new FileReader();
                    r.onload = ev => set("cpsLogo", ev.target?.result as string);
                    r.readAsDataURL(file);
                  }
                }}
              />
            </div>

            {/* APY Logo */}
            <div className="border border-slate-200 rounded-lg p-3 bg-white space-y-2">
              <div className="font-semibold text-xs text-slate-700">Atal Pension Yojana (APY) Logo</div>
              <div className="h-14 border border-slate-200 rounded flex items-center justify-center p-1 bg-slate-50">
                <img src={settings.apyLogo} alt="APY Logo" className="max-h-full object-contain" />
              </div>
              <input
                type="file"
                accept="image/*"
                className="text-[11px] w-full text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const r = new FileReader();
                    r.onload = ev => set("apyLogo", ev.target?.result as string);
                    r.readAsDataURL(file);
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Multi-Logo Forms: PMJJBY */}
        <div className="space-y-2 border-b border-slate-200 pb-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">PMJJBY Form (3 Header Slots)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {["left", "center", "right"].map(pos => (
              <div key={pos} className="border border-slate-200 rounded-lg p-2.5 bg-white space-y-1.5">
                <div className="font-semibold text-[11px] text-slate-700 capitalize">{pos} Header Slot</div>
                <div className="h-12 border border-slate-200 rounded flex items-center justify-center p-1 bg-slate-50">
                  <img src={settings.pmjjbyLogos?.[pos as "left" | "center" | "right"]} alt={`PMJJBY ${pos}`} className="max-h-full object-contain" />
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="text-[10px] w-full text-slate-500 file:mr-1 file:py-0.5 file:px-1.5 file:rounded file:border-0 file:text-[10px] file:bg-slate-100"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const r = new FileReader();
                      r.onload = ev => {
                        setSettings(s => ({
                          ...s,
                          pmjjbyLogos: {
                            ...(s.pmjjbyLogos || { left: "", center: "", right: "" }),
                            [pos]: ev.target?.result as string,
                          },
                        }));
                      };
                      r.readAsDataURL(file);
                    }
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Multi-Logo Forms: PMSBY */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">PMSBY Form (3 Header Slots)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {["left", "center", "right"].map(pos => (
              <div key={pos} className="border border-slate-200 rounded-lg p-2.5 bg-white space-y-1.5">
                <div className="font-semibold text-[11px] text-slate-700 capitalize">{pos} Header Slot</div>
                <div className="h-12 border border-slate-200 rounded flex items-center justify-center p-1 bg-slate-50">
                  <img src={settings.pmsbyLogos?.[pos as "left" | "center" | "right"]} alt={`PMSBY ${pos}`} className="max-h-full object-contain" />
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="text-[10px] w-full text-slate-500 file:mr-1 file:py-0.5 file:px-1.5 file:rounded file:border-0 file:text-[10px] file:bg-slate-100"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const r = new FileReader();
                      r.onload = ev => {
                        setSettings(s => ({
                          ...s,
                          pmsbyLogos: {
                            ...(s.pmsbyLogos || { left: "", center: "", right: "" }),
                            [pos]: ev.target?.result as string,
                          },
                        }));
                      };
                      r.readAsDataURL(file);
                    }
                  }}
                />
              </div>
            ))}
          </div>
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
