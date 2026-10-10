# Architecture Audit & Baseline Discovery Report

**Date:** 2026-10-10  
**Repository Under Audit:** `Serkanbyx/event-booking-system` (Foundation base)  
**License:** MIT (Copyright 2026 Serkan Bayraktar)  
**Audit Status:** Baseline Completed — No Application Code Modified (Discovery Phase)

---

## 1. Executive Summary

This architecture audit evaluates the codebase present in the workspace against the specifications in `EVENT_MANAGEMENT_IDE_AGENT_GUIDE.md` and the four reference README documents (`README (3).md` base, `README (2).md` moderation/inbox, `README (1).md` EventBooker seating/payments, `README(1).md` EventHub discovery).

The inspected repository is a functional, single-event-capacity MERN application with clean module structure, Express 5, React 19, Vite, and Tailwind CSS v4. However, it currently lacks:
- Scoped multi-role organizational models (only global roles `attendee`, `organizer`, `admin` exist).
- Dedicated ticketing tiers, assigned seating, or order/payment lifecycle (payments are not integrated; pricing is a single scalar field on Event).
- Venue booking conflict prevention, floor plans, and physical/vendor resource tracking.
- Agenda, session scheduling, speaker management, and session material repositories.
- Persistent notification inbox, targeted announcements, tasks, and collaboration workflows.
- Sponsorship tiers, sponsor agreements, exhibitor applications, and booth allocations.
- Automated unit and integration test suites (zero test scripts or test files exist).
- PWA manifests and offline caching.

---

## 2. Workspace & Environment Inventory

### 2.1 Workspace Structure
```
event-booking-system-main/
├── .github/
│   └── SECURITY.md
├── assets/
│   └── screenshots/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/ (common, layout, organizer, ui)
│   │   ├── contexts/ (AuthContext, ThemeContext)
│   │   ├── hooks/
│   │   ├── pages/ (Public, Auth, Attendee, organizer/, admin/)
│   │   ├── services/ (axiosInstance, authService, eventService, etc.)
│   │   ├── utils/
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── netlify.toml
├── docs/
│   └── build-guide.md
├── server/
│   ├── config/ (db.js, env.js, swagger.js)
│   ├── controllers/ (admin, auth, event, organizer, registration, upload, user)
│   ├── middlewares/ (auth, errorHandler, rateLimiter, upload, validate)
│   ├── models/ (Event, Registration, User)
│   ├── routes/ (admin, auth, event, organizer, registration, upload, user)
│   ├── templates/ (cancellationEmail, confirmationEmail)
│   ├── uploads/
│   ├── utils/ (AppError, emailService, escapeHtml, escapeRegex, generateToken, seed)
│   ├── validators/ (admin, auth, event, param, query, registration)
│   ├── index.js
│   ├── package.json
│   └── .env.example
├── EVENT_MANAGEMENT_IDE_AGENT_GUIDE.md
├── IDE_AGENT_START_PROMPT.md
├── LICENSE
└── README.md
```

### 2.2 Runtimes & Dependencies
- **Node.js:** `v22.14.0`
- **npm:** `10.9.2`
- **Client Dependencies:**
  - `react`: `^19.2.5`
  - `react-dom`: `^19.2.5`
  - `react-router-dom`: `^7.14.1`
  - `axios`: `^1.15.0`
  - `date-fns`: `^4.1.0`
  - `qrcode.react`: `^4.2.0`
  - `react-hot-toast`: `^2.6.0`
  - `@tailwindcss/vite`: `^4.2.2`
  - `tailwindcss`: `^4.2.2`
  - `vite`: `^8.0.8`
- **Server Dependencies:**
  - `express`: `^5.2.1`
  - `mongoose`: `^9.4.1`
  - `bcryptjs`: `^3.0.3`
  - `jsonwebtoken`: `^9.0.3`
  - `helmet`: `^8.1.0`
  - `cors`: `^2.8.6`
  - `morgan`: `^1.10.1`
  - `express-mongo-sanitize`: `^2.2.0`
  - `express-rate-limit`: `^8.3.2`
  - `express-validator`: `^7.3.2`
  - `multer`: `^2.1.1`
  - `nodemailer`: `^8.0.5`
  - `uuid`: `^13.0.0`
  - `slugify`: `^1.6.9`
  - `swagger-jsdoc`: `^6.2.8`
  - `swagger-ui-express`: `^5.0.1`

