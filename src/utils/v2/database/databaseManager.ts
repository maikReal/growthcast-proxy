import { Pool } from "pg";
import { logError, logInfo } from "../logs/sentryLogger";
import { getCurrentFilePath } from "@/utils/helpers";
import { sharedDatabasePool } from "@/utils/db-config";

const logsFilenamePath = getCurrentFilePath();

export class DatabaseManager {
  private pool: Pool | null = null;
  private static instance: DatabaseManager;

  private constructor() {}

  /**
   * The method to get the DatabaseManager instance if it was already created before
   *
   * @returns {DatabaseManager}
   */
  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  /**
   * The method to link the sharedDatabasePool connection to the instance
   * Also, calling a methoid that checking and creating all necessary database tables
   *
   */
  public async initialize(): Promise<void> {
    this.pool = sharedDatabasePool;

    await this.checkAndCreateTables();
  }

  /**
   * The method to check if the DatabaseManager instance was initialized
   *
   * @returns {boolean}
   */
  public isInitialized(): boolean {
    return this.pool ? true : false;
  }

  /**
   * The method to check and create all necessary table for the database
   *
   */
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
            followings INTEGER DEFAULT 0,
            verified_address JSONB,
            is_data_fetched BOOLEAN DEFAULT FALSE,
            row_created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    } finally {
      client.release();
    }
  }

  /**
   * The method to execeute custom SQL queries
   *
   * @param {string} [query] - sql query
   * @param {any[]} [queryParams] - the array of different params for the sql query
   * @returns
   */
  public async executeQuery(query: string, queryParams?: Array<any>) {
    if (!this.isInitialized()) {
      await this.initialize();
    }

    if (this.pool) {
      const client = await this.pool.connect();

      logInfo(
        `[DEBUG - ${logsFilenamePath}] 👨‍💻 Establishing the connection with a database and executing the custom SQL query`
      );

      try {
        try {
          const result = await client.query(query, queryParams);

          return result;
        } catch (error) {
          logError(
            `[ERROR - ${logsFilenamePath}] Issue occured while processing custom SQL request -> ${error}`
          );
          return null;
        }
      } catch (error) {
        logError(
          `[ERROR - ${logsFilenamePath}] Error during adding data to database: ${error}`
        );
        throw error;
      } finally {
        client.release();
        logInfo(`[DEBUG - ${logsFilenamePath}] DB released 🔗`);
      }
    } else {
      logInfo(`[DEBUG - ${logsFilenamePath}] No connection with database`);
      return null;
    }
  }

  /**
   * The metod to close the connection to the database
   */
  public async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }
}
