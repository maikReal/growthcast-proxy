import axios from "axios";
import { DatabaseManager } from "./databaseManager";
import { logInfo } from "../logs/sentryLogger";
import { getCurrentFilePath } from "@/utils/helpers";
import { UserInfo } from "@/app/api/v2/get-fid-followers/[fid]/route";
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

    this.dbManager.initialize();
  }

  async getComparisonAnalytics(period: ComparisonAnalyticsDataPeriods) {
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

      //   return JSON.stringify(fileData, null, 2);
      return comparisonAnalytics;
    } finally {
      // this.dbManager.close();
    }
  }

  private async getComparisonData(
    days: ComparisonAnalyticsDataPeriods
  ): Promise<ComparisonData> {
    const current = await this.getAnalyticsData(
      `NOW() - INTERVAL '${days} days'`,
      "NOW()"
    );

    console.log("Current res", current);

    const previous = await this.getAnalyticsData(
      `NOW() - INTERVAL '${2 * days} days'`,
      `NOW() - INTERVAL '${days} days'`
    );

    console.log("Previous res", previous);
    return { current, previous };
  }

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
      console.error("Error fetching user data:", error);
    }
  }
}
