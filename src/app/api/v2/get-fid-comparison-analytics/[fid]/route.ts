import { NextRequest } from "next/server";
import { headers } from "next/headers";
import {
  nonAuthHttpResponse,
  internalServerErrorHttpResponse,
  verifyAuth,
  generateApiResponse,
  getCurrentFilePath,
  unprocessableHttpResponse,
} from "@/utils/helpers";
import { AnalyticalManager } from "@/utils/v2/database/analyticalManager";
import { logError, logInfo } from "@/utils/v2/logs/sentryLogger";

const logsFilenamePath = getCurrentFilePath();

export type ComparisonAnalyticsDataPeriods = 7 | 14 | 28;

/**
 * @swagger
 * /api/v2/get-fid-comparison-analytics/{fid}:
 *   get:
 *     summary: Fetch comparison analytics for a user's posts over a specified period
 *     description: This endpoint retrieves a user's comparison analytics (likes, recasts, replies, and the number of casts) for the last 60 days of their posts. The data is fetched from a PostgreSQL database
 *     parameters:
 *       - in: path
 *         name: fid
 *         required: true
 *         schema:
 *           type: integer
 *         description: The unique fid of the user whose comparison analytics are being fetched
 *       - in: query
 *         name: period
 *         required: true
 *         schema:
 *           type: integer
 *           enum: [7, 14, 28]
 *           description: The period (in days) over which to calculate the comparison analytics
 *         example: 7
 *     responses:
 *       200:
 *         description: Successfully fetched the comparison analytics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 likes:
 *                   type: integer
 *                   description: The total number of likes within the specified period
 *                   example: 150
 *                 recasts:
 *                   type: integer
 *                   description: The total number of recasts within the specified period
 *                   example: 45
 *                 replies:
 *                   type: integer
 *                   description: The total number of replies within the specified period
 *                   example: 30
 *                 casts:
 *                   type: integer
 *                   description: The total number of casts within the specified period
 *                   example: 60
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
    logError(`[ERROR - ${logsFilenamePath}] ${err}`);
    return internalServerErrorHttpResponse(err);
  }
};
