import { NextRequest } from "next/server";
import { NextApiResponse } from "next";
import axios from "axios";

import {
  nonAuthHttpResponse,
  successHttpResponse,
  apiErrorHttpNotAllowed,
  internalServerErrorHttpResponse,
  verifyAuth,
  getCurrentFilePath,
} from "@/utils/helpers";

import { headers } from "next/headers";
import { postFramesThread } from "@/utils/neynar-requests";
import { ThreadCast } from "@/types";
import { logError, logInfo } from "@/utils/v2/logs/sentryLogger";

const logsFilenamePath = getCurrentFilePath();

/**
 * @swagger
 * /api/thread:
 *   post:
 *     summary: Post a new thread with a generated frame and cast
 *     description: This endpoint posts a new thread, generates a frame link, and associates it with a cast. It requires authentication
 *     consumes:
 *       - application/json
 *     produces:
 *       - application/json
 *     requestBody:
 *       description: The details required to generate a thread and associated cast
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               signerUuid:
 *                 type: string
 *                 description: The UUID of the signer.
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *               content:
 *                 type: string
 *                 description: The content to be included in the frame.
 *                 example: "This is the content for the thread."
 *               channelId:
 *                 type: number
 *                 description: The ID of the channel where the thread will be posted.
 *                 example: 42
 *     responses:
 *       200:
 *         description: Successfully created the thread and cast.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 frameLink:
 *                   type: string
 *                   description: The link to the generated frame.
 *                   example: "https://frames.example.com/frame/12345"
 *                 castHash:
 *                   type: string
 *                   description: The hash of the created cast.
 *                   example: "abcdef1234567890abcdef1234567890abcdef12"
 */
export async function POST(request: NextRequest, response: NextApiResponse) {
  if (request.method === "POST") {
    const currentHeaders = headers();

    if (!verifyAuth(currentHeaders)) {
      return nonAuthHttpResponse();
    }

    try {
      const threadInfo: ThreadCast = await request.json();

      const framePostResponse = await postFramesThread(threadInfo.content);

      logInfo(
        `[DEBUG - ${logsFilenamePath}] Frame was generated. The data: ${framePostResponse}`
      );
      logInfo(
        `[DEBUG - ${logsFilenamePath}] Generated frame link for a thread: ${framePostResponse.link}`
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
      logError(`[ERROR - ${logsFilenamePath}] An error occured: ${error}`);
      return internalServerErrorHttpResponse(error);
    }
  } else {
    response.setHeader("Allow", ["POST"]);
    return apiErrorHttpNotAllowed(request.method);
  }
}
