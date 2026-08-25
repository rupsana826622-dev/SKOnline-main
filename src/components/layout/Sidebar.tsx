import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, UserPlus, Truck, MessageSquare,
  Settings, Map, LogOut, ChevronLeft, ChevronRight, ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { clearSession } from "@/lib/storage";
import { APP_NAME, POWERED_BY } from "@/constants";
import logoImg from "@/assets/sk-logo.png";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  birthdayCount: number;
}

const navItems = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Customers", path: "/customers", icon: Users },
  { label: "Add Customer", path: "/add-customer", icon: UserPlus },
  { label: "Delivery Tracker", path: "/delivery", icon: Truck },
  { label: "WB-SMS / WhatsApp", path: "/whatsapp", icon: MessageSquare },
  { label: "Family Mapping", path: "/family-mapping", icon: Map },
  { label: "Settings", path: "/settings", icon: Settings },
];

export default function Sidebar({ collapsed, onToggle, birthdayCount }: SidebarProps) {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearSession();
    navigate("/login", { replace: true });
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-full z-40 flex flex-col transition-all duration-300 ease-in-out",
        "bg-slate-900 text-slate-100 border-r border-slate-800",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className={cn(
        "flex items-center border-b border-slate-800 flex-shrink-0",
        collapsed ? "justify-center px-2 py-4" : "px-4 py-4 gap-3"
      )}>
        <img src={logoImg} alt="SK ONLINE" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
        {!collapsed && (
          <div className="min-w-0">
            <div className="font-extrabold text-base text-white tracking-tight leading-none">{APP_NAME}</div>
            <div className="text-xs text-slate-400 font-medium mt-0.5 flex items-center gap-1">
              <ShieldCheck size={10} />
              <span>CSP Portal</span>
            </div>
          </div>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto sidebar-scroll py-3 px-2 space-y-0.5">
        {navItems.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 group relative",
                isActive
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white",
                collapsed && "justify-center px-2"
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={18} className={cn("flex-shrink-0", isActive ? "text-white" : "text-slate-400 group-hover:text-white")} />
                {!collapsed && <span className="truncate">{label}</span>}
                {!collapsed && path === "/dashboard" && birthdayCount > 0 && (
                  <span className="ml-auto bg-amber-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {birthdayCount}
                  </span>
                )}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-slate-700 text-white text-xs rounded whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                    {label}
                  </div>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="border-t border-slate-800 p-2 space-y-0.5 flex-shrink-0">
        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-red-900/30 hover:text-red-400 transition-all duration-150",
            collapsed && "justify-center px-2"
          )}
        >
          <LogOut size={18} className="flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>

        {/* Collapse toggle */}
        <button
          onClick={onToggle}
          className={cn(
            "flex items-center gap-3 w-full rounded-lg px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-all duration-150",
            collapsed && "justify-center px-2"
          )}
        >
          {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span>Collapse</span></>}
        </button>

        {!collapsed && (
          <div className="px-3 py-2 text-[10px] text-slate-600 text-center">{POWERED_BY}</div>
        )}
      </div>
    </aside>
  );
}
