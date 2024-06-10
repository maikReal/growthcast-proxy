import {
  generateApiResponse,
  internalServerErrorHttpResponse,
  nonAuthHttpResponse,
  unprocessableHttpResponse,
  verifyAuth,
} from "@/utils/helpers";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const currentHeaders = headers();

  if (!verifyAuth(currentHeaders)) {
    return nonAuthHttpResponse();
  }

  const { fids } = await request.json();

  console.log("[DEBUG - api/power-users/ranks] Fetching user's ranks...");
  try {
    if (!fids) {
      return unprocessableHttpResponse();
    }

    let userRanksResponse = await fetch(
      `${process.env.NEXT_PUBLIC_OPENRANK_HOST}/scores/global/engagement/fids`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(fids),
      }
    );

    if (userRanksResponse.ok) {
      const { result } = await userRanksResponse.json();
      console.log(
        "[DEBUG - api/power-users/openrank-ranks] Fetching OpenRank user ranks..."
      );
      return generateApiResponse(userRanksResponse, result);
    } else {
      return generateApiResponse(userRanksResponse);
    }
  } catch (err) {
    console.error(
      "[ERROR - api/power-users/openrank-ranks] Error occured: ",
      err
    );
    return internalServerErrorHttpResponse(err);
  }
}
