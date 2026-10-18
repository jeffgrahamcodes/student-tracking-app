# Hall-Waze

A hall pass system for a real school. Teachers sign students out and back in from a phone or laptop, admins see who's out of class right now and where, and the rules a school actually enforces (like three passes a day) are built in instead of living on a clipboard.

I built it as a teacher, for the building I teach in, which is why most of the features below came from someone asking "can it also...?"

## What it does

**Teachers**

- See only the students in their current class period
- Issue a pass with destination and timestamp; the card shows a running timer and flags anyone out longer than 5 minutes
- Hard limit of 3 passes per student per day, with the count shown before you issue one
- One tap to log the return

**Admins**

- Add and edit students, flag students who require an escort, create classes, assign students to classes
- Upload class schedules straight from the school's Excel export
- Dashboard with a breakdown of student movement

**Superusers**

- Upload a staff roster spreadsheet and bulk-create accounts with roles (teacher, admin, superuser)
- Impersonate any user to troubleshoot what they're seeing
- A Firestore debugging page

## Stack

- **Frontend:** React 19, React Router 7, Material UI 6, Recharts
- **Backend:** Firebase Authentication and Cloud Firestore, with navigation and pages gated by role
- **Data import:** SheetJS (`xlsx`) for schedule and roster uploads
- **Hosting/CI:** Firebase Hosting, with GitHub Actions deploying a preview channel on every PR and production on merge

## Run it

```bash
npm install
npm start
```

You'll need your own Firebase project. Swap its web config into `src/firebase.js`, enable Email/Password auth, and create the Firestore database.

## What I'd do next

- Move bulk account creation into a Cloud Function so no admin credentials ever touch the browser
- Lock down Firestore security rules per role to match the UI restrictions
- Tests around the pass rules, since those are the part a school depends on
