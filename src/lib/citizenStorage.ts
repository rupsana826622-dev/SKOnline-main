import { supabase } from "./supabase";
import type { CitizenServiceRecord, CitizenSettings } from "@/types/citizen";
import { DEFAULT_CITIZEN_SETTINGS, DEFAULT_CITIZEN_SERVICES } from "@/types/citizen";
import { getSession } from "./storage";
import { toast } from "sonner";

const STORAGE_KEYS = {
  records: "sk_online_citizen_services_new_csp",
  settings: "sk_online_citizen_settings_new_csp",
};

export function getCurrentCitizenTenantId(): string {
  const session = getSession();
  return session?.tenantId || session?.tenantCode || "new_csp";
}

// ─── CITIZEN SETTINGS ─────────────────────────────────────────

export function getCitizenSettings(): CitizenSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.settings);
    if (!raw) return DEFAULT_CITIZEN_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      serviceTypes: Array.isArray(parsed.serviceTypes) && parsed.serviceTypes.length > 0
        ? parsed.serviceTypes
        : DEFAULT_CITIZEN_SETTINGS.serviceTypes,
      stampSignatureUrl: parsed.stampSignatureUrl || DEFAULT_CITIZEN_SETTINGS.stampSignatureUrl,
      promotionalText: parsed.promotionalText || DEFAULT_CITIZEN_SETTINGS.promotionalText,
      centerName: parsed.centerName || DEFAULT_CITIZEN_SETTINGS.centerName,
      centerContact: parsed.centerContact || DEFAULT_CITIZEN_SETTINGS.centerContact,
      centerAddress: parsed.centerAddress || DEFAULT_CITIZEN_SETTINGS.centerAddress,
      tagline: parsed.tagline || DEFAULT_CITIZEN_SETTINGS.tagline,
    };
  } catch {
    return DEFAULT_CITIZEN_SETTINGS;
  }
}

/**
 * Upload authorized Stamp/Signature to Supabase Storage
 */
export async function uploadCitizenStamp(file: File): Promise<{ url: string | null; error: any }> {
  try {
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = `citizen_stamp_${Date.now()}_${cleanFileName}`;

    // Try system-assets bucket first, fallback to citizen-documents
    let bucketName = "system-assets";
    let uploadRes = await supabase.storage.from(bucketName).upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
    });

    if (uploadRes.error) {
      bucketName = "citizen-documents";
      uploadRes = await supabase.storage.from(bucketName).upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });
    }

    if (uploadRes.error) {
      console.error("Supabase Storage Stamp Upload Error:", uploadRes.error);
      const msg = `Storage Upload Failed: ${uploadRes.error.message}`;
      alert(msg);
      toast.error(msg);
      return { url: null, error: uploadRes.error };
    }

    const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
    return { url: data?.publicUrl || null, error: null };
  } catch (err: any) {
    console.error("Unexpected error in uploadCitizenStamp:", err);
    alert(`Upload Error: ${err.message || "Unknown error"}`);
    toast.error(`Upload Error: ${err.message || "Unknown error"}`);
    return { url: null, error: err };
  }
}

/**
 * Persist Citizen Hub settings directly to Supabase public.citizen_settings & public.citizen_service_types
 */
