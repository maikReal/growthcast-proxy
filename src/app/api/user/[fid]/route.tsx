import { NextRequest, NextResponse } from "next/server";
import neynarClient from "@/clients/neynar";
import { isApiErrorResponse } from "@neynar/nodejs-sdk";

export async function GET(
  request: NextRequest,
  { params }: { params: { fid: string } }
) {
  // Backward compitability
  // To support the return format of the lookupUserByFid function
  const supportOldFormat = (userData: {
    [key: string]: any;
  }): { [key: string]: any } => {
    userData["followerCount"] = userData["follower_count"];
    userData["followingCount"] = userData["following_count"];
    userData["pfp"] = { url: userData["pfp_url"] };
    userData["displayName"] = userData["display_name"];

    delete userData["follower_count"];
    delete userData["following_count"];
    delete userData["pfp_url"];
    delete userData["display_name"];

    return userData;
  };
  try {
    const fid = parseInt(params.fid);

    const { users } = await neynarClient.fetchBulkUsers([fid]);

    let userData = users ? users[0] : {};

    if (userData) {
      userData = supportOldFormat(userData);
    }

    return NextResponse.json({ user: userData }, { status: 200 });
  } catch (err) {
    console.error("ERROR: /api/user/[fid]", err);
    if (isApiErrorResponse(err)) {
      return NextResponse.json(
        { ...err.response.data },
        { status: err.response.status }
      );
    } else
      return NextResponse.json(
        { message: "Something went wrong" },
        { status: 500 }
      );
  }
}
