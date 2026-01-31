import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { 
  Battery, 
  BatteryCharging, 
  Zap, 
  User, 
  AlertCircle,
  RefreshCw,
  HelpCircle,
  Info,
  CheckCircle,
  Clock
} from "lucide-react";

export default function Volts() {
  const { user } = useAuth();
  const [volts, setVolts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showHelp, setShowHelp] = useState(true); // Helper toggle

  // -------- Fetch Volts --------
  const fetchVolts = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const token = await user.getIdToken();
      const res = await api.get("/admin/volts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVolts(res.data.volts || []);
    } catch (err) {
      console.error("Failed to fetch volts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVolts();
  }, [user]);

  // -------- Helpers --------
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'available': return "bg-green-100 text-green-700 border-green-200";
      case 'rented': return "bg-orange-100 text-orange-700 border-orange-200";
      case 'charging': return "bg-blue-100 text-blue-700 border-blue-200";
      default: return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  const getBatteryIcon = (level) => {
    if (level >= 90) return <BatteryCharging className="h-4 w-4 text-green-600" />;
    if (level >= 50) return <Battery className="h-4 w-4 text-blue-600" />;
    if (level >= 20) return <Battery className="h-4 w-4 text-yellow-600" />;
    return <AlertCircle className="h-4 w-4 text-red-600" />;
  };

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  // Quick Stats Calculation
  const availableCount = volts.filter(v => v.status === 'available').length;
  const rentedCount = volts.filter(v => v.status === 'rented').length;

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto px-4">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Device Monitor</h1>
          <p className="text-slate-500 text-sm mt-1">Live status of all {volts.length} powerbank units.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowHelp(!showHelp)}
            className="text-slate-500 hover:text-blue-600 flex items-center gap-1 text-sm font-medium transition-colors mr-2"
          >
            <HelpCircle className="h-4 w-4" />
            {showHelp ? "Hide Guide" : "Show Guide"}
          </button>

          <button 
            onClick={fetchVolts}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm active:scale-95"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh List
          </button>
        </div>
      </div>

      {/* BEGINNER GUIDE BANNER */}
      {showHelp && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex flex-col md:flex-row gap-6 animate-in fade-in slide-in-from-top-2">
          {/* Quick Stats Box */}
          <div className="flex gap-4 border-r border-blue-200 pr-6 mr-2">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{availableCount}</p>
              <p className="text-xs text-slate-500 font-medium uppercase">Available</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-500">{rentedCount}</p>
              <p className="text-xs text-slate-500 font-medium uppercase">Rented Out</p>
            </div>
          </div>

          {/* Guide Text */}
          <div className="flex-1">
            <h3 className="font-bold text-blue-800 mb-1 flex items-center gap-2">
              <Info className="h-4 w-4" /> System Legend:
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-blue-800/80">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                <span><strong>Available:</strong> Ready for students to rent.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                <span><strong>Rented:</strong> Currently in use by a student.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                <span><strong>Sensor Status:</strong> Checks if device is physically docked.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VOLTS TABLE */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden animate-in fade-in duration-300">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Volt ID</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Battery Level</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Sensor Check</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Current Renter</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {volts.map((volt) => (
              <tr key={volt.id} className="hover:bg-slate-50/50 transition-colors">
                
                {/* ID Column */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-slate-100 rounded-xl">
                      <Zap className="h-5 w-5 text-slate-600" />
                    </div>
                    <span className="font-bold text-slate-700 text-sm">Volt #{volt.id}</span>
                  </div>
                </td>

                {/* Battery Column */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {getBatteryIcon(volt.battery)}
                    <div className="w-full max-w-[100px]">
                      <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                        <span>{volt.battery}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            volt.battery > 50 ? 'bg-green-500' : volt.battery > 20 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${volt.battery}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </td>

                {/* Status Badge */}
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(volt.status)}`}>
                    {volt.status === 'available' && <CheckCircle className="w-3 h-3" />}
                    {volt.status === 'rented' && <Clock className="w-3 h-3" />}
                    {volt.status.toUpperCase()}
                  </span>
                </td>

                {/* Sensor Status */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${volt.sensorStatus === 'CHARGING' ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                    <span className="text-xs font-mono text-slate-500 font-medium">
                      {volt.sensorStatus || 'UNKNOWN'}
                    </span>
                  </div>
                </td>

                {/* Renter Info */}
                <td className="px-6 py-4">
                  {volt.currentRenterId ? (
                    <div className="flex items-center gap-2 text-sm bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg w-fit font-medium border border-blue-100">
                      <User className="h-3.5 w-3.5" />
                      {volt.currentRenterId}
                    </div>
                  ) : (
                    <span className="text-sm text-slate-400 italic px-3 py-1.5">-- Idle --</span>
                  )}
                </td>

              </tr>
            ))}
            {volts.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <Zap className="h-8 w-8 mb-2 opacity-50" />
                    <p className="font-medium text-slate-600">No Volt units found.</p>
                    <p className="text-sm">Please check your internet or database connection.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}