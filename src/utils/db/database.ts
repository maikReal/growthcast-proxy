import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

const checkAndCreateInitialTable = async () => {
  const client = await pool.connect();
  try {
    // Check if the table exists
    const checkTableQuery = `
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'warpdrive'
          );
        `;
    const res = await client.query(checkTableQuery);
    const tableExists = res.rows[0].exists;

    if (!tableExists) {
      // Create the table if it does not exist
      const createTableQuery = `
            CREATE TABLE warpdrive (
              "fid" NUMERIC,
              "totalCasts" NUMERIC,
              "totalLikes" NUMERIC,
              "totalReplies" NUMERIC,
              "totalRecasts" NUMERIC,
              "totalFollowers" NUMERIC,
              "casts" JSONB,
              "lastDateUpd" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
          `;
      await client.query(createTableQuery);
      console.log(
        '[DEBUG - utils/db/database] Table "warpdrive" has been created'
      );
    } else {
      console.log(
        '[DEBUG - utils/db/database] Table "warpdrive" already exists'
      );
    }
  } catch (error) {
    console.error(
      "[ERROR - utils/db/database] Error checking or creating table:",
      error
    );
  } finally {
    client.release();
  }
};

async function initializeDatabase() {
  await checkAndCreateInitialTable();
}

// initializeDatabase();

export { pool };
