import client from "@/clients/neynar";
import { processUserCasts } from "./neynar-post-processing";

import {
  generateFrameCreationRequest,
  generateSeveralFrameLinks,
} from "./framesGenerator";
import { MyCasts, MyCastsStatType, ThreadContent } from "@/types";

// TODO: Understand how 'cursor' param works for neyanr methods. I can use it for pagination
// export const getCastsByFid = async (fid: number, username: string) => {
//   const combineCurrentCursorData = (
//     currentCursorData: MyCastsStatType,
//     allUserStatData: MyCastsStatType
//   ) => {
//     allUserStatData["totalCasts"] += currentCursorData["totalCasts"];
//     allUserStatData["totalLikes"] += currentCursorData["totalLikes"];
//     allUserStatData["totalReplies"] += currentCursorData["totalReplies"];
//     allUserStatData["totalRecasts"] += currentCursorData["totalRecasts"];
//     allUserStatData["casts"] = allUserStatData["casts"].concat(
//       currentCursorData["casts"]
//     );

//     return allUserStatData;
//   };

//   // Fetching only data that is not more than PERIOD from the current date. By default, 30 days from the current day
//   const isOlderThanSpecificPeriod = (
//     data: MyCasts,
//     period: number
//   ): boolean => {
//     const currentTime = new Date();
//     const castTime = new Date(data.timestamp);
//     const differenceInTime = currentTime.getTime() - castTime.getTime();
//     const differenceInDays = differenceInTime / (1000 * 3600 * 24);

//     console.log("Diff:", castTime, differenceInDays);
//     return differenceInDays > period;
//   };

//   let cursor: string | null = "";
//   let usersStatInfo: MyCastsStatType = {
//     totalCasts: 0,
//     totalLikes: 0,
//     totalReplies: 0,
//     totalRecasts: 0,
//     casts: [],
//   };

//   let c = 0;
//   let currentUserStatData;
//   do {
//     const fidCasts = await client.fetchAllCastsCreatedByUser(fid, {
//       limit: 150,
//       cursor: cursor,
//     });

//     cursor = fidCasts.result.next.cursor;
//     currentUserStatData = processUserCasts(fidCasts, username);

//     usersStatInfo = combineCurrentCursorData(
//       currentUserStatData,
//       usersStatInfo
//     );

//     if (currentUserStatData.casts) {
//       if (isOlderThanSpecificPeriod(currentUserStatData.casts[0], 30)) {
//         break;
//       }
//     }

//     c += 1;
//   } while (cursor !== "" && cursor !== null);

//   console.log("Number of requests", c);

//   return usersStatInfo;
// };

export const getCastsByFid = async (
  fid: number,
  username: string
): Promise<MyCastsStatType> => {
  const combineStats = (stats: MyCastsStatType[]): MyCastsStatType => {
    return stats.reduce(
      (acc, curr) => ({
        totalCasts: acc.totalCasts + curr.totalCasts,
        totalLikes: acc.totalLikes + curr.totalLikes,
        totalReplies: acc.totalReplies + curr.totalReplies,
        totalRecasts: acc.totalRecasts + curr.totalRecasts,
        casts: [...acc.casts, ...curr.casts],
      }),
      {
        totalCasts: 0,
        totalLikes: 0,
        totalReplies: 0,
        totalRecasts: 0,
        casts: [],
      }
    );
  };

  const isOlderThanSpecificPeriod = (
    data: MyCasts,
    period: number
  ): boolean => {
    const currentTime = new Date();
    const castTime = new Date(data.timestamp);
    const differenceInDays =
      (currentTime.getTime() - castTime.getTime()) / (1000 * 3600 * 24);
    return differenceInDays > period;
  };

  const fetchAndProcessPage = async (
    cursor: string | null
  ): Promise<{
    stats: MyCastsStatType;
    nextCursor: string | null;
    isOld: boolean;
  }> => {
    const fidCasts = await client.fetchAllCastsCreatedByUser(fid, {
      limit: 150,
      cursor: cursor!,
    });

    const stats = processUserCasts(fidCasts, username);
    const isOld =
      stats.casts.length > 0 && isOlderThanSpecificPeriod(stats.casts[0], 30);

    return {
      stats,
      nextCursor: fidCasts.result.next.cursor,
      isOld,
    };
  };

  const batchSize = 5; // Number of parallel requests
  let cursors: (string | null)[] = [""];
  let allStats: MyCastsStatType[] = [];
  let requestCount = 0;
  let shouldStop = false;

  while (cursors.length > 0 && !shouldStop) {
    const batchPromises = cursors.map((cursor) => fetchAndProcessPage(cursor));
    const results = await Promise.all(batchPromises);

    requestCount += results.length;

    for (const result of results) {
      allStats.push(result.stats);
      if (result.isOld) {
        shouldStop = true;
        break;
      }
    }

    cursors = results
      .filter((r) => r.nextCursor !== null && !r.isOld)
      .map((r) => r.nextCursor)
      .slice(0, batchSize);
  }

  // TODO: We need to add data for a user if the number of requests are more then 10
  console.log("Number of requests", requestCount);

  return combineStats(allStats);
};

export const postFramesThread = async (userContent: Array<ThreadContent>) => {
  const contentWithLinks = await generateSeveralFrameLinks(userContent);
  const frameInfo = await generateFrameCreationRequest(contentWithLinks);

  const neynarHost = "https://api.neynar.com/v2/farcaster/frame";
  console.log("[DEBUG - utils/neynar-requests.ts] Frame request: ", frameInfo);
  const neynarResponse = await fetch(neynarHost, {
    method: "POST",
    body: JSON.stringify(frameInfo),
    headers: {
      accept: "application/json",
      api_key: `${process.env.NEXT_PUBLIC_NEYNAR_API_KEY}`,
      "content-type": "application/json",
    },
  });

  const jsonResponse = await neynarResponse.json();

  return jsonResponse;
};

export const fetchChannelForFid = async (fid: number) => {
  const channelsNumberLimit = 20;

  const { channels } = await client.fetchUsersActiveChannels(fid, {
    limit: channelsNumberLimit,
  });

  const usersChannels = channels?.map((element) => {
    return {
      channelName: element.name,
      channelId: element.id,
    };
  });

  return usersChannels;
};
