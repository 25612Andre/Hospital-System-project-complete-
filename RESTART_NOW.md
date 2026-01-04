# Restart Instructions

## ✅ Step 1: Frontend Killed
The frontend process (PID 8152) has been terminated.

## 📋 Next Steps:

### 1. Restart Backend
```bash
cd C:\Users\user\Desktop\Ap dodcument\HospitalManagementSystem_25612-main
mvn spring-boot:run
```
**Wait for:** "Started HospitalManagementApplication"

### 2. Restart Frontend  
```bash
cd C:\Users\user\Desktop\Ap dodcument\HospitalManagementSystem_25612-main\frontend
npm run dev
```
**Wait for:** "Local: http://localhost:5173/"

### 3. Open Browser
Go to: **http://localhost:5173**

---

## 🎯 What You'll See:

### Theme Toggle
- **Location:** TopBar, next to your profile picture
- **Appearance:** Toggle switch with sun ☀️ / moon 🌙 icon
- **Action:** Click to switch between light and dark modes

### Audit Logs
- **Access:** Click "Audit Logs" in the sidebar
- **Should Display:** Statistics cards + audit log table
- **No Errors:** Page loads successfully

---

## ⚡ Quick Commands

```bash
# Backend
cd C:\Users\user\Desktop\Ap dodcument\HospitalManagementSystem_25612-main
mvn spring-boot:run

# Frontend (in new terminal)
cd C:\Users\user\Desktop\Ap dodcument\HospitalManagementSystem_25612-main\frontend
npm run dev
```

---

**Both features will work after restart!** 🚀
