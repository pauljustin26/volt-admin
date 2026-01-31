import { useEffect, useState, useMemo } from "react";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "../services/firebase"; 
import { 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  ShieldAlert, 
  Clock, 
  Filter, 
  Search,
  Zap,
  HelpCircle
} from "lucide-react";

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showHelp, setShowHelp] = useState(true); // Toggle for help banner
  
  // --- FILTER STATES ---
  const [filterLevel, setFilterLevel] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // --- REAL-TIME LISTENER (No Refresh Needed) ---
  useEffect(() => {
    const q = query(
      collection(db, "admin_logs"),
      orderBy("timestamp", "desc"),
      limit(100) 
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date()
        };
      });
      setLogs(logsData);
      setLoading(false);
    }, (error) => {
      console.error("Real-time logs error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // --- FILTER LOGIC ---
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesLevel = filterLevel === "all" || log.level === filterLevel;
      const matchesSearch = 
        log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.voltId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.details || "").toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesLevel && matchesSearch;
    });
  }, [logs, filterLevel, searchTerm]);

  // --- UI HELPERS ---
  const getLevelStyles = (level) => {
    switch (level) {
      case 'critical': 
        return { 
          icon: <ShieldAlert className="h-5 w-5 text-red-600" />, 
          bg: "bg-red-50 border-red-200", 
          text: "text-red-800"
        };
      case 'warning': 
        return { 
          icon: <AlertTriangle className="h-5 w-5 text-orange-500" />, 
          bg: "bg-orange-50 border-orange-200",
          text: "text-orange-800"
        };
      case 'success': 
        return { 
          icon: <CheckCircle className="h-5 w-5 text-emerald-500" />, 
          bg: "bg-emerald-50 border-emerald-200",
          text: "text-emerald-800"
        };
      default: 
        return { 
          icon: <Info className="h-5 w-5 text-blue-500" />, 
          bg: "bg-slate-50 border-slate-200",
          text: "text-slate-700"
        };
    }
  };

  const formatTime = (date) => {
    return date.toLocaleString('en-US', {
      hour: 'numeric', minute: '2-digit', hour12: true,
      month: 'short', day: 'numeric'
    });
  };

  return (
    <div className="max-w-6xl mx-auto pb-20 px-4">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-slate-700" />
            Security & Activity Logs
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Live monitoring of device status and alerts.
          </p>
        </div>

        {/* CONTROLS */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center">
          <button 
            onClick={() => setShowHelp(!showHelp)}
            className="text-slate-500 hover:text-blue-600 flex items-center gap-1 text-sm font-medium transition-colors mr-2"
          >
            <HelpCircle className="h-4 w-4" />
            {showHelp ? "Hide Legend" : "Show Legend"}
          </button>

          {/* Search */}
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search ID or User..." 
              className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filter Dropdown */}
          <div className="relative w-full sm:w-auto">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <select 
              className="pl-9 pr-8 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none w-full sm:w-40 cursor-pointer"
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
            >
              <option value="all">Show All</option>
              <option value="critical">🔴 Critical</option>
              <option value="warning">🟠 Warnings</option>
              <option value="success">🟢 Returns</option>
              <option value="info">🔵 Info</option>
            </select>
          </div>
        </div>
      </div>

      {/* BEGINNER GUIDE BANNER */}
      {showHelp && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-red-100 rounded-lg"><ShieldAlert className="h-5 w-5 text-red-600" /></div>
            <div>
              <p className="font-bold text-red-700 text-sm">Critical (Theft)</p>
              <p className="text-xs text-slate-500">Device moved without renting. Take action immediately.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-orange-100 rounded-lg"><AlertTriangle className="h-5 w-5 text-orange-600" /></div>
            <div>
              <p className="font-bold text-orange-700 text-sm">Warnings</p>
              <p className="text-xs text-slate-500">Out of range (Geofence) or Penalty fees started.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-green-100 rounded-lg"><CheckCircle className="h-5 w-5 text-green-600" /></div>
            <div>
              <p className="font-bold text-green-700 text-sm">Success</p>
              <p className="text-xs text-slate-500">Device returned safely to the kiosk.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg"><Info className="h-5 w-5 text-blue-600" /></div>
            <div>
              <p className="font-bold text-blue-700 text-sm">Info</p>
              <p className="text-xs text-slate-500">Grace period started or signal restored.</p>
            </div>
          </div>
        </div>
      )}

      {/* LOGS LIST */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-slate-400 animate-pulse bg-white rounded-xl border border-slate-100">
            <p>Connecting to live security feed...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-xl border border-slate-200 border-dashed">
            <Info className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500">No logs found matching your filters.</p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const style = getLevelStyles(log.level);
            return (
              <div 
                key={log.id} 
                className={`flex flex-col sm:flex-row gap-4 p-4 rounded-xl border-l-4 shadow-sm bg-white transition-all hover:shadow-md ${style.bg} border-l-[${style.text}]`}
                style={{ borderLeftColor: log.level === 'critical' ? '#dc2626' : log.level === 'warning' ? '#f97316' : log.level === 'success' ? '#10b981' : '#cbd5e1' }}
              >
                {/* 1. Icon & Time Column */}
                <div className="flex sm:flex-col items-center sm:items-start justify-between sm:justify-start gap-2 sm:w-32 min-w-fit">
                  <div className="flex items-center gap-2">
                    {style.icon}
                    <span className={`text-xs font-bold uppercase tracking-wider ${style.text}`}>
                      {log.level}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-400 font-mono mt-1">
                    <Clock className="h-3 w-3" />
                    {formatTime(log.timestamp)}
                  </div>
                </div>

                {/* 2. Main Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-slate-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      {log.voltId}
                    </span>
                    <h3 className="font-bold text-slate-800 text-base">
                      {log.message}
                    </h3>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {log.details}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}