import { useEffect, useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  BatteryCharging, 
  CreditCard, 
  Hash, 
  FileSpreadsheet, 
  FileText, 
  CheckSquare, 
  Square,
  Search, 
  Filter, 
  X,
  Calendar,
  Wallet,
  Activity,
  HelpCircle,
  Info
} from "lucide-react";
import { exportToExcel, exportToPDF } from "../utils/exportHelper";
import toast, { Toaster } from 'react-hot-toast';

export default function Transactions() {
  const { user } = useAuth();
  const [walletTxns, setWalletTxns] = useState([]);
  const [rentalTxns, setRentalTxns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("wallet");
  const [showHelp, setShowHelp] = useState(true); // Helper toggle

  // --- Search & Filter State ---
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all"); 
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Selection State
  const [selectedIds, setSelectedIds] = useState(new Set());

  // -------- Fetch Transactions --------
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const token = await user.getIdToken();
        const res = await api.get("/admin/transactions", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const allData = res.data.transactions || [];
        setWalletTxns(allData.filter(t => t.type === 'topup'));
        setRentalTxns(allData.filter(t => t.type === 'rent' || t.type === 'return'));
      } catch (err) {
        console.error("Failed to fetch transactions:", err);
        toast.error("Failed to load transactions.");
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, [user]);

  // -------- Filter Logic (Unchanged) --------
  const rawData = activeTab === "wallet" ? walletTxns : rentalTxns;

  const filteredData = useMemo(() => {
    return rawData.filter(item => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        (item.id || "").toLowerCase().includes(query) ||
        (item.userId || "").toLowerCase().includes(query) ||
        (item.reference || "").toLowerCase().includes(query);

      const matchesStatus = statusFilter === "all" || item.status === statusFilter;

      let matchesCategory = true;
      if (categoryFilter !== "all") {
        if (activeTab === "wallet") {
          matchesCategory = item.method && item.method.toLowerCase().includes(categoryFilter);
        } else {
          matchesCategory = item.type === categoryFilter;
        }
      }

      let matchesDate = true;
      if (startDate || endDate) {
        const itemDate = new Date(item.date);
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0); 
          if (itemDate < start) matchesDate = false;
        }
        if (endDate && matchesDate) { 
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999); 
          if (itemDate > end) matchesDate = false;
        }
      }

      return matchesSearch && matchesStatus && matchesDate && matchesCategory;
    });
  }, [rawData, searchQuery, statusFilter, categoryFilter, startDate, endDate, activeTab]);

  useEffect(() => {
    setSelectedIds(new Set());
    setSearchQuery("");
    setStatusFilter("all");
    setCategoryFilter("all");
    setStartDate("");
    setEndDate("");
  }, [activeTab]);

  // -------- Selection & Export Logic (Unchanged) --------
  const toggleSelect = (id) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    const allIds = filteredData.map(t => t.id || t.reference);
    const allSelected = allIds.length > 0 && allIds.every(id => selectedIds.has(id));
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(allIds));
  };

  const isAllSelected = () => {
    return filteredData.length > 0 && filteredData.every(t => selectedIds.has(t.id || t.reference));
  };

  const getExportData = () => {
    if (selectedIds.size > 0) {
      return rawData.filter(t => selectedIds.has(t.id || t.reference));
    }
    return filteredData;
  };

  const calculateFinancials = (data) => {
    let totalAmount = 0;
    let count = 0;
    let deniedCount = 0;

    data.forEach(item => {
      const status = (item.status || "").toLowerCase();
      const rawAmount = Number(item.amount) || 0;
      if (status === 'succeeded' || status === 'completed') {
        totalAmount += rawAmount;
        count++;
      } else {
        deniedCount++;
      }
    });
    return { totalAmount, count, deniedCount };
  };
  
  const handleExportExcel = () => {
    const dataToExport = getExportData();
    if(dataToExport.length === 0) {
      toast.error("No data available to export.");
      return;
    }
    const summary = calculateFinancials(dataToExport);
    const formattedData = dataToExport.map(t => ({
      "Date": new Date(t.date).toLocaleString(),
      "ID": t.id || t.reference,
      "User": t.userId || "Unknown",
      "Type": t.type?.toUpperCase(),
      "Method": t.method || "N/A",
      "Amount": t.amount,
      "Status": t.status?.toUpperCase()
    }));
    exportToExcel(formattedData, summary, `${activeTab}_transactions`);
    toast.success("Excel exported successfully!");
  };

  const handleExportPDF = () => {
    const dataToExport = getExportData();
    if(dataToExport.length === 0) {
      toast.error("No data available to export.");
      return;
    }
    const summary = calculateFinancials(dataToExport);
    const title = activeTab === "wallet" ? "Wallet Transaction Report" : "Rental Activity Report";
    const columns = [
      { header: 'Date', key: 'date' },
      { header: 'Trans ID', key: 'id' },
      { header: 'User ID', key: 'userId' },
      { header: 'Info', key: 'info' },
      { header: 'Amount', key: 'amount' },
      { header: 'Status', key: 'status' },
    ];
    const formattedData = dataToExport.map(t => ({
      date: new Date(t.date).toLocaleDateString(),
      id: (t.id || t.reference), 
      userId: t.userId || "Unknown",
      info: activeTab === 'wallet' 
            ? (t.method ? t.method.replace('_manual', '').toUpperCase() : "N/A")
            : t.type.toUpperCase(),
      amount: `P ${t.amount?.toLocaleString()}`,
      status: t.status.toUpperCase()
    }));
    exportToPDF(title, columns, formattedData, summary, `${activeTab}_report`);
    toast.success("PDF exported successfully!");
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString('en-PH', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const StatusBadge = ({ status }) => {
    const styles = {
      completed: "bg-green-100 text-green-700 border-green-200",
      succeeded: "bg-green-100 text-green-700 border-green-200",
      pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
      failed: "bg-red-100 text-red-700 border-red-200",
      denied: "bg-red-100 text-red-700 border-red-200",
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || "bg-gray-100 text-gray-700"}`}>
        {status ? status.charAt(0).toUpperCase() + status.slice(1) : "Unknown"}
      </span>
    );
  };

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="space-y-6 pb-10 max-w-7xl mx-auto">
      <Toaster position="top-right" />
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Transaction History</h1>
          <p className="text-slate-500 text-sm mt-1">View all past payments and rental activities.</p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowHelp(!showHelp)}
            className="text-slate-500 hover:text-blue-600 flex items-center gap-1 text-sm font-medium transition-colors"
          >
            <HelpCircle className="h-4 w-4" />
            {showHelp ? "Hide Guide" : "Show Guide"}
          </button>
          <button onClick={handleExportExcel} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium shadow-sm">
            <FileSpreadsheet className="h-4 w-4" /> Download Excel
          </button>
          <button onClick={handleExportPDF} className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium shadow-sm">
            <FileText className="h-4 w-4" /> Download PDF
          </button>
        </div>
      </div>

      {/* BEGINNER GUIDE BANNER */}
      {showHelp && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-4 animate-in fade-in slide-in-from-top-2">
          <div className="bg-blue-100 p-2 rounded-lg h-fit">
            <Info className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-blue-800 mb-1">Quick Guide:</h3>
            <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
              <li><strong>Wallet Top-ups:</strong> History of money added to student accounts.</li>
              <li><strong>Rentals & Returns:</strong> Log of every time a powerbank was borrowed or returned.</li>
              <li>Use the <strong>Filters</strong> below to find specific dates or transaction types.</li>
              <li>Click the checkboxes to select specific rows for export.</li>
            </ul>
          </div>
        </div>
      )}

      {/* TABS */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("wallet")}
            className={`flex items-center gap-2 py-4 px-1 border-b-2 text-sm font-medium transition-colors ${activeTab === "wallet" ? "border-blue-500 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
          >
            <CreditCard className="h-4 w-4" />
            Wallet Top-ups
            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs ml-1">{walletTxns.length}</span>
          </button>
          <button
            onClick={() => setActiveTab("rentals")}
            className={`flex items-center gap-2 py-4 px-1 border-b-2 text-sm font-medium transition-colors ${activeTab === "rentals" ? "border-blue-500 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
          >
            <BatteryCharging className="h-4 w-4" />
            Rentals & Returns
            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs ml-1">{rentalTxns.length}</span>
          </button>
        </nav>
      </div>

      {/* FILTERS */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4 sm:space-y-0 sm:grid sm:grid-cols-12 sm:gap-4 items-center">
        
        {/* Search */}
        <div className="col-span-12 sm:col-span-3 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search Transaction ID..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-8 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Date */}
        <div className="col-span-12 sm:col-span-4 flex items-center gap-2">
            <input 
               type="date" 
               value={startDate}
               onChange={(e) => setStartDate(e.target.value)}
               className="w-full px-2 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
               title="Start Date"
            />
            <span className="text-slate-400">-</span>
            <input 
               type="date" 
               value={endDate}
               onChange={(e) => setEndDate(e.target.value)}
               className="w-full px-2 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
               title="End Date"
            />
        </div>

        {/* Category */}
        <div className="col-span-12 sm:col-span-3">
          <div className="relative">
            {activeTab === 'wallet' ? (
              <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            ) : (
              <Activity className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            )}
            <select 
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full py-2 pl-10 pr-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white cursor-pointer"
            >
              {activeTab === 'wallet' && (
                <>
                  <option value="all">All Payment Methods</option>
                  <option value="gcash">GCash</option>
                  <option value="maya">Maya</option>
                  <option value="paymongo">PayMongo</option>
                </>
              )}
              {activeTab === 'rentals' && (
                <>
                  <option value="all">All Activities</option>
                  <option value="rent">Rentals Only</option>
                  <option value="return">Returns Only</option>
                </>
              )}
            </select>
          </div>
        </div>

        {/* Status */}
        <div className="col-span-12 sm:col-span-2">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-2 pl-10 pr-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="succeeded">Success / Completed</option>
              {activeTab === 'wallet' && <option value="denied">Denied / Failed</option>}
            </select>
          </div>
        </div>

      </div>

      {/* TABLE */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden animate-in fade-in duration-300">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 w-10">
                <button onClick={toggleSelectAll} className="flex items-center outline-none" title="Select All">
                  {isAllSelected() ? <CheckSquare className="h-5 w-5 text-blue-600" /> : <Square className="h-5 w-5 text-slate-400" />}
                </button>
              </th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Date & Time</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Transaction ID</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">User ID</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">{activeTab === 'wallet' ? 'Method' : 'Activity'}</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Amount</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredData.map((tx, idx) => {
              const isSelected = selectedIds.has(tx.id || tx.reference);
              return (
                <tr key={idx} className={`transition-colors ${isSelected ? 'bg-blue-50' : 'hover:bg-slate-50/50'}`}>
                  <td className="px-6 py-4">
                    <button onClick={() => toggleSelect(tx.id || tx.reference)} className="outline-none">
                      {isSelected ? <CheckSquare className="h-5 w-5 text-blue-600" /> : <Square className="h-5 w-5 text-slate-300" />}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3 text-slate-400" />
                      {formatDate(tx.date)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-slate-500 select-all max-w-[120px] truncate" title={tx.id || tx.reference}>
                    <div className="flex items-center gap-1">
                      <Hash className="h-3 w-3 text-slate-300" />
                      {tx.id || tx.reference}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-slate-500 select-all max-w-[150px] truncate">{tx.userId}</td>
                  
                  {/* Dynamic Content based on Tab */}
                  {activeTab === 'wallet' ? (
                    <td className="px-6 py-4 text-sm font-medium text-slate-700">
                        {tx.method ? tx.method.replace('_manual', '').toUpperCase() : 'ONLINE'}
                    </td>
                  ) : (
                    <td className="px-6 py-4">
                      {tx.type === 'rent' ? (
                        <span className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100 w-fit"><ArrowUpRight className="h-3 w-3" /> RENT</span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100 w-fit"><ArrowDownLeft className="h-3 w-3" /> RETURN</span>
                      )}
                    </td>
                  )}

                  <td className={`px-6 py-4 text-sm font-bold ${tx.status === 'denied' || tx.status === 'failed' ? 'text-slate-400 line-through' : 'text-green-600'}`}>
                    {tx.status === 'denied' || tx.status === 'failed' ? '' : '+ '} ₱{tx.amount?.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right"><StatusBadge status={tx.status} /></td>
                </tr>
              );
            })}
            {filteredData.length === 0 && (
              <tr>
                <td colSpan="7" className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <Search className="h-8 w-8 mb-2 opacity-50" />
                    <p className="font-medium text-slate-600">No transactions found.</p>
                    <p className="text-sm">Try adjusting your filters or date range.</p>
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