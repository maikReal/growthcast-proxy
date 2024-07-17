import { NextRequest, NextResponse } from "next/server";
import neynarClient from "@/clients/neynar";
import { internalServerErrorHttpResponse } from "@/utils/helpers";
import { DatabaseManager } from "@/utils/v2/database/databaseManager";

export interface UserInfo {
  fid: number;
  username: string;
  display_name: string;
  pfp_url: string;
  follower_count: number;
  following_count: number;
  verifications: object;
}

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
      dbManager.initialize();

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

      return NextResponse.json({ user: userData }, { status: 200 });
    } else {
      return NextResponse.json({ user: null }, { status: 201 });
    }
  } catch (err) {
    console.error(
      "[ERROR - api/v2/farcaster-data/fetch-bio/[fid]] Error while getting bio info about a user",
      err
    );
    return internalServerErrorHttpResponse(err);
  }
}
