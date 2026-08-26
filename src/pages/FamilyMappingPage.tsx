// Force IDE type cache refresh
import { useState, useEffect, useMemo } from "react";
import { Map as MapIcon, Users, Home, Search, ChevronDown, ChevronRight } from "lucide-react";
import { getCustomers } from "@/lib/storage";
import type { Customer } from "@/types";

interface FamilyGroup {
  key: string;
  label: string;
  customers: Customer[];
  type: "familyId" | "address";
}

export default function FamilyMappingPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const [groupBy, setGroupBy] = useState<"address" | "familyId">("familyId");

  useEffect(() => { setCustomers(getCustomers()); }, []);

  const groups = useMemo<FamilyGroup[]>(() => {
    const grouped = new Map<string, Customer[]>();

    customers.forEach(c => {
      if (groupBy === "familyId") {
        if (!c.familyId) return;
        const key = c.familyId;
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key)!.push(c);
      } else {
        // Group by address (village + mandal)
        const village = (c.village || "").toLowerCase().trim();
        const mandal = (c.mandal || "").toLowerCase().trim();
        const key = `${village}|${mandal}`;
        if (!key || key === "|") return;
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key)!.push(c);
      }
    });

    return Array.from(grouped.entries())
      .filter(([, members]) => members.length > 1 || groupBy === "familyId")
      .map(([key, members]) => ({
        key,
        label: groupBy === "familyId"
          ? key
          : `${members[0]?.village || "No Village"} · ${members[0]?.mandal || "No Mandal"}`,
        customers: members,
        type: groupBy,
      }))
      .sort((a, b) => b.customers.length - a.customers.length);
  }, [customers, groupBy]);

  const filtered = useMemo(() => {
    if (!search) return groups;
    const lower = search.toLowerCase();
    return groups.filter(g =>
      g.label.toLowerCase().includes(lower) ||
      g.customers.some(c => c.name && c.name.toLowerCase().includes(lower))
    );
  }, [groups, search]);

  const toggleExpand = (key: string) => {
    setExpandedKeys(prev => {
      const n = new Set(prev);
      if (n.has(key)) {
        n.delete(key);
      } else {
        n.add(key);
      }
      return n;
    });
  };

  const lonelyCustomers = customers.filter(c => {
    if (groupBy === "familyId") return !c.familyId;
    const village = (c.village || "").toLowerCase().trim();
    const mandal = (c.mandal || "").toLowerCase().trim();
    const key = `${village}|${mandal}`;
    return !key || key === "|";
  });

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <MapIcon size={20} className="text-violet-600" />
          Family Household Mapping
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">Group customers by family ID or shared address</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="sk-card p-4">
          <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center mb-2">
            <Home size={16} className="text-violet-600" />
          </div>
          <div className="text-2xl font-extrabold text-violet-600">{groups.length}</div>
          <div className="text-xs text-slate-500 font-medium mt-0.5">Household Groups</div>
        </div>
        <div className="sk-card p-4">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center mb-2">
            <Users size={16} className="text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-blue-600">
            {groups.reduce((sum, g) => sum + g.customers.length, 0)}
          </div>
          <div className="text-xs text-slate-500 font-medium mt-0.5">Grouped Customers</div>
        </div>
        <div className="sk-card p-4">
          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center mb-2">
            <Users size={16} className="text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-amber-600">{lonelyCustomers.length}</div>
          <div className="text-xs text-slate-500 font-medium mt-0.5">Ungrouped</div>
        </div>
      </div>

      {/* Controls */}
      <div className="sk-card p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search family ID or village..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
          />
        </div>
        <div className="flex gap-2">
          {(["familyId", "address"] as const).map(g => (
            <button
              key={g}
              onClick={() => setGroupBy(g)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                groupBy === g ? "bg-violet-600 text-white border-violet-600" : "bg-white text-slate-600 border-slate-200 hover:border-violet-300"
              }`}
            >
              By {g === "familyId" ? "Family ID" : "Address/Village"}
            </button>
          ))}
        </div>
      </div>

      {/* Groups */}
      <div className="space-y-3">
        {filtered.map(group => {
          const expanded = expandedKeys.has(group.key);
          return (
            <div key={group.key} className="sk-card overflow-hidden">
              <button
                onClick={() => toggleExpand(group.key)}
                className="w-full flex items-center gap-3 px-5 py-4 hover:bg-slate-50 transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                  <Home size={16} className="text-violet-600" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="font-semibold text-slate-800 truncate">{group.label}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {group.customers.length} member{group.customers.length !== 1 ? "s" : ""} · {group.type === "familyId" ? "Family ID Group" : "Address Group"}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="flex -space-x-1.5">
                    {group.customers.slice(0, 4).map(c => (
                      <div
                        key={c.id}
                        className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-400 to-slate-600 text-white flex items-center justify-center text-[10px] font-bold border-2 border-white"
                        title={c.name}
                      >
                        {c.name.charAt(0)}
                      </div>
                    ))}
                    {group.customers.length > 4 && (
                      <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold border-2 border-white">
                        +{group.customers.length - 4}
                      </div>
                    )}
                  </div>
                  {expanded ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
                </div>
              </button>

              {expanded && (
                <div className="border-t border-slate-100">
                  <table className="w-full data-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Account No.</th>
                        <th>Mobile</th>
                        <th>Sex</th>
                        <th>DOB</th>
                        <th>Relationship</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.customers.map(c => (
                        <tr key={c.id}>
                          <td>
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                                {c.name.charAt(0)}
                              </div>
                              <span className="font-medium text-slate-800 text-sm">{c.name}</span>
                            </div>
                          </td>
                          <td><span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">{c.accountNumber}</span></td>
                          <td className="text-slate-600">{c.mobile}</td>
                          <td><span className="badge badge-slate">{c.sex}</span></td>
                          <td className="text-xs text-slate-500">{c.dob}</td>
                          <td className="text-xs text-slate-500">{c.nomineeRelationship || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="sk-card p-10 text-center">
            <MapIcon size={32} className="mx-auto text-slate-300 mb-3" />
            <div className="text-slate-500 font-medium">No family groups found</div>
            <div className="text-sm text-slate-400 mt-1">
              {groupBy === "familyId"
                ? "Assign Family IDs to customers to group them here."
                : "Customers sharing the same village/mandal will appear here."}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
