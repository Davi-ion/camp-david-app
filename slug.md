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

## 🛡️ 3. Platoon Slugs (16 Official Platoons)

| Platoon Name | Slug / Identifier | Badge Emoji | Theme Color |
| :--- | :--- | :-: | :--- |
| **Alfa** | `alfa` | 🎖️ | `#10B981` |
| **Bravo** | `bravo` | 🛡️ | `#3B82F6` |
| **Charlie** | `charlie` | ⚡ | `#EAB308` |
| **Delta** | `delta` | 🔥 | `#EF4444` |
| **Echo** | `echo` | 🔊 | `#8B5CF6` |
| **Foxtrot** | `foxtrot` | 🦊 | `#F97316` |
| **Golf** | `golf` | ⛳ | `#84CC16` |
| **Kilo** | `kilo` | ⚖️ | `#06B6D4` |
| **Lima** | `lima` | 🦁 | `#D97304` |
| **Mike** | `mike` | 🦅 | `#6366F1` |
| **Oscar** | `oscar` | 👑 | `#A855F7` |
| **Quebec** | `quebec` | ⚓ | `#14B8A6` |
| **Romeo** | `romeo` | ⚔️ | `#EC4899` |
| **Sierra** | `sierra` | 🏔️ | `#64748B` |
| **Tango** | `tango` | 🎺 | `#F59E0B` |
| **Victor** | `victor` | 🏆 | `#22C55E` |

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

### Canonical Role Identifiers
- `ADMIN` (`Super Admin`, `Operations Admin`, `Camp Director`)
- `CAMP_COMMANDER` (`Camp Commander`)
- `DORM_LEAD` (`Dorm Lead`, `Dorm Supervisor`)
- `PLATOON_LEAD` (`Platoon Lead`, `Platoon Leader`)
- `VOLUNTEER` (`Volunteer`, `Staff`)

### Role-to-Slug Permission Matrix

| Role | Allowed Staff Portal Slugs (`/app/*`) | Allowed Console Slugs (`/console/*`) |
| :--- | :--- | :--- |
| **Admin** | `/app`, `/app/profile`, `/app/rollcall`, `/app/programme`, `/app/incidents`, `/app/campers` | **All (15)**: `/console/dashboard`, `/console/activity`, `/console/campers`, `/console/platoons`, `/console/dorms`, `/console/attendance`, `/console/incidents`, `/console/programme`, `/console/drills`, `/console/announcements`, `/console/staff`, `/console/users`, `/console/reports`, `/console/audit`, `/console/settings` |
| **Camp Commander** | `/app`, `/app/profile`, `/app/rollcall`, `/app/programme`, `/app/incidents`, `/app/campers` | **Specific (9)**: `/console/dashboard`, `/console/campers`, `/console/platoons`, `/console/dorms`, `/console/attendance`, `/console/incidents`, `/console/programme`, `/console/drills`, `/console/announcements` |
| **Dorm Lead** | `/app`, `/app/profile`, `/app/rollcall`, `/app/programme`, `/app/incidents`, `/app/campers` | **None** (Access Denied) |
| **Platoon Lead** | `/app`, `/app/profile`, `/app/programme`, `/app/incidents`, `/app/campers` | **None** (Access Denied) |
| **Volunteer** | `/app`, `/app/profile`, `/app/programme`, `/app/incidents` | **None** (Access Denied) |

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
