import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, ShieldCheck, Lock, User, AlertCircle } from "lucide-react";
import { setSession, getSession } from "@/lib/storage";
import { MOCK_CREDENTIALS, APP_NAME, APP_TAGLINE, POWERED_BY } from "@/constants";
import loginBg from "@/assets/login-bg.jpg";
import logoImg from "@/assets/sk-logo.png";
import SEO from "@/components/common/SEO";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (getSession()) navigate("/dashboard", { replace: true });
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    if (username === MOCK_CREDENTIALS.username && password === MOCK_CREDENTIALS.password) {
      setSession(username);
      navigate("/dashboard", { replace: true });
    } else {
      setError("Invalid credentials. Please check your username and password.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      <SEO
        title="Login"
        description="Secure operator login page for SK ONLINE Customer Service Point (CSP) banking management portal."
        schema={{
          "@context": "https://schema.org",
          "@type": "LoginPage",
          "name": "SK ONLINE Secure Portal Login",
          "description": "Secure operator login page for SK ONLINE Customer Service Point (CSP) banking management portal."
        }}
      />
      {/* Left – Hero */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <img src={loginBg} alt="SK ONLINE" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-blue-900/60" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          <div className="flex items-center gap-3">
            <img src={logoImg} alt="SK ONLINE" className="w-10 h-10 rounded-xl" />
            <div>
              <div className="font-extrabold text-xl tracking-tight">{APP_NAME}</div>
              <div className="text-xs text-blue-300 font-medium">CSP Banking Portal</div>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-0.5 bg-blue-400 rounded-full" />
              <span className="text-blue-300 text-xs font-semibold uppercase tracking-widest">Secure · Reliable · Fast</span>
            </div>
            <h1 className="text-4xl font-extrabold leading-tight mb-4 max-w-sm">
              Your CSP Banking<br />
              <span className="text-blue-400">Command Center</span>
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed max-w-sm">
              Manage customer registrations, track delivery logistics, send WhatsApp communications, and print bank-ready forms — all from one secure portal.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-4 max-w-sm">
              {[
                { label: "Secure Auth", icon: "🔐" },
                { label: "RLS Protected", icon: "🛡️" },
                { label: "Dual Print Engine", icon: "🖨️" },
                { label: "WhatsApp Engine", icon: "💬" },
              ].map(f => (
                <div key={f.label} className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2 backdrop-blur">
                  <span className="text-base">{f.icon}</span>
                  <span className="text-xs font-semibold text-slate-200">{f.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="text-xs text-slate-500">{POWERED_BY}</div>
        </div>
      </div>

      {/* Right – Login Form */}
      <div className="w-full lg:w-[420px] flex flex-col items-center justify-center bg-white px-8 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile Logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <img src={logoImg} alt="SK ONLINE" className="w-10 h-10 rounded-xl" />
            <div>
              <div className="font-extrabold text-xl text-slate-900">{APP_NAME}</div>
              <div className="text-xs text-slate-500">{APP_TAGLINE}</div>
            </div>
          </div>

          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <ShieldCheck size={16} className="text-white" />
              </div>
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-widest">Secure Login</span>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 mt-1">Welcome back</h2>
            <p className="text-sm text-slate-500 mt-1">Sign in to your CSP operator account</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4" autoComplete="off">
            {/* Username */}
            <div>
              <label className="form-label">Username</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  className="form-input pl-9"
                  placeholder="Enter username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="form-label">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type={showPass ? "text" : "password"}
                  className="form-input pl-9 pr-10"
                  placeholder="Enter password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  onClick={() => setShowPass(!showPass)}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-sm text-red-600">
                <AlertCircle size={15} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-all duration-150 flex items-center justify-center gap-2 mt-2 shadow-md hover:shadow-blue-500/25"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <ShieldCheck size={16} />
              )}
              {loading ? "Authenticating..." : "Sign In"}
            </button>
          </form>

          {/* Demo hint */}
          <div className="mt-6 p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="text-xs text-slate-500 font-medium mb-1">Demo Credentials</div>
            <div className="text-xs text-slate-600 font-mono">
              Username: <strong>admin</strong> &nbsp;|&nbsp; Password: <strong>sk@2026</strong>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-400">{POWERED_BY}</div>
        </div>
      </div>
    </div>
  );
}
