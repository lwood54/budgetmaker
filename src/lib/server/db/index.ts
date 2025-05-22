import { drizzle as drizzleLibSql, type LibSQLDatabase } from 'drizzle-orm/libsql';
import { drizzle as drizzleD1, type DrizzleD1Database } from 'drizzle-orm/d1';
import { createClient } from '@libsql/client';
import * as schema from './schema';

export function createLibSqlClient(url: string): LibSQLDatabase<typeof schema> {
	const client = createClient({ url });
	return drizzleLibSql(client);
}

export function createD1Client(database: D1Database): DrizzleD1Database<typeof schema> {
	return drizzleD1(database);
}

export type DrizzleClient =
	| ReturnType<typeof createLibSqlClient>
	| ReturnType<typeof createD1Client>;

//// ORIGINAL SETUP for reference for a little while
// import { drizzle } from 'drizzle-orm/libsql';
// import { createClient } from '@libsql/client';
// import * as schema from './schema';
// import { env } from '$env/dynamic/private';

// if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

// const client = createClient({ url: env.DATABASE_URL });

// export const db = drizzle(client, { schema });
