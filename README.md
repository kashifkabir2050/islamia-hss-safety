# Pakistan Islamia Higher Secondary School
## Safety Management System — Setup Guide

---

## 📁 Project Files

```
school-safety/
├── index.html          — Main application (all pages)
├── style.css           — Complete stylesheet
├── firebase-config.js  — Firebase setup & demo mode
├── app.js              — All logic (CRUD, charts, PDF)
└── README.md           — This file
```

---

## 🚀 Quick Start (Demo Mode)

1. Open `index.html` in any browser
2. System runs in **Demo Mode** (localStorage) automatically
3. Sample data is loaded on first run
4. All features work without internet

---

## 🔥 Firebase Setup (Free Cloud Sync)

### Step 1 — Create Firebase Project
1. Visit: https://console.firebase.google.com/
2. Click **"Add project"**
3. Name: `islamia-hss-safety`
4. Disable Google Analytics → **Create project**

### Step 2 — Enable Firestore Database
1. Left menu → **Build → Firestore Database**
2. Click **"Create database"**
3. Select **"Start in test mode"** → Next
4. Choose server location (e.g., `asia-south1` for Pakistan)
5. Click **Enable**

### Step 3 — Register Web App
1. Project Overview → Click **Web icon `</>`**
2. App nickname: `safety-system`
3. Click **Register app**
4. Copy the `firebaseConfig` object shown

### Step 4 — Update firebase-config.js
Replace this section in `firebase-config.js`:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_REAL_API_KEY",
  authDomain: "islamia-hss-safety.firebaseapp.com",
  projectId: "islamia-hss-safety",
  storageBucket: "islamia-hss-safety.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

### Step 5 — Test
Reload `index.html` — status bar should show **● Firebase Connected** in green.

---

## 🌐 GitHub Pages Deployment (Free Hosting)

### Step 1 — Create GitHub Account
Visit https://github.com and sign up (free)

### Step 2 — Create Repository
1. Click **"New repository"**
2. Name: `islamia-hss-safety`
3. Set to **Public**
4. Click **Create repository**

### Step 3 — Upload Files
```bash
# Option A: Git CLI
git init
git add .
git commit -m "Pakistan Islamia HSS Safety System"
git remote add origin https://github.com/YOUR_USERNAME/islamia-hss-safety.git
git push -u origin main

# Option B: GitHub Web Interface
# Drag and drop all 4 files into the repository
```

### Step 4 — Enable GitHub Pages
1. Repository → **Settings** tab
2. Left menu → **Pages**
3. Source: **Deploy from a branch**
4. Branch: **main** → folder: **/ (root)**
5. Click **Save**
6. Your site: `https://YOUR_USERNAME.github.io/islamia-hss-safety/`

---

## 📊 Features

### Dashboard
- Real-time stats: CCTV logs, First Aid cases, Transport trips, Alerts
- Weekly bar chart (CCTV + First Aid + Transport)
- Instrument status doughnut chart
- Recent activity feed

### CCTV Records
- Daily camera status logs
- Filter by date & status
- Flag faulty/offline cameras
- PDF export

### First Aid
- Incident logging with time
- Injury type classification
- Treatment & referral tracking
- PDF export

### Transport
- Bus trip log per day
- Driver & route tracking
- Student count per trip
- Issue reporting with alerts

### Instruments Monitor
- Equipment condition tracking
- Auto-flagged alerts for Faulty/Maintenance
- Category & condition filters
- PDF export

### Alerts
- Automatic collection of all faults
- Real-time badge counter in sidebar
- Alert cards with details
- PDF alert report

### Reports
- 4 graphical charts (monthly/weekly)
- Full date-range PDF report
- Individual chart PDF download
- Covers all sections

---

## 🔐 Firestore Security Rules (Recommended)

After testing, update rules at:
Firebase Console → Firestore → Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      // Add authentication later
      allow read, write: if true; // For school network use
    }
  }
}
```

---

## 📱 Browser Support
- Chrome ✅ (recommended)
- Firefox ✅
- Edge ✅
- Safari ✅
- Mobile browsers ✅ (responsive design)

---

## 📞 Support
System developed for Pakistan Islamia Higher Secondary School.
Maintain daily records for audit compliance and student safety.
