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
 * The endpoint to fetch user's data for a specific period
 * All data is inserting to "users_casts_historical_data" table on PostgreSQL
 * The following data is added to the table:
 * - fid
 * - cast_text
 * - cast_timestamp
 * - cast_hash
 * - cast_likes
 * - cast_replies
 * - cast_recasts
 *
 * URL params:
 * - [OPTIONAL] period: null | 60 | 90
 *
 * If the period param wasn't provided, the endpoint will fetch data for the last year
 *
 * Request example:
 * ```
 *  http://localhost:3000/api/v2/fetch-fid-history/14069
 * ```
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

      return generateApiResponse({ status: 200 }, true);
    } catch (e) {
      // Handle errors
      console.log("Error: ", e);
      return internalServerErrorHttpResponse(e);
    }
  } catch (err) {
    return internalServerErrorHttpResponse(err);
  }
};
