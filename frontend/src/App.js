import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

import Navbar from "./components/Navbar";
import Dashboard from "./components/Dashboard";
import Login from "./components/Login";
import Register from "./components/Register";
import ProtectedRoute from "./components/ProtectedRoute";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";

const API = "https://budget-tracker-production-ae41.up.railway.app";


export default function App() {
  const [isAuth, setIsAuth] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const location = useLocation();

  // ------------------ GLOBAL AUTH CHECK ------------------
  async function checkAuth() {
    try {
      const res = await fetch(`${API}/me`, { credentials: "include" });
      if (res.ok) {
        setIsAuth(true);
      } else {
        setIsAuth(false);
      }
    } catch {
      setIsAuth(false);
    }
    setLoadingAuth(false);
  }

  // Run auth check on mount + when route changes
  useEffect(() => {
    checkAuth();
  }, [location.pathname]);

  if (loadingAuth) return <div>Loading...</div>;

  // Hide navbar on these pages
  const hideNavbar =
    location.pathname === "/login" ||
    location.pathname === "/register" ||
    location.pathname === "/forgot-password" ||
    location.pathname === "/reset-password";

  return (
    <div className="app-root">
      {/* Navbar visible only when logged in */}
      {!hideNavbar && isAuth && <Navbar />}

      <main className="main-container">
        <Routes>
          {/* Redirect root */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Public Auth Pages */}
          <Route path="/login" element={isAuth ? <Navigate to="/dashboard" /> : <Login />} />
          <Route path="/register" element={isAuth ? <Navigate to="/dashboard" /> : <Register />} />

          {/* Password Reset */}
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protected Dashboard */}
          <Route
            path="/dashboard"
            element={
              isAuth ? (
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}
