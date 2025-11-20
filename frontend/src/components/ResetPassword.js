import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const API = "https://budget-tracker-production-ae41.up.railway.app";


export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";

  useEffect(() => {
    if (!token) {
      alert("Invalid reset link");
      navigate("/forgot-password");
    }
  }, [token, navigate]);

  const validPassword = (pw) => pw && pw.length >= 6 && /\d/.test(pw) && /[A-Za-z]/.test(pw);

  async function handleSubmit() {
    if (!newPassword || !confirm) {
      alert("Please fill both fields");
      return;
    }
    if (newPassword !== confirm) {
      alert("Passwords do not match");
      return;
    }
    if (!validPassword(newPassword)) {
      alert("Password must be at least 6 characters and include letters and numbers.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(`${API}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: newPassword }),
      });

      const data = await res.json();
      if (res.ok) {
        alert("Password updated. Please login.");
        navigate("/login");
      } else {
        alert(data.message || "Failed to reset password");
      }
    } catch (err) {
      console.error(err);
      alert("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-center">
        <h1 className="app-title">Budget Tracker</h1>
        <div className="login-card">
          <h2 className="login-title">Reset Password</h2>

          <div className="login-inputs">
            <input
              className="login-input"
              placeholder="New password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <input
              className="login-input"
              placeholder="Confirm new password"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 10 }}>
            <button className="login-btn" onClick={handleSubmit} disabled={busy}>
              {busy ? "Please wait..." : "Set new password"}
            </button>

            <button className="login-btn gray" onClick={() => navigate("/login")}>
              Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
