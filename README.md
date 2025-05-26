# Budgetmaker IO

## Developing

- git clone repo
- cd into project
- pnpm install
- create .env file
- variables with correct values:
  JWT_SECRET=<get secret code>
  # key for sending emails
  RESEND_API_KEY=<get resend api key>
  # used for admin routes for external access (like expired user cleanup route)
  ADMIN_API_KEY=<get admin api key>

```bash
npm run dev
```

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

## Dev

Run:

```bash
pnpm run dev
```

## Preview

Run:

```bash
pnpm run preview
```

## Deploy

- checkout branch
- make changes
- commit
- push
- PR
- merge (auto deploy)

## DB

If there are schema changes and we need to migrate the DB,
Run:

## Make migrations - generates migration files

```bash
pnpm run db:make-migrations
```

## Migrate - applies migrations to the (LOCAL D1 simulation) database

```bash
pnpm run db:migrate:dev
```

## Migrate to D1 production database

```bash
pnpm run db:migrate:prod
```

```bash
wrangler d1 migrations apply <name-of-db> --remote
```

example: wrangler d1 migrations apply budgetmaker_db --remote
