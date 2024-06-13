import {
  generateApiResponse,
  internalServerErrorHttpResponse,
  nonAuthHttpResponse,
  verifyAuth,
} from "@/utils/helpers";
import { headers } from "next/headers";
import axios from "axios";
import { NextRequest } from "next/server";
import { updateFidData } from "@/utils/db/dbQueiries";

export const GET = async (
  request: NextRequest,
  { params }: { params: { fid: number } }
) => {
  const currentHeaders = headers();

  if (!verifyAuth(currentHeaders)) {
    return nonAuthHttpResponse();
  }

  try {
    // Get all users casts by his FID
    const { data } = await axios.get(
      `${process.env.NEXT_PUBLIC_DOMAIN}/api/stat/${params.fid}`,
      {
        headers: {
          Referer: process.env.NEXT_PUBLIC_DOMAIN,
          Origin: process.env.NEXT_PUBLIC_DOMAIN,
        },
      }
    );

    console.log("DEBUG - api/db/update-user-stats] Received users stat");

    // Update data for a specific user in our database
    await updateFidData(params.fid, data);
    return generateApiResponse({ status: 200 }, true);
  } catch (error) {
    return internalServerErrorHttpResponse(error);
  }
};
