import { defineConfig } from 'drizzle-kit';
import { existsSync, readdirSync } from 'fs';
import { join } from 'path';

function findD1Database(): string {
  const d1Dir = './.wrangler/state/v3/d1/miniflare-D1DatabaseObject';

  if (!existsSync(d1Dir)) {
    return 'file:.wrangler/state/v3/d1/miniflare-D1DatabaseObject/db.sqlite';
  }

  try {
    const files = readdirSync(d1Dir);
    const sqliteFile = files.find((file) => file.endsWith('.sqlite'));

    if (sqliteFile) {
      return `file:${join(d1Dir, sqliteFile)}`;
    }
  } catch (error) {
    console.warn('Could not read D1 directory:', error);
  }

  // Fallback path
  return 'file:.wrangler/state/v3/d1/miniflare-D1DatabaseObject/db.sqlite';
}

export default defineConfig({
  schema: './src/lib/server/db/schema.ts',
  out: './src/lib/server/db/migrations',
  dialect: 'sqlite',
  dbCredentials: { url: findD1Database() },
  verbose: true,
  strict: true,
});
