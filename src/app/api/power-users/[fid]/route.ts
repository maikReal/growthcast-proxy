import {
  generateApiResponse,
  internalServerErrorHttpResponse,
  nonAuthHttpResponse,
  verifyAuth,
} from "@/utils/helpers";
import { headers } from "next/headers";
import { NextRequest } from "next/server";
import { getRecommendedUsers } from "@/utils/powerUserRecommendations";

export type Filters =
  | "all"
  | "removePowerUsers"
  | "remainActiveUsers"
  | "removeMyFollowers";

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
    console.error("[ERROR - api/power-users/[fid]] Error occured: ", error);
    return internalServerErrorHttpResponse(error);
  }
};
