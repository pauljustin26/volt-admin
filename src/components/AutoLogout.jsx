import { useEffect, useRef, useCallback } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../services/firebase";
import { useNavigate } from "react-router-dom";

// 15 Minutes in milliseconds
const INACTIVITY_LIMIT = 15 * 60 * 1000; 

export default function AutoLogout({ children }) {
  const navigate = useNavigate();
  const timerRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  // 1. Logout Logic
  const handleLogout = useCallback(async () => {
    try {
      if (auth.currentUser) {
        console.log("User inactive. Logging out...");
        await signOut(auth);
        navigate("/login"); 
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  }, [navigate]);

  // 2. Reset Timer (Throttled)
  const resetTimer = useCallback(() => {
    // Prevent timer from resetting hundreds of times per second
    if (Date.now() - lastActivityRef.current < 500) return;
    lastActivityRef.current = Date.now();

    if (timerRef.current) clearTimeout(timerRef.current);

    if (auth.currentUser) {
      timerRef.current = setTimeout(handleLogout, INACTIVITY_LIMIT);
    }
  }, [handleLogout]);

  useEffect(() => {
    // 3. Events to track
    const events = [
      "mousedown",
      "mousemove",
      "keydown",
      "scroll",      // <--- The problematic event
      "touchstart",
      "click"
    ];

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        resetTimer();
        events.forEach((event) => {
          // ⭐ CRITICAL FIX: "true" enables Capture Phase
          // This catches scroll events even inside divs
          window.addEventListener(event, resetTimer, true);
        });
      } else {
        if (timerRef.current) clearTimeout(timerRef.current);
        events.forEach((event) => {
          window.removeEventListener(event, resetTimer, true);
        });
      }
    });

    return () => {
      unsubscribe();
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer, true);
      });
    };
  }, [resetTimer]);

  return <>{children}</>;
}