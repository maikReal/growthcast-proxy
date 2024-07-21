import axios from "axios";
import {
  farcasterTimestampToHumanReadable,
  getCurrentFilePath,
} from "@/utils/helpers";
import {
  CastInfoProps,
  FarcasterReactionsDataProcessor,
} from "./farcasterReactionsProcessor";
import { DatabaseManager } from "../database/databaseManager";
import { logError, logInfo } from "../logs/sentryLogger";

const logsFilenamePath = getCurrentFilePath();

export type HistoricalDataPeriods = 60 | 90;

export interface HistoricalDataFormat {
  data: {
    type: string;
    fid: number;
    timestamp: number;
    network: string;
    [key: string]: any;
  };
  hash: string;
  hashScheme: string;
  signature: string;
  signatureScheme: string;
  signer: string;
}

// DataProcessor helps to iterate over pages of historical data to get all info for a specific period, e.g. for last 60 days.
// By default it return the historical data for last 60 days. Data includes replies and personal casts
export class FarcasterHistoricalDataProcessor {
  private fid: number;
  private nowTime: Date = new Date();
  private periodEndDate: Date;
  private userHistoricalData: Array<HistoricalDataFormat>;
  private requestPageSize: number;

  private dbManager: DatabaseManager;

  // Temprorary
  private userDataWithReactions: CastInfoProps[];

  /**
   *
   * @param {number} [fid] - the user's fid
   * @param {HistoricalDataPeriods} [period] - the period for which we need to fethc the historical data
   * @param {Date} [customEndData] - the custom date after which we don't need to process data. Necessary for the updating already existed users
   * @param {number} [requestPageSize] - the number of elements that we get for a request to the Farcaster Node
   */
  constructor(
    fid: number,
    period: HistoricalDataPeriods | null,
    customEndData?: Date,
    requestPageSize?: number
  ) {
    this.fid = fid;
    this.periodEndDate = customEndData
      ? customEndData
      : this.calcualtePeriodStartDate(period);
    logInfo(
      `[DEBUG - ${logsFilenamePath}] Date until we'll fetch user's data: ${this.periodEndDate}`
    );
    this.requestPageSize = requestPageSize ? requestPageSize : 800;
    this.userHistoricalData = new Array<HistoricalDataFormat>();

    this.userDataWithReactions = new Array<CastInfoProps>();

    this.dbManager = DatabaseManager.getInstance();
  }

  /**
   * The method to generate the period start date. The method won't proceed further casts timestamps of which are less the this date
   *
   * @param {HistoricalDataFormat} [period] - the period for which we need to get historical data
   * @returns
   */
  private calcualtePeriodStartDate(period: HistoricalDataPeriods | null) {
    switch (period) {
      // If there is no period: return data for the last 1 year
      case null:
        return new Date(this.nowTime.getTime() - 360 * 24 * 60 * 60 * 1000);

      // If there is a period: use it to calcualte the date
      default:
        return new Date(this.nowTime.getTime() - period * 24 * 60 * 60 * 1000);
    }
  }

  /**
   * The method that will collect a user's casts for a specific period, e.g. last 60 days
   *
   */
  public async fetchHistoricalData() {
    // Inititalize database manager first
    if (!this.dbManager.isInitialized()) {
      logInfo(
        `[DEBUG - ${logsFilenamePath}] 👨‍💻 Initializing database connection. Creating tables...`
      );
      await this.dbManager.initialize();
    }

    let pageToken: string = "";
    let shouldContinue = true;

    while (shouldContinue) {
      const result = await this.fetchUserCasts(pageToken);

      if (!result) {
        shouldContinue = false;
        continue;
      }

      const { userCasts, nextPageToken, firstMessageTimestamp } = result;
      this.processBatch(userCasts); // Should I add await here ???

      logInfo(
        `[DEBUG - ${logsFilenamePath}] Processed batch: ${userCasts.length} casts`
      );
      logInfo(
        `[DEBUG - ${logsFilenamePath}] Latest cast timestamp: ${firstMessageTimestamp}`
      );

      if (firstMessageTimestamp < this.periodEndDate || !nextPageToken) {
        shouldContinue = false;
      } else {
        pageToken = nextPageToken;
      }
    }

    logInfo("Historical data fetching completed");
    logInfo(
      `Total number of casts that were processed: ${this.userHistoricalData.length}`
    );
  }

  /**
   * A method that is making a request to get fid's data casts using pagination
   *
   * @param {string} [pageToken] - the pagination token
   * @returns
   */
  private async fetchUserCasts(pageToken: string): Promise<{
    userCasts: HistoricalDataFormat[];
    nextPageToken: string;
    firstMessageTimestamp: Date;
  } | null> {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_NODE_ADDRESS}/v1/castsByFid?fid=${this.fid}&reverse=1&pageSize=${this.requestPageSize}&pageToken=${pageToken}`
      );

      const userCasts = response.data.messages;
      const nextPageToken = response.data.nextPageToken;

      if (userCasts.length === 0) {
        return null;
      }

      const latestCastDetails = userCasts[userCasts.length - 1].data;
      const humanReadableDate = farcasterTimestampToHumanReadable(
        latestCastDetails.timestamp
      );
      const firstMessageTimestamp = new Date(humanReadableDate);

      return { userCasts, nextPageToken, firstMessageTimestamp };
    } catch (error) {
      logError(`[DEBUG - ${logsFilenamePath}] Error fetching data: ${error}`);
      return null;
    }
  }

  /**
   * The method to fetch reactions for the batch of casts and then add the recevied statistic to the database
   *
   * @param {HistoricalDataFormat[]} [batch] - the batch of data with fid's casts that will be processed
   */
  private async processBatch(batch: HistoricalDataFormat[]) {
    this.userHistoricalData = [...this.userHistoricalData, ...batch];

    // Fetching replies and likes for a batch of casts that we received
    // Create a class for getting reactions and replies
    const reactionsDataProcessor = new FarcasterReactionsDataProcessor(
      this.fid,
      this.periodEndDate
    );

    // Set batch data for the class
    reactionsDataProcessor.setUserCasts(batch);

    // Fetch likes, recasts, and replies for the batch of casts
    // There will be processed only user's casts (not replies) + the timestamp of which is less then the periodEndDate
    const batchWithLikesNReplies =
      await reactionsDataProcessor.fetchReactionsAnalytics();

    this.userDataWithReactions = [
      ...this.userDataWithReactions,
      ...batchWithLikesNReplies,
    ];

    // Add receved data to database
    await this.addBatchToDatabase(batchWithLikesNReplies);
  }

  /**
   * The method that is adding the batch of fid's casts and their stats to the database
   *
   * @param {CastInfoProps[]} [batch] - the batch of fid's casts that will be added to database
   */
  private async addBatchToDatabase(batch: CastInfoProps[]) {
    try {
      await this.dbManager.addHistoricalData(this.fid, batch);
      logInfo(
        `[DEBUG - ${logsFilenamePath}] 🚀 There were added ${batch.length} casts to the database for the ${this.fid} FID`
      );
    } catch (error) {
      logError(
        `[DEBUG - ${logsFilenamePath}] Error while adding info to database: ${error}`
      );
    }
  }

  /**
   * The method to get raw historical data without reactions
   *
   * @returns
   */
  public getHistoricalData() {
    return this.userHistoricalData;
  }

  /**
   * The method to get historical data with reactions
   * @returns
   */
  public getDataWithReactions() {
    return this.userDataWithReactions;
  }

  // TODO: Prepare the method that can fetch user's fids for a specific period from a node
  public fetchFidFollowers() {}
}
