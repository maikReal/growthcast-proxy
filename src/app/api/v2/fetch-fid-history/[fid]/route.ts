import {
  generateApiResponse,
  getCurrentFilePath,
  internalServerErrorHttpResponse,
  nonAuthHttpResponse,
  unprocessableHttpResponse,
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

  if (!typePeriod) {
    return unprocessableHttpResponse();
  }

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
      console.log("Fetching historical data...");
      await historialDataProcessor.fetchHistoricalData();
      const historicalFidData = historialDataProcessor.getDataWithReactions();

      return generateApiResponse({ status: 200 }, historicalFidData);
    } catch (e) {
      // Handle errors
      console.log("Error: ", e);
      return internalServerErrorHttpResponse(e);
    }
  } catch (err) {
    return internalServerErrorHttpResponse(err);
  }
};
