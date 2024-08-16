import { NextRequest } from "next/server";
import { headers } from "next/headers";
import {
  nonAuthHttpResponse,
  internalServerErrorHttpResponse,
  apiErrorHttpResponse,
  successHttpResponse,
  verifyAuth,
  getCurrentFilePath,
} from "@/utils/helpers";
import { fetchChannelForFid } from "@/utils/neynar-requests";
import { isApiErrorResponse } from "@neynar/nodejs-sdk";
import { Channel } from "@/types";
import { logError, logInfo } from "@/utils/v2/logs/sentryLogger";

const logsFilenamePath = getCurrentFilePath();

/**
 * @swagger
 * /api/channels/{fid}:
 *   get:
 *     summary: Get the list of channels for a specific provided fid
 *     description: Get the list of channels for a specific provided fid
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: path
 *         name: fid
 *         required: true
 *         description: The fid of the user for whom to retrieve channels
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A list of channels with ID for a specific fid
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   channelName:
 *                     type: string
 *                     description: The name of the channel
 *                     example: "General"
 *                   channelId:
 *                     type: number
 *                     description: The ID of the channel
 *                     example: 123
 *               example:
 *                 - channelName: "General"
 *                   channelId: 123
 *                 - channelName: "Random"
 *                   channelId: 456
 */
export const GET = async (
  request: NextRequest,
  { params }: { params: { fid: number } }
) => {
  const currentHeaders = headers();

  if (!verifyAuth(currentHeaders)) {
    return nonAuthHttpResponse();
  }

  logInfo(`[DEBUG - ${logsFilenamePath}] Fetching user's channels...`);
  try {
    let userChannels: Array<Channel> =
      (await fetchChannelForFid(params.fid)) || [];

    return successHttpResponse(userChannels);
  } catch (err) {
    if (isApiErrorResponse(err)) {
      return apiErrorHttpResponse(err);
    } else {
      logError(`[ERROR - ${logsFilenamePath}] Fetching user's channels...`);
      return internalServerErrorHttpResponse(err);
    }
  }
};
