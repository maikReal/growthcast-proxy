import { Pool } from "pg";

export const sharedDatabasePool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});
