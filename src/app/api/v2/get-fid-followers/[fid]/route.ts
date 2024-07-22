import { NextRequest, NextResponse } from "next/server";
import neynarClient from "@/clients/neynar";
import {
  generateApiResponse,
  getCurrentFilePath,
  internalServerErrorHttpResponse,
} from "@/utils/helpers";
import { DatabaseManager } from "@/utils/v2/database/databaseManager";
import { logError } from "@/utils/v2/logs/sentryLogger";

export interface UserInfo {
  fid: number;
  username: string;
  display_name: string;
  pfp_url: string;
  follower_count: number;
  following_count: number;
  verifications: object;
}

const logsFilenamePath = getCurrentFilePath();

/**
 * The endpoint to fetch the current fid followers. It's not a historical data of followers!
 * Will be changed
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
    const fid = parseInt(params.fid);

    const { users } = await neynarClient.fetchBulkUsers([fid]);

    if (users && users.length > 0) {
      let userData = users[0] as UserInfo;

      const dbManager = DatabaseManager.getInstance();
      if (!dbManager.isInitialized()) {
        await dbManager.initialize();
      }

      const query = `
            INSERT INTO users_info (fid, username, display_name, pfp_url, followers, following, verified_address)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;

      const queryParams = [
        fid,
        userData.username,
        userData.display_name,
        userData.pfp_url,
        userData.follower_count,
        userData.following_count,
        JSON.stringify(userData.verifications),
      ];

      dbManager.executeQuery(query, queryParams);

      return generateApiResponse({ status: 200 }, { user: userData });
    } else {
      return generateApiResponse({ status: 201 }, { user: null });
    }
  } catch (err) {
    logError(
      `[ERROR - ${logsFilenamePath}] Error while getting bio info about a user: ${err}`
    );
    return internalServerErrorHttpResponse(err);
  }
}
