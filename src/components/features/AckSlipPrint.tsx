import React from "react";
import type { Customer, AppSettings } from "@/types";
import { CustomerReceipt } from "@/components/pdf/CustomerReceipt";

interface AckSlipPrintProps {
  customer: Customer;
  settings: AppSettings;
}

export default function AckSlipPrint({ customer, settings }: AckSlipPrintProps) {
  return <CustomerReceipt customer={customer} settings={settings} id="ack-slip-print" />;
}
