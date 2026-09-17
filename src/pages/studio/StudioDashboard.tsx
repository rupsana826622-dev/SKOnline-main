import { useState, useEffect, useRef } from "react";
import {
  Printer, Download, Trash2, X, ImagePlus, Loader2,
  Calendar, Phone, MapPin, Tag, User, Hash,
  ZoomIn, FolderOpen, AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchStudioRecords,
  addStudioRecord,
  deleteStudioRecord,
  compressStudioFile,
  uploadStudioFile,
  type StudioRecord,
} from "@/lib/studioStorage";
import { useStudioLayout } from "./StudioLayout";

// ─── CONSTANTS ────────────────────────────────────────────

const CATEGORIES = [
  "Passport Photo",
  "Stamp Size Photo",
  "Document/Scan",
  "Certificate",
  "Other",
] as const;

const CATEGORY_COLORS: Record<string, string> = {
  "Passport Photo":   "bg-blue-100 text-blue-800",
  "Stamp Size Photo": "bg-violet-100 text-violet-800",
  "Document/Scan":    "bg-amber-100 text-amber-800",
  "Certificate":      "bg-emerald-100 text-emerald-800",
  "Other":            "bg-slate-100 text-slate-700",
};

// ─── HELPERS ──────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return iso;
  }
}

// ─── UPLOAD MODAL ─────────────────────────────────────────

interface UploadModalProps {
  onClose: () => void;
  onSuccess: (record: StudioRecord) => void;
}

