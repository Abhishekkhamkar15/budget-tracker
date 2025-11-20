import React, { useEffect, useState, useRef } from "react";
import { FaBars, FaUserCircle } from "react-icons/fa";
import { BsSun, BsMoonStars } from "react-icons/bs";
import { FiLogOut, FiSearch } from "react-icons/fi";

const API = "http://localhost:5000";

export default function Navbar() {
  const [darkMode, setDarkMode] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);
  const [searchText, setSearchText] = useState("");

  const [username, setUsername] = useState(localStorage.getItem("username") || "");
  const [email, setEmail] = useState("");

  const menuRef = useRef();
  const userRef = useRef();
  const calcRef = useRef();

  // ------------------- LOAD USER FROM BACKEND -------------------
  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch(`${API}/me`, { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setUsername(data.username);
          setEmail(data.email);
          localStorage.setItem("username", data.username);
        }
      } catch {}
    }
    loadUser();
  }, []);

  // ------------------- THEME -------------------
  useEffect(() => {
    const saved = localStorage.getItem("darkMode") === "true";
    setDarkMode(saved);
    if (saved) document.body.classList.add("dark-mode");
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
      if (userRef.current && !userRef.current.contains(e.target)) setUserOpen(false);
      if (calcRef.current && !calcRef.current.contains(e.target)) setCalcOpen(false);
    };
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, []);

  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("darkMode", newMode);
    if (newMode) document.body.classList.add("dark-mode");
    else document.body.classList.remove("dark-mode");
  };

  // ------------------- LOGOUT FIX -------------------
  const handleLogout = async () => {
    await fetch(`${API}/logout`, {
      method: "POST",
      credentials: "include",
    });

    localStorage.clear();
    window.location.href = "/login";
  };

  // ------------------- UPDATE USERNAME -------------------
  const doUpdateUsername = async () => {
    const newName = prompt("Enter new username:", username);
    if (!newName?.trim()) return;

    const res = await fetch(`${API}/update-username`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: newName.trim() }),
    });

    const data = await res.json();

    if (res.ok) {
      alert("Username updated!");
      setUsername(newName.trim());
      localStorage.setItem("username", newName.trim());
    } else alert(data.message);
  };

  // ------------------- UPDATE EMAIL -------------------
  const doUpdateEmail = async () => {
    const newEmail = prompt("Enter new email:", email);
    if (!newEmail?.trim()) return;

    const res = await fetch(`${API}/update-email`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: newEmail.trim() }),
    });

    const data = await res.json();
    if (res.ok) {
      alert("Email updated!");
      setEmail(newEmail.trim());
    } else alert(data.message);
  };

  // ------------------- CHANGE PASSWORD -------------------
  const doChangePassword = async () => {
    const oldPassword = prompt("Enter old password:");
    if (!oldPassword) return;

    const newPassword = prompt("Enter new password (must include letter + number):");
    if (!newPassword) return;

    const res = await fetch(`${API}/change-password`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        old_password: oldPassword,
        new_password: newPassword,
      }),
    });

    const data = await res.json();
    if (res.ok) alert("Password changed!");
    else alert(data.message);
  };

  // ------------------- DELETE ACCOUNT -------------------
  const doDeleteAccount = async () => {
    const ok = window.confirm(
      "Are you sure? This will permanently delete your account and all transactions."
    );
    if (!ok) return;

    const res = await fetch(`${API}/delete-account`, {
      method: "POST",
      credentials: "include",
    });

    if (res.ok) {
      alert("Account deleted.");
      localStorage.clear();
      window.location.href = "/register";
    } else {
      const data = await res.json();
      alert(data.message);
    }
  };

  return (
    <header className={`navbar ${darkMode ? "navbar-dark" : ""}`} role="navigation">
      <div className="nav-left" ref={menuRef}>
        <button
          className="menu-icon-btn"
          aria-label="open menu"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((prev) => !prev);
          }}
        >
          <FaBars className="hamburger" />
        </button>

        <span className="nav-title">BUDGET TRACKER</span>

        <div className="search-box">
          <FiSearch className="search-icon-inside" />
          <input
            type="text"
            className="search-input"
            placeholder="Search by food, salary, rent..."
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
              localStorage.setItem("searchQuery", e.target.value);
              window.dispatchEvent(new Event("searchUpdated"));
            }}
          />
        </div>

        {menuOpen && (
          <div className="dropdown-panel" style={{ left: 8, top: 52 }}>
            <button className="drop-item" onClick={() => {
              window.dispatchEvent(new Event("exportPDF"));
              setMenuOpen(false);
            }}>
              Export PDF
            </button>

            <button className="drop-item" onClick={() => {
              window.dispatchEvent(new Event("exportCSV"));
              setMenuOpen(false);
            }}>
              Export CSV
            </button>

            <button className="drop-item" onClick={() => {
              window.dispatchEvent(new Event("exportExcel"));
              setMenuOpen(false);
            }}>
              Export Excel
            </button>

            <button className="drop-item" onClick={() => alert("About — Simple Budget Tracker")}>
              About
            </button>
          </div>
        )}
      </div>

      {/* RIGHT SIDE */}
      <div className="nav-right">
        {/* USER BADGE */}
        <div className="user-badge" ref={userRef}>
          <div
            className="user-click"
            onClick={(e) => {
              e.stopPropagation();
              setUserOpen((prev) => !prev);
            }}
            style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
          >
            <FaUserCircle className="user-icon" />
            <span className="username">{username}</span>
          </div>

          {userOpen && (
            <div className="dropdown-panel user-dropdown">
              <button className="drop-item" onClick={doUpdateUsername}>Edit Username</button>
              <button className="drop-item" onClick={doUpdateEmail}>Edit Email</button>
              <button className="drop-item" onClick={doChangePassword}>Change Password</button>
              <button className="drop-item" onClick={doDeleteAccount} style={{ color: "red" }}>
                Delete Account
              </button>
            </div>
          )}
        </div>

        {/* CALCULATOR BUTTON */}
        <div
          className="icon-btn calculator-btn"
          ref={calcRef}
          onClick={(e) => {
            e.stopPropagation();
            setCalcOpen((prev) => !prev);
          }}
          style={{ display: "flex", alignItems: "center", gap: 8 }}
        >
          🧮 Calculator
        </div>
        {/* CALCULATOR DROPDOWN (updated) */}
        {calcOpen && (
          <div className="dropdown-panel calculator-dropdown" ref={calcRef}>
            <div style={{ padding: 10, fontWeight: "600", marginBottom: 8 }}>Calculator</div>

            <input
              id="calc-input"
              className="input"
              placeholder="e.g. 125 + 50 * 3"
              style={{ width: "100%", marginBottom: 10 }}
            />

            <button
              className="drop-item"
              onClick={() => {
                const expression = document.getElementById("calc-input").value;
                const resultBox = document.getElementById("calc-result");

                try {
                  const result = eval(expression);
                  resultBox.innerText = "Result: " + result;
                  resultBox.style.color = "green";
                } catch {
                  resultBox.innerText = "Invalid Expression";
                  resultBox.style.color = "red";
                }
              }}
            >
              Calculate
            </button>

            <div
              id="calc-result"
              style={{
                marginTop: 10,
                padding: "8px 10px",
                background: "rgba(0,0,0,0.06)",
                borderRadius: 6,
                fontWeight: 600,
              }}
            >
              Result: —
            </div>
          </div>
        )}

        <button className="icon-btn theme-ico" onClick={toggleTheme}>
          {darkMode ? <BsSun size={20} /> : <BsMoonStars size={20} />}
        </button>

        <button className="icon-btn logout-btn" onClick={handleLogout}>
          <FiLogOut size={16} style={{ marginRight: 8 }} /> Logout
        </button>
      </div>
    </header>
  );
}
