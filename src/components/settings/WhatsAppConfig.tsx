import React, { useState, useEffect } from "react";
import { MessageSquare, Eye, EyeOff, CheckCircle, AlertCircle, RefreshCw, Save } from "lucide-react";
import { WhatsAppService, type WhatsAppConfigData } from "@/services/WhatsAppService";
import { toast } from "sonner";

interface WhatsAppConfigProps {
  onConfigChange?: (config: WhatsAppConfigData) => void;
}

export const WhatsAppConfig: React.FC<WhatsAppConfigProps> = ({ onConfigChange }) => {
  const [config, setConfig] = useState<WhatsAppConfigData>({
    id: "global_config",
    waba_id: "",
    phone_number_id: "",
    api_token: "",
    gateway_url: "https://graph.facebook.com/v19.0",
    sender_id: "",
    is_active: true,
  });
  const [showToken, setShowToken] = useState(false);
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "ok" | "fail">("idle");
  const [testMsg, setTestMsg] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const dbConfig = await WhatsAppService.getConfig();
      if (dbConfig) {
        setConfig(dbConfig);
        if (onConfigChange) onConfigChange(dbConfig);
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleChange = (key: keyof WhatsAppConfigData, value: any) => {
    const updated = { ...config, [key]: value };
    setConfig(updated);
    if (onConfigChange) onConfigChange(updated);
  };

  const handleSave = async () => {
    const success = await WhatsAppService.saveConfig(config);
    if (success) {
      toast.success("WhatsApp Configuration saved to Supabase!");
    } else {
      toast.error("Failed to save WhatsApp configuration.");
    }
  };

  const handleTest = async () => {
    setTestStatus("testing");
    setTestMsg("");
    const res = await WhatsAppService.testConnection(config);
    if (res.success) {
      setTestStatus("ok");
      setTestMsg(res.message);
      toast.success("Connection test succeeded!");
    } else {
      setTestStatus("fail");
      setTestMsg(res.message);
      toast.error(`Connection test failed: ${res.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw size={24} className="animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="sk-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 bg-slate-50 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
            <MessageSquare size={16} className="text-emerald-600" />
          </div>
          <h2 className="font-semibold text-slate-800">WhatsApp & Meta Gateway Config</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className={`badge ${
            testStatus === "ok" ? "badge-green" :
            testStatus === "fail" ? "badge-red" :
            testStatus === "testing" ? "badge-yellow" : "badge-slate"
          }`}>
            {testStatus === "ok" && <><CheckCircle size={11} /> Connected</>}
            {testStatus === "fail" && <><AlertCircle size={11} /> Failed</>}
            {testStatus === "testing" && <><RefreshCw size={11} className="animate-spin" /> Testing</>}
            {testStatus === "idle" && "Not Tested"}
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Gateway URL / Provider Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Gateway URL</label>
            <input
              type="text"
              className="form-input font-mono"
              placeholder="https://graph.facebook.com/v19.0"
              value={config.gateway_url}
              onChange={e => handleChange("gateway_url", e.target.value)}
            />
            <div className="mt-1 flex gap-2">
              <button
                type="button"
                onClick={() => handleChange("gateway_url", "https://graph.facebook.com/v19.0")}
                className="text-[10px] text-blue-600 hover:underline font-semibold"
              >
                Use Meta API v19
              </button>
              <button
                type="button"
                onClick={() => handleChange("gateway_url", "https://www.fast2sms.com/dev/bulkV2")}
                className="text-[10px] text-blue-600 hover:underline font-semibold"
              >
                Use Fast2SMS URL
              </button>
            </div>
          </div>

          <div>
            <label className="form-label">Sender ID / Channel Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. SKONLINE-CSP"
              value={config.sender_id}
              onChange={e => handleChange("sender_id", e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">WhatsApp Business Account (WABA ID)</label>
            <input
              type="text"
              className="form-input font-mono"
              placeholder="e.g. 192837465098"
              value={config.waba_id}
              onChange={e => handleChange("waba_id", e.target.value)}
            />
          </div>

          <div>
            <label className="form-label">Phone Number ID</label>
            <input
              type="text"
              className="form-input font-mono"
              placeholder="e.g. 1092837465"
              value={config.phone_number_id}
              onChange={e => handleChange("phone_number_id", e.target.value)}
            />
          </div>
        </div>

        {/* API Token / Bearer Key */}
        <div>
          <label className="form-label">API Access Token / Bearer Key</label>
          <div className="relative">
            <input
              type={showToken ? "text" : "password"}
              className="form-input font-mono pr-10"
              placeholder="Bearer Token..."
              value={config.api_token}
              onChange={e => handleChange("api_token", e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowToken(!showToken)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
            >
              {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Actions Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTest}
              disabled={testStatus === "testing"}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg transition-colors shadow-sm"
            >
              {testStatus === "testing" ? <RefreshCw size={14} className="animate-spin" /> : <MessageSquare size={14} />}
              Test API Connection
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
            >
              <Save size={14} />
              Save Config
            </button>
          </div>
          {testMsg && (
            <div className={`text-xs ${testStatus === "ok" ? "text-emerald-700" : "text-red-700"} bg-slate-50 p-2 rounded border border-slate-100 max-w-md truncate`}>
              {testMsg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
