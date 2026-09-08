import React, { useState, useEffect, useRef } from "react";
import {
  Settings, Save, Plus, Trash2, RotateCcw, Upload, Image as ImageIcon,
  CheckCircle, Sparkles, Building2, Phone, MapPin, Tag, Shield
} from "lucide-react";
import type { CitizenSettings } from "@/types/citizen";
import { DEFAULT_CITIZEN_SETTINGS, DEFAULT_CITIZEN_SERVICES } from "@/types/citizen";
import { getCitizenSettings, saveCitizenSettings } from "@/lib/citizenStorage";
import { toast } from "sonner";
import SEO from "@/components/common/SEO";

export default function CitizenSettingsPage() {
  const [settings, setSettings] = useState<CitizenSettings>(getCitizenSettings());
  const [newService, setNewService] = useState("");
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSettings(getCitizenSettings());
  }, []);

  const handleAddService = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newService.trim();
    if (!trimmed) return;
    if (settings.serviceTypes.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
      toast.error(`"${trimmed}" already exists in the service list.`);
      return;
    }
    const updated = [...settings.serviceTypes, trimmed];
    setSettings(prev => ({ ...prev, serviceTypes: updated }));
    setNewService("");
    toast.success(`Added "${trimmed}" to services.`);
  };

  const handleDeleteService = (serviceToRemove: string) => {
    const updated = settings.serviceTypes.filter(s => s !== serviceToRemove);
    if (updated.length === 0) {
      toast.error("You must have at least one service type.");
      return;
    }
    setSettings(prev => ({ ...prev, serviceTypes: updated }));
    toast.success(`Removed "${serviceToRemove}".`);
  };

  const handleResetServices = () => {
    if (confirm("Reset service types to default list?")) {
      setSettings(prev => ({ ...prev, serviceTypes: DEFAULT_CITIZEN_SERVICES }));
      toast.success("Services reset to defaults.");
    }
  };

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
      toast.success("Stamp / Signature uploaded.");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveStamp = () => {
    setSettings(prev => ({ ...prev, stampSignatureUrl: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
    toast.info("Stamp / Signature removed.");
  };

  const handleSave = () => {
    saveCitizenSettings(settings);
    setSaved(true);
    toast.success("Digital Citizen Hub settings saved successfully!");
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <SEO title="Services Settings — Digital Citizen Hub" />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
            <Settings size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Digital Citizen Services Settings</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage dynamic services dropdown, signature/stamp image, and promotional receipt branding
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white rounded-xl transition-all shadow-md ${
            saved ? "bg-emerald-600 hover:bg-emerald-700" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {saved ? <CheckCircle size={15} /> : <Save size={15} />}
          {saved ? "Saved Changes!" : "Save All Changes"}
        </button>
      </div>

      {/* 1. Dynamic Service Types Manager */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag size={18} className="text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">Dynamic Service Types Manager</h2>
          </div>
          <button
            type="button"
            onClick={handleResetServices}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
          >
            <RotateCcw size={13} />
            Reset Defaults
          </button>
        </div>
        <p className="text-xs text-slate-500">
          These service types are loaded live into the Add/Edit Service form dropdown and rendered on receipts.
        </p>

        {/* Quick Add Form */}
        <form onSubmit={handleAddService} className="flex gap-2 max-w-xl">
          <input
            type="text"
            value={newService}
            onChange={e => setNewService(e.target.value)}
            placeholder="Add custom service (e.g. Bill Payment, Recharge, ITR Filing)..."
            className="flex-1 px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50 focus:bg-white"
          />
          <button
            type="submit"
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
          >
            <Plus size={14} />
            Add Service
          </button>
        </form>

        {/* Service Badges Container */}
        <div className="flex flex-wrap gap-2 pt-2">
          {settings.serviceTypes.map(s => (
            <span
              key={s}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold shadow-2xs hover:border-blue-300 transition-colors"
            >
              <span>{s}</span>
              <button
                type="button"
                onClick={() => handleDeleteService(s)}
                className="text-slate-400 hover:text-red-600 transition-colors p-0.5"
                title={`Delete ${s}`}
              >
                <Trash2 size={12} />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* 2. Stamp / Signature Upload */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Shield size={18} className="text-blue-600" />
          <h2 className="text-sm font-bold text-slate-900">Stamp & Authorized Signature</h2>
        </div>
        <p className="text-xs text-slate-500">
          Upload an official center stamp / authorized digital signature image. It will be printed in the bottom right corner of the Half-A4 customer receipt.
        </p>

        <div className="flex items-center gap-6">
          {settings.stampSignatureUrl ? (
            <div className="relative group p-3 bg-slate-50 rounded-xl border border-slate-200 shadow-sm flex items-center justify-center">
              <img
                src={settings.stampSignatureUrl}
                alt="Stamp Preview"
                className="h-20 max-w-[160px] object-contain"
              />
              <button
                type="button"
                onClick={handleRemoveStamp}
                className="absolute -top-2 -right-2 p-1 bg-red-600 text-white rounded-full shadow hover:bg-red-700 transition-colors"
                title="Remove stamp"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ) : (
            <div className="h-20 w-36 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 bg-slate-50">
              <ImageIcon size={22} className="mb-1" />
              <span className="text-xs font-medium">No Stamp Uploaded</span>
            </div>
          )}

          <div className="space-y-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
              id="stamp-file-input-page"
            />
            <label
              htmlFor="stamp-file-input-page"
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors shadow-xs"
            >
              <Upload size={14} />
              {settings.stampSignatureUrl ? "Change Stamp Image" : "Upload Digital Stamp / Sign"}
            </label>
            <div className="text-[11px] text-slate-400">
              Supported: PNG, JPG, WEBP with white/transparent background (max 2MB)
            </div>
          </div>
        </div>
      </div>

      {/* 3. Promotional Branding Text */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-amber-500" />
            <h2 className="text-sm font-bold text-slate-900">Promotional Branding Text</h2>
          </div>
          <button
            type="button"
            onClick={() => setSettings(prev => ({ ...prev, promotionalText: DEFAULT_CITIZEN_SETTINGS.promotionalText }))}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
          >
            <RotateCcw size={13} />
            Default Text
          </button>
        </div>
        <p className="text-xs text-slate-500">
          This message is printed in a clean bordered box at the bottom of customer acknowledgement slips.
        </p>
        <textarea
          rows={3}
          value={settings.promotionalText}
          onChange={e => setSettings(prev => ({ ...prev, promotionalText: e.target.value }))}
          placeholder="Enter promotional message..."
          className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50 focus:bg-white leading-relaxed font-medium"
        />
      </div>

      {/* 4. Center Details */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Building2 size={18} className="text-blue-600" />
          <h2 className="text-sm font-bold text-slate-900">Center Information (Receipt Header)</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Center Name / Heading
            </label>
            <input
              type="text"
              value={settings.centerName}
              onChange={e => setSettings(prev => ({ ...prev, centerName: e.target.value }))}
              className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50 focus:bg-white font-semibold"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Contact Number
            </label>
            <input
              type="text"
              value={settings.centerContact}
              onChange={e => setSettings(prev => ({ ...prev, centerContact: e.target.value }))}
              className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50 focus:bg-white font-mono"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Center Address
            </label>
            <input
              type="text"
              value={settings.centerAddress}
              onChange={e => setSettings(prev => ({ ...prev, centerAddress: e.target.value }))}
              className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50 focus:bg-white"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
