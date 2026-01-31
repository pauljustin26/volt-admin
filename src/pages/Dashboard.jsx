import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, BarChart, Bar
} from "recharts";
import { 
  Users, BatteryCharging, Zap, DollarSign, RefreshCw, 
  Activity, ArrowUpRight, ArrowDownRight, Clock, MoreHorizontal
} from "lucide-react";

// Modern Palette
const COLORS = {
  rent: "#f97316", // Orange
  return: "#3b82f6", // Blue
  topup: "#10b981", // Emerald
  primary: "#6366f1", // Indigo
  bg: "#f8fafc"
};

export default function Dashboard() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState({
    totalUsers: 0, activeRentals: 0, availableVolts: 0, totalRevenue: 0,
  });
  
  // Data States
  const [revenueData, setRevenueData] = useState([]);
  const [rentalsData, setRentalsData] = useState([]); // Used for Daily Volume
  const [txnTypeData, setTxnTypeData] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]); // New: Recent Transactions List

  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchDashboard = useCallback(async (isBackgroundRefresh = false) => {
    if (!user) return;
    try {
      if (!isBackgroundRefresh) setLoading(true);

      const token = await user.getIdToken();
      // NOTE: Ensure your backend /admin/dashboard endpoint returns 'recentTransactions' 
      // If not, we will handle the empty state gracefully below.
      const res = await api.get("/admin/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const {
        totalUsers = 0, activeRentals = 0, availableVolts = 0, totalRevenue = 0,
        revenueTimeline = {}, rentalsTimeline = {},
        transactionTypeStats = {},
        recentTransactions = [] // Ideally your backend sends the last 5 txns here
      } = res.data;

      setMetrics({ totalUsers, activeRentals, availableVolts, totalRevenue });
      
      // 1. Revenue Timeline (Sorted)
      setRevenueData(
        Object.entries(revenueTimeline)
          .map(([date, value]) => ({ date, totalRevenue: value }))
          .sort((a, b) => new Date(a.date) - new Date(b.date))
      );
      
      // 2. Rentals Timeline
      setRentalsData(
        Object.entries(rentalsTimeline)
          .map(([date, value]) => ({ date, count: value }))
          .sort((a, b) => new Date(a.date) - new Date(b.date))
      );

      // 3. Transaction Mix
      setTxnTypeData([
        { name: 'Rentals', value: transactionTypeStats.rent || 0, color: COLORS.rent },
        { name: 'Returns', value: transactionTypeStats.return || 0, color: COLORS.return },
        { name: 'Top-ups', value: transactionTypeStats.topup || 0, color: COLORS.topup },
      ].filter(item => item.value > 0));

      // 4. Recent Activity (If backend sends it, otherwise empty)
      setRecentActivity(recentTransactions);

      setLastUpdated(new Date());

    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(() => fetchDashboard(true), 30000); 
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  if (loading && !lastUpdated) return (
    <div className="flex items-center justify-center h-screen bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="text-slate-500 font-medium">Loading Dashboard...</p>
      </div>
    </div>
  );

  // --- COMPONENTS ---

  const TrendBadge = ({ value }) => {
    // Logic to calculate trend would go here. For now, we simulate visual logic.
    // In a real app, compare today's metric vs yesterday.
    const isPositive = true; // Placeholder
    return (
      <span className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
        {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
        {isPositive ? "12% vs last week" : "5% vs last week"}
      </span>
    );
  };

  const StatCard = ({ title, value, icon: Icon, color, subValue }) => (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        {/* <TrendBadge />  <-- Uncomment if you calculate trends */}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h3 className="text-3xl font-bold text-slate-800 mt-1">{value}</h3>
        {subValue && <p className="text-xs text-slate-400 mt-1">{subValue}</p>}
      </div>
    </div>
  );

  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto px-4 sm:px-6">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Overview</h1>
          <p className="text-slate-500 mt-1">Welcome back, Admin. Here's what's happening today.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full">
            Updated: {lastUpdated?.toLocaleTimeString()}
          </span>
          <button 
            onClick={() => fetchDashboard(false)}
            className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm active:scale-95"
            title="Refresh Data"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Users" 
          value={metrics.totalUsers} 
          icon={Users} 
          color="bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-200"
          subValue="Active students in database"
        />
        <StatCard 
          title="Active Rentals" 
          value={metrics.activeRentals} 
          icon={BatteryCharging} 
          color="bg-gradient-to-br from-orange-400 to-orange-600 shadow-orange-200"
          subValue="Powerbanks currently out"
        />
        <StatCard 
          title="Available Units" 
          value={metrics.availableVolts} 
          icon={Zap} 
          color="bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-emerald-200"
          subValue="Ready to rent"
        />
        <StatCard 
          title="Total Revenue" 
          value={`₱${metrics.totalRevenue.toLocaleString()}`} 
          icon={DollarSign} 
          color="bg-gradient-to-br from-purple-500 to-purple-700 shadow-purple-200" 
          subValue="Total earnings"
        />
      </div>

      {/* MAIN CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* REVENUE AREA CHART */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Revenue Trends</h3>
              <p className="text-sm text-slate-500">Income over time</p>
            </div>
            <select className="bg-slate-50 border border-slate-200 text-xs rounded-lg px-2 py-1 outline-none text-slate-600">
              <option>This Month</option>
              <option>This Year</option>
            </select>
          </div>
          <div className="h-[300px]">
            {revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} tickFormatter={(val) => `₱${val}`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value) => [`₱${value}`, "Revenue"]}
                  />
                  <Area type="monotone" dataKey="totalRevenue" stroke="#8884d8" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">No revenue data yet.</div>
            )}
          </div>
        </div>

        {/* ACTIVITY MIX PIE CHART */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-slate-800">Activity Mix</h3>
            <p className="text-sm text-slate-500">Distribution of actions</p>
          </div>
          <div className="flex-1 min-h-[250px] relative">
            {txnTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={txnTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {txnTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">No activity data.</div>
            )}
            
            {/* Center Text Overlay */}
            {txnTypeData.length > 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
                <span className="text-2xl font-bold text-slate-700">
                  {txnTypeData.reduce((acc, curr) => acc + curr.value, 0)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECONDARY ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* DAILY RENTALS BAR CHART */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-800">Daily Rental Volume</h3>
            <p className="text-sm text-slate-500">Number of devices rented per day</p>
          </div>
          <div className="h-[250px]">
            {rentalsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rentalsData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} dy={10} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="count" fill="#f97316" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">No rental history yet.</div>
            )}
          </div>
        </div>

        {/* RECENT ACTIVITY LIST (New Feature) */}
        {/* <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-800">Recent Activity</h3>
            <button className="text-xs font-bold text-indigo-600 hover:text-indigo-800">View All</button>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-4 max-h-[250px]"> */}
            {/* Note: This data usually comes from the backend. 
                If you haven't implemented it yet, this is how it *will* look. 
                For now, if empty, we show a placeholder. */}
            
            {/* {recentActivity.length > 0 ? (
              recentActivity.map((tx, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${tx.type === 'rent' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                      {tx.type === 'rent' ? <BatteryCharging className="h-4 w-4" /> : <DollarSign className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-700 capitalize">{tx.type}</p>
                      <p className="text-xs text-slate-500">{tx.userId || "Unknown User"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-800">₱{tx.amount}</p>
                    <p className="text-[10px] text-slate-400">Just now</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Activity className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No recent transactions to show.</p>
              </div>
            )}
          </div> */}
        {/* </div> */}

      </div>
    </div>
  );
}