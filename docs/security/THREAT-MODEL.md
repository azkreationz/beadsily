# BeadsILY System Threat Model & Security Specification

**Document Version:** 1.0.0  
**Date:** October 6, 2026  
**Author:** Dwight (`dwight-muwicook`), Security & Privacy Lead  
**Reviewers:** Jim (`jim-muwibr7y`), Toby (`toby-muwie8nd`), Michael (`god`)  
**Mission Reference:** [`MISSION-BEADSILY-COMMERCE.md`](file:///C:/repositories/beadsily-com-floor/missions/MISSION-BEADSILY-COMMERCE.md)  
**Architecture Reference:** [`ADR-001-PLATFORM-TOPOLOGY.md`](file:///C:/repositories/beadsily-com-floor/docs/architecture/ADR-001-PLATFORM-TOPOLOGY.md)  

---

## 1. Executive Summary & Security Principles

BeadsILY is an independent direct-to-consumer commerce platform built on Cloudflare Workers, Pages/Next.js, D1 (SQLite), R2, Cloudflare Queues, and Stripe. The platform supplies premium craft kits, configurable 15+ guest party experiences (e.g. 45 finished items), curated mystery craft boxes, and monthly subscription boxes, alongside local school festival booth sales.

Security is foundational to customer trust, operational continuity, and business survival. The BeadsILY security posture is governed by five immutable principles:

1. **Zero Client Authority:** The client browser is untrusted. All prices, discounts, tax calculations, shipping fees, inventory reservations, mystery allocations, and role permissions are computed and enforced authoritatively on the server.
2. **Explicit Trust Boundaries & Defense-in-Depth:** Every tier boundary (browser, Cloudflare edge, Workers API, background queues, D1 database, third-party APIs) enforces cryptographic verification, input validation, and least privilege. Edge WAF rules never substitute for application-level authorization.
3. **Adult Purchaser & COPPA Safety Invariant:** BeadsILY products are enjoyed by children and families, but the platform is strictly an adult-to-adult commercial transaction system. Account holders and purchasers must be adults (18+). The platform collects **zero** personal identifiable information (PII) of minors. Child personalization names for kit packaging are classified as transient manufacturing BOM attributes, never user profiles.
4. **Idempotent Financial & Inventory Operations:** Webhooks, checkout submissions, and inventory allocations must be replay-proof and race-free. Durable database logging in D1 prevents double charges, duplicate fulfillment, or overselling.
5. **Zero Hardcoded Secrets & Clean Provenance:** All secrets are injected securely via Cloudflare Workers Secrets (`wrangler secret`). No credentials, `.env` files, or external client tokens from reference repositories (`turbodepot`, `mysteryboxes.app`, `bidbolt`) are ever introduced into the BeadsILY codebase.

---

## 2. System Architecture & Trust Boundary Map

The BeadsILY system is partitioned into six distinct security trust zones:

```mermaid
flowchart TD
  subgraph Zone1["Zone 1: Public Untrusted Client"]
    Browser["Customer Browser / Mobile Web"]
    StripeElement["Stripe Embedded Payment Element (iFrame)"]
    TurnstileWidget["Cloudflare Turnstile Widget"]
    AdminBrowser["Staff / Admin Browser"]
  end

  subgraph Zone2["Zone 2: Cloudflare Edge & Perimeter"]
    EdgeWAF["Cloudflare Edge WAF & DDoS Shield"]
    EdgeTurnstile["Turnstile Edge Verification"]
    AccessGateway["Cloudflare Access (Zero Trust Staff Gate)"]
  end

  subgraph Zone3["Zone 3: Application Runtime (Cloudflare Workers)"]
    StorefrontWorker["Storefront Next.js Worker (SSR & Public)"]
    ApiWorker["Core API Route Handlers"]
    AuthMiddleware["Session & RBAC Middleware"]
    OriginGuard["Origin & CSRF Guard"]
  end

  subgraph Zone4["Zone 4: Asynchronous Processing & Queues"]
    CfQueue["Cloudflare Queue (Transactional Events)"]
    OpsWorker["Operations Worker (Queue Consumer)"]
    DLQ["Dead Letter Queue (DLQ)"]
  end

  subgraph Zone5["Zone 5: Authoritative Persistence"]
    D1Database[("Cloudflare D1 (SQLite Ledger & Catalog)")]
    R2Storage[("Cloudflare R2 (Media & Assembly PDFs)")]
  end

  subgraph Zone6["Zone 6: External Trusted Providers"]
    StripeAPI["Stripe API (Payments & Billing)"]
    StripeWebhook["Stripe Webhook Emitter"]
    CfEmailSend["Cloudflare Email Sending (DKIM/SPF)"]
  end

  %% Client to Edge
  Browser -->|Untrusted HTTPS Traffic| EdgeWAF
  TurnstileWidget -->|Client Challenge Response| EdgeTurnstile
  AdminBrowser -->|Staff Login| AccessGateway

  %% Edge to Workers
  EdgeWAF -->|Filtered Request| StorefrontWorker
  EdgeWAF -->|API Calls + Turnstile Token| ApiWorker
  AccessGateway -->|Signed JWT (CF-Access-JWT-Assertion)| ApiWorker

  %% Worker Internal Defense
  ApiWorker --> OriginGuard
  OriginGuard --> AuthMiddleware
  AuthMiddleware -->|Authoritative Query / Atomic Batch| D1Database
  ApiWorker -->|Signed Read / Upload Policy| R2Storage
  ApiWorker -->|Publish Async Event| CfQueue

  %% Queue & Ops
  CfQueue --> OpsWorker
  OpsWorker -->|Update Status / Log Send| D1Database
  OpsWorker -->|Send Transactional Mail| CfEmailSend
  OpsWorker -.->|Retry Exceeded| DLQ

  %% Stripe Integration
  Browser -.->|Direct Cardholder Data| StripeElement
  StripeElement -.->|Tokenized Intent| StripeAPI
  ApiWorker -->|Server-to-Server REST + Idempotency Key| StripeAPI
  StripeWebhook -->|Signed Webhook (stripe-signature)| ApiWorker
```

### Trust Boundary Descriptions

| Boundary | From Zone | To Zone | Threat Vector | Defense Mechanism |
| :--- | :---: | :---: | :--- | :--- |
| **TB-1: Client Ingress** | Zone 1 | Zone 2 | DDoS, scraping, credential stuffing, bot checkout floods | Cloudflare WAF rate limiting, Managed Ruleset, Turnstile challenge tokens |
| **TB-2: Staff Perimeter** | Zone 1 | Zone 2 | Unauthorized admin access, credential theft | Cloudflare Access Zero Trust with MFA; IP allowlists where applicable |
| **TB-3: Edge to Worker** | Zone 2 | Zone 3 | Origin bypass, header spoofing | Cloudflare Service Bindings, strict header validation, Next.js route protection |
| **TB-4: Worker to DB** | Zone 3 | Zone 5 | SQL injection, data corruption, concurrent race conditions | Parameterized SQL queries, D1 batch transactions with zero-row `UPDATE` detection |
| **TB-5: Webhook Ingress** | Zone 6 | Zone 3 | Forged webhooks, payload tampering, replay attacks | Raw body HMAC-SHA256 signature verification (`stripe-signature`), durable idempotency table |
| **TB-6: Queue Ingestion** | Zone 4 | Zone 5/6 | Message replay, malformed poison pill messages, DLQ exhaustion | Typed schema validation (Zod), bounded retry counters (max 5), dead-letter alerting |
| **TB-7: External Email** | Zone 4 | Zone 6 | Spam delivery, spoofing, delivery failure masking | Authenticated CF Email Sending binding, SPF/DKIM/DMARC alignment, verified suppression tracking |

---

## 3. STRIDE Threat Analysis Matrix

| Threat Category | Target Component | Threat Scenario | Impact | Mitigation / Control | Acceptance Ref |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **S**poofing | Turnstile Verification | Bot attacker submits forged or replayed Turnstile token to deplete kit reservations | Inventory exhaustion, legitimate customers blocked | Server-side validation via `https://challenges.cloudflare.com/turnstile/v0/siteverify` with IP binding and single-use nonces stored in ephemeral memory/cache. | `SEC-03`, `INV-01` |
| **S**poofing | Staff Access | Attacker sends requests directly to internal API pretending to be staff | Complete compromise of orders, customer addresses, and inventory | Cloudflare Access JWT validation (`CF-Access-JWT-Assertion`) verified against Cloudflare public keys, combined with application-level session tokens. | `SEC-01`, `SEC-02` |
| **S**poofing | Stripe Webhooks | Attacker sends fake `payment_intent.succeeded` event to trigger order fulfillment | Financial loss, shipping unearned merchandise | Compute HMAC-SHA256 of raw request body against `STRIPE_WEBHOOK_SECRET`. Reject any request failing signature check with HTTP 400. | `PAY-03` |
| **T**ampering | Checkout Cart | Client tampers with product price, guest count, or kit total in POST body | Revenue loss, selling kits below cost | Server recalculates total from product recipe, guest count, and current catalog price in D1. Ignore any client-submitted monetary amounts. | `PAY-01` |
| **T**ampering | Stock Reservation | Two buyers attempt to reserve final 15-guest kit simultaneously | Negative inventory, unfulfillable orders | Atomic multi-row `UPDATE ... WHERE available >= quantity`. If affected rows do not equal required count, execute complete batch rollback. | `INV-01`, `INV-02` |
| **T**ampering | CSV Intake | Attacker or staff uploads CSV with formula injection (`=cmd|' /C...'!A0`) | Command execution on admin spreadsheet export | Sanitize all string fields upon CSV intake and export; prepend single quote `'` to fields beginning with `=`, `+`, `-`, or `@`. | `INV-09` |
| **R**epudiation | Inventory Ledger | Staff member adjusts stock count without audit trail | Unaccounted shrinkage, blame shifting | Append-only movement ledger in D1. Every adjustment requires `actor_id`, `reason_code`, `timestamp`, and `reference_id`. | `INV-08` |
| **R**epudiation | Order Placement | Customer claims they never placed order or was charged twice | Chargebacks, dispute losses | Store Stripe PaymentIntent ID, customer IP (hashed/salted), order snapshot, and idempotency key in D1. | `PAY-02`, `PAY-04` |
| **I**nformation Disclosure | Order Queries | Customer guesses sequential order IDs to view other customers' party kits | PII leakage (names, addresses, party dates) | Use high-entropy UUIDv4 or NanoID for public order keys (`ord_live_...`). Validate session ownership (`order.customer_id === session.customer_id`). | `PAY-05`, `SEC-01` |
| **I**nformation Disclosure | Logging | Application logs error containing raw credit card or full PII | PCI violation, regulatory breach | Structured JSON logger with automated redaction regex for PANs, CVVs, API tokens, and customer emails. | `SEC-03` |
| **I**nformation Disclosure | Child PII | Party kit personalization names stored as permanent child records | COPPA violation, severe privacy exposure | Personalization names are stored strictly as ephemeral order packaging attributes (`bom_item_label`), never as user accounts or searchable child entities. | `SEC-03` |
| **D**enial of Service | Checkout Endpoint | Competitor spawns headless browsers to initiate 1,000 reservations, locking inventory | Inventory starvation, lost sales | Enforce Turnstile challenge on session creation. Set 15-minute strict reservation TTL. Rate limit IP to 5 reservation creations per 10 minutes. | `SEC-03`, `INV-06` |
| **D**enial of Service | Webhook Flooding | Attacker spams webhook endpoint with garbage data to exhaust Worker CPU | Operations worker latency | Check `stripe-signature` header format and length before parsing body. Rate-limit invalid signatures at Cloudflare WAF. | `PAY-03` |
| **E**levation of Privilege | Staff RBAC | Warehouse packer calls API endpoint to issue customer refund or change master prices | Unauthorized cash loss or catalog disruption | Strict RBAC middleware checking user role against route permission matrix. Only `owner` and `support` roles may issue refunds; only `owner` can modify base catalog. | `SEC-01` |
| **E**levation of Privilege | Session Fixation | Attacker supplies pre-set session ID to victim before login | Account takeover | Issue new cryptographically random session token on login (`crypto.getRandomValues(new Uint8Array(32))`). Invalidate old session in D1. | `SEC-02` |

---

## 4. Staff Role-Based Access Control (RBAC) Specification

### Role Hierarchy & Definitions

BeadsILY enforces five mutually exclusive roles for internal and external actors:

1. **`owner` (Full Administrative Authority):**
   - Held by Korry Nelson and authorized business managers.
   - Unrestricted access: catalog pricing, recipe definitions, inventory adjustments, financial reports, refunds, staff account provisioning, and system configuration.
2. **`packer` (Fulfillment & Warehouse Operations):**
   - Staff assembling 15-guest kits, prepacking mystery boxes, and fulfilling shipments.
   - Read access to order packing lists, shipping labels, and recipe assembly specifications.
   - Mutation access restricted to: marking orders `packed`, `shipped`, recording inventory receipt counts, and marking damaged units.
   - **Prohibited:** viewing revenue reports, issuing refunds, modifying retail prices, or deleting inventory records.
3. **`support` (Customer Care Specialist):**
   - Staff assisting customers with order inquiries, address updates, damaged kit replacements, and subscription pauses/skips.
   - Read access to order status, delivery tracking, customer communication history.
   - Mutation access restricted to: updating pre-shipment delivery addresses, re-sending transactional emails, pausing/skipping subscription cycles, and issuing refunds under $100 (subject to daily cap).
   - **Prohibited:** modifying product recipes, changing retail prices, or accessing raw customer billing card details.
4. **`auditor` (Read-Only Independent QA / Compliance):**
   - Held by Toby (`toby-muwie8nd`) and financial/security auditors.
   - Read-only access to all movement ledgers, order records, webhook logs, and error telemetry.
   - **Prohibited:** all mutation operations.
5. **`customer` (Authenticated Storefront Buyer):**
   - Adult purchaser who has established an account or completed a verified guest checkout.
   - Access strictly bounded to orders, addresses, and subscription details where `record.customer_id === session.customer_id`.
   - **Prohibited:** any access to `/admin/*`, `/ops/*`, or other customers' records.
6. **`anonymous` (Unauthenticated Visitor):**
   - Public browsing of storefront catalog, marketing pages, guides, and initiating a cart.

### Role Permission Matrix

| System Action / Resource Endpoint | Anonymous | Customer | Packer | Support | Auditor | Owner |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Browse Public Catalog & Pages** | ALLOW | ALLOW | ALLOW | ALLOW | ALLOW | ALLOW |
| **Create Cart / Reserve Stock** | ALLOW (w/ Turnstile) | ALLOW (w/ Turnstile) | DENY | DENY | DENY | ALLOW |
| **Execute Stripe Checkout** | ALLOW | ALLOW | DENY | DENY | DENY | ALLOW |
| **View Own Order History & Tracking** | DENY | ALLOW (Self-only) | DENY | DENY | DENY | ALLOW |
| **Manage Own Subscription (Skip/Pause/Cancel)** | DENY | ALLOW (Self-only) | DENY | DENY | DENY | ALLOW |
| **View Packing Lists & Kit Recipes** | DENY | DENY | ALLOW | ALLOW | ALLOW | ALLOW |
| **Mark Order Packed / Shipped** | DENY | DENY | ALLOW | ALLOW | DENY | ALLOW |
| **Record Physical Component Intake** | DENY | DENY | ALLOW | DENY | DENY | ALLOW |
| **Update Customer Shipping Address** | DENY | ALLOW (Pre-pack only)| DENY | ALLOW | DENY | ALLOW |
| **Issue Order Refund / Return** | DENY | DENY | DENY | ALLOW (Capped)| DENY | ALLOW (Full) |
| **Modify Catalog Prices & BOM Recipes** | DENY | DENY | DENY | DENY | DENY | ALLOW |
| **View Inventory Movement Ledger** | DENY | DENY | DENY | DENY | ALLOW | ALLOW |
| **View Financial & Revenue Metrics** | DENY | DENY | DENY | DENY | ALLOW | ALLOW |
| **Provision / Revoke Staff Access** | DENY | DENY | DENY | DENY | DENY | ALLOW |

### RBAC Enforcement Architecture

RBAC is enforced in two complementary layers:
1. **Network Perimeter Gate (Cloudflare Access):** All `/admin/*` routes require Cloudflare Zero Trust authentication. Cloudflare Access verifies corporate Google Workspace or email OTP and injects the cryptographically signed `Cf-Access-Jwt-Assertion` header.
2. **Application Worker Middleware (`requireStaffRole`):** The Worker API middleware intercepts every administrative request:
   - Validates the Access JWT signature against Cloudflare's public keys (`https://<team-name>.cloudflareaccess.com/cdn-cgi/access/certs`).
   - Retrieves the user's granular role from the D1 `staff_users` table using their verified email.
   - Enforces the Permission Matrix before invoking route handlers.
   - If role is insufficient, returns HTTP 403 Forbidden with a structured error `{ "error": "InsufficientPermissions", "requiredRole": "...", "assignedRole": "..." }`.

---

## 5. Cloudflare Turnstile Server-Side Validation Specification

### Protected Ingress Points

Cloudflare Turnstile is deployed to protect high-risk public endpoints from automated attacks without forcing legitimate users to solve frustrating puzzles:

1. `POST /api/checkout/reserve-session` (Prevents inventory exhaustion & hoarding)
2. `POST /api/auth/register` and `POST /api/auth/login-otp` (Prevents credential stuffing & SMS/email spam)
3. `POST /api/contact` and `POST /api/waitlist` (Prevents email queue spam and form stuffing)

### Verification Protocol

1. **Client Widget Execution:** The frontend renders Turnstile widget using the public Sitekey (`0x4AAAAAAA...`). Upon solving, Turnstile issues an ephemeral, single-use token `cf-turnstile-response`.
2. **Payload Submission:** The client includes `turnstileToken` in the JSON request body.
3. **Server-Side Validation:** The Worker issues a server-to-server POST request to Cloudflare:
   - **URL:** `https://challenges.cloudflare.com/turnstile/v0/siteverify`
   - **Body (form-urlencoded or JSON):**
     - `secret`: Injected via `env.TURNSTILE_SECRET_KEY` (never exposed to client).
     - `response`: The `turnstileToken` provided by the client.
     - `remoteip`: The connecting IP from `request.headers.get("cf-connecting-ip")`.
     - `idempotency_key`: UUIDv4 to ensure single processing under network retries.
4. **Validation Criteria:**
   - Response must return `success === true`.
   - Token creation timestamp must be within 300 seconds (5 minutes) of current server time.
   - Hostname in verification response must match authorized BeadsILY domains (`beadsily.com` or local dev/preview host).
5. **Replay Defense:** The Worker records successfully validated Turnstile token hashes in D1 / KV cache for 300 seconds. If a token is presented a second time within that window, the request is immediately rejected with HTTP 403 (`TurnstileTokenAlreadyUsed`).

```typescript
export async function verifyTurnstileToken(
  token: string,
  clientIp: string | null,
  secretKey: string
): Promise<{ valid: boolean; error?: string }> {
  if (!token || typeof token !== 'string' || token.trim().length === 0) {
    return { valid: false, error: 'MissingTurnstileToken' };
  }

  const formData = new URLSearchParams();
  formData.append('secret', secretKey);
  formData.append('response', token);
  if (clientIp) {
    formData.append('remoteip', clientIp);
  }

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData,
    });

    if (!res.ok) {
      return { valid: false, error: `TurnstileServiceUnavailable:${res.status}` };
    }

    const data = await res.json() as { success: boolean; 'error-codes'?: string[] };
    if (!data.success) {
      return { valid: false, error: data['error-codes']?.join(',') || 'VerificationFailed' };
    }

    return { valid: true };
  } catch (err: any) {
    return { valid: false, error: `TurnstileNetworkError:${err.message}` };
  }
}
```

---

## 6. Stripe & Financial Trust Boundaries

### Cardholder Data Isolation (PCI-DSS SAQ A)

- **Zero PAN Exposure:** BeadsILY servers, Workers, and D1 databases never receive, process, or store primary account numbers (PANs), CVVs, or card expiration dates.
- **Client Elements:** Payment card data is entered exclusively inside Stripe-hosted iFrames via the Stripe Payment Element.
- **Tokenization:** Stripe returns an opaque `PaymentMethod` ID or `PaymentIntent` ID to the client; the client passes only this reference ID to BeadsILY.

### Authoritative Order Quotation (PAY-01)

- The client submits only requested items: `{ productId, guestCount, options: { paletteId, personalizationNames } }`.
- The API Worker calculates the canonical cost in integer minor units (USD cents):
  $$\text{Total} = \text{BasePrice} + (\max(0, \text{Guests} - 15) \times \text{AdditionalGuestFee}) + \text{AddonTotal} + \text{Shipping} + \text{Tax}$$
- The server creates the Stripe `PaymentIntent` specifying the computed `amount` and `currency: "usd"`.
- If a client alters the amount in any request or payload, the transaction fails immediately.

### Webhook Security & Idempotency (PAY-03, PAY-04)

Stripe webhooks are the sole authority for asynchronous state transitions (payment confirmation, renewal invoice paid, dispute opened).

1. **Raw Body Buffering:** The Worker captures the unparsed raw request body as an `ArrayBuffer` or raw text.
2. **Signature Verification:** The Worker verifies `stripe-signature` using `stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET)`.
   - Verifies the HMAC-SHA256 signature against the timestamp.
   - Enforces a 300-second maximum timestamp drift to eliminate replay attacks.
3. **Durable Idempotency in D1:**
   - Before executing business logic, the Worker executes an atomic insert:
     ```sql
     INSERT INTO webhook_events (event_id, event_type, status, created_at)
     VALUES (?, ?, 'RECEIVED', CURRENT_TIMESTAMP);
     ```
   - If `event_id` already exists (SQL UNIQUE constraint violation), the Worker returns HTTP 200 immediately without re-executing fulfillment.
4. **State Separation:** A successful payment webhook transitions the reservation state from `RESERVED` to `CONFIRMED`. It never assumes a physical box has been assembled or shipped.

### IDOR Protection on Order & Billing Access (PAY-05)

- Guest orders: Accessible only via a cryptographically random, unguessable 128-bit access token (`order_access_token`) sent directly to the customer's verified email.
- Account orders: Accessible only when `order.customer_id === authenticated_user.uid`.
- Stripe Customer Portal: The Worker generates short-lived, single-use Portal Sessions (`stripe.billingPortal.sessions.create`) explicitly binding the `customer` to the authenticated user's verified `stripe_customer_id`. Return URLs are locked to `https://beadsily.com/account/billing`.

---

## 7. Privacy, COPPA, and Child Safety Boundaries

### Children's Online Privacy Protection Act (COPPA) Compliance

BeadsILY sells craft kits designed for kids' birthday parties, bat mitzvahs, school celebrations, and family gatherings. However, BeadsILY operates under a strict **Adult-Only Purchaser Model**:

1. **Target Audience of Service:** The BeadsILY storefront and digital services are targeted exclusively at adults (parents, guardians, teachers, and party hosts). The Terms of Service require that all account holders and purchasers be at least 18 years of age.
2. **Zero Child Accounts:** Minors are not permitted to register accounts, join mailing lists, or submit personal data.
3. **Personalization Names as Manufacturing Attributes:**
   - When a host configures a 15-guest party kit, they may supply first names or initials for bead letter allocations (e.g., "Maya", "Leo").
   - **Data Classification:** These names are classified strictly as **transient manufacturing BOM data**, equivalent to custom engraving instructions.
   - **Isolation Invariant:** Personalization names are **never** associated with a minor's birthdate, address, email, phone number, school, or user profile.
   - **Non-Searchable & Non-Indexed:** Personalization names are stored in `order_items.customization_json`. They are never published in public URLs, never exposed to search engines, and never indexed in customer directories.
   - **Retention & Scrubbing:** Ninety days after order delivery, personalization strings in order items may be purged or anonymized, preserving only the letter inventory count consumed (e.g., `{ "M": 1, "A": 2, "Y": 1 }`).

### PII Minimization & Logging Hygiene

- **Data Redaction in Structured Logs:** The application structured logger automatically filters and masks sensitive fields:
  - Email addresses: `j***@example.com`
  - Street addresses: `123 Main St` $\rightarrow$ `[REDACTED_ADDRESS]`
  - Names: `Jane Doe` $\rightarrow$ `J*** D***`
  - Credit Card / Secrets: Completely scrubbed
- **No Third-Party Tracker Leakage:** No client-side analytics or advertising trackers (Meta Pixel, Google Ads) receive order customization strings or personalization names.

---

## 8. Defensive Edge & Cookie Security

### Cookie Security Policy

All authentication tokens and session identifiers must be delivered in secure cookies with the following attributes:

```http
Set-Cookie: __Host-beadsily_session=<opaque_crypto_token>;
            Path=/;
            Secure;
            HttpOnly;
            SameSite=Lax;
            Max-Age=604800;
```

- **`__Host-` Prefix:** Enforces that the cookie can only be set from the canonical HTTPS host (`beadsily.com`), never from a subdomain or insecure connection.
- **`HttpOnly`:** Inaccessible to client-side JavaScript (`document.cookie`), completely preventing session theft via Cross-Site Scripting (XSS).
- **`Secure`:** Transmitted exclusively over encrypted TLS connections.
- **`SameSite=Lax`:** Default for top-level GET navigations. For sensitive POST/PUT/DELETE mutations, the server additionally enforces `SameSite=Strict` or validates an unforgeable CSRF header.

### CSRF & Origin Enforcement

To prevent Cross-Site Request Forgery (CSRF), all state-altering endpoints (`POST`, `PUT`, `DELETE`, `PATCH`) enforce two distinct verification layers:

1. **`Sec-Fetch-Site` Verification:**
   - Browsers attach the unforgeable `Sec-Fetch-Site` header to all fetch/XHR requests.
   - If `Sec-Fetch-Site === "cross-site"`, the request is rejected immediately with HTTP 403 Forbidden.
2. **Origin & Referer Hostname Whitelisting:**
   - The `Origin` header (or `Referer` fallback) must match the authorized BeadsILY production domain (`beadsily.com`) or allowed development hosts (`localhost`, `127.0.0.1`).
   - If both `Origin` and `Referer` are missing on a mutation request from a browser, the request is rejected.

### Content Security Policy (CSP)

The Storefront Worker injects strict security headers on all HTML responses:

```http
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'strict-dynamic' https://challenges.cloudflare.com https://js.stripe.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https://challenges.cloudflare.com https://*.stripe.com https://*.r2.cloudflarestorage.com;
  frame-src https://challenges.cloudflare.com https://js.stripe.com;
  connect-src 'self' https://challenges.cloudflare.com https://api.stripe.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
```

Additional HTTP Security Headers:
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(self "https://js.stripe.com")`

---

## 9. Inbound Email & Operations Worker Boundaries

### Cloudflare Email Security (EMAIL-04)

Inbound customer support messages and outbound transactional notifications cross trust boundaries that must be hardened against malware, spoofing, and resource exhaustion:

1. **Inbound Attachment Quarantine:**
   - The Operations Worker accepts attachments only of types: `image/jpeg`, `image/png`, `application/pdf`.
   - File size ceiling: 5 MB maximum per message.
   - Any executable (`.exe`, `.bat`, `.js`, `.scr`, `.vbs`, etc.) or archive (`.zip`, `.rar`) is immediately stripped and quarantined in R2 with zero-execution permissions.
2. **HTML Sanitization:**
   - Email HTML bodies are sanitized using a strict parser (DOMPurify or sanitize-html equivalent).
   - All `<script>`, `<iframe>`, `<object>`, `<embed>`, and external `<link>` tags are removed.
   - Links are rewritten with `rel="noopener noreferrer nofollow"`.
3. **Spoofing & Auto-Reply Loop Protection:**
   - Check `Authentication-Results` for SPF, DKIM, and DMARC passes.
   - Reject or flag messages from auto-responders (`Auto-Submitted: auto-replied`, `X-Auto-Response-Suppress: All`) to prevent infinite notification loops.
   - Inbound email sender identity alone **never** authorizes financial mutations (refunds, cancellations). Customer identity must be confirmed through verified account session or authenticated support token.

### Spreadsheet Formula Injection Protection (INV-09)

When staff or suppliers import or export inventory CSVs:
- Every cell value is checked for leading executable formula prefixes: `=`, `+`, `-`, `@`, `\t`, `\r`.
- Any cell beginning with these characters is neutralized by prefixing with a single quote (`'`), ensuring spreadsheet software (Excel, Google Sheets) renders the cell as literal text rather than executing dynamic formulas or DDE commands.

---

## 10. Acceptance Test Mapping & Verification Strategy

| Test Suite / Case ID | Component Under Test | Verification Logic | Pass Criteria |
| :--- | :--- | :--- | :--- |
| **SEC-01** | Staff RBAC Matrix | Test each role (`owner`, `packer`, `support`, `customer`, `anonymous`) against all protected routes. | Only permitted roles succeed; unauthorized roles receive HTTP 403. Zero privilege escalation. |
| **SEC-01 / PAY-05** | IDOR Order Access | Attempt to fetch Order B using Session A; attempt to open another customer's billing portal. | HTTP 403/404 returned; access denied; audit alert logged. |
| **SEC-02** | Origin / CSRF Defense | Issue POST request with `Sec-Fetch-Site: cross-site` or mismatched `Origin: https://evil.com`. | Request rejected with HTTP 403; zero state modification. |
| **SEC-02** | Cookie Policy | Verify `Set-Cookie` attributes on login/session creation. | `HttpOnly`, `Secure`, `SameSite=Lax/Strict`, and `__Host-` prefix present on all tokens. |
| **SEC-03** | Turnstile Verification | Submit valid token, expired token, forged token, replayed token, and missing token. | Only fresh, unplayed token succeeds; all others rejected with HTTP 403. |
| **SEC-03** | COPPA / PII Scrubbing | Verify personalization string storage and log serialization. | Personalization treated as BOM label; logs redact names, emails, cards. Zero minor accounts. |
| **PAY-01** | Price Tampering | Submit checkout request with client-modified price, discount, or guest count total. | Server calculates canonical total from D1; rejects or overrides client amount. |
| **PAY-03** | Webhook Signature & Replay | Send Stripe webhook with invalid HMAC signature; send duplicate event ID twice. | Invalid signature returns HTTP 400; duplicate event returns HTTP 200 without second processing. |

---

## 11. Security Release Sign-off & Human Gate Invariants

1. **Independent Review Requirement:** In accordance with the Standing Mission, Dwight (`dwight-muwicook`) authoritatively defines the security specification and produces automated tests, but cannot self-approve production releases.
2. **Review Routing:**
   - Architecture & Topology Review: Jim (`jim-muwibr7y`), Cloudflare Solutions Architect.
   - Independent Test Evidence Certification: Toby (`toby-muwie8nd`), Independent QA Certifier.
   - Commercial & Production Authorization: Michael (`god`) and Owner Korry Nelson.
3. **Immutable Production Gates:** Live Stripe activation, production Cloudflare DNS cutover, D1 live schema migration, and bulk marketing sends require explicit human approval from Korry Nelson.
