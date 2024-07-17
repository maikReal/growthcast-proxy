import axios from "axios";
import { farcasterTimestampToHumanReadable } from "@/utils/helpers";
import {
  CastInfoProps,
  FarcasterReactionsDataProcessor,
} from "./farcasterReactionsProcessor";
import { DatabaseManager } from "../database/databaseManager";
import { logInfo } from "../logs/sentryLogger";

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
  private batchSize: number;

  private dbManager: DatabaseManager;

  // Temprorary
  private userDataWithReactions: CastInfoProps[];

  constructor(
    fid: number,
    period: HistoricalDataPeriods | null,
    batchSize: number = 5
  ) {
    this.fid = fid;
    this.periodEndDate = this.calcualtePeriodStartDate(period);
    logInfo(`End date: ${this.periodEndDate}`);
    this.userHistoricalData = new Array<HistoricalDataFormat>();
    this.batchSize = batchSize;

    this.userDataWithReactions = new Array<CastInfoProps>();

    this.dbManager = DatabaseManager.getInstance();
  }

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

  // The method that will collect a user's casts for a specific period, e.g. last 60 days
  public async fetchHistoricalData() {
    // Inititalize database manager first
    console.log("📣 Initializing database connection n tables creation...");
    await this.dbManager.initialize();

    let pageToken: string = "";
    let shouldContinue = true;

    while (shouldContinue) {
      const batchPromises = [];
      for (let i = 0; i < this.batchSize && shouldContinue; i++) {
        batchPromises.push(this.fetchSingleRequest(pageToken));
      }

      const batchResults = await Promise.all(batchPromises);

      for (const result of batchResults) {
        if (!result) continue;

        const { userCasts, nextPageToken, firstMessageTimestamp } = result;
        await this.processBatch(userCasts);

        console.log(`Processed batch: ${userCasts.length} casts`);
        console.log("Latest cast timestamp:", firstMessageTimestamp);

        if (firstMessageTimestamp < this.periodEndDate || !nextPageToken) {
          shouldContinue = false;
          break;
        }

        pageToken = nextPageToken;
      }
    }

    console.log("Historical data fetching completed.");
    console.log("Total number of casts:", this.userHistoricalData.length);

    // this.reactionsDataProcessor.setUserCasts(this.userHistoricalData);
  }

  private async fetchSingleRequest(pageToken: string): Promise<{
    userCasts: HistoricalDataFormat[];
    nextPageToken: string;
    firstMessageTimestamp: Date;
  } | null> {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_NODE_ADDRESS}/v1/castsByFid?fid=${this.fid}&reverse=1&pageSize=800&pageToken=${pageToken}`
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
      console.error("Error fetching data:", error);
      return null;
    }
  }

  private async processBatch(batch: HistoricalDataFormat[]) {
    this.userHistoricalData = [...this.userHistoricalData, ...batch];

    // Fetching replies and likes for a batch of casts that we received
    // Create a class for getting reactions and replies
    const reactionsDataProcessor = new FarcasterReactionsDataProcessor(
      this.fid
    );

    // Set batch data for the class
    reactionsDataProcessor.setUserCasts(batch);

    // Fetch likes, recasts, and replies for the batch of casts
    const batchWithLikesNReplies =
      await reactionsDataProcessor.fetchReactionsAnalytics();

    this.userDataWithReactions = [
      ...this.userDataWithReactions,
      ...batchWithLikesNReplies,
    ];

    // Add receved data to database
    await this.addBatchToDatabase(batchWithLikesNReplies);
  }

  private async addBatchToDatabase(batch: CastInfoProps[]) {
    console.log(
      `🚀 Adding batch with the ${batch.length} length to the database`
    );
    // await DatabaseClient.addCasts(batch);

    try {
      await this.dbManager.addHistoricalData(this.fid, batch);
      console.log(`🚀 Added batch with the length: ${batch.length}`);
    } catch (error) {
      console.log("Error while adding info to database...");
    }

    // Close the database connection after adding all user's historical data
    // this.dbManager.close();
  }

  public getHistoricalData() {
    return this.userHistoricalData;
  }

  public getDataWithReactions() {
    return this.userDataWithReactions;
  }

  // TODO: Prepare the method that can fetch user's fids for a specific period from a node
  public fetchFidFollowers() {}

  // The method that will get the comparison analytics for different periods: 7 days, 14 days, 30 days
  // public async getComparisonAnalytics() {
  //   console.log("Fetching reactions for historical data...");
  //   return await this.reactionsDataProcessor.fetchReactionsAnalytics();
  // }

  // Add the comparison analytics for a specific date to database. The result of getComparisonAnalytics function
  // private addComparisonAnalyticsToDb() {
  // Save comparison analytics to database, so we can update the data later using DatabaseProcessor
  // }
}
