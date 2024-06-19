import { NextRequest } from "next/server";
import { headers } from "next/headers";
import {
  nonAuthHttpResponse,
  internalServerErrorHttpResponse,
  verifyAuth,
  unprocessableHttpResponse,
  generateApiResponse,
} from "@/utils/helpers";

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
      `${process.env.NEXT_PUBLIC_OPENRANK_HOST}/scores/personalized/engagement/fids?k=3&limit=300`, // hardcoded limit for recommendations. Could be changed
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
      console.log("data:", result.slice(0, 5));

      return generateApiResponse({ status: 200 }, result);
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
