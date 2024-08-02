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
 * The method return the overall statistic for a user and his casts
 * The correct response should as the following:
 * {
 *  userInfo: {
 *    fid: number;
 *    username: string;
 *    display_name: string;
 *    pfp_url: string;
 *    follower_count: number;
 *    following_count: number;
 *    verifications: object;
 *  },
 *  castsStat: {
 *    uniqueTotalCasts: number;
 *    castsInfo: CastsInfo;
 *  }
 * }
 *
 * @param request
 * @param param1
 * @returns
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
