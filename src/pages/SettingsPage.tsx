import { useState } from "react";
import {
  Settings, Eye, EyeOff, Save, Building2, CreditCard,
  MessageSquare, Hash, CheckCircle, MapPin, Globe, Layers,
} from "lucide-react";
import { getSettings, saveSettings } from "@/lib/storage";
import type { AppSettings } from "@/types";
import { POWERED_BY } from "@/constants";
import { toast } from "sonner";
import SEO from "@/components/common/SEO";
import { WhatsAppConfig } from "@/components/settings/WhatsAppConfig";
import { TemplateManager } from "@/components/settings/TemplateManager";

// ─── HELPERS DECLARED OUTSIDE TO PREVENT RE-RENDER FOCUS LOSS ───

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

const Field2 = ({ 
  label, 
  k, 
  settings, 
  set, 
  type = "text", 
  placeholder, 
  mono 
}: {
  label: string; 
  k: keyof AppSettings; 
  settings: AppSettings; 
  set: (k: keyof AppSettings, v: string) => void; 
  type?: string; 
  placeholder?: string; 
  mono?: boolean;
}) => (
  <div>
    <label className="form-label">{label}</label>
    <input
      type={type}
      className={`form-input ${mono ? "font-mono" : ""}`}
      placeholder={placeholder}
      value={(typeof settings[k] === "string" ? settings[k] : "") as string}
      onChange={e => set(k, e.target.value)}
    />
  </div>
);

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(getSettings());
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "whatsapp">("general");

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

  return (
    <div className="max-w-4xl mx-auto space-y-5">
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
        
        {activeTab === "general" && (
          <button
            onClick={handleSave}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg transition-all shadow-sm ${
              saved ? "bg-emerald-600 hover:bg-emerald-700" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {saved ? <CheckCircle size={14} /> : <Save size={14} />}
            {saved ? "Saved!" : "Save All Changes"}
          </button>
        )}
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("general")}
          className={`flex items-center gap-1.5 px-5 py-2 text-sm font-semibold rounded-lg capitalize transition-all ${
            activeTab === "general" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Building2 size={14} />
          General & Form Config
        </button>
        <button
          onClick={() => setActiveTab("whatsapp")}
          className={`flex items-center gap-1.5 px-5 py-2 text-sm font-semibold rounded-lg capitalize transition-all ${
            activeTab === "whatsapp" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <MessageSquare size={14} />
          WhatsApp API & Templates
        </button>
      </div>

      {activeTab === "general" ? (
        <div className="space-y-5">
          {/* Bank Profile */}
          <SectionCard title="Bank Profile" icon={Building2}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field2 label="Primary Bank Name" k="bankName" settings={settings} set={set} placeholder="Bank of India" />
              <Field2 label="Branch Code" k="branchCode" settings={settings} set={set} placeholder="002345" mono />
              <Field2 label="IFSC Code" k="ifscCode" settings={settings} set={set} placeholder="BKID0002345" mono />
            </div>
          </SectionCard>

          {/* Sol ID & Zone */}
          <SectionCard title="Sol ID & Zone" icon={MapPin}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Field2 label="Sol ID" k="solId" settings={settings} set={set} placeholder="SOL001" mono />
                <p className="mt-1 text-xs text-slate-400">Solution ID used in Customer Profile Sheet (CPS)</p>
              </div>
              <div>
                <Field2 label="Zone" k="zone" settings={settings} set={set} placeholder="e.g. South Zone" />
                <p className="mt-1 text-xs text-slate-400">Bank zone for CPS classification</p>
              </div>
            </div>
          </SectionCard>

          {/* CSP Details */}
          <SectionCard title="CSP & Introducer Details" icon={CreditCard}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <Field2 label="CSP Name" k="cspName" settings={settings} set={set} placeholder="SK Financial Services" />
              <Field2 label="CSP Code" k="cspCode" settings={settings} set={set} placeholder="CSP-BOI-0721" mono />
              <Field2 label="CSP Branch Name" k="cspBranchName" settings={settings} set={set} placeholder="Main Market Branch" />
              <Field2 label="Operator Name" k="operatorName" settings={settings} set={set} placeholder="Alinur Sekh" />
              <Field2 label="Operator Contact" k="operatorContact" settings={settings} set={set} placeholder="9609080917" />
              <Field2 label="Introducer Name (BC / Operator Name)" k="introducerName" settings={settings} set={set} placeholder={settings.operatorName || settings.cspName || "Alinur Sekh"} />
              <Field2 label="Introducer Account Number (BC / CSP A/c No.)" k="introducerAccountNo" settings={settings} set={set} placeholder="e.g. 190010100012345" mono />
            </div>
            <div className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              💡 <strong>Form Auto-Population:</strong> Introducer Name &amp; Account Number auto-fill into Bank A4 form templates (Details of Introduction section). If left blank, clean empty grid boxes are generated for manual handwriting.
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
                  value={settings.accountPrefix || ""}
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
                  value={settings.refPrefix || ""}
                  onChange={e => set("refPrefix", e.target.value)}
                />
                <div className="mt-1 text-xs text-slate-500">
                  Auto-generated reference IDs start with this prefix.
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Dynamic Logo & Header Management */}
          <SectionCard title="PDF Form Header Logo Management" icon={Settings}>
            <div className="text-xs text-slate-500 mb-2">
              Upload custom logos for PDF form headers. Single-logo forms take 1 logo slot. Multi-logo insurance forms take 3 slots (Left, Center, Right).
            </div>

            {/* Single Logo Forms */}
            <div className="space-y-3 border-b border-slate-200 pb-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Single Logo Forms</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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

                {/* CKYC Consent Logo */}
                <div className="border border-slate-200 rounded-lg p-3 bg-white space-y-2">
                  <div className="font-semibold text-xs text-slate-700">CKYC Consent Form Logo</div>
                  <div className="h-14 border border-slate-200 rounded flex items-center justify-center p-1 bg-slate-50">
                    <img src={settings.ckycLogo} alt="CKYC Logo" className="max-h-full object-contain" />
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="text-[11px] w-full text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const r = new FileReader();
                        r.onload = ev => set("ckycLogo", ev.target?.result as string);
                        r.readAsDataURL(file);
                      }
                    }}
                  />
                </div>

                {/* SB/CD/TD Consent Logo */}
                <div className="border border-slate-200 rounded-lg p-3 bg-white space-y-2">
                  <div className="font-semibold text-xs text-slate-700">SB/CD/TD Consent Form Logo</div>
                  <div className="h-14 border border-slate-200 rounded flex items-center justify-center p-1 bg-slate-50">
                    <img src={settings.consentLogo} alt="Consent Logo" className="max-h-full object-contain" />
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="text-[11px] w-full text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const r = new FileReader();
                        r.onload = ev => set("consentLogo", ev.target?.result as string);
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

            {/* PMJJBY */}
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

            {/* PMSBY */}
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
          <div className="flex justify-end pt-2">
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
        </div>
      ) : (
        <div className="space-y-5">
          {/* WhatsApp / Meta Gateway Config */}
          <WhatsAppConfig />

          {/* Template CRUD Manager */}
          <TemplateManager />
        </div>
      )}

      <div className="text-center text-xs text-slate-400 pb-2">{POWERED_BY}</div>
    </div>
  );
}
