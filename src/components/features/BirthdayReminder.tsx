import { Cake, X } from "lucide-react";
import { useState } from "react";
import type { Customer } from "@/types";
import { getDaysUntilBirthday } from "@/lib/utils";

interface BirthdayReminderProps {
  customers: Customer[];
}

export default function BirthdayReminder({ customers }: BirthdayReminderProps) {
  const [dismissed, setDismissed] = useState(false);

  const upcoming = customers
    .map(c => ({ ...c, daysLeft: getDaysUntilBirthday(c.dob) }))
    .filter(c => c.daysLeft <= 3)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  if (dismissed || upcoming.length === 0) return null;

  const getLabel = (days: number) => {
    if (days === 0) return { text: "Today! 🎂", cls: "bg-amber-500 text-white" };
    if (days === 1) return { text: "Tomorrow", cls: "bg-orange-100 text-orange-700" };
    return { text: `In ${days} days`, cls: "bg-yellow-100 text-yellow-700" };
  };

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 mb-5 animate-fade-in">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="flex-shrink-0 w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center">
            <Cake size={18} className="text-amber-600" />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-amber-800 text-sm mb-2">
              Upcoming Birthdays ({upcoming.length})
            </div>
            <div className="flex flex-wrap gap-2">
              {upcoming.map(c => {
                const lbl = getLabel(c.daysLeft);
                return (
                  <div key={c.id} className="flex items-center gap-2 bg-white rounded-lg border border-amber-100 px-3 py-1.5 shadow-sm">
                    <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-800 leading-tight">{c.name}</div>
                      <div className="text-[10px] text-slate-500">{c.mobile}</div>
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${lbl.cls}`}>
                      {lbl.text}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="flex-shrink-0 p-1 text-amber-400 hover:text-amber-600 rounded-lg hover:bg-amber-100 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
