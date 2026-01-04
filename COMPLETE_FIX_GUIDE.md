# Complete Fix Guide - Theme Toggle & Audit Logs

## Problem Summary
1. Frontend is running but theme toggle not visible
2. Audit logs not loading
3. Need to properly restart servers

---

## Solution: Complete Restart Process

### Step 1: Stop All Running Processes

#### Find and Kill Frontend Process (Port 5173)
```bash
# Find the process
netstat -ano | findstr :5173

# Kill it (replace PID with the number from above)
taskkill /PID <PID_NUMBER> /F
```

#### Find and Kill Backend Process (Port 8899)
```bash
# Find the process
netstat -ano | findstr :8899

# Kill it (replace PID with the number from above)
taskkill /PID <PID_NUMBER> /F
```

---

### Step 2: Restart Backend

```bash
cd C:\Users\user\Desktop\Ap dodcument\HospitalManagementSystem_25612-main
mvn spring-boot:run
```

**Wait for:** "Started HospitalManagementApplication"

---

### Step 3: Restart Frontend

```bash
cd C:\Users\user\Desktop\Ap dodcument\HospitalManagementSystem_25612-main\frontend
npm run dev
```

**Wait for:** "Local: http://localhost:5173/"

---

### Step 4: Open Browser

Go to: **http://localhost:5173**

---

## What You Should See After Restart

### 1. Theme Toggle Button
- **Location**: Top bar, between search and profile
- **Appearance**: A toggle switch with sun/moon icon
- **Function**: Click to switch between light and dark modes

### 2. Audit Logs Page
- **Access**: Click "Audit Logs" in sidebar
- **Should show**: Statistics cards and audit log table
- **No errors**: Should load successfully

---

## Alternative: Use Different Port for Frontend

If you want to use a different port:

### Create vite.config.ts
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174, // Different port
    strictPort: false,
  },
})
```

Then run:
```bash
npm run dev
```

---

## Troubleshooting

### Theme Toggle Not Visible
1. Check browser console (F12) for errors
2. Verify ThemeContext.tsx exists in src/context/
3. Verify ThemeToggle.tsx exists in src/components/common/
4. Hard refresh browser (Ctrl+Shift+R)

### Audit Logs Not Loading
1. Check backend console for "Access Denied" errors
2. Verify you're logged in as ADMIN
3. Check backend is running on port 8899
4. Check browser network tab (F12) for API errors

### Both Servers Running But Not Working
1. Clear browser cache
2. Close all browser tabs
3. Restart browser
4. Try incognito/private mode

---

## Quick Command Summary

### Kill Processes
```bash
# Frontend
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Backend
netstat -ano | findstr :8899
taskkill /PID <PID> /F
```

### Start Backend
```bash
cd C:\Users\user\Desktop\Ap dodcument\HospitalManagementSystem_25612-main
mvn spring-boot:run
```

### Start Frontend
```bash
cd C:\Users\user\Desktop\Ap dodcument\HospitalManagementSystem_25612-main\frontend
npm run dev
```

---

## Expected Results

After following these steps, you should have:

✅ **Theme Toggle Working**
- Visible toggle button in TopBar
- Smooth transition between light/dark modes
- Preference saved in localStorage

✅ **Audit Logs Working**
- Page loads without errors
- Shows statistics (Total Logs, Last 24 Hours, etc.)
- Displays audit log table with all events

✅ **Enhanced Search Working**
- Autocomplete dropdown appears
- Search by ID and name works
- Results are clickable

---

## Files Created for Theme System

1. `frontend/src/context/ThemeContext.tsx` - Theme state management
2. `frontend/src/components/common/ThemeToggle.tsx` - Toggle button component
3. Updated `frontend/src/App.tsx` - Added ThemeProvider
4. Updated `frontend/src/components/layout/TopBar.tsx` - Added toggle button
5. Updated `frontend/tailwind.config.js` - Enabled dark mode

## Files Modified for Audit Logs

1. `src/main/java/.../controller/AuditLogController.java` - Fixed authorization

---

**Follow the steps in order and both features will work!** 🚀
