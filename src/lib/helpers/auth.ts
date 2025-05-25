import { BASE_HEADERS } from '$lib/constants/auth';
import type { EncryptedToken, TokenPayload } from '$lib/types/custom/auth';

export const createHeaders = (additionalHeaders: Record<string, string> = {}) => {
  return {
    ...BASE_HEADERS,
    ...additionalHeaders,
  };
};

export function isTokenExpired(exp: number): boolean {
  return Date.now() >= exp * 1000;
}

export function decryptToken(_encryptedToken: string, _secret: string): string {
  // const bytes = CryptoJS.AES.decrypt(encryptedToken, secret);
  // return bytes.toString(CryptoJS.enc.Utf8);
  return '';
}

export function encryptToken(token: string, _secret: string): EncryptedToken {
  // Parse the JWT payload before encryption to get expiration
  const payload = parseToken(token);
  // const encrypted = CryptoJS.AES.encrypt(token, secret).toString();

  // NOTE: for logging expiration date
  // READABLE TOKEN EXPIRATION
  // const tokenExpDate = new Date(Number(payload.exp) * 1_000);
  // toDateDisplay(tokenExpDate.toISOString())

  return {
    // token: encrypted,
    token: '',
    exp: payload.exp,
  };
}

export const getMaxTokenAge = (encryptedToken: EncryptedToken) => {
  // 'now' is in miliseconds
  const now = Math.floor(Date.now());
  const expirationMilliSeconds = encryptedToken.exp * 1_000;

  const maxAge = (expirationMilliSeconds - now) / 1_000;
  return maxAge;
};

export function parseToken(token: string): TokenPayload {
  try {
    const base64Payload = token.split('.')[1];
    const payload = JSON.parse(atob(base64Payload));
    return payload as TokenPayload;
  } catch (error) {
    console.error('Error parsing token:', error);
    throw new Error('Invalid token format');
  }
}

export function shouldRefreshToken(exp: number): boolean {
  const tenMinutesInMs = 10 * 60 * 1000;
  return Date.now() >= exp * 1000 - tenMinutesInMs;
}
