# Hall-Waze: Student Hall Pass Tracker

**Hall-Waze** is a web-based hall pass management system designed for schools to monitor student movement, enforce policies, and provide data insights — all while ensuring a seamless experience for teachers, admins, and superusers.

---

## Features

### For Teachers

- Secure login with role-based access
- Filter students by current class period
- Submit hall passes with student name, destination, and timestamp
- Limit hall pass use to 3 per day per student
- Timer on cards, with alert after 5 minutes
- Prevent use during restricted time windows
- Return button logs return time and removes student from active list

### For Admins

- Add and manage student records
- Upload class schedules via Excel
- Dashboard with student movement pie charts
- Mark students who require an escort
- Access and manage user roles

### For Superusers

- Upload user role spreadsheet (admin, teacher, superuser)
- Bulk-create Firebase Auth accounts for staff
- Impersonate other users for troubleshooting
- Access Firestore debugging page

---

## Folder Overview

```
/src
  ├── components/         → React components (CheckIn, List, Auth, etc.)
  ├── firebase.js         → Firebase config
  └── App.js              → Route layout and access control

/public
  └── index.html          → App entry point

firebase.json             → Firebase Hosting config
firestore.rules           → Firestore access control
```

---

## Tech Stack

- **Firebase** (Auth, Firestore, Hosting)
- **React.js** (Frontend)
- **MUI** (Material UI for design)
- **Chart.js** (Data visualization)
- **XLSX.js** (Excel file handling)

---

## Setup Guide

### 1. Clone the Repo

```bash
git clone https://github.com/jeffgrahamcodes/student-tracking-app.git
cd student-tracking-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Connect Firebase

- Create a Firebase project
- Enable **Authentication (Email/Password)** and **Firestore**
- Replace credentials in `src/firebase.js`

### 4. Run the App Locally

```bash
npm start
```

---

## Deployment Guide

### Deploy to Firebase Hosting

```bash
npm run build
firebase deploy
```

### Connect Custom Domain (e.g. hall-waze.com)

- Go to **Firebase Hosting → Add Custom Domain**
- Follow instructions to update A and TXT records
- Remove any existing conflicting A records (e.g., from Squarespace)

---

## Roles & Access

| Role        | Permissions                                                          |
| ----------- | -------------------------------------------------------------------- |
| `teacher`   | Check in students, track exits/returns, enforce limits               |
| `admin`     | Add students, view dashboard, upload schedule                        |
| `superuser` | All access: upload user roles, bulk create users, impersonate, debug |

---

## Future Features

- Enforce restroom pass windows by grade & period
- Improve mobile UI for tablets/phones
- Alerts when student exceeds hall pass duration
- Downloadable reports and audit history
- Automated syncing with SIS data

---

## Why Hall-Waze?

Designed in collaboration with educators to promote:

- Transparency
- Accountability
- Student safety
- Better data-informed decisions

---

## Created By

**Jeff Graham**
Full-Stack Cloud Developer & Educator
[LinkedIn](https://linkedin.com/in/jeffgrahamcodes)
[GitHub](https://github.com/jeffgrahamcodes)
