import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, ShieldCheck, Lock, User, AlertCircle, ArrowLeft } from "lucide-react";
import { setSession, getSession } from "@/lib/storage";
import { APP_NAME, APP_TAGLINE } from "@/constants";
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
    await new Promise(r => setTimeout(r, 600));
    
    // Case-sensitive password verification for operator account
    if (username.trim() === "skonline" && password === "Skonline@1234") {
      setSession(username.trim());
      navigate("/dashboard", { replace: true });
    } else {
      setError("Invalid credentials. Please check your username and password.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex bg-slate-50 overflow-x-hidden relative">
      <SEO
        title="Secure Operator Access"
        description="Secure operator login page for SK ONLINE Customer Service Point (CSP) banking management portal."
      />
      
      {/* Background decoration for modern light theme glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-100/40 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-slate-100 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* Left Column – Branding Hero (hidden on small screens) */}
      {/* Watermark/ghost background completely removed in favor of professional Navy-to-Blue solid corporate gradient */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden select-none z-10 bg-gradient-to-br from-[#002244] via-[#003366] to-[#0056B3]">
        {/* Soft corporate geometric/mesh accents */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.06),transparent_45%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_60%,transparent_100%)]" />

        <div className="relative z-20 flex flex-col justify-between p-12 text-white w-full">
          {/* Top Logo and Title */}
          <div className="flex items-center gap-3">
            <img src={logoImg} alt="SK ONLINE" className="w-11 h-11 rounded-xl shadow-lg border border-white/10 p-0.5 bg-white object-contain" />
            <div>
              <div className="font-extrabold text-xl tracking-tight text-white">{APP_NAME}</div>
              <div className="text-xs text-blue-300 font-semibold tracking-wider uppercase">CSP Banking Portal</div>
            </div>
          </div>
          
          {/* Main Hero Message */}
          <div className="my-auto max-w-md">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-0.5 bg-amber-400 rounded-full" />
              <span className="text-amber-400 text-xs font-bold uppercase tracking-widest">Secure · Compliant · Efficient</span>
            </div>
            <h1 className="text-4xl font-extrabold leading-tight mb-4 tracking-tight">
              Unified Financial &<br />
              <span className="text-amber-300">Digital Workspace</span>
            </h1>
            <p className="text-slate-200 text-sm leading-relaxed mb-8">
              Manage life insurance client records, dual-bank Customer Service Point (CSP) requests, tax entries, and service applications from a single secure console.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "SSL Encrypted", icon: "🔒" },
                { label: "Dual Bank CSP", icon: "🏛️" },
                { label: "PDF Generator", icon: "🖨️" },
                { label: "WhatsApp Alerts", icon: "💬" },
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-2.5 bg-white/10 rounded-xl px-4 py-3 border border-white/5 backdrop-blur-md">
                  <span className="text-lg">{f.icon}</span>
                  <span className="text-xs font-bold text-slate-100">{f.label}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Footer inside Left Hero */}
          <div className="text-xs text-slate-350">
            Powered by{" "}
            <a 
              href="https://digitalsolution.biz" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-blue-300 hover:text-blue-200 hover:underline font-semibold"
            >
              Digital Solution
            </a>
          </div>
        </div>
      </div>

      {/* Right Column – Form container */}
      <div className="w-full lg:w-[480px] flex flex-col justify-between items-center bg-white px-6 sm:px-12 py-10 z-10 relative shadow-2xl border-l border-slate-100 min-h-screen overflow-y-auto">
        {/* Top bar with Back to Landing Page link */}
        <div className="w-full flex justify-start items-center mb-6">
          <Link 
            to="/" 
            className="inline-flex items-center text-xs font-bold text-slate-500 hover:text-blue-600 gap-1.5 transition-colors group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to Home
          </Link>
        </div>

        {/* Center - Login Form Box */}
        <div className="w-full max-w-sm my-auto">
          {/* Mobile Branding (Visible only on small screens) */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <img src={logoImg} alt="SK ONLINE" className="w-10 h-10 rounded-xl shadow-md border border-slate-100 p-0.5 bg-white object-cover" />
            <div>
              <div className="font-extrabold text-lg text-slate-900 tracking-tight">{APP_NAME}</div>
              <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">{APP_TAGLINE}</div>
            </div>
          </div>

          {/* Form Header */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-100 text-blue-700 mb-3">
              <ShieldCheck size={14} className="flex-shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Operator Portal</span>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Secure Sign In</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">Access your customer management workspace</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4" autoComplete="off">
            {/* Username Input */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Username</label>
              <div className="relative group">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors pointer-events-none" />
                <input
                  type="text"
                  required
                  placeholder="Enter operator username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-3 text-sm text-slate-800 placeholder-slate-400 transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white"
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Password</label>
              </div>
              <div className="relative group">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors pointer-events-none" />
                <input
                  type={showPass ? "text" : "password"}
                  required
                  placeholder="Enter account password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-10 py-3 text-sm text-slate-800 placeholder-slate-400 transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error Message Box */}
            {error && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-600 leading-normal animate-shake">
                <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{ backgroundColor: loading ? undefined : '#1D4ED8' }}
              className="w-full disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-[15px] tracking-[0.5px] rounded-lg transition-all duration-200 flex items-center justify-center gap-2 mt-4 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 hover:bg-[#1E40AF] active:bg-[#1E3A8A]"
              onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#1E40AF'; }}
              onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#1D4ED8'; }}
              onMouseDown={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#1E3A8A'; }}
              onMouseUp={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#1E40AF'; }}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <Lock size={16} className="flex-shrink-0" />
              )}
              <span style={{ height: '44px', lineHeight: '44px', display: 'inline-flex', alignItems: 'center' }}>
                {loading ? "Authenticating..." : "SIGN IN"}
              </span>
            </button>
          </form>
        </div>

        {/* Footer bottom brand attribution */}
        <div className="w-full text-center text-xs text-slate-450 mt-8 pt-4 border-t border-slate-100">
          Powered by{" "}
          <a 
            href="https://digitalsolution.biz" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-blue-600 hover:text-blue-500 hover:underline font-semibold"
          >
            Digital Solution
          </a>
        </div>
      </div>
    </div>
  );
}
