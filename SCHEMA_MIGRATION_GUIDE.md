# Schema Migration Guide

This guide explains how to safely add new database schema, tables, types, and handle migrations in both development and production environments **without breaking existing data**.

## Table of Contents

1. [Schema Organization](#schema-organization)
2. [Adding New Tables](#adding-new-tables)
3. [Development Workflow](#development-workflow)
4. [Production Deployment](#production-deployment)
5. [Avoiding Data Loss](#avoiding-data-loss)
6. [Best Practices](#best-practices)
7. [Common Scenarios](#common-scenarios)

---

## Schema Organization

Our schema is organized into separate files by domain:

```
src/lib/server/db/
├── schema/
│   ├── index.ts          # Re-exports all tables and types
│   ├── users.ts          # User-related tables
│   ├── budgets.ts        # Budget-related tables
│   ├── auth.ts           # Authentication-related tables
│   └── [your-feature].ts # Your new feature tables
└── schema.ts             # Backward compatibility re-export
```

**Key Points:**

- All tables are exported through `schema/index.ts`
- `schema.ts` re-exports everything for backward compatibility
- Existing imports (`from '$lib/server/db/schema'`) continue to work
- Drizzle config points to `schema.ts` which includes everything

---

## Adding New Tables

### Step-by-Step Process

#### 1. Create Your Schema File

Create a new file in `src/lib/server/db/schema/` for your feature:

**Example: `src/lib/server/db/schema/notifications.ts`**

```typescript
import { sql, type InferSelectModel } from 'drizzle-orm';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { users } from './users'; // Import if you need foreign keys

export const notifications = sqliteTable('notifications', {
  uuid: text().primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.uuid, { onDelete: 'cascade' }),
  title: text().notNull(),
  message: text().notNull(),
  read: integer('read', { mode: 'boolean' }).default(false),
  createdAt: text('created_at', { mode: 'text' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export type Notification = InferSelectModel<typeof notifications>;
```

**Important Notes:**

- Use `text().primaryKey()` for UUIDs (consistent with existing tables)
- Use `integer()` with `{ mode: 'boolean' }` for boolean fields
- Always include `createdAt` and `updatedAt` timestamps for consistency
- Use `.references()` for foreign keys with `onDelete: 'cascade'` when appropriate
- Export the TypeScript type using `InferSelectModel`

#### 2. Export from Schema Index

Add your exports to `src/lib/server/db/schema/index.ts`:

```typescript
// Re-export all tables
export * from './users';
export * from './budgets';
export * from './auth';
export * from './notifications'; // Add this line

// Re-export types
export type { Budget, Category, BudgetItem } from './budgets';
export type { Notification } from './notifications'; // Add this line

// ... rest of file
```

#### 3. Verify Schema Compiles

```bash
pnpm exec tsc --noEmit
```

Fix any TypeScript errors before proceeding.

---

## Development Workflow

### Safe Development Migration Process

#### Step 1: Generate Migration

After adding/modifying your schema:

```bash
pnpm run db:make-migrations
```

This command:

- Compares your current schema to the database
- Generates SQL migration files in `src/lib/server/db/migrations/`
- Creates a new numbered migration file (e.g., `0007_new_feature.sql`)

**⚠️ Important:** Review the generated migration file before applying!

#### Step 2: Review the Migration File

Open the newly generated migration file and verify:

```sql
-- Example: src/lib/server/db/migrations/0007_new_feature.sql
CREATE TABLE IF NOT EXISTS "notifications" (
  "uuid" TEXT PRIMARY KEY NOT NULL,
  "user_id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "read" INTEGER DEFAULT 0,
  "created_at" TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY ("user_id") REFERENCES "users"("uuid") ON DELETE CASCADE
);
```

**Check for:**

- ✅ `CREATE TABLE IF NOT EXISTS` (safe, won't break if table exists)
- ✅ `ALTER TABLE` statements are non-destructive
- ✅ No `DROP TABLE` or `DROP COLUMN` unless intentional
- ✅ Foreign key constraints are correct
- ✅ Default values are appropriate

#### Step 3: Apply Migration to Development Database

```bash
pnpm run db:migrate:dev
```

This applies migrations to your local D1 database (used by `wrangler dev`).

**What happens:**

- Migrations are applied in order
- Drizzle tracks which migrations have been applied
- Your local database schema matches your code

#### Step 4: Test Your Changes

1. Start your dev server: `pnpm run dev`
2. Test the new functionality
3. Verify existing features still work
4. Check that data integrity is maintained

#### Step 5: Commit Changes

```bash
git add src/lib/server/db/schema/
git add src/lib/server/db/migrations/
git commit -m "feat: add notifications table"
```

**Always commit:**

- ✅ Schema files (`schema/*.ts`)
- ✅ Migration files (`migrations/*.sql`)
- ✅ Updated `schema/index.ts` if you modified it

---

## Production Deployment

### Pre-Deployment Checklist

Before deploying to production, ensure:

- [ ] All migrations have been tested in development
- [ ] Migration files are reviewed and safe
- [ ] No breaking changes to existing tables/columns
- [ ] Backup strategy is in place (Cloudflare D1 backups)
- [ ] Rollback plan is documented

### Complete Deployment Workflow (Git + Cloudflare)

This workflow matches our standard Git-based deployment process where code is automatically deployed to Cloudflare when merged to master.

#### Step 1: Make Schema Changes Locally

1. Create or modify schema files in `src/lib/server/db/schema/`
2. Export new tables/types from `src/lib/server/db/schema/index.ts`
3. Verify TypeScript compiles: `pnpm exec tsc --noEmit`

#### Step 2: Generate Migration Files

```bash
pnpm run db:make-migrations
```

This creates a new migration file (e.g., `0007_new_feature.sql`) in `src/lib/server/db/migrations/`.

**⚠️ Important:** Review the generated migration file before proceeding!

#### Step 3: Test Migration Locally

```bash
pnpm run db:migrate:dev
```

This applies the migration to your local D1 database. Test your changes:

```bash
pnpm run dev
```

Verify:

- New functionality works
- Existing features still work
- No TypeScript errors
- Data integrity is maintained

#### Step 4: Commit and Push Changes

```bash
# Stage all changes
git add src/lib/server/db/schema/
git add src/lib/server/db/migrations/
git add src/lib/server/db/schema/index.ts  # if modified

# Commit
git commit -m "feat: add [feature name] tables and migrations"

# Push to your branch
git push origin your-branch-name
```

**Always commit:**

- ✅ Schema files (`schema/*.ts`)
- ✅ Migration files (`migrations/*.sql`)
- ✅ Updated `schema/index.ts` if modified

#### Step 5: Open Pull Request

1. Open a PR on GitHub with your changes
2. Ensure the PR includes:
   - Schema changes
   - Migration files
   - Any related code changes

#### Step 6: Merge to Master (Triggers Auto-Deploy)

1. After PR review and approval, merge to master
2. Cloudflare automatically deploys your code
3. **⚠️ Important:** The database schema is NOT automatically updated at this point

#### Step 7: Apply Migrations to Production (Manual Step)

**After the Cloudflare deployment completes**, manually apply migrations:

```bash
pnpm run db:migrate:prod
```

This runs: `wrangler d1 migrations apply budgetmaker_db --remote`

**What happens:**

- Only unapplied migrations are executed
- Migrations run in order (by filename)
- Drizzle tracks applied migrations in the database
- Production database schema matches your code

**⚠️ Critical:** You MUST run this command manually after each deployment that includes schema changes. Migrations are NOT automatically applied.

#### Step 8: Verify Production

1. Check Cloudflare deployment logs for errors
2. Verify migration status:
   ```bash
   wrangler d1 migrations list budgetmaker_db --remote
   ```
3. Test new functionality in production
4. Monitor database performance
5. Verify existing features work correctly

### Quick Reference: Complete Workflow Summary

```bash
# 1. Make schema changes
# Edit src/lib/server/db/schema/*.ts

# 2. Generate migration
pnpm run db:make-migrations

# 3. Test locally
pnpm run db:migrate:dev
pnpm run dev  # Test your changes

# 4. Commit and push
git add src/lib/server/db/schema/ src/lib/server/db/migrations/
git commit -m "feat: add [feature]"
git push origin your-branch

# 5. Open PR → Merge to master → Cloudflare auto-deploys

# 6. After deployment completes, apply migrations
pnpm run db:migrate:prod

# 7. Verify production
wrangler d1 migrations list budgetmaker_db --remote
```

### Why This Order Matters

**Deploy code first, then migrate:**

1. **Code deployment** ensures your application supports the new schema
2. **Migration** updates the database to match the code
3. This prevents downtime from schema mismatches
4. If migration fails, your code can still handle the old schema

**Migrations are NOT automatic:**

- Cloudflare auto-deploys your code when you merge to master
- Database migrations must be run manually after deployment
- This gives you control over when schema changes are applied
- You can verify deployment success before running migrations

---

## Avoiding Data Loss

### Critical Rules

#### 1. Never Drop Tables or Columns Without Migration

**❌ Bad:**

```typescript
// Don't just remove from schema
export const oldTable = sqliteTable('old_table', { ... });
```

**✅ Good:**

```sql
-- Create a migration that:
-- 1. Backs up data if needed
-- 2. Creates new table structure
-- 3. Migrates data
-- 4. Then drops old table (if necessary)
```

#### 2. Use `ALTER TABLE` for Column Changes

**❌ Bad:** Removing a column from schema without migration

**✅ Good:** Create a migration that:

```sql
-- Step 1: Add new column (nullable)
ALTER TABLE "users" ADD COLUMN "new_field" TEXT;

-- Step 2: Migrate data (if needed)
UPDATE "users" SET "new_field" = "old_field" WHERE "old_field" IS NOT NULL;

-- Step 3: Make column NOT NULL (if needed)
-- Note: SQLite doesn't support ALTER COLUMN, so you may need to recreate table
```

#### 3. Always Use `IF NOT EXISTS` / `IF EXISTS`

Drizzle generates safe migrations, but verify:

- `CREATE TABLE IF NOT EXISTS` - Won't fail if table exists
- `CREATE INDEX IF NOT EXISTS` - Won't fail if index exists

#### 4. Test Migrations on Copy of Production Data

If possible:

1. Export production data
2. Import to local database
3. Test migrations locally
4. Verify data integrity

### Backup Strategy

**Cloudflare D1 Backups:**

```bash
# Export production database (before migration)
wrangler d1 export budgetmaker_db --remote --output=backup-$(date +%Y%m%d).sql

# Import if rollback needed
wrangler d1 execute budgetmaker_db --remote --file=backup-YYYYMMDD.sql
```

**Best Practice:** Create a backup before every production migration.

---

## Best Practices

### 1. Schema Design

- **Use UUIDs for primary keys** - Consistent with existing tables
- **Include timestamps** - `createdAt` and `updatedAt` on all tables
- **Use foreign keys** - Maintain referential integrity
- **Set appropriate defaults** - Especially for boolean and timestamp fields
- **Use descriptive names** - Table and column names should be clear

### 2. Migration Safety

- **One feature per migration** - Don't mix unrelated changes
- **Test locally first** - Always test in development
- **Review generated SQL** - Don't blindly apply migrations
- **Keep migrations small** - Easier to debug and rollback
- **Document breaking changes** - Comment in migration files

### 3. Type Safety

- **Export types** - Use `InferSelectModel` for table types
- **Create composite types** - Like `BudgetWithRelations` for complex queries
- **Use TypeScript** - Let the compiler catch schema mismatches

### 4. Code Organization

- **Group related tables** - Keep related tables in the same file
- **Use consistent patterns** - Follow existing schema file structure
- **Export everything** - Make sure tables/types are exported from `index.ts`

---

## Common Scenarios

### Scenario 1: Adding a New Table

**Goal:** Add a `notifications` table

1. Create `schema/notifications.ts` with table definition
2. Export from `schema/index.ts`
3. Run `pnpm run db:make-migrations`
4. Review generated migration
5. Run `pnpm run db:migrate:dev`
6. Test locally
7. Commit changes and push to branch
8. Open PR → Merge to master → Cloudflare auto-deploys
9. **After deployment completes:** Run `pnpm run db:migrate:prod`

**See [Complete Deployment Workflow](#complete-deployment-workflow-git--cloudflare) for detailed steps.**

**Risk Level:** 🟢 Low - Adding tables is safe

### Scenario 2: Adding a Column to Existing Table

**Goal:** Add `avatarUrl` to `users` table

1. Modify `schema/users.ts`:

   ```typescript
   avatarUrl: text('avatar_url'), // Nullable by default
   ```

2. Run `pnpm run db:make-migrations`
3. Review migration - should be `ALTER TABLE ADD COLUMN`
4. Run `pnpm run db:migrate:dev` and test in development
5. Commit, push, open PR, merge to master → Cloudflare auto-deploys
6. **After deployment completes:** Run `pnpm run db:migrate:prod`

**See [Complete Deployment Workflow](#complete-deployment-workflow-git--cloudflare) for detailed steps.**

**Risk Level:** 🟢 Low - Adding nullable columns is safe

**⚠️ Warning:** Adding `NOT NULL` columns requires:

- Adding column as nullable first
- Migrating data
- Then making it NOT NULL (requires table recreation in SQLite)

### Scenario 3: Renaming a Column

**Goal:** Rename `firstName` to `first_name` (already matches DB)

**Note:** If your schema column name already matches the database column name (via the second parameter to `text()`), you're just updating the TypeScript name. This is safe.

If you need to actually rename a database column:

1. Create migration manually:

   ```sql
   -- SQLite doesn't support RENAME COLUMN directly
   -- You need to recreate the table
   CREATE TABLE "users_new" (
     -- new structure
   );
   INSERT INTO "users_new" SELECT ... FROM "users";
   DROP TABLE "users";
   ALTER TABLE "users_new" RENAME TO "users";
   ```

2. Update schema file
3. Test thoroughly

**Risk Level:** 🟡 Medium - Requires data migration

### Scenario 4: Adding a Foreign Key

**Goal:** Add foreign key relationship

1. Update schema file:

   ```typescript
   userId: text('user_id')
     .notNull()
     .references(() => users.uuid, { onDelete: 'cascade' }),
   ```

2. Generate migration
3. Verify foreign key constraint is created
4. Test that cascade deletes work correctly

**Risk Level:** 🟡 Medium - Ensure existing data satisfies constraint

### Scenario 5: Removing a Column

**Goal:** Remove unused column

**⚠️ This is destructive!**

1. **First:** Verify column is truly unused
2. **Backup:** Export production data
3. Create migration that:
   - Creates new table without column
   - Copies data (excluding removed column)
   - Drops old table
   - Renames new table
4. Update schema file
5. Test extensively
6. Deploy with caution

**Risk Level:** 🔴 High - Data loss risk

**Better Alternative:** Mark column as deprecated in code, remove later

---

## Troubleshooting

### Migration Fails in Production

1. **Check migration status:**

   ```bash
   wrangler d1 migrations list budgetmaker_db --remote
   ```

2. **Review error message** - Usually indicates constraint violation or missing data

3. **Fix data issues** - Update data to satisfy constraints

4. **Re-run migration** - Or create a new migration to fix issues

### Schema Out of Sync

If your local schema doesn't match production:

1. **Pull latest migrations** from git
2. **Apply missing migrations:**
   ```bash
   pnpm run db:migrate:dev
   ```

### Rollback Strategy

SQLite/D1 doesn't support automatic rollbacks. To rollback:

1. **Restore from backup:**

   ```bash
   wrangler d1 execute budgetmaker_db --remote --file=backup.sql
   ```

2. **Revert code** to previous version

3. **Deploy** previous version

**Prevention:** Always test migrations in development first!

---

## Quick Reference

### Commands

```bash
# Generate migrations from schema changes
pnpm run db:make-migrations

# Apply migrations to development database
pnpm run db:migrate:dev

# Apply migrations to production database
pnpm run db:migrate:prod

# Open Drizzle Studio (database GUI)
pnpm run db:studio

# Type check (verify schema compiles)
pnpm exec tsc --noEmit

# Backup production database
wrangler d1 export budgetmaker_db --remote --output=backup.sql
```

### File Locations

- **Schema files:** `src/lib/server/db/schema/*.ts`
- **Schema index:** `src/lib/server/db/schema/index.ts`
- **Main schema:** `src/lib/server/db/schema.ts`
- **Migrations:** `src/lib/server/db/migrations/*.sql`
- **Drizzle config:** `drizzle.config.ts`

---

## Summary

**Golden Rules:**

1. ✅ **Always test migrations in development first**
2. ✅ **Review generated migration files before applying**
3. ✅ **Backup production data before migrations**
4. ✅ **Deploy code before running production migrations**
5. ✅ **One feature/change per migration**
6. ✅ **Never drop tables/columns without proper migration**
7. ✅ **Use TypeScript types for type safety**
8. ✅ **Keep migrations small and focused**

**When in doubt:** Ask for review, test more, and move slowly. It's better to be cautious than to lose data!

---

## Additional Resources

- [Drizzle ORM Documentation](https://orm.drizzle.team/docs/overview)
- [Drizzle Kit Migrations](https://orm.drizzle.team/kit-docs/overview#migrations)
- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [SQLite ALTER TABLE](https://www.sqlite.org/lang_altertable.html) - Understand SQLite limitations