---

## 3. Baseline Build & Test Execution Results

| Subsystem | Command Executed | Outcome | Notes |
|---|---|---|---|
| Client Dependencies | `npm install` in `client/` | **Pass** | 73 packages installed, lockfile updated. |
| Client Production Build | `npm run build` (`vite build`) | **Pass** | Built in 6.67s. Output: `dist/assets/index-BgZ_PP7L.css` (87.47 kB), `dist/assets/index-Bnb371kz.js` (711.49 kB). |
| Server Dependencies | `npm install` in `server/` | **Pass** | 189 packages installed cleanly. |
| Server Code Syntax Check | `node -c` across all `.js` files | **Pass** | All controllers, models, routes, middlewares, config files passed syntax validation. |
| Server Automated Tests | `npm test` | **Missing / Fail** | No test runner configured in `server/package.json`; 0 test files in repo. |
| Client Automated Tests | `npm test` | **Missing / Fail** | No test runner configured in `client/package.json`. |
| Database Connection | MongoDB Service Check | **Offline** | Port 27017 inactive locally; automated testing must support `mongodb-memory-server` or configurable test URI. |

---

## 4. Subsystem Audits & Detailed Findings

### 4.1 Authentication & Authorization
- **Implementation:** JWT issued upon login/registration with 7-day validity (`JWT_EXPIRE`). Bearer token attached by Axios interceptor from `localStorage`.
- **Strengths:**
  - Password hashing with bcrypt (salt cost 12).
  - Account lockout after 5 consecutive failed login attempts (`lockUntil` set for 15 minutes).
  - `passwordChangedAt` timestamp invalidates tokens issued before password changes.
  - Role-based route guards (`protect`, `authorize`, `organizerOnly`, `adminOnly`) on backend.
- **Vulnerabilities & Gaps:**
  - Tokens stored in `localStorage` are vulnerable to XSS; no CSRF/HttpOnly cookie option configured.
  - Roles are solely global (`attendee`, `organizer`, `admin`) on the User model. There is no concept of Organizations, scoped Event Staff, Speakers, Sponsors, or Exhibitors.
  - No account recovery / password reset flow with secure one-time expiring tokens.
  - No user suspension/activation administration flow exposed to admins beyond a binary `toggleUserActive` without audit logs.

### 4.2 Data Models & Integrity
- **Current Models:**
  1. `User`: name, email, password, role, avatar, bio, phone, isActive, passwordChangedAt, preferences, loginAttempts, lockUntil.
  2. `Event`: title, slug, description, date, endDate, time, location (venue, address, city, country), capacity, registeredCount, price, currency, category, tags, image, organizer, status (`draft`, `published`, `cancelled`, `completed`), isFeatured, maxRegistrationsPerUser.
  3. `Registration`: user, event, confirmationCode, status (`confirmed`, `cancelled`, `attended`), registeredAt, cancelledAt, ticketType (`standard`, `vip`), notes.
- **Strengths:**
  - Compound unique index on `{ user: 1, event: 1 }` prevents double registration by a single user.
  - Atomic increment via `Event.findOneAndUpdate` with `$expr: { $lt: ['$registeredCount', '$capacity'] }` provides race-safe capacity enforcement for general admission.
