import { NextRequest, NextResponse } from "next/server";
import neynarClient from "@/clients/neynar";
import { isApiErrorResponse } from "@neynar/nodejs-sdk";
import useLocalStorage from "@/hooks/use-local-storage-state";
import { GetStaticPaths, GetStaticProps } from "next";
import { UserInfo } from "@/types";
import { ScreenState, useApp } from "@/Context/AppContext";

// export const dynamic = "force-static";

export async function GET(
  request: NextRequest,
  { params }: { params: { fid: string } }
) {
  // console.log("Headers:", request.headers);
  try {
    // console.log(`User request: ${request.body}`);
    const fid = parseInt(params.fid);

    // TODO: Remove deprecated method
    const {
      result: { user },
    } = await neynarClient.lookupUserByFid(fid);
    return NextResponse.json({ user }, { status: 200 });
  } catch (err) {
    console.log("ERROR: /api/user/[fid]", err);
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
