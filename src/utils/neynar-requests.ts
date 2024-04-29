import client from "@/clients/neynar";
import { processUserCasts } from "./neynar-post-processing";

import {
  generateFrameCreationRequest,
  generateSeveralFrameLinks,
} from "./framesGenerator";
import { FrameContent } from "@/types";

// TODO: Understand how 'cursor' param works for neyanr methods. I can use it for pagination
export const getCastsByFid = async (fid: number, username: string) => {
  const fidCasts = await client.fetchAllCastsCreatedByUser(fid);

  return processUserCasts(fidCasts, username);
};

export const postFramesThread = async (userContent: Array<FrameContent>) => {
  const contentWithLinks = await generateSeveralFrameLinks(userContent);
  const frameInfo = await generateFrameCreationRequest(contentWithLinks);

  const neynarHost = "https://api.neynar.com/v2/farcaster/frame";
  console.log("Frame request: ", frameInfo);
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
