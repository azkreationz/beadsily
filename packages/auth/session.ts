/**
 * BeadsILY Session Authorization & Web Crypto HMAC Token Handler
 * Zero-dependency Web Crypto implementation compatible with Cloudflare Workers and Node.js.
 */

export interface SessionPayload {
  uid: string;
  role: 'owner' | 'packer' | 'support' | 'auditor' | 'customer';
  email?: string;
  name?: string;
  createdAt: number;
  expiresAt: number;
}

export interface SessionVerificationResult {
  valid: boolean;
  session?: SessionPayload;
  error?: string;
}

const DEFAULT_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

/**
 * Base64URL encode a buffer or string without padding.
 */
export function base64UrlEncode(data: string | Uint8Array): string {
  let bytes: Uint8Array;
  if (typeof data === 'string') {
    bytes = new TextEncoder().encode(data);
  } else {
    bytes = data;
  }
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Base64URL decode to string.
 */
export function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

/**
 * Derives a CryptoKey for HMAC-SHA256 from secret string.
 */
async function getHmacKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

/**
 * Signs a session payload and returns an opaque, tamper-evident token: <base64url_payload>.<signature>
 */
export async function createSessionToken(
  user: { uid: string; role: SessionPayload['role']; email?: string; name?: string },
  secret: string,
  ttlSeconds: number = DEFAULT_TTL_SECONDS
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    uid: user.uid,
    role: user.role,
    email: user.email,
    name: user.name,
    createdAt: now,
    expiresAt: now + ttlSeconds,
  };

  const payloadEncoded = base64UrlEncode(JSON.stringify(payload));
  const key = await getHmacKey(secret);
  const signatureBytes = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(payloadEncoded)
  );
  const signatureEncoded = base64UrlEncode(new Uint8Array(signatureBytes));

  return `${payloadEncoded}.${signatureEncoded}`;
}

/**
 * Verifies a session token's cryptographic signature and expiration.
 */
export async function verifySessionToken(
  token: string,
  secret: string
): Promise<SessionVerificationResult> {
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'MissingSessionToken' };
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return { valid: false, error: 'MalformedSessionToken' };
  }

  const [payloadEncoded, signatureEncoded] = parts;

  try {
    const key = await getHmacKey(secret);
    const signatureBinary = atob(
      signatureEncoded.replace(/-/g, '+').replace(/_/g, '/') +
        '='.repeat((4 - (signatureEncoded.length % 4)) % 4)
    );
    const signatureBytes = new Uint8Array(signatureBinary.length);
    for (let i = 0; i < signatureBinary.length; i++) {
      signatureBytes[i] = signatureBinary.charCodeAt(i);
    }

    const isSignatureValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes,
      new TextEncoder().encode(payloadEncoded)
    );

    if (!isSignatureValid) {
      return { valid: false, error: 'InvalidSessionSignature' };
    }

    const payloadJson = base64UrlDecode(payloadEncoded);
    const payload: SessionPayload = JSON.parse(payloadJson);

    const now = Math.floor(Date.now() / 1000);
    if (now > payload.expiresAt) {
      return { valid: false, error: 'SessionExpired' };
    }

    return { valid: true, session: payload };
  } catch (err: any) {
    return { valid: false, error: `SessionVerificationFailed: ${err.message}` };
  }
}

/**
 * Formats a secure Set-Cookie header string following the BeadsILY cookie specification:
 * - __Host- prefix
 * - HttpOnly
 * - Secure
 * - SameSite=Lax (default) or SameSite=Strict
 * - Path=/
 */
export function formatSessionCookie(
  token: string,
  maxAgeSeconds: number = DEFAULT_TTL_SECONDS,
  sameSite: 'Lax' | 'Strict' = 'Lax'
): string {
  return `__Host-beadsily_session=${token}; Path=/; Secure; HttpOnly; SameSite=${sameSite}; Max-Age=${maxAgeSeconds}`;
}

/**
 * Formats a cookie clearing header to invalidate the session cookie upon logout.
 */
export function formatSessionClearCookie(): string {
  return '__Host-beadsily_session=; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT';
}

/**
 * Extracts session cookie value from a raw Cookie header string or Request object.
 */
export function extractSessionCookie(source: Request | Headers | string | null | undefined): string | null {
  let cookieHeader: string | null = null;

  if (!source) return null;

  if (typeof source === 'string') {
    cookieHeader = source;
  } else if ('headers' in source) {
    cookieHeader = source.headers.get('cookie');
  } else if ('get' in source && typeof source.get === 'function') {
    cookieHeader = source.get('cookie');
  }

  if (!cookieHeader) return null;

  const match = cookieHeader.match(/(?:^|;\s*)(?:__Host-)?beadsily_session=([^;]+)/);
  return match ? decodeURIComponent(match[1]).trim() : null;
}
