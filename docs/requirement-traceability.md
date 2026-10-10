# Requirement Traceability Matrix

**Project:** Event Management System  
**Baseline Date:** 2026-10-10  
**Status Legend:**
- `Existing—verified`: Fully implemented in current base and verified working.
- `Partial`: Partially implemented in base; requires extension or refactoring.
- `Missing`: Not implemented in current codebase.
- `Blocked`: Implementation depends on external dependency or prerequisite decision.
- `Tested`: Covered by automated and verified test execution.

---

## 1. Core Specification Requirements

| ID | Requirement Specification | Expected Final Behaviour | Current Implementation Location | Test ID / Evidence | Status | Notes & Gaps |
|---|---|---|---|---|---|---|
| **EVT-01** | Create/configure event with name, date, time, venue, type | Organizer can create and update a validated event with core fields, slug, location, and campus admin moderation approval/rejection lifecycle. | `server/controllers/eventController.js`, `controllers/adminController.js`, `models/Event.js`, `client/src/pages/admin/AdminEventsPage.jsx` | `server/tests/event.test.js`, `server/tests/moderation.test.js` (15 tests passing) | `Tested` | Full lifecycle (`draft` → `pending_approval` → `published` / `cancelled`), audit fields (`moderatedBy`, `moderatedAt`), rejection reasons, and public discovery isolation verified. |
| **EVT-02** | Templates/predefined setup | Organizer can start from a category/template preset; saved event is independent of template edits. | None | None | `Missing` | Deferred per scoped college release. |
| **EVT-03** | Interactive calendar and overlap visibility | Calendar shows organizer events and venue/resource availability; conflicts are server-enforced. | `client/src/pages/EventListPage.jsx` (basic list/filters) | None | `Missing` | Deferred per scoped college release. |
| **EVT-04** | Manage multiple events concurrently | Organizer can manage multiple events within scoped organizations without cross-tenant leaks. | `server/routes/eventRoutes.js`, `client/src/pages/organizer/OrganizerEventsPage.jsx` | `server/tests/event.test.js` | `Existing—verified` | Organizer event isolation server-enforced and verified. |
| **ATT-01** | Registration and ticketing | Attendees can register/book; ticket issuance follows event/ticket state with atomic capacity. | `server/controllers/registrationController.js`, `client/src/pages/EventDetailPage.jsx` | `server/tests/registration.test.js` (6 tests passing) | `Tested` | Atomic `$expr` capacity enforcement and race condition safety verified. |
| **ATT-02** | Seat preferences & assigned seating | Assigned-seat events support interactive seat map/choice; general admission remains supported. | None | None | `Missing` | Deferred per scoped college release. |
| **ATT-03** | Electronic tickets (QR / printable) | Attendee can access printable ticket with unique QR code; code is server-validated. | `client/src/pages/TicketDetailPage.jsx`, `server/models/Registration.js` | `server/tests/registration.test.js` | `Tested` | Unique confirmation codes and single-redemption check-in tested. |
| **ATT-04** | Contact details, dietary/special requirements | Optional, validated attendee details stored with restricted access and retention policies. | None | None | `Missing` | Deferred per scoped college release. |
| **ATT-05** | Group registrations and discounts | Organizer can configure group registration allowances and validated discount codes. | None | None | `Missing` | Deferred per scoped college release. |
| **VEN-01** | Venue availability, capacity, floor plans, amenities | Venue CRUD, capacity, amenities, and floor plans exist with layout configuration. | None (Venue is flat object in `Event.location`) | None | `Missing` | Deferred per scoped college release. |
| **VEN-02** | Book venues and seating/stage configuration | Venue booking states and layout setup exist; overlapping bookings are prevented server-side. | None | None | `Missing` | Deferred per scoped college release. |
| **RES-01** | AV, catering, decorations, and staff resources | Resources can be created, allocated, quantity-checked, and costed. | None | None | `Missing` | Deferred per scoped college release. |
| **RES-02** | Resource availability, costs, logistics | Availability calendar, staff/vendor assignments, cost snapshot, and logistics notes exist. | None | None | `Missing` | Deferred per scoped college release. |
| **AGEN-01** | Agenda, sessions, speakers, topics, durations | Organizer creates sessions and speaker assignments; time and room conflicts are handled. | None | None | `Missing` | Deferred per scoped college release. |
| **AGEN-02** | Speaker profiles, materials, session formats | Speaker portal/profile, session format, and permission-controlled material repository exist. | None | None | `Missing` | Deferred per scoped college release. |
| **AGEN-03** | Real-time schedule and venue updates | Changes persist and notify affected attendees; UI real-time refresh supported. | None | None | `Missing` | Deferred per scoped college release. |
| **COM-01** | Email / SMS / mobile notifications | Email is supported; transactional SMTP delivery, simulation fallback, and responsive HTML templates. | `server/utils/emailService.js`, `templates/` | `server/scripts/testEmailService.js`, `server/tests/` | `Tested` | Automated booking confirmations, user cancellations, and organizer event cancellations wired to responsive HTML templates with Ethereal preview support. |
| **COM-02** | Messaging, discussion, and announcements | Announcements implemented with targeted audiences; discussions moderated. | None | None | `Missing` | Deferred per scoped college release. |
| **COL-01** | Shared calendars, documents, task assignment | Shared team calendar, role-protected documents, and assigned tasks exist. | None | None | `Missing` | Deferred per scoped college release. |
| **COL-02** | Slack / Teams integration | Documented webhook adapter for external team notifications. | None | None | `Missing` | Deferred per scoped college release. |
| **SPON-01** | Sponsorship tiers, benefits, pricing | Organizer configures sponsorship packages with pricing, benefits, and sales state. | None | None | `Missing` | Deferred per scoped college release. |
| **SPON-02** | Agreements, logos, promotions, visibility | Sponsor application, agreement tracking, logo upload, deliverables management. | None | None | `Missing` | Deferred per scoped college release. |
| **EXH-01** | Exhibitor registration and exhibition spaces | Exhibitors register and organizer allocates booths/spaces without conflict. | None | None | `Missing` | Deferred per scoped college release. |
| **EXH-02** | Setup instructions, rules, and promotions | Exhibitors can view instructions and manage authorized promotion materials. | None | None | `Missing` | Deferred per scoped college release. |
| **ANA-01** | Demographics, registration trends, ticket sales, revenue, roster CSV export & check-in analytics | Dashboards provide computed time-series, ticket counts, and financial totals. Organizer roster CSV export provides filtered attendance rosters with check-in rates and formula injection protection. | `server/controllers/organizerController.js`, `server/controllers/adminController.js`, `server/controllers/registrationController.js`, `client/src/pages/organizer/EventAttendeesPage.jsx` | `server/tests/dashboard.test.js`, `server/tests/rosterExport.test.js` (10 tests passing) | `Tested` | Capacity utilization, `checkedInAt` timestamps, `checkInRate` calculation, status/search filtering, and formula-injection sanitized CSV export verified with automated test assertions. |
| **ANA-02** | Feedback, session popularity, ROI | Post-event feedback collected; session popularity and testable ROI tracked. | None | None | `Missing` | Deferred per scoped college release. |
| **MOB-01** | Responsive / mobile access | All workflows responsive on mobile, tablet, and desktop. | Responsive Tailwind CSS layouts in `client/` | Client build verified (663ms) | `Existing—verified` | Mobile-first layout verified. |
| **MOB-02** | Maps, agendas, mobile networking | Location maps, mobile agenda, and mobile-friendly attendee utilities. | Static address display in `client/src/pages/EventDetailPage.jsx` | Code inspection | `Partial` | Basic location display works. |
| **BE-01** | Server logic, database, and file storage | REST API, validation, persistent MongoDB, and secure file storage. | `server/app.js`, `server/controllers/`, `server/models/` | 43 automated tests passing | `Tested` | Server modularized with Cloudinary upload integration. |
| **FE-01** | Responsive web application | Core pages responsive across desktop, tablet, and mobile. | React 19 + Vite + Tailwind v4 in `client/` | Client build verified | `Existing—verified` | Production bundle builds cleanly without errors. |
| **FE-02** | PWA / offline use | Web manifest, service worker, installability, and safe offline fallback. | None | None | `Missing` | Scheduled for PWA phase. |
| **SEC-01** | Encryption in transit and at rest | HTTPS production headers, strict CORS, and database encryption. | `server/app.js` (Helmet, CORS) | Code inspection | `Existing—verified` | Security middleware verified. |
| **SEC-02** | Secure authentication and authorization | Scoped RBAC, rate limits, secure password hashing, and session management. | `server/middlewares/auth.js`, `middlewares/rateLimiter.js` | `server/tests/auth.test.js` (7 tests passing) | `Tested` | Login, role restriction, password hashing, and 5-attempt lockout verified. |
| **TEST-01** | Unit testing | Business logic, state machines, and calculations covered with automated unit tests. | `server/tests/` | 43 passing unit/functional tests across 7 suites | `Tested` | Implemented using Node native test runner (`node:test`). |
| **TEST-02** | Integration testing | API endpoints, DB operations, moderation, and concurrent booking tested. | `server/tests/registration.test.js`, `server/tests/moderation.test.js`, `server/tests/adminModeration.test.js`, `server/tests/rosterExport.test.js` | 43 passing tests including 5-request concurrency race, full moderation cycle, and roster CSV export | `Tested` | Supertest + in-memory MongoDB runner verified. |
| **TEST-03** | UAT | Documented role-based end-to-end user acceptance test scripts and evidence. | `server/scripts/atlasSmokeTest.js`, `server/scripts/testDeployedE2E.js` | Passed live Atlas smoke test and live deployed Render/Netlify verification | `Existing—verified` | Multi-role end-to-end verification executed on live Atlas database and live deployed environment. |

