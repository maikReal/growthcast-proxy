import { NextRequest } from "next/server";
import {
  generateApiResponse,
  getCurrentFilePath,
  internalServerErrorHttpResponse,
  nonAuthHttpResponse,
  verifyAuth,
} from "@/utils/helpers";
import { DatabaseManager } from "@/utils/v2/database/databaseManager";
import { logError } from "@/utils/v2/logs/sentryLogger";
import { headers } from "next/headers";

const logsFilenamePath = getCurrentFilePath();

/**
 * @swagger
 * /api/v2/user-historical-data-status/{fid}:
 *   get:
 *     summary: Check if a user's historical data has been fetched
 *     description: This endpoint checks whether a user's historical data has been previously fetched. It can also check if the data is marked as fetched based on a query parameter
 *     parameters:
 *       - in: path
 *         name: fid
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique fid of the user whose data status is being checked
 *       - in: query
 *         name: is-fetched
 *         required: false
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: A flag to indicate if the check should include whether the data is marked as fetched
 *         example: "true"
 *     responses:
 *       200:
 *         description: Successfully checked the data status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isExist:
 *                   type: boolean
 *                   description: Indicates whether the user's historical data exists in the database
 *                   example: true
 *                 isFetched:
 *                   type: boolean
 *                   description: Indicates whether the user's data is marked as fetched
 *                   example: true
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { fid: string } }
) {
  const currentHeaders = headers();
  const { searchParams } = new URL(request.url);

  let isFetchedFlag: string | null = searchParams.get("is-fetched");

  if (!verifyAuth(currentHeaders)) {
    return nonAuthHttpResponse();
  }

  try {
    const dbManager = DatabaseManager.getInstance();
    if (!dbManager.isInitialized()) {
      await dbManager.initialize();
    }

    const query = `
            SELECT EXISTS (
                SELECT 1
                FROM users_casts_historical_data
                WHERE fid = $1
            )
        `;

    const queryParams = [params.fid];

    const queryResult = await dbManager.executeQuery(query, queryParams);

    if (isFetchedFlag == "true") {
      const queryIsFetched = `
            SELECT EXISTS (
                SELECT 1
                FROM users_info
                WHERE fid = $1 and is_data_fetched = true
            )
        `;

      const queryParamsIsFetched = [params.fid];

      const queryResultIsFetched = await dbManager.executeQuery(
        queryIsFetched,
        queryParamsIsFetched
      );

      return generateApiResponse(
        { status: 200 },
        {
          isExist: queryResult?.rows[0].exists,
          isFetched: queryResultIsFetched?.rows[0].exists,
        }
      );
    }

    return generateApiResponse(
      { status: 200 },
      { isExist: queryResult?.rows[0].exists }
    );
  } catch (err) {
    logError(
      `[ERROR - ${logsFilenamePath}] Error while getting info about a user: ${err}`
    );
    return internalServerErrorHttpResponse(err);
  }
}
