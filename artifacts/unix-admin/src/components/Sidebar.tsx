import { useLocation } from "wouter";
import { useAuth } from "@/App";
import { useState } from "react";

const menuItems = [
  { path: "/dashboard", icon: "⬛", label: "Dashboard" },
  { path: "/users", icon: "👥", label: "Users" },
  { path: "/premium", icon: "✨", label: "Premium" },
  { path: "/payment", icon: "💳", label: "Payment" },
  { path: "/pricing", icon: "🏷️", label: "Harga Paket" },
  { path: "/statistics", icon: "📊", label: "Statistik" },
  { path: "/broadcast", icon: "📢", label: "Broadcast" },
  { path: "/settings", icon: "⚙️", label: "Pengaturan" },
];

export default function Sidebar() {
  const [location, navigate] = useLocation();
  const { admin, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const base = import.meta.env.BASE_URL.replace(/\/$/, "");

  return (
    <aside className={`flex flex-col h-full bg-sidebar border-r border-sidebar-border transition-all duration-300 ${collapsed ? "w-16" : "w-60"} flex-shrink-0`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-purple-400 flex items-center justify-center text-white font-bold text-sm">U</div>
            <span className="font-bold text-sm text-white">UNIX Admin</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-white transition-colors ml-auto"
        >
          {collapsed ? "→" : "←"}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {menuItems.map(item => {
          const isActive = location === item.path || location.startsWith(item.path + "/");
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 mb-1 text-sm font-medium transition-all duration-150 relative
                ${isActive
                  ? "text-white bg-purple-600/20 border-r-2 border-purple-500"
                  : "text-sidebar-foreground hover:text-white hover:bg-white/5"
                }`}
            >
              <span className="text-base flex-shrink-0">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
              {isActive && !collapsed && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-400"></span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="p-4 border-t border-sidebar-border">
        {!collapsed && (
          <div className="mb-3 p-2 rounded-lg bg-white/5">
            <p className="text-xs font-semibold text-white truncate">{admin?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{admin?.email}</p>
          </div>
        )}
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
        >
          <span>🚪</span>
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
