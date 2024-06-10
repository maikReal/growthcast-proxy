import {
  generateApiResponse,
  internalServerErrorHttpResponse,
  nonAuthHttpResponse,
  verifyAuth,
} from "@/utils/helpers";
import { headers } from "next/headers";
import { NextRequest } from "next/server";
import { getRecommendedUsers } from "@/utils/powerUserRecommendations";

export const GET = async (
  request: NextRequest,
  { params }: { params: { fid: number } }
) => {
  const currentHeaders = headers();

  if (!verifyAuth(currentHeaders)) {
    return nonAuthHttpResponse();
  }

  try {
    const recommendations = await getRecommendedUsers(params.fid);

    return generateApiResponse({ status: 200 }, recommendations);
  } catch (error) {
    console.error("[ERROR - api/power-users/[fid]] Error occured: ", error);
    return internalServerErrorHttpResponse(error);
  }
};
