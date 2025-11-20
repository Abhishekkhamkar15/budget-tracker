import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const API = "https://budget-tracker-production-ae41.up.railway.app";

  const navigate = useNavigate();

  const validEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  const handleRegister = async () => {
    if (!email || !username || !password) {
      alert("All fields are required.");
      return;
    }

    if (!validEmail(email)) {
      alert("Enter a valid email address.");
      return;
    }

    try {
      const resp = await fetch(`${API}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username, password }),
      });

      const data = await resp.json();
      if (resp.ok) {
        alert("Registered successfully. Please login.");
        navigate("/login");
      } else {
        alert(data.message || "Registration failed");
      }
    } catch (err) {
      alert("Backend not reachable.");
      console.error(err);
    }
  };

  return (
    <div className="login-page">
      <div className="login-center">
        <h1 className="app-title">Budget Tracker</h1>

        <div className="login-card">
          <h2 className="login-title">Register</h2>

          <div className="login-inputs">
            <input className="login-input" placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input className="login-input" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
            <input className="login-input" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          <button className="login-btn" onClick={handleRegister}>
            REGISTER
          </button>

          <p className="login-footer" style={{ marginTop: "12px" }}>
            <Link to="/forgot-password" style={{ fontWeight: 600 }}>
              Forgot Password?
            </Link>
          </p>

          <p className="login-footer">
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
