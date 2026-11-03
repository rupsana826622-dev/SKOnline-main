import { supabase } from "./supabase";
import { getSession, setSession } from "./storage";

// ─── TYPES ────────────────────────────────────────────────

export interface LicProspect {
  id: string;
  serial_no?: number;
  customer_name: string;
  fathers_name?: string | null;
  address?: string | null;
  mobile: string;
  whatsapp_number?: string | null;
  plan_name?: string | null;
  term?: string | null;
  policy_paying_term?: string | null;
  sum_assured?: number | null;
  premium_amount?: number | null;
  conversation_date?: string | null;
  feedback?: "yes" | "no" | "others" | null;
  appointment_date_time?: string | null;
  notes?: string | null;
  status?: "active" | "converted" | null;
  created_at?: string;
  updated_at?: string;
}

export interface LicChildDetail {
  child_name: string;
  date_of_birth: string;
}

export interface LicNomineeDetail {
  name: string;
  fathers_name?: string;
  mothers_name?: string;
  dob?: string;
  relation?: string;
}

export interface LicReferencePerson {
  name: string;
  mobile: string;
  address: string;
}

export type LicPremiumMode = "YLY" | "HLY" | "QLY" | "MONTHLY";

export interface LicActivePolicy {
  id: string;
  serial_no?: number;
  prospect_id?: string | null;
  customer_name: string;
  fathers_name?: string | null;
  mothers_name?: string | null;
  spouse_name?: string | null;
  date_of_birth?: string | null;
  children_details?: LicChildDetail[] | null;
  address?: string | null;
  mobile: string;
  whatsapp_number?: string | null;
  plan_and_table_no?: string | null;
  policy_number: string;
  policy_term?: string | null;
  premium_paying_term?: string | null;
  mode_of_premium: LicPremiumMode;
  sum_assured?: number | null;
  premium_amount?: number | null;
  proposal_date?: string | null;
  maturity_date?: string | null;
  next_premium_date: string;
  nominee_details?: LicNomineeDetail | null;
  reference_persons?: LicReferencePerson[] | null;
  premium_status?: string | null;
  created_at?: string;
  updated_at?: string;
}

// ─── LOCAL STORAGE CACHING KEYS ───────────────────────────
const LIC_PROSPECTS_CACHE = "sk_lic_prospects_cache";
const LIC_POLICIES_CACHE = "sk_lic_policies_cache";

