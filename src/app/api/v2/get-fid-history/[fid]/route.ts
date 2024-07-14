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

  const typePeriod = searchParams.get("period") as HistoricalDataPeriods | null;

  console.log(
    `[DEBUG - api/db/get-stats-by-period] Trying to get info for the following time period: ${typePeriod}`
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
      typePeriod
    );

    try {
      console.log("Fetching historical data...");
      await historialDataProcessor.fetchHistoricalData();
      // const historicalFidData = historialDataProcessor.getHistoricalData();
      const historicalFidData = historialDataProcessor.getDataWithReactions();

      // const comparisonAnanlytics =
      //   await historialDataProcessor.getComparisonAnalytics();
      // const response = await axios.get(
      //   `${process.env.NEXT_PUBLIC_NODE_ADDRESS}/v1/castsByFid?fid=${params.fid}&reverse=1&pageSize=3&nextPageToken=BqA1F2RVlF1ftb/Y4VezGBwakFwbxRxd`
      // );

      // console.log(`API Returned HTTP status ${response.status}`);
      // console.log(`Data recieved!`);
      // //   console.log(`Data: ${response}`);
      // console.log(response.data.messages);
      // return generateApiResponse({ status: 200 }, response.data);

      // console.log(historicalFidData);

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
