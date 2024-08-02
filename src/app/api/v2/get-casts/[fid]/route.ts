import {
  generateApiResponse,
  getCurrentFilePath,
  nonAuthHttpResponse,
  verifyAuth,
} from "@/utils/helpers";
import { CastsInfoManager } from "@/utils/v2/database/castsInfoManager";
import { logInfo } from "@/utils/v2/logs/sentryLogger";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

const logsFilenamePath = getCurrentFilePath();

export const GET = async (
  request: NextRequest,
  { params }: { params: { fid: number } }
) => {
  const currentHeaders = headers();
  const { searchParams } = new URL(request.url);

  let pageToken: string | null = searchParams.get("pageToken");
  let castsLimit: string | null = searchParams.get("limit");

  let parsedCastsLimit: number | null;
  if (castsLimit) {
    parsedCastsLimit = parseInt(castsLimit);
  } else {
    parsedCastsLimit = 10;
  }

  logInfo(
    `[DEBUG - ${logsFilenamePath}] Pagintaion limit: ${parsedCastsLimit}`
  );

  console.log(`[DEBUG - ${logsFilenamePath}] Fetching casts`);

  if (!verifyAuth(currentHeaders)) {
    return nonAuthHttpResponse();
  }

  let startDate = new Date();
  let isFirstpage = true;
  let endDate = null;
  let previousToken = null;
  let nextToken = null;

  if (pageToken) {
    const decodedToken = Buffer.from(pageToken, "base64").toString("ascii");
    startDate = new Date(decodedToken);

    isFirstpage = false;
  }

  logInfo(`[DEBUG - ${logsFilenamePath}] Pagintaion start date: ${startDate}`);

  const castsInfoManager = new CastsInfoManager(params.fid);

  const paginatedCasts = await castsInfoManager.getPaginatedCasts(
    startDate,
    parsedCastsLimit
  );

  // If we don't have 'parsedCastsLimit' casts there is no next casts and the nextToken is null
  if (paginatedCasts?.length == parsedCastsLimit) {
    // Take the last cast timestamp
    endDate = paginatedCasts[paginatedCasts?.length - 1].cast_timestamp;

    nextToken = Buffer.from(`${endDate}`).toString("base64");
  }

  if (!isFirstpage) {
    previousToken = Buffer.from(`${startDate}`).toString("base64");
  }

  logInfo(
    `[DEBUG - ${logsFilenamePath}] Pagintaion previous token date: ${startDate}`
  );
  logInfo(
    `[DEBUG - ${logsFilenamePath}] Pagintaion next token date: ${endDate}`
  );

  return generateApiResponse(
    { status: 200 },
    { casts: paginatedCasts, nextToken, previousToken }
  );
};
