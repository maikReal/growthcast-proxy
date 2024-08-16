import {
  generateApiResponse,
  getCurrentFilePath,
  internalServerErrorHttpResponse,
  nonAuthHttpResponse,
  verifyAuth,
} from "@/utils/helpers";
import { headers } from "next/headers";
import { NextRequest } from "next/server";
import { getRecommendedUsers } from "@/utils/powerUserRecommendations";
import { logError } from "@/utils/v2/logs/sentryLogger";

const logsFilenamePath = getCurrentFilePath();

export type Filters =
  | "all"
  | "removePowerUsers"
  | "remainActiveUsers"
  | "removeMyFollowers";

/**
 * @swagger
 * /api/v2/recommended-users/{fid}:
 *   get:
 *     summary: Fetch recommended users based on filters
 *     description: This endpoint fetches a list of recommended users for a specific user identified by their fid. The results can be filtered and limited in number
 *     parameters:
 *       - in: path
 *         name: fid
 *         required: true
 *         schema:
 *           type: integer
 *         description: The unique fid of the user for whom recommendations are being fetched
 *       - in: query
 *         name: filter
 *         required: false
 *         schema:
 *           type: string
 *           enum: [all, removePowerUsers, remainActiveUsers, removeMyFollowers]
 *         description: The filter type to apply to the recommendations
 *         example: "all"
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *         description: The maximum number of recommendations to return. Defaults to 50 if not provided
 *         example: 50
 *     responses:
 *       200:
 *         description: Successfully fetched the recommended users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   fid:
 *                     type: integer
 *                     description: The fid of the recommended user
 *                     example: 12345
 *                   username:
 *                     type: string
 *                     description: The username of the recommended user
 *                     example: "johndoe"
 *                   display_name:
 *                     type: string
 *                     description: The display name of the recommended user
 *                     example: "John Doe"
 *                   profileUrl:
 *                     type: string
 *                     description: The URL of the recommended user's profile picture
 *                     example: "https://example.com/pfp.jpg"
 */
export const GET = async (
  request: NextRequest,
  { params }: { params: { fid: number } }
) => {
  const currentHeaders = headers();
  const { searchParams } = new URL(request.url);

  let filterType = searchParams.get("filter") as Filters | null;
  let limit: number | null = searchParams.get("limit")
    ? Number(searchParams.get("limit"))
    : 50;

  if (!verifyAuth(currentHeaders)) {
    return nonAuthHttpResponse();
  }

  try {
    let recommendations = await getRecommendedUsers(params.fid, filterType);

    if (recommendations) {
      recommendations = recommendations.slice(0, limit);
      const profileUrls = await Promise.all(
        recommendations.map(async (obj) => {
          const userData = await fetch(
            `${process.env.NEXT_PUBLIC_DOMAIN}/api/user/${obj.fid}`,
            {
              headers: {
                origin: `${process.env.NEXT_PUBLIC_DOMAIN}`,
              },
            }
          );

          if (!userData.ok) {
            return null;
          }

          const jsonUserData = await userData.json();

          return jsonUserData.user.pfp ? jsonUserData.user.pfp.url : null;
        })
      );

      // Map the profile URLs to the recommendations
      recommendations = recommendations.map((obj, index) => ({
        ...obj,
        profileUrl: profileUrls[index],
      }));
    }

    return generateApiResponse({ status: 200 }, recommendations);
  } catch (error) {
    logError(`[ERROR - ${logsFilenamePath}] Error occured: ${error}`);
    return internalServerErrorHttpResponse(error);
  }
};
