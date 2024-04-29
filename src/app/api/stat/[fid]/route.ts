import { NextRequest } from "next/server";
import { headers } from "next/headers";
import {
  isAuth,
  nonAuthHttpResponse,
  internalServerErrorHttpResponse,
  apiErrorHttpResponse,
  successHttpResponse,
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

  console.log("Stat API headers: ", request.headers);

  if (!isAuth(currentHeaders)) {
    return nonAuthHttpResponse();
  }

  try {
    const { data } = await axios.get<{ user: User }>(
      `${process.env.NEXT_PUBLIC_DOMAIN}/api/user/${params.fid}`
    );

    const username = data.user.username;
    console.log("Username:", username);

    let userCastsStat = await getCastsByFid(params.fid, username);

    userCastsStat.totalFollowers = data.user.followerCount; // 29; // data.user.followerCount;

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