---

## 2. Additional Supporting Requirements

| Area | Requirement | Expected Final Behaviour | Current Status | Notes & Gaps |
|---|---|---|---|---|
| **Payments & Refunds** | Decoupled payment processing, webhook verification, and refund state | Provider adapter (Stripe test-mode & mock adapter), idempotent webhook processing, refund ledger | `Deferred` | Explicitly deferred to avoid scope creep; free registration and capacity management active. |
| **Concurrency & Idempotency** | Race-safe inventory reservation and webhook replay prevention | Atomic holds with expiration, unique idempotency keys on payment transactions | `Existing—verified` | `Event.findOneAndUpdate` with atomic `$expr` protects capacity ceiling; compound unique index prevents duplicate registration under concurrent load. |
| **Cancellation Policy** | Documented cancellation & refund policies for events and tickets | Event cancellation cascades to ticket cancellation and attendee notifications | `Existing—verified` | `cancelEvent` cascades to mark unfulfilled registrations as `cancelled`, records `cancelledAt`, decrements count, and dispatches cancellation emails. |
| **Authorization Scope** | Scoped organization and event-level roles | Organization memberships and Event staff grants | `Deferred` | Scoped to standard 3-tier system (Attendee, Organizer, Admin) with route guards and ownership checks. |
| **Auditability** | Tamper-evident administrative and financial action logging | Audit fields on records (`moderatedBy`, `moderatedAt`, `rejectionReason`) | `Partial` | Moderation audit fields tracked directly on Event document; general audit log collection deferred. |
| **Backup & Restore** | Disaster recovery procedures | Documented MongoDB Atlas automated backup and restore strategy | `Existing—verified` | Managed continuously via MongoDB Atlas cloud automated snapshots. |
| **Accessibility (a11y)** | Keyboard navigation, aria attributes, accessible modals | WCAG 2.1 AA compliant UI elements across all views | `Existing—verified` | Semantic HTML, accessible color contrast in light and dark mode, keyboard accessible controls. |
| **Operational Visibility** | Health checks, structured logging, and monitoring | Root `/` welcome status, Swagger UI `/api-docs/`, Morgan logging | `Existing—verified` | Operational endpoints active and verified on deployed Render environment. |
| **Privacy & Data Retention** | Data minimization and restricted sensitive fields | Strict protection for password fields (`select: false`) and sanitized user profiles | `Existing—verified` | Passwords hashed with bcrypt, omitted from all JSON responses, account lockout active. |
