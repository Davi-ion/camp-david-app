# Camp David 2026 — Slugs Reference Guide

This document outlines all URL routes, entity slugs, role permission keys, and API endpoint slugs used across the Camp David 2026 platform.

---

## 🌐 1. User Portal & Frontend Page Slugs

| Page Name | URL Slug | Description |
| :--- | :--- | :--- |
| **Landing / Hero Page** | `/` | Public landing page with camp introduction and quick portal links |
| **Authentication Login** | `/login` | User login portal for campers and staff |
| **Forgot Password** | `/forgot-password` | Password recovery page |
| **User Dashboard** | `/app` or `/app/dashboard` | Main user portal dashboard for campers & counselors |
| **Campers Directory** | `/app/campers` | Camper lookup and roster |
| **Incidents Reporting** | `/app/incidents` | Public/Staff incident logger |
| **User Profile** | `/app/profile` | Personal profile and assigned platoon info |

---

## 🎛️ 2. Management Console Slugs (`/console/*`)

| Module | URL Slug | Access Level |
| :--- | :--- | :--- |
| **Console Dashboard** | `/console/dashboard` | All Console Users |
| **Activity Feed** | `/console/activity` | All Console Users |
| **Campers Management** | `/console/campers` | Counsellors, Directors, Admins |
| **Platoons Management** | `/console/platoons` | Platoon Leaders, Directors, Admins |
| **Dormitories Management** | `/console/dorms` | Head Counsellors, Directors, Admins |
| **Attendance Tracking** | `/console/attendance` | Platoon Leaders, Counsellors, Admins |
| **Incident Management** | `/console/incidents` | Medical, Platoon Leads, Admins |
| **Camp Programme** | `/console/programme` | All Console Users |
| **Camp Drills** | `/console/drills` | Platoon Leads, Directors, Admins |
| **Announcements** | `/console/announcements` | Directors, Admins |
| **Reports & Analytics** | `/console/reports` | Directors, Admins |
| **Staff Roster** | `/console/staff` | Directors, Admins |
| **User Management** | `/console/users` | Super Admin, Directors |
| **Audit Logs** | `/console/audit` | Super Admin |
| **Console Settings** | `/console/settings` | Super Admin |

---

## 🛡️ 3. Platoon Slugs (16 Tribes)

| Platoon Name | Slug / Identifier | Badge Emoji | Theme Color |
| :--- | :--- | :-: | :--- |
| **Judah** | `judah` | 🦁 | `#EAB308` |
| **Ephraim** | `ephraim` | 🦅 | `#3B82F6` |
| **Asher** | `asher` | ⚔️ | `#10B981` |
| **Naphtali** | `naphtali` | 🔥 | `#EF4444` |
| **Reuben** | `reuben` | 🛡️ | `#6366F1` |
| **Simeon** | `simeon` | 🗡️ | `#8B5CF6` |
| **Levi** | `levi` | ✝️ | `#EC4899` |
| **Issachar** | `issachar` | 🏹 | `#F59E0B` |
| **Zebulun** | `zebulun` | ⚓ | `#14B8A6` |
| **Dan** | `dan` | ⚖️ | `#06B6D4` |
| **Gad** | `gad` | 🛡️ | `#84CC16` |
| **Benjamin** | `benjamin` | 🐺 | `#F97316` |
| **Manasseh** | `manasseh` | 🌿 | `#22C55E` |
| **Joseph** | `joseph` | 👑 | `#A855F7` |
| **Caleb** | `caleb` | 🏔️ | `#64748B` |
| **Joshua** | `joshua` | 🎺 | `#D97304` |

---

## 🏠 4. Dormitory Slugs

| Dorm Name | Slug | Gender | Capacity |
| :--- | :--- | :--- | :--- |
| **LQM1** | `lqm1` | Male | 100 |
| **LQM2** | `lqm2` | Male | 100 |
| **LQF1** | `lqf1` | Female | 100 |
| **LQF2** | `lqf2` | Female | 100 |

---

## 🔐 5. System Roles & Permission Slugs

### Role Slugs
- `super_admin` (`Super Admin`)
- `camp_director` (`Camp Director`)
- `head_counsellor` (`Head Counsellor`)
- `counsellor` (`Counsellor`)
- `platoon_leader` (`Platoon Leader`)
- `medical_staff` (`Medical Staff`)

### Permission Slugs
- `all` — Full system access override
- `view:dashboard` — Access console dashboard
- `view:campers`, `manage:campers` — View / edit camper records
- `view:attendance`, `manage:attendance` — View / record attendance
- `view:incidents`, `manage:incidents` — View / record incident reports
- `view:reports`, `manage:reports` — Access camp reports and analytics
- `view:staff`, `manage:staff` — Access and edit staff records
- `view:schedule`, `manage:schedule` — Access and edit camp programme schedule
- `view:audit` — View system audit log
- `manage:announcements` — Post and broadcast announcements
- `manage:settings` — Update platform settings
- `manage:dorms` — Manage dormitory allocations
- `manage:users` — Manage staff accounts and user credentials

---

## 🔌 6. Backend API Slugs (`/api/*`)

| HTTP Method | API Endpoint Slug | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | API health check status |
| `POST` | `/api/seed` | Seed database initial data |
| `POST` | `/api/auth/login` | User authentication & JWT issuance |
| `POST` | `/api/auth/force-change-password` | Force password reset on first login |
| `GET` | `/api/auth/me` | Fetch current logged-in user profile |
| `GET` | `/api/campers` | Fetch all registered campers |
| `POST` | `/api/campers` | Create new camper profile |
| `PUT` | `/api/campers/:id` | Update camper profile by ID |
| `DELETE` | `/api/campers/:id` | Delete camper profile by ID |
| `GET` | `/api/platoons` | Fetch all 16 platoons |
| `POST` | `/api/platoons` | Create a new platoon |
| `PUT` | `/api/platoons/:id` | Update platoon details |
| `GET` | `/api/dorms` | Fetch all dormitories |
| `POST` | `/api/dorms` | Create a dormitory |
| `GET` | `/api/incidents` | Fetch logged incidents |
| `POST` | `/api/incidents` | Log a new incident report |
| `GET` | `/api/announcements` | Fetch announcements |
| `POST` | `/api/announcements` | Broadcast a new announcement |
| `GET` | `/api/drills` | Fetch camp drills and checklists |
| `POST` | `/api/drills` | Create a new camp drill |
| `GET` | `/api/staff` | Fetch staff roster |
| `GET` | `/api/users` | Fetch user management roster |
| `POST` | `/api/users` | Create staff/user account |
| `GET` | `/api/reports` | Fetch camp summary reports |
| `GET` | `/api/search` | Global search query (`?q=term`) |

---

## 🚨 7. Incident Type & Status Slugs

### Incident Type Slugs
- `medical` — Medical / Health Center alert
- `disciplinary` — Behavioral or disciplinary log
- `security` — Camp security incident
- `facility` — Dorm or infrastructure issue
- `general` — General notification or note

### Incident Status Slugs
- `open` — Incident logged and pending action
- `in_progress` — Under review or medical treatment
- `resolved` — Issue resolved and closed
