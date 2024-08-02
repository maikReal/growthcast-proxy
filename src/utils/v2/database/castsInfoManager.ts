import { getCurrentFilePath } from "@/utils/helpers";
import { DatabaseManager } from "./databaseManager";
import { logError, logInfo } from "../logs/sentryLogger";
import { CastInfoProps } from "../dataProcessors/farcasterReactionsProcessor";

const logsFilenamePath = getCurrentFilePath();

export interface CastsStats {
  uniqueTotalCasts: number;
  castsInfo: CastsInfo;
}

export interface CastsInfo {
  total_likes: number;
  total_replies: number;
  total_recasts: number;
}

export interface CastDetails {
  total_likes: number;
  total_replies: number;
  total_recasts: number;
  cast_text: string;
  cast_timestamp: Date;
}

export class CastsInfoManager {
  private fid: number;
  private dbManager: DatabaseManager;

  constructor(fid: number) {
    this.fid = fid;
    this.dbManager = DatabaseManager.getInstance();
  }

  /**
   * The method to add historical data that was received from the node
   *
   * @param {CastInfoProps[]} [data] - the array of historical casts for a fid
   */
  public async addHistoricalData(data: CastInfoProps[]): Promise<void> {
    try {
      logInfo(
        `[DEBUG - ${logsFilenamePath}] 👨‍💻 Starting to add data to database...`
      );
      await this.dbManager.executeQuery("BEGIN");

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
        this.fid,
        item.castTimestamp,
        item.castText,
        item.castHash,
        item.castLikes,
        item.castReplies,
        item.castRecasts,
      ]);

      const result = await this.dbManager.executeQuery(queryText, queryValues);
      logInfo(
        `[DEBUG - ${logsFilenamePath}] Inserted ${
          result ? result.rowCount : 0
        } rows`
      );

      await this.dbManager.executeQuery("COMMIT");
    } catch (err) {
      logError(
        `[DEBUG - ${logsFilenamePath}] Error during adding data to database: ${err}`
      );
      await this.dbManager.executeQuery("ROLLBACK");
      throw err;
    }
  }

  /**
   * The method to get the last dete when historical data was fetched
   *
   * @returns {Date}
   */
  public async getLastFetchDateOfFidData(): Promise<Date | null | undefined> {
    try {
      const query = `
      SELECT MIN(row_created_date) as earliest_date
      FROM users_casts_historical_data
      WHERE fid = $1;
    `;

      // Execute the query
      const databaseResult = await this.dbManager.executeQuery(query, [
        this.fid,
      ]);

      if (!databaseResult) {
        return null;
      }

      // Extract the earliest date from the result
      const earliestDate = databaseResult.rows[0]?.earliest_date || null;

      return earliestDate ? new Date(earliestDate) : null;
    } catch (error) {
      logError(
        `[ERROR - ${logsFilenamePath}] Error executing getLastFetchDateOfFidData() method: ${error}`
      );
      throw error;
    }
  }

  /**
   * The method is responsible to generate statistic about a user's casts:
   * - total number of casts
   * - total number of replies
   * - total number of likes
   * - total number of recasts
   *
   * @returns {CastsStats | null}
   */
  public async getCastsStat(): Promise<CastsStats | null> {
    try {
      const castsInfoQuery = `
            SELECT 
                SUM(cast_likes) AS total_likes,
                SUM(cast_replies) AS total_replies,
                SUM(cast_recasts) AS total_recasts
            FROM users_casts_historical_data
            WHERE fid = $1
        `;

      // Query to calculate total unique rows based on cast_hash
      const uniqueTotalCastsQuery = `
            SELECT 
                COUNT(DISTINCT cast_hash) AS unique_casts
            FROM users_casts_historical_data
            WHERE fid = $1
        `;

      // Execute the queries
      const uniqueTotalCastsResult = await this.dbManager.executeQuery(
        uniqueTotalCastsQuery,
        [this.fid]
      );
      const castsInfoQueryResult = await this.dbManager.executeQuery(
        castsInfoQuery,
        [this.fid]
      );

      // Extract the results
      const uniqueTotalCasts: number = uniqueTotalCastsResult?.rows[0];
      const castsInfo: CastsInfo = castsInfoQueryResult?.rows[0];

      return !uniqueTotalCasts || !castsInfo
        ? null
        : { uniqueTotalCasts, castsInfo };
    } catch (error) {
      logError(
        `[ERROR - ${logsFilenamePath}] Error executing getCastsStat() method: ${error}`
      );
      return null;
    }
  }

  /**
   * Get the list of casts by pages. Only "castsLimit" number of casts can be returned on one page
   *
   *
   * @param {Date}[startDate] - pagintaion is calculated by the timestamp of cast. E.g. 10 casts earlier them 11 of August
   * @param {number}[castsLimit] - the number of casts that will be returned per page
   * @returns
   */
  public async getPaginatedCasts(
    startDate: Date,
    castsLimit: number | null
  ): Promise<CastDetails[] | null> {
    const paginatedCastsQuery = `
            SELECT 
                cast_text, 
                cast_likes, 
                cast_recasts, 
                cast_replies, 
                cast_timestamp
            FROM users_casts_historical_data
            WHERE fid = $1 and cast_timestamp < $2
            LIMIT $3
        `;

    const paginatedCastsResult = await this.dbManager.executeQuery(
      paginatedCastsQuery,
      [this.fid, startDate, castsLimit]
    );

    const paginatedCasts: CastDetails[] | null =
      paginatedCastsResult?.rows as CastDetails[];

    return paginatedCasts;
  }
}
