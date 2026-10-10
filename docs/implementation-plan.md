# Implementation Plan & Phase Roadmap

**Project:** Event Management System  
**Baseline Date:** 2026-10-10  
**Methodology:** Incremental vertical slices preserving existing working code, server-authoritative validations, and automated verification before each phase gate.

---

## 1. Architectural Strategy & Guiding Principles

1. **Preserve the Working Foundation:**
   - Keep the existing Express 5 backend structure and React 19 + Vite frontend.
   - Maintain compatibility with existing endpoints (`/api/auth`, `/api/events`, `/api/registrations`, `/api/organizer`, `/api/admin`) while introducing new domain modules and enriched response schemas.
2. **Canonical Domain Separation:**
   - Clearly separate:
     - `Event`: Event metadata, lifecycle, venue links, schedule boundaries.
     - `TicketType`: Inventory quotas, tiers (General, VIP, Early Bird), pricing in minor units (`priceMinor`), per-user limits.
     - `Order`: Purchase transaction, reservation hold, discount application, minor unit totals.
     - `Payment`: Gateway transaction, provider intent, webhook idempotency, refund state.
     - `Ticket`: Admittance entitlement, unique opaque verification code, seat assignment, check-in audit.
     - `Organization` & `OrganizationMembership`: Multi-tenant ownership and scoped permissions.
3. **Automated Testing from Day One:**
   - Introduce a lightweight test suite using Node.js native test runner (`node:test`) or Vitest/Jest for fast, dependency-light backend unit/integration tests and in-memory DB testing to verify business logic, race conditions, and role guards.
4. **No Fake Features or Dead Ends:**
   - Every UI button must hit a functional, server-validated API endpoint.
   - External services (Stripe, SMTP, Webhooks) must feature clean test/development adapters with transparent simulation modes.

---

## 2. Phase-by-Phase Roadmap

### Phase 0: Repository Audit & Baseline (Completed)
- **Objective:** Map existing workspace, baseline builds, verify packages, establish requirement traceability matrix, and document architectural gaps.
- **Deliverables:** `docs/architecture-audit.md`, `docs/requirement-traceability.md`, `docs/implementation-plan.md`.
- **Gate:** Baseline documented, client builds verified, server syntax validated, zero breaking changes to base code.

---

### Phase 1: Domain Boundaries, State Machines & UX Skeleton
- **Objective:** Establish canonical domain models, state machines, API contract standards, and frontend routing hierarchy.
- **Scope & Modules:**
  - State machines: Event lifecycle (`draft` → `pending_approval` → `published` → `cancelled` → `completed`), Order lifecycle (`pending` → `confirmed` → `failed` → `refunded`), Ticket lifecycle (`valid` → `checked_in` → `cancelled`).
  - Scoped role definitions: Guest, Attendee, Organizer, Event Staff, Speaker, Sponsor, Exhibitor, Admin.
  - API response and error formatting standards.
  - Setup automated test framework in backend (`node:test` or Vitest) with in-memory database support.
- **Acceptance Criteria:**
  - Documented state transition rules and sequence diagrams in `docs/data-model.md`.
  - Backend test runner configured and capable of running automated tests.

---

### Phase 2: Schema, Validation, Indexes & Compatibility
- **Objective:** Create and extend Mongoose schemas with compound indexes, validation, and backward compatibility.
- **Scope & Modules:**
  - Create new models: `Organization`, `OrganizationMembership`, `TicketType`, `Order`, `Payment`, `Ticket`, `Venue`, `VenueBooking`, `Resource`, `ResourceBooking`, `Session`, `SpeakerProfile`, `SessionMaterial`, `Notification`, `Announcement`, `EventTask`, `SponsorshipPackage`, `SponsorApplication`, `ExhibitorProfile`, `ExhibitionSpace`, `Feedback`, `AuditLog`.
  - Upgrade `Event` model: Add IANA timezone, `pending_approval` status, venue references, accessibility notes, cancellation policies.
  - Upgrade `User` model: Add organization links, suspension status, and account security fields.
  - Create schema tests ensuring compound indexes and field constraints load properly.
