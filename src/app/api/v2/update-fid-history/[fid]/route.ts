import {
  generateApiResponse,
  getCurrentFilePath,
  internalServerErrorHttpResponse,
  nonAuthHttpResponse,
  verifyAuth,
} from "@/utils/helpers";
import { CastsInfoManager } from "@/utils/v2/database/castsInfoManager";
import { UserInfoManager } from "@/utils/v2/database/userInfoManager";
import { FarcasterHistoricalDataProcessor } from "@/utils/v2/dataProcessors/farcasterDataProcessor";
import { logInfo } from "@/utils/v2/logs/sentryLogger";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

const logsFilenamePath = getCurrentFilePath();

/**
 * The endpoint to update a user's analytics and add recent casts to the database.
 * Taking the last fetch data date and adding casts timestamp of which is less then the last fetch data date in the table
 *
 *
 * @param request
 * @param param1
 * @returns
 */
export const GET = async (
  request: NextRequest,
  { params }: { params: { fid: number } }
) => {
  const currentHeaders = headers();

  if (!verifyAuth(currentHeaders)) {
    return nonAuthHttpResponse();
  }

  const castsInfoManager = new CastsInfoManager(params.fid);

  try {
    logInfo(
      `[DEBUG - ${logsFilenamePath}] Requesting the recent casts fetch date for the ${params.fid} FID...`
    );

    // get the last fetch date for a fid
    const lastFetchDate = await castsInfoManager.getLastFetchDateOfFidData();

    if (!lastFetchDate) {
      // It means that there is no casts for a requested fid in our database
      return generateApiResponse({ status: 201 }, false);
    } else {
      logInfo(
        `[DEBUG - ${logsFilenamePath}] Fetching recent casts for the ${params.fid} FID, timestamps of which is greater then ${lastFetchDate}...`
      );

      const farcasterDataPageSize = 50;
      const farcasterDataProcessor = new FarcasterHistoricalDataProcessor(
        params.fid,
        null,
        lastFetchDate,
        farcasterDataPageSize
      );

      await farcasterDataProcessor.fetchHistoricalData();

      const userUnfoManager = new UserInfoManager(params.fid);
      const managerResponse = await userUnfoManager.updateUserInfo();

      return generateApiResponse(
        { status: 200 },
        { response: managerResponse }
      );
    }
  } catch (err) {
    return internalServerErrorHttpResponse(err);
  }
};
