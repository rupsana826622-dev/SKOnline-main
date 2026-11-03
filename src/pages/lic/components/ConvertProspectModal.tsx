import { useState, useEffect } from "react";
import {
  X, CheckCircle, ShieldCheck, Users, UserCheck, Plus, Trash2, Calendar, Phone, Home, Heart, Award
} from "lucide-react";
import { toast } from "sonner";
import {
  LicProspect,
  LicActivePolicy,
  LicChildDetail,
  LicNomineeDetail,
  LicReferencePerson,
  LicPremiumMode,
  convertProspectToActivePolicy,
} from "@/lib/licStorage";

interface ConvertProspectModalProps {
  prospect: LicProspect | null;
  open: boolean;
  onClose: () => void;
  onSuccess: (policy: LicActivePolicy) => void;
}

export default function ConvertProspectModal({
  prospect,
  open,
  onClose,
  onSuccess,
}: ConvertProspectModalProps) {
  const todayStr = new Date().toISOString().split("T")[0];

  // Inherited + Real Policy Form State
  const [customerName, setCustomerName] = useState("");
  const [fathersName, setFathersName] = useState("");
  const [mothersName, setMothersName] = useState("");
  const [spouseName, setSpouseName] = useState("");
  const [dob, setDob] = useState("");
  const [address, setAddress] = useState("");
  const [mobile, setMobile] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  // Policy Specific
  const [policyNumber, setPolicyNumber] = useState("");
  const [planAndTable, setPlanAndTable] = useState("");
  const [policyTerm, setPolicyTerm] = useState("");
  const [ppt, setPpt] = useState("");
  const [modeOfPremium, setModeOfPremium] = useState<LicPremiumMode>("YLY");
  const [sumAssured, setSumAssured] = useState<string>("");
  const [premiumAmount, setPremiumAmount] = useState<string>("");
  const [proposalDate, setProposalDate] = useState(todayStr);
  const [maturityDate, setMaturityDate] = useState("");
  const [nextPremiumDate, setNextPremiumDate] = useState("");

  // Children Dynamic List
  const [children, setChildren] = useState<LicChildDetail[]>([]);

  // Nominee Details
  const [nominee, setNominee] = useState<LicNomineeDetail>({
    name: "",
    fathers_name: "",
    mothers_name: "",
    dob: "",
    relation: "Spouse",
  });

  // Reference Persons Dynamic List
  const [references, setReferences] = useState<LicReferencePerson[]>([]);

  const [loading, setLoading] = useState(false);

  // Pre-fill on prospect change
  useEffect(() => {
    if (prospect) {
      setCustomerName(prospect.customer_name || "");
      setFathersName(prospect.fathers_name || "");
      setMothersName("");
      setSpouseName("");
      setDob("");
      setAddress(prospect.address || "");
      setMobile(prospect.mobile || "");
      setWhatsapp(prospect.whatsapp_number || prospect.mobile || "");
      setPolicyNumber("");
      setPlanAndTable(prospect.plan_name || "");
      setPolicyTerm(prospect.term || "");
      setPpt(prospect.policy_paying_term || "");
      setModeOfPremium("YLY");
      setSumAssured(prospect.sum_assured ? String(prospect.sum_assured) : "");
      setPremiumAmount(prospect.premium_amount ? String(prospect.premium_amount) : "");
      setProposalDate(todayStr);

      // Auto compute default next premium date: +1 year from today for YLY
      const d = new Date();
      d.setFullYear(d.getFullYear() + 1);
      setNextPremiumDate(d.toISOString().split("T")[0]);

      // Estimate maturity if term is provided
      if (prospect.term && !isNaN(Number(prospect.term))) {
        const mat = new Date();
        mat.setFullYear(mat.getFullYear() + Number(prospect.term));
        setMaturityDate(mat.toISOString().split("T")[0]);
      } else {
        setMaturityDate("");
      }

      setChildren([]);
      setNominee({
        name: "",
        fathers_name: "",
        mothers_name: "",
        dob: "",
        relation: "Spouse",
      });
      setReferences([]);
    }
  }, [prospect, todayStr]);

  if (!open || !prospect) return null;

  // Children helpers
  const handleAddChild = () => {
    setChildren([...children, { child_name: "", date_of_birth: "" }]);
  };

  const handleUpdateChild = (idx: number, field: keyof LicChildDetail, val: string) => {
    const updated = [...children];
    updated[idx] = { ...updated[idx], [field]: val };
    setChildren(updated);
  };

  const handleRemoveChild = (idx: number) => {
    setChildren(children.filter((_, i) => i !== idx));
  };

  // References helpers
  const handleAddReference = () => {
    setReferences([...references, { name: "", mobile: "", address: "" }]);
  };

  const handleUpdateReference = (idx: number, field: keyof LicReferencePerson, val: string) => {
    const updated = [...references];
    updated[idx] = { ...updated[idx], [field]: val };
    setReferences(updated);
  };

  const handleRemoveReference = (idx: number) => {
    setReferences(references.filter((_, i) => i !== idx));
  };

  // Handle Mode Change auto-update of default next premium date
  const handleModeChange = (newMode: LicPremiumMode) => {
    setModeOfPremium(newMode);
    const start = proposalDate ? new Date(proposalDate) : new Date();
    if (newMode === "MONTHLY") start.setMonth(start.getMonth() + 1);
    else if (newMode === "QLY") start.setMonth(start.getMonth() + 3);
    else if (newMode === "HLY") start.setMonth(start.getMonth() + 6);
    else start.setFullYear(start.getFullYear() + 1);
    setNextPremiumDate(start.toISOString().split("T")[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      toast.error("Customer Name is required.");
      return;
    }
    if (!mobile.trim()) {
      toast.error("Mobile Number is required.");
      return;
    }
    if (!policyNumber.trim()) {
      toast.error("Policy Number is required.");
      return;
    }
    if (!nextPremiumDate.trim()) {
      toast.error("Next Premium Due Date is required.");
      return;
    }

    setLoading(true);
    try {
      const policyPayload = {
        customer_name: customerName.trim(),
        fathers_name: fathersName.trim() || null,
        mothers_name: mothersName.trim() || null,
        spouse_name: spouseName.trim() || null,
        date_of_birth: dob || null,
        children_details: children.length > 0 ? children.filter(c => c.child_name.trim()) : null,
        address: address.trim() || null,
        mobile: mobile.trim(),
        whatsapp_number: whatsapp.trim() || null,
        plan_and_table_no: planAndTable.trim() || null,
        policy_number: policyNumber.trim(),
        policy_term: policyTerm.trim() || null,
        premium_paying_term: ppt.trim() || null,
        mode_of_premium: modeOfPremium,
        sum_assured: sumAssured ? Number(sumAssured) : null,
        premium_amount: premiumAmount ? Number(premiumAmount) : null,
        proposal_date: proposalDate || null,
        maturity_date: maturityDate || null,
        next_premium_date: nextPremiumDate,
        nominee_details: nominee.name.trim() ? nominee : null,
        reference_persons: references.length > 0 ? references.filter(r => r.name.trim()) : null,
        premium_status: "active",
      };

      const res = await convertProspectToActivePolicy(prospect.id, policyPayload);

      if (res.error || !res.policy) {
        toast.error(res.error?.message || "Failed to convert prospect to active policy.");
      } else {
        toast.success("Customer converted and transferred to Active Policy Manager successfully!");
        onSuccess(res.policy);
        onClose();
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-4 max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
              <UserCheck size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">Convert Prospect to Active LIC Policy</h2>
                <span className="text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Seamless Transition
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Converting prospect: <strong className="text-white">{prospect.customer_name}</strong> (Mobile: {prospect.mobile})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-200 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6 text-slate-800">
          {/* Inherited Info Notice */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 flex items-center justify-between text-xs text-emerald-800">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-600 flex-shrink-0" />
              <span>
                <strong>Auto-filled:</strong> Basic details, contact, and proposed sum/premium have been inherited from the lead.
              </span>
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 bg-white px-2 py-1 rounded-md shadow-sm border border-emerald-200">
              Lead #{prospect.serial_no || prospect.id.slice(0, 6)}
            </span>
          </div>

          {/* Section 1: Policy Identification */}
          <div className="bg-slate-50/80 p-5 rounded-xl border border-slate-200 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Award size={15} className="text-blue-600" />
              1. Policy & Coverage Specifications
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Policy Number <span className="text-red-500">* (Unique)</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 518920441"
                  value={policyNumber}
                  onChange={e => setPolicyNumber(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono font-bold bg-white border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Plan & Table No <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jeevan Labh - 936"
                  value={planAndTable}
                  onChange={e => setPlanAndTable(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Premium Payment Mode <span className="text-red-500">*</span>
                </label>
                <select
                  value={modeOfPremium}
                  onChange={e => handleModeChange(e.target.value as LicPremiumMode)}
                  className="w-full px-3 py-2 text-sm font-semibold bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="YLY">Yearly (YLY)</option>
                  <option value="HLY">Half-Yearly (HLY)</option>
                  <option value="QLY">Quarterly (QLY)</option>
                  <option value="MONTHLY">Monthly (NACH / Direct)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Policy Term (Yrs)</label>
                <input
                  type="text"
                  placeholder="e.g. 21"
                  value={policyTerm}
                  onChange={e => setPolicyTerm(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Paying Term (PPT)</label>
                <input
                  type="text"
                  placeholder="e.g. 15"
                  value={ppt}
                  onChange={e => setPpt(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Sum Assured (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 500000"
                  value={sumAssured}
                  onChange={e => setSumAssured(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-semibold bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Premium Amount (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 24850"
                  value={premiumAmount}
                  onChange={e => setPremiumAmount(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-semibold bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Proposal Date / Inception</label>
                <input
                  type="date"
                  value={proposalDate}
                  onChange={e => setProposalDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Maturity Date</label>
                <input
                  type="date"
                  value={maturityDate}
                  onChange={e => setMaturityDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-800 mb-1">
                  Next Premium Due Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={nextPremiumDate}
                  onChange={e => setNextPremiumDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-bold text-emerald-900 bg-emerald-50 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Policyholder & Family Details */}
          <div className="bg-slate-50/80 p-5 rounded-xl border border-slate-200 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Users size={15} className="text-indigo-600" />
              2. Policyholder & Family Demographics
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Customer Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Father's Name</label>
                <input
                  type="text"
                  value={fathersName}
                  onChange={e => setFathersName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mother's Name</label>
                <input
                  type="text"
                  placeholder="Mother's name"
                  value={mothersName}
                  onChange={e => setMothersName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Spouse Name</label>
                <input
                  type="text"
                  placeholder="Spouse full name"
                  value={spouseName}
                  onChange={e => setSpouseName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={dob}
                  onChange={e => setDob(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Primary Mobile Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={mobile}
                  onChange={e => setMobile(e.target.value.replace(/\D/g, ""))}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">WhatsApp Number</label>
                <input
                  type="tel"
                  maxLength={10}
                  value={whatsapp}
                  onChange={e => setWhatsapp(e.target.value.replace(/\D/g, ""))}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            {/* Dynamic Children List */}
            <div className="pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-700">Children Details</span>
                <button
                  type="button"
                  onClick={handleAddChild}
                  className="text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md transition-colors"
                >
                  <Plus size={13} />
                  Add Child
                </button>
              </div>

              {children.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No children recorded yet. Click "Add Child" to add.</p>
              ) : (
                <div className="space-y-2">
                  {children.map((child, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-white p-2.5 rounded-lg border border-slate-200">
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="Child Name"
                          value={child.child_name}
                          onChange={e => handleUpdateChild(idx, "child_name", e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:bg-white outline-none"
                        />
                      </div>
                      <div className="w-48">
                        <input
                          type="date"
                          value={child.date_of_birth}
                          onChange={e => handleUpdateChild(idx, "date_of_birth", e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:bg-white outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveChild(idx)}
                        className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Nominee Details */}
          <div className="bg-slate-50/80 p-5 rounded-xl border border-slate-200 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Heart size={15} className="text-rose-600" />
              3. Nominee Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nominee Name</label>
                <input
                  type="text"
                  placeholder="Nominee full name"
                  value={nominee.name}
                  onChange={e => setNominee({ ...nominee, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Relationship</label>
                <select
                  value={nominee.relation || "Spouse"}
                  onChange={e => setNominee({ ...nominee, relation: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="Spouse">Spouse</option>
                  <option value="Father">Father</option>
                  <option value="Mother">Mother</option>
                  <option value="Son">Son</option>
                  <option value="Daughter">Daughter</option>
                  <option value="Brother">Brother</option>
                  <option value="Sister">Sister</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nominee DOB</label>
                <input
                  type="date"
                  value={nominee.dob || ""}
                  onChange={e => setNominee({ ...nominee, dob: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nominee Father's Name</label>
                <input
                  type="text"
                  placeholder="Nominee's father name"
                  value={nominee.fathers_name || ""}
                  onChange={e => setNominee({ ...nominee, fathers_name: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nominee Mother's Name</label>
                <input
                  type="text"
                  placeholder="Nominee's mother name"
                  value={nominee.mothers_name || ""}
                  onChange={e => setNominee({ ...nominee, mothers_name: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Reference Persons */}
          <div className="bg-slate-50/80 p-5 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Home size={15} className="text-amber-600" />
                4. Reference Persons
              </h3>
              <button
                type="button"
                onClick={handleAddReference}
                className="text-xs font-bold text-amber-800 hover:text-amber-900 flex items-center gap-1 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-md transition-colors"
              >
                <Plus size={13} />
                Add Reference
              </button>
            </div>

            {references.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No reference persons recorded. Click "Add Reference" if required.</p>
            ) : (
              <div className="space-y-2">
                {references.map((ref, idx) => (
                  <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-white p-2.5 rounded-lg border border-slate-200 items-center">
                    <div className="sm:col-span-4">
                      <input
                        type="text"
                        placeholder="Person Name"
                        value={ref.name}
                        onChange={e => handleUpdateReference(idx, "name", e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded outline-none"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <input
                        type="tel"
                        placeholder="Mobile"
                        value={ref.mobile}
                        onChange={e => handleUpdateReference(idx, "mobile", e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded outline-none"
                      />
                    </div>
                    <div className="sm:col-span-4">
                      <input
                        type="text"
                        placeholder="Address"
                        value={ref.address}
                        onChange={e => handleUpdateReference(idx, "address", e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded outline-none"
                      />
                    </div>
                    <div className="sm:col-span-1 flex justify-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveReference(idx)}
                        className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Action */}
          <div className="sticky bottom-0 bg-white/95 backdrop-blur-md pt-3 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 rounded-xl shadow-lg shadow-emerald-700/25 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>Converting & Creating Policy...</>
              ) : (
                <>
                  <CheckCircle size={18} />
                  Complete Conversion & Transfer to Active Policies
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

