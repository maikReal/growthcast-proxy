# Growthcast backend

[![Deployment Status](https://vercel.com/maikyman/warp-drive-proxy/badge)](https://vercel.com/maikyman/warp-drive-proxy)

## Getting Started

### Install depndencies

First, install all necessary dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

### Create .env.\* files

Second, create .env and .env.developemnt files for running the project

### Run dev env

Third, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

API endpoints are available under the following root:

- /api/v1
- /api/v2
  Example of the endpoint for the local env:

```bash
curl http://localhost:3000/api/v2/get-fid-history/295767?period=60days
```

Growthcast login page avilable by the following path:

- <domain>/signin

## Deploy on Vercel

The project is autodeployed to Vercel after every commit. All non-main branches automatically get dev subdomain, e.g. **dev.growthcast.xyz**
The main branch is available by the **proxy.growthcast.xyz** domain

To deploy to vercel manually, use th following command:

```bash
vercel
```

# Database schemas and queries

## Schemas

### [DEPRECATED] V1

The V1 backend had previously the folowing databases and worked only with them. The V2 endpoints don't work with current tables and work only with those that listed on the V2 section below

```sql
CREATE TABLE public."warpdrive-db" (
fid numeric NOT NULL,
casts json NULL
);
```

```sql
CREATE TABLE warpdrive_webhook_subscribers (
id SERIAL PRIMARY KEY,
"user_fid" INTEGER NOT NULL,
"date_added" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

```sql
CREATE TABLE public.warpdrive_streaks (
	id serial NOT NULL,
	user_fid int4 NOT NULL,
	date_added timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"timestamp" timestamp NOT NULL,
	hash text NOT NULL,
	CONSTRAINT warpdrive_streaks_pkey PRIMARY KEY (id)
);
```

### V2

The main table in the V2 version is **users_all_historical_data**

```sql
CREATE TABLE public.users_casts_historical_data (
	fid int4 NULL,
	cast_timestamp timestamp NULL,
	cast_text text NULL,
	cast_hash text NULL,
	cast_likes int4 NULL,
	cast_replies int4 NULL,
	cast_recasts int4 NULL,
	row_created_date timestamp NULL DEFAULT CURRENT_TIMESTAMP
);
```

The FarcasterDataProcessor fetch all user's historical data from the Farcaster node, collect reactions and other statistics and then, using the DatabaseManager, adds it to the database

Later on, current data can be used for generating comparison analytics for different periods as well as for the calculating user's streak

## Logic

### V2

The logic of the FarcasterDataProcessor and FarcasterReactionsDataProcessor is described on the schema below

**TLDR:**

- User logins to the Growthcast
- Starting to fetch his data from current day to his first day by batches
- Adding batches of data to database

![growthcast-backend-schema](https://github.com/maikReal/warp-drive-proxy/blob/main/public/app-logic.png?raw=true)

## TODO

- [x] Add logs to Sentry
- [x] Remove unnecesary code
