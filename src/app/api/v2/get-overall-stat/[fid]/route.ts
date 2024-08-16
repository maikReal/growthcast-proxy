import {
  generateApiResponse,
  getCurrentFilePath,
  nonAuthHttpResponse,
  verifyAuth,
} from "@/utils/helpers";
import {
  CastsInfoManager,
  CastsStats,
} from "@/utils/v2/database/castsInfoManager";
import { UserInfo, UserInfoManager } from "@/utils/v2/database/userInfoManager";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

const logsFilenamePath = getCurrentFilePath();

/**
 * @swagger
 * /api/v2/user-stats/{fid}:
 *   get:
 *     summary: Fetch overall statistics for a user and their casts
 *     description: This endpoint returns the overall statistics for a specific user, including user information and casts statistics. The data is fetched from a PostgreSQL database
 *     parameters:
 *       - in: path
 *         name: fid
 *         required: true
 *         schema:
 *           type: integer
 *         description: The unique fid of the user whose statistics are being fetched
 *     responses:
 *       200:
 *         description: Successfully fetched the user information and casts statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userInfo:
 *                   type: object
 *                   properties:
 *                     fid:
 *                       type: integer
 *                       description: The unique fid of the user
 *                       example: 14069
 *                     username:
 *                       type: string
 *                       description: The username of the user
 *                       example: "johndoe"
 *                     display_name:
 *                       type: string
 *                       description: The display name of the user
 *                       example: "John Doe"
 *                     pfp_url:
 *                       type: string
 *                       description: The URL of the user's profile picture
 *                       example: "https://example.com/pfp.jpg"
 *                     follower_count:
 *                       type: integer
 *                       description: The number of followers the user has
 *                       example: 1500
 *                     following_count:
 *                       type: integer
 *                       description: The number of users the user is following
 *                       example: 300
 *                     verifications:
 *                       type: object
 *                       description: A JSON object containing user verification details
 *                       example: { "twitter": "verified", "email": "verified" }
 *                 castsStat:
 *                   type: object
 *                   properties:
 *                     uniqueTotalCasts:
 *                       type: integer
 *                       description: The total number of unique casts by the user
 *                       example: 120
 *                     castsInfo:
 *                       type: object
 *                       description: An object containing detailed information about the user's casts
 *                       properties:
 *                         totalLikes:
 *                           type: integer
 *                           description: The total number of likes received on casts
 *                           example: 350
 *                         totalRecasts:
 *                           type: integer
 *                           description: The total number of recasts
 *                           example: 45
 *                         totalReplies:
 *                           type: integer
 *                           description: The total number of replies received
 *                           example: 60
 */

export const GET = async (
  request: NextRequest,
  { params }: { params: { fid: number } }
) => {
  const currentHeaders = headers();

  console.log(`[DEBUG - ${logsFilenamePath}] Get analytics about a user`);

  if (!verifyAuth(currentHeaders)) {
    return nonAuthHttpResponse();
  }

  const userInfoManager = new UserInfoManager(params.fid);
  const castsInfoManager = new CastsInfoManager(params.fid);

  const userInfo: UserInfo | null = await userInfoManager.getUserInfo();

  if (!userInfo) {
    return generateApiResponse({ status: 201 }, null);
  }

  const castsStat: CastsStats | null = await castsInfoManager.getCastsStat();

  if (!castsStat) {
    return generateApiResponse({ status: 201 }, null);
  }

  return generateApiResponse({ status: 200 }, { userInfo, castsStat });
};
