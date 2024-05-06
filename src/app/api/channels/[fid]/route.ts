import { NextRequest } from "next/server";
import { headers } from "next/headers";
import {
  isAuth,
  nonAuthHttpResponse,
  internalServerErrorHttpResponse,
  apiErrorHttpResponse,
  successHttpResponse,
} from "@/utils/helpers";
import { fetchChannelForFid } from "@/utils/neynar-requests";
import { isApiErrorResponse } from "@neynar/nodejs-sdk";
import { Channel } from "@/types";

export const GET = async (
  request: NextRequest,
  { params }: { params: { fid: number } }
) => {
  const currentHeaders = headers();

  //   console.log("Stat API headers: ", request.headers);

  if (!isAuth(currentHeaders)) {
    return nonAuthHttpResponse();
  }

  console.log("I am in api/channels/[fid]");
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
