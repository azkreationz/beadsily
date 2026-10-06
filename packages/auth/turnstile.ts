/**
 * BeadsILY Cloudflare Turnstile Server-Side Verification Middleware
 * Enforces server-side challenge verification and single-use replay defense (SEC-03).
 */

export interface TurnstileVerificationOptions {
  token: string | null | undefined;
  clientIp?: string | null;
  secretKey: string;
  idempotencyKey?: string;
  replayCache?: TurnstileReplayCache;
  fetchProvider?: typeof fetch;
  allowedHostnames?: string[];
}

export interface TurnstileVerificationResponse {
  success: boolean;
  status: 200 | 400 | 403 | 502;
  error?: string;
  details?: string[];
  hostname?: string;
}

export interface TurnstileReplayCache {
  has(token: string): boolean;
  add(token: string, ttlMs?: number): void;
}

/**
 * Default in-memory replay cache with automatic TTL expiration.
 */
export class InMemoryTurnstileReplayCache implements TurnstileReplayCache {
  private cache = new Map<string, number>();

  has(token: string): boolean {
    this.purgeExpired();
    return this.cache.has(token);
  }

  add(token: string, ttlMs: number = 300000): void {
    this.cache.set(token, Date.now() + ttlMs);
  }

  private purgeExpired(): void {
    const now = Date.now();
    for (const [token, expiry] of this.cache.entries()) {
      if (now > expiry) {
        this.cache.delete(token);
      }
    }
  }
}

const DEFAULT_ALLOWED_HOSTNAMES = ['beadsily.com', 'www.beadsily.com', 'localhost', '127.0.0.1'];

/**
 * Validates a Turnstile token server-side against Cloudflare's siteverify endpoint.
 */
export async function validateTurnstileToken({
  token,
  clientIp,
  secretKey,
  replayCache,
  fetchProvider = fetch,
  allowedHostnames = DEFAULT_ALLOWED_HOSTNAMES,
}: TurnstileVerificationOptions): Promise<TurnstileVerificationResponse> {
  // 1. Check for token presence
  if (!token || typeof token !== 'string' || token.trim().length === 0) {
    return {
      success: false,
      status: 400,
      error: 'MissingTurnstileToken',
      details: ['missing-input-response'],
    };
  }

  const cleanToken = token.trim();

  // 2. Replay Attack Prevention
  if (replayCache && replayCache.has(cleanToken)) {
    return {
      success: false,
      status: 403,
      error: 'TurnstileTokenAlreadyUsed',
      details: ['timeout-or-duplicate'],
    };
  }

  // 3. Prepare payload for siteverify
  const formData = new URLSearchParams();
  formData.append('secret', secretKey);
  formData.append('response', cleanToken);
  if (clientIp) {
    formData.append('remoteip', clientIp);
  }

  try {
    const res = await fetchProvider('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData,
    });

    if (!res.ok) {
      return {
        success: false,
        status: 502,
        error: `TurnstileUpstreamError: ${res.status}`,
      };
    }

    const data = (await res.json()) as {
      success: boolean;
      hostname?: string;
      'error-codes'?: string[];
      action?: string;
      cdata?: string;
    };

    if (!data.success) {
      return {
        success: false,
        status: 403,
        error: 'TurnstileChallengeFailed',
        details: data['error-codes'] || ['invalid-input-response'],
      };
    }

    // 4. Validate hostname
    if (data.hostname && allowedHostnames.length > 0) {
      const lowerHost = data.hostname.toLowerCase();
      const hostAllowed = allowedHostnames.some(
        (h) => lowerHost === h || lowerHost.endsWith(`.${h}`)
      );
      if (!hostAllowed) {
        return {
          success: false,
          status: 403,
          error: 'TurnstileHostnameMismatch',
          details: [`Hostname '${data.hostname}' is not authorized.`],
        };
      }
    }

    // 5. Consume token in replay cache (5-minute TTL)
    if (replayCache) {
      replayCache.add(cleanToken, 300000);
    }

    return {
      success: true,
      status: 200,
      hostname: data.hostname,
    };
  } catch (err: any) {
    return {
      success: false,
      status: 502,
      error: `TurnstileNetworkException: ${err.message}`,
    };
  }
}
