import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const API = "https://budget-tracker-production-ae41.up.railway.app";


export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.toLowerCase());

  async function handleSubmit() {
    if (!email) {
      alert("Enter email");
      return;
    }
    if (!validEmail(email)) {
      alert("Enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (res.ok) {
        alert("A reset link is printed in backend terminal.");
      } else {
        alert(data.message);
      }
    } catch (e) {
      alert("Network error");
    }
    setLoading(false);
  }

  return (
    <div className="login-page">
      <div className="login-center">
        <h1 className="app-title">Budget Tracker</h1>

        <div className="login-card">
          <h2 className="login-title">Forgot Password</h2>

          <div className="login-inputs">
            <input
              className="login-input"
              placeholder="Enter your email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <button className="login-btn" onClick={handleSubmit}>
            {loading ? "Please wait..." : "Send Reset Link"}
          </button>

          <button className="login-btn gray" onClick={() => navigate("/login")}>
            Back
          </button>
        </div>
      </div>
    </div>
  );
}
