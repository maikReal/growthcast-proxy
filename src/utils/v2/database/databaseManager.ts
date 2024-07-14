import { Pool } from "pg";
import { CastInfoProps } from "../dataProcessors/farcasterReactionsProcessor";

export class DatabaseManager {
  private pool: Pool | null = null;
  private static instance: DatabaseManager;

  private constructor() {}

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  public async initialize(): Promise<void> {
    this.pool = new Pool({
      connectionString: process.env.POSTGRES_URL,
    });

    await this.checkAndCreateTables();
  }

  private async checkAndCreateTables(): Promise<void> {
    if (!this.pool) {
      throw new Error("Database not initialized");
    }

    const client = await this.pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS users_all_historical_data (
          fid INTEGER,
          cast_timestamp TIMESTAMP,
          cast_text TEXT,
          cast_hash TEXT,
          cast_likes INTEGER,
          cast_replies INTEGER,
          cast_recasts INTEGER,
          row_created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    } finally {
      client.release();
    }
  }

  public async addHistoricalData(
    fid: number,
    data: CastInfoProps[]
  ): Promise<void> {
    if (!this.pool) {
      throw new Error("Database not initialized");
    }

    console.log("👨‍💻 Establishing connect with a database...");
    const client = await this.pool.connect();
    try {
      console.log("👨‍💻 Starting to add data to database...");
      await client.query("BEGIN");

      const queryText = `
      INSERT INTO users_all_historical_data (
        cast_hash, cast_text, cast_likes, cast_recasts, cast_replies, cast_timestamp, fid
      ) VALUES 
      ${data
        .map(
          (_, i) =>
            `($${i * 7 + 1}, $${i * 7 + 2}, $${i * 7 + 3}, $${i * 7 + 4}, $${
              i * 7 + 5
            }, $${i * 7 + 6}, $${i * 7 + 7})`
        )
        .join(", ")}
    `;

      const queryValues = data.flatMap((item) => [
        item.castHash,
        item.castText,
        item.castLikes,
        item.castRecasts,
        item.castReplies,
        item.castTimestamp,
        fid,
      ]);

      await client.query(queryText, queryValues);

      await client.query("COMMIT");
    } catch (e) {
      console.error("Error during adding data to database", e);
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }

  public async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }
}
