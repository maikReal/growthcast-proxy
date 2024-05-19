import { NextRequest } from "next/server";
import { headers } from "next/headers";
import {
  nonAuthHttpResponse,
  internalServerErrorHttpResponse,
  apiErrorHttpResponse,
  successHttpResponse,
  verifyAuth,
} from "@/utils/helpers";
import { fetchChannelForFid } from "@/utils/neynar-requests";
import { isApiErrorResponse } from "@neynar/nodejs-sdk";
import { Channel } from "@/types";

export const GET = async (
  request: NextRequest,
  { params }: { params: { fid: number } }
) => {
  const currentHeaders = headers();

  if (!verifyAuth(currentHeaders)) {
    return nonAuthHttpResponse();
  }

  console.log("[DEBUG - api/channels/[fid]] Fetching user's channels...");
  try {
    let userChannels: Array<Channel> =
      (await fetchChannelForFid(params.fid)) || [];

    return successHttpResponse(userChannels);
  } catch (err) {
    if (isApiErrorResponse(err)) {
      return apiErrorHttpResponse(err);
    } else {
      console.log(err);
      return internalServerErrorHttpResponse(err);
    }
  }
};
