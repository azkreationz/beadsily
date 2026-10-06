/**
 * BeadsILY Inbound Support Email Sanitizer & Security Filter
 * Requirement: EMAIL-04 (Sanitized isolated preview; size/quarantine controls; no auto-reply loop; no unauthorized account/payment action)
 */

export const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export const BLOCKED_EXTENSIONS = [
  'exe', 'bat', 'cmd', 'ps1', 'vbs', 'scr', 'js', 'sh',
  'com', 'pif', 'hta', 'cpl', 'jar', 'msi', 'reg', 'wsf'
];

export const FINANCIAL_INTENT_KEYWORDS = [
  'refund', 'charge', 'credit card', 'cvv', 'stripe', 'payout',
  'billing', 'bank account', 'wire transfer', 'routing number'
];

/**
 * Detect whether an inbound email represents an automated response or mailer daemon loop.
 */
export function isAutoReplyLoop(email = {}) {
  const headers = email.headers || {};
  const subject = email.subject || '';

  // 1. Standard auto-submitted header (RFC 3834)
  const autoSubmitted = (headers['auto-submitted'] || headers['Auto-Submitted'] || '').toLowerCase();
  if (autoSubmitted && autoSubmitted !== 'no') {
    return true;
  }

  // 2. Microsoft Exchange auto-reply suppression
  const autoSuppress = (headers['x-auto-response-suppress'] || headers['X-Auto-Response-Suppress'] || '').toLowerCase();
  if (autoSuppress && (autoSuppress.includes('all') || autoSuppress.includes('oof') || autoSuppress.includes('autoreply'))) {
    return true;
  }

  // 3. Precedence header
  const precedence = (headers['precedence'] || headers['Precedence'] || '').toLowerCase();
  if (['bulk', 'junk', 'auto_reply'].includes(precedence)) {
    return true;
  }

  // 4. Subject line automated prefixes
  const autoSubjectPattern = /^(?:auto(?:matic)?\s*reply|out of office|auto-reply|undeliverable|delivery status notification|returned mail)/i;
  if (autoSubjectPattern.test(subject.trim())) {
    return true;
  }

  return false;
}

/**
 * Sanitize and validate inbound customer support email.
 * 
 * @param {object} rawEmail
 * @param {string} rawEmail.sender
 * @param {string} rawEmail.subject
 * @param {string} rawEmail.body
 * @param {Array<{ filename: string, sizeBytes?: number, size?: number }>} [rawEmail.attachments]
 * @param {object} [rawEmail.headers]
 * @returns {object} Sanitized email object with isolated preview and quarantine flags
 */
export function sanitizeInboundEmail(rawEmail = {}) {
  if (!rawEmail || typeof rawEmail !== 'object') {
    throw new Error('INVALID_INPUT: rawEmail must be an object');
  }

  const sender = rawEmail.sender || 'unknown@example.com';
  const subject = rawEmail.subject || '(No Subject)';
  let body = typeof rawEmail.body === 'string' ? rawEmail.body : '';

  // 1. Process Attachments: Size bounds & Executable Quarantine
  let sanitizedAttachments = [];
  if (Array.isArray(rawEmail.attachments)) {
    sanitizedAttachments = rawEmail.attachments.map(att => {
      const copy = { ...att };
      const size = copy.sizeBytes ?? copy.size ?? 0;

      // Reject oversized attachments immediately
      if (size > MAX_ATTACHMENT_SIZE_BYTES) {
        throw new Error('ATTACHMENT_TOO_LARGE: Max 10MB allowed');
      }

      const filename = copy.filename || '';
      const ext = filename.split('.').pop().toLowerCase();

      if (BLOCKED_EXTENSIONS.includes(ext)) {
        copy.quarantined = true;
        copy.reason = 'EXECUTABLE_BLOCKED';
      }

      return copy;
    });
  }

  // 2. Sanitize HTML, Scripts, and Iframes
  const scriptRegex = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
  const iframeRegex = /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi;
  const objectRegex = /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi;
  const embedRegex = /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi;

  let cleanBody = body
    .replace(scriptRegex, '[SCRIPTS_REMOVED]')
    .replace(iframeRegex, '[IFRAMES_REMOVED]')
    .replace(objectRegex, '[OBJECTS_REMOVED]')
    .replace(embedRegex, '[EMBEDS_REMOVED]')
    .replace(/on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '[EVENT_HANDLER_REMOVED]')
    .replace(/javascript:[^"']+/gi, '[JAVASCRIPT_URI_REMOVED]');

  // 3. Extract Isolated Plain-Text Preview (for safe staff dashboard triage)
  const strippedText = cleanBody
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const isolatedPreview = strippedText.length > 200 ? strippedText.substring(0, 197) + '...' : strippedText;

  // 4. Auto-Reply Loop Detection
  const autoReplyDetected = isAutoReplyLoop(rawEmail);

  // 5. Financial Intent Detection Guardrail (Prevent unauthorized automated actions)
  const lowerBody = strippedText.toLowerCase();
  const lowerSubject = subject.toLowerCase();
  const hasFinancialKeyword = FINANCIAL_INTENT_KEYWORDS.some(kw => 
    lowerBody.includes(kw) || lowerSubject.includes(kw)
  );

  return {
    sender,
    subject,
    body: cleanBody,
    preview: isolatedPreview,
    attachments: sanitizedAttachments,
    isAutoReply: autoReplyDetected,
    autoReplySuppressed: autoReplyDetected,
    requiresStaffAuthorization: hasFinancialKeyword,
    containsFinancialKeyword: hasFinancialKeyword
  };
}
