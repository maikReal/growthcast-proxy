import { NextRequest } from "next/server";
import {
  generateApiResponse,
  getCurrentFilePath,
  internalServerErrorHttpResponse,
} from "@/utils/helpers";
import { DatabaseManager } from "@/utils/v2/database/databaseManager";
import { logError } from "@/utils/v2/logs/sentryLogger";

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

    return generateApiResponse(
      { status: 200 },
      { response: queryResult?.rows[0].exists }
    );
  } catch (err) {
    logError(
      `[ERROR - ${logsFilenamePath}] Error while getting info about a user: ${err}`
    );
    return internalServerErrorHttpResponse(err);
  }
}
