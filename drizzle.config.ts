import { defineConfig } from 'drizzle-kit';
import { existsSync, readdirSync } from 'fs';
import { join } from 'path';

// function findD1Database(): string {
//   const d1Dir = './.wrangler/state/v3/d1/miniflare-D1DatabaseObject';

//   if (!existsSync(d1Dir)) {
//     return 'file:.wrangler/state/v3/d1/miniflare-D1DatabaseObject/db.sqlite';
//   }

//   try {
//     const files = readdirSync(d1Dir);
//     const sqliteFile = files.find((file) => file.endsWith('.sqlite'));

//     if (sqliteFile) {
//       return `file:${join(d1Dir, sqliteFile)}`;
//     }
//   } catch (error) {
//     console.warn('Could not read D1 directory:', error);
//   }

//   // Fallback path
//   return 'file:.wrangler/state/v3/d1/miniflare-D1DatabaseObject/db.sqlite';
// }

// // Determine which database to use
// function getDatabaseUrl(): string {
//   // // If DRIZZLE_USE_LOCAL is explicitly set, use local.db
//   // if (process.env.DRIZZLE_USE_LOCAL) {
//   //   const localUrl = 'file:local.db';
//   //   console.log('Using local database:', localUrl);
//   //   return localUrl;
//   // }

//   // Default to D1 simulation database
//   const d1Url = findD1Database();
//   if (d1Url) {
//     console.log('Using D1 simulation database:', d1Url);
//     return d1Url;
//   }

//   // Fallback to local.db if D1 not found
//   const localUrl = 'file:local.db';
//   console.log('D1 simulation not found, falling back to local database:', localUrl);
//   return localUrl;
// }

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
