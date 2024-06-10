import { NextRequest } from "next/server";
import { headers } from "next/headers";
import {
  nonAuthHttpResponse,
  internalServerErrorHttpResponse,
  verifyAuth,
  unprocessableHttpResponse,
  generateApiResponse,
} from "@/utils/helpers";
import { filterNonActiveUsers } from "@/utils/powerUserRecommendations";

export const GET = async (
  request: NextRequest,
  { params }: { params: { fid: number } }
) => {
  const currentHeaders = headers();

  if (!verifyAuth(currentHeaders)) {
    return nonAuthHttpResponse();
  }

  console.log(
    "[DEBUG - api/power-users/openrank-recommend/[fid]] Fetching user's recommended fids..."
  );
  try {
    if (!params.fid) {
      return unprocessableHttpResponse();
    }

    let userRecommendationsResponse = await fetch(
      `${process.env.NEXT_PUBLIC_OPENRANK_HOST}/scores/personalized/engagement/fids?limit=90`, //?limit=100
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify([params.fid]),
      }
    );

    if (userRecommendationsResponse.ok) {
      const { result } = await userRecommendationsResponse.json();
      console.log("data:", result);

      console.log(
        "[DEBUG - api/power-users/openrank-recommend/[fid]] Filtering non-active users..."
      );
      const onlyActiveUsers = await filterNonActiveUsers(result);

      return generateApiResponse({ status: 200 }, onlyActiveUsers);
    } else {
      return generateApiResponse(userRecommendationsResponse);
    }
  } catch (err) {
    console.error(
      "[ERROR - api/power-users/openrank-recommend/[fid]] Error occured: ",
      err
    );
    return internalServerErrorHttpResponse(err);
  }
};
