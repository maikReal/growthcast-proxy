## Growthcast backend

This repos contains the backend part of the Growthcast extension. The current repo contains the following main components:

- API endpoints to interact with the extension (more details about the API endpoints)
- The sign in page that can be used to login to a Farcaster account

Growthcast login page avilable by the following path:

```planetext
http://localhost:3000/signin
```

## Getting Started

Requirements:

1. Cloud or hardware server to:
   - Running Farcaster node
   - Running PostgresSQL database (14.12+)
2. Neynar API key. It could be generated on https://neynar.com
3. npm: 10.5.0+
4. Next.js: 14.2.4+

### Farcaster node

To run the backend you need to have the running Farcaster node. To get more details how to laucnh your own Farcaster node, you can refer to [the following documentation](https://www.thehubble.xyz/intro/hubble.html)

The basic server setup to run the Farcaster node:

- 16 GB of RAM
- 4 CPU cores or vCPUs
- 200 GB of free storage
- A public IP address with ports 2282 - 2285 exposed

### PostgresSQL

To run the backend you also need to have a running PostgreSQL database. It could be on the same server or on the separate one

The requirement version is 14.12+

The database schema is described in the following section:

### NeynarSDK

For the simplicity, some of endpoints are using NeynarSDK to get some Farcaster data. The login is also provided by NeynarSDK. If you don't want to use NeynarSDK, you need to re-write necessary endpoints to interacting with Farcaster Node as well as re-write the login process without using the SDK

To get the Neynar API key you need to go to https://neynar.com and buy the subscription. The key is available in the dev portal: https://dev.neynar.com

### Enviroment variables

To run the backend properly, you need to create a file with enviroment variables. You can use 2 different files for the development and production:

- .env - for the production
- .env.development - for the development

The more details about variables will be described in the table below:

| Environment Variable                 | Description                             | Example Value                                                                                                                                                                                         |
| ------------------------------------ | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_NEYNAR_CLIENT_ID`       | Client ID for Neynar                    | `07082225-8b12-458f-b0ba-d5bf6f26a7e6`                                                                                                                                                                |
| `NEXT_PUBLIC_NEYNAR_API_KEY`         | API Key for Neynar                      | `D2DD113E-6156-4837-B1F7-1AF7F410036E`                                                                                                                                                                |
| `NEXT_PUBLIC_DOMAIN`                 | Domain for local development            | `http://localhost:3000`                                                                                                                                                                               |
| `NEXT_PUBLIC_ENCRYPTION_KEY`         | Key used for encryption                 | `4ed2309caafc493d29432f16626163d8ff683de2522960e3765c3459777fce14`                                                                                                                                    |
| `NEXT_PUBLIC_REFRESH_ENCRYPTION_KEY` | Key used for refreshing encryption      | `2qaBFBAJ2UDha0hntZG+5TN7SjKcsNLOGQUgDN+Lul0=`                                                                                                                                                        |
| `NEXT_PUBLIC_IMGUR_CLIENT_ID`        | Imgur Client ID                         | `129b687c7b3f67b`                                                                                                                                                                                     |
| `NEXT_PUBLIC_IMGUR_CLIENT_SECRET`    | Imgur Client Secret                     | `993b7160c7aad652783d1bf168c256603ac1f339`                                                                                                                                                            |
| `NEXT_PUBLIC_WARPCAST_HOST`          | Host URL for Warpcast API               | `https://api.warpcast.com`                                                                                                                                                                            |
| `NEXT_PUBLIC_OPENRANK_HOST`          | Host URL for OpenRank API               | `https://graph.cast.k3l.io`                                                                                                                                                                           |
| `NEXT_PUBLIC_NEYNAR_HOST`            | Host URL for Neynar API                 | `https://api.neynar.com`                                                                                                                                                                              |
| `NEXT_PUBLIC_DEV_MODE`               | Enable/Disable development mode         | `true`                                                                                                                                                                                                |
| `SENTRY_AUTH_TOKEN`                  | Auth token for Sentry                   | `sntrys_eyJpOPQiOjE3MjAzNzQ4NTkuMTE3OTI1LCJ1cmwiOiJodHRwczovL3NlbnRyeS5pbyIsInJlZ2lvbl91cmwiOiJodHRwczovL2RlLnNlbnRyeS5pbyIsIm9yZyI6Imdyb3d0aGNhc3QifQ==_DHBTfO7HLAjPtK8E042ws39AJh8rJ4fD1lQ+7i2kcp8` |
| `NEXT_PUBLIC_NODE_ADDRESS`           | Node address for Warp Drive             | `http://hub.warp-drive.xyz`                                                                                                                                                                           |
| `POSTGRES_V2_URL`                    | PostgreSQL connection URL               | `postgres://manager:3bCaP3Axg1jnqQw6NERg@135.181.149.175/growthcast_dev`                                                                                                                              |
| `POSTGRES_V2_URL_NON_POOLING`        | PostgreSQL connection URL (non-pooling) | `postgres://manager:3bCaP3Axg1jnqQw6NERg@135.181.149.175/growthcast_dev?sslmode=require`                                                                                                              |
| `POSTGRES_V2_URL_NO_SSL`             | PostgreSQL connection URL (no SSL)      | `postgres://manager:3bCaP3Axg1jnqQw6NERg@135.181.149.175/growthcast_dev`                                                                                                                              |
| `POSTGRES_V2_PRISMA_URL`             | PostgreSQL connection URL for Prisma    | `postgres://manager:3bCaP3Axg1jnqQw6NERg@135.181.149.175/growthcast_dev?pgbouncer=true&connect_timeout=15&sslmode=require`                                                                            |
| `POSTGRES_V2_USER`                   | PostgreSQL user                         | `manager`                                                                                                                                                                                             |
| `POSTGRES_V2_PASSWORD`               | PostgreSQL password                     | `3bCaP3Axg1jnqQw6NERg`                                                                                                                                                                                |
| `POSTGRES_V2_HOST`                   | PostgreSQL host                         | `135.181.142.175`                                                                                                                                                                                     |
| `POSTGRES_V2_DATABASE`               | PostgreSQL database name                | `growthcast_dev`                                                                                                                                                                                      |

### Installation guide

The following steps should be completed before starting the further installation:

- [x] Laucnh the server
- [x] Run a Farcaster node
- [x] Run a PostgreSQL database
- [x] Create file with enviroment variables
- [x] Create and add the Neynar API key to the .env / .env.development

Right after all steps above will be completed, you can laucnh the backend!

1. Install all necessary dependencies:

   ```bash
   npm install
   ```

2. Run the backend locally

   ```bash
   npm run dev
   ```

3. The backend API is available through http://localhost:3000/api. The sign in is available by http://localhost:3000/signin URL

### Deployment guide

### Deploy on Vercel

You can deploy the backend in one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/import/project?template=https://github.com/maikReal/growthcast-proxy)

Make sure to add the enviroment variables for your Vercel project. Get more details about the envs on the following section:

You can also deploy the project to Vercel manually using the bash command:

```bash
vercel
```

Make sure that you've installed the Vercel with the ... version

## Techincal details

Below there will be describe some technical details about API, PostgreSQL, and Farcaster data processing

### API endpoints

The API endpoints swagger is available by the following URL:

```plaintext
http://localhost:3000/api-doc
```

### PostgreSQL

There are several database tables that are mainly used by the backend:

- **users_casts_historical_data**
  Stores pre-processed information about users casts for the whole user's casts history
- **users_info**
  Stores the basic pre-processed data about a user and his activity on Farcaster

All tables will be automatically created during the first launch. The only thing that you need to do is to create the database that should have the "growthcast" name and "growthcast_dev" for the development database

#### Schemas

**users_all_historical_data** table schema:

```sql
CREATE TABLE users_casts_historical_data (
	fid int4 NULL,
	cast_timestamp timestamp NULL,
	cast_text text NULL,
	cast_hash text NULL,
	cast_likes int4 NULL,
	cast_replies int4 NULL,
	cast_recasts int4 NULL,
	row_created_date timestamp NULL DEFAULT CURRENT_TIMESTAMP
)
```

**users_info** table schema:

```sql
CREATE TABLE IF NOT EXISTS users_info (
	id SERIAL PRIMARY KEY,
	fid INTEGER NOT NULL,
	username VARCHAR(255) NOT NULL,
	display_name VARCHAR(255) NOT NULL,
	pfp_url TEXT,
	followers INTEGER DEFAULT 0,
	followings INTEGER DEFAULT 0,
	verified_address JSONB,
	is_data_fetched BOOLEAN DEFAULT FALSE,
	row_created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	)
```

### Data processing logic

The logic of the FarcasterDataProcessor and FarcasterReactionsDataProcessor is described on the schema below

> **TLDR:**
>
> - User logins to the Growthcast
> - Starting to fetch his data from current day to his first day until his first day by batches
> - Adding batches of data to database, so a service can get access to data without waiting for fethcing of all data

![growthcast-backend-schema](https://raw.githubusercontent.com/maikReal/growthcast-proxy/main/public/growthcast-logic.jpg?raw=true)

## License

Shield: [![CC BY 4.0][cc-by-shield]][cc-by]

This work is licensed under a
[Creative Commons Attribution 4.0 International License][cc-by].

[![CC BY 4.0][cc-by-image]][cc-by]

[cc-by]: http://creativecommons.org/licenses/by/4.0/
[cc-by-image]: https://i.creativecommons.org/l/by/4.0/88x31.png
[cc-by-shield]: https://img.shields.io/badge/License-CC%20BY%204.0-lightgrey.svg
