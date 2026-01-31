import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api"; 
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot 
} from "firebase/firestore";
import { db } from "../services/firebase"; 
import { 
  Check, X, FileText, Calendar, User, AlertTriangle, RefreshCw, 
  HelpCircle, Info 
} from "lucide-react";
import toast, { Toaster } from 'react-hot-toast';

export default function Payments() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showHelp, setShowHelp] = useState(true); // Toggle for help banner

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [processing, setProcessing] = useState(false);

  // -------- REAL-TIME LISTENER --------
  useEffect(() => {
    const q = query(
      collection(db, "transactions"),
      where("method", "in", ["gcash_manual", "maya_manual"]),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date()
        };
      });
      setTransactions(liveData);
      setLoading(false);
    }, (error) => {
      console.error("Real-time payments error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // -------- ACTIONS --------
  const handleActionClick = (tx, type) => {
    setSelectedTx(tx);
    setActionType(type);
    setModalOpen(true);
  };

  const confirmAction = async () => {
    if (!selectedTx || !actionType) return;
    setProcessing(true);
    try {
      const token = await user.getIdToken(true);
      const endpoint = actionType === 'approve' ? 'approve' : 'deny';
      
      await api.patch(`/wallet/${endpoint}/${selectedTx.id}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success(actionType === 'approve' ? "Approved successfully!" : "Request denied.");
      setModalOpen(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Action failed.");
    } finally {
      setProcessing(false);
    }
  };

  const viewReceipt = async (tx) => {
    const loadingToast = toast.loading("Loading image...");
    try {
      const token = await user.getIdToken(true);
      const res = await api.get(`/wallet/receipt/${tx.id}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });
      const url = URL.createObjectURL(res.data);
      window.open(url, "_blank");
      toast.dismiss(loadingToast);
    } catch {
      toast.error("Could not load receipt image.", { id: loadingToast });
    }
  };

  // -------- UI HELPERS --------
  const formatDate = (dateObj) => {
    if (!dateObj) return "-";
    return dateObj.toLocaleString('en-PH', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const StatusBadge = ({ status }) => {
    const styles = {
      pending: "bg-amber-100 text-amber-700 border-amber-200",
      succeeded: "bg-emerald-100 text-emerald-700 border-emerald-200",
      denied: "bg-red-100 text-red-700 border-red-200",
    };
    // Helper text for beginners
    const labels = {
      pending: "Needs Review",
      succeeded: "Approved",
      denied: "Rejected"
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${styles[status] || "bg-gray-100 text-gray-700"}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div className="space-y-6 relative max-w-6xl mx-auto pb-20">
      <Toaster position="top-right" />

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Top-up Verification</h1>
          <p className="text-slate-500 text-sm mt-1">Review student payment screenshots here.</p>
        </div>
        
        {/* Toggle Help Button */}
        <button 
          onClick={() => setShowHelp(!showHelp)}
          className="text-slate-500 hover:text-blue-600 flex items-center gap-1 text-sm font-medium transition-colors"
        >
          <HelpCircle className="h-4 w-4" />
          {showHelp ? "Hide Guide" : "Show Guide"}
        </button>
      </div>

      {/* BEGINNER GUIDE BANNER */}
      {showHelp && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-4 animate-in fade-in slide-in-from-top-2">
          <div className="bg-blue-100 p-2 rounded-lg h-fit">
            <Info className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-blue-800 mb-1">How to verify payments:</h3>
            <ol className="list-decimal list-inside text-sm text-blue-700 space-y-1">
              <li>Click <strong>View Receipt</strong> to check the student's screenshot proof.</li>
              <li>Verify if the amount matches the requested amount (e.g., ₱100).</li>
              <li>Click the <strong className="text-green-600">Check (✓)</strong> to approve and add money to their wallet.</li>
              <li>Click the <strong className="text-red-600">Cross (X)</strong> to reject if the proof is invalid or blurry.</li>
            </ol>
          </div>
        </div>
      )}

      {/* PENDING COUNT */}
      <div className="flex items-center gap-2 mb-4">
        <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
          <AlertTriangle className="h-3 w-3" />
          {transactions.filter(t => t.status === 'pending').length} Payments Waiting for Approval
        </span>
      </div>

      {/* TABLE */}
      {loading && transactions.length === 0 ? (
        <div className="flex items-center justify-center h-64 bg-white rounded-xl border border-slate-200">
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
            <p>Connecting to live feed...</p>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Date Submitted</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Payment App</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Student</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Amount</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Proof</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Review</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-blue-50/50 transition-colors group">
                  
                  {/* Date */}
                  <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                    {formatDate(tx.createdAt)}
                  </td>

                  {/* Payment Method (Simplified) */}
                  <td className="px-6 py-4">
                    {tx.method?.includes('gcash') ? (
                      <span className="px-2 py-1 rounded text-xs font-bold bg-blue-100 text-blue-700">GCash Upload</span>
                    ) : (
                      <span className="px-2 py-1 rounded text-xs font-bold bg-emerald-100 text-emerald-700">Maya Upload</span>
                    )}
                  </td>

                  {/* Student ID */}
                  <td className="px-6 py-4 text-sm text-slate-700 font-mono">
                    {tx.studentId || tx.userId || 'Unknown'}
                  </td>

                  {/* Amount */}
                  <td className="px-6 py-4 text-sm font-bold text-slate-900">
                    ₱{Number(tx.amount || 0).toLocaleString()}
                  </td>

                  {/* View Receipt Button */}
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => viewReceipt(tx)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-700 text-xs font-bold transition-colors border border-slate-200"
                      title="Click to see the screenshot uploaded by the student"
                    >
                      <FileText className="h-3.5 w-3.5" /> View Proof
                    </button>
                  </td>

                  {/* Status Badge */}
                  <td className="px-6 py-4"><StatusBadge status={tx.status} /></td>

                  {/* Action Buttons */}
                  <td className="px-6 py-4 text-right">
                    {tx.status === "pending" ? (
                      <div className="flex justify-end gap-2 opacity-100">
                        <button
                          onClick={() => handleActionClick(tx, 'approve')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-sm hover:shadow active:scale-95 transition-all text-xs font-bold"
                          title="Verify and Add Money"
                        >
                          <Check className="h-3.5 w-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => handleActionClick(tx, 'deny')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-white text-red-600 border border-red-200 rounded-lg hover:bg-red-50 hover:border-red-300 transition-all text-xs font-bold"
                          title="Reject Request"
                        >
                          <X className="h-3.5 w-3.5" /> Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium italic">Already Processed</span>
                    )}
                  </td>
                </tr>
              ))}

              {/* Empty State */}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="bg-green-100 p-4 rounded-full mb-3">
                        <Check className="h-8 w-8 text-green-600" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-800">All caught up!</h3>
                      <p className="text-slate-500 text-sm">No pending payments to review right now.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* CONFIRMATION MODAL - Keeping it simple but clear */}
      {modalOpen && selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 transform transition-all scale-100">
            <div className="flex flex-col items-center text-center">
              <div className={`p-4 rounded-full mb-4 ${actionType === 'approve' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                {actionType === 'approve' ? <Check className="h-10 w-10" /> : <X className="h-10 w-10" />}
              </div>
              
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {actionType === 'approve' ? 'Approve Payment?' : 'Reject Payment?'}
              </h3>
              
              <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                You are about to <strong>{actionType}</strong> the request for <br/>
                <span className="text-lg font-bold text-slate-800">₱{selectedTx.amount}</span> from student 
                <span className="font-mono bg-slate-100 px-1 rounded ml-1 text-slate-700">{selectedTx.studentId || 'User'}</span>.
                <br/><br/>
                {actionType === 'approve' 
                  ? "This will add the money to their wallet immediately." 
                  : "The student will be notified that their proof was invalid."}
              </p>
              
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setModalOpen(false)}
                  disabled={processing}
                  className="flex-1 px-4 py-3 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAction}
                  disabled={processing}
                  className={`flex-1 px-4 py-3 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg ${
                    actionType === 'approve' 
                      ? 'bg-green-600 hover:bg-green-700 shadow-green-200' 
                      : 'bg-red-600 hover:bg-red-700 shadow-red-200'
                  }`}
                >
                  {processing ? <RefreshCw className="h-5 w-5 animate-spin" /> : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}