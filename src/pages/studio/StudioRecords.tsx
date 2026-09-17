import { useState, useEffect } from "react";
import {
  Hash, User, Phone, MapPin, Tag, Calendar, FileType,
  HardDrive, ExternalLink, Trash2, AlertTriangle, X,
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchStudioRecords,
  deleteStudioRecord,
  type StudioRecord,
} from "@/lib/studioStorage";
import { useStudioLayout } from "./StudioLayout";

// ─── HELPERS ──────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return iso;
  }
}

const CATEGORY_COLORS: Record<string, string> = {
  "Passport Photo":   "bg-blue-100 text-blue-800",
  "Stamp Size Photo": "bg-violet-100 text-violet-800",
  "Document/Scan":    "bg-amber-100 text-amber-800",
  "Certificate":      "bg-emerald-100 text-emerald-800",
  "Other":            "bg-slate-100 text-slate-700",
};

// ─── DELETE CONFIRM ───────────────────────────────────────

function DeleteConfirm({ name, onConfirm, onCancel }: { name: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
          <AlertTriangle size={22} className="text-red-600" />
        </div>
        <h3 className="font-bold text-slate-800 text-base mb-1">Delete Record?</h3>
        <p className="text-sm text-slate-500 mb-5">
          Permanently remove <strong>{name}</strong>'s file from the archive?
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition-colors">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MASTER RECORDS TABLE ─────────────────────────────────

export default function StudioRecords() {
  const [records, setRecords] = useState<StudioRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<StudioRecord | null>(null);
  const { searchQuery } = useStudioLayout();

  useEffect(() => {
    fetchStudioRecords().then((data) => {
      setRecords(data);
      setLoading(false);
    });
  }, []);

  const filteredRecords = records.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.customer_name.toLowerCase().includes(q) ||
      (r.mobile && r.mobile.includes(q)) ||
      (r.address && r.address.toLowerCase().includes(q))
    );
  });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await deleteStudioRecord(deleteTarget.id, deleteTarget.file_url);
    if (error) {
      toast.error("Failed to delete record.");
    } else {
      toast.success(`${deleteTarget.customer_name}'s record deleted.`);
      setRecords((prev) => prev.filter((r) => r.id !== deleteTarget.id));
    }
    setDeleteTarget(null);
  };

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">Master Records Table</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {filteredRecords.length} of {records.length} records
          {searchQuery ? ` — filtered by "${searchQuery}"` : ""}
        </p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <X size={32} className="text-slate-300" />
            <p className="text-slate-400 text-sm">
              {searchQuery ? `No results for "${searchQuery}"` : "No records in archive yet."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100" style={{ background: "linear-gradient(90deg, #1e1b4b 0%, #312e81 100%)" }}>
                  <th className="text-left px-4 py-3 text-white/70 font-bold text-xs uppercase tracking-wider w-12">
                    <Hash size={11} className="inline mr-1" />#
                  </th>
                  <th className="text-left px-4 py-3 text-white/70 font-bold text-xs uppercase tracking-wider">
                    <User size={11} className="inline mr-1" />Name
                  </th>
                  <th className="text-left px-4 py-3 text-white/70 font-bold text-xs uppercase tracking-wider">
                    <Phone size={11} className="inline mr-1" />Mobile
                  </th>
                  <th className="text-left px-4 py-3 text-white/70 font-bold text-xs uppercase tracking-wider">
                    <MapPin size={11} className="inline mr-1" />Address
                  </th>
                  <th className="text-left px-4 py-3 text-white/70 font-bold text-xs uppercase tracking-wider">
                    <Tag size={11} className="inline mr-1" />Category
                  </th>
                  <th className="text-left px-4 py-3 text-white/70 font-bold text-xs uppercase tracking-wider">
                    <FileType size={11} className="inline mr-1" />File
                  </th>
                  <th className="text-left px-4 py-3 text-white/70 font-bold text-xs uppercase tracking-wider">
                    <HardDrive size={11} className="inline mr-1" />Size
                  </th>
                  <th className="text-left px-4 py-3 text-white/70 font-bold text-xs uppercase tracking-wider">
                    <Calendar size={11} className="inline mr-1" />Date
                  </th>
                  <th className="text-center px-4 py-3 text-white/70 font-bold text-xs uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredRecords.map((r, idx) => (
                  <tr
                    key={r.id}
                    className="hover:bg-indigo-50/30 transition-colors group"
                  >
                    <td className="px-4 py-3 text-xs text-indigo-500 font-bold whitespace-nowrap">
                      {String(idx + 1).padStart(4, "0")}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">
                      {r.customer_name}
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {r.mobile || <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-500 max-w-[180px] truncate">
                      {r.address || <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[r.category] || "bg-slate-100 text-slate-700"}`}>
                        {r.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 max-w-[140px] truncate text-xs">
                      {r.file_name}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                      {r.file_size_kb > 0 ? `${r.file_size_kb} KB` : "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                      {formatDate(r.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <a
                          href={r.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="View File"
                          className="p-1.5 rounded-lg text-indigo-500 hover:bg-indigo-100 transition-colors"
                        >
                          <ExternalLink size={14} />
                        </a>
                        <button
                          onClick={() => setDeleteTarget(r)}
                          title="Delete"
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {deleteTarget && (
        <DeleteConfirm
          name={deleteTarget.customer_name}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
