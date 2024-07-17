import { Pool } from "pg";
import { CastInfoProps } from "../dataProcessors/farcasterReactionsProcessor";
import { logError, logInfo } from "../logs/sentryLogger";
import { getCurrentFilePath } from "@/utils/helpers";
import { sharedDatabasePool } from "@/utils/db-config";

const logsFilenamePath = getCurrentFilePath();

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
    this.pool = sharedDatabasePool;

    await this.checkAndCreateTables();
  }

  private async checkAndCreateTables(): Promise<void> {
    if (!this.pool) {
      throw new Error("Database not initialized");
    }

    const client = await this.pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS users_casts_historical_data (
          id SERIAL PRIMARY KEY,
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

      await client.query(`
        CREATE TABLE IF NOT EXISTS users_info (
            id SERIAL PRIMARY KEY,
            fid INTEGER NOT NULL,
            username VARCHAR(255) NOT NULL,
            display_name VARCHAR(255) NOT NULL,
            pfp_url TEXT,
            followers INTEGER DEFAULT 0,
            following INTEGER DEFAULT 0,
            verified_address JSONB,
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
      INSERT INTO users_casts_historical_data (
      fid, cast_timestamp, cast_text, cast_hash, cast_likes, cast_replies, cast_recasts
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
        fid,
        item.castTimestamp,
        item.castText,
        item.castHash,
        item.castLikes,
        item.castReplies,
        item.castRecasts,
      ]);

      const result = await client.query(queryText, queryValues);
      console.log(`Inserted ${result.rowCount} rows`);

      await client.query("COMMIT");
    } catch (e) {
      console.log("Error during adding data to database", e);
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
      console.log("DB released");
    }
  }

  public async executeQuery(query: string, queryParams: Array<any>) {
    if (this.pool) {
      const client = await this.pool.connect();

      logInfo(
        `[DEBUG - ${logsFilenamePath}] Connection with database established. Executing the custom SQL query`
      );

      try {
        try {
          const result = await client.query(query, queryParams);

          return result;
        } catch (error) {
          logInfo(
            `[DEBUG - ${logsFilenamePath}] Issue occured while processing custom SQL request -> ${error}`
          );
          return null;
        }
      } catch (e) {
        console.log("Error during adding data to database", e);
        throw e;
      } finally {
        client.release();
        console.log("DB released");
      }
    } else {
      logInfo(`[DEBUG - ${logsFilenamePath}] No connection with database`);
      return null;
    }
  }

  public async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }
}
