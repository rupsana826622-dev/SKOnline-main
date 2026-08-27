import React, { useState, useEffect } from "react";
import { 
  MessageSquare, Plus, Edit2, Trash2, Globe, Image, 
  Layers, CheckCircle, RefreshCw, X, ChevronRight, Sparkles 
} from "lucide-react";
import { WhatsAppService, type WhatsAppTemplateData } from "@/services/WhatsAppService";
import { supabase } from "@/lib/supabase";
import { generateId } from "@/lib/utils";
import { toast } from "sonner";

export const TemplateManager: React.FC = () => {
  const [templates, setTemplates] = useState<WhatsAppTemplateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WhatsAppTemplateData | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [category, setCategory] = useState("Utility");
  const [language, setLanguage] = useState("en");
  const [headerType, setHeaderType] = useState<WhatsAppTemplateData["header_type"]>("NONE");
  const [headerImageUrl, setHeaderImageUrl] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    const data = await WhatsAppService.getTemplates();
    setTemplates(data);
    setLoading(false);
  };

  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setName("");
    setTemplateId("");
    setCategory("Utility");
    setLanguage("en");
    setHeaderType("NONE");
    setHeaderImageUrl("");
    setMessageBody("");
    setShowModal(true);
  };

  const handleOpenEdit = (tpl: WhatsAppTemplateData) => {
    setEditingTemplate(tpl);
    setName(tpl.template_name);
    setTemplateId(tpl.template_id);
    setCategory(tpl.category);
    setLanguage(tpl.language);
    setHeaderType(tpl.header_type);
    setHeaderImageUrl(tpl.header_image_url);
    setMessageBody(tpl.message_body);
    setShowModal(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // 1. Attempt upload to Supabase Storage bucket 'templates'
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}_header.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from("templates")
        .upload(fileName, file, { cacheControl: "3600", upsert: true });

      if (!error && data) {
        const { data: urlData } = supabase.storage
          .from("templates")
          .getPublicUrl(fileName);
        setHeaderImageUrl(urlData.publicUrl);
        toast.success("Image uploaded to Supabase Storage!");
      } else {
        // 2. Storage Bucket not set up - fallback to Base64 persistent data URL
        const reader = new FileReader();
        reader.onload = ev => {
          setHeaderImageUrl(ev.target?.result as string);
          toast.success("Image saved as persistent URL preview!");
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      toast.error("Failed to upload header media.");
    } finally {
      setUploading(false);
    }
  };

  // Helper to extract double-curly variables from message body
  const extractVariables = (text: string): string[] => {
    const regex = /{{([a-zA-Z0-9_]+)}}/g;
    const matches: string[] = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      if (!matches.includes(match[1])) {
        matches.push(match[1]);
      }
    }
    return matches;
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Template Name is required.");
      return;
    }
    if (!templateId.trim()) {
      toast.error("Template ID is required.");
      return;
    }
    if (!messageBody.trim()) {
      toast.error("Message Body is required.");
      return;
    }

    const detectedVars = extractVariables(messageBody);

    const payload: WhatsAppTemplateData = {
      id: editingTemplate?.id || generateId(),
      template_name: name.trim().toLowerCase().replace(/\s+/g, "_"),
      template_id: templateId.trim(),
      category,
      language,
      header_type: headerType,
      header_image_url: headerType === "IMAGE" ? headerImageUrl : "",
      message_body: messageBody,
      variables: detectedVars,
      is_active: true,
    };

    const success = await WhatsAppService.saveTemplate(payload);
    if (success) {
      toast.success(editingTemplate ? "Template updated successfully!" : "Template created successfully!");
      setShowModal(false);
      loadTemplates();
    } else {
      toast.error("Failed to save template to Supabase.");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete template "${name}"?`)) return;
    const success = await WhatsAppService.deleteTemplate(id);
    if (success) {
      toast.success("Template deleted.");
      loadTemplates();
    } else {
      toast.error("Failed to delete template.");
    }
  };

  // Smartphone live message rendering preview
  const renderBodyPreview = () => {
    if (!messageBody) return "Enter message body text to preview...";
    let preview = messageBody;
    
    // Replace with sample values
    const sampleValues: Record<string, string> = {
      name: "Rupsana Begum",
      account_no: "19001007821",
      ref_no: "REF-2026-9812",
      csp_name: "SK Financial Services",
      1: "Rupsana Begum",
      2: "19001007821",
      3: "Main Market Branch",
    };

    Object.entries(sampleValues).forEach(([key, val]) => {
      preview = preview.replace(new RegExp(`{{${key}}}`, "g"), val);
    });

    return preview;
  };

  return (
    <div className="sk-card overflow-hidden mt-5">
      <div className="flex items-center justify-between px-5 py-4 bg-slate-50 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
            <Layers size={16} className="text-blue-600" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-800">Custom Template Manager</h2>
            <p className="text-xs text-slate-500">Manage Meta-approved templates synced with Supabase</p>
          </div>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
        >
          <Plus size={13} />
          Create Template
        </button>
      </div>

      <div className="p-5">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw size={24} className="animate-spin text-blue-600" />
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-12 text-slate-400 space-y-2 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <MessageSquare size={36} className="mx-auto text-slate-300" />
            <div className="font-semibold text-sm text-slate-500">No Templates Found</div>
            <div className="text-xs max-w-xs mx-auto">Create a template to start sending structured, variable-rich customer alerts.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map(tpl => (
              <div 
                key={tpl.id} 
                className="border border-slate-200 rounded-xl p-4 bg-white hover:border-blue-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">{tpl.template_name}</h3>
                      <p className="text-[10px] font-mono text-slate-400 mt-0.5">ID: {tpl.template_id}</p>
                    </div>
                    <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-100">
                      {tpl.category}
                    </span>
                  </div>
                  
                  <div className="mt-3 bg-slate-50 rounded-lg p-2.5 text-xs text-slate-600 line-clamp-3 leading-relaxed whitespace-pre-line border border-slate-100 font-medium">
                    {tpl.message_body}
                  </div>

                  {tpl.variables.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1 items-center">
                      <span className="text-[10px] text-slate-400 mr-1">Variables:</span>
                      {tpl.variables.map(v => (
                        <code key={v} className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold">
                          {v}
                        </code>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold uppercase">
                    <Globe size={11} /> {tpl.language}
                    {tpl.header_type !== "NONE" && (
                      <span className="inline-flex items-center gap-1 ml-2 bg-slate-100 px-1.5 py-0.5 rounded text-[9px]">
                        <Image size={10} /> {tpl.header_type}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(tpl)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit Template"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(tpl.id, tpl.template_name)}
                      className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Template"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Template Creation/Editing Dialog */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-4xl w-full flex flex-col md:flex-row overflow-hidden max-h-[90vh]">
            
            {/* Left: Input Form */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4 max-h-[50vh] md:max-h-full">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-800 text-base">
                  {editingTemplate ? "✏️ Edit WhatsApp Template" : "✨ Create New WhatsApp Template"}
                </h3>
                <button onClick={() => setShowModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                  <X size={16} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Template Name (Slug)</label>
                  <input
                    type="text"
                    className="form-input font-mono text-xs"
                    placeholder="e.g. account_opening_welcome"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    disabled={!!editingTemplate}
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Unique identifier, lowercase with underscores</p>
                </div>

                <div>
                  <label className="form-label">Meta / Provider Template ID</label>
                  <input
                    type="text"
                    className="form-input font-mono text-xs"
                    placeholder="e.g. welcome_message_01"
                    value={templateId}
                    onChange={e => setTemplateId(e.target.value)}
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Official template ID from Gateway Dashboard</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Category</label>
                  <select 
                    className="form-input text-xs"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                  >
                    <option value="Utility">Utility (Welcome, Updates)</option>
                    <option value="Marketing">Marketing (Offers, Events)</option>
                    <option value="Authentication">Authentication (OTPs)</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Language Code</label>
                  <input
                    type="text"
                    className="form-input font-mono text-xs"
                    placeholder="e.g. en, hi, bn"
                    value={language}
                    onChange={e => setLanguage(e.target.value)}
                  />
                </div>
              </div>

              {/* Header Configuration */}
              <div className="border-t border-slate-100 pt-3">
                <label className="form-label">Header Media Type</label>
                <div className="flex gap-2 mb-2">
                  {(["NONE", "TEXT", "IMAGE"] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setHeaderType(type)}
                      className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all ${
                        headerType === type 
                          ? "bg-blue-50 text-blue-700 border-blue-200 shadow-sm" 
                          : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                {headerType === "IMAGE" && (
                  <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2">
                    <label className="text-[11px] font-bold text-slate-700 block">Header Image Uploader</label>
                    <input
                      type="file"
                      accept="image/*"
                      className="text-xs text-slate-500 w-full file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      onChange={handleFileUpload}
                    />
                    {uploading && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <RefreshCw size={12} className="animate-spin text-blue-600" />
                        Uploading media file...
                      </div>
                    )}
                    {headerImageUrl && (
                      <div className="text-[10px] text-emerald-700 truncate font-mono bg-white p-1.5 rounded border border-slate-100">
                        URL: {headerImageUrl}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Message Body */}
              <div className="border-t border-slate-100 pt-3">
                <div className="flex justify-between items-center mb-1">
                  <label className="form-label mb-0">Message Body Template</label>
                  <div className="text-[10px] text-blue-600 font-bold flex items-center gap-1">
                    <Sparkles size={11} /> Use variables like {"{{name}}"} or {"{{1}}"}
                  </div>
                </div>
                <textarea
                  className="form-input text-xs h-24 font-medium"
                  placeholder="Dear {{name}}, welcome to Bank! Account number {{account_no}} opened."
                  value={messageBody}
                  onChange={e => setMessageBody(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
                >
                  Save Template
                </button>
              </div>
            </div>

            {/* Right: Live Chat Screen Preview Container */}
            <div className="w-full md:w-[320px] bg-slate-50 border-l border-slate-100 p-6 flex flex-col items-center justify-center">
              <div className="text-center mb-4">
                <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Live WhatsApp Preview</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Smartphone client chat viewport</p>
              </div>

              <div className="w-[260px] h-[400px] bg-slate-900 rounded-[28px] border-[5px] border-slate-800 shadow-xl overflow-hidden flex flex-col relative">
                {/* Phone Header */}
                <div className="bg-emerald-800 text-white px-3 py-2 pt-4 flex items-center gap-1.5 text-[10px] font-bold">
                  <div className="w-4 h-4 rounded-full bg-slate-300 text-emerald-800 flex items-center justify-center font-black text-[9px]">S</div>
                  <div className="truncate">
                    <div>SKONLINE CSP</div>
                    <div className="text-[7px] text-emerald-200 font-normal">online</div>
                  </div>
                </div>

                {/* Phone Chat Screen */}
                <div 
                  className="flex-1 bg-[#efeae2] p-2 overflow-y-auto space-y-1.5 relative" 
                  style={{ 
                    backgroundImage: "radial-gradient(#dfdcd6 1px, transparent 0)", 
                    backgroundSize: "10px 10px" 
                  }}
                >
                  {/* WhatsApp message bubble */}
                  <div className="max-w-[90%] bg-white rounded-lg p-2 shadow-sm text-[10px] text-slate-800 relative space-y-1">
                    {headerType === "IMAGE" && headerImageUrl && (
                      <div className="rounded overflow-hidden mb-1 border border-slate-100 h-20 bg-slate-50 flex items-center justify-center">
                        <img src={headerImageUrl} alt="Header" className="object-contain max-h-full max-w-full" />
                      </div>
                    )}
                    <div className="whitespace-pre-line leading-relaxed">
                      {renderBodyPreview()}
                    </div>
                    <div className="text-[7px] text-slate-400 text-right mt-1 font-mono">
                      {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
