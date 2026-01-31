import { useState } from "react";
import { 
  signInWithEmailAndPassword, 
  setPersistence, 
  browserSessionPersistence 
} from "firebase/auth";
import { auth } from "../services/firebase";
import { useNavigate } from "react-router-dom";
import { Lock, Mail, Loader2, Eye, EyeOff } from "lucide-react";
import whiteLogo from "../assets/images/white-logo.png";

export default function Login() {
  const [emailPrefix, setEmailPrefix] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const fullEmail = `${emailPrefix.trim().toLowerCase()}@cvsu.edu.ph`;

      // 2. ADD THIS: Set persistence to SESSION before signing in.
      // This ensures the token is deleted when the browser/tab is closed.
      await setPersistence(auth, browserSessionPersistence);

      // 3. Proceed with sign in
      await signInWithEmailAndPassword(auth, fullEmail, password);
      
      if (auth.currentUser) {
          await auth.currentUser.getIdToken(true);
      }
      
      navigate("/");
    } catch (err) {
      console.error(err);
      setError("Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        background: `linear-gradient(180deg, #03040D 0%, #172647 40%, #172647 100%)`
      }}
    >
      
      <div className="w-full max-w-md bg-[#172647] rounded-3xl shadow-2xl p-8 border border-[#38466D]/50 relative z-10">
        
        <div className="text-center mb-8">
          {/* ⭐ FIX: Updated Image Tag using the imported variable */}
          <div className="w-24 h-24 mx-auto mb-4 flex items-center justify-center">
             <img 
               src={whiteLogo} 
               alt="VoltVault Logo" 
               className="w-full h-full object-contain drop-shadow-lg" 
             />
          </div>
          <p className="text-[#adb5bd] text-sm">Admin Dashboard Access</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-[#E07A5F]/10 border border-[#E07A5F] rounded-xl text-[#E07A5F] text-sm text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          
          <div className="space-y-2">
              <label className="text-xs font-bold text-[#adb5bd] uppercase ml-1 tracking-wide">
                CVSU EMAIL
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-[#adb5bd]" />
                </div>
                
                <input
                  type="text"
                  placeholder="username"
                  className="w-full pl-11 pr-32 py-3.5 bg-white border-2 border-[#38466D] text-[#172647] rounded-xl focus:outline-none focus:border-[#FDAE37] focus:ring-0 transition-all placeholder:text-[#adb5bd]"
                  value={emailPrefix}
                  // ⭐ UPDATED ONCHANGE HANDLER
                  onChange={(e) => {
                    // 1. Get raw value
                    const val = e.target.value;
                    // 2. Remove '@' and everything after it immediately
                    const cleanValue = val.replace(/@.*/, "");
                    // 3. Update state
                    setEmailPrefix(cleanValue);
                  }}
                  required
                />
                
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none select-none">
                  <span className="text-[#adb5bd] font-medium">@cvsu.edu.ph</span>
                </div>
              </div>
            </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-[#adb5bd] uppercase ml-1 tracking-wide">
              PASSWORD
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-[#adb5bd]" />
              </div>
              
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••"
                className="w-full pl-11 pr-12 py-3.5 bg-white border-2 border-[#38466D] text-[#172647] rounded-xl focus:outline-none focus:border-[#FDAE37] focus:ring-0 transition-all placeholder:text-[#adb5bd]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#adb5bd] hover:text-[#172647] transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-8 bg-white hover:bg-gray-100 text-[#172647] font-bold py-3.5 rounded-2xl shadow-lg transform transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="animate-spin h-5 w-5 text-[#172647]" />
            ) : (
              "Login"
            )}
          </button>

        </form>
      </div>
      
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
         <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-[#38466D] opacity-20 blur-[120px]"></div>
         <div className="absolute bottom-[10%] right-[10%] w-[40%] h-[40%] rounded-full bg-[#172647] opacity-60 blur-[100px]"></div>
      </div>

    </div>
  );
}