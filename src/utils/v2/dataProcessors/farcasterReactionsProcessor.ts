import { farcasterTimestampToHumanReadable } from "@/utils/helpers";
import { HistoricalDataFormat } from "./farcasterDataProcessor";
import axios from "axios";

export interface CastInfoProps {
  castHash: string;
  castText: string;
  castLikes: number;
  castRecasts: number;
  castReplies: number;
  castTimestamp: Date;
}

interface ReactionProps {
  [key: string]: any;
  hash: string;
  hashScheme: string;
  signature: string;
  signatureScheme: string;
  signer: string;
}
export class FarcasterReactionsDataProcessor {
  private fid: number;
  private userCasts: Array<HistoricalDataFormat> | null;

  constructor(fid: number) {
    this.fid = fid;
    this.userCasts = null;
  }

  public setUserCasts(userCasts: Array<HistoricalDataFormat>) {
    this.userCasts = userCasts;
  }

  public async fetchReactionsAnalytics() {
    if (!this.userCasts) {
      return [];
    }

    const batchSize = 30; // Adjust this based on your API's rate limits and performance
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

      console.log(
        `Processed ${i + batchResults.length} out of ${
          this.userCasts.length
        } casts for the batch`
      );
      setTimeout(() => console.log("Fetching again after the timeout"), 3000);
    }

    return reactionsStat;
  }

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

  private async fetchCastReactions(castHash: string, pageToken: string = "") {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_NODE_ADDRESS}/v1/reactionsByCast?target_fid=${this.fid}&target_hash=${castHash}&pageSize=800&pageToken=${pageToken}`
    );

    return response.data;
  }

  private async fetchCastReplies(castHash: string, pageToken: string = "") {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_NODE_ADDRESS}/v1/castsByParent?fid=${this.fid}&hash=${castHash}&pageSize=800&pageToken=${pageToken}`
    );

    return response.data;
  }
}
