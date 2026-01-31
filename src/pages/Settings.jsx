import { useEffect, useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { 
  Save, 
  CreditCard, 
  Smartphone,
  Loader2,
  QrCode,
  Upload,
  FileSpreadsheet, 
  Database,
  Info,
  Download,
  Search,
  FileText,
  Calendar,
  Users,
  X,
  HelpCircle,
  Image as ImageIcon
} from "lucide-react";
import toast, { Toaster } from 'react-hot-toast';

// --- HELPER: Export Function ---
const downloadFile = (data, format) => {
  if (!data || data.length === 0) {
    toast.error("No data to export");
    return;
  }

  const headers = ["Student ID", "First Name", "Last Name", "Email"];
  const rows = data.map(s => [s.studentId, s.firstName, s.lastName, s.email]);

  let content = "";
  let mimeType = "";
  let extension = "";

  if (format === 'csv') {
    content = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    mimeType = "text/csv;charset=utf-8;";
    extension = ".csv";
  } else {
    content = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
    mimeType = "application/vnd.ms-excel;charset=utf-8";
    extension = ".xls";
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `student_whitelist_${new Date().toISOString().split('T')[0]}${extension}`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// --- SUB-COMPONENT: Real Student List Modal ---
function StudentListModal({ isOpen, onClose }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      const fetchData = async () => {
        try {
          const token = await user.getIdToken();
          const res = await api.get("/admin/whitelist", {
            headers: { Authorization: `Bearer ${token}` }
          });
          setStudents(res.data.students || []);
        } catch (err) {
          console.error(err);
          toast.error("Failed to fetch student list");
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [isOpen, user]);

  const filteredStudents = useMemo(() => {
    if (!searchTerm) return students;
    const lowerTerm = searchTerm.toLowerCase();
    return students.filter(s => 
      s.studentId?.toLowerCase().includes(lowerTerm) ||
      s.firstName?.toLowerCase().includes(lowerTerm) ||
      s.lastName?.toLowerCase().includes(lowerTerm) ||
      s.email?.toLowerCase().includes(lowerTerm)
    );
  }, [students, searchTerm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl h-[600px] flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
           <div>
             <h3 className="font-bold text-slate-800">Master Whitelist Records</h3>
             <p className="text-xs text-slate-500">View and search currently allowed students.</p>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
             <X className="h-5 w-5 text-slate-500" />
           </button>
        </div>

        <div className="p-4 border-b border-slate-100 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by ID, Name, or Email..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => downloadFile(filteredStudents, 'csv')}
            className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
            title="Download Current View"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-0">
          {loading ? (
             <div className="flex items-center justify-center h-full">
               <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
             </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 sticky top-0 shadow-sm z-10">
                <tr>
                  <th className="px-6 py-3 font-semibold text-slate-600">Student ID</th>
                  <th className="px-6 py-3 font-semibold text-slate-600">Full Name</th>
                  <th className="px-6 py-3 font-semibold text-slate-600">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((s) => (
                    <tr key={s.id || s.studentId} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3 font-mono text-slate-600">{s.studentId}</td>
                      <td className="px-6 py-3 text-slate-800 font-medium">
                        {s.lastName}, {s.firstName}
                      </td>
                      <td className="px-6 py-3 text-slate-500">{s.email}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="px-6 py-10 text-center text-slate-400 italic">
                      No students found matching "{searchTerm}"
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 text-right">
           <span className="text-xs text-slate-400 mr-4">
             Showing {filteredStudents.length} of {students.length} records
           </span>
           <button onClick={onClose} className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50">Close</button>
        </div>
      </div>
    </div>
  );
}

// --- MAIN COMPONENT ---
export default function Settings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showHelp, setShowHelp] = useState(true);
  
  // Modal State
  const [isListOpen, setIsListOpen] = useState(false);

  // Database Stats State
  const [dbStats, setDbStats] = useState({
    totalStudents: 0,
    lastUpdated: null
  });

  // Payment State
  const [payment, setPayment] = useState({
    gcashNumber: "",
    mayaNumber: "",
    gcashQrUrl: null,
    mayaQrUrl: null
  });

  // Files State
  const [gcashFile, setGcashFile] = useState(null);
  const [mayaFile, setMayaFile] = useState(null);
  const [csvFile, setCsvFile] = useState(null);
  const [uploadingCsv, setUploadingCsv] = useState(false);

  // -------- Fetch Settings & Stats --------
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = await user.getIdToken();
        const headers = { Authorization: `Bearer ${token}` };

        // 1. Get Payment Settings
        const settingsRes = await api.get("/admin/settings", { headers });
        setPayment({
          gcashNumber: settingsRes.data.gcashNumber || "",
          mayaNumber: settingsRes.data.mayaNumber || "",
          gcashQrUrl: settingsRes.data.gcashQrUrl || null,
          mayaQrUrl: settingsRes.data.mayaQrUrl || null
        });

        // 2. Get Whitelist Stats
        const whitelistRes = await api.get("/admin/whitelist", { headers });
        const students = whitelistRes.data.students || [];
        
        const lastUpdate = students.reduce((latest, current) => {
            const currentObj = current.updatedAt ? new Date(current.updatedAt._seconds * 1000) : null;
            return currentObj && currentObj > latest ? currentObj : latest;
        }, new Date(0));

        setDbStats({
            totalStudents: students.length,
            lastUpdated: lastUpdate.getFullYear() === 1970 ? null : lastUpdate
        });

      } catch (err) {
        console.error(err);
        toast.error("Failed to load system data.");
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchSettings();
  }, [user]);

  // -------- Handlers --------
  const handleTextChange = (e) => {
    const { name, value } = e.target;
    setPayment(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      if (type === 'gcash') {
        setGcashFile(file);
        setPayment(prev => ({ ...prev, gcashQrUrl: previewUrl }));
      } else if (type === 'maya') {
        setMayaFile(file);
        setPayment(prev => ({ ...prev, mayaQrUrl: previewUrl }));
      } else if (type === 'csv') {
        setCsvFile(file);
      }
    }
  };

  const handleSavePayment = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    const savePromise = new Promise(async (resolve, reject) => {
      try {
        const token = await user.getIdToken();
        const formData = new FormData();
        formData.append("gcashNumber", payment.gcashNumber);
        formData.append("mayaNumber", payment.mayaNumber);
        if (gcashFile) formData.append("gcashQr", gcashFile);
        if (mayaFile) formData.append("mayaQr", mayaFile);

        const res = await api.patch("/admin/settings", formData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data" 
          },
        });

        if(res.data.updates) {
           setPayment(prev => ({...prev, ...res.data.updates}));
        }
        resolve();
      } catch (err) {
        console.error(err);
        reject();
      } finally {
        setSaving(false);
      }
    });

    toast.promise(savePromise, {
      loading: 'Saving payment config...',
      success: <b>Payment settings saved!</b>,
      error: <b>Failed to save.</b>,
    });
  };

  const handleUploadCsv = async () => {
    if (!csvFile) {
        toast.error("Please select a file first.");
        return;
    }
    setUploadingCsv(true);

    const uploadPromise = new Promise(async (resolve, reject) => {
        try {
            const token = await user.getIdToken();
            const formData = new FormData();
            formData.append("file", csvFile); 

            const res = await api.post("/admin/upload-students", formData, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data" 
                },
            });
            
            setCsvFile(null);
            setDbStats(prev => ({ ...prev, totalStudents: res.data.count }));
            resolve(res.data.count); 
        } catch (err) {
            console.error(err);
            reject(err.response?.data?.message || "Upload failed");
        } finally {
            setUploadingCsv(false);
        }
    });

    toast.promise(uploadPromise, {
        loading: 'Processing CSV...',
        success: (count) => <b>Success! {count} students updated.</b>,
        error: (err) => <b>{err}</b>,
    });
  };

  const handleExport = async (format) => {
      const toastId = toast.loading("Preparing export...");
      try {
        const token = await user.getIdToken();
        const res = await api.get("/admin/whitelist", {
            headers: { Authorization: `Bearer ${token}` }
        });
        downloadFile(res.data.students, format);
        toast.success("Export complete!", { id: toastId });
      } catch (error) {
          toast.error("Export failed.", { id: toastId });
      }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="space-y-10 max-w-5xl mx-auto pb-20 px-4 sm:px-6">
      <Toaster position="top-right" />
      <StudentListModal isOpen={isListOpen} onClose={() => setIsListOpen(false)} />
      
      {/* HEADER */}
      <div className="border-b border-slate-200 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold text-slate-900">System Settings</h1>
            <p className="text-slate-500 mt-2">Manage app configuration and database records.</p>
        </div>
        <button 
            onClick={() => setShowHelp(!showHelp)}
            className="text-slate-500 hover:text-blue-600 flex items-center gap-1 text-sm font-medium transition-colors"
        >
            <HelpCircle className="h-4 w-4" />
            {showHelp ? "Hide Guide" : "Show Guide"}
        </button>
      </div>

      {/* BEGINNER GUIDE */}
      {showHelp && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex flex-col md:flex-row gap-4 animate-in fade-in slide-in-from-top-2">
          <div className="bg-blue-100 p-2 rounded-lg h-fit w-fit">
            <Info className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-blue-800 mb-1">Settings Guide:</h3>
            <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
              <li><strong>Payment Gateways:</strong> Update the QR codes and mobile numbers that students see when topping up.</li>
              <li><strong>Student Database:</strong> Upload a list of students allowed to use the app. This is the "Whitelist".</li>
              <li>Always click <strong>Save Payment Config</strong> after changing numbers or images.</li>
            </ul>
          </div>
        </div>
      )}

      {/* --- SECTION 1: PAYMENT CONFIGURATION --- */}
      <section>
        <div className="flex items-center gap-2 mb-4">
            <div className="bg-blue-100 p-2 rounded-lg">
                <CreditCard className="h-5 w-5 text-blue-700" />
            </div>
            <div>
                <h2 className="text-lg font-bold text-slate-800">Payment Gateways</h2>
                <p className="text-xs text-slate-500">Configure where student payments are sent.</p>
            </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                {/* GCASH */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Smartphone className="h-4 w-4 text-blue-500" />
                        <span className="font-semibold text-slate-700">GCash Configuration</span>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mobile Number</label>
                        <input type="text" name="gcashNumber" value={payment.gcashNumber} onChange={handleTextChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm bg-slate-50 focus:bg-white transition-colors" placeholder="09XXXXXXXXX" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">QR Code Image</label>
                        <div className="relative group">
                            <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 flex flex-col items-center justify-center bg-slate-50 hover:bg-white hover:border-blue-400 transition-colors h-48 cursor-pointer relative overflow-hidden">
                                {payment.gcashQrUrl ? (
                                    <img src={payment.gcashQrUrl} alt="GCash QR" className="h-full object-contain" />
                                ) : (
                                    <>
                                        <QrCode className="h-10 w-10 text-slate-400 mb-2" />
                                        <p className="text-xs text-slate-500 font-medium">Click to upload QR</p>
                                    </>
                                )}
                                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={(e) => handleFileChange(e, 'gcash')} />
                                
                                {/* Overlay Button */}
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="bg-white text-slate-800 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2">
                                        <ImageIcon className="h-3 w-3" /> Change Image
                                    </span>
                                </div>
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-400">Accepted formats: .png, .jpg, .jpeg</p>
                    </div>
                </div>

                {/* MAYA */}
                <div className="space-y-4 pt-6 md:pt-0 pl-0 md:pl-8">
                    <div className="flex items-center gap-2 mb-2">
                        <CreditCard className="h-4 w-4 text-emerald-500" />
                        <span className="font-semibold text-slate-700">Maya Configuration</span>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mobile Number</label>
                        <input type="text" name="mayaNumber" value={payment.mayaNumber} onChange={handleTextChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-sm bg-slate-50 focus:bg-white transition-colors" placeholder="09XXXXXXXXX" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">QR Code Image</label>
                        <div className="relative group">
                            <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 flex flex-col items-center justify-center bg-slate-50 hover:bg-white hover:border-emerald-400 transition-colors h-48 cursor-pointer relative overflow-hidden">
                                {payment.mayaQrUrl ? (
                                    <img src={payment.mayaQrUrl} alt="Maya QR" className="h-full object-contain" />
                                ) : (
                                    <>
                                        <QrCode className="h-10 w-10 text-slate-400 mb-2" />
                                        <p className="text-xs text-slate-500 font-medium">Click to upload QR</p>
                                    </>
                                )}
                                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={(e) => handleFileChange(e, 'maya')} />
                                
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="bg-white text-slate-800 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2">
                                        <ImageIcon className="h-3 w-3" /> Change Image
                                    </span>
                                </div>
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-400">Accepted formats: .png, .jpg, .jpeg</p>
                    </div>
                </div>
            </div>
            {/* ACTION FOOTER */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-between items-center">
                <div className="flex items-center gap-2 text-slate-500 text-xs">
                    <Info className="h-4 w-4" />
                    <span>Changes update the mobile app immediately.</span>
                </div>
                <button onClick={handleSavePayment} disabled={saving} className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-all shadow-md hover:shadow-lg active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {saving ? "Saving..." : "Save Payment Config"}
                </button>
            </div>
        </div>
      </section>

      {/* --- SECTION 2: STUDENT DATABASE MANAGEMENT --- */}
      <section>
        <div className="flex items-center gap-2 mb-4">
            <div className="bg-indigo-100 p-2 rounded-lg">
                <Database className="h-5 w-5 text-indigo-700" />
            </div>
            <div>
                <h2 className="text-lg font-bold text-slate-800">Student Database</h2>
                <p className="text-xs text-slate-500">Manage the whitelist of allowed students.</p>
            </div>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            
            {/* 1. Status Bar */}
            <div className="bg-indigo-50/50 px-6 py-4 border-b border-indigo-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
                <div className="flex gap-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg border border-indigo-100 shadow-sm">
                            <Users className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-bold uppercase">Total Students</p>
                            <p className="text-xl font-bold text-slate-800">{dbStats.totalStudents.toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="w-px bg-indigo-200 h-10 hidden sm:block"></div>
                    <div className="flex items-center gap-3">
                         <div className="p-2 bg-white rounded-lg border border-indigo-100 shadow-sm">
                            <Calendar className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-bold uppercase">Last Updated</p>
                            <p className="text-sm font-semibold text-slate-800">
                                {dbStats.lastUpdated ? dbStats.lastUpdated.toLocaleDateString() : 'Never'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                    <button 
                        onClick={() => setIsListOpen(true)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-bold transition-colors shadow-sm"
                    >
                        <Search className="h-4 w-4" /> View List
                    </button>
                    <div className="relative group">
                        <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-bold transition-colors shadow-sm">
                            <Download className="h-4 w-4" /> Export Data
                        </button>
                        <div className="absolute right-0 top-full w-48 bg-white rounded-lg shadow-xl border border-slate-100 overflow-hidden hidden group-hover:block z-10">
                            <button onClick={() => handleExport('csv')} className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium border-b border-slate-50">
                                <FileText className="h-4 w-4 text-green-600" /> Export as CSV
                            </button>
                            <button onClick={() => handleExport('xls')} className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium">
                                <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Export as Excel
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Upload Area */}
            <div className="p-8 flex flex-col md:flex-row gap-8 items-start">
                
                {/* Description Column */}
                <div className="flex-1 space-y-4">
                    <div>
                        <h3 className="text-base font-bold text-slate-900 mb-1">Update Masterlist</h3>
                        <p className="text-sm text-slate-500 leading-relaxed">
                            Upload a spreadsheet (.csv or .xlsx) to add or update students. <br/>
                            Existing student IDs will be updated; new ones will be added.
                        </p>
                    </div>
                    
                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                        <div className="flex items-start gap-3">
                            <Info className="h-5 w-5 text-amber-600 mt-0.5" />
                            <div>
                                <p className="text-sm font-bold text-amber-900">Format Requirement</p>
                                <p className="text-xs text-amber-700 mt-1 mb-2">Your file MUST have this exact header row:</p>
                                <div className="font-mono text-xs font-medium text-amber-800 bg-white/60 p-2 rounded-lg border border-amber-200 inline-block shadow-sm">
                                    studentId, firstName, lastName, email
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Upload Action Column */}
                <div className="w-full md:w-[350px] space-y-3">
                    <div 
                        className={`relative border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all h-52 group cursor-pointer
                        ${csvFile ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'}`}
                    >
                        <input 
                            type="file" 
                            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                            onChange={(e) => handleFileChange(e, 'csv')}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            disabled={uploadingCsv}
                        />
                        
                        <div className="pointer-events-none transition-transform group-hover:scale-105">
                            <FileSpreadsheet className={`h-12 w-12 mx-auto mb-4 transition-colors ${csvFile ? 'text-indigo-600' : 'text-slate-400'}`} />
                            
                            {csvFile ? (
                                <div>
                                    <p className="text-sm font-bold text-indigo-700 truncate max-w-[200px] mx-auto bg-indigo-100 px-2 py-1 rounded">{csvFile.name}</p>
                                    <p className="text-xs text-indigo-500 mt-2 font-medium">Ready to upload</p>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-sm font-bold text-slate-700">Drop Excel or CSV here</p>
                                    <p className="text-xs text-slate-400 mt-1 font-medium">or click to browse files</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={handleUploadCsv}
                        disabled={!csvFile || uploadingCsv}
                        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-200 active:scale-95"
                    >
                        {uploadingCsv ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        {uploadingCsv ? "Processing..." : "Start Upload"}
                    </button>
                    
                    {csvFile && (
                         <button 
                           onClick={() => setCsvFile(null)} 
                           className="w-full text-xs text-slate-400 hover:text-red-500 transition-colors font-medium"
                         >
                           Cancel / Remove File
                         </button>
                    )}
                </div>
            </div>
        </div>
      </section>
    </div>
  );
}