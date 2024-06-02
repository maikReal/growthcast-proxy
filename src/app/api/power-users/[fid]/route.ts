import {
  generateApiResponse,
  nonAuthHttpResponse,
  verifyAuth,
} from "@/utils/helpers";
import { headers } from "next/headers";
import { NextRequest } from "next/server";
import axios from "axios";
import { getRecommendedUsers } from "@/utils/powerUserRecommendations";

export const GET = async (
  request: NextRequest,
  { params }: { params: { fid: number } }
) => {
  const currentHeaders = headers();

  if (!verifyAuth(currentHeaders)) {
    return nonAuthHttpResponse();
  }

  const recommendations = await getRecommendedUsers(params.fid);

  return generateApiResponse({ status: 200 }, recommendations);

  // //   Fetch users with badges
  // const usersWithBadges = await axios.get(
  //     `${process.env.NEXT_PUBLIC_DOMAIN}/api/power-users/badges`,
  //   );

  //   // Fetch recommended users for a specific FID
  //   const personalNetworkRecommendations = await axios.get(
  //     `${process.env.NEXT_PUBLIC_DOMAIN}/api/power-users/openrank-recommend/${params.fid}`,
  //   );

  //   const personalNetworkRanks = await axios.post(
  //     `${process.env.NEXT_PUBLIC_DOMAIN}/api/power-users/openrank-ranks`,
  //     {
  //         fids: [

  //         ]
  //     }
  //   );

  // Get ranks of recommended users

  // Generate the best users to interact with
};
