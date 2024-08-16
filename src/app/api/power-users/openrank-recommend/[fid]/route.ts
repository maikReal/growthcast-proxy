import { NextRequest } from "next/server";
import { headers } from "next/headers";
import {
  nonAuthHttpResponse,
  internalServerErrorHttpResponse,
  verifyAuth,
  unprocessableHttpResponse,
  generateApiResponse,
  getCurrentFilePath,
} from "@/utils/helpers";
import { logError, logInfo } from "@/utils/v2/logs/sentryLogger";

const logsFilenamePath = getCurrentFilePath();

/**
 * @swagger
 * /api/v2/power-users/openrank-recommend/{fid}:
 *   get:
 *     summary: Fetch recommended FIDs for a user
 *     description: This endpoint retrieves a list of recommended FIDs (user identifiers) for a specific user based on their engagement. The recommendations are fetched from the OpenRank system
 *     parameters:
 *       - in: path
 *         name: fid
 *         required: true
 *         schema:
 *           type: integer
 *         description: The unique fid of the user for whom recommendations are being fetched
 *     responses:
 *       200:
 *         description: Successfully fetched the recommended FIDs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   fid:
 *                     type: integer
 *                     description: The recommended user's fid
 *                     example: 12345
 *                   engagementScore:
 *                     type: number
 *                     description: The engagement score of the recommended user
 *                     example: 87.5
 */

export const GET = async (
  request: NextRequest,
  { params }: { params: { fid: number } }
) => {
  const currentHeaders = headers();

  if (!verifyAuth(currentHeaders)) {
    return nonAuthHttpResponse();
  }

  logInfo(`[DEBUG - ${logsFilenamePath}] Fetching user's recommended fids...`);
  try {
    if (!params.fid) {
      return unprocessableHttpResponse();
    }

    let userRecommendationsResponse = await fetch(
      `${process.env.NEXT_PUBLIC_OPENRANK_HOST}/scores/personalized/engagement/fids?k=3&limit=300`, // hardcoded limit for recommendations. Could be changed
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify([params.fid]),
      }
    );

    if (userRecommendationsResponse.ok) {
      const { result } = await userRecommendationsResponse.json();

      return generateApiResponse({ status: 200 }, result);
    } else {
      return generateApiResponse(userRecommendationsResponse);
    }
  } catch (err) {
    logError(`[ERROR - ${logsFilenamePath}] Error occured: ${err}`);
    return internalServerErrorHttpResponse(err);
  }
};
