import { NextRequest } from "next/server";
import { headers } from "next/headers";
import {
  nonAuthHttpResponse,
  internalServerErrorHttpResponse,
  successHttpResponse,
  verifyAuth,
  generateApiResponse,
  getCurrentFilePath,
  unprocessableHttpResponse,
} from "@/utils/helpers";
import { AnalyticalManager } from "@/utils/v2/database/analyticalManager";
import { logInfo } from "@/utils/v2/logs/sentryLogger";

const logsFilenamePath = getCurrentFilePath();

export type ComparisonAnalyticsDataPeriods = 7 | 14 | 28;

/**
 * The route to get a fid's comparison analytics for last 60 days of his posts. Likes, recasts, replies,
 * and the number of casts will be included to this statisti
 *
 * @param request
 * @param params
 * @returns
 */
export const GET = async (
  request: NextRequest,
  { params }: { params: { fid: number } }
) => {
  const currentHeaders = headers();
  const { searchParams } = new URL(request.url);

  let typePeriod: string | null = searchParams.get("period");
  const parsedPeriod: ComparisonAnalyticsDataPeriods | null = typePeriod
    ? (parseInt(typePeriod) as ComparisonAnalyticsDataPeriods)
    : null;

  logInfo(
    `[DEBUG - ${logsFilenamePath}] Trying to get comparison analytics for the following time period: ${typePeriod}`
  );

  if (!parsedPeriod) {
    return unprocessableHttpResponse();
  }

  if (!verifyAuth(currentHeaders)) {
    return nonAuthHttpResponse();
  }

  try {
    const analyticalManager = new AnalyticalManager(params.fid);

    const result = await analyticalManager.getComparisonAnalytics(parsedPeriod);

    return generateApiResponse({ status: 200 }, result);
  } catch (err) {
    console.log(err);
    return internalServerErrorHttpResponse(err);
  }
};
