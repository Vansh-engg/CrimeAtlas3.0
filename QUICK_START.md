# 🚀 CrimeAtlas - Quick Start Guide

## Easiest Way to Run (ONE CLICK)

### Windows Users:
**Double-click:** `START.bat`

That's it! Both servers will start automatically.

---

## Manual Start (If needed)

### Terminal 1 - Backend (Port 5000):
```powershell
cd .\backend
.\.venv\Scripts\Activate.ps1
python app.py
```

### Terminal 2 - Frontend (Port 3001):
```powershell
cd .\frontend
npm run dev
```

---

## 📱 Access your app:

| Page | URL |
|------|-----|
| **Dashboard** | http://localhost:3001 |
| **🗺️ Crime Map** | http://localhost:3001/map |
| **🚔 Police Locator** | http://localhost:3001/police |
| **📊 City Insights** | http://localhost:3001/city/mumbai |
| **🎯 Predictions** | http://localhost:3001/predict |

---

## ⏹ Stop the servers:
Close both terminal windows or press `Ctrl+C`

---

## 🔄 Common Issues:

**"Port 3000 is in use"?**
- Automatically uses port 3001 instead ✓

**"No space left on device"?**
- Startup script clears cache automatically ✓

**Backend not connecting?**
- Wait 3-4 seconds after backend starts ✓
