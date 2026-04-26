This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3090](http://localhost:3090) with your browser to see the result.

## Database Bootstrap

If the SQLite database is empty or has been replaced, initialize the schema and seed the basic content with:

```bash
npm run db:push
npm run db:bootstrap
npm run db:sync-egg-media
```

`db:bootstrap` will:

- sync `data/jingling.json` into the `Elf` table
- rebuild each elf's image gallery records
- create a sample starter guide article in the `Article` table

By default, `db:bootstrap` runs in safe mode: it only inserts missing records and does not overwrite existing data.
If you need to force overwrite existing seeded records, run:

```bash
npm run db:bootstrap -- --force
```

`db:sync-egg-media` will:

- read `data/eggs.json`
- sync egg image URLs into `Elf.eggImageUrl`
- sync fruit image URLs into `Elf.fruitImageUrl`

## Safe Server Update

For production updates, use the guarded deploy script after `git pull` and `npm install`:

```bash
npm run deploy:safe
pm2 restart <your-backend-process-name>
```

`deploy:safe` will:

- verify Prisma is connected to `prisma/dev.db`
- create a timestamped SQLite backup under `prisma/backups/`
- run Prisma schema push without accepting destructive data loss
- run the data sync scripts and build the app

If the server should use the existing database with user data, set `.env` explicitly:

```env
DATABASE_URL="file:/www/wwwroot/roco-backend/prisma/dev.db"
```

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
