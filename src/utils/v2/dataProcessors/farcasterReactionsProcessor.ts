import {
  farcasterTimestampToHumanReadable,
  getCurrentFilePath,
} from "@/utils/helpers";
import { HistoricalDataFormat } from "./farcasterDataProcessor";
import axios from "axios";
import { logInfo } from "../logs/sentryLogger";

export interface CastInfoProps {
  castHash: string;
  castText: string;
  castLikes: number;
  castRecasts: number;
  castReplies: number;
  castTimestamp: Date;
}

const logsFilenamePath = getCurrentFilePath();

export class FarcasterReactionsDataProcessor {
  private fid: number;
  private userCasts: Array<HistoricalDataFormat> | null;
  private batchProcessingTimeout: number = 3000;

  // The custom date tath we use to stop processing casts that timestamp is less than this custom date
  private customLimitDate?: Date;

  /**
   *
   * @param {number} [fid] - the user's fid
   * @param {Date} [customLimitDate] - user's casts which timestamps are less then this date won't be processed
   */
  constructor(fid: number, customLimitDate?: Date) {
    this.fid = fid;
    this.userCasts = null;

    this.customLimitDate = customLimitDate;
  }

  /**
   * The method to set the raw fid's casts for further processing
   *
   * @param {HistoricalDataFormat} [userCasts] - raw casts of a user without reactions
   */
  public setUserCasts(userCasts: Array<HistoricalDataFormat>) {
    this.userCasts = userCasts;
  }

  /**
   * The method to fetch reactions for all raw casts that was provided in the constructor
   *
   * @returns
   */
  public async fetchReactionsAnalytics() {
    if (!this.userCasts) {
      return [];
    }

    const batchSize = 30; // The number of casts that we're processing at the same time
    const reactionsStat: CastInfoProps[] = [];

    for (let i = 0; i < this.userCasts.length; i += batchSize) {
      const batch = this.userCasts.slice(i, i + batchSize);
      const batchPromisesReactions = batch.map((userCast) =>
        this.calculateCastStat(userCast)
      );

      let batchResults = await Promise.all(batchPromisesReactions);

      const filterbatchResults = batchResults.filter(
        (result): result is CastInfoProps => result !== null
      );
      reactionsStat.push(...filterbatchResults);

      logInfo(
        `[DEBUG - ${logsFilenamePath}] Processed ${
          i + batchResults.length
        } out of ${this.userCasts.length} casts for the batch`
      );
      setTimeout(
        () =>
          logInfo(
            `[DEBUG - ${logsFilenamePath}] Resting... Fetching again after the ${
              this.batchProcessingTimeout / 1000
            } seconds timeout`
          ),
        this.batchProcessingTimeout
      );
    }

    return reactionsStat;
  }

  /**
   * Fetch all reactions for a one specific cast. A cast won't be processed if:
   * - it's reply to another cast
   * - it was removed
   * - timestamp is less than this.customLimitDate
   *
   * @param {HistoricalDataFormat} [cast] - cast data
   * @returns
   */
  private async calculateCastStat(cast: HistoricalDataFormat) {
    const castType = cast.data.type;

    if (castType == "MESSAGE_TYPE_CAST_REMOVE") {
      return null;
    }

    // Don't process replies of a user
    if (cast.data.castAddBody?.parentCastId) {
      return null;
    }

    const castHash: string = cast.hash;

    const castText: string = cast.data.castAddBody.text; // Should process the case if text if not available here ???
    const castTimestamp: Date = new Date(
      farcasterTimestampToHumanReadable(cast.data.timestamp)
    );

    // Current code prevent futher processing of casts that timestamp is less then the provided custom one
    if (this.customLimitDate && castTimestamp < this.customLimitDate) {
      return null;
    }

    let likes = 0;
    let recasts = 0;
    let replies = 0;

    // TODO: Add FID's mentions using /v1/castsByMention endpoint
    let mentions = 0;

    const processReactions = async () => {
      let pageToken = "";
      do {
        const reactionsData = await this.fetchCastReactions(
          castHash,
          pageToken
        );
        pageToken = reactionsData.nextPageToken;

        for (const reaction of reactionsData.messages) {
          if (
            reaction.data.type === "MESSAGE_TYPE_REACTION_ADD" &&
            reaction.data.reactionBody.targetCastId.fid == this.fid
          ) {
            if (reaction.data.reactionBody.type === "REACTION_TYPE_LIKE") {
              likes++;
            } else if (
              reaction.data.reactionBody.type === "REACTION_TYPE_RECAST"
            ) {
              recasts++;
            }
          }
        }
      } while (pageToken);
    };

    const processReplies = async () => {
      let pageToken = "";
      do {
        const repliesData = await this.fetchCastReplies(castHash, pageToken);
        pageToken = repliesData.nextPageToken;

        for (const reply of repliesData.messages) {
          if (reply.data.castAddBody.parentCastId.fid == this.fid) {
            replies += 1;
          }
        }
      } while (pageToken);
    };

    await Promise.all([processReactions(), processReplies()]);

    return {
      castHash: castHash,
      castText: castText,
      castLikes: likes,
      castRecasts: recasts,
      castReplies: replies,
      castTimestamp: castTimestamp,
    };
  }

  /**
   * The method to fetch a cast's reactions with a pagination
   *
   * @param {string} [castHash] - cast hash
   * @param {string} [pageToken] - pagination token
   * @returns
   */
  private async fetchCastReactions(castHash: string, pageToken: string = "") {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_NODE_ADDRESS}/v1/reactionsByCast?target_fid=${this.fid}&target_hash=${castHash}&pageSize=800&pageToken=${pageToken}`
    );

    return response.data;
  }

  /**
   * The method to fetch replies for a cast
   *
   * @param {string} [castHash] - cast hash
   * @param {string} [pageToken] - pagination token
   * @returns
   */
  private async fetchCastReplies(castHash: string, pageToken: string = "") {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_NODE_ADDRESS}/v1/castsByParent?fid=${this.fid}&hash=${castHash}&pageSize=800&pageToken=${pageToken}`
    );

    return response.data;
  }
}
