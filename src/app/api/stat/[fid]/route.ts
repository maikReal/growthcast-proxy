import { NextRequest } from "next/server";
import { headers } from "next/headers";
import {
  nonAuthHttpResponse,
  internalServerErrorHttpResponse,
  apiErrorHttpResponse,
  successHttpResponse,
  verifyAuth,
} from "@/utils/helpers";
import { getCastsByFid } from "@/utils/neynar-requests";
import axios from "axios";
import { User } from "@neynar/nodejs-sdk/build/neynar-api/v1";
import { isApiErrorResponse } from "@neynar/nodejs-sdk";

export const GET = async (
  request: NextRequest,
  { params }: { params: { fid: number } }
) => {
  const currentHeaders = headers();

  if (!verifyAuth(currentHeaders)) {
    return nonAuthHttpResponse();
  }

  // TODO: Change the script to use fid from a JWT token
  console.log("[DEBUG - api/stat/[fid]] Fetching a user's statistic...");
  try {
    const { data } = await axios.get<{ user: User }>(
      `${process.env.NEXT_PUBLIC_DOMAIN}/api/user/${params.fid}`
    );

    const username = data.user.username;
    console.log("[DEBUG - api/stat/[fid]] Received user's username:", username);

    let userCastsStat = await getCastsByFid(params.fid, username);

    console.log(userCastsStat);

    userCastsStat.totalFollowers = data.user.followerCount;

    return successHttpResponse(userCastsStat);
  } catch (err) {
    if (isApiErrorResponse(err)) {
      return apiErrorHttpResponse(err);
    } else {
      console.log(err);
      return internalServerErrorHttpResponse(err);
    }
  }
};
