import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useLic } from "./LicLayout";
import LicProspectsPage from "./LicProspectsPage";
import LicPoliciesPage from "./LicPoliciesPage";

export default function LicDashboard() {
  const [searchParams] = useSearchParams();
  const { mode, setMode } = useLic();

  const urlMode = searchParams.get("mode");

  useEffect(() => {
    if (urlMode === "active" && mode !== "active") {
      setMode("active");
    } else if (urlMode === "prospect" && mode !== "prospect") {
      setMode("prospect");
    }
  }, [urlMode, mode, setMode]);

  return (
    <div>
      {mode === "prospect" ? <LicProspectsPage /> : <LicPoliciesPage />}
    </div>
  );
}

