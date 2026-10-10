# IDE Agent — Start Here

Open `EVENT_MANAGEMENT_IDE_AGENT_GUIDE.md` and follow it as the project specification.

You are working in the existing MERN repository described by `Serkanbyx/event-booking-system` (the submitted base README is `README (3).md`). Keep that repository as the foundation. The other submitted READMEs are feature references only: `README (2).md` describes approval/notification/profile workflows, `README (1).md` describes EventBooker seat selection/Stripe/reminders/calendar ideas, and `README(1).md` describes EventHub's lighter RSVP/discovery features. The READMEs are not the donor source code, so inspect any donor repository and licence before reusing implementation code.

**First action: discovery only. Do not modify application code yet.** Inspect the real workspace, map its frontend/backend/models/routes/auth/tests/config, run baseline tests/builds, identify mismatches between code and README, and write/update `docs/architecture-audit.md`, `docs/implementation-plan.md`, and `docs/requirement-traceability.md`.

Then execute the implementation phases in `EVENT_MANAGEMENT_IDE_AGENT_GUIDE.md` one at a time. Before each phase, state the goal and acceptance criteria. After each phase, run tests/builds, fix failures, update the requirement matrix and report exact results. Preserve working code, avoid mass rewrites, don't commit secrets, don't fake unfinished features, and enforce all permissions and business rules on the server.

The final product must cover the original requirements for event planning, attendee registration/ticketing, venues/resources, agendas/speakers, communication/collaboration, sponsorship/exhibitors, analytics/ROI, responsive mobile/PWA use, security/privacy, and unit/integration/UAT testing. Add any essential supporting behaviour such as payment/refund reconciliation, concurrency/idempotency, cancellation policy, audit logs, backups, accessibility, monitoring, and data retention. Follow the full guide for the data model, workflows, phase gates and acceptance criteria.
