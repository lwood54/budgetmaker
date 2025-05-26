import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { env } from '$env/dynamic/private';
import type { Cookies } from '@sveltejs/kit';
import { sessions, users } from './db/schema';
import { eq, and, gt } from 'drizzle-orm';
import type { DrizzleClient } from './db';
import bcrypt from 'bcryptjs';
import { dev } from '$app/environment';

const JWT_SECRET = env.JWT_SECRET;

export type TokenPayload = {
  sub: string; // user UUID
  email: string;
  sessionId: string;
  isAdmin: boolean;
  iat: number;
  exp: number;
};

export type User = {
  userId: string;
  email: string;
  sessionId: string;
  isAdmin: boolean;
};

// NOTE: Token configuration (in milliseconds)
const ACCESS_TOKEN_EXPIRY = 15 * 60 * 1000; // 15 minutes (in milliseconds)
const REFRESH_THRESHOLD = 5 * 60 * 1000; // Refresh when 5 minutes left (in milliseconds)
const SESSION_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days for session validity (in milliseconds)

export function generateTokens(userId: string, email: string, isAdmin: boolean) {
  const sessionId = randomUUID();
  const now = Date.now();

  const payload: Omit<TokenPayload, 'iat' | 'exp'> = {
    sub: userId,
    email,
    sessionId,
    isAdmin,
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: Math.floor(ACCESS_TOKEN_EXPIRY / 1000), // NOTE: Convert to seconds for JWT
  });

  return {
    accessToken,
    sessionId,
    expiresAt: new Date(now + ACCESS_TOKEN_EXPIRY),
    sessionExpiresAt: new Date(now + SESSION_EXPIRY),
  };
}

export function getIsAuthAdminConfirmed(authHeader?: string | null) {
  if (!authHeader) return false;
  return authHeader === `Bearer ${env.ADMIN_API_KEY}`;
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export function shouldRefreshToken(exp: number): boolean {
  const now = Date.now();
  const expMs = exp * 1000; // Convert JWT exp (seconds) to milliseconds
  return expMs - now <= REFRESH_THRESHOLD;
}

export async function createSession(
  userId: string,
  email: string,
  isAdmin: boolean,
  db: DrizzleClient,
) {
  const { accessToken, sessionId, expiresAt, sessionExpiresAt } = generateTokens(
    userId,
    email,
    isAdmin,
  );

  // NOTE: Store session in database - session lasts longer than individual tokens
  await db.insert(sessions).values({
    uuid: sessionId,
    userId,
    token: accessToken,
    expiresAt: sessionExpiresAt.toISOString(),
  });

  return { accessToken, sessionId, expiresAt };
}

export async function refreshSession(
  sessionId: string,
  db: DrizzleClient,
): Promise<{ accessToken: string; expiresAt: Date; isAdmin: boolean } | null> {
  const result = await db
    .select()
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.uuid))
    .where(and(eq(sessions.uuid, sessionId), gt(sessions.expiresAt, new Date().toISOString())))
    .limit(1);

  if (result.length === 0) return null;

  const { userId, email, isAdmin } = {
    userId: result[0].users.uuid,
    email: result[0].users.email,
    isAdmin: result[0].users.isAdmin || false,
  };

  // NOTE: Generate new token (but keep same session)
  const now = Date.now();
  const payload: Omit<TokenPayload, 'iat' | 'exp'> = {
    sub: userId,
    email,
    sessionId,
    isAdmin,
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: Math.floor(ACCESS_TOKEN_EXPIRY / 1000), // NOTE: Convert to seconds for JWT
  });

  const expiresAt = new Date(now + ACCESS_TOKEN_EXPIRY);

  // Update session with new token
  await db
    .update(sessions)
    .set({
      token: accessToken,
    })
    .where(eq(sessions.uuid, sessionId));

  return { accessToken, expiresAt, isAdmin };
}

export async function deleteSession(sessionId: string, db: DrizzleClient) {
  await db.delete(sessions).where(eq(sessions.uuid, sessionId));
}

export async function deleteAllUserSessions(userId: string, db: DrizzleClient) {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}

export async function validateCredentials(email: string, password: string, db: DrizzleClient) {
  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  if (userResult.length === 0) {
    return null;
  }

  const user = userResult[0];

  const passwordValid = await bcrypt.compare(password, user.passwordHash);
  if (!passwordValid) {
    return null;
  }

  return user;
}

export async function createUser(
  email: string,
  password: string,
  firstName?: string,
  lastName?: string,
  db?: DrizzleClient,
) {
  if (!db) throw new Error('Database connection required');

  const hashedPassword = await bcrypt.hash(password, 12);
  const userId = randomUUID();

  await db.insert(users).values({
    uuid: userId,
    email: email.toLowerCase(),
    passwordHash: hashedPassword,
    firstName,
    lastName,
    emailVerified: false,
  });

  return userId;
}

export function setAuthCookies(
  cookies: Cookies,
  accessToken: string,
  sessionId: string,
  expiresAt: Date,
) {
  const maxAge = Math.floor((expiresAt.getTime() - Date.now()) / 1000);

  const cookieOptions = {
    httpOnly: true,
    secure: !dev,
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };

  cookies.set('access_token', accessToken, cookieOptions);
  cookies.set('session_id', sessionId, {
    ...cookieOptions,
    maxAge: Math.floor(SESSION_EXPIRY / 1000), // Convert to seconds for cookie maxAge
  });
}

export function clearAuthCookies(cookies: Cookies) {
  const cookieOptions = {
    path: '/',
    secure: !dev,
    sameSite: 'lax' as const,
  };

  cookies.delete('access_token', cookieOptions);
  cookies.delete('session_id', cookieOptions);
}
