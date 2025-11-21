# Budget Tracker

A full-stack personal finance tracker built with **React (Vercel)** and **Flask (Render)**.

## 🚀 Live Demo
**Frontend:** https://budget-tracker-gold-alpha.vercel.app  
**Backend API:** https://budget-tracker-jrbo.onrender.com

---

## 📸 Screenshots

### 📊 Dashboard (Dark Mode)
![Dashboard Dark](Screenshot_2025-11-21_140202.png)

### 📊 Dashboard (Light Mode)
![Dashboard Light](Screenshot_2025-11-21_140053.png)

### 🔐 Login Page
![Login](Screenshot_2025-11-21_135947.png)

### 📝 Register Page
![Register](Screenshot_2025-11-21_135516.png)

### 🔄 Forgot Password
![Forgot Password](Screenshot_2025-11-21_135528.png)

---

## 🛠 Tech Stack

### **Frontend**
- React  
- React Router  
- Recharts  
- HTML2Canvas + jsPDF (PDF Export)  
- Vercel Deployment  

### **Backend**
- Flask  
- Flask-CORS  
- Flask-SQLAlchemy  
- SQLite  
- JWT Auth  
- Render Deployment  

---

## 📦 Features
- User Registration & Login  
- JWT Authentication with HttpOnly Cookies  
- Add / Edit / Delete Transactions  
- Income vs Expense Visualization  
- Category-wise Charts  
- Export: **PDF, Excel, CSV**  
- Dark / Light Theme  
- Calculator Tool  
- Forgot + Reset Password Flow  

---

## 🗂 Project Structure

```
frontend/
  ├── src/
  │   ├── App.js
  │   ├── index.js
  │   ├── components/
  │   │   ├── Login.js
  │   │   ├── Register.js
  │   │   ├── Dashboard.js
  │   │   ├── Navbar.js
  │   │   ├── ForgotPassword.js
  │   │   ├── ResetPassword.js
backend/
  ├── app.py
  ├── requirements.txt
  ├── runtime.txt
  ├── Procfile
  ├── railway.toml
```

---

## ⚙️ Local Setup

### **Backend**
```sh
cd backend
pip install -r requirements.txt
python app.py
```

### **Frontend**
```sh
cd frontend
npm install
npm start
```

---

## 📤 Deployment

### **Frontend (Vercel)**
Push to GitHub → Vercel auto-deploys.

### **Backend (Render)**
GitHub auto-deploy on push.

---

## ⭐ Contribute
PRs are welcome!

---

## 📧 Contact  
**Abhishek Khamkar**  
GitHub: https://github.com/Abhishekkhamkar15
