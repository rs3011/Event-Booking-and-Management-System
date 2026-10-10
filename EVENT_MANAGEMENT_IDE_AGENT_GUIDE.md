# Event Management System — IDE Agent Implementation Playbook

**Project type:** Full-stack MERN application  
**Base code:** `Serkanbyx/event-booking-system` (the project described in `README (3).md`)  
**Feature references:** the three other submitted READMEs  
**Goal:** evolve the base into a coherent Event Management System that addresses the complete original requirement list, while keeping the existing working code wherever it is sound.

> **Important source limitation:** the inputs supplied for the secondary repositories are READMEs, not their source-code archives. Use those READMEs to identify candidate features and workflows. Do not assume the donor implementations are complete or compatible, and do not copy code until the actual repository, its tests, and its licence have been inspected. The IDE agent must inspect the real base code before planning implementation changes.

---

## 0. How to use this guide

1. Open the **actual base repository** in your IDE. The repository described by the base README is `https://github.com/Serkanbyx/event-booking-system`.
2. Save this file at the repository root as `docs/EVENT_MANAGEMENT_IDE_AGENT_GUIDE.md` (or keep it open as the agent's reference).
3. Paste the **Master Agent Prompt** below into the IDE agent.
4. Ask the agent to execute one phase at a time. It must inspect the workspace first, report its findings, and wait at the phase gates described below. Do not ask it to generate the whole codebase in one huge patch.
5. Keep the requirement traceability matrix and progress checklist updated as implementation proceeds.

The agent may choose a different order for small implementation details when the existing code requires it, but it must not silently omit a requirement or change the project stack.

---

## 1. Master Agent Prompt — paste this into your IDE agent

You are the lead software engineer responsible for evolving the existing MERN Event Booking System into a maintainable, secure, full-featured Event Management System.

### Non-negotiable operating rules

1. **Inspect before editing.** Read the repository tree, root and client/server `package.json` files, environment examples, current models, routes, controllers, middleware, React routes/pages, API services, tests, and README. Run the existing tests/builds where possible. Do not assume the README perfectly reflects the source code.
2. **Preserve the base.** The existing project is the foundation. Reuse working features and established conventions where they are sound. Avoid replacing the whole application or changing all dependencies just to match a preferred architecture.
3. **Use donor READMEs as feature references, not as proof of implementation.** Inspect the actual donor source and licence before porting any code. If the donor source is unavailable or its licence does not permit reuse, implement the behaviour natively in the base project and credit inspirations where appropriate.
4. **Work in phases.** Before each phase, state the objective, files/modules likely to change, and acceptance criteria. Implement the phase, run relevant tests and builds, fix failures, then report the result. Do not proceed past a failed gate without explaining the failure and its risk.
5. **No fake features.** No dead buttons, placeholder APIs presented as complete, hard-coded dashboard numbers, success messages without persisted data, simulated payments represented as real payments, or UI-only security. When an external service is not configured, provide a clearly labelled development/test mode and document its limits.
6. **One source of truth.** Keep one API, one database, one authentication/authorization model, and canonical domain models. Do not duplicate an Event or Booking implementation from each donor project.
7. **Protect existing work.** Do not overwrite `.env`, credentials, user data, or working configuration. Do not commit secrets. Check `git status` before large edits and keep changes logically separated.
8. **Use the existing package manager and lockfiles.** Avoid unnecessary dependency upgrades. Add dependencies only when they materially support a requirement, and explain why.
9. **Validate every privileged action on the server.** Frontend route guards improve UX but are not security controls. Check both role and resource ownership on every protected API operation.
10. **Make data integrity explicit.** Use schema validation, unique indexes, atomic operations or transactions for capacity-sensitive workflows, idempotency for external callbacks, and timezone-aware date handling.
11. **Maintain project documentation.** Update `docs/implementation-plan.md`, `docs/requirement-traceability.md`, API documentation, environment examples, and the README as each phase changes behaviour.
12. **Never claim a test passed unless you ran it.** Report exact commands and outcomes. Distinguish verified behaviour, inferred behaviour, skipped tests, and remaining limitations.

### First task — discovery only

Before writing or changing application code:

- Confirm the repository root and the base project actually present in the workspace.
- Map the existing frontend, backend, data models, auth flow, route list, test setup, and deployment setup.
- Run available baseline tests and production builds; record pre-existing failures.
- Compare existing capabilities with this guide and the submitted READMEs.
- Inspect available licences before adopting donor code.
- Produce a short architecture audit and a gap list, including any conflict between the code and the README.
- Create or update a requirement traceability matrix with statuses `Existing—verified`, `Partial`, `Missing`, `Blocked`, and `Tested`.
- Propose a phase order that preserves working features.

Do not begin broad implementation until this discovery report is complete. Then execute the phases in this guide. If a phase needs a product decision, choose the safest, simplest option consistent with this guide and document it; ask only when the choice would materially change the product or risk destructive data changes.

### Definition of success

The project is complete only when all original functional requirement groups are implemented or explicitly marked as a justified, documented limitation, the role-specific workflows work end-to-end, data survives restarts, security controls are server-enforced, critical workflows have automated tests, and the build/deployment documentation accurately reflects the code.

---

## 2. Product vision and scope

Build a single platform for planning, publishing, operating, and measuring events such as conferences, workshops, concerts, weddings, corporate gatherings, and college events.

### Primary user roles

- **Guest:** browse public events and view public event information.
- **Attendee:** manage profile, register/book, manage tickets, set permitted preferences, receive announcements, view agenda, cancel where policy permits, check feedback/networking features.
- **Organizer:** manage only events and resources within their granted organization/event scope; manage agenda, tickets, attendees, communications, staff/tasks, sponsors/exhibitors, and reports.
- **Event staff/check-in operator:** access the event-day information and check-in functions explicitly assigned to them; no global admin powers.
- **Speaker:** manage speaker profile and their assigned sessions/materials within the allowed scope.
- **Sponsor:** manage sponsorship profile, package, logos/materials and contracted deliverables in the events they sponsor.
- **Exhibitor:** manage booth registration, promotional information, and logistical requirements for assigned events.
- **Administrator:** platform-wide moderation, users/organizations, event oversight, configuration, audit review, and system analytics.

A person can hold more than one role. Avoid encoding a single universal role field as the only way to represent event-level access. The global `User` role may remain for compatibility, but event/organization membership and grants must govern scoped permissions.

### Product principles

- One MERN application organised as a **modular monolith**, not microservices.
- One canonical event model and a clear separation of event, registration/order, payment, ticket, venue, agenda, and operational data.
- Server-authoritative rules for prices, inventory, permissions, booking states, and check-in.
- Accessible responsive design, with PWA/offline behaviour added after core workflows are stable.
- Important messages are persisted. Real-time sockets are a delivery enhancement, not the source of truth.
- All analytics must be derived from persisted domain records, not hard-coded or front-end-only counters.

---

## 3. Source README feature map

Use this map when inspecting the real code. These are claims/features described in the supplied READMEs; they must be verified in the implementation.

### Base: `README (3).md` — Serkanbyx Event Booking System

README describes: React 19, Vite, Tailwind CSS 4, React Router, Axios, Express 5, Mongoose 9, MongoDB, JWT/bcrypt, attendee/organizer/admin roles, event draft/publish/cancel/completed lifecycle, race-safe capacity increment using `findOneAndUpdate` plus `$expr`, email confirmation/cancellation, UUID confirmation codes, QR/printable tickets, organizer analytics and check-in, admin user/event/registration management, image upload, responsive/dark UI, API documentation, rate limiting, validation, NoSQL injection protection and other security controls.

**Instruction:** preserve and audit these features. Do not rewrite them merely to merge a donor README. Inspect the existing authentication storage approach, capacity implementation, payment status assumptions, error handling, indexes, and tests. A README claim is not sufficient evidence that the implementation is safe or complete.

### Donor A: `README (2).md` — Online Event Booking and Management System

README describes: customer/organizer/administrator roles; booking cancellation/history; printable tickets; attendee profile management; organizer approval/rejection notices; admin pending-event approval/rejection; user suspension/activation; notification inbox with mark-read/mark-all-read.

**Use as a reference for:** event moderation workflow, booking cancellation policy, profile page, persistent notification inbox, and user activation/deactivation. Keep the base's role vocabulary consistent (map “Customer” to “Attendee” in the UI/API unless there is a clear reason to change it).

### Donor B: `README (1).md` — EventBooker

README describes: seat selection/locking, Stripe test-mode payment, payment/booking flow, booking history/confirmation, reminder setup, calendar-based event sorting, and admin event creation/dashboard.

**Use as a reference for:** optional assigned-seat inventory, a payment-provider adapter and test-mode checkout, attendee reminders, and calendar-oriented browsing. The README alone does not prove payment/webhook correctness or race-safe seat locking; inspect and test before reuse.

### Donor C: `README(1).md` — EventHub-MERN

README documents: event CRUD, JWT authentication, attendee RSVP management, search/filter, responsive UI, a profile page, and a basic frontend/backend structure. Its README notes possible ambiguity between `backend/` and `server/` directories. Although the description mentions richer interactive possibilities, its feature list does not establish that advanced polls, Q&A, or networking are complete.

**Use as a reference for:** a lightweight RSVP model, event discovery/filtering, profile UX, and optional future attendee interaction. Do not assume its real-time/social features exist until source inspection confirms them.

### Integration and licensing rule

The supplied files are READMEs only. They do not contain the donor source implementations. Inspect each actual repository and its licence before copying code or assets. If a licence is missing/unclear or incompatible, use the README as a functional specification and implement the feature in the base code instead. Preserve required licence/copyright notices for any permitted reuse.

---

## 4. Target technology decisions

Keep the base stack unless the audit identifies a concrete blocker.

- **Frontend:** React, Vite, React Router, the existing Tailwind setup, Axios services, and existing contexts/hooks where sound.
- **Backend:** Node.js and the existing Express version.
- **Database:** MongoDB with Mongoose.
- **Authentication:** retain and audit the current JWT/bcrypt scheme; improve token/session handling based on deployment topology and threat model.
- **Validation:** reuse the existing validator approach consistently for all new routes.
- **File uploads:** extend the existing upload service; use object storage for production where appropriate rather than depending on an ephemeral local filesystem.
- **Email:** extend the existing email service/templates; keep provider credentials out of source control.
- **Payment:** define a provider interface and implement one provider in sandbox/test mode first. The donor README suggests Stripe, but keep the business domain provider-agnostic so another gateway can be added later.
- **Realtime:** add Socket.io only for features that need low-latency updates; always persist important announcements/notifications.
- **PWA:** service worker, manifest, installability, and explicitly bounded offline functionality after primary flows are stable.
- **API documentation:** preserve/update Swagger/OpenAPI if it is already included.
- **Testing:** use existing test tooling if configured; otherwise add appropriate backend unit/integration tests and frontend/component/end-to-end coverage in small increments.

Do not add Redux, a message broker, microservices, Kubernetes, or a second database without a requirement-driven reason.

---

## 5. Architecture and code organisation

Retain the current repo shape (`client/` and `server/`) if that is what the inspected source uses. Extend it consistently rather than performing a gratuitous restructure.

### Backend domain modules

Use the existing `models/`, `controllers/`, `routes/`, `middlewares/`, `validators/`, `utils/`, and `config/` conventions, and split large files by domain as they grow. Recommended logical modules:

- auth and account recovery
- users and profiles
- organizations and memberships
- events, event templates, and publishing/moderation
- venues, venue bookings, floor plans, and availability
- resources, resource bookings, and vendors/services
- ticket types, orders, registrations, tickets, and discounts
- payments, refunds, and provider webhooks
- agenda sessions, speakers, and session materials
- check-in and attendance
- notifications, announcements, messages, and collaboration tasks/documents
- sponsors, packages, exhibitors, and booth allocation
- feedback, analytics, exports, and audit logs

Use controller → service/domain logic → model/repository separation where appropriate. Controllers should handle HTTP adaptation, not contain complicated capacity, payment, or booking algorithms. Use shared error handling and a consistent response/error shape.

### Frontend feature areas

Preserve the base's existing page structure, route guards, contexts, services, reusable UI components, hooks, and theme. Add coherent feature areas for:

- public event discovery and calendar
- attendee account, bookings, tickets, preferences, agenda, notifications, feedback, networking
- organizer overview, event wizard, calendar, venue/resource planning, agenda, attendees/check-in, communications, sponsorship/exhibitors, analytics
- speaker portal
- sponsor/exhibitor portal
- staff check-in view
- admin moderation, user/organization management, platform reports, audit view

Use shared layout, form controls, loading/error/empty states, accessible dialogs, and consistent design tokens. Avoid one giant component per dashboard.

### Architectural invariants

- One `Event` record represents the event itself; an `Order`/`Registration` represents the attendee's transaction/participation; a `Ticket` represents an admission entitlement; a `Payment` represents a provider transaction. Do not overload one document to mean all four things.
- All timestamps use a documented standard (store UTC dates and retain the event's IANA timezone for display/scheduling). Validate start < end.
- All money is stored using integer minor units (recommended) or a precise decimal representation, with an explicit currency. Never use JavaScript floating-point arithmetic as the canonical price ledger.
- Database indexes enforce uniqueness where needed. API validation alone cannot prevent duplicate records under concurrent requests.
- External provider callbacks must be signature-verified, idempotent, and safe to retry.
- Destructive actions and important status changes produce audit records.
- User-supplied HTML, image paths, uploaded files, URLs and documents must be validated and handled safely.

---

## 6. Canonical domain/data model

The agent must inspect the current Mongoose schemas and migrate/extend them incrementally. Do not rename/drop fields without a migration/compatibility plan. The following is the target logical model; fields can be adapted to existing conventions.

### 6.1 Identity and access

**User**
- name, normalized email, password hash, phone (optional), avatar, profile details
- account status: active, suspended, disabled, deletion-pending as needed
- global role or platform capability, created/updated timestamps, password/token invalidation metadata
- notification preferences and privacy/consent settings where applicable

**Organization**
- name, slug, description, logo, contact information, status, owner/creator

**OrganizationMembership**
- organization, user, role (owner/admin/organizer/staff/viewer as needed), permission scope, invitation/status, createdAt
- unique compound index on organization + user

**EventStaffAssignment** (or a permissioned membership model)
- event, user, assigned capabilities such as check-in, agenda edit, attendee export; do not give staff broad organizer rights by default

### 6.2 Event planning

**Event**
- title/name, slug, summary, description, category/type, tags
- organizer/organization, createdBy, status (`draft`, `pending_approval`, `published`, `cancelled`, `completed`, optionally `archived`)
- startAt, endAt, timezone, registrationOpenAt, registrationCloseAt
- venue reference or online/hybrid location details, address, map URL
- capacity snapshot or inventory rule, cover image/media references
- visibility (public/private/unlisted), audience/access requirements
- setup notes/configuration, accessibility details, cancellation policy
- event template reference/source, publishedAt, cancelledAt, createdAt/updatedAt

**EventTemplate**
- category/type, default form/configuration fields, agenda/resource presets; versioned or copied into a new event so updating a template does not silently rewrite existing events

### 6.3 Ticketing and attendee participation

**TicketType**
- event, name, description, ticket category, priceMinor, currency, total capacity, sales start/end, per-user limit, status, optional seat requirement

**Order**
- event, buyer, order reference, items, subtotal/discount/tax/fees/total in minor units, currency
- status such as pending, awaiting_payment, confirmed, failed, expired, cancelled, partially_refunded, refunded
- reservation expiry, idempotency key, timestamps

**OrderItem**
- order, ticket type, quantity, unit price snapshot, discount/tax snapshots, assigned seats where applicable

**Payment**
- order, provider, provider transaction/intent reference, amountMinor, currency, status, webhook/event identifiers, idempotency metadata, paid/refunded timestamps
- never store raw card number, CVC, or sensitive payment credentials

**Ticket**
- order/orderItem, event, ticket type, owner/attendee, unique opaque ticket code, ticket status, optional seat assignment, issuedAt, revokedAt
- code/QR payload must not expose unnecessary PII; server remains authoritative for validation

**Registration** (if needed separately from order/ticket)
- attendee, event, attendee details/preferences, status, registeredAt, cancellation metadata
- Decide whether the existing base `Registration` is the canonical attendance record and link it to order/ticket, rather than duplicating participation state.

**DiscountCode**
- event/organization, code, type (fixed/percentage), value, currency where needed, validity window, max uses, per-user limit, eligible ticket types, active status
- validate on server; reserve/redeem atomically and avoid usage-limit races

**WaitlistEntry** (recommended supporting feature)
- event/ticket type, user/contact, requested quantity, queue position/status, offeredAt/expiry; only add if capacity-release workflow is implemented end-to-end

**AttendeePreference** or restricted attendee fields
- dietary requirements, accessibility/special assistance needs, emergency/contact details only when necessary, privacy scope, retention/deletion policy
- collect only the information needed for the event and restrict attendee-sensitive fields to authorized staff.

### 6.4 Venue and resources

**Venue**
- name, address/location, timezone, max capacity, amenities, accessibility, contact, image/floor-plan references, venue rules, active status

**VenueLayout / FloorPlan**
- venue, name/version, dimensions, sections, seats or layout objects, emergency/accessibility markers; keep layout data validated and versioned

**VenueBooking**
- venue, event, startAt, endAt, setup/teardown buffers, requested layout, status (requested/held/confirmed/rejected/cancelled), booking owner, cost and agreement references
- prevent overlapping confirmed/held bookings. A simple pre-check is not sufficient against concurrent requests. Use a transaction plus an explicit reservation/slot/locking strategy suitable for MongoDB, and test concurrent overlaps.

**Resource**
- organization/owner, type (AV, catering, decoration, furniture, staffing, etc.), name, inventory quantity, unit/cost, location, vendor/service provider, maintenance/availability state

**ResourceBooking / ResourceAllocation**
- event, resource, start/end, quantity, cost snapshot, status, assignee/vendor, logistics notes
- ensure requested quantities and overlapping allocations cannot exceed available inventory.

### 6.5 Agenda and speakers

**Session**
- event, title, summary/topic, session format, room/venue/online link, startAt/endAt, capacity if session-limited, status, ordering, material references

**SpeakerProfile** and **SessionSpeaker**
- profile, bio, photo, organization/title, safe contact visibility, session role (speaker/moderator/panelist), confirmation/status

**SessionMaterial**
- session, owner, title, file reference/URL, MIME type, access scope, version, uploadedAt
- protect drafts/private documents; never allow arbitrary filesystem path access.

Conflict rules must cover session overlaps as specified by product policy (e.g., warn when one speaker is assigned to simultaneous sessions; enforce room capacity/time conflicts when required).

### 6.6 Communication and collaboration

**Notification**
- recipient, event/organization scope, type, title/body or safe template reference, channel, readAt, delivery status, retry metadata, createdAt
- persist first, then attempt email/socket/push delivery. Use a retry/outbox strategy for important messages if appropriate.

**Announcement**
- event, author, audience, severity/type, body, publication/scheduled window, attachment references, status

**Conversation / Message** (optional depending on privacy/product choice)
- participants/scope, membership and permission rules, message content, timestamps, moderation/report status. Avoid building open chat before authorization, retention, and abuse controls are clear.

**EventTask**
- event, title/description, assignee, dueAt, priority, status, checklist, dependencies if needed, createdBy

**SharedDocument**
- event/organization, owner, metadata/storage reference, version, allowed roles, retention status

**IntegrationConfig / WebhookSubscription**
- organization, integration type, encrypted secret/reference to secret manager, subscribed events, status, last success/error. Do not store plaintext credentials in normal Mongo fields.

### 6.7 Sponsorship and exhibition

**SponsorshipPackage**
- event/organization, name/tier, priceMinor/currency, benefits, inventory count, deliverables, sales window, status

**SponsorApplication / SponsorshipAgreement**
- event, sponsor organization/contact, package, status (applied/approved/declined/contracted/fulfilled), agreement/file reference, amount snapshot, deliverable checklist

**ExhibitorProfile / ExhibitorRegistration**
- organization/contact, event, status, booth needs, setup requirements, assets/links

**ExhibitionSpace / BoothBooking**
- event/venue layout, booth code/coordinates/size, utilities/amenities, price, status, exhibitor allocation; unique active allocation constraints

### 6.8 Feedback, analytics and audit

**Feedback**
- event/session, attendee, rating, structured questions, comments, submittedAt, moderation status
- unique policy should prevent duplicate feedback submissions where required.

**EventCost / RevenueEntry** (or ledger-friendly records)
- event, category, amountMinor, currency, type, source, occurredAt, creator and audit metadata. Distinguish actual costs from estimates and refunds.

**AuditLog**
- actor, action, resource type/id, event/organization scope, timestamp, request/correlation ID, safe metadata, outcome
- never log passwords, auth tokens, payment secrets, or unnecessary special-category personal data.

**Analytics should be calculated from source records.** Cache expensive aggregation only with invalidation/rebuild strategy; do not use an editable dashboard number as the authority.

---

## 7. Required business workflows and state rules

### 7.1 Event lifecycle and moderation

1. Organizer saves a draft.
2. Required event details are validated before submission/publishing.
3. If moderation is enabled, submission moves to `pending_approval`; admin approves or rejects with a reason.
4. Approved/published events become public according to visibility and publication window.
5. Organizer can update their permitted fields; significant edits may require reapproval according to policy.
6. Cancellation requires confirmation/reason and triggers a documented attendee-notification and refund decision flow.
7. Completed events become read-only except for authorized reports, attendance corrections, and documented administrative operations.
8. All transitions are validated on the server; never accept arbitrary status strings from a generic update endpoint.

### 7.2 Registration, ticket inventory, payment and refunds

1. Attendee chooses an event/ticket type, quantity, and any permitted seat/preferences.
2. Backend verifies event status, sales window, eligibility, per-user limits, discount eligibility, and capacity.
3. Capacity/seat inventory is reserved atomically with an expiry or held state. Handle multiple concurrent buyers and abandoned checkout.
4. Create a pending order with immutable price/tax/fee snapshots and an idempotency key.
5. For paid orders, initiate checkout through a provider adapter in test mode first. For free orders, skip external payment but use the same order/ticket state machine.
6. Only a verified provider API result or signature-verified webhook can confirm payment. Browser redirects are not proof of payment.
7. Process webhook retries idempotently; duplicate provider events must not duplicate payments, inventory decrements, tickets or emails.
8. On payment success, confirm the order, issue the correct number of unique tickets/registrations, consume discount usage, and schedule confirmation delivery.
9. On failure/expiry, release reservations once; ensure late success callbacks follow a documented recovery/refund/reconciliation path.
10. Cancellation rules must check the event policy and order/ticket status. A refund request is not the same as a completed refund; store provider results and make retries safe.
11. Organizer/admin views must show clear states: pending, paid/confirmed, failed, expired, cancelled, refund pending, partially refunded, refunded.

**Critical tests:** simultaneous attempts for the last inventory unit; duplicate registration; repeated webhook; timeout after provider success; expired reservation with late success; cancellation/refund retry.

### 7.3 Assigned seating

- Use stable seat identifiers scoped to a versioned event layout; venue seats must not be silently reassigned if the layout changes after sales begin.
- Model seat states such as available, temporarily held, sold/confirmed, blocked, and released.
- Enforce unique active seat assignment per event and atomic hold expiry.
- Keep general-admission ticket inventory working for events without seats.
- Do not describe seats as “locked” unless the server enforces the hold and expiry rules under concurrent requests.

### 7.4 Venue and resource booking

- Check event time plus configured setup/teardown buffers.
- Reject incompatible overlaps and insufficient capacities.
- Allow requested/held/confirmed/rejected/cancelled states with authorized transitions.
- Track capacity/quantity, cost, provider, setup configuration, logistics notes and assignments.
- Calendar UI is a view of server-validated bookings; it must not be the only layer preventing conflicts.

### 7.5 Agenda scheduling and real-time updates

- An event can have multiple sessions, rooms, speakers, formats and attached materials.
- Validate start < end, event boundaries, room availability, session capacity and speaker conflicts according to policy.
- Editing/cancelling a published session creates persisted notifications to the affected audience.
- Socket.io/push/email may broadcast updates, but clients must be able to reload the authoritative agenda from the API.

### 7.6 Check-in

- Only authorized staff for that event may scan/check in its tickets.
- Validate code, event, ticket status, order/payment requirements and prior check-in.
- Make check-in atomic so two devices cannot successfully redeem the same ticket concurrently.
- Record staff/user, time, result and useful audit context.
- Decide explicitly whether re-entry is permitted; if it is, represent entries as attendance events rather than overwriting a single boolean.

---

## 8. Step-by-step implementation phases

The agent must not implement every module in one patch. Complete each phase, run its gate tests, update traceability, and then move on. The exact order may be adjusted only when a dependency requires it.

### Phase 0 — Repository audit and baseline

**Tasks**
- Inventory the actual code, package versions, scripts, route tree, models, contexts, services, CSS and deployment assumptions.
- Run current frontend build, backend test suite, lint/type-check scripts, and API health check where possible.
- Test the existing primary workflows manually.
- Review current JWT handling, login lockout, RBAC middleware, validation/sanitization, upload path, CORS, rate limits, email handling, QR flow, capacity logic, and API docs.
- Inspect donor source repositories and licences only if the developer has made them available; record which donor features can be implemented natively if code reuse is not appropriate.

**Deliverables**: `docs/architecture-audit.md`, `docs/implementation-plan.md`, `docs/requirement-traceability.md`.

**Gate**: known current state and baseline failures are documented; no blind large rewrite has begun.

### Phase 1 — Domain boundaries, user stories and UX skeleton

**Tasks**
- Write role-based user stories and acceptance criteria for each original requirement group.
- Define event lifecycle and registration/order/payment/ticket state machines.
- Define the frontend route map, dashboard layout, and shared component patterns.
- Decide organization/event membership and scoped permissions.
- Agree on status values, API response/error format, pagination, filtering, date/time conventions, and naming.

**Gate**: architecture and state-transition diagrams exist; requirements are mapped to modules and tests.

### Phase 2 — Schema, validation, indexes and compatibility

**Tasks**
- Extend existing Mongoose schemas incrementally; preserve fields used by current code.
- Add schema constraints, normalizers, enum definitions, compound indexes and unique indexes.
- Create migration/backfill scripts for existing data when required. Make scripts safe to rerun or clearly mark them one-time and require backup.
- Add test fixtures/seed data with obvious development-only identities.
- Add a data dictionary in `docs/data-model.md`.

**Gate**: models and indexes load; existing records still work; model/validator tests pass; migration path is documented.

### Phase 3 — Identity, organizations and authorization audit

**Tasks**
- Preserve and test signup/login/logout/session restoration/password hashing.
- Review account lockout, brute-force controls, password change and token invalidation.
- Implement role/capability checks for attendee, organizer, admin, event staff, speaker, sponsor and exhibitor as needed.
- Add organization memberships and event-level grants without bypassing existing ownership checks.
- Add account suspension/activation and admin moderation from donor reference.
- Restrict access to personal dietary/accessibility/preferences and attendee exports.

**Gate**: authorization tests show unauthorized users cannot use protected APIs, access another user's tickets, edit other organizations' events, or exceed assigned event-staff scope.

### Phase 4 — Event creation, templates, lifecycle, search and calendar

**Tasks**
- Add complete event fields and server-side validation, image/cover references, timezone support, event type/category, visibility and status.
- Implement draft/save/publish/submit-for-approval/approve/reject/cancel/complete lifecycle.
- Implement approved public listing, details by stable slug/ID, search, filters, pagination and event categories.
- Add event templates or presets based on category; creating from a template copies defaults without creating a live shared dependency.
- Add calendar views and organizer multi-event management.
- Make admin moderation notifications persistent and explain rejection reasons.

**Gate**: all event transitions tested; drafts/private/pending events cannot leak into public results; date range and timezone boundaries are correct.

### Phase 5 — Attendee registration, ticket types, groups and discounts

**Tasks**
- Introduce/complete ticket types and inventory, free registration, multiple quantities, attendee details, booking history and cancellation policies.
- Prevent duplicate registration using database-level constraints and server logic.
- Add capacity-safe atomic reservation and expiry; preserve/improve the base implementation only after race-condition testing.
- Add group registration and discounts (fixed/percentage codes, validity, quantity/user limits).
- Add dietary/accessibility/special-requirement fields as optional and access-restricted data; document who can see them and when to delete them.
- Add waitlist only if offer/expiry/capacity release can be implemented correctly.

**Gate**: free event works end-to-end; capacity and duplicates pass normal and concurrent tests; cancellations release inventory once.

### Phase 6 — Orders, payment, refunds and reconciliation

**Tasks**
- Separate order/payment/ticket state; store currency and integer-minor-unit amounts.
- Implement a payment provider interface, with test-mode integration using the selected provider (Stripe is the candidate from EventBooker README).
- Implement idempotent checkout creation, signed webhook verification, event de-duplication, safe retries, payment status reconciliation and provider timeout handling.
- Add admin/organizer payment views with scoped access; implement refund request and provider refund status if the chosen provider supports it.
- Make local/development “fake payment” visibly test-only and impossible to mistake for a real production success.

**Gate**: no ticket is issued for unverified paid orders; duplicate webhook does not change totals twice; failed/expired/refunded cases are represented correctly. Never use real payment credentials in tests or commit secrets.

### Phase 7 — Tickets, seat selection and check-in

**Tasks**
- Issue a unique opaque ticket for each admitted attendee/seat, linked to order/registration.
- Preserve printable ticket view and QR display; avoid PII in QR payload.
- Add seat layout/version and seat hold state when event requires assigned seating; support general admission otherwise.
- Add event staff check-in interface and atomic single-use redemption/re-entry policy.
- Add exportable attendee list subject to permissions and audit logging.
- Make ticket transfer/reissue/revocation explicit if supported; do not silently change a ticket owner.

**Gate**: valid tickets can be checked in once; invalid, cancelled, unpaid and duplicate tickets are rejected; two scanners racing on one ticket cannot both win.

### Phase 8 — Venues, floor plans and resources

**Tasks**
- Build venue profiles with address, capacity, amenities, accessibility and layout/floor-plan data.
- Build venue calendar/availability and venue booking request/confirmation states.
- Detect event overlap including setup/teardown buffers, with concurrency-safe server enforcement.
- Add layout/configuration options for seating, stage placement and sections; preserve a versioned snapshot for events whose tickets have already sold.
- Build resource inventory/availability and allocation for AV equipment, catering, decorations, furniture and staffing/vendor services.
- Track quantity, cost snapshot, staff/vendor assignment, logistics notes and cancellation/release.

**Gate**: overlapping confirmed venue bookings are prevented under concurrent requests; resource allocations cannot exceed inventory; capacity warnings and setup configuration are visible to organizers.

### Phase 9 — Agenda, sessions, speakers and materials

**Tasks**
- Implement speakers, profiles, session formats, topics, time windows, rooms, materials and speaker-session relationships.
- Validate room/time availability, session durations and event boundaries.
- Warn or prevent double-booked speakers per product policy.
- Give speakers limited access to their own profiles/sessions/materials.
- Publish an attendee agenda and notify affected attendees about schedule/room/cancellation changes.

**Gate**: agenda conflicts are surfaced, edits persist and authorised users receive notification records.

### Phase 10 — Communications, announcements and collaboration

**Tasks**
- Implement a persisted notification inbox with read/mark-all-read, delivery status, retry/error tracking and user preferences.
- Extend existing emails for registration, event approval/rejection, cancellation, schedule changes, reminders and refunds as applicable.
- Add organizer announcements with audience targeting and scheduled publication.
- Add event tasks with assignees, due dates, priorities and status; shared calendar links to event/venue/session records.
- Add secure document repository references with role-based access and versioning/metadata.
- Add real-time delivery using Socket.io only where useful; clients reload from API to recover missed events.
- Evaluate Slack/Teams integration through a small adapter/webhook after core collaboration works; never make platform correctness depend on a third-party integration.
- If direct attendee/speaker chat or forums are built, include blocking/reporting/moderation, access boundaries and retention controls.

**Gate**: notifications persist even when email/socket delivery fails; private announcements/documents are not visible outside the intended audience; retry does not duplicate user-visible records.

### Phase 11 — Sponsorship and exhibitor operations

**Tasks**
- Create sponsorship tiers/packages with prices, benefits, quantities and deliverables.
- Add sponsor application/approval/agreement state, sponsor profiles, logo/promo material uploads and permitted visibility placements.
- Track contracted benefits/deliverables so “sponsorship management” is more than a logo upload.
- Add exhibitor registration, booth/exhibition-space allocation, setup rules/instructions, utility/access requirements and promotion fields.
- Prevent duplicate/overlapping booth allocations and respect exhibitor visibility permissions.
- Notify sponsor/exhibitor users about approval and deadlines.

**Gate**: organizer can configure packages, approve an application, allocate an available booth, and see status/deliverables; sponsors/exhibitors cannot manage other parties' records.

### Phase 12 — Analytics, reports, feedback and ROI

**Tasks**
- Build analytics from persisted records: registration trends over time, attendee counts/demographics only where lawful/necessary, ticket type sales, revenue, refunds, cancellation, attendance/no-shows, session popularity and feedback.
- Add feedback forms and prevent duplicate submissions per configured policy.
- Track actual vs estimated event costs and revenue; document ROI formula used by the dashboard and how refunds/taxes/fees are treated.
- Add CSV export and print-friendly reports with permission checks and safe spreadsheet-cell escaping.
- Handle empty datasets, large date ranges, timezone boundaries and pagination/aggregation performance.

**Gate**: each dashboard KPI can be traced to a query and has a test with known sample data; reports respect the event's access boundaries.

### Phase 13 — Mobile responsiveness, PWA and offline behaviour

**Tasks**
- Audit all critical routes at mobile/tablet/desktop sizes and keyboard/screen-reader flows.
- Add web app manifest, icons, service worker, installability and an offline fallback page.
- Cache only safe public event details and agenda content with explicit cache expiry/invalidation.
- Define offline support carefully: do not silently accept offline registration/payment. If offline check-in is required, design signed/limited offline credentials, duplicate reconciliation and conflict handling as a separate security-reviewed feature; otherwise clearly require connectivity for check-in.
- Add accessible map/location and calendar information; networking features must remain usable on mobile.

**Gate**: installability works in supported browsers; safe public content behaves as documented offline; private user data and auth tokens are not cached improperly.

### Phase 14 — Security, privacy, reliability and operations hardening

**Tasks**
- Review OWASP-style risks: broken access control/IDOR, injection, XSS, CSRF depending on auth method, insecure uploads, SSRF through external URLs, brute force, mass assignment, sensitive logging, rate abuse and exposed secrets.
- Validate and sanitise all inputs; use allow-listed fields for updates; encode output appropriately; keep secure HTTP headers and strict CORS origins.
- Review password hashing, session/token expiry/revocation, login lockout, password reset token expiry/one-time use and account enumeration.
- Use HTTPS in production, encryption at rest through managed DB/storage, secret manager/environment variables, least-privilege credentials and dependency scanning.
- Establish database backups and run a restore drill; define data retention/export/delete policies.
- Audit important admin, payment, refund, event publication, user suspension, data exports, and check-in actions.
- Add health/readiness checks, structured logs, correlation IDs, error monitoring, graceful shutdown, and operational alerts.
- Set limits on request bodies, pagination, file uploads, query complexity, and report export range.

**Gate**: security checklist and tests pass; secrets are absent from git; backup/restore, health checks and documented incident/recovery steps exist.

### Phase 15 — End-to-end QA, UAT, documentation and release

**Tasks**
- Run all backend tests, frontend tests, lint/build scripts, API contract tests, and supported browser E2E flows.
- Test the full journey for each role: guest, attendee, organizer, staff, speaker, sponsor/exhibitor and admin.
- Run negative tests and concurrent booking tests, including all failure states.
- Prepare test data that is clearly marked as demo data and never contains real attendee personal information.
- Update README, architecture diagram, ER/domain diagram, API documentation, setup/deployment guide, user/admin manual, known limitations, licence attributions and release notes.
- Confirm environment variable examples include descriptions and safe placeholders only.

**Gate**: production build succeeds; all critical requirements are `Tested` or recorded with an explicit blocker/limitation and owner; no critical known defect is hidden from release notes.

---

## 9. API resource map

Keep existing API naming if already established; adapt this map to the actual base and document the final OpenAPI contract. Every modifying route needs authentication, schema validation, permission checks, and consistent errors.

- `/api/auth/*` — register, login, logout/session, current user, profile, password lifecycle
- `/api/users/*` — profile and personal settings
- `/api/organizations/*` — organization, memberships, invitations and scoped roles
- `/api/events/*` — public list/search/details, create/update, submit/approve/reject, publish/cancel/complete, templates, stats
- `/api/events/:eventId/ticket-types/*` — ticket type setup and availability
- `/api/orders/*` — checkout/order creation, owned order detail, cancellation/refund request
- `/api/payments/*` — checkout session and verified webhooks; webhooks use provider signature validation and idempotency
- `/api/registrations/*` — attendee participation, own history/cancel, organizer attendee management
- `/api/tickets/*` — owned ticket retrieval, safe public validation where necessary, revocation/transfer if supported
- `/api/check-in/*` — authorized scan/redeem and attendance logs
- `/api/venues/*`, `/api/venue-bookings/*`, `/api/floor-plans/*`
- `/api/resources/*`, `/api/resource-bookings/*`
- `/api/sessions/*`, `/api/speakers/*`, `/api/session-materials/*`
- `/api/notifications/*`, `/api/announcements/*`, `/api/tasks/*`, `/api/documents/*`, optional `/api/messages/*`
- `/api/sponsorship-packages/*`, `/api/sponsor-applications/*`, `/api/exhibitors/*`, `/api/booths/*`
- `/api/feedback/*`, `/api/analytics/*`, `/api/reports/*`
- `/api/admin/*` — moderation, user/org management, system reports, audit views
- `/api/health` — health/readiness as appropriate

Do not expose an unauthenticated endpoint that returns private attendee lists, payment details, event drafts, internal documents, or arbitrary profile data.

---

## 10. Frontend route/page inventory

Use the existing React Router and route guards. These are target pages/areas, not a requirement to create every page as a separate URL if a better layout is clear.

### Public
- Landing/home with featured and upcoming events
- Discover events with search/filter/category/date/location and calendar/list views
- Event detail: schedule, venue, ticket types, accessibility information, sponsors/exhibitors where public
- Public venue/speaker/organizer profile only when explicitly permitted
- Login, registration, password reset

### Attendee
- Profile and preferences
- My registrations/orders/tickets and printable QR ticket
- Group booking, discount application, seat selector when applicable
- Event agenda, saved sessions and schedule-change notifications
- Notification inbox and preferences
- Feedback/reviews after an event
- Networking or discussion page only if its privacy/moderation model is implemented

### Organizer
- Dashboard with computed stats and upcoming tasks
- Event wizard/edit form and publication/moderation status
- Events list and calendar
- Ticket types, inventory, discount codes, registrations, cancellations/refunds
- Attendee list, check-in and export
- Venue booking, layout/floor plan, resource allocation and cost tracking
- Agenda/session/speaker/material management
- Announcements, notifications, tasks, shared documents
- Sponsor packages/applications/deliverables and exhibitor/booth management
- Feedback, analytics, financial summary and reports

### Event staff
- Assigned events and shift details
- Camera/manual ticket scan, valid/invalid/already-used states
- Narrowly scoped attendee/check-in information

### Speaker/sponsor/exhibitor
- Own profile, assigned event/session/package/booth records, materials/deliverables, instructions, status and event-specific notices

### Admin
- System dashboard with computed data
- User and organization management, account suspension/activation
- Event approval/rejection/moderation and cancellation oversight
- Platform-wide registration/payment status views restricted to authorized admins
- Audit logs and security/configuration status where appropriate

Every page must have loading, error, empty, success and unauthorized states where relevant. Forms must display validation errors accessibly. On mobile, tables should become readable lists/cards or scroll safely.

---

## 11. Security and privacy rules

The agent must turn these into code-level checks and tests, not just document them.

- Check authentication, role, organization/event membership and resource ownership server-side for every protected operation.
- Never trust user-provided `role`, `ownerId`, `eventId`, `price`, `capacity`, `paymentStatus`, `ticketStatus`, `discountAmount` or `isAdmin` fields without server-side calculation/authorization.
- Whitelist fields accepted for create/update to prevent mass assignment.
- Use strong password hashing; protect login/reset endpoints with rate limiting; use single-use expiring password-reset tokens.
- Review whether browser JWTs should be in memory and/or secure HttpOnly cookies given the hosting topology. If bearer tokens remain in localStorage, explicitly mitigate/document the XSS risk and do not put long-lived refresh secrets there. If cookies are used, implement appropriate CSRF protection and correct SameSite/Secure settings.
- Verify external payment webhook signatures and use idempotency keys. Do not store card numbers or CVC.
- Validate uploaded MIME type, extension and file size; generate filenames; disallow traversal/executable content; use authorization-controlled object storage. Do not trust client MIME alone.
- Escape/encode user text in HTML email templates and pages. Avoid unsafe HTML rendering; sanitize only when HTML is truly required.
- Keep strict CORS allow-lists per environment; configure Helmet/CSP; use HTTPS in production.
- Use rate limits by risk level, including authentication, registration, password reset, check-in, file upload and expensive reports.
- Avoid leaking private attendee details, dietary/accessibility notes, speaker contact details, payment data or private documents through logs, URLs, analytics, exports or notifications.
- Define retention, access, correction, export and deletion procedures for personal data and document them.
- Add audit logs for sensitive operations and ensure users cannot alter audit entries.
- Keep secrets and seed passwords in environment/secret manager only. Never leave known default production credentials.

---

## 12. Testing plan and critical scenarios

Use the existing test stack where practical. Add the minimum tooling required to automate critical behaviour. Tests should be deterministic and must not depend on real email delivery, real payments, or production accounts.

### Unit tests
- event lifecycle allowed/disallowed transitions
- date, timezone, duration, pricing, discount and refund calculations
- authorization policy helpers
- ticket/order/payment state transitions
- notification audience selection
- ROI/report calculations

### API/database integration tests
- login and role-protected operations
- owner vs non-owner event edit/delete
- admin approve/reject and account suspension
- unique registration/payment/ticket constraints
- capacity-safe registration under parallel requests
- duplicate/cancelled/expired ticket checks
- booking overlap and resource inventory contention
- signed webhook verification, duplicates and retries
- notification persisted when email/socket delivery fails
- sensitive fields excluded from unauthorized responses
- upload type/size/path protections

### Frontend/component/E2E tests
- public discover → event detail → register/book → confirmation → ticket
- organizer create/edit/publish → attendee registers → dashboard updates
- moderation submit → admin approves/rejects → correct notification appears
- ticket checkout success/failure/cancel/timeout paths
- check-in valid/invalid/already-used ticket
- venue calendar conflict and resource allocation warnings
- agenda schedule change and attendee notification
- sponsor application → organizer approval → booth/package management
- responsive navigation, forms, empty/error states, keyboard-accessible dialogs

### Manual UAT
Write a repeatable script for Guest, Attendee, Organizer, Staff, Speaker, Sponsor/Exhibitor, and Admin. Use synthetic data. Record actual outcomes and defects; do not say UAT passed just because the app loads.

---

## 13. Acceptance criteria from the original requirements

The following matrix is the release contract. The agent must keep a matching table in `docs/requirement-traceability.md` with columns: requirement ID, original requirement, implementation location, test ID, status, evidence/notes.

| ID | Requirement from original specification | Expected final behaviour |
|---|---|---|
| EVT-01 | Create/configure event with name, date, time, venue, type | Organizer can create and update a validated event with all core fields and event timezone. |
| EVT-02 | Templates/predefined setup | Organizer can start from a category/template preset; saved event is independent of later template edits. |
| EVT-03 | Interactive calendar and overlap visibility | Calendar shows organizer events and venue/resource availability; conflicts are explained and server-enforced. |
| EVT-04 | Manage multiple events concurrently | Organizer can manage several events while access remains scoped. |
| ATT-01 | Registration and ticketing | Attendees can register/book; ticket issuance follows event/ticket/payment state. |
| ATT-02 | Seat preferences | Assigned-seat events support seat map/choice; general admission remains supported. |
| ATT-03 | Electronic tickets | Attendee can access printable ticket/QR; code is unique and server-validated. |
| ATT-04 | Contact details, dietary/special requirements | Optional, validated information is stored with restricted access and retention rules. |
| ATT-05 | Group registrations and discounts | Organizer can configure permitted group quantities and validated discount codes. |
| VEN-01 | Venue availability, capacity, floor plans, amenities | Venue CRUD, capacity and amenities exist; layout data is viewable/configurable. |
| VEN-02 | Book venues and seating/stage configuration | Venue booking states and layout/setup config exist; overlapping bookings are prevented. |
| RES-01 | AV, catering, decorations and staff resources | Resources can be created, allocated, quantity-checked and costed. |
| RES-02 | Resource availability, costs, logistics | Calendar/allocation, vendor/staff, cost snapshot and operational notes are available. |
| AGEN-01 | Agenda, sessions, speakers, topics, durations | Organizer creates sessions and speaker assignments; time/room conflicts are handled. |
| AGEN-02 | Speaker profiles/materials/session formats | Speaker portal/profile, session format, and permission-controlled material repository exist. |
| AGEN-03 | Real-time schedule and venue updates | Changes persist and notify affected users; UI refresh/realtime delivery is supported. |
| COM-01 | Email/SMS/mobile notifications | Email is supported; SMS/push is integrated through configured providers or explicitly documented if provider unavailable. |
| COM-02 | Messaging, discussion and announcements | Announcements are implemented; messaging/forums, if included, have participant access/moderation controls. |
| COL-01 | Shared calendars, documents, task assignment | Shared calendar data, role-protected documents and assigned tasks are available. |
| COL-02 | Slack/Teams integration | At least one documented, optional integration adapter/webhook is implemented or accurately listed as a remaining integration, not silently claimed complete. |
| SPON-01 | Sponsorship tiers, benefits, pricing | Organizer configures packages with pricing, benefits, quantity and sales state. |
| SPON-02 | Agreements, logos, promotions, visibility | Sponsor profile/agreement references, upload, deliverables and public placement are managed with permissions. |
| EXH-01 | Exhibitor registration and exhibition spaces | Exhibitors apply/register and organizer allocates booth/space without conflicting assignment. |
| EXH-02 | Setup instructions, rules and promotions | Exhibitors can view event-specific instructions and manage allowed promotional material. |
| ANA-01 | Demographics, registration trends, ticket sales, revenue | Computed dashboards/reports provide useful time-series, ticket, registration and financial totals. |
| ANA-02 | Feedback, session popularity, ROI | Feedback and session attendance/popularity are recorded; ROI method is documented and testable. |
| MOB-01 | Responsive/native mobile access | All core workflows are responsive; a PWA is installable. Native iOS/Android is not required unless explicitly selected. |
| MOB-02 | Maps, agendas, networking | Mobile pages show location/map links, event agenda and networking feature if the chosen scope implements it. |
| BE-01 | Server logic, database and file storage | API, validation, persistent MongoDB data and secure file references work. |
| FE-01 | Responsive web application | Core pages work on desktop, tablet and mobile. |
| FE-02 | PWA/offline use | Installability and safe public content caching/offline fallback work; offline transactions are explicitly handled or not supported. |
| SEC-01 | Encryption in transit and at rest | HTTPS in production and managed encryption at rest are configured/documented. |
| SEC-02 | Secure authentication and authorization | Authentication, scoped RBAC, validation, rate limits, secure sessions/tokens and audit controls are tested. |
| TEST-01 | Unit testing | Business logic and critical calculations are covered. |
| TEST-02 | Integration testing | API, database, booking and provider integration behaviour is tested. |
| TEST-03 | UAT | Documented role-based UAT flows are executed with results recorded. |

### Additional supporting requirements that were missing or understated

These are not all stated explicitly in the original list, but are necessary to make its workflows reliable:

- **Payments/refunds/reconciliation:** the donor README mentions Stripe, but the original specification does not define payments in detail. If charging for tickets, refund and reconciliation behaviour must be specified.
- **Concurrency and idempotency:** ticket, seat, venue, resource and booth inventory must remain correct under simultaneous requests and repeated provider callbacks.
- **Cancellation policy:** event cancellation and attendee cancellation need explicit ticket, inventory, notification, and refund outcomes.
- **Authorization scope:** organization/event ownership and staff grants must be enforced for every resource, not merely by frontend role guards.
- **Auditability:** trace administrative decisions, payment/refund state changes, exports and check-ins.
- **Backup and restore:** define database backup schedule/retention and prove a restore works.
- **Accessibility and usability:** keyboard navigation, labels, focus handling, contrast, readable validation/error states, and responsive tables/forms.
- **Operational visibility:** health checks, structured logs, failure monitoring, and safe error responses.
- **Privacy lifecycle:** data minimization, restricted sensitive attendee fields, retention, deletion/export, and safe logging.
- **Data migration and recovery:** schema changes must not silently destroy or strand existing data.
- **Integration failure behaviour:** email/SMS/socket outage must not roll back a successfully registered attendee or lose the notification record.
- **Disaster/edge cases:** event timezone/DST boundaries, expired reservations, late payment confirmation, duplicate scans, partial refunds, waitlist offer expiry, venue setup buffers.

The agent must distinguish features implemented in the app from third-party account/configuration prerequisites and future integrations.

---

## 14. Completion checklist

### Product and workflows
- [ ] Guest/attendee/organizer/admin flows work end-to-end.
- [ ] Speaker, sponsor, exhibitor and staff scopes are implemented for the features exposed to them.
- [ ] Event template, moderation, cancellation and completion transitions work.
- [ ] Registration, group/discount, ticket and refund states remain consistent.
- [ ] Venue, resource, agenda, sponsor/exhibitor workflows exist as documented.
- [ ] Communication and reporting features show real persisted data.
- [ ] PWA installation and offline limits are tested and documented.

### Engineering quality
- [ ] Existing functionality from the base has been regression-tested.
- [ ] No dead buttons or fake success messages remain.
- [ ] API and UI validation handle malformed/unauthorized requests safely.
- [ ] Race conditions/idempotency critical tests pass.
- [ ] Lint, tests and production builds pass; skipped/pre-existing failures are documented.
- [ ] Environment examples are complete but contain no secrets.
- [ ] Database backup/restore procedure is documented and tested.
- [ ] API/architecture/data dictionary/requirements docs match actual code.
- [ ] Third-party assets and reused code have licence/attribution checks.
- [ ] Final README identifies implemented features, required external accounts, known limitations, deployment steps and test results honestly.

---

## 15. Final instruction to the IDE agent

Build in vertical slices, starting with the base code audit and core event-registration workflow, then expanding by dependency: access model → event lifecycle → inventory/registration → payment/tickets → venue/resources → agenda → communication/collaboration → sponsorship/exhibitors → analytics → PWA → hardening/release.

At the end of every phase, report:

1. What was changed and why.
2. Files/modules changed.
3. Commands/tests run and exact results.
4. Acceptance criteria that passed or failed.
5. Database migrations/configuration required.
6. Remaining risks and the next phase.

If a requirement cannot be implemented safely with the available source or external credentials, do not fake it. Implement the provider-independent interface or safe configuration boundary if appropriate, document the blocker, and keep it visible in the traceability matrix. Continue until every original requirement is implemented and tested, or until each remaining item has a precise, honest blocker and a reproducible next step.