export async function saveCitizenSettingsAsync(settings: CitizenSettings): Promise<{ error: any; data?: any }> {
  const tenantId = getCurrentCitizenTenantId();

  // Optimistically update local cache
  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
  window.dispatchEvent(new Event("citizen-settings-updated"));

  const payload = {
    tenant_id: tenantId,
    stamp_signature_url: settings.stampSignatureUrl,
    promotional_text: settings.promotionalText,
    center_name: settings.centerName,
    center_contact: settings.centerContact,
    center_address: settings.centerAddress,
    tagline: settings.tagline || "Digital Citizen Services & Customer Care",
    service_types: settings.serviceTypes,
    updated_at: new Date().toISOString(),
  };

  try {
    // 1. Direct write to public.citizen_settings
    const { data: citizenData, error: citizenError } = await (supabase as any)
      .from("citizen_settings")
      .upsert(payload, { onConflict: "tenant_id" })
      .select();

    if (citizenError) {
      console.error("CRITICAL: citizen_settings save failed:", citizenError);
      const msg = `SUPABASE ERROR (Settings): ${citizenError.message} | Code: ${citizenError.code || "ERR"}`;
      alert(msg);
      toast.error(msg);
      throw citizenError;
    }

    // 2. Also persist individual service types to public.citizen_service_types if available
    if (Array.isArray(settings.serviceTypes) && settings.serviceTypes.length > 0) {
      for (const st of settings.serviceTypes) {
        try {
          await (supabase as any)
            .from("citizen_service_types")
            .upsert({
              tenant_id: tenantId,
              service_name: st,
              name: st,
            }, { onConflict: "tenant_id,service_name" });
        } catch {
          // Ignored if table structure differs
        }
      }
    }

    return { error: null, data: citizenData };
  } catch (err: any) {
    console.error("CRITICAL: citizen_settings save failed:", err);
    const msg = `SUPABASE ERROR (Settings): ${err.message || "Network Error"}`;
    alert(msg);
    toast.error(msg);
    throw err;
  }
}

export function saveCitizenSettings(settings: CitizenSettings): void {
  saveCitizenSettingsAsync(settings);
}

// ─── CITIZEN SERVICE RECORDS ─────────────────────────────────

export function getCitizenRecords(): CitizenServiceRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.records);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCitizenRecords(records: CitizenServiceRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.records, JSON.stringify(records));
    window.dispatchEvent(new Event("citizen-data-updated"));
  } catch (err) {
    console.error("Error saving citizen records to local cache:", err);
  }
}

export function getNextSerialNo(): number {
  const records = getCitizenRecords();
  if (records.length === 0) return 1;
  const max = records.reduce((acc, r) => (r.serialNo > acc ? r.serialNo : acc), 0);
  return max + 1;
}

