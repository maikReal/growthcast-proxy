// Get the list of all users with a Warpcast power badge

import { NextRequest } from "next/server";
import { headers } from "next/headers";
import {
  nonAuthHttpResponse,
  internalServerErrorHttpResponse,
  successHttpResponse,
  verifyAuth,
  apiErrorHttpNotAllowed,
  getCurrentFilePath,
} from "@/utils/helpers";
import { logError, logInfo } from "@/utils/v2/logs/sentryLogger";

const logsFilenamePath = getCurrentFilePath();

/**
 * @swagger
 * /api/v2/power-users/badges:
 *   get:
 *     summary: Fetch all users with a Warpcast power badge
 *     description: This endpoint fetches a list of all users who have been awarded a Warpcast power badge
 *     responses:
 *       200:
 *         description: Successfully fetched the list of users with a power badge
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   fid:
 *                     type: integer
 *                     description: The fid of the user
 *                     example: 12345
 *                   username:
 *                     type: string
 *                     description: The username of the user
 *                     example: "johndoe"
 *                   display_name:
 *                     type: string
 *                     description: The display name of the user
 *                     example: "John Doe"
 *                   badgeType:
 *                     type: string
 *                     description: The type of power badge awarded to the user
 *                     example: "Warpcast Power User"
 *                   pfpUrl:
 *                     type: string
 *                     description: The URL of the user's profile picture
 *                     example: "https://example.com/pfp.jpg"
 */
export const GET = async (request: NextRequest) => {
  const currentHeaders = headers();

  if (!verifyAuth(currentHeaders)) {
    return nonAuthHttpResponse();
  }

  logInfo(`[DEBUG - ${logsFilenamePath}] Fetching users with a power badge...`);

  try {
    const powerUsersRequestResponse = await fetch(
      `${process.env.NEXT_PUBLIC_WARPCAST_HOST}/v2/power-badge-users`
    )
      .then(async (response) => {
        if (response.ok) {
          response = await response.json();
          return successHttpResponse(response);
        } else {
          if (response.status == 500) {
            return internalServerErrorHttpResponse(response);
          }
          if (response.status == 405) {
            return apiErrorHttpNotAllowed(request.method);
          }
          if (response.status == 401) {
            return nonAuthHttpResponse();
          }
        }
      })
      .catch((error) => {
        const errorMessage = `Some issues while processing a request: ${error}`;

        logError(
          `[ERROR - ${logsFilenamePath}] Error occured: ${errorMessage}`
        );
        return internalServerErrorHttpResponse(errorMessage);
      });
    return powerUsersRequestResponse;
  } catch (error) {
    logError(`[ERROR - ${logsFilenamePath}] Error occured: ${error}`);
    return internalServerErrorHttpResponse(error);
  }
};
