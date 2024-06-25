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
import { getCurrentWebhookUserFids } from "@/utils/db/dbQueiries";

export const GET = async () => {
  const currentHeaders = headers();

  if (!verifyAuth(currentHeaders)) {
    return nonAuthHttpResponse();
  }

  try {
    console.log(
      "[DEBUG - api/webhook/is-casted-today/[fid]] Getting info about the recent casts..."
    );
    const currentSubscribersList = await getCurrentWebhookUserFids();

    return generateApiResponse({ status: 200 }, currentSubscribersList);
  } catch (error) {
    console.error(error);
    return internalServerErrorHttpResponse(error);
  }
};
