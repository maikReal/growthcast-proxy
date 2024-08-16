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
 * @swagger
 * /api/v2/update-user-analytics/{fid}:
 *   get:
 *     summary: Update user analytics and add recent casts to the database
 *     description: This endpoint updates a user's analytics by fetching recent casts that have timestamps greater than the last fetch date stored in the database. The new data is then added to the database
 *     parameters:
 *       - in: path
 *         name: fid
 *         required: true
 *         schema:
 *           type: integer
 *         description: The unique fid of the user whose analytics are being updated
 *     responses:
 *       200:
 *         description: Successfully updated the user's analytics and added recent casts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 response:
 *                   type: boolean
 *                   description: Indicates whether the user's information was successfully updated
 *                   example: true
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