- **Acceptance Criteria:**
  - All schemas pass validation tests.
  - Existing database records from base remain valid without breaking changes.

---

### Phase 3: Identity, Organizations & Authorization Audit
- **Objective:** Implement scoped multi-tenant authorization (Organizations, Event Staff assignments) alongside existing authentication.
- **Scope & Modules:**
  - Organizations CRUD, member invite/role assignment (`owner`, `admin`, `organizer`, `staff`, `viewer`).
  - Scoped RBAC middleware: check resource ownership and event-specific permissions.
  - Admin user moderation: account suspension, activation, role assignments with audit logs.
  - Unit & API tests for authorization gates (cross-tenant access denial, staff scope limits).
- **Acceptance Criteria:**
  - Unauthorized users cannot modify foreign events or view private attendee lists.
  - Event staff only possess check-in and session access for explicitly assigned events.

---

### Phase 4: Event Creation, Templates, Lifecycle, Search & Calendar
- **Objective:** Full event lifecycle management with moderation workflows, category templates, full-text search, and calendar views.
- **Scope & Modules:**
  - Event templates/presets for quick creation.
  - Admin approval/rejection workflow with rejection reason notices.
  - Interactive multi-event calendar for organizers and public discovery calendar.
  - Event search, tag filtering, category browsing, and pagination.
- **Acceptance Criteria:**
  - Draft and pending events never leak to unauthenticated public endpoints.
  - Organizer calendar displays events and flags scheduling overlaps.

---

### Phase 5: Attendee Registration, Ticket Types, Groups & Discounts
- **Objective:** Multi-tier ticketing (`TicketType`), group registration, discount codes, and atomic capacity enforcement.
- **Scope & Modules:**
  - Multiple ticket tiers per event with distinct capacities, prices, and sale windows.
  - Atomic ticket inventory hold/reserve with expiration timers.
  - Discount code validation and redemption (fixed / percentage, usage caps).
  - Optional restricted attendee details (dietary, accessibility preferences).
- **Acceptance Criteria:**
  - Concurrent booking tests confirm no overbooking past capacity under parallel requests.
  - Discount codes cannot be redeemed past their maximum usage limit.

---

### Phase 6: Orders, Payment, Refunds & Reconciliation
- **Objective:** Decoupled order and payment architecture with provider adapters (Stripe test-mode & simulated dev mode) and safe refunds.
- **Scope & Modules:**
  - Order creation with integer minor units (`priceMinor`).
  - Payment gateway provider interface and Stripe test-mode / mock adapter.
  - Webhook handling with signature verification and idempotency keys to prevent duplicate processing.
  - Refund request flow with organizer/admin approval and ledger recording.
- **Acceptance Criteria:**
  - Tickets are never issued before payment confirmation.
  - Duplicate webhook triggers do not issue duplicate tickets or double-decrement inventory.

---

### Phase 7: Tickets, Seat Selection & Check-In
- **Objective:** Electronic ticket generation, assigned seating map with atomic holds, and atomic staff check-in.
- **Scope & Modules:**
  - Unique opaque ticket codes with printable and QR views.
  - Interactive seat selector with temporary seat hold and lock expiration.
  - Event staff check-in interface with camera/manual scanning and duplicate prevention.
  - Exportable attendee list with authorization logging.
- **Acceptance Criteria:**
  - A ticket cannot be checked in more than once (atomic state transition).
  - Parallel check-in attempts on the same ticket result in exactly one success and one rejection.

---

### Phase 8: Venues, Floor Plans & Resources
- **Objective:** Comprehensive venue management, layout floor plans, and physical/vendor resource scheduling.
- **Scope & Modules:**
  - Venue profiles, floor plans, and stage/seating configurations.
  - Concurrency-safe venue booking calendar with setup/teardown buffer conflict prevention.
  - Resource inventory (AV equipment, catering, furniture) and allocation tracking.
- **Acceptance Criteria:**
  - Overlapping venue bookings within setup/teardown buffers are rejected on the server.
  - Resource allocations cannot exceed total available physical stock.

---

