import {
  generateApiResponse,
  internalServerErrorHttpResponse,
  nonAuthHttpResponse,
  verifyAuth,
} from "@/utils/helpers";
import { headers } from "next/headers";
import axios from "axios";
import { NextRequest } from "next/server";
import { addFidCasts } from "@/utils/db/dbQueiries";

export const GET = async (
  request: NextRequest,
  { params }: { params: { fid: number } }
) => {
  const currentHeaders = headers();

  console.log("DEBUG - api/db/add-user-stats] Request info", request);
  console.log("DEBUG - api/db/add-user-stats] Request info", currentHeaders);

  if (!verifyAuth(currentHeaders)) {
    return nonAuthHttpResponse();
  }

  console.log("DEBUG - api/db/add-user-stats] Getting data using /api/stat...");
  try {
    // Get all users casts by his FID
    const { data } = await axios.get(
      `${process.env.NEXT_PUBLIC_DOMAIN}/api/stat/${params.fid}`
    );

    console.log("DEBUG - api/db/add-user-stats] Received users stat");
    data["fid"] = params.fid;
    // Add all castst to our database
    await addFidCasts(data);
    return generateApiResponse({ status: 200 }, true);
  } catch (error) {
    return internalServerErrorHttpResponse(error);
  }
};
