import { Period, getFidCasts, isUserExists } from "@/utils/db/dbQueiries";
import {
  generateApiResponse,
  internalServerErrorHttpResponse,
  nonAuthHttpResponse,
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

  if (!typePeriod) {
    typePeriod = "all";
  }

  if (!verifyAuth(currentHeaders)) {
    return nonAuthHttpResponse();
  }

  try {
    const isFidExists = await isUserExists(params.fid);

    if (!isFidExists) {
      const isAdded = (await axios.get(
        `${process.env.NEXT_PUBLIC_DOMAIN}/api/db/add-user-stats/${params.fid}`
      )) as boolean;

      if (!isAdded) {
        return generateApiResponse(
          { status: 503 },
          `Couldn't fetch info fo the provided FID: ${params.fid}`
        );
      }
    }

    const response = await getFidCasts(params.fid, typePeriod);

    return generateApiResponse({ status: 200 }, response);
  } catch (err) {
    return internalServerErrorHttpResponse(err);
  }
};
