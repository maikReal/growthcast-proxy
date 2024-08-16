import {
  generateApiResponse,
  getCurrentFilePath,
  nonAuthHttpResponse,
  verifyAuth,
} from "@/utils/helpers";
import { CastsInfoManager } from "@/utils/v2/database/castsInfoManager";
import { logInfo } from "@/utils/v2/logs/sentryLogger";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

const logsFilenamePath = getCurrentFilePath();

/**
 * @swagger
 * /api/v2/casts/{fid}:
 *   get:
 *     summary: Fetch paginated casts for a user
 *     description: This endpoint fetches paginated casts for a specific user identified by their fid. Pagination is controlled via `pageToken` and `limit` query parameters
 *     parameters:
 *       - in: path
 *         name: fid
 *         required: true
 *         schema:
 *           type: integer
 *         description: The unique fid of the user whose casts are being fetched
 *       - in: query
 *         name: pageToken
 *         required: false
 *         schema:
 *           type: string
 *         description: A token representing the starting point for the next page of results. This token is encoded as base64
 *         example: "MjAyMS0wNy0wMVQxMjowMDowMFo="
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           description: The maximum number of casts to return. Defaults to 10 if not provided
 *         example: 10
 *     responses:
 *       200:
 *         description: A list of paginated casts along with pagination tokens
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 casts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       cast_text:
 *                         type: string
 *                         description: The text content of the cast
 *                         example: "This is a cast."
 *                       cast_timestamp:
 *                         type: string
 *                         format: date-time
 *                         description: The timestamp when the cast was created
 *                         example: "2023-07-15T12:00:00Z"
 *                       cast_hash:
 *                         type: string
 *                         description: The unique hash of the cast
 *                         example: "abcdef1234567890abcdef1234567890abcdef12"
 *                       cast_likes:
 *                         type: integer
 *                         description: The number of likes the cast received
 *                         example: 42
 *                       cast_replies:
 *                         type: integer
 *                         description: The number of replies to the cast
 *                         example: 3
 *                       cast_recasts:
 *                         type: integer
 *                         description: The number of recasts
 *                         example: 5
 *                 nextToken:
 *                   type: string
 *                   description: A token for fetching the next page of results, encoded as base64
 *                   example: "MjAyMS0wNy0xMlQxMjozMDowMFo="
 *                 previousToken:
 *                   type: string
 *                   description: A token for fetching the previous page of results, encoded as base64
 *                   example: "MjAyMS0wNy0wMVQxMjowMDowMFo="
 */
export const GET = async (
  request: NextRequest,
  { params }: { params: { fid: number } }
) => {
  const currentHeaders = headers();
  const { searchParams } = new URL(request.url);

  let pageToken: string | null = searchParams.get("pageToken");
  let castsLimit: string | null = searchParams.get("limit");

  let parsedCastsLimit: number | null;
  if (castsLimit) {
    parsedCastsLimit = parseInt(castsLimit);
  } else {
    parsedCastsLimit = 10;
  }

  logInfo(
    `[DEBUG - ${logsFilenamePath}] Pagintaion limit: ${parsedCastsLimit}`
  );

  console.log(`[DEBUG - ${logsFilenamePath}] Fetching casts`);

  if (!verifyAuth(currentHeaders)) {
    return nonAuthHttpResponse();
  }

  let startDate = new Date();
  let isFirstpage = true;
  let endDate = null;
  let previousToken = null;
  let nextToken = null;

  if (pageToken) {
    const decodedToken = Buffer.from(pageToken, "base64").toString("ascii");
    startDate = new Date(decodedToken);

    isFirstpage = false;
  }

  logInfo(`[DEBUG - ${logsFilenamePath}] Pagintaion start date: ${startDate}`);

  const castsInfoManager = new CastsInfoManager(params.fid);

  const paginatedCasts = await castsInfoManager.getPaginatedCasts(
    startDate,
    parsedCastsLimit
  );

  // If we don't have 'parsedCastsLimit' casts there is no next casts and the nextToken is null
  if (paginatedCasts?.length == parsedCastsLimit) {
    // Take the last cast timestamp
    endDate = paginatedCasts[paginatedCasts?.length - 1].cast_timestamp;

    nextToken = Buffer.from(`${endDate}`).toString("base64");
  }

  if (!isFirstpage) {
    previousToken = Buffer.from(`${startDate}`).toString("base64");
  }

  logInfo(
    `[DEBUG - ${logsFilenamePath}] Pagintaion previous token date: ${startDate}`
  );
  logInfo(
    `[DEBUG - ${logsFilenamePath}] Pagintaion next token date: ${endDate}`
  );

  return generateApiResponse(
    { status: 200 },
    { casts: paginatedCasts, nextToken, previousToken }
  );
};