- **Architectural Gaps:**
  - **No Order / Payment / Ticket decoupling:** The `Registration` model mixes the concept of an order transaction, payment state, and ticket admission.
  - **No TicketType model:** Prices and capacities are global to the Event; `ticketType` in `Registration` is merely an enum (`standard`, `vip`) without distinct inventory, pricing, or sales windows.
  - **No Seating / FloorPlan:** No assigned seating model or hold reservation system.
  - **Float/Number Price:** `price` is stored as a floating number, not integer minor units (`priceMinor`).
  - **Timezones:** Event only stores `date` as a Date and `time` as a string without an IANA timezone string (e.g. `America/New_York` or `Europe/Istanbul`).
  - **Missing Domain Entities:** Organizations, Venues, VenueBookings, Resources, ResourceAllocations, Sessions, Speakers, SessionMaterials, Notifications, Announcements, Tasks, SponsorshipPackages, SponsorApplications, Exhibitors, Booths, Feedback, AuditLogs.

### 4.3 Capacity, Booking & Payment Workflows
- **Capacity:** Works safely for single general-admission counters via MongoDB atomic operators.
- **Payments:** Purely simulated in current code (`totalRevenue` in `organizerController` is calculated as `price * registeredCount`). There is no Stripe, payment gateway adapter, webhook listener, idempotency key, or refund workflow.
- **Cancellations:** Attendee cancellation decrements `registeredCount` and sets status to `cancelled`. However, event cancellation by an organizer leaves all existing registrations in place without notifying attendees or processing refunds.

### 4.4 Communication & Collaboration
- **Email:** Nodemailer configured for Gmail SMTP. Fails gracefully if unconfigured. Emails are fire-and-forget without retry, persistence, or status tracking.
- **In-App Messaging / Notifications:** Completely absent. No notification inbox, mark-as-read, or persistent announcement feed.
- **Real-Time:** No WebSocket / Socket.io server or client connection configured.
- **Collaboration:** No shared calendars, task assignments, or role-based document storage.

### 4.5 Security & Privacy Controls
- **Headers & Protection:** Express 5 app uses Helmet, CORS with origin whitelist, Mongo sanitization middleware (`express-mongo-sanitize`), and `express-rate-limit` (global, auth, registration, upload, confirmation limits).
- **File Uploads:** Multer with memory storage; MIME validation against JPEG, PNG, WebP, GIF; size limit (5MB); filename randomization and path traversal protection in `deleteImage`.
- **Gaps:**
  - Missing field-level encryption for sensitive webhook/integration secrets.
  - No access restriction on attendee special requirements / dietary needs (fields do not yet exist).
  - No immutable audit logging for security-sensitive administrative operations.

### 4.6 Donor README Cross-Reference & Licensing Audit
- **Base:** `Serkanbyx/event-booking-system` — Verified present. MIT License.
- **Donor A (`README (2).md`):** Mentions moderation, approval/rejection notices, persistent notification inbox, and profile management.
- **Donor B (`README (1).md`):** Mentions EventBooker seat selection/locking, test-mode Stripe checkout, calendar sorting, and reminders.
- **Donor C (`README(1).md`):** Mentions EventHub RSVP model, event search/filter, and discovery.
- **Licensing Directive:** The donor source archives are not provided in the workspace. In accordance with Section 3 of the Guide, all missing features will be designed and implemented cleanly and natively within the base repository without relying on unverified external code.

---

## 5. Identified Code vs README Mismatches

1. **Revenue Tracking:** The base README advertises "revenue tracking", but the implementation only computes `price * registeredCount` via aggregation; there are no transaction logs, discount deductions, refunds, or payment records.
2. **Ticket Tiers:** The `Registration` model allows `ticketType: 'standard' | 'vip'`, but `Event` has only one price and capacity; VIP tickets cannot have separate prices or quotas.
3. **Automated Testing:** The base README implies production-ready reliability, but `package.json` has no test script, test framework (Jest/Vitest/Supertest), or unit/integration test files.
4. **Moderation Status:** The base `Event` lifecycle is `draft → published → cancelled → completed`. Pending approval and rejection workflows described in the specifications are not yet present.

---

## 6. Phase Gate Assessment & Recommendations

- **Baseline Gate Status:** PASSED.
  - Workspace structure and dependencies mapped.
  - Client build confirmed working without error.
  - Server syntax validated.
  - Gaps documented in detail.
  - Ready for Phase 1 (Domain boundaries, state machines, and UX architecture).
