// src/lib/server/auth.ts
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { JWT_SECRET } from '$env/static/private';
import type { Cookies } from '@sveltejs/kit';
import { sessions, users } from './db/schema';
import { eq, and, gt } from 'drizzle-orm';
import type { DrizzleClient } from './db';
import bcrypt from 'bcryptjs';
import { dev } from '$app/environment';

export interface TokenPayload {
  sub: string; // user UUID
  email: string;
  sessionId: string;
  iat: number;
  exp: number;
}

export interface User {
  userId: string;
  email: string;
  sessionId: string;
}

// Token configuration
const ACCESS_TOKEN_EXPIRY = 15 * 60; // 15 minutes
const REFRESH_THRESHOLD = 5 * 60; // Refresh when 5 minutes left
const SESSION_EXPIRY = 7 * 24 * 60 * 60; // 7 days for session validity

export function generateTokens(userId: string, email: string) {
  const sessionId = randomUUID();
  const now = Math.floor(Date.now() / 1000);

  const payload: Omit<TokenPayload, 'iat' | 'exp'> = {
    sub: userId,
    email,
    sessionId,
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });

  return {
    accessToken,
    sessionId,
    expiresAt: new Date((now + ACCESS_TOKEN_EXPIRY) * 1000),
    sessionExpiresAt: new Date((now + SESSION_EXPIRY) * 1000),
  };
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export function shouldRefreshToken(exp: number): boolean {
  const now = Math.floor(Date.now() / 1000);
  return exp - now <= REFRESH_THRESHOLD;
}

export async function createSession(userId: string, email: string, db: DrizzleClient) {
  const { accessToken, sessionId, expiresAt, sessionExpiresAt } = generateTokens(userId, email);

  // Store session in database - session lasts longer than individual tokens
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
): Promise<{ accessToken: string; expiresAt: Date } | null> {
  // Get current session with user data
  const result = await db
    .select()
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.uuid))
    .where(and(eq(sessions.uuid, sessionId), gt(sessions.expiresAt, new Date().toISOString())))
    .limit(1);

  if (result.length === 0) return null;

  const { userId, email } = {
    userId: result[0].sessions.userId,
    email: result[0].users.email,
  };

  // Generate new token (but keep same session)
  const now = Math.floor(Date.now() / 1000);
  const payload: Omit<TokenPayload, 'iat' | 'exp'> = {
    sub: userId,
    email,
    sessionId,
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });

  const expiresAt = new Date((now + ACCESS_TOKEN_EXPIRY) * 1000);

  // Update session with new token
  await db
    .update(sessions)
    .set({
      token: accessToken,
    })
    .where(eq(sessions.uuid, sessionId));

  return { accessToken, expiresAt };
}

export async function deleteSession(sessionId: string, db: DrizzleClient) {
  await db.delete(sessions).where(eq(sessions.uuid, sessionId));
}

export async function deleteAllUserSessions(userId: string, db: DrizzleClient) {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}

export async function validateCredentials(email: string, password: string, db: DrizzleClient) {
  // Find user
  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  if (userResult.length === 0) {
    return null;
  }

  const user = userResult[0];

  // Verify password
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
    secure: !dev, // Only secure in production
    sameSite: 'lax' as const, // More permissive than 'strict' for better UX
    path: '/',
    maxAge,
  };

  cookies.set('access_token', accessToken, cookieOptions);
  cookies.set('session_id', sessionId, {
    ...cookieOptions,
    maxAge: SESSION_EXPIRY, // Session cookie lasts longer
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
