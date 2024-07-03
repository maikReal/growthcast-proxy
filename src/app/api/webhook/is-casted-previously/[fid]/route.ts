import { NextRequest } from "next/server";
import { headers } from "next/headers";
import {
  nonAuthHttpResponse,
  internalServerErrorHttpResponse,
  verifyAuth,
  generateApiResponse,
} from "@/utils/helpers";
import axios from "axios";
import { addMultiplePreviousStreaks } from "@/utils/db/dbQueiries";
import { MyCasts } from "@/types";
import {
  PreviousConsecutiveCastsProps,
  getMaxPreviousConsecutiveWeeksForFid,
} from "@/utils/streaks-post-processing";

export const GET = async (
  request: NextRequest,
  { params }: { params: { fid: number } }
) => {
  const currentHeaders = headers();

  if (!verifyAuth(currentHeaders)) {
    return nonAuthHttpResponse();
  }

  try {
    console.log(
      "[DEBUG - api/webhook/is-casted-previously/[fid]] Getting info about the casts of a user for past weeks..."
    );

    const { data } = await axios.get(
      `${process.env.NEXT_PUBLIC_DOMAIN}/api/db/get-stats-by-period/${params.fid}?period=all`,
      {
        headers: {
          Origin: process.env.NEXT_PUBLIC_DOMAIN,
        },
      }
    );

    let previousUserCasts = data.currentCasts ? data.currentCasts : null;

    if (previousUserCasts) {
      previousUserCasts = previousUserCasts as MyCasts;

      const previousConsecutiveCasts: PreviousConsecutiveCastsProps =
        getMaxPreviousConsecutiveWeeksForFid(previousUserCasts);

      await addMultiplePreviousStreaks(
        previousConsecutiveCasts.consideredCasts.map((cast, _) => ({
          user_fid: params.fid,
          timestamp: cast.timestamp,
          hash: cast.linkToCast.split("/").slice(-1)[0],
        }))
      );

      return generateApiResponse({ status: 200 }, true);
    }
    return generateApiResponse({ status: 200 }, false);
  } catch (error) {
    console.error(error);
    return internalServerErrorHttpResponse(error);
  }
};
