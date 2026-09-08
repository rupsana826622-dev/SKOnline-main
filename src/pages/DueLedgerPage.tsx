import React from "react";
import CitizenDueLedger from "@/components/citizen/CitizenDueLedger";
import SEO from "@/components/common/SEO";

export default function DueLedgerPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <SEO title="Due Payments Ledger — Digital Citizen Hub" />
      <CitizenDueLedger />
    </div>
  );
}
