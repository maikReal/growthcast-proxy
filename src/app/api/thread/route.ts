import { NextRequest } from "next/server";
import { NextApiResponse } from "next";
import axios from "axios";

import {
  nonAuthHttpResponse,
  successHttpResponse,
  apiErrorHttpNotAllowed,
  internalServerErrorHttpResponse,
  verifyAuth,
} from "@/utils/helpers";

import { headers } from "next/headers";
import { postFramesThread } from "@/utils/neynar-requests";
import { ThreadCast } from "@/types";

export async function POST(request: NextRequest, response: NextApiResponse) {
  if (request.method === "POST") {
    const currentHeaders = headers();

    if (!verifyAuth(currentHeaders)) {
      return nonAuthHttpResponse();
    }

    try {
      const threadInfo: ThreadCast = await request.json();

      const framePostResponse = await postFramesThread(threadInfo.content);

      console.log(
        "[DEBUG - api/thread] Fram generation process response: ",
        framePostResponse
      );
      console.log(
        "[DEBUG - api/thread] Generated frame link for a thread: ",
        framePostResponse.link
      );

      const {
        data: { castHash },
      } = await axios.post<{ castHash: string }>(
        `${process.env.NEXT_PUBLIC_DOMAIN}/api/cast`,
        {
          signerUuid: threadInfo.signerUuid,
          embeds: [
            {
              url: framePostResponse.link,
            },
          ],
          channelId: threadInfo.channelId,
        }
      );

      return successHttpResponse({
        frameLink: framePostResponse.link,
        castHash: castHash,
      });
    } catch (error) {
      console.error(error);
      return internalServerErrorHttpResponse(error);
    }
  } else {
    response.setHeader("Allow", ["POST"]);
    return apiErrorHttpNotAllowed(request.method);
  }
}
