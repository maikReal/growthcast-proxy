import { NextRequest } from "next/server";
import { headers } from "next/headers";
import {
  nonAuthHttpResponse,
  internalServerErrorHttpResponse,
  verifyAuth,
  generateApiResponse,
} from "@/utils/helpers";
import { getNumberOfStreaks } from "@/utils/db/dbQueiries";

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
      "[DEBUG - api/webhook/get-fid-streaks/[fid]] Getting info about the recent casts..."
    );
    const streaksNumber = await getNumberOfStreaks(params.fid);

    return generateApiResponse({ status: 200 }, streaksNumber);
  } catch (error) {
    console.error(error);
    return internalServerErrorHttpResponse(error);
  }
};
