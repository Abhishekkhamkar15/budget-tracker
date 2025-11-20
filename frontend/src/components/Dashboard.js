import React, { useEffect, useState, useRef } from "react";
import {
  PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis,
  CartesianGrid, ResponsiveContainer
} from "recharts";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const API = "https://budget-tracker-production-ae41.up.railway.app";


function safeConfirm(message) {
  return window.confirm(message);
}

export default function Dashboard() {
  const [transactions, setTransactions] = useState([]);

  const [amount, setAmount] = useState("");
  const [type, setType] = useState("expense");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Other");
  const [date, setDate] = useState("");

  const [editId, setEditId] = useState(null);
  const [editAmount, setEditAmount] = useState("");
  const [editType, setEditType] = useState("expense");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("Other");
  const [editDate, setEditDate] = useState("");

  const [filterCategory, setFilterCategory] = useState("All");
  const [filterStart, setFilterStart] = useState("");
  const [filterEnd, setFilterEnd] = useState("");

  const [searchQuery, setSearchQuery] = useState("");

  // keep a ref to latest transactions for event handlers that may be mounted once
  const transactionsRef = useRef(transactions);
  useEffect(() => { transactionsRef.current = transactions; }, [transactions]);

  async function loadTransactions() {
    try {
      const res = await fetch(`${API}/transactions`, { credentials: "include" });
      if (res.status === 401) {
        alert("Session expired. Please login again.");
        window.location.href = "/login";
        return;
      }
      const data = await res.json();
      // Normalize: ensure date is a YYYY-MM-DD string or empty
      const normalized = (Array.isArray(data) ? data : []).map((d) => ({
        ...d,
        date: d && d.date ? (typeof d.date === "string" ? d.date : new Date(d.date).toISOString().slice(0, 10)) : "",
      }));
      // reverse so newest appear first
      setTransactions(normalized.reverse());
    } catch (err) {
      console.error("load error", err);
    }
  }

  // -----------------------------------------
  // 🔥 EXPORT FUNCTIONS (use latest transactionsRef)
  // -----------------------------------------

  const exportPDF = async () => {
    try {
      const el = document.querySelector(".main-container");
      if (!el) { alert("Page not ready"); return; }

      const canvas = await html2canvas(el, { scale: 2 });
      const img = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const props = pdf.getImageProperties(img);
      const w = pdf.internal.pageSize.getWidth();
      const h = (props.height * w) / props.width;

      pdf.addImage(img, "PNG", 0, 0, w, h);
      pdf.save("budget-tracker.pdf");
    } catch (e) {
      console.error(e);
      alert("PDF export failed");
    }
  };

  const exportCSV = () => {
    try {
      const exportData = transactionsRef.current || [];
      if (!exportData.length) return alert("No transactions");

      const rows = exportData.map(t => ({
        id: t.id,
        date: t.date,
        type: t.type,
        category: t.category,
        description: t.description,
        amount: t.amount
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Transactions");

      const csv = XLSX.write(wb, { bookType: "csv", type: "array" });
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      saveAs(blob, "transactions.csv");
    } catch (e) {
      console.error(e);
      alert("CSV export failed");
    }
  };

  const exportExcel = () => {
    try {
      const exportData = transactionsRef.current || [];
      if (!exportData.length) return alert("No transactions");

      const rows = exportData.map(t => ({
        id: t.id,
        date: t.date,
        type: t.type,
        category: t.category,
        description: t.description,
        amount: t.amount
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Transactions");

      const xlsx = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([xlsx], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      });

      saveAs(blob, "transactions.xlsx");
    } catch (e) {
      console.error(e);
      alert("Excel export failed");
    }
  };

  // -----------------------------------------
  // 🔥 EVENT LISTENERS (attach ONCE)
  // -----------------------------------------
  useEffect(() => {
    const onExportPDF = () => exportPDF();
    const onExportCSV = () => exportCSV();
    const onExportExcel = () => exportExcel();

    window.addEventListener("exportPDF", onExportPDF);
    window.addEventListener("exportCSV", onExportCSV);
    window.addEventListener("exportExcel", onExportExcel);

    // initial load
    loadTransactions();

    return () => {
      window.removeEventListener("exportPDF", onExportPDF);
      window.removeEventListener("exportCSV", onExportCSV);
      window.removeEventListener("exportExcel", onExportExcel);
    };
    // intentionally empty deps so handlers attach once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -----------------------------------------
  useEffect(() => {
    function handleSearch() {
      setSearchQuery(localStorage.getItem("searchQuery") || "");
    }
    window.addEventListener("searchUpdated", handleSearch);
    return () => window.removeEventListener("searchUpdated", handleSearch);
  }, []);

  async function addTransaction() {
    if (!amount) { alert("Please enter amount"); return; }
    const amt = parseFloat(amount);
    if (Number.isNaN(amt)) { alert("Amount must be a number"); return; }

    try {
      const res = await fetch(`${API}/transactions`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amt,
          type,
          description,
          category,
          date: date || new Date().toISOString().slice(0, 10),
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(()=>({message:"Server error"}));
        alert(d.message || "Failed to add transaction");
      } else {
        setAmount(""); setDescription(""); setDate(""); setCategory("Other");
        await loadTransactions();
      }
    } catch (e) {
      console.error("add error", e);
      alert("Network error");
    }
  }

  async function deleteTransaction(id) {
    if (!safeConfirm("Delete this transaction?")) return;
    try {
      await fetch(`${API}/transactions/${id}`, { method: "DELETE", credentials: "include" });
      await loadTransactions();
    } catch (e) {
      console.error("delete error", e);
      alert("Failed to delete");
    }
  }

  function startEdit(t) {
    setEditId(t.id);
    setEditAmount(t.amount);
    setEditType(t.type);
    setEditDescription(t.description || "");
    setEditCategory(t.category || "Other");
    setEditDate(t.date ? t.date.slice(0, 10) : "");
  }

  async function saveEdit(id) {
    const amt = parseFloat(editAmount);
    if (Number.isNaN(amt)) { alert("Amount must be a number"); return; }
    try {
      const res = await fetch(`${API}/transactions/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amt,
          type: editType,
          description: editDescription,
          category: editCategory,
          date: editDate || new Date().toISOString().slice(0, 10),
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(()=>({message:"Server error"}));
        alert(d.message || "Failed to update");
      } else {
        setEditId(null);
        await loadTransactions();
      }
    } catch (e) {
      console.error("edit error", e);
      alert("Network error");
    }
  }

  function applyDateFilter() {
    let filtered = [...transactions];
    if (filterStart) filtered = filtered.filter((t) => new Date(t.date) >= new Date(filterStart));
    if (filterEnd) filtered = filtered.filter((t) => new Date(t.date) <= new Date(filterEnd));
    setTransactions(filtered);
  }

  function resetFilter() {
    setFilterStart(""); setFilterEnd(""); setFilterCategory("All"); loadTransactions();
  }

  const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const balance = totalIncome - totalExpense;

  const visibleList = transactions
    .filter((t) => filterCategory === "All" || t.category === filterCategory)
    .filter((t) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        (t.description || "").toLowerCase().includes(q) ||
        (t.category || "").toLowerCase().includes(q) ||
        String(t.amount).includes(q) ||
        new Date(t.date).toDateString().toLowerCase().includes(q)
      );
    });

  const pieData = [
    { name: "Income", value: totalIncome },
    { name: "Expense", value: totalExpense }
  ];
  const COLORS = ["#00C49F", "rgba(255, 76, 76, 1)"];

  return (
    <div className="main-container">
      {/* SUMMARY */}
      <div className="card">
        <h3 className="h-title">Summary</h3>
        <div className="summary-grid">
          <div className="summary-item">
            <div className="summary-value">₹{totalIncome}</div>
            <div className="tx-meta">Total Income</div>
          </div>
          <div className="summary-item">
            <div className="summary-value">₹{totalExpense}</div>
            <div className="tx-meta">Total Expense</div>
          </div>
          <div className="summary-item">
            <div className="summary-value">₹{balance}</div>
            <div className="tx-meta">Balance</div>
          </div>
        </div>
      </div>

      {/* CHARTS */}
      <div className="card">
        <div className="charts-title-row">
          <h3 className="h-title">Income vs Expense</h3>
          <h3 className="h-title">Transaction Breakdown</h3>
        </div>
        <div className="charts-row">
          <div className="chart-card">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={90} innerRadius={40} paddingAngle={3}>
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={transactions}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="amount" fill="#0b78ff" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ADD */}
      <div className="card">
        <h3 className="h-title">Add Transaction</h3>
        <div className="form-grid">
          <input className="input" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <input className="input" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <select className="select" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
          <select className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option>Salary</option>
            <option>Food</option>
            <option>Travel</option>
            <option>Shopping</option>
            <option>Bills</option>
            <option>Entertainment</option>
            <option>Health</option>
            <option>Rent</option>
            <option>Other</option>
          </select>
        </div>
        <div className="center-row">
          <button className="btn" onClick={addTransaction}>Add</button>
        </div>
      </div>

      {/* FILTERS */}
      <div className="card">
        <h3 className="h-title">Filters</h3>
        <div className="form-grid">
          <select className="select" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="All">All Categories</option>
            <option>Salary</option>
            <option>Food</option>
            <option>Travel</option>
            <option>Shopping</option>
            <option>Bills</option>
            <option>Entertainment</option>
            <option>Health</option>
            <option>Rent</option>
            <option>Other</option>
          </select>

          <input className="input" type="date" value={filterStart} onChange={(e) => setFilterStart(e.target.value)} />
          <input className="input" type="date" value={filterEnd} onChange={(e) => setFilterEnd(e.target.value)} />
        </div>

        <div className="center-row" style={{ marginTop: 14 }}>
          <button className="btn gray" onClick={resetFilter} style={{ marginRight: 10 }}>Reset</button>
          <button className="btn" onClick={applyDateFilter}>Apply</button>
        </div>
      </div>

      {/* TRANSACTION LIST */}
      <div className="card">
        <h3 className="h-title">Your Transactions</h3>

        <ul className="tx-list">
          {visibleList.map((t) => (
            <li key={t.id} className="tx-row">
              <div className="tx-left">
                <div className="tx-title">{t.type.toUpperCase()} — ₹{t.amount}</div>
                <div className="tx-meta">
                  {t.description} • {t.category} • {t.date ? new Date(t.date).toDateString() : "No date"}
                </div>
              </div>

              <div>
                {editId === t.id ? (
                  <>
                    <input className="input small" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} />
                    <select className="select small" value={editType} onChange={(e) => setEditType(e.target.value)}>
                      <option value="expense">Expense</option>
                      <option value="income">Income</option>
                    </select>

                    <select className="select small" value={editCategory} onChange={(e) => setEditCategory(e.target.value)}>
                      <option>Salary</option>
                      <option>Food</option>
                      <option>Travel</option>
                      <option>Shopping</option>
                      <option>Bills</option>
                      <option>Entertainment</option>
                      <option>Health</option>
                      <option>Rent</option>
                      <option>Other</option>
                    </select>

                    <input className="input small" type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} />

                    <button className="small-btn edit" onClick={() => saveEdit(t.id)}>Save</button>
                    <button className="small-btn cancel" onClick={() => setEditId(null)}>Cancel</button>
                  </>
                ) : (
                  <>
                    <button className="small-btn edit" onClick={() => startEdit(t)}>Edit</button>
                    <button className="small-btn delete" onClick={() => deleteTransaction(t.id)}>Delete</button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* FOOTER — NOT INCLUDED IN PDF */}
      <div className="footer-screen-only">
        <button
          className="back-to-top-btn"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          Back to Top ↑
        </button>
      </div>

    </div>
  );
}
