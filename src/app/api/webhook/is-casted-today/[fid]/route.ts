import { NextRequest } from "next/server";
import { headers } from "next/headers";
import {
  nonAuthHttpResponse,
  internalServerErrorHttpResponse,
  verifyAuth,
  generateApiResponse,
} from "@/utils/helpers";
import axios from "axios";
import {
  addRecentCastToStreaksTable,
  getNumberOfStreaks,
} from "@/utils/db/dbQueiries";
import { MyCasts } from "@/types";

export const GET = async (
  request: NextRequest,
  { params }: { params: { fid: number } }
) => {
  const isSameDate = (date1: Date, date2: Date) => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };
  const currentHeaders = headers();

  if (!verifyAuth(currentHeaders)) {
    return nonAuthHttpResponse();
  }

  try {
    console.log(
      "[DEBUG - api/webhook/is-casted-today/[fid]] Getting info about the recent casts of a user today..."
    );

    const { data } = await axios.get(
      `${process.env.NEXT_PUBLIC_DOMAIN}/api/stat/${params.fid}`,
      {
        headers: {
          Origin: process.env.NEXT_PUBLIC_DOMAIN,
        },
      }
    );

    let recentUserCast = data.casts ? data.casts[0] : null;

    if (recentUserCast) {
      recentUserCast = recentUserCast as MyCasts;

      const todayDate = new Date();

      if (isSameDate(new Date(recentUserCast.timestamp), todayDate)) {
        await addRecentCastToStreaksTable({
          user_fid: params.fid,
          timestamp: recentUserCast.timestamp,
          hash: recentUserCast.linkToCast.split("/").slice(-1)[0],
        });

        return generateApiResponse({ status: 200 }, true);
      } else {
        return generateApiResponse({ status: 200 }, false);
      }
    }
    return generateApiResponse({ status: 200 }, false);
  } catch (error) {
    console.error(error);
    return internalServerErrorHttpResponse(error);
  }
};
