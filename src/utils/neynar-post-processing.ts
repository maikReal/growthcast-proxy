import { CastsResponse } from "@neynar/nodejs-sdk/build/neynar-api/v1";

import { generateCastLink } from "./helpers";
import { MyCastsStatType } from "@/types";

export const processUserCasts = (neynarData: CastsResponse, fname: string) => {
  let userCastsStat: MyCastsStatType = {
    totalCasts: 0,
    totalLikes: 0,
    totalReplies: 0,
    totalRecasts: 0,
    casts: [],
  };

  neynarData.result.casts.forEach((element) => {
    // TODO: Add filter by date
    // Check if a cast is created by a fid

    if (!element.parentAuthor.fid) {
      userCastsStat.totalCasts += 1;
      userCastsStat.totalLikes += element.reactions.count;
      userCastsStat.totalReplies += element.replies.count;
      userCastsStat.totalRecasts += element.recasts.count;

      userCastsStat.casts.push({
        text: element.text,
        linkToCast: generateCastLink(element.hash, fname),
        likes: element.reactions.count,
        replies: element.replies.count,
        recasts: element.recasts.count,
        timestamp: element.timestamp,
      });
    }
  });

  return userCastsStat;
};
