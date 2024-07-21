import axios from "axios";
import { DatabaseManager } from "./databaseManager";
import { logError, logInfo } from "../logs/sentryLogger";
import { getCurrentFilePath } from "@/utils/helpers";
import { ComparisonAnalyticsDataPeriods } from "@/app/api/v2/get-fid-comparison-analytics/[fid]/route";

const logsFilenamePath = getCurrentFilePath();

interface AnalyticsData {
  totalCasts: number;
  totalLikes: number;
  totalRecasts: number;
  totalReplies: number;
}

interface ComparisonData {
  current: AnalyticsData;
  previous: AnalyticsData;
}

export class AnalyticalManager {
  private fid: number;
  private dbManager: DatabaseManager;

  constructor(fid: number) {
    this.fid = fid;
    this.dbManager = DatabaseManager.getInstance();
  }

  /**
   * The method to generate the comparison analytics for a FID based on his historical data
   *
   * @param {ComparisonAnalyticsDataPeriods} [period] - the period for which the compariosn analytics should be generated
   * @returns {Object}
   */
  public async getComparisonAnalytics(period: ComparisonAnalyticsDataPeriods) {
    if (!this.dbManager.isInitialized()) {
      await this.dbManager.initialize();
    }

    try {
      logInfo(
        `[DEBUG - ${logsFilenamePath}] Collecting comparison analytics for the ${this.fid} FID`
      );

      const comparisonData = await this.getComparisonData(period);
      let totalFollowers = await this.getTotalFollowersFromDatabase();

      if (!totalFollowers) {
        totalFollowers = await this.fetchFidFollowers();
      }

      if (!comparisonData || !totalFollowers) {
        logInfo(
          `[DEBUG - ${logsFilenamePath}] No data found for a current FID or we faced with some issues ☹️`
        );
        return null;
      }

      const comparisonAnalytics = {
        totalFollowers,
        currentTotalCasts: comparisonData.current.totalCasts,
        currentTotalLikes: comparisonData.current.totalLikes,
        currentTotalRecasts: comparisonData.current.totalRecasts,
        currentTotalReplies: comparisonData.current.totalReplies,
        previousTotalCasts: comparisonData.previous.totalCasts,
        previousTotalLikes: comparisonData.previous.totalLikes,
        previousTotalRecasts: comparisonData.previous.totalRecasts,
        previousTotalReplies: comparisonData.previous.totalReplies,
      };

      return comparisonAnalytics;
    } catch (err) {
      logError(
        `[ERROR - ${logsFilenamePath}] Error occured while fetching comparison analytics: ${err}`
      );
    }
  }

  /**
   * The method to generate the data for the comparison analytics for different periods
   *
   * @param {ComparisonAnalyticsDataPeriods} [period] - the period for which we need to get the comparison analytics
   * @returns {ComparisonData}
   */
  private async getComparisonData(
    period: ComparisonAnalyticsDataPeriods
  ): Promise<ComparisonData> {
    const current = await this.getAnalyticsData(
      `NOW() - INTERVAL '${period} days'`,
      "NOW()"
    );

    logInfo(
      `[DEBUG - ${logsFilenamePath}] Analytics for the current period: ${current}`
    );

    const previous = await this.getAnalyticsData(
      `NOW() - INTERVAL '${2 * period} days'`,
      `NOW() - INTERVAL '${period} days'`
    );

    logInfo(
      `[DEBUG - ${logsFilenamePath}] Analytics for the previous period: ${previous}`
    );
    return { current, previous };
  }

  /**
   * The method that calcualtes the total number of likes, recasts, replies for a specific period and fid
   *
   * @param {string} [startDate] - the period start date
   * @param {string} [endDate] - the period end date
   * @returns {AnalyticsData}
   */
  private async getAnalyticsData(
    startDate: string,
    endDate: string
  ): Promise<AnalyticsData> {
    const query = `
          SELECT 
            COUNT(*) as "totalCasts",
            SUM(cast_likes) as "totalLikes",
            SUM(cast_recasts) as "totalRecasts",
            SUM(cast_replies) as "totalReplies"
          FROM users_casts_historical_data
          WHERE fid = $1 AND cast_timestamp > ${startDate} AND cast_timestamp <= ${endDate}
        `;
    const result = await this.dbManager.executeQuery(query, [this.fid]);

    return result ? result.rows[0] : null;
  }

  /**
   * The method to get the current number of followers for a specific fid
   *
   * @returns {number}
   */
  private async getTotalFollowersFromDatabase(): Promise<number> {
    const query = `
          SELECT followers
          FROM users_info
          WHERE fid = $1
          ORDER BY row_created_date DESC
          LIMIT 1
        `;
    const result = await this.dbManager.executeQuery(query, [this.fid]);
    return result ? result.rows[0]?.followers || 0 : null;
  }

  /**
   * The method to fetch the current number of fid's followers using Neynar API thought the specific backend endpoint
   *
   * @returns {number}
   */
  private async fetchFidFollowers() {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_DOMAIN}/api/v2/get-fid-followers/${this.fid}`,
        {
          headers: {
            origin: `${process.env.NEXT_PUBLIC_DOMAIN}`,
          },
        }
      );

      const { user } = response.data;

      if (user) {
        return user.follower_count;
      } else {
        null;
      }
    } catch (error) {
      logError(
        `[ERROR - ${logsFilenamePath}] Error fetching user data: ${error}`
      );
    }
  }
}
