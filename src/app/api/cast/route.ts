import { NextRequest, NextResponse } from "next/server";
import neynarClient from "@/clients/neynar";
import { isApiErrorResponse } from "@neynar/nodejs-sdk";
import { CastEmbedLinks } from "@/types";

export async function GET(request: NextRequest) {
  const fid = (await await request.json()) as { fid: number };
  return NextResponse.json({ fid }, { status: 200 });
}

export async function POST(request: NextRequest) {
  const { signerUuid, embeds, channelId } = (await request.json()) as {
    signerUuid: string;
    embeds: Array<CastEmbedLinks>;
    channelId: string;
  };

  try {
    const { hash } = await neynarClient.publishCast(
      signerUuid,
      "Here is my thread powered by @growthcast 👇",
      {
        embeds: embeds,
        channelId: channelId,
      }
    );
    return NextResponse.json({ castHash: hash }, { status: 200 });
  } catch (err) {
    console.log("/api/cast", err);
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