function UploadModal({ onClose, onSuccess }: UploadModalProps) {
  const [customerName, setCustomerName] = useState("");
  const [mobile, setMobile] = useState("");
  const [address, setAddress] = useState("");
  const [category, setCategory] = useState<string>("Passport Photo");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("Compressing & saving photo... Please wait");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    if (f.type.startsWith("image/")) {
      const url = URL.createObjectURL(f);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    setFile(f);
    if (f.type.startsWith("image/")) {
      const url = URL.createObjectURL(f);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { toast.error("Please select a file to upload."); return; }
    if (!customerName.trim()) { toast.error("Customer Name is required."); return; }

    setLoading(true);
    setLoadingMsg("Optimizing file...");

    try {
      // 1. Compress image
      const compressed = await compressStudioFile(file);
      const fileSizeKb = Math.round(compressed.size / 1024);

      setLoadingMsg("Uploading to secure archive...");

      // 2. Upload to Supabase Storage
      const { url: fileUrl, error: uploadErr } = await uploadStudioFile(compressed);
      if (uploadErr || !fileUrl) {
        toast.error("Upload failed. Please check your Supabase storage bucket 'studio-files'.");
        setLoading(false);
        return;
      }

      setLoadingMsg("Saving record...");

      // 3. Insert DB record
      const { data: newRecord, error: dbErr } = await addStudioRecord({
        customer_name: customerName.trim(),
        mobile: mobile.trim(),
        address: address.trim(),
        category,
        file_url: fileUrl,
        file_name: compressed.name,
        file_size_kb: fileSizeKb,
        file_type: compressed.type,
      });

      if (dbErr || !newRecord) {
        toast.error("File uploaded but failed to save record. Check studio_records table.");
        setLoading(false);
        return;
      }

      toast.success(`"${customerName.trim()}" saved successfully (${fileSizeKb} KB)`);
      onSuccess(newRecord);
      onClose();
    } catch (err) {
      console.error("Studio upload error:", err);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(30,27,75,0.7)", backdropFilter: "blur(8px)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative overflow-hidden animate-fade-in">
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b border-indigo-100"
          style={{ background: "linear-gradient(90deg, #1e1b4b 0%, #4338ca 100%)" }}
        >
          <div>
            <h2 className="text-white font-bold text-base">Upload New Photo / File</h2>
            <p className="text-indigo-300 text-xs mt-0.5">Smart quality-preserving compression applied automatically</p>
          </div>
          <button onClick={onClose} className="text-indigo-300 hover:text-white transition-colors p-1">
            <X size={20} />
          </button>
        </div>

        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-white/90 backdrop-blur-sm">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <ImagePlus size={20} className="text-indigo-600" />
              </div>
            </div>
            <p className="text-indigo-800 font-semibold text-sm text-center px-6">{loadingMsg}</p>
            <p className="text-indigo-400 text-xs">Please wait...</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
          {/* Customer Name */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Customer Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400 pointer-events-none" />
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value.replace(/\b\w/g, (c) => c.toUpperCase()))}
                placeholder="Enter full customer name"
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                autoCapitalize="words"
              />
            </div>
          </div>

          {/* Mobile */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Mobile Number <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400 pointer-events-none" />
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="10-digit mobile number"
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          {/* Village / Address */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Village / Address <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400 pointer-events-none" />
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Village, area or full address"
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Category <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Tag size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400 pointer-events-none" />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              File / Photo <span className="text-red-500">*</span>
            </label>
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="relative border-2 border-dashed border-indigo-200 rounded-xl p-4 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />
              {previewUrl ? (
                <div className="flex items-center gap-4">
                  {/* Instant square thumbnail preview */}
                  <div className="w-20 h-20 rounded-lg overflow-hidden border border-indigo-200 flex-shrink-0 shadow-md">
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-800 truncate">{file?.name}</div>
                    <div className="text-xs text-indigo-600 mt-1">
                      {file ? `${(file.size / 1024).toFixed(0)} KB original → ~100–220 KB after compression` : ""}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">Click to change file</div>
                  </div>
                </div>
              ) : file ? (
                <div className="flex items-center gap-3">
                  <FolderOpen size={28} className="text-indigo-500 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-semibold text-slate-800 truncate">{file.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{(file.size / 1024).toFixed(0)} KB · Click to change</div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-2">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                    <ImagePlus size={22} className="text-indigo-600" />
                  </div>
                  <div className="text-sm font-semibold text-slate-700">Drag & drop or click to select</div>
                  <div className="text-xs text-slate-400">Images (JPG, PNG, WEBP) or PDF</div>
                  <div className="text-[10px] text-indigo-500 font-medium">Smart compression reduces large files to ~100–220 KB</div>
                </div>
              )}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-white font-bold text-sm tracking-wide transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/30 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg, #4338ca 0%, #7c3aed 100%)" }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Processing...
              </span>
            ) : (
              "Save to Archive"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── LIGHTBOX ─────────────────────────────────────────────

function Lightbox({ url, name, onClose }: { url: string; name: string; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: "rgba(15,10,45,0.92)", backdropFilter: "blur(12px)" }}
      onClick={onClose}
    >
      <div className="relative max-w-4xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-indigo-900 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
        >
          <X size={16} />
        </button>
        <img
          src={url}
          alt={name}
          className="max-h-[85vh] max-w-full rounded-xl shadow-2xl object-contain mx-auto block"
          style={{ border: "2px solid rgba(99,82,255,0.4)" }}
        />
        <p className="text-center text-indigo-300 text-xs mt-3 font-medium">{name}</p>
      </div>
    </div>
  );
}

// ─── DELETE CONFIRMATION ──────────────────────────────────

function DeleteConfirm({ name, onConfirm, onCancel }: { name: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
          <AlertTriangle size={22} className="text-red-600" />
        </div>
        <h3 className="font-bold text-slate-800 text-base mb-1">Delete Record?</h3>
        <p className="text-sm text-slate-500 mb-5">
          This will permanently delete <strong>{name}</strong>'s file and record from the archive.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── CUSTOMER CARD ────────────────────────────────────────

interface CardProps {
  record: StudioRecord;
  serialNo: number;
  onDelete: () => void;
}

function CustomerCard({ record, serialNo, onDelete }: CardProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const isImage = record.file_type?.startsWith("image/");

  const handlePrint = () => {
    const win = window.open("", "_blank", "width=700,height=600");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${record.customer_name} - SK Digital Archive</title>
          <style>
            body { margin: 0; padding: 20px; font-family: Arial, sans-serif; background: #fff; display: flex; flex-direction: column; align-items: center; }
            img { max-width: 100%; max-height: 80vh; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,0.12); }
            h2 { color: #1e1b4b; margin-bottom: 4px; }
            p { color: #64748b; font-size: 13px; margin: 2px 0; }
            .badge { display: inline-block; padding: 2px 10px; border-radius: 100px; background: #e0e7ff; color: #4338ca; font-size: 12px; font-weight: bold; margin-bottom: 12px; }
          </style>
        </head>
        <body>
          <h2>${record.customer_name}</h2>
          <div class="badge">${record.category}</div>
          ${record.address ? `<p>📍 ${record.address}</p>` : ""}
          ${record.mobile ? `<p>📞 ${record.mobile}</p>` : ""}
          <p>📅 ${formatDate(record.created_at)}</p>
          <br/>
          ${isImage ? `<img src="${record.file_url}" alt="${record.customer_name}" onload="window.print()" />` : `<p>PDF Document: <a href="${record.file_url}" target="_blank">${record.file_name}</a></p>`}
        </body>
      </html>
    `);
    win.document.close();
  };

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = record.file_url;
    a.download = `${record.customer_name.replace(/\s+/g, "_")}_Photo.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden group hover:shadow-lg hover:border-indigo-200 transition-all duration-300 hover:-translate-y-0.5">
        {/* Card Top */}
        <div className="px-4 pt-4 pb-2 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Hash size={9} />
                {String(serialNo).padStart(4, "0")}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[record.category] || "bg-slate-100 text-slate-700"}`}>
                {record.category}
              </span>
            </div>
            <div className="font-bold text-slate-800 text-sm mt-1.5 truncate">{record.customer_name}</div>
          </div>
        </div>

        {/* Thumbnail */}
        <div
          className="mx-4 mb-3 rounded-xl overflow-hidden bg-gradient-to-br from-indigo-50 to-slate-100 cursor-pointer relative"
          style={{ aspectRatio: "1/1" }}
          onClick={() => isImage && setLightboxOpen(true)}
        >
          {isImage ? (
            <>
              <img
                src={record.file_url}
                alt={record.customer_name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-indigo-900/0 group-hover:bg-indigo-900/20 transition-colors flex items-center justify-center">
                <ZoomIn size={28} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
              </div>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2">
              <FolderOpen size={40} className="text-indigo-400" />
              <span className="text-xs text-indigo-500 font-medium">PDF Document</span>
              <span className="text-[10px] text-slate-400">{record.file_name}</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="px-4 pb-3 space-y-1">
          {record.address && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate">
              <MapPin size={11} className="text-indigo-400 flex-shrink-0" />
              <span className="truncate">{record.address}</span>
            </div>
          )}
          {record.mobile && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Phone size={11} className="text-indigo-400 flex-shrink-0" />
              <span>{record.mobile}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Calendar size={11} className="text-indigo-300 flex-shrink-0" />
            <span>{formatDate(record.created_at)}</span>
            {record.file_size_kb > 0 && (
              <span className="ml-auto text-[10px] text-slate-300">{record.file_size_kb} KB</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-slate-100 grid grid-cols-3 divide-x divide-slate-100">
          <button
            onClick={handlePrint}
            title="Print / View"
            className="flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            <Printer size={13} />
            <span className="hidden sm:inline">Print</span>
          </button>
          <button
            onClick={handleDownload}
            title="Download"
            className="flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Download size={13} />
            <span className="hidden sm:inline">Download</span>
          </button>
          <button
            onClick={() => setDeleteConfirm(true)}
            title="Delete"
            className="flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={13} />
            <span className="hidden sm:inline">Delete</span>
          </button>
        </div>
      </div>

      {lightboxOpen && isImage && (
        <Lightbox url={record.file_url} name={record.customer_name} onClose={() => setLightboxOpen(false)} />
      )}

      {deleteConfirm && (
        <DeleteConfirm
          name={record.customer_name}
          onCancel={() => setDeleteConfirm(false)}
          onConfirm={async () => {
            setDeleteConfirm(false);
            const { error } = await deleteStudioRecord(record.id, record.file_url);
            if (error) {
              toast.error("Failed to delete record.");
            } else {
              toast.success(`${record.customer_name}'s record deleted.`);
              onDelete();
            }
          }}
        />
      )}
    </>
  );
}

// ─── MAIN STUDIO DASHBOARD ────────────────────────────────

export default function StudioDashboard() {
  const [records, setRecords] = useState<StudioRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { searchQuery, uploadModalOpen, setUploadModalOpen } = useStudioLayout();

  useEffect(() => {
    fetchStudioRecords().then((data) => {
      setRecords(data);
      setLoading(false);
    });
  }, []);

  // Live search filtering
  const filteredRecords = records.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.customer_name.toLowerCase().includes(q) ||
      (r.mobile && r.mobile.includes(q)) ||
      (r.address && r.address.toLowerCase().includes(q))
    );
  });

  const handleUploadSuccess = (newRecord: StudioRecord) => {
    setRecords((prev) => [newRecord, ...prev]);
  };

  const handleDelete = (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="p-4 md:p-6">
      {/* Page header */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">
            Photo Gallery & Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {filteredRecords.length} record{filteredRecords.length !== 1 ? "s" : ""}
            {searchQuery ? ` matching "${searchQuery}"` : " in archive"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-full">
            {records.length} Total Files
          </span>
        </div>
      </div>

      {/* Cards grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
          <p className="text-indigo-500 font-medium text-sm">Loading archive...</p>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center">
            <ImagePlus size={28} className="text-indigo-400" />
          </div>
          <div className="text-center">
            <div className="font-semibold text-slate-700 text-base">
              {searchQuery ? `No results for "${searchQuery}"` : "No files in archive yet"}
            </div>
            <div className="text-slate-400 text-sm mt-1">
              {searchQuery ? "Try a different search term." : 'Click "+ Upload New Photo / File" to get started.'}
            </div>
          </div>
          {!searchQuery && (
            <button
              onClick={() => setUploadModalOpen(true)}
              className="mt-2 px-5 py-2.5 rounded-xl text-white font-semibold text-sm transition-all hover:shadow-lg hover:shadow-indigo-500/30"
              style={{ background: "linear-gradient(135deg, #4338ca 0%, #7c3aed 100%)" }}
            >
              + Upload First File
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredRecords.map((record, idx) => (
            <CustomerCard
              key={record.id}
              record={record}
              serialNo={idx + 1}
              onDelete={() => handleDelete(record.id)}
            />
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {uploadModalOpen && (
        <UploadModal
          onClose={() => setUploadModalOpen(false)}
          onSuccess={handleUploadSuccess}
        />
      )}
    </div>
  );
}
