import {
  generateApiResponse,
  getCurrentFilePath,
  internalServerErrorHttpResponse,
  nonAuthHttpResponse,
  verifyAuth,
} from "@/utils/helpers";
import { headers } from "next/headers";
import { NextRequest } from "next/server";
import { logInfo } from "@/utils/v2/logs/sentryLogger";

import {
  FarcasterHistoricalDataProcessor,
  HistoricalDataPeriods,
} from "@/utils/v2/dataProcessors/farcasterDataProcessor";

const logsFilenamePath = getCurrentFilePath();

/**
 * @swagger
 * /api/v2/fetch-fid-history/{fid}:
 *   get:
 *     summary: Fetch user's historical data for a specific period
 *     description: This endpoint fetches the user's historical data (casts) for a specific period and stores it in the PostgreSQL table "users_casts_historical_data". If the `period` parameter is not provided, the endpoint fetches data for the last year by default
 *     parameters:
 *       - in: path
 *         name: fid
 *         required: true
 *         schema:
 *           type: integer
 *         description: The unique fid of the user whose historical data is being fetched
 *       - in: query
 *         name: period
 *         required: false
 *         schema:
 *           type: integer
 *           enum: [60, 90]
 *           description: The period (in days) to fetch the data for. If not provided, the last year's data is fetched
 *         example: 60
 *     responses:
 *       200:
 *         description: Historical data was successfully fetched and stored
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 response:
 *                   type: boolean
 *                   description: Indicates whether the data fetch was successful
 *                   example: true
 *       401:
 *         description: Unauthorized if authentication fails
 *       500:
 *         description: Internal Server Error if something goes wrong during processing
 */

export const GET = async (
  request: NextRequest,
  { params }: { params: { fid: number } }
) => {
  const currentHeaders = headers();
  const { searchParams } = new URL(request.url);

  let typePeriod: string | null = searchParams.get("period");
  const parsedPeriod: HistoricalDataPeriods | null = typePeriod
    ? (parseInt(typePeriod) as HistoricalDataPeriods)
    : null;

  console.log(
    `[DEBUG - ${logsFilenamePath}] Trying to get info for the following time period: ${typePeriod}`
  );

  if (!verifyAuth(currentHeaders)) {
    return nonAuthHttpResponse();
  }

  try {
    logInfo(
      `[DEBUG - ${logsFilenamePath}] Fetching user data for period: ${typePeriod}`
    );

    const historialDataProcessor = new FarcasterHistoricalDataProcessor(
      params.fid,
      parsedPeriod
    );

    try {
      logInfo(`[DEBUG - ${logsFilenamePath}] Fetching historical data...`);
      await historialDataProcessor.fetchHistoricalData();

      return generateApiResponse({ status: 200 }, { response: true });
    } catch (e) {
      // Handle errors
      console.log("Error: ", e);
      return internalServerErrorHttpResponse(e);
    }
  } catch (err) {
    return internalServerErrorHttpResponse(err);
  }
};
