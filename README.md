# Budgetmaker IO

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```bash
# create a new project in the current directory
npx sv create

# create a new project in my-app
npx sv create my-app
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
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

## Migrate - applies migrations to the (LOCAL) database

```bash
pnpm run db:migrate
```

## Migrate to D1 simulated database for local testing
```bash
wrangler d1 migrations apply <name-of-db>
```

## Migrate to D1 production database

```bash
wrangler d1 migrations apply <name-of-db> --remote
```
example: wrangler d1 migrations apply budgetmaker_db --remote