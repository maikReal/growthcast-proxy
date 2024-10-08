import client from "@/clients/neynar";
import { processUserCasts } from "./neynar-post-processing";

import {
  generateFrameCreationRequest,
  generateSeveralFrameLinks,
} from "./framesGenerator";
import { ThreadContent } from "@/types";

// TODO: Understand how 'cursor' param works for neyanr methods. I can use it for pagination
export const getCastsByFid = async (fid: number, username: string) => {
  const fidCasts = await client.fetchAllCastsCreatedByUser(fid, {
    limit: 150,
  });

  return processUserCasts(fidCasts, username);
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
