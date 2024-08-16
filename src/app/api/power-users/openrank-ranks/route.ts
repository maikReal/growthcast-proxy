import {
  generateApiResponse,
  getCurrentFilePath,
  internalServerErrorHttpResponse,
  nonAuthHttpResponse,
  unprocessableHttpResponse,
  verifyAuth,
} from "@/utils/helpers";
import { logInfo } from "@/utils/v2/logs/sentryLogger";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

const logsFilenamePath = getCurrentFilePath();

/**
 * @swagger
 * /api/v2/power-users/ranks:
 *   post:
 *     summary: Fetch user ranks based on a list of FIDs
 *     description: This endpoint retrieves user ranks from the OpenRank system based on a provided list of FIDs (user identifiers)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: An array of user FIDs for which to fetch ranks
 *                 example: [12345, 67890, 23456]
 *     responses:
 *       200:
 *         description: Successfully fetched user ranks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       fid:
 *                         type: integer
 *                         description: The fid of the user
 *                         example: 12345
 *                       rank:
 *                         type: number
 *                         description: The rank of the user
 *                         example: 1
 */
export async function POST(request: NextRequest) {
  const currentHeaders = headers();

  if (!verifyAuth(currentHeaders)) {
    return nonAuthHttpResponse();
  }

  const { fids } = await request.json();

  logInfo(`[DEBUG - ${logsFilenamePath}] Fetching user's ranks...`);
  try {
    if (!fids) {
      return unprocessableHttpResponse();
    }

    let userRanksResponse = await fetch(
      `${process.env.NEXT_PUBLIC_OPENRANK_HOST}/scores/global/engagement/fids`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(fids),
      }
    );

    if (userRanksResponse.ok) {
      const { result } = await userRanksResponse.json();

      logInfo(`[DEBUG - ${logsFilenamePath}] Fetching OpenRank user ranks...`);
      return generateApiResponse(userRanksResponse, result);
    } else {
      return generateApiResponse(userRanksResponse);
    }
  } catch (err) {
    logInfo(`[ERROR - ${logsFilenamePath}] Error occured: ${err}`);
    return internalServerErrorHttpResponse(err);
  }
}
