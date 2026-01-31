import { NavLink } from "react-router-dom";
import { 
  LayoutDashboard, 
  CreditCard, 
  Users, 
  Zap, 
  ListOrdered,
  LogOut,
  ChevronLeft, 
  ChevronRight,
  UserCircle, 
  Settings,
  ShieldAlert,
  AlertCircle // New icon for the "Nudge"
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../services/firebase";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/payments", label: "Payment Requests", icon: CreditCard },
  { to: "/transactions", label: "Transactions", icon: ListOrdered },
  { to: "/logs", label: "Activity Logs", icon: ShieldAlert },
  { to: "/users", label: "Users", icon: Users },
  { to: "/volts", label: "Volts", icon: Zap },
  { to: "/settings", label: "System Settings", icon: Settings },
];

export default function Sidebar({ isExpanded, setIsExpanded }) {
  const { user, logout } = useAuth(); 
  
  const [pendingPayments, setPendingPayments] = useState(0);
  const [hasAlerts, setHasAlerts] = useState(false);

  // 1. Listen for Pending Transactions (We need the COUNT here)
  useEffect(() => {
    const q = query(collection(db, "transactions"), where("status", "==", "pending"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPendingPayments(snapshot.size);
    });
    return () => unsubscribe();
  }, []);

  // 2. Listen for Alerts (We just need True/False here)
  useEffect(() => {
    const q = query(collection(db, "admin_logs"), where("level", "in", ["critical", "warning"]));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setHasAlerts(!snapshot.empty); // Set true if there are ANY alerts
    });
    return () => unsubscribe();
  }, []);

  return (
    <aside 
      className={`
        bg-slate-900 text-white flex flex-col h-screen fixed left-0 top-0 z-20 border-r border-slate-800
        transition-all duration-300 ease-in-out
        ${isExpanded ? "w-64" : "w-20"} 
      `}
    >
      {/* --- HEADER --- */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800 shrink-0">
        <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? "w-auto opacity-100" : "w-0 opacity-0"}`}>
          <h2 className="text-xl font-bold tracking-tight text-blue-400 whitespace-nowrap">
            Volt <span className="text-white">Admin</span>
          </h2>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          {isExpanded ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>

      {/* --- NAVIGATION --- */}
      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto custom-scrollbar">
        {links.map((link) => {
          
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                ${isActive
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
                }
                ${!isExpanded && "justify-center"} 
                `
              }
            >
              {/* Icon Container */}
              <div className="relative">
                <link.icon className={`h-5 w-5 min-w-5`} />
                
                {/* COLLAPSED MODE DOTS */}
                {!isExpanded && link.to === "/payments" && pendingPayments > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full border-2 border-slate-900 bg-orange-500" />
                )}
                {!isExpanded && link.to === "/logs" && hasAlerts && (
                  <span className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full border-2 border-slate-900 bg-red-600 animate-pulse" />
                )}
              </div>

              {/* Label (Expanded) */}
              <span className={`overflow-hidden transition-all duration-300 whitespace-nowrap ${isExpanded ? "w-auto opacity-100" : "w-0 opacity-0 hidden"}`}>
                {link.label}
              </span>

              {/* EXPANDED MODE INDICATORS */}
              {isExpanded && (
                <div className="ml-auto flex items-center">
                  
                  {/* Payments: Show NUMBER Count */}
                  {link.to === "/payments" && pendingPayments > 0 && (
                    <span className="px-2 py-0.5 text-xs font-bold rounded-full text-white bg-orange-500 shadow-sm">
                      {pendingPayments > 99 ? '99+' : pendingPayments}
                    </span>
                  )}

                  {/* Logs: Show WARNING ICON only (No Count) */}
                  {link.to === "/logs" && hasAlerts && (
                    <AlertCircle className="h-5 w-5 text-red-500 animate-pulse" fill="currentColor" fillOpacity={0.2} />
                  )}
                </div>
              )}

              {/* Hover Tooltip (Collapsed Only) */}
              {!isExpanded && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 invisible -translate-x-3 group-hover:visible group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 z-50 whitespace-nowrap border border-slate-700 shadow-xl flex items-center gap-2">
                  {link.label}
                  {link.to === "/payments" && pendingPayments > 0 && (
                    <span className="bg-orange-500 px-1.5 py-0.5 rounded text-[10px]">{pendingPayments}</span>
                  )}
                  {link.to === "/logs" && hasAlerts && (
                    <AlertCircle className="h-3 w-3 text-red-500" />
                  )}
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* --- USER PROFILE & LOGOUT --- */}
      <div className="p-4 border-t border-slate-800 shrink-0">
        <div className={`flex items-center gap-3 ${!isExpanded && "justify-center"}`}>
          <div className="h-10 w-10 min-w-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
             <UserCircle className="h-6 w-6" />
          </div>

          <div className={`flex-1 min-w-0 overflow-hidden transition-all duration-300 ${isExpanded ? "opacity-100" : "opacity-0 w-0 hidden"}`}>
            <p className="text-sm font-medium text-white truncate">Admin</p>
            <p className="text-xs text-slate-500 truncate" title={user?.email}>
              {user?.email}
            </p>
          </div>
        </div>

        <button
          onClick={logout}
          className={`
            mt-4 group relative flex items-center gap-3 px-3 py-2 w-full rounded-lg text-xs font-medium text-red-400 bg-slate-900 border border-slate-800
            hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/30 transition-all
            ${!isExpanded && "justify-center"}
          `}
        >
          <LogOut className="h-4 w-4 min-w-4" />
          <span className={`overflow-hidden transition-all duration-300 whitespace-nowrap ${isExpanded ? "w-auto opacity-100" : "w-0 opacity-0 hidden"}`}>
            Sign Out
          </span>
        </button>
      </div>
    </aside>
  );
}