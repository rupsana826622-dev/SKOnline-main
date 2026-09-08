import React, { useState, useEffect, useRef } from "react";
import {
  X, Save, Plus, Trash2, RotateCcw, Upload, Image as ImageIcon,
  CheckCircle, Sparkles, Building2, Phone, MapPin, Tag, Shield
} from "lucide-react";
import type { CitizenSettings } from "@/types/citizen";
import { DEFAULT_CITIZEN_SETTINGS, DEFAULT_CITIZEN_SERVICES } from "@/types/citizen";
import { getCitizenSettings, saveCitizenSettings } from "@/lib/citizenStorage";
import { toast } from "sonner";

interface CitizenSettingsModalProps {
  open: boolean;
  onClose: () => void;
  onSaved?: (settings: CitizenSettings) => void;
}

export default function CitizenSettingsModal({ open, onClose, onSaved }: CitizenSettingsModalProps) {
  const [settings, setSettings] = useState<CitizenSettings>(getCitizenSettings());
  const [newService, setNewService] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setSettings(getCitizenSettings());
    }
  }, [open]);

  if (!open) return null;

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
    toast.success("Digital Citizen Hub settings saved successfully!");
    if (onSaved) onSaved(settings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-bold">
              <Sparkles size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Digital Citizen Services Settings</h2>
              <p className="text-xs text-slate-400">Configure services list, stamp/signature, and promotional receipt branding</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto custom-scroll space-y-6">
          {/* 1. Dynamic Service Types Manager */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag size={16} className="text-blue-600" />
                <h3 className="text-sm font-bold text-slate-800">Dynamic Service Types Manager</h3>
              </div>
              <button
                type="button"
                onClick={handleResetServices}
                className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-blue-600 transition-colors"
              >
                <RotateCcw size={12} />
                Reset Defaults
              </button>
            </div>
            <p className="text-xs text-slate-500">
              These services populate the service dropdown on the application form and customer receipt.
            </p>

            {/* Quick Add Form */}
            <form onSubmit={handleAddService} className="flex gap-2">
              <input
                type="text"
                value={newService}
                onChange={e => setNewService(e.target.value)}
                placeholder="Add custom service (e.g. Bill Payment, Recharge, ITR Filing)..."
                className="flex-1 px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
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
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs font-semibold shadow-xs hover:border-blue-300 transition-colors"
                >
                  <span>{s}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteService(s)}
                    className="text-slate-400 hover:text-red-600 transition-colors p-0.5"
                    title={`Delete ${s}`}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* 2. Stamp / Signature Upload */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-blue-600" />
              <h3 className="text-sm font-bold text-slate-800">Stamp & Authorized Signature</h3>
            </div>
            <p className="text-xs text-slate-500">
              Upload a digital stamp/signature image to be printed on the customer receipt.
            </p>

            <div className="flex items-center gap-4">
              {settings.stampSignatureUrl ? (
                <div className="relative group p-2 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-center">
                  <img
                    src={settings.stampSignatureUrl}
                    alt="Stamp Preview"
                    className="h-16 max-w-[140px] object-contain"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveStamp}
                    className="absolute -top-2 -right-2 p-1 bg-red-600 text-white rounded-full shadow hover:bg-red-700 transition-colors"
                    title="Remove stamp"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <div className="h-16 w-32 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 bg-white">
                  <ImageIcon size={18} className="mb-1" />
                  <span className="text-[10px] font-medium">No Stamp</span>
                </div>
              )}

              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                  id="stamp-file-input"
                />
                <label
                  htmlFor="stamp-file-input"
                  className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer transition-colors shadow-xs"
                >
                  <Upload size={14} />
                  {settings.stampSignatureUrl ? "Change Stamp Image" : "Upload Digital Stamp"}
                </label>
                <div className="text-[11px] text-slate-400 mt-1">PNG, JPG with transparent or white background recommended (max 2MB)</div>
              </div>
            </div>
          </div>

          {/* 3. Promotional Branding Text */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-amber-500" />
                <h3 className="text-sm font-bold text-slate-800">Promotional Branding Text</h3>
              </div>
              <button
                type="button"
                onClick={() => setSettings(prev => ({ ...prev, promotionalText: DEFAULT_CITIZEN_SETTINGS.promotionalText }))}
                className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-blue-600 transition-colors"
              >
                <RotateCcw size={12} />
                Default Text
              </button>
            </div>
            <p className="text-xs text-slate-500">
              This message appears in the highlighted promotional box at the bottom of customer receipts.
            </p>
            <textarea
              rows={3}
              value={settings.promotionalText}
              onChange={e => setSettings(prev => ({ ...prev, promotionalText: e.target.value }))}
              placeholder="Enter promotional message..."
              className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white leading-relaxed"
            />
          </div>

          {/* 4. Center Information */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
            <div className="flex items-center gap-2">
              <Building2 size={16} className="text-blue-600" />
              <h3 className="text-sm font-bold text-slate-800">Center Information (Header)</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Center / Business Name
                </label>
                <input
                  type="text"
                  value={settings.centerName}
                  onChange={e => setSettings(prev => ({ ...prev, centerName: e.target.value }))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white font-medium"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Contact Number
                </label>
                <input
                  type="text"
                  value={settings.centerContact}
                  onChange={e => setSettings(prev => ({ ...prev, centerContact: e.target.value }))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white font-mono"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Center Address
                </label>
                <input
                  type="text"
                  value={settings.centerAddress}
                  onChange={e => setSettings(prev => ({ ...prev, centerAddress: e.target.value }))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-200 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
          >
            <Save size={14} />
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
