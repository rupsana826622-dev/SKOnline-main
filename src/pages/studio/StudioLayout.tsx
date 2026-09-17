import { useEffect, useState, createContext, useContext } from "react";
import { Outlet, useNavigate, NavLink } from "react-router-dom";
import {
  LayoutDashboard, Table2, LogOut, ChevronLeft, ChevronRight,
  Camera, Search, Upload, X, Menu,
} from "lucide-react";
import { getSession, clearSession } from "@/lib/storage";
import { cn } from "@/lib/utils";

// ─── STUDIO LAYOUT ────────────────────────────────────────
// Fully self-contained layout for the File / Studio Archive tenant.
// Completely isolated from BOI, BOB, and Citizen Hub layouts.

// Context to pass search/upload actions down to child pages

export interface StudioLayoutContextValue {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  uploadModalOpen: boolean;
  setUploadModalOpen: (open: boolean) => void;
}

export const StudioLayoutContext = createContext<StudioLayoutContextValue>({
  searchQuery: "",
  setSearchQuery: () => {},
  uploadModalOpen: false,
  setUploadModalOpen: () => {},
});

export function useStudioLayout() {
  return useContext(StudioLayoutContext);
}

const studioNavItems = [
  { label: "Photo Gallery & Dashboard", path: "/studio/dashboard", icon: LayoutDashboard },
  { label: "Master Records Table", path: "/studio/records", icon: Table2 },
];

export default function StudioLayout() {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  // Auth guard — only file_workspace can access /studio/*
  useEffect(() => {
    const session = getSession();
    if (!session) {
      navigate("/login", { replace: true });
      return;
    }
    if (session.tenantCode !== "file_workspace") {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  const handleLogout = () => {
    clearSession();
    navigate("/login", { replace: true });
  };

  return (
    <StudioLayoutContext.Provider
      value={{ searchQuery, setSearchQuery, uploadModalOpen, setUploadModalOpen }}
    >
      <div className="min-h-screen bg-slate-50 flex">
        {/* ── Sidebar ── */}
        <aside
          className={cn(
            "fixed left-0 top-0 h-full z-40 flex flex-col transition-all duration-300 ease-in-out",
            "text-slate-100 border-r border-indigo-950",
            collapsed ? "w-16" : "w-64"
          )}
          style={{ background: "linear-gradient(180deg, #1e1b4b 0%, #2d2770 50%, #1e1b4b 100%)" }}
        >
          {/* Logo area */}
          <div
            className={cn(
              "flex items-center border-b border-indigo-800/60 flex-shrink-0",
              collapsed ? "justify-center px-2 py-4" : "px-4 py-4 gap-3"
            )}
          >
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg">
              <Camera size={18} className="text-white" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <div className="font-extrabold text-sm text-white tracking-tight leading-none">
                  SK ARCHIVE
                </div>
                <div className="text-[10px] text-violet-300 font-semibold mt-0.5">
                  Photo & Document Studio
                </div>
              </div>
            )}
          </div>

          {/* Nav Items */}
          <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
            {studioNavItems.map(({ label, path, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 group relative",
                    isActive
                      ? "bg-indigo-600 text-white shadow-md"
                      : "text-indigo-200 hover:bg-indigo-800/60 hover:text-white",
                    collapsed && "justify-center px-2"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={18}
                      className={cn(
                        "flex-shrink-0",
                        isActive ? "text-white" : "text-indigo-400 group-hover:text-white"
                      )}
                    />
                    {!collapsed && <span className="truncate">{label}</span>}
                    {collapsed && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-indigo-900 text-white text-xs rounded whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                        {label}
                      </div>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Bottom actions */}
          <div className="border-t border-indigo-800/60 p-2 space-y-0.5 flex-shrink-0">
            <button
              onClick={handleLogout}
              className={cn(
                "flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm font-medium text-indigo-200 hover:bg-red-900/30 hover:text-red-400 transition-all duration-150",
                collapsed && "justify-center px-2"
              )}
            >
              <LogOut size={18} className="flex-shrink-0" />
              {!collapsed && <span>Logout</span>}
            </button>

            <button
              onClick={() => setCollapsed(!collapsed)}
              className={cn(
                "flex items-center gap-3 w-full rounded-lg px-3 py-2 text-xs font-medium text-indigo-500 hover:bg-indigo-800/40 hover:text-indigo-300 transition-all duration-150",
                collapsed && "justify-center px-2"
              )}
            >
              {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span>Collapse</span></>}
            </button>

            {!collapsed && (
              <div className="px-3 py-2 text-[10px] text-indigo-600 text-center">
                Powered by{" "}
                <a
                  href="https://digitalsolution.biz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-400 hover:text-indigo-200 hover:underline font-medium"
                >
                  Digital Solution
                </a>
              </div>
            )}
          </div>
        </aside>

        {/* ── Main content area ── */}
        <div
          className={cn(
            "flex-1 flex flex-col min-w-0 transition-all duration-300",
            collapsed ? "ml-16" : "ml-64"
          )}
        >
          {/* ── Top Navbar ── */}
          <header
            className="sticky top-0 z-30 border-b h-14 flex items-center px-4 gap-3"
            style={{
              background: "linear-gradient(90deg, #1e1b4b 0%, #312e81 40%, #4338ca 100%)",
              borderColor: "#3730a3",
            }}
          >
            {/* Mobile hamburger */}
            <button
              className="text-indigo-300 hover:text-white transition-colors md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu size={20} />
            </button>

            {/* Brand */}
            <div className="flex items-center gap-2 mr-3">
              <Camera size={18} className="text-violet-300 flex-shrink-0" />
              <span className="font-extrabold text-white text-sm tracking-tight hidden sm:block whitespace-nowrap">
                SK Digital Photo & Document Archive
              </span>
              <span className="font-extrabold text-white text-sm tracking-tight sm:hidden">
                SK Archive
              </span>
            </div>

            {/* Search Bar */}
            <div className="flex-1 relative max-w-md">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-300 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by Name, Mobile, Village / Address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-indigo-500/50 bg-indigo-900/50 text-white placeholder-indigo-400 focus:outline-none focus:ring-2 focus:ring-violet-400/50 focus:border-violet-400 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-indigo-400 hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Upload Button */}
            <button
              onClick={() => setUploadModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all duration-200 flex-shrink-0 shadow-lg hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg, #7c3aed 0%, #4338ca 100%)" }}
            >
              <Upload size={15} />
              <span className="hidden sm:inline">+ Upload New Photo / File</span>
              <span className="sm:hidden">Upload</span>
            </button>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-2 rounded-lg text-indigo-300 hover:bg-indigo-800/50 hover:text-red-400 transition-colors flex-shrink-0"
            >
              <LogOut size={18} />
            </button>
          </header>

          {/* ── Page Content ── */}
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>

          {/* Footer */}
          <footer className="py-2.5 px-6 text-center text-xs text-slate-400 border-t border-slate-200 bg-white/60">
            Powered by{" "}
            <a
              href="https://digitalsolution.biz"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:text-indigo-500 hover:underline font-semibold"
            >
              Digital Solution
            </a>{" "}
            — SK Digital Photo & Document Archive
          </footer>
        </div>
      </div>
    </StudioLayoutContext.Provider>
  );
}
