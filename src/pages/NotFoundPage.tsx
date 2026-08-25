import { useNavigate } from "react-router-dom";
import { Home, AlertTriangle } from "lucide-react";
import { APP_NAME } from "@/constants";

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={28} className="text-red-500" />
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 mb-2">404</h1>
        <h2 className="text-xl font-semibold text-slate-700 mb-2">Page Not Found</h2>
        <p className="text-slate-500 mb-6 text-sm">
          The page you are looking for does not exist or has been moved.
        </p>
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 px-5 py-2.5 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md mx-auto"
        >
          <Home size={16} />
          Back to Dashboard
        </button>
        <div className="mt-6 text-xs text-slate-400">{APP_NAME} CSP Portal</div>
      </div>
    </div>
  );
}