### Phase 9: Agenda, Sessions, Speakers & Materials
- **Objective:** Multi-track agenda planning, session scheduling, speaker portal, and presentation material management.
- **Scope & Modules:**
  - Session CRUD with rooms, formats, durations, and capacity limits.
  - Speaker profiles and assignment to sessions with conflict detection.
  - Role-protected session materials repository.
  - Attendee interactive agenda view.
- **Acceptance Criteria:**
  - Speaker double-booking warnings and room capacity conflicts are enforced.
  - Schedule changes trigger notifications to registered attendees.

---

### Phase 10: Communications, Announcements & Collaboration
- **Objective:** Persistent notification inbox, targeted organizer announcements, team tasks, and outbound webhooks.
- **Scope & Modules:**
  - Persistent user notification inbox (read/unread/mark-all-read).
  - Organizer announcements with audience targeting (all attendees, specific ticket types, staff).
  - Internal event tasks with assignees, priorities, and deadlines.
  - Slack/Teams outbound webhook notification adapter.
- **Acceptance Criteria:**
  - Notifications persist in the database regardless of SMTP/network delivery status.
  - Private announcements are strictly scoped to targeted audience groups.

---

### Phase 11: Sponsorship & Exhibitor Operations
- **Objective:** Sponsorship tier configuration, agreement management, exhibitor registration, and booth allocation.
- **Scope & Modules:**
  - Sponsorship packages with deliverable checklists and logo placements.
  - Sponsor portal for asset submission and deliverable tracking.
  - Exhibitor booth registration and interactive space allocation.
  - Non-conflicting booth assignment enforcement.
- **Acceptance Criteria:**
  - Two exhibitors cannot be assigned to the same booth space.
  - Sponsors can view and manage only their own contract deliverables.

---

### Phase 12: Analytics, Reports, Feedback & ROI
- **Objective:** Comprehensive reporting derived from persisted records, post-event feedback forms, and ROI calculation.
- **Scope & Modules:**
  - Financial reporting: Gross revenue, net revenue, refunds, discounts, and actual vs estimated costs.
  - Attendee demographics, registration velocity, and check-in attendance rates.
  - Post-event attendee feedback with rating distribution and duplicate prevention.
  - Safe CSV and printable report export.
- **Acceptance Criteria:**
  - All dashboard metrics correlate directly with database query results.
  - CSV exports properly escape formula injection characters (`=`, `+`, `-`, `@`).

---

### Phase 13: Mobile Responsiveness, PWA & Offline Behaviour
- **Objective:** Full responsiveness pass, PWA installability, service worker caching, and offline access to public event agendas.
- **Scope & Modules:**
  - Web App Manifest (`manifest.json`) and app icons.
  - Service worker registration with stale-while-revalidate caching for public event schedules.
  - Offline fallback view for network outages.
  - Strict guard: Transactions (registrations, payments, check-ins) explicitly require online connectivity.
- **Acceptance Criteria:**
  - Application passes PWA installability checks in Chromium.
  - Public event schedules remain readable offline.

---

### Phase 14: Security, Privacy, Reliability & Operations Hardening
- **Objective:** Enterprise security hardening, privacy controls, audit logging, and disaster recovery procedures.
- **Scope & Modules:**
  - Audit logging middleware for sensitive admin, financial, and attendee data operations.
  - Privacy controls: Data minimization and restricted access to dietary/accessibility info.
  - Enhanced health check (`/api/health`) reporting DB and memory status.
  - Database backup and restore drill documentation.
- **Acceptance Criteria:**
  - All privileged actions create immutable audit log entries.
  - Security audit checklist passes OWASP Top 10 guidelines.

---

### Phase 15: End-to-End QA, UAT, Documentation & Release
- **Objective:** Comprehensive end-to-end user acceptance testing across all roles, documentation updates, and final release preparation.
- **Scope & Modules:**
  - Automated integration test execution covering critical paths.
  - Multi-role UAT walkthrough: Guest → Attendee → Organizer → Staff → Speaker → Sponsor → Admin.
  - Update `README.md`, API documentation (Swagger/OpenAPI), and environment variable guides.
- **Acceptance Criteria:**
  - All test suites pass.
  - Client production build succeeds cleanly.
  - Release documentation accurately reflects the codebase without false claims.
