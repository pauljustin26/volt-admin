import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { 
  User, Mail, Phone, Calendar, Search, 
  ShieldAlert, CheckCircle, X, AlertTriangle, 
  HelpCircle, Info, Lock
} from "lucide-react";

export default function Users() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showHelp, setShowHelp] = useState(true); // Toggle for help banner

  // --- Ban Modal State ---
  const [isBanModalOpen, setIsBanModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [banReason, setBanReason] = useState("Violation of Terms");
  const [customReason, setCustomReason] = useState("");
  const [processing, setProcessing] = useState(false);

  // Pre-defined reasons
  const PRE_DEFINED_REASONS = [
    "Overdue Rental (1+ Week)",
    "Damaged Equipment",
    "Non-Payment of Fees",
    "Suspicious Activity",
    "Violation of Terms",
    "Other"
  ];

  // -------- Fetch Users --------
  useEffect(() => {
    fetchUsers();
  }, [user]);

  const fetchUsers = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const token = await user.getIdToken();
      const res = await api.get("/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data.users || []);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  };

  // -------- Handlers --------
  const handleOpenBanModal = (student) => {
    setSelectedUser(student);
    setBanReason("Violation of Terms");
    setCustomReason("");
    setIsBanModalOpen(true);
  };

  const handleUnban = async (student) => {
    if (!window.confirm(`Are you sure you want to reactivate ${student.firstName}'s account?`)) return;
    
    try {
      const token = await user.getIdToken();
      await api.patch(`/admin/users/${student.uid}/status`, 
        { action: 'unban' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update UI locally
      setUsers(prev => prev.map(u => 
        u.uid === student.uid ? { ...u, isActive: true } : u
      ));
    } catch (error) {
      alert("Failed to unban user");
    }
  };

  const submitBan = async () => {
    if (!selectedUser) return;
    setProcessing(true);
    
    const finalReason = banReason === "Other" ? customReason : banReason;

    try {
      const token = await user.getIdToken();
      await api.patch(`/admin/users/${selectedUser.uid}/status`, 
        { action: 'ban', reason: finalReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update UI locally
      setUsers(prev => prev.map(u => 
        u.uid === selectedUser.uid ? { ...u, isActive: false } : u
      ));
      
      setIsBanModalOpen(false);
      setSelectedUser(null);
    } catch (error) {
      alert("Failed to ban user");
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

  // Filter users based on search
  const filteredUsers = users.filter(u => 
    u.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto px-4">
      
      {/* HEADER & SEARCH */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Student Directory</h1>
          <p className="text-slate-500 text-sm mt-1">Manage student accounts and access.</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Toggle Help Button */}
          <button 
            onClick={() => setShowHelp(!showHelp)}
            className="text-slate-500 hover:text-blue-600 flex items-center gap-1 text-sm font-medium transition-colors mr-2"
          >
            <HelpCircle className="h-4 w-4" />
            {showHelp ? "Hide Guide" : "Show Guide"}
          </button>

          {/* Search Bar */}
          <div className="relative flex-1 sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search name, ID, or email..."
              className="pl-10 pr-4 py-2 w-full border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* BEGINNER GUIDE BANNER */}
      {showHelp && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex flex-col md:flex-row gap-4 animate-in fade-in slide-in-from-top-2">
          <div className="bg-blue-100 p-2 rounded-lg h-fit w-fit">
            <Info className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-blue-800 mb-1">How to manage users:</h3>
            <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
              <li>Use the <strong>search bar</strong> to find a specific student by name or ID.</li>
              <li>Click the <strong className="text-red-600 inline-flex items-center gap-1"><Lock className="h-3 w-3"/> Suspend</strong> button to block a student from logging in (e.g., for theft or unpaid fees).</li>
              <li>Click the <strong className="text-green-600 inline-flex items-center gap-1"><CheckCircle className="h-3 w-3"/> Reactivate</strong> button to restore access for a suspended student.</li>
            </ul>
          </div>
        </div>
      )}

      {/* USER TABLE */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden animate-in fade-in duration-300">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Student Name</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Contact Info</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Student ID</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Account Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredUsers.map((student) => (
              <tr key={student.uid} className={`hover:bg-slate-50/50 transition-colors ${!student.isActive ? 'bg-red-50/30' : ''}`}>
                
                {/* Name */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm text-white shadow-sm ${student.isActive ? 'bg-linear-to-br from-blue-500 to-indigo-600' : 'bg-slate-400'}`}>
                      {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        {student.firstName} {student.lastName}
                      </p>
                      {!student.isActive && <span className="text-[10px] text-red-600 font-bold uppercase">Suspended</span>}
                    </div>
                  </div>
                </td>

                {/* Contact */}
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Mail className="h-3.5 w-3.5 text-slate-400" />
                      {student.email}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      {student.mobileNumber || "No number"}
                    </div>
                  </div>
                </td>

                {/* ID */}
                <td className="px-6 py-4">
                  <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-mono font-bold border border-slate-200">
                    {student.studentId}
                  </span>
                </td>

                {/* Status */}
                <td className="px-6 py-4">
                  {student.isActive ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                      <span className="h-2 w-2 rounded-full bg-green-500"></span>
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      Banned
                    </span>
                  )}
                </td>

                {/* Actions */}
                <td className="px-6 py-4 text-right">
                  {student.isActive ? (
                    <button 
                      onClick={() => handleOpenBanModal(student)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-red-200 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-lg text-xs font-bold transition-all shadow-sm"
                      title="Block this student from accessing the app"
                    >
                      <Lock className="h-3.5 w-3.5" />
                      Suspend
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleUnban(student)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-green-200 hover:bg-green-50 text-slate-600 hover:text-green-600 rounded-lg text-xs font-bold transition-all shadow-sm"
                      title="Restore access for this student"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      Reactivate
                    </button>
                  )}
                </td>

              </tr>
            ))}

            {/* Empty State */}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <Search className="h-8 w-8 mb-2 opacity-50" />
                    <p className="font-medium text-slate-600">No students found.</p>
                    <p className="text-sm">Try searching for a different name or ID.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ---------------- BAN MODAL ---------------- */}
      {isBanModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100">
            
            {/* Modal Header */}
            <div className="bg-red-50 px-6 py-4 border-b border-red-100 flex justify-between items-center">
              <div className="flex items-center gap-2 text-red-800 font-bold">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <h2>Suspend Account</h2>
              </div>
              <button 
                onClick={() => setIsBanModalOpen(false)}
                className="text-red-400 hover:text-red-700 bg-white rounded-full p-1 hover:bg-red-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600 leading-relaxed">
                You are about to suspend <strong>{selectedUser.firstName} {selectedUser.lastName}</strong>.<br/>
                They will be logged out immediately and cannot sign back in until reactivated.
              </p>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Select Reason</label>
                <select 
                  className="w-full p-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-red-500 outline-none bg-slate-50 cursor-pointer"
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                >
                  {PRE_DEFINED_REASONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {banReason === "Other" && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Custom Reason</label>
                  <textarea 
                    className="w-full p-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-red-500 outline-none resize-none"
                    placeholder="Type the specific reason here..."
                    rows={3}
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 flex gap-3 border-t border-slate-100">
              <button 
                onClick={() => setIsBanModalOpen(false)}
                disabled={processing}
                className="flex-1 px-4 py-2.5 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={submitBan}
                disabled={processing}
                className="flex-1 px-4 py-2.5 text-white font-bold bg-red-600 hover:bg-red-700 rounded-xl shadow-lg shadow-red-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {processing ? "Processing..." : "Confirm Suspend"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}