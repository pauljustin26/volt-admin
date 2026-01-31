import { useState } from "react";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import Sidebar from "./components/Sidebar";

// 1. Import AutoLogout
import AutoLogout from "./components/AutoLogout"; 

import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Logs from "./pages/Logs";
import Users from "./pages/Users";
import Volts from "./pages/Volts";
import Transactions from "./pages/Transactions";
import Payments from "./pages/Payments";
import Settings from "./pages/Settings";

function ProtectedLayout({ children }) {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  return (
    <ProtectedRoute>
      {/* 2. Wrap the layout logic in AutoLogout */}
      <AutoLogout>
        <div className="flex min-h-screen bg-slate-50">
          
          <Sidebar 
            isExpanded={isSidebarExpanded} 
            setIsExpanded={setIsSidebarExpanded} 
          />
          
          <div 
            className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
              isSidebarExpanded ? "ml-64" : "ml-20"
            }`}
          >
            <main className="p-8 max-w-7xl mx-auto w-full">
              {children}
            </main>
          </div>

        </div>
      </AutoLogout>
    </ProtectedRoute>
  );
}

const router = createBrowserRouter([
  { path: "/login", element: <Login /> },
  {
    path: "/",
    element: (
      <ProtectedLayout>
        <Dashboard />
      </ProtectedLayout>
    ),
  },
  {
    path: "/users",
    element: (
      <ProtectedLayout>
        <Users />
      </ProtectedLayout>
    ),
  },
    {
    path: "/logs",
    element: (
      <ProtectedLayout>
        <Logs />
      </ProtectedLayout>
    ),
  },
  {
    path: "/volts",
    element: (
      <ProtectedLayout>
        <Volts />
      </ProtectedLayout>
    ),
  },
  {
    path: "/transactions",
    element: (
      <ProtectedLayout>
        <Transactions />
      </ProtectedLayout>
    ),
  },
  {
    path: "/payments",
    element: (
      <ProtectedLayout>
        <Payments />
      </ProtectedLayout>
    ),
  },
  {
  path: "/settings",
  element: <ProtectedLayout><Settings /></ProtectedLayout>,
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}