// Map CitizenServiceRecord to/from Supabase public.citizen_services table
function mapCitizenRecordToDb(r: CitizenServiceRecord): Record<string, any> {
  const tenantId = getCurrentCitizenTenantId();
  return {
    id: r.id,
    tenant_id: tenantId,
    serial_no: Number(r.serialNo || 1),
    customer_name: r.customerName || "",
    contact_no: r.contactNo || "",
    address: r.address || "",
    service_type: r.serviceType || "",
    application_date: r.applicationDate || "",
    app_number: r.appNumber || "",
    portal_password: r.portalPassword || "",
    final_service_no: r.finalServiceNo || "",
    document_file_url: r.documentFileUrl || "",
    total_amount: Number(r.totalAmount || 0),
    advance_paid: Number(r.advancePaid || 0),
    due_amount: Number(r.dueAmount || 0),
    payment_mode: r.paymentMode || "Cash",
    payment_status: r.paymentStatus || (r.dueAmount === 0 ? "Full Paid" : "Partial"),
    status: r.status || "Applied",
    issued_date: r.issuedDate || null,
    delivered_date: r.deliveredDate || null,
    notes: r.notes || "",
    created_at: r.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function mapDbToCitizenRecord(row: any): CitizenServiceRecord {
  const totalAmount = Number(row.total_amount ?? row.annual_income ?? 0);
  const advancePaid = Number(row.advance_paid ?? 0);
  const dueAmount = Number(row.due_amount ?? Math.max(0, totalAmount - advancePaid));
  const paymentMode = (row.payment_mode || row.profession || "Cash") as "Cash" | "UPI";
  const paymentStatus = (row.payment_status || row.category || (dueAmount === 0 ? "Full Paid" : "Partial")) as "Full Paid" | "Partial" | "Pending";

  return {
    id: row.id,
    serialNo: Number(row.serial_no || row.sl_no || row.pin_code || 1) || 1,
    customerName: row.customer_name || row.full_name || "",
    contactNo: row.contact_no || row.mobile_number || row.mobile || "",
    address: row.address || "",
    serviceType: row.service_type || row.father_name || "General Service",
    applicationDate: row.application_date || row.account_opening_date || row.created_at?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    appNumber: row.app_number || row.account_number || "",
    portalPassword: row.portal_password || row.customer_id_cif || "",
    finalServiceNo: row.final_service_no || "",
    documentFileUrl: row.document_file_url || "",
    totalAmount,
    advancePaid,
    dueAmount,
    paymentMode,
    paymentStatus,
    status: (row.status as any) || (row.passbook_issued ? "Delivered" : row.passbook_received ? "Issued" : "Applied"),
    issuedDate: row.issued_date || row.passbook_received_at || null,
    deliveredDate: row.delivered_date || row.passbook_issued_at || null,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
    notes: row.notes || "",
    tenant_code: "new_csp",
  };
}

/**
 * Direct Add/Insert strictly into Supabase public.citizen_services
 */
export async function addCitizenRecord(record: CitizenServiceRecord): Promise<{ error: any; data?: any }> {
  const payload = mapCitizenRecordToDb(record);

  try {
    const { data, error } = await (supabase as any)
      .from("citizen_services")
      .insert([payload])
      .select();

    if (error) {
      console.error("CRITICAL: citizen_services insert failed:", error);
      const msg = `SUPABASE ERROR (Add Citizen Record): ${error.message} | Code: ${error.code || "ERR"}`;
      alert(msg);
      toast.error(msg);
      throw error;
    }

    // Sync live from Supabase
    await fetchCitizenRecordsFromSupabase();
    return { error: null, data: data ? data[0] : null };
  } catch (err: any) {
    console.error("Supabase Citizen Insert Error:", err);
    const msg = `SUPABASE ERROR (Add Record): ${err.message || "Network Error"}`;
    alert(msg);
    toast.error(msg);
    throw err;
  }
}

/**
 * Direct Update strictly in Supabase public.citizen_services
 */
export async function updateCitizenRecord(id: string, updates: Partial<CitizenServiceRecord>): Promise<{ error: any }> {
  const tenantId = getCurrentCitizenTenantId();
  const records = getCitizenRecords();
  const existing = records.find(r => r.id === id);

  const updated: CitizenServiceRecord = {
    ...(existing || {} as any),
    ...updates,
    id,
    updatedAt: new Date().toISOString(),
  };

  // Auto calculate due amount if amounts were updated
  if (updates.totalAmount !== undefined || updates.advancePaid !== undefined) {
    const total = updates.totalAmount !== undefined ? updates.totalAmount : updated.totalAmount;
    const adv = updates.advancePaid !== undefined ? updates.advancePaid : updated.advancePaid;
    updated.dueAmount = Math.max(0, total - adv);
    updated.paymentStatus = updated.dueAmount === 0 ? "Full Paid" : adv > 0 ? "Partial" : "Pending";
  }

  const payload = mapCitizenRecordToDb(updated);

  try {
    const { error } = await (supabase as any)
      .from("citizen_services")
      .update(payload)
      .eq("id", id)
      .eq("tenant_id", tenantId);

    if (error) {
      console.error("CRITICAL: citizen_services update failed:", error);
      const msg = `SUPABASE ERROR (Update Record): ${error.message} | Code: ${error.code || "ERR"}`;
      alert(msg);
      toast.error(msg);
      throw error;
    }

    // Sync live from Supabase
    await fetchCitizenRecordsFromSupabase();
    return { error: null };
  } catch (err: any) {
    console.error("Supabase Citizen Update Error:", err);
    const msg = `SUPABASE ERROR (Update Record): ${err.message || "Network Error"}`;
    alert(msg);
    toast.error(msg);
    throw err;
  }
}

export async function settleCitizenDue(id: string, paymentMode: "Cash" | "UPI"): Promise<{ error: any }> {
  const records = getCitizenRecords();
  const target = records.find(r => r.id === id);
  if (!target) return { error: "Record not found" };

  return updateCitizenRecord(id, {
    advancePaid: target.totalAmount,
    dueAmount: 0,
    paymentMode,
    paymentStatus: "Full Paid",
  });
}

/**
 * Direct Delete strictly from Supabase public.citizen_services
 */
export async function deleteCitizenRecord(id: string): Promise<{ error: any }> {
  const tenantId = getCurrentCitizenTenantId();

  try {
    const { error } = await (supabase as any)
      .from("citizen_services")
      .delete()
      .eq("id", id)
      .eq("tenant_id", tenantId);

    if (error) {
      console.error("CRITICAL: citizen_services delete failed:", error);
      const msg = `SUPABASE ERROR (Delete Record): ${error.message}`;
      alert(msg);
      toast.error(msg);
      throw error;
    }

    // Refresh live records
    await fetchCitizenRecordsFromSupabase();
    return { error: null };
  } catch (err: any) {
    console.error("Supabase Citizen Delete Error:", err);
    const msg = `SUPABASE ERROR (Delete Record): ${err.message || "Network Error"}`;
    alert(msg);
    toast.error(msg);
    throw err;
  }
}

/**
 * Direct Select strictly from Supabase public.citizen_services scoped to tenant_id
 */
export async function fetchCitizenRecordsFromSupabase(): Promise<CitizenServiceRecord[]> {
  const tenantId = getCurrentCitizenTenantId();

  try {
    const { data, error } = await (supabase as any)
      .from("citizen_services")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase Citizen Services Select Error:", error);
      toast.error(`Database Error (Citizen Services): ${error.message}`);
      saveCitizenRecords([]);
      return [];
    }

    const mapped = (data || []).map(mapDbToCitizenRecord);
    saveCitizenRecords(mapped);
    return mapped;
  } catch (err: any) {
    console.error("Failed to fetch citizen data from Supabase:", err);
    saveCitizenRecords([]);
    return [];
  }
}

export async function syncCitizenFromSupabase(): Promise<void> {
  const tenantId = getCurrentCitizenTenantId();

  try {
    // 1. Sync Settings: Query public.citizen_settings
    const { data, error } = await (supabase as any)
      .from("citizen_settings")
      .select("*")
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (!error && data) {
      let serviceTypes = Array.isArray(data.service_types) && data.service_types.length > 0
        ? data.service_types
        : DEFAULT_CITIZEN_SERVICES;

      // Also try to query citizen_service_types
      try {
        const { data: stData } = await (supabase as any)
          .from("citizen_service_types")
          .select("service_name, name")
          .eq("tenant_id", tenantId);

        if (stData && stData.length > 0) {
          const fetchedNames = stData.map((s: any) => s.service_name || s.name).filter(Boolean);
          const merged = Array.from(new Set([...serviceTypes, ...fetchedNames]));
          if (merged.length > 0) serviceTypes = merged;
        }
      } catch {
        // Ignored
      }

      const liveSettings: CitizenSettings = {
        serviceTypes,
        stampSignatureUrl: data.stamp_signature_url || "",
        promotionalText: data.promotional_text || DEFAULT_CITIZEN_SETTINGS.promotionalText,
        centerName: data.center_name || DEFAULT_CITIZEN_SETTINGS.centerName,
        centerContact: data.center_contact || DEFAULT_CITIZEN_SETTINGS.centerContact,
        centerAddress: data.center_address || DEFAULT_CITIZEN_SETTINGS.centerAddress,
        tagline: data.tagline || DEFAULT_CITIZEN_SETTINGS.tagline,
      };

      localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(liveSettings));
      window.dispatchEvent(new Event("citizen-settings-updated"));
    }

    // 2. Sync Records
    await fetchCitizenRecordsFromSupabase();
  } catch (err) {
    console.warn("Failed to sync citizen data from Supabase:", err);
  }
}

/**
 * Upload a document (e-PAN PDF, Acknowledgement, Certificate) to Supabase Storage bucket 'citizen-documents'
 */
export async function uploadCitizenDocument(
  file: File,
  recordId?: string
): Promise<{ url: string | null; error: any }> {
  try {
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = `${recordId || "doc"}_${Date.now()}_${cleanFileName}`;

    const { data, error } = await supabase.storage
      .from("citizen-documents")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      console.error("Supabase Storage Upload Error:", error);
      const msg = `Storage Upload Failed: ${error.message}`;
      alert(msg);
      toast.error(msg);
      return { url: null, error };
    }

    const { data: publicUrlData } = supabase.storage
      .from("citizen-documents")
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData?.publicUrl || null;
    return { url: publicUrl, error: null };
  } catch (err: any) {
    console.error("Unexpected error in uploadCitizenDocument:", err);
    alert(`Upload Error: ${err.message || "Failed to upload"}`);
    toast.error(`Upload Error: ${err.message || "Failed to upload"}`);
    return { url: null, error: err };
  }
}
