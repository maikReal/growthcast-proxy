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
import { isExists } from "date-fns";

const logsFilenamePath = getCurrentFilePath();

/**
 * The endpoint to get the response of we previously fetched user's historical data or not
 *
 * @param request
 * @param param1
 * @returns
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
