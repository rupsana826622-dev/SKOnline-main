import React, { useState, useEffect, useRef } from "react";
import {
  Settings, Save, Upload, RotateCcw,
  Building2, Phone, MapPin, Hash, User, FileText, Check, ExternalLink, X
} from "lucide-react";
import type { BobSettings } from "@/types/bob";
import { DEFAULT_BOB_SETTINGS } from "@/types/bob";
import { getBobSettings, saveBobSettingsAsync, uploadBobStamp, syncBobFromSupabase } from "@/lib/bobStorage";
import { toast } from "sonner";
import SEO from "@/components/common/SEO";

export default function BobSettingsPage() {
  const [settings, setSettings] = useState<BobSettings>(getBobSettings());
  const [saving, setSaving] = useState(false);
  const [uploadingStamp, setUploadingStamp] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSettings(getBobSettings());
    syncBobFromSupabase().then(() => {
      setSettings(getBobSettings());
    });
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setUploadingStamp(true);
    const toastId = toast.loading("Uploading stamp / seal to Supabase Storage...");

    try {
      const { url, error } = await uploadBobStamp(file);
      if (error || !url) {
        toast.error(`Stamp upload failed: ${error?.message || "Storage error"}`, { id: toastId });
        return;
      }

      setSettings(prev => ({ ...prev, stampSignatureUrl: url }));
      toast.success("Authorized Seal / Stamp uploaded to Supabase!", { id: toastId });
    } catch (err: any) {
      toast.error(`Upload error: ${err.message || "Failed to upload file"}`, { id: toastId });
    } finally {
      setUploadingStamp(false);
    }
  };

  const handleRemoveStamp = () => {
    setSettings(prev => ({ ...prev, stampSignatureUrl: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
    toast.info("Authorized Seal removed. Remember to save settings.");
  };

  const handleSave = async () => {
    if (!settings.cspAddress?.trim()) {
      toast.error("CSP Address is required.");
      return;
    }
    if (!settings.linkBranch?.trim()) {
      toast.error("Link Branch Name is required.");
      return;
    }
    if (!settings.ifscCode?.trim()) {
      toast.error("Bank IFSC Code is required.");
      return;
    }

    setSaving(true);
    const toastId = toast.loading("Saving settings to Supabase Cloud...");

    try {
      const { error } = await saveBobSettingsAsync(settings);
      if (error) {
        toast.error(`Settings save failed: ${error.message || "Database error"}`, { id: toastId });
        return;
      }

      setSaved(true);
      toast.success("Bank of Baroda CSP settings saved and synced to Supabase!", { id: toastId });
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      toast.error(`Error saving settings: ${err.message || "Network error"}`, { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (confirm("Reset all BOB settings to defaults? This will overwrite existing cloud settings.")) {
      setSettings(DEFAULT_BOB_SETTINGS);
      await saveBobSettingsAsync(DEFAULT_BOB_SETTINGS);
      toast.success("Settings reset to defaults.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-fade-in">
      <SEO title="Bank of Baroda CSP Settings" />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center font-black text-lg shadow-md">
            BOB
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Bank of Baroda CSP Settings</h1>
            <p className="text-xs text-slate-500">Configure CSP Address, Link Branch, IFSC Code, and Official Seal</p>
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
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow transition-all"
          >
            {saving ? (
              <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <Save size={14} />
            )}
            {saving ? "Saving to Cloud..." : saved ? "Saved!" : "Save Settings"}
          </button>
        </div>
      </div>

      <div className="space-y-5">
        {/* 1. Branch, CSP Address & IFSC Details */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building2 size={16} className="text-orange-600" />
            <span>CSP Center, Link Branch & Bank Identification</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* CSP Address */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                CSP Address <span className="text-orange-600">*</span>
              </label>
              <input
                type="text"
                required
                value={settings.cspAddress || ""}
                onChange={e => setSettings({ ...settings, cspAddress: e.target.value })}
                placeholder="e.g. Rampur"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium"
              />
              <p className="mt-1 text-[11px] text-slate-400">Printed on receipt as: CSP Address: {settings.cspAddress || "Rampur"}</p>
            </div>

            {/* Link Branch */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Link Branch Name <span className="text-orange-600">*</span>
              </label>
              <input
                type="text"
                required
                value={settings.linkBranch || ""}
                onChange={e => setSettings({ ...settings, linkBranch: e.target.value, branchName: e.target.value })}
                placeholder="e.g. Rajbari"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium"
              />
              <p className="mt-1 text-[11px] text-slate-400">Printed on receipt as: Link Branch: {settings.linkBranch || "Rajbari"}</p>
            </div>

            {/* IFSC Code */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Bank IFSC Code <span className="text-orange-600">*</span>
              </label>
              <input
                type="text"
                required
                value={settings.ifscCode || ""}
                onChange={e => setSettings({ ...settings, ifscCode: e.target.value.toUpperCase() })}
                placeholder="e.g. BARB0DBRAMP"
                className="w-full px-3.5 py-2 text-sm font-mono uppercase font-bold text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
              <p className="mt-1 text-[11px] text-slate-400">Printed on receipt as: IFSC Code: {settings.ifscCode || "BARB0DBRAMP"}</p>
            </div>

            {/* CSP Agent Code */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">CSP Agent Code / ID</label>
              <input
                type="text"
                value={settings.cspCode || ""}
                onChange={e => setSettings({ ...settings, cspCode: e.target.value.toUpperCase() })}
                placeholder="BOB-CSP-1082"
                className="w-full px-3.5 py-2 text-sm font-mono uppercase font-bold text-orange-700 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            {/* CSP / Center Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">CSP Center Title / Name</label>
              <input
                type="text"
                value={settings.cspName || ""}
                onChange={e => setSettings({ ...settings, cspName: e.target.value })}
                placeholder="SK Financial & CSP Services"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            {/* Reference Number Prefix */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Reference Number Prefix</label>
              <input
                type="text"
                value={settings.refPrefix || ""}
                onChange={e => setSettings({ ...settings, refPrefix: e.target.value.toUpperCase() })}
                placeholder="BOB-2026-"
                className="w-full px-3.5 py-2 text-sm font-mono uppercase font-bold text-slate-800 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>
          </div>
        </div>

        {/* 2. Operator Details */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <User size={16} className="text-orange-600" />
            <span>BC Operator Information</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Operator / Agent Name</label>
              <input
                type="text"
                value={settings.operatorName || ""}
                onChange={e => setSettings({ ...settings, operatorName: e.target.value })}
                placeholder="CSP Operator"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Operator Mobile Contact</label>
              <input
                type="tel"
                value={settings.operatorContact || ""}
                onChange={e => setSettings({ ...settings, operatorContact: e.target.value.replace(/\D/g, "") })}
                placeholder="9876543210"
                className="w-full px-3.5 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>
          </div>
        </div>

        {/* 3. Authorized Stamp & Signature Upload */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <FileText size={16} className="text-orange-600" />
            <span>Authorized Stamp & Signature (Cloud Persisted)</span>
          </h2>

          <p className="text-xs text-slate-500">
            Upload your official CSP round stamp or signature. It is uploaded directly to Supabase Storage and printed automatically on every Bank of Baroda Customer Acknowledgment Slip.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-6 p-5 bg-orange-50/50 rounded-xl border border-orange-200">
            {/* Stamp Preview Box */}
            <div className="w-44 h-28 bg-white border-2 border-dashed border-orange-300 rounded-xl flex items-center justify-center p-2 overflow-hidden shadow-xs">
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
            <div className="space-y-2.5 flex-1 text-center sm:text-left">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploadingStamp}
                className="hidden"
                id="bob-stamp-upload"
              />
              <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
                <label
                  htmlFor="bob-stamp-upload"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors shadow-xs"
                >
                  <Upload size={14} />
                  <span>{uploadingStamp ? "Uploading to Cloud..." : "Upload Stamp / Signature"}</span>
                </label>
                {settings.stampSignatureUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveStamp}
                    className="px-3.5 py-2.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl border border-red-200 transition-colors"
                  >
                    Remove Stamp
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Transparent PNG or crisp JPG up to 2MB. Saved securely in Supabase Storage.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
