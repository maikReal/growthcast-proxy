import { NextRequest } from "next/server";
import { headers } from "next/headers";
import {
  nonAuthHttpResponse,
  internalServerErrorHttpResponse,
  apiErrorHttpResponse,
  successHttpResponse,
  verifyAuth,
  generateApiResponse,
} from "@/utils/helpers";
import { getCastsByFid } from "@/utils/neynar-requests";
import axios from "axios";
import { User } from "@neynar/nodejs-sdk/build/neynar-api/v1";
import { isApiErrorResponse } from "@neynar/nodejs-sdk";
import { getNumberOfStreaks } from "@/utils/db/dbQueiries";

export const GET = async (
  request: NextRequest,
  { params }: { params: { fid: number } }
) => {
  const currentHeaders = headers();

  if (!verifyAuth(currentHeaders)) {
    return nonAuthHttpResponse();
  }

  try {
    console.log(
      "[DEBUG - api/webhook/get-fid-streaks/[fid]] Getting info about the recent casts..."
    );
    const streaksNumber = await getNumberOfStreaks(params.fid);

    return generateApiResponse({ status: 200 }, { streaks: streaksNumber });
  } catch (error) {
    console.error(error);
    return internalServerErrorHttpResponse(error);
  }
};
