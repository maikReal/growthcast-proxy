import {
  Period,
  getFidCasts,
  isFidDataUpdated,
  isFidExists,
} from "@/utils/db/dbQueiries";
import {
  generateApiResponse,
  internalServerErrorHttpResponse,
  nonAuthHttpResponse,
  unprocessableHttpResponse,
  verifyAuth,
} from "@/utils/helpers";
import { headers } from "next/headers";
import axios from "axios";
import { NextRequest } from "next/server";

export const GET = async (
  request: NextRequest,
  { params }: { params: { fid: number } }
) => {
  const currentHeaders = headers();
  const { searchParams } = new URL(request.url);

  let typePeriod = searchParams.get("period") as Period | null;

  console.log(
    `[DEBUG - api/db/get-stats-by-period] Trying to get info for the following time period: ${typePeriod}`
  );

  if (!typePeriod) {
    return unprocessableHttpResponse();
  }

  if (!verifyAuth(currentHeaders)) {
    return nonAuthHttpResponse();
  }

  try {
    const isFidExistsInTable = await isFidExists(params.fid);

    if (!isFidExistsInTable) {
      console.log(
        `[DEBUG - api/db/get-stats-by-period] The FID ${params.fid} is not in the database. Trying to add it...`
      );
      const isAdded = (await axios.get(
        `${process.env.NEXT_PUBLIC_DOMAIN}/api/db/add-user-stats/${params.fid}`,
        {
          headers: {
            Referer: process.env.NEXT_PUBLIC_DOMAIN,
            Origin: process.env.NEXT_PUBLIC_DOMAIN,
          },
        }
      )) as boolean;

      if (!isAdded) {
        console.log(
          `[ERROR - api/db/get-stats-by-period] The FID ${params.fid} wasn't added due to some reasons`
        );
        return generateApiResponse(
          { status: 503 },
          `Couldn't fetch info fo the provided FID: ${params.fid}`
        );
      }
      console.log(
        `[DEBUG - api/db/get-stats-by-period] The FID ${params.fid} was added to the database`
      );
    } else {
      console.log(
        `[DEBUG - api/db/get-stats-by-period] The FID ${params.fid} is in the database. Checking the recent data updates...`
      );

      // Check if data for a specific FID was updated at least 30 mins ago
      const isFidUpdated = await isFidDataUpdated(params.fid);

      if (isFidUpdated) {
        console.log(
          `[DEBUG - api/db/get-stats-by-period] The FID ${params.fid} data wasn't updated before. Trying to update data...`
        );
        const wasUpdated = (await axios.get(
          `${process.env.NEXT_PUBLIC_DOMAIN}/api/db/update-user-stats/${params.fid}`,
          {
            headers: {
              Referer: process.env.NEXT_PUBLIC_DOMAIN,
              Origin: process.env.NEXT_PUBLIC_DOMAIN,
            },
          }
        )) as boolean;

        if (!wasUpdated) {
          console.log(
            `[ERROR - api/db/get-stats-by-period] The FID ${params.fid} data wasn't updated due to some reasons`
          );
          return generateApiResponse(
            { status: 201 },
            `Wasn't able to update users data for the fid: ${params.fid}`
          );
        }
        console.log(
          `[DEBUG - api/db/get-stats-by-period] The FID ${params.fid} data was updated`
        );
      }
    }

    const response = await getFidCasts(params.fid, typePeriod);

    return generateApiResponse({ status: 200 }, response);
  } catch (err) {
    return internalServerErrorHttpResponse(err);
  }
};
