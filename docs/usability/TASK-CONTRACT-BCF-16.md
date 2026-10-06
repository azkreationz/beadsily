# BeadsILY Task Contract: BCF-16

- **Task ID / phase:** `BCF-16` / Phase 3 (Rehearsal & Quality Verification)
- **Business trigger and resulting behavior:** Execute and document the physical usability verification of the BeadsILY 15-Guest Party Kit with a novice adult tester (`KIT-01`). Author the complete instructional system (Host Master Guide, 15 guest quick-cards, unboxing verification checklist), customer support FAQs, operational triage protocols, and transactional email communication copy.
- **Accountable implementer:** Marisol (`marisol-muwiha89`, Customer Experience & Host Journey Lead)
- **Independent reviewer(s):** Pam (`pam-muwic8fg`, Product & Physical Operations Lead), Toby (`toby-muwie8nd`, Independent QA Certifier), Michael (`god`, Manager/Orchestrator)
- **BeadsILY repository / branch / workspace:**
  - Primary Repository: `C:\repositories\beadsily-com`
  - Active Worktree: `C:\repositories\beadsily-com-floor\worktrees\marisol-muwiha89`
  - Active Branch: `agent/marisol-muwiha89`
- **Allowed paths / assets / resources:**
  - `docs/instructions/*`
  - `docs/usability/*`
  - `docs/support/*`
  - `docs/communications/*`
  - `hive/agents/marisol-muwiha89/*`
  - `hive/tasks.json`
- **Read-only source repositories and pinned snapshots:**
  - `turbodepot`: `bd1704c690607cf32972f0ed8eed42897c0d583e`
  - `mysteryboxes.app`: `7e9292ae277fdb2e29af4f9171e3d07f69f41395`
  - `bidbolt.app`: `a59cb79faa2670383bc662c45685f28bc0476fa8`
- **Environment and permissions (read / local edit / staging / production):**
  - Read: All repositories, missions, and shared documents.
  - Local Edit: Documentation and deliverables within `C:\repositories\beadsily-com` and Marisol's worktree.
  - Staging / Production: None (Local documentation and empirical test protocol).
- **Dependencies and owner decisions:**
  - Prerequisites: `BCF-1` (Adopt Mission & Specialist Hires - DONE), `BCF-3` (Component Inventory Intake & BOM - In Progress by Pam).
  - Owner Decisions: 15-guest kit base count (45 finished projects), 75-minute recommended party timeline, spare envelope allowance.
- **Data/state invariants:**
  1. Invariant 1 (`CAT-01`): A 15-guest party kit must strictly yield exactly 45 complete projects (15 pens, 15 keychains, 15 bracelets).
  2. Invariant 2 (`KIT-01`): A novice adult with zero bead-crafting background must be able to complete all 3 projects unassisted in <= 50 minutes.
  3. Invariant 3 (`MYS-06` / `INV-08`): Physical return/replacement workflows must decouple monetary refunds from physical restock; returned open kits require physical inspection.
  4. Invariant 4: No unauthorized monetary compensation or refund promises without supervisor approval.
- **API/database/UI changes:**
  - Standardized customer email copy models for order confirmation, shipping updates, monthly drop teaser, and replacement dispatches.
  - Standardized host instructional card layout for Erin's storefront PDF download and print distribution.
- **Relevant acceptance case IDs:**
  - `KIT-01`: Physical prototype assembly and checklist verification by novice adult.
  - `CAT-01`: 15-person kit with three projects per guest (45 total).
  - `MYS-06`: Damaged/missing contents replacement workflow.
  - `EMAIL-01..04`: Transactional email copy specifications and attachment safety.
- **Tests and evidence required:**
  - Documented usability test report (`KIT-01-USABILITY-VERIFICATION.md`) recording observed times, tensile pull tests (6.8 lbs on bracelet, 6.5 lbs on keychain), and injected shortage recovery.
  - Complete Host Master Guide (`HOST-MASTER-GUIDE-15-GUEST.md`) with unboxing checklist, safety notices, and troubleshooting matrix.
  - Complete Guest Cards (`GUEST-STEP-BY-STEP-CARDS.md`) and Support FAQs (`CUSTOMER-SUPPORT-FAQS-AND-TRIAGE.md`).
- **Physical checks required from a person:**
  - Physical inspection of assembled prototype projects by Pam and Toby.
- **Migration/backup and rollback/reconciliation plan:**
  - Deliverables tracked in Git on branch `agent/marisol-muwiha89` and committed to `C:\repositories\beadsily-com`.
- **Definition of done:**
  - All four core deliverable documents authored and verified.
  - Test evidence packet ready for Toby's `ACCEPTANCE-MATRIX.md` certification.
  - Task updated in `tasks.json`; outbox messages sent to `god`, `pam`, and `toby`.
- **Escalation condition and next independent task:**
  - Escalate to Pam for final physical BOM sign-off.
  - Escalate to Toby for inclusion in master Release Evidence Packet.
  - Next task: Support Erin (`BCF-8` / `BCF-11`) with UI copy tokens and digital guide download integration.
- **Review / release status:** `REVIEW_SUBMITTED` (Pending sign-offs from Pam and Toby).
