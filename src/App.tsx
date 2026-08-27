// App main routing system configuration
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import AppLayout from "@/components/layout/AppLayout";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import CustomersPage from "@/pages/CustomersPage";
import AddCustomerPage from "@/pages/AddCustomerPage";
import DeliveryTrackerPage from "@/pages/DeliveryTrackerPage";
import WhatsAppPage from "@/pages/WhatsAppPage";
import SettingsPage from "@/pages/SettingsPage";
import FamilyMappingPage from "@/pages/FamilyMappingPage";
import NotFoundPage from "@/pages/NotFoundPage";
import Index from "@/pages/Index";
import InquiriesPage from "./pages/InquiriesPage";

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#fff",
            color: "#0f172a",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            fontSize: "13px",
            fontWeight: "500",
          },
        }}
      />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<LoginPage />} />
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/add-customer" element={<AddCustomerPage />} />
          <Route path="/delivery" element={<DeliveryTrackerPage />} />
          <Route path="/whatsapp" element={<WhatsAppPage />} />
          <Route path="/inquiries" element={<InquiriesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/family-mapping" element={<FamilyMappingPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
