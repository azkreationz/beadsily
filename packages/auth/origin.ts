/**
 * BeadsILY Origin Guard & CSRF Defense Middleware
 * Protects state-altering API routes from cross-site scripts and CSRF (SEC-02).
 */

export interface OriginGuardOptions {
  isProduction?: boolean;
  allowedHosts?: string[];
}

export interface OriginCheckResult {
  trusted: boolean;
  status: 200 | 403;
  reason?: string;
}

const PRODUCTION_HOSTS = ['beadsily.com', 'www.beadsily.com'];
const DEVELOPMENT_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0'];

function extractHostname(urlOrOrigin: string | null | undefined): string | null {
  if (!urlOrOrigin) return null;
  try {
    return new URL(urlOrOrigin).hostname.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Validates request origin against allowed hostnames and browser Sec-Fetch-Site header.
 */
export function verifyRequestOrigin(
  requestOrHeaders: Request | Headers,
  options: OriginGuardOptions = {}
): OriginCheckResult {
  const isProduction = options.isProduction ?? true;
  const headers = 'headers' in requestOrHeaders ? requestOrHeaders.headers : requestOrHeaders;

  // Layer 1: Sec-Fetch-Site header check (unforgeable by browser scripts)
  const secFetchSite = headers.get('sec-fetch-site');
  if (secFetchSite === 'cross-site') {
    return {
      trusted: false,
      status: 403,
      reason: 'Rejected: Sec-Fetch-Site indicates request originated cross-site.',
    };
  }

  // Layer 2: Origin or Referer header verification
  const origin = headers.get('origin');
  const referer = headers.get('referer');
  const targetHost = extractHostname(origin) || extractHostname(referer);

  if (!targetHost) {
    return {
      trusted: false,
      status: 403,
      reason: 'Rejected: Missing valid Origin or Referer header on mutation request.',
    };
  }

  // Check production allowed hosts
  const allowedHosts = options.allowedHosts || PRODUCTION_HOSTS;
  for (const allowed of allowedHosts) {
    if (targetHost === allowed || targetHost.endsWith(`.${allowed}`)) {
      return { trusted: true, status: 200 };
    }
  }

  // Check development hosts in non-production mode
  if (!isProduction) {
    for (const devHost of DEVELOPMENT_HOSTS) {
      if (targetHost === devHost || targetHost.endsWith(`.${devHost}`)) {
        return { trusted: true, status: 200 };
      }
    }
  }

  return {
    trusted: false,
    status: 403,
    reason: `Rejected: Untrusted origin hostname '${targetHost}'.`,
  };
}