function getCachedProspects(): LicProspect[] {
  try {
    const raw = localStorage.getItem(LIC_PROSPECTS_CACHE);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setCachedProspects(data: LicProspect[]) {
  try {
    localStorage.setItem(LIC_PROSPECTS_CACHE, JSON.stringify(data));
  } catch (e) {
    console.error("Cache save error:", e);
  }
}

function getCachedPolicies(): LicActivePolicy[] {
  try {
    const raw = localStorage.getItem(LIC_POLICIES_CACHE);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setCachedPolicies(data: LicActivePolicy[]) {
  try {
    localStorage.setItem(LIC_POLICIES_CACHE, JSON.stringify(data));
  } catch (e) {
    console.error("Cache save error:", e);
  }
}

// ─── DUAL-MODE SWITCHER HELPERS ───────────────────────────

export function getLicMode(): "prospect" | "active" {
  const sess = getSession();
  if (sess?.current_mode === "active") return "active";
  return "prospect";
}

export function setLicMode(mode: "prospect" | "active") {
  const sess = getSession();
  if (sess) {
    setSession({
      ...sess,
      current_mode: mode,
    });
  }
}

// ─── DATE CALCULATION ENGINE ──────────────────────────────

export function advanceDueDate(currentDueDateStr: string, mode: LicPremiumMode): string {
  let d = new Date(currentDueDateStr);
  if (isNaN(d.getTime())) {
    d = new Date();
  }

  // Preserve day of month safely
  const originalDay = d.getDate();

  if (mode === "MONTHLY") {
    d.setMonth(d.getMonth() + 1);
  } else if (mode === "QLY") {
    d.setMonth(d.getMonth() + 3);
  } else if (mode === "HLY") {
    d.setMonth(d.getMonth() + 6);
  } else {
    // YLY
    d.setFullYear(d.getFullYear() + 1);
  }

  // Check month overflow (e.g. Feb 30 -> Mar 2)
  if (d.getDate() !== originalDay) {
    d.setDate(0); // Set to last day of previous month
  }

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// ─── PROSPECTS CRUD ───────────────────────────────────────

export async function fetchLicProspects(statusFilter: "active" | "converted" | "all" = "active"): Promise<LicProspect[]> {
  try {
    let query = supabase.from("lic_prospects").select("*");
    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }
    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.warn("Supabase fetch prospects fallback to cache:", error.message);
      const cached = getCachedProspects();
      if (statusFilter === "all") return cached;
      return cached.filter(p => (statusFilter === "active" ? (p.status || "active") === "active" : p.status === "converted"));
    }

    if (data) {
      // Merge with cache
      if (statusFilter === "all") {
        setCachedProspects(data as LicProspect[]);
      }
      return data as LicProspect[];
    }
    return getCachedProspects();
  } catch (err) {
    console.error("fetchLicProspects exception:", err);
    return getCachedProspects();
  }
}

export async function addLicProspect(
  prospect: Omit<LicProspect, "id" | "serial_no" | "created_at" | "updated_at">
): Promise<{ data: LicProspect | null; error: any }> {
  try {
    const payload = {
      ...prospect,
      status: prospect.status || "active",
      feedback: prospect.feedback || "others",
      conversation_date: prospect.conversation_date || new Date().toISOString().split("T")[0],
    };

    const { data, error } = await supabase
      .from("lic_prospects")
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error("Error inserting prospect:", error);
      // Local fallback
      const localItem: LicProspect = {
        ...payload,
        id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const existing = getCachedProspects();
      setCachedProspects([localItem, ...existing]);
      return { data: localItem, error: null };
    }

    // Update cache
    const existing = getCachedProspects();
    setCachedProspects([data as LicProspect, ...existing.filter(p => p.id !== data.id)]);

    return { data: data as LicProspect, error: null };
  } catch (err: any) {
    console.error("addLicProspect exception:", err);
    return { data: null, error: err };
  }
}

export async function updateLicProspect(
  id: string,
  updates: Partial<LicProspect>
): Promise<{ data: LicProspect | null; error: any }> {
  try {
    const payload = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("lic_prospects")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating prospect:", error);
      return { data: null, error };
    }

    const existing = getCachedProspects();
    setCachedProspects(existing.map(p => (p.id === id ? { ...p, ...data } : p)));

    return { data: data as LicProspect, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

export async function deleteLicProspect(id: string): Promise<{ error: any }> {
  try {
    const { error } = await supabase.from("lic_prospects").delete().eq("id", id);
    if (error) {
      console.error("Error deleting prospect:", error);
      return { error };
    }
    const existing = getCachedProspects();
    setCachedProspects(existing.filter(p => p.id !== id));
    return { error: null };
  } catch (err: any) {
    return { error: err };
  }
}

// ─── ACTIVE POLICIES CRUD ─────────────────────────────────

export async function fetchLicActivePolicies(): Promise<LicActivePolicy[]> {
  try {
    const { data, error } = await supabase
      .from("lic_active_policies")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("Supabase fetch policies fallback to cache:", error.message);
      return getCachedPolicies();
    }

    if (data) {
      setCachedPolicies(data as LicActivePolicy[]);
      return data as LicActivePolicy[];
    }
    return getCachedPolicies();
  } catch (err) {
    console.error("fetchLicActivePolicies exception:", err);
    return getCachedPolicies();
  }
}

export async function addLicActivePolicy(
  policy: Omit<LicActivePolicy, "id" | "serial_no" | "created_at" | "updated_at">
): Promise<{ data: LicActivePolicy | null; error: any }> {
  try {
    const payload = {
      ...policy,
      premium_status: policy.premium_status || "active",
    };

    const { data, error } = await supabase
      .from("lic_active_policies")
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error("Error inserting active policy:", error);
      // Local fallback
      const localItem: LicActivePolicy = {
        ...payload,
        id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const existing = getCachedPolicies();
      setCachedPolicies([localItem, ...existing]);
      return { data: localItem, error: null };
    }

    const existing = getCachedPolicies();
    setCachedPolicies([data as LicActivePolicy, ...existing.filter(p => p.id !== data.id)]);

    return { data: data as LicActivePolicy, error: null };
  } catch (err: any) {
    console.error("addLicActivePolicy exception:", err);
    return { data: null, error: err };
  }
}

export async function updateLicActivePolicy(
  id: string,
  updates: Partial<LicActivePolicy>
): Promise<{ data: LicActivePolicy | null; error: any }> {
  try {
    const payload = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("lic_active_policies")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating active policy:", error);
      return { data: null, error };
    }

    const existing = getCachedPolicies();
    setCachedPolicies(existing.map(p => (p.id === id ? { ...p, ...data } : p)));

    return { data: data as LicActivePolicy, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

export async function deleteLicActivePolicy(id: string): Promise<{ error: any }> {
  try {
    const { error } = await supabase.from("lic_active_policies").delete().eq("id", id);
    if (error) {
      console.error("Error deleting active policy:", error);
      return { error };
    }
    const existing = getCachedPolicies();
    setCachedPolicies(existing.filter(p => p.id !== id));
    return { error: null };
  } catch (err: any) {
    return { error: err };
  }
}

// ─── CONVERSION WORKFLOW ──────────────────────────────────
// Inserts policy into lic_active_policies and updates prospect to status='converted'

export async function convertProspectToActivePolicy(
  prospectId: string,
  policyData: Omit<LicActivePolicy, "id" | "serial_no" | "created_at" | "updated_at" | "prospect_id">
): Promise<{ policy: LicActivePolicy | null; error: any }> {
  try {
    // 1. Insert into lic_active_policies
    const insertRes = await addLicActivePolicy({
      ...policyData,
      prospect_id: prospectId,
    });

    if (insertRes.error || !insertRes.data) {
      return { policy: null, error: insertRes.error || new Error("Failed to create active policy") };
    }

    // 2. Mark prospect as converted
    await updateLicProspect(prospectId, { status: "converted" });

    return { policy: insertRes.data, error: null };
  } catch (err: any) {
    console.error("convertProspectToActivePolicy exception:", err);
    return { policy: null, error: err };
  }
}

// ─── PREMIUM LEDGER RECORDING ─────────────────────────────

export async function recordPremiumPayment(
  policyId: string,
  _paymentAmount: number,
  _paymentDate: string,
  currentNextDueDate: string,
  mode: LicPremiumMode
): Promise<{ newDueDate: string; error: any }> {
  try {
    const newDueDate = advanceDueDate(currentNextDueDate, mode);
    const { error } = await supabase
      .from("lic_active_policies")
      .update({
        next_premium_date: newDueDate,
        premium_status: "paid",
        updated_at: new Date().toISOString(),
      })
      .eq("id", policyId);

    if (error) {
      console.error("Failed to update premium payment:", error);
      return { newDueDate, error };
    }

    // Update local cache
    const existing = getCachedPolicies();
    setCachedPolicies(
      existing.map(p =>
        p.id === policyId ? { ...p, next_premium_date: newDueDate, premium_status: "paid" } : p
      )
    );

    return { newDueDate, error: null };
  } catch (err: any) {
    return { newDueDate: currentNextDueDate, error: err };
  }
}

