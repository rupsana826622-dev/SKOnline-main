import React, { useState, useEffect, useRef } from "react";
import {
  Settings, Save, Upload, RotateCcw,
  Building2, Phone, MapPin, Hash, User, FileText
} from "lucide-react";
import type { BobSettings } from "@/types/bob";
import { DEFAULT_BOB_SETTINGS } from "@/types/bob";
import { getBobSettings, saveBobSettings } from "@/lib/bobStorage";
import { toast } from "sonner";
import SEO from "@/components/common/SEO";

export default function BobSettingsPage() {
  const [settings, setSettings] = useState<BobSettings>(getBobSettings());
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSettings(getBobSettings());
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (PNG, JPG, WEBP).");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size must be less than 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setSettings(prev => ({ ...prev, stampSignatureUrl: base64 }));
      toast.success("Authorized Seal / Stamp uploaded.");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveStamp = () => {
    setSettings(prev => ({ ...prev, stampSignatureUrl: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
    toast.info("Authorized Seal removed.");
  };

  const handleSave = () => {
    saveBobSettings(settings);
    setSaved(true);
    toast.success("Bank of Baroda CSP settings saved successfully!");
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    if (confirm("Reset all BOB settings to defaults?")) {
      setSettings(DEFAULT_BOB_SETTINGS);
      saveBobSettings(DEFAULT_BOB_SETTINGS);
      toast.success("Settings reset to defaults.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <SEO title="Bank of Baroda CSP Settings" />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center font-black text-lg shadow-md">
            BOB
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Bank of Baroda CSP Settings</h1>
            <p className="text-xs text-slate-500">Configure branch codes, reference prefixes, and stamp signature</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
          >
            <RotateCcw size={13} />
            Reset Defaults
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-lg shadow transition-all"
          >
            <Save size={14} />
            {saved ? "Saved!" : "Save Settings"}
          </button>
        </div>
      </div>

      <div className="space-y-5">
        {/* 1. CSP & Branch Details */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building2 size={16} className="text-orange-600" />
            <span>CSP Center & Branch Configuration</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">CSP / Center Name</label>
              <input
                type="text"
                value={settings.cspName}
                onChange={e => setSettings({ ...settings, cspName: e.target.value })}
                placeholder="SK Financial & CSP Services"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">CSP Agent Code</label>
              <input
                type="text"
                value={settings.cspCode}
                onChange={e => setSettings({ ...settings, cspCode: e.target.value.toUpperCase() })}
                placeholder="BOB-CSP-1082"
                className="w-full px-3.5 py-2 text-sm font-mono uppercase font-bold text-orange-700 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Link Branch Name</label>
              <input
                type="text"
                value={settings.branchName}
                onChange={e => setSettings({ ...settings, branchName: e.target.value })}
                placeholder="Bank of Baroda CSP Branch"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Link Branch Code / SOL ID</label>
              <input
                type="text"
                value={settings.branchCode}
                onChange={e => setSettings({ ...settings, branchCode: e.target.value.toUpperCase() })}
                placeholder="BARB0CSP001"
                className="w-full px-3.5 py-2 text-sm font-mono uppercase border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Bank IFSC Code</label>
              <input
                type="text"
                value={settings.ifscCode}
                onChange={e => setSettings({ ...settings, ifscCode: e.target.value.toUpperCase() })}
                placeholder="BARB0XXXXXX"
                className="w-full px-3.5 py-2 text-sm font-mono uppercase border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Reference Number Prefix</label>
              <input
                type="text"
                value={settings.refPrefix}
                onChange={e => setSettings({ ...settings, refPrefix: e.target.value.toUpperCase() })}
                placeholder="BOB-2026-"
                className="w-full px-3.5 py-2 text-sm font-mono uppercase font-bold text-slate-800 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>
          </div>
        </div>

        {/* 2. Operator Details */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <User size={16} className="text-orange-600" />
            <span>BC Operator Information</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Operator / Agent Name</label>
              <input
                type="text"
                value={settings.operatorName}
                onChange={e => setSettings({ ...settings, operatorName: e.target.value })}
                placeholder="Alinur Sekh"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Operator Mobile Contact</label>
              <input
                type="tel"
                value={settings.operatorContact}
                onChange={e => setSettings({ ...settings, operatorContact: e.target.value.replace(/\D/g, "") })}
                placeholder="9876543210"
                className="w-full px-3.5 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>
          </div>
        </div>

        {/* 3. Authorized Stamp & Signature */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <FileText size={16} className="text-orange-600" />
            <span>Authorized Stamp / Seal for Acknowledgment Slip</span>
          </h2>

          <p className="text-xs text-slate-500">
            Upload your official CSP round stamp or signature. It will be printed automatically on every Bank of Baroda Customer Acknowledgment Slip.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-orange-50/50 rounded-xl border border-orange-200">
            {/* Stamp Preview Box */}
            <div className="w-40 h-24 bg-white border-2 border-dashed border-orange-300 rounded-xl flex items-center justify-center p-2 overflow-hidden shadow-2xs">
              {settings.stampSignatureUrl ? (
                <img
                  src={settings.stampSignatureUrl}
                  alt="BOB Stamp"
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <div className="text-center text-slate-400 text-xs font-semibold">
                  No Stamp Uploaded
                </div>
              )}
            </div>

            {/* Upload Action */}
            <div className="space-y-2 flex-1 text-center sm:text-left">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="bob-stamp-upload"
              />
              <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
                <label
                  htmlFor="bob-stamp-upload"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-xs"
                >
                  <Upload size={14} />
                  Upload Stamp / Signature
                </label>
                {settings.stampSignatureUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveStamp}
                    className="px-3 py-2 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors"
                  >
                    Remove Stamp
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Recommended: Transparent PNG or crisp high-contrast JPG up to 2MB.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
