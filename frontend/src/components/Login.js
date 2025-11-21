import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const API = "https://budget-tracker-jrbo.onrender.com";


  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!username || !password) {
      alert("Please enter username and password.");
      return;
    }

    try {
      const resp = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });

      const data = await resp.json();

      if (resp.ok) {
        // fetch /me to get canonical username (in case email login was used)
        try {
          const me = await fetch(`${API}/me`, { credentials: "include" });
          if (me.ok) {
            const meData = await me.json();
            if (meData?.username) localStorage.setItem("username", meData.username);
          } else {
            localStorage.setItem("username", username);
          }
        } catch {
          localStorage.setItem("username", username);
        }
        navigate("/dashboard");
      } else {
        alert(data.message || "Login failed");
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
          <h2 className="login-title">Login</h2>

          <div className="login-inputs">
            <input
              className="login-input"
              placeholder="Username or Email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />

            <input
              className="login-input"
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button className="login-btn" onClick={handleLogin}>
            LOGIN
          </button>

          <p className="login-footer" style={{ marginTop: "12px", fontWeight: 600 }}>
            <Link to="/forgot-password">Forgot Password?</Link>
          </p>

          <p className="login-footer">
            Don’t have an account? <Link to="/register">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